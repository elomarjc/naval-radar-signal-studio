/**
 * CFAR Comparison & Performance Benchmark View
 * Evaluates CA-CFAR, GO-CFAR, and OS-CFAR in multi-target interference
 * and clutter boundary environments.
 */
export class CFARCompareView {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
    }

    render(activeMode) {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#0a0e17';
        ctx.fillRect(0, 0, width, height);

        const algorithms = [
            { name: 'CA-CFAR (Cell-Averaging)', code: 'CA', loss: '0.8 dB', masking: 'High (Masks close targets)', clutterEdge: 'False Alarms at boundaries' },
            { name: 'GO-CFAR (Greatest-Of)', code: 'GO', loss: '1.2 dB', masking: 'Severe Masking', clutterEdge: 'Protected against step edges' },
            { name: 'OS-CFAR (Order-Statistic)', code: 'OS', loss: '1.5 dB', masking: 'Robust (No masking)', clutterEdge: 'Optimal in multi-target clutter' }
        ];

        let colH = 45;
        algorithms.forEach((algo, idx) => {
            let y = 15 + idx * 55;
            let isSelected = (algo.code === activeMode);

            // Card background
            ctx.fillStyle = isSelected ? '#16233b' : '#0d1524';
            ctx.strokeStyle = isSelected ? '#38bdf8' : '#1e293b';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.fillRect(12, y, width - 24, colH);
            ctx.strokeRect(12, y, width - 24, colH);

            // Name
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillStyle = isSelected ? '#38bdf8' : '#f8fafc';
            ctx.textAlign = 'left';
            ctx.fillText(algo.name, 22, y + 18);

            // Metrics
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(`CFAR Loss: ${algo.loss} | Masking: ${algo.masking}`, 22, y + 34);

            // Status Badge
            ctx.textAlign = 'right';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillStyle = isSelected ? '#10b981' : '#64748b';
            ctx.fillText(isSelected ? 'ACTIVE DETECTOR' : 'SELECTABLE', width - 22, y + 26);
        });
    }
}
