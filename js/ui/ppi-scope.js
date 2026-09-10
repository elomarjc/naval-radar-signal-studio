/**
 * Plan Position Indicator (PPI) Naval Radar Scope
 * Renders 360-degree rotating sweep, green phosphor persistence decay,
 * range rings, detected target tracks, and coastline echoes.
 */
export class PPIScope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Phosphor persistence buffer
        this.persistenceCanvas = document.createElement('canvas');
        this.persistenceCanvas.width = this.canvas.width;
        this.persistenceCanvas.height = this.canvas.height;
        this.pCtx = this.persistenceCanvas.getContext('2d');
        this.pCtx.fillStyle = '#060911';
        this.pCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw current beam returns into persistence buffer
     */
    drawBeamSweep(azimuthDeg, detections, maxRangeNm) {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const maxR = Math.min(cx, cy) - 24;

        let rad = (azimuthDeg - 90) * (Math.PI / 180.0);
        let numBins = detections.length;

        // Draw radial beam line in persistence buffer
        for (let r = 0; r < numBins; r++) {
            if (detections[r]) {
                let dist = (r / numBins) * maxR;
                let px = cx + dist * Math.cos(rad);
                let py = cy + dist * Math.sin(rad);

                this.pCtx.fillStyle = '#10b981';
                this.pCtx.beginPath();
                this.pCtx.arc(px, py, 2.5, 0, 2 * Math.PI);
                this.pCtx.fill();
            }
        }

        // Phosphor decay: fade previous sweeps by drawing translucent black overlay
        this.pCtx.fillStyle = 'rgba(6, 9, 17, 0.025)';
        this.pCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render(radarPhysics) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const maxR = Math.min(cx, cy) - 24;

        // 1. Draw Phosphor Buffer
        ctx.drawImage(this.persistenceCanvas, 0, 0);

        // 2. Concentric Range Rings (6, 12, 18, 24 NM)
        const rings = [6, 12, 18, 24];
        ctx.strokeStyle = '#14233a';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter, monospace';
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';

        rings.forEach(rng => {
            let r = (rng / radarPhysics.maxRangeNm) * maxR;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fillText(`${rng} NM`, cx + 4, cy - r + 10);
        });

        // 3. Radial Bearing Lines (every 30 deg)
        for (let deg = 0; deg < 360; deg += 30) {
            let rad = (deg - 90) * (Math.PI / 180.0);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(rad), cy + maxR * Math.sin(rad));
            ctx.strokeStyle = (deg % 90 === 0) ? '#1f3454' : '#0e1d30';
            ctx.stroke();

            // Heading degrees label
            if (deg % 90 === 0) {
                let lbl = deg === 0 ? '000° (N)' : deg === 90 ? '090° (E)' : deg === 180 ? '180° (S)' : '270° (W)';
                let lx = cx + (maxR + 14) * Math.cos(rad);
                let ly = cy + (maxR + 14) * Math.sin(rad);
                ctx.fillStyle = '#64748b';
                ctx.textAlign = 'center';
                ctx.fillText(lbl, lx, ly + 3);
            }
        }

        // 4. Rotating Sweep Line (Bright green scan line)
        let sweepRad = (radarPhysics.azimuthDeg - 90) * (Math.PI / 180.0);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + maxR * Math.cos(sweepRad), cy + maxR * Math.sin(sweepRad));
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 5. Target Track Overlays
        radarPhysics.targets.forEach(t => {
            let tRad = (t.bearingDeg - 90) * (Math.PI / 180.0);
            let dist = (t.rangeNm / radarPhysics.maxRangeNm) * maxR;
            let tx = cx + dist * Math.cos(tRad);
            let ty = cy + dist * Math.sin(tRad);

            // Target Symbol (Yellow Diamond)
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.8;
            ctx.strokeRect(tx - 4, ty - 4, 8, 8);

            // Target Label
            ctx.fillStyle = '#f8fafc';
            ctx.font = 'bold 9px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${t.name} [${t.speedKnots}kt]`, tx + 8, ty + 3);
        });

        // Legend / Header
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'left';
        ctx.fillText(`SCANTER PPI SCOPE | Bearing: ${radarPhysics.azimuthDeg.toFixed(1)}°`, 12, 20);

        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Sea State: ${radarPhysics.seaState} | Range: 24 NM`, 12, 34);
    }
}
