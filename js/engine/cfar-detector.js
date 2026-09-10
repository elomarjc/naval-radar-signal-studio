/**
 * Constant False Alarm Rate (CFAR) Detection Engine
 * Implements sliding window adaptive detection algorithms:
 * - CA-CFAR (Cell-Averaging)
 * - GO-CFAR (Greatest-Of, for clutter edges)
 * - OS-CFAR (Order-Statistic, prevents target masking)
 */
export class CFARDetector {
    constructor(numBins = 256) {
        this.numBins = numBins;
        this.refCells = 32; // 16 leading + 16 lagging
        this.guardCells = 4; // 2 leading + 2 lagging
        this.pfa = 1e-5; // Target probability of false alarm

        // Mode: 'CA', 'GO', 'OS'
        this.mode = 'OS';
        this.osRankK = 24; // 24th order statistic of 32 cells

        // Threshold multiplier alpha
        this.updateAlpha();
    }

    setMode(newMode) {
        if (['CA', 'GO', 'OS'].includes(newMode)) {
            this.mode = newMode;
            this.updateAlpha();
        }
    }

    setPfa(pfa) {
        this.pfa = pfa;
        this.updateAlpha();
    }

    updateAlpha() {
        let N = this.refCells;
        if (this.mode === 'CA') {
            // CA-CFAR formula: alpha = N * (Pfa^(-1/N) - 1)
            this.alpha = N * (Math.pow(this.pfa, -1.0 / N) - 1.0);
        } else if (this.mode === 'GO') {
            this.alpha = (N / 2) * (Math.pow(this.pfa / 2, -2.0 / N) - 1.0);
        } else if (this.mode === 'OS') {
            // Approximated OS-CFAR multiplier for k = 3N/4
            this.alpha = 2.8 * Math.log10(1.0 / this.pfa);
        }
    }

    /**
     * Process 1D range profile through CFAR sliding window
     * @param {Float32Array} profile - Raw video return amplitude
     * @returns {{thresholds: Float32Array, detections: Uint8Array}}
     */
    detect(profile) {
        let thresholds = new Float32Array(this.numBins);
        let detections = new Uint8Array(this.numBins);

        let halfRef = this.refCells / 2;
        let halfGuard = this.guardCells / 2;
        let windowTotal = halfRef + halfGuard;

        for (let i = 0; i < this.numBins; i++) {
            let cutVal = profile[i];

            // Extract leading and lagging reference cells (excluding guard cells)
            let leadCells = [];
            let lagCells = [];

            for (let j = 1; j <= halfRef; j++) {
                let leadIdx = i - halfGuard - j;
                if (leadIdx >= 0) leadCells.push(profile[leadIdx]);

                let lagIdx = i + halfGuard + j;
                if (lagIdx < this.numBins) lagCells.push(profile[lagIdx]);
            }

            let allRef = leadCells.concat(lagCells);
            if (allRef.length < 8) {
                // Fallback boundary handling
                thresholds[i] = cutVal * 1.5;
                continue;
            }

            let noiseEstimate = 0.0;

            if (this.mode === 'CA') {
                let sum = allRef.reduce((a, b) => a + b, 0);
                noiseEstimate = sum / allRef.length;
            } else if (this.mode === 'GO') {
                let meanLead = leadCells.length > 0 ? leadCells.reduce((a, b) => a + b, 0) / leadCells.length : 0;
                let meanLag = lagCells.length > 0 ? lagCells.reduce((a, b) => a + b, 0) / lagCells.length : 0;
                noiseEstimate = Math.max(meanLead, meanLag);
            } else if (this.mode === 'OS') {
                allRef.sort((a, b) => a - b);
                let rankIdx = Math.min(allRef.length - 1, Math.floor(allRef.length * (this.osRankK / this.refCells)));
                noiseEstimate = allRef[rankIdx];
            }

            let T = this.alpha * noiseEstimate;
            thresholds[i] = T;

            if (cutVal > T) {
                detections[i] = 1;
            }
        }

        return { thresholds, detections };
    }
}
