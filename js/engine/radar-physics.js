/**
 * Naval Surveillance Radar Physical Signal Model
 * Models pulse radar transmission, target return scattering, and range-azimuth mapping:
 * - Max instrumented range Rmax = 24 NM (44.4 km)
 * - Pulse Repetition Frequency PRF = 3000 Hz
 * - Range bins N = 256
 * - Antenna rotation speed = 30 RPM (0.5 rev/sec)
 * - Beamwidth = 1.4 degrees
 */
export class RadarPhysics {
    constructor() {
        this.maxRangeNm = 24.0;
        this.numRangeBins = 256;
        this.azimuthDeg = 0.0; // Current antenna pointing angle
        this.rotationSpeedRpm = 30.0;

        // Maritime Targets
        this.targets = [
            { id: 'T1', name: 'Fast RHIB', rangeNm: 7.2, bearingDeg: 45.0, rcsM2: 1.5, speedKnots: 28.0, headingDeg: 190.0 },
            { id: 'T2', name: 'Stealth USV', rangeNm: 11.5, bearingDeg: 125.0, rcsM2: 0.5, speedKnots: 35.0, headingDeg: 310.0 },
            { id: 'T3', name: 'Cargo Vessel', rangeNm: 16.8, bearingDeg: 285.0, rcsM2: 2500.0, speedKnots: 14.0, headingDeg: 60.0 }
        ];

        // Sea clutter parameters
        this.seaState = 4; // Douglas Sea State 4 (Moderate)
        this.mtiEnabled = true;
    }

    /**
     * Advance antenna rotation and target positions by dt
     */
    step(dt) {
        // Rotate antenna
        let degPerSec = (this.rotationSpeedRpm * 360.0) / 60.0;
        this.azimuthDeg = (this.azimuthDeg + degPerSec * dt) % 360.0;

        // Move targets
        this.targets.forEach(t => {
            let speedNmPerSec = (t.speedKnots / 3600.0);
            let rad = (t.headingDeg - 90) * (Math.PI / 180);
            let dx = speedNmPerSec * dt * Math.cos(rad);
            let dy = speedNmPerSec * dt * Math.sin(rad);

            // Convert polar to cartesian and back
            let curRad = (t.bearingDeg - 90) * (Math.PI / 180);
            let x = t.rangeNm * Math.cos(curRad) + dx;
            let y = t.rangeNm * Math.sin(curRad) + dy;

            t.rangeNm = Math.hypot(x, y);
            let newAngle = Math.atan2(y, x) * (180 / Math.PI) + 90;
            if (newAngle < 0) newAngle += 360;
            t.bearingDeg = newAngle;
        });
    }

    /**
     * Generate 1D raw video amplitude return vector along current beam azimuth
     */
    getBeamProfile(clutterGen, mtiFilter) {
        let profile = new Float32Array(this.numRangeBins);

        // 1. Thermal receiver noise floor (~0.05)
        for (let r = 0; r < this.numRangeBins; r++) {
            profile[r] = 0.04 + Math.random() * 0.03;
        }

        // 2. Add statistical non-Gaussian Sea Clutter
        clutterGen.addSeaClutter(profile, this.azimuthDeg, this.seaState, this.maxRangeNm);

        // 3. Add Coastline echo (Land mass between 200° and 250°)
        if (this.azimuthDeg >= 200 && this.azimuthDeg <= 250) {
            let landStartBin = Math.floor((6.0 / this.maxRangeNm) * this.numRangeBins);
            let landEndBin = Math.floor((14.0 / this.maxRangeNm) * this.numRangeBins);
            for (let r = landStartBin; r <= landEndBin; r++) {
                profile[r] += 0.45 + Math.random() * 0.35;
            }
        }

        // 4. Inject Target returns if within antenna beamwidth (1.4°)
        const beamwidth = 1.6;
        this.targets.forEach(t => {
            let angleDiff = Math.abs(this.azimuthDeg - t.bearingDeg);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            if (angleDiff <= beamwidth) {
                let bin = Math.floor((t.rangeNm / this.maxRangeNm) * this.numRangeBins);
                if (bin >= 0 && bin < this.numRangeBins) {
                    // Radar equation: Echo power ~ RCS / R^4
                    let rangeKm = t.rangeNm * 1.852;
                    let rcsFactor = Math.pow(t.rcsM2, 0.35);
                    let rangeLoss = 1.0 / Math.pow(Math.max(2.0, rangeKm), 0.7);
                    let echoAmp = 1.8 * rcsFactor * rangeLoss;

                    // Beam antenna two-way pattern sinc^2
                    let beamPattern = Math.cos((angleDiff / beamwidth) * (Math.PI / 2)) ** 2;
                    let totalTargetEcho = echoAmp * beamPattern;

                    // Add echo across 2 range bins
                    profile[bin] += totalTargetEcho;
                    if (bin + 1 < this.numRangeBins) profile[bin + 1] += totalTargetEcho * 0.6;
                }
            }
        });

        // 5. Apply MTI Doppler Filter (if enabled)
        if (this.mtiEnabled) {
            return mtiFilter.process(profile, this.azimuthDeg);
        }

        return profile;
    }
}
