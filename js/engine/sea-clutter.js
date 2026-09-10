/**
 * Statistical Maritime Sea Clutter Generator
 * Models spiky non-Rayleigh radar returns using Weibull distribution:
 * PDF(x) = (c/b) * (x/b)^(c-1) * exp(-(x/b)^c)
 * Shape parameter c = 1.35 models non-Gaussian sea swell spikes.
 */
export class SeaClutterGenerator {
    constructor() {
        this.shapeC = 1.35; // Weibull shape parameter
        this.scaleB = 0.18; // Weibull scale parameter
    }

    /**
     * Sample random variable from Weibull distribution via inverse CDF
     */
    sampleWeibull(b, c) {
        let u = Math.max(1e-6, 1.0 - Math.random());
        return b * Math.pow(-Math.log(u), 1.0 / c);
    }

    /**
     * Add distance-attenuated sea clutter across all range bins
     */
    addSeaClutter(profile, azimuthDeg, seaState, maxRangeNm) {
        let numBins = profile.length;
        let seaStateScale = (seaState / 4.0);

        // Wind swell direction (waves coming from 270° West)
        let windAngle = 270.0;
        let diff = Math.abs(azimuthDeg - windAngle);
        if (diff > 180) diff = 360 - diff;
        // Looking into the wind produces higher clutter backscatter
        let upwindFactor = 1.0 + 0.6 * Math.cos(diff * Math.PI / 180.0);

        for (let r = 0; r < numBins; r++) {
            let rangeNm = (r / numBins) * maxRangeNm;
            if (rangeNm < 0.5) continue; // Inside radar blind zone / circulator

            // Sea clutter radar equation power drop-off: ~ 1 / R^3
            let rangeLoss = 1.0 / Math.pow(rangeNm, 0.9);
            let b = this.scaleB * seaStateScale * upwindFactor * rangeLoss;

            let clutterSample = this.sampleWeibull(b, this.shapeC);
            profile[r] += clutterSample;
        }
    }
}
