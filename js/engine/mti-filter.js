/**
 * 3-Pulse Moving Target Indication (MTI) Doppler Filter
 * Pulse-to-pulse canceler: y[n] = x[n] - 2*x[n-1] + x[n-2]
 * Transfer function H(z) = (1 - z^-1)^2
 * Cancels stationary land mass and slow sea clutter while passing moving vessels.
 */
export class MTIFilter {
    constructor(numBins = 256, numAzimuthSlices = 360) {
        this.numBins = numBins;
        this.numSlices = numAzimuthSlices;

        // History frames: slice x bin
        this.frameZ1 = new Array(this.numSlices).fill(null).map(() => new Float32Array(numBins));
        this.frameZ2 = new Array(this.numSlices).fill(null).map(() => new Float32Array(numBins));
    }

    /**
     * Process 1D range profile at specific azimuth
     */
    process(profile, azimuthDeg) {
        let sliceIdx = Math.floor(azimuthDeg) % this.numSlices;
        let z1 = this.frameZ1[sliceIdx];
        let z2 = this.frameZ2[sliceIdx];

        let filtered = new Float32Array(this.numBins);

        for (let r = 0; r < this.numBins; r++) {
            let x0 = profile[r];
            let x1 = z1[r];
            let x2 = z2[r];

            // 3-Pulse canceler difference
            let diff = Math.abs(x0 - 2.0 * x1 + x2);
            filtered[r] = diff;

            // Shift history
            z2[r] = x1;
            z1[r] = x0;
        }

        return filtered;
    }

    reset() {
        for (let i = 0; i < this.numSlices; i++) {
            this.frameZ1[i].fill(0);
            this.frameZ2[i].fill(0);
        }
    }
}
