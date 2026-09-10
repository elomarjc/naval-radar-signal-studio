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

window.addEventListener('DOMContentLoaded', () => {
    window.app = new NavalRadarStudioApp();
});
