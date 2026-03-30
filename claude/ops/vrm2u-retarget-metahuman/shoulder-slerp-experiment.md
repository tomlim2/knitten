# R-013: Shoulder Slerp Tuning Experiment

## Setup

- VRM: vroid_f_xiao.vrm (female VRoid)
- FBX configs: cinev_male_body.json (T2M), cinev_female_body.json (CINEV)
- Shoulder ratios: walk=0.58, wave=0.56, rush=0.68
- Measured: retargeted upperArm rotation range (degrees)

## Experiments

### Formula Definitions

| ID | Formula | Description |
|----|---------|-------------|
| E-0 | `sh + (1-sh)*0.55` | Current (baseline) |
| E-1 | `1.0` | Slerp disabled |
| E-2 | `sh + (1-sh)*0.75` | Weak correction |
| E-3 | `if sh > 0.8 { E-0 } else { 1.0 }` | Ratio bypass (narrow skip) |
| E-4 | `max(0.90, E-0)` | Min blend guarantee |

### Blend Values

| ID | blend(male 0.58) | blend(wave 0.56) | blend(female 0.68) |
|----|------------------|------------------|---------------------|
| E-0 | 0.811 | 0.802 | 0.856 |
| E-1 | 1.000 | 1.000 | 1.000 |
| E-2 | 0.895 | 0.890 | 0.920 |
| E-3 | 1.000 | 1.000 | 1.000 |
| E-4 | 0.900 | 0.900 | 0.900 |

Note: E-3 bypasses slerp for all three because all ratios < 0.8.

## Results: upperArm Rotation Range (degrees)

### T2M Walk (male, shoulder=0.58)

| ID | L range | R range | L maxΔ | R maxΔ |
|----|---------|---------|--------|--------|
| E-0 | 5.7° | 4.9° | 2.10° | 1.49° |
| E-1 | 7.1° | 6.0° | 2.54° | 1.80° |
| E-2 | 6.3° | 5.4° | 2.30° | 1.63° |
| E-3 | 7.1° | 6.0° | 2.54° | 1.80° |
| E-4 | 6.4° | 5.4° | 2.32° | 1.64° |

### T2M Wave (male, shoulder=0.56)

| ID | L range | R range | L maxΔ | R maxΔ |
|----|---------|---------|--------|--------|
| E-0 | 4.9° | 74.0° | 1.99° | 16.32° |
| E-1 | 6.1° | 92.1° | 2.42° | 19.94° |
| E-2 | 5.4° | 82.1° | 2.18° | 17.95° |
| E-3 | 6.1° | 92.1° | 2.42° | 19.94° |
| E-4 | 5.5° | 82.9° | 2.20° | 18.12° |

### CINEV Rush (female, shoulder=0.68)

| ID | L range | R range | L maxΔ | R maxΔ |
|----|---------|---------|--------|--------|
| E-0 | 106.7° | 93.1° | 33.62° | 37.64° |
| E-1 | 124.6° | 108.7° | 38.27° | 43.48° |
| E-2 | 114.7° | 100.0° | 35.74° | 40.26° |
| E-3 | 124.6° | 108.7° | 38.27° | 43.48° |
| E-4 | 112.2° | 97.8° | 35.08° | 39.44° |

## Analysis

### Range Improvement vs Baseline (E-0)

| Experiment | T2M walk L | T2M wave R | CINEV rush L | CINEV rush R |
|------------|-----------|-----------|-------------|-------------|
| E-1 (off) | +24.6% | +24.5% | +16.8% | +16.8% |
| E-2 (0.75) | +10.5% | +10.9% | +7.5% | +7.4% |
| E-3 (bypass) | +24.6% | +24.5% | +16.8% | +16.8% |
| E-4 (min 0.9) | +12.3% | +12.0% | +5.2% | +5.0% |

### Key Observations

1. **T2M walk: marginal improvement across all experiments.** Even E-1 (no slerp) only gains ~1.4° on upperArm (5.7→7.1°). The source motion is simply too weak (max 2.54° per frame). No slerp tuning can fix this.

2. **T2M wave R arm: meaningful improvement.** E-1 gains 18.1° (74.0→92.1°). E-2/E-4 gain ~8-9°. This is the wave's active arm — the slerp was genuinely damping useful motion.

3. **CINEV rush: no regression in any experiment.** Even E-1 (no slerp) shows healthy 108-124° ranges. The original slerp was cutting ~15-18° from the dance, which is conservative but acceptable.

4. **E-3 = E-1** for all test cases because all shoulder_ratios < 0.8. The 0.8 threshold is too high — needs 0.6 or lower to be useful.

5. **lowerArm/hand unaffected** by all experiments (slerp only applies to upperArm).

### Regression Risk

| Experiment | Regression Risk | Notes |
|------------|----------------|-------|
| E-1 | Low-Medium | No damping = more expressive but potential body clipping on very narrow VRMs |
| E-2 | Low | Gentle correction, preserves 89-92% of motion |
| E-3 | Same as E-1 | Threshold too high, effectively disables slerp |
| E-4 | Low | Caps max damping at 10%, safe for all ratios |

## Recommendation

**E-4 (`max(0.90, current)`) is the best option.**

Reasoning:
- Limits max damping to 10% regardless of shoulder_ratio
- At ratio=0.58 (male): blend goes from 0.811 → 0.900 (only 10% damping vs 19%)
- At ratio=0.68 (female): blend goes from 0.856 → 0.900 (same 10% cap)
- At ratio=0.90+: no change (current formula already > 0.90)
- Preserves the penetration-prevention intent for moderately narrow VRMs
- Doesn't completely disable compensation (unlike E-1/E-3)
- Wave R arm gains 12% motion (74→82.9°), meaningful improvement
- CINEV rush only loses ~5% compensation (well within acceptable range)

### Implementation

```rust
// retargeter.rs line 661-663
let raw_blend = self.shoulder_ratio + (1.0 - self.shoulder_ratio) * 0.55;
let blend = raw_blend.max(0.90);
result = Quat::IDENTITY.slerp(result, blend);
```

### Caveats

The walk motion improvement is minimal (5.7→6.4°). Walk arm weakness is fundamentally a T2M source quality issue, not a retarget issue. For real improvement, need either:
- Better T2M prompts ("walk with expressive arm swing")
- Post-process arm motion amplification (multiply upperArm delta by 2-3x)
- Procedural arm swing overlay
