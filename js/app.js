import { RadarPhysics } from './engine/radar-physics.js';
import { SeaClutterGenerator } from './engine/sea-clutter.js';
import { CFARDetector } from './engine/cfar-detector.js';
import { MTIFilter } from './engine/mti-filter.js';

import { PPIScope } from './ui/ppi-scope.js';
import { AScope } from './ui/a-scope.js';
import { CFARCompareView } from './ui/cfar-compare-view.js';

class NavalRadarStudioApp {
    constructor() {
        this.radar = new RadarPhysics();
        this.clutter = new SeaClutterGenerator();
        this.cfar = new CFARDetector(this.radar.numRangeBins);
        this.mti = new MTIFilter(this.radar.numRangeBins, 360);

        this.ppiScope = new PPIScope('ppiCanvas');
        this.aScope = new AScope('aScopeCanvas');
        this.compareView = new CFARCompareView('compareCanvas');

        this.initUI();
        this.startLoop();
    }

    initUI() {
        // CFAR Mode Buttons
        const modeButtons = document.querySelectorAll('.mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                let mode = btn.getAttribute('data-mode');
                this.cfar.setMode(mode);
                this.compareView.render(this.cfar.mode);
            });
        });

        // Sea State Slider
        const seaSlider = document.getElementById('seaSlider');
        const seaVal = document.getElementById('seaVal');
        if (seaSlider) {
            seaSlider.addEventListener('input', (e) => {
                let s = parseInt(e.target.value, 10);
                this.radar.seaState = s;
                if (seaVal) seaVal.innerText = `State ${s}`;
            });
        }

        // Pfa Slider
        const pfaSlider = document.getElementById('pfaSlider');
        const pfaVal = document.getElementById('pfaVal');
        if (pfaSlider) {
            pfaSlider.addEventListener('input', (e) => {
                let exp = parseFloat(e.target.value);
                let pfa = Math.pow(10, -exp);
                this.cfar.setPfa(pfa);
                if (pfaVal) pfaVal.innerText = `1e-${exp.toFixed(0)}`;
            });
        }

        // MTI Toggle
        const mtiToggle = document.getElementById('mtiToggle');
        if (mtiToggle) {
            mtiToggle.addEventListener('change', (e) => {
                this.radar.mtiEnabled = e.target.checked;
            });
        }

        // Add Target Button
        const addTargetBtn = document.getElementById('addTargetBtn');
        if (addTargetBtn) {
            addTargetBtn.addEventListener('click', () => {
                let id = `T${this.radar.targets.length + 1}`;
                let newR = 5.0 + Math.random() * 14.0;
                let newB = Math.random() * 360;
                this.radar.targets.push({
                    id,
                    name: `Contact ${id}`,
                    rangeNm: newR,
                    bearingDeg: newB,
                    rcsM2: 0.8 + Math.random() * 2.0,
                    speedKnots: 20 + Math.random() * 20,
                    headingDeg: Math.random() * 360
                });
            });
        }
    }

    startLoop() {
        let lastTime = performance.now();

        const loop = (time) => {
            let dt = Math.min(0.05, (time - lastTime) / 1000.0);
            lastTime = time;

            // 1. Advance radar rotation and maritime targets
            this.radar.step(dt);

            // 2. Generate raw video amplitude return along beam
            let profile = this.radar.getBeamProfile(this.clutter, this.mti);

            // 3. Adaptive CFAR detection
            let { thresholds, detections } = this.cfar.detect(profile);

            // 4. Update PPI Phosphor persistence buffer
            this.ppiScope.drawBeamSweep(this.radar.azimuthDeg, detections, this.radar.maxRangeNm);

            // 5. Render Scopes
            this.ppiScope.render(this.radar);
            this.aScope.render(profile, thresholds, detections, this.radar.maxRangeNm);
            this.compareView.render(this.cfar.mode);

            this.updateTelemetryDOM(detections);

            requestAnimationFrame(loop);
        };

        requestAnimationFrame(loop);
    }

    updateTelemetryDOM(detections) {
        let detCount = 0;
        for (let i = 0; i < detections.length; i++) {
            if (detections[i]) detCount++;
        }

        let azElem = document.getElementById('telemAzimuth');
        if (azElem) azElem.innerText = `${this.radar.azimuthDeg.toFixed(1)}°`;

        let modeElem = document.getElementById('telemCfar');
        if (modeElem) modeElem.innerText = `${this.cfar.mode}-CFAR (Pfa: ${this.cfar.pfa.toExponential(0)})`;

        let mtiElem = document.getElementById('telemMti');
        if (mtiElem) {
            mtiElem.innerText = this.radar.mtiEnabled ? '3-PULSE MTI ACTIVE' : 'RAW DOPPLER BYPASS';
            mtiElem.className = this.radar.mtiEnabled ? 'status-pill success' : 'status-pill warning';
        }

        let hitsElem = document.getElementById('telemHits');
        if (hitsElem) hitsElem.innerText = `${this.radar.targets.length} Tracked Targets`;
    }
}

