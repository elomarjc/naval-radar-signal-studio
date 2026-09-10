import test from 'node:test';
import assert from 'node:assert/strict';

import { RadarPhysics } from '../js/engine/radar-physics.js';
import { SeaClutterGenerator } from '../js/engine/sea-clutter.js';
import { CFARDetector } from '../js/engine/cfar-detector.js';
import { MTIFilter } from '../js/engine/mti-filter.js';

test('CFARDetector: target detection and threshold generation across modes', () => {
    const cfar = new CFARDetector(256);

    // Create synthetic noise floor + single sharp target at bin 120
    const profile = new Float32Array(256).fill(0.1);
    profile[120] = 2.5; // Strong target echo (25x noise floor)

    // Test CA-CFAR
    cfar.setMode('CA');
    const resCA = cfar.detect(profile);
    assert.equal(resCA.detections[120], 1, 'CA-CFAR must detect target at bin 120');

    // Test OS-CFAR
    cfar.setMode('OS');
    const resOS = cfar.detect(profile);
    assert.equal(resOS.detections[120], 1, 'OS-CFAR must detect target at bin 120');
});

test('CFARDetector: OS-CFAR target masking resilience with adjacent interfering target', () => {
    const cfar = new CFARDetector(256);

    // Two adjacent targets at bin 100 and bin 106
    const profile = new Float32Array(256).fill(0.08);
    profile[100] = 2.0;
    profile[106] = 1.8;

    // OS-CFAR should detect both targets because it sorts out the outlier from reference cells
    cfar.setMode('OS');
    const res = cfar.detect(profile);
    assert.equal(res.detections[100], 1, 'OS-CFAR should detect first target at bin 100');
    assert.equal(res.detections[106], 1, 'OS-CFAR should detect second target at bin 106 without masking');
});

test('MTIFilter: 3-pulse canceler eliminates stationary DC clutter', () => {
    const mti = new MTIFilter(256, 360);

    // Feed constant stationary profile (DC clutter) across 3 consecutive scans at azimuth 45 deg
    const staticProfile = new Float32Array(256).fill(0.75);

    let out1 = mti.process(staticProfile, 45.0);
    let out2 = mti.process(staticProfile, 45.0);
    let out3 = mti.process(staticProfile, 45.0);

    // On 3rd pulse: y[n] = x[n] - 2*x[n-1] + x[n-2] = 0.75 - 1.5 + 0.75 = 0.0
    assert.ok(Math.abs(out3[50]) < 1e-5, `Stationary clutter should be cancelled to 0, got ${out3[50]}`);
});

test('RadarPhysics: target motion and beam profile synthesis', () => {
    const radar = new RadarPhysics();
    const clutter = new SeaClutterGenerator();
    const mti = new MTIFilter(256, 360);

    const initialRange = radar.targets[0].rangeNm;
    radar.step(1.0); // 1 second step
    const newRange = radar.targets[0].rangeNm;

    assert.ok(Math.abs(newRange - initialRange) > 0, 'Target position should update with velocity');

    // Beam profile generation
    radar.azimuthDeg = 45.0; // Pointing at RHIB
    const beam = radar.getBeamProfile(clutter, mti);
    assert.equal(beam.length, 256, 'Beam profile should contain 256 range bins');
    assert.ok(!Number.isNaN(beam[100]), 'Beam data should be valid numbers');
});
