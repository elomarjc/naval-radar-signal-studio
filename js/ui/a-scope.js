/**
 * A-Scope Oscilloscope Display
 * Plots raw video return amplitude vs range bins along the current radar beam
 * with dynamic CFAR adaptive threshold and detection markers.
 */
export class AScope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    render(profile, thresholds, detections, maxRangeNm) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, width, height);

        const padLeft = 45;
        const padRight = 15;
        const padTop = 15;
        const padBottom = 25;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        const numBins = profile.length;
        const mapX = (bin) => padLeft + (bin / (numBins - 1)) * plotW;
        const mapY = (amp) => (padTop + plotH) - Math.min(plotH, (amp / 1.5) * plotH);

        // Grid lines
        ctx.strokeStyle = '#141d2e';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter, monospace';
        ctx.fillStyle = '#4a5b78';
        ctx.textAlign = 'right';

        [0, 0.5, 1.0, 1.5].forEach(val => {
            let py = mapY(val);
            ctx.beginPath();
            ctx.moveTo(padLeft, py);
            ctx.lineTo(padLeft + plotW, py);
            ctx.stroke();
            ctx.fillText(`${val.toFixed(1)}V`, padLeft - 6, py + 3);
        });

        // Range Labels (0 to 24 NM)
        ctx.textAlign = 'center';
        [0, 6, 12, 18, 24].forEach(rng => {
            let bin = Math.floor((rng / maxRangeNm) * numBins);
            let px = mapX(Math.min(numBins - 1, bin));
            ctx.beginPath();
            ctx.moveTo(px, padTop);
            ctx.lineTo(px, padTop + plotH);
            ctx.stroke();
            ctx.fillText(`${rng} NM`, px, padTop + plotH + 15);
        });

        // 1. Raw Video Echo Trace (Emerald Green)
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.6;
        for (let i = 0; i < numBins; i++) {
            let px = mapX(i);
            let py = mapY(profile[i]);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // 2. CFAR Adaptive Threshold Curve (Dashed Amber)
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.0;
        for (let i = 0; i < numBins; i++) {
            let px = mapX(i);
            let py = mapY(thresholds[i]);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Target Detection Flags (Red Pips)
        ctx.fillStyle = '#ef4444';
        for (let i = 0; i < numBins; i++) {
            if (detections[i]) {
                let px = mapX(i);
                let py = mapY(profile[i]);
                ctx.beginPath();
                ctx.arc(px, py, 4, 0, 2 * Math.PI);
                ctx.fill();

                // Pip label
                let distNm = (i / numBins) * maxRangeNm;
                ctx.font = 'bold 9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`${distNm.toFixed(1)} NM`, px, py - 8);
            }
        }

        // Header & Legend
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.fillText('A-Scope Raw Video vs. Adaptive CFAR Threshold', padLeft + 10, padTop + 14);

        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#10b981';
        ctx.fillText('— Raw Echo Signal', padLeft + 270, padTop + 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillText('-- CFAR Threshold T', padLeft + 390, padTop + 14);
    }
}