function initNavalApp() {
    try {
        console.log("Starting NavalRadarStudioApp...");
        window.app = new NavalRadarStudioApp();
        console.log("NavalRadarStudioApp started successfully!");
    } catch (err) {
        console.error("CRASH IN NAVAL APP:", err);
        const errDiv = document.createElement('div');
        errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:red;color:white;padding:20px;z-index:999999;font-size:16px;white-space:pre-wrap;';
        errDiv.textContent = 'FATAL ERROR:\n' + err.stack;
        document.body.appendChild(errDiv);
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initNavalApp);
} else {
    initNavalApp();
}


// ==========================================
// MOBILE FLOATING HUD & DRAWER CONTROLLER
// ==========================================
(function initMobileFloatingHUD() {
  const drawer = document.getElementById('telemetryDrawer');
  const backdrop = document.getElementById('telemetryBackdrop');
  const btnSettings = document.getElementById('btn-hud-settings');
  const btnTrigger = document.getElementById('btn-trigger-controls-drawer');
  const btnClose = document.getElementById('btn-close-telemetry');
  const btnFullscreen = document.getElementById('btn-hud-fullscreen');
  const btnMenu = document.getElementById('btn-hud-menu');

  function openDrawer() {
    if (drawer) drawer.classList.add('open');
    if (backdrop) backdrop.classList.add('active');
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  if (btnSettings) btnSettings.addEventListener('click', openDrawer);
  if (btnTrigger) btnTrigger.addEventListener('click', openDrawer);
  if (btnClose) btnClose.addEventListener('click', closeDrawer);
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  if (btnMenu) {
    btnMenu.addEventListener('click', () => {
      const guideBtn = document.getElementById('guideBtn') || document.getElementById('btnTourLauncher');
      if (guideBtn) guideBtn.click();
    });
  }

  // Cross-platform Universal Fullscreen
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            document.body.classList.toggle('immersive-fullscreen');
          });
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else {
          document.body.classList.toggle('immersive-fullscreen');
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        document.body.classList.remove('immersive-fullscreen');
      }
    });
  }

  // Left Rail: Douglas Sea State (1 to 6)
  const vSea = document.getElementById('slider-sea-vertical');
  const dSea = document.getElementById('seaSlider');
  const valSea = document.getElementById('hud-sea-val');
  const fillSea = document.getElementById('rail-fill-sea');

  function updateSeaHUD(val) {
    const num = parseInt(val, 10);
    if (valSea) valSea.textContent = 'State ' + num;
    if (fillSea) {
      // Range is 1 to 6 (span = 5)
      const pct = Math.max(0, Math.min(100, ((num - 1) / 5) * 100));
      fillSea.style.height = pct + '%';
    }
    if (vSea && parseInt(vSea.value, 10) !== num) {
      vSea.value = num;
    }
  }

  if (vSea && dSea) {
    vSea.min = dSea.min || '1';
    vSea.max = dSea.max || '6';
    vSea.step = dSea.step || '1';
    vSea.value = dSea.value;
    updateSeaHUD(dSea.value);

    vSea.addEventListener('input', (e) => {
      dSea.value = e.target.value;
      dSea.dispatchEvent(new Event('input', { bubbles: true }));
      updateSeaHUD(e.target.value);
    });

    dSea.addEventListener('input', (e) => {
      updateSeaHUD(e.target.value);
    });
  }

  // Right Rail: Pfa Threshold (3 to 7 -> 1e-3 to 1e-7)
  const vPfa = document.getElementById('slider-pfa-vertical');
  const dPfa = document.getElementById('pfaSlider');
  const valPfa = document.getElementById('hud-pfa-val');
  const fillPfa = document.getElementById('rail-fill-pfa');

  function updatePfaHUD(val) {
    const num = parseInt(val, 10);
    if (valPfa) valPfa.textContent = '1e-' + num;
    if (fillPfa) {
      // Range is 3 to 7 (span = 4)
      const pct = Math.max(0, Math.min(100, ((num - 3) / 4) * 100));
      fillPfa.style.height = pct + '%';
    }
    if (vPfa && parseInt(vPfa.value, 10) !== num) {
      vPfa.value = num;
    }
  }

  if (vPfa && dPfa) {
    vPfa.min = dPfa.min || '3';
    vPfa.max = dPfa.max || '7';
    vPfa.step = dPfa.step || '1';
    vPfa.value = dPfa.value;
    updatePfaHUD(dPfa.value);

    vPfa.addEventListener('input', (e) => {
      dPfa.value = e.target.value;
      dPfa.dispatchEvent(new Event('input', { bubbles: true }));
      updatePfaHUD(e.target.value);
    });

    dPfa.addEventListener('input', (e) => {
      updatePfaHUD(e.target.value);
    });
  }

  // Transport and Play/Pause
  let isSimPaused = false;
  const railPauseBtn = document.getElementById('btn-rail-pause');
  const transPauseBtn = document.getElementById('btn-transport-pause');
  const pauseIcon1 = document.getElementById('rail-pause-icon');
  const pauseIcon2 = document.getElementById('hud-pause-icon');
  const pauseText = document.getElementById('hud-pause-text');

  function toggleSimPause() {
    isSimPaused = !isSimPaused;
    const symbol = isSimPaused ? '▶' : '⏸';
    const text = isSimPaused ? 'RESUME' : 'PAUSE';
    if (pauseIcon1) pauseIcon1.textContent = symbol;
    if (pauseIcon2) pauseIcon2.textContent = symbol;
    if (pauseText) pauseText.textContent = text;
    if (transPauseBtn) transPauseBtn.classList.toggle('active', isSimPaused);
  }

  if (railPauseBtn) railPauseBtn.addEventListener('click', toggleSimPause);
  if (transPauseBtn) transPauseBtn.addEventListener('click', toggleSimPause);

  const stepBack = document.getElementById('btn-transport-step-back');
  const stepFwd = document.getElementById('btn-transport-step-fwd');
  if (stepBack && dSea) {
    stepBack.addEventListener('click', () => {
      let v = Math.max(1, parseInt(dSea.value, 10) - 1);
      dSea.value = v;
      dSea.dispatchEvent(new Event('input', { bubbles: true }));
      updateSeaHUD(v);
    });
  }
  if (stepFwd && dSea) {
    stepFwd.addEventListener('click', () => {
      let v = Math.min(6, parseInt(dSea.value, 10) + 1);
      dSea.value = v;
      dSea.dispatchEvent(new Event('input', { bubbles: true }));
      updateSeaHUD(v);
    });
  }

  // Mode Cards
  const modeScan = document.getElementById('hud-mode-scan');
  const modeTarget = document.getElementById('hud-mode-target');
  const modeMti = document.getElementById('hud-mode-mti');
  const modeRough = document.getElementById('hud-mode-rough');
  const addTargetBtn = document.getElementById('addTargetBtn');
  const mtiToggle = document.getElementById('mtiToggle');
  const modeIndicator = document.getElementById('hud-mode-indicator');
  const statusSummary = document.getElementById('hud-status-summary');

  function clearActiveModes() {
    [modeScan, modeTarget, modeMti, modeRough].forEach(m => m && m.classList.remove('active'));
  }

  if (modeScan) {
    modeScan.addEventListener('click', () => {
      clearActiveModes();
      modeScan.classList.add('active');
      if (dSea) {
        dSea.value = '3';
        dSea.dispatchEvent(new Event('input', { bubbles: true }));
        updateSeaHUD('3');
      }
      if (dPfa) {
        dPfa.value = '5';
        dPfa.dispatchEvent(new Event('input', { bubbles: true }));
        updatePfaHUD('5');
      }
      const osBtn = document.querySelector('.mode-btn[data-mode="OS"]');
      if (osBtn) osBtn.click();
      if (modeIndicator) modeIndicator.textContent = 'OS-CFAR';
      if (statusSummary) statusSummary.textContent = '360° PPI SWEEP';
    });
  }

  if (modeTarget) {
    modeTarget.addEventListener('click', () => {
      clearActiveModes();
      modeTarget.classList.add('active');
      if (addTargetBtn) addTargetBtn.click();
      if (modeIndicator) modeIndicator.textContent = 'NEW TARGET';
      if (statusSummary) statusSummary.textContent = 'SWERLING MODEL';
      setTimeout(() => {
        if (modeTarget.classList.contains('active')) {
          modeScan.classList.add('active');
          modeTarget.classList.remove('active');
        }
      }, 3000);
    });
  }

  function updateMtiState() {
    if (mtiToggle && modeMti) {
      modeMti.classList.toggle('active', mtiToggle.checked);
      if (mtiToggle.checked) {
        if (modeIndicator) modeIndicator.textContent = 'MTI DOPPLER';
        if (statusSummary) statusSummary.textContent = 'BLIND SPEED FILTER';
      }
    }
  }

  if (mtiToggle) {
    mtiToggle.addEventListener('change', updateMtiState);
    updateMtiState();
  }

  if (modeMti) {
    modeMti.addEventListener('click', () => {
      if (mtiToggle) {
        mtiToggle.checked = !mtiToggle.checked;
        mtiToggle.dispatchEvent(new Event('change', { bubbles: true }));
        updateMtiState();
      }
    });
  }

  if (modeRough) {
    modeRough.addEventListener('click', () => {
      clearActiveModes();
      modeRough.classList.add('active');
      if (dSea) {
        dSea.value = '6';
        dSea.dispatchEvent(new Event('input', { bubbles: true }));
        updateSeaHUD('6');
      }
      if (modeIndicator) modeIndicator.textContent = 'ROUGH SEAS';
      if (statusSummary) statusSummary.textContent = 'K-CLUTTER ν=0.5';
    });
  }
})();
