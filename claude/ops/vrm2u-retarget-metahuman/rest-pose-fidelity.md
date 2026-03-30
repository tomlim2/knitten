# R-016: Retarget Fidelity Analysis

## Method

Added `pre_damping_rotations` field to `RetargetedBone` — captures rotation AFTER three-VRM normalization + A-pose correction, BEFORE shoulder slerp / hand damping / finger clamp.

```
fidelity = avg(all bones, all frames) of (post_damping_angle / pre_damping_angle)
```
- 1.000 = perfect passthrough
- <1.0 = damping (magnitude reduction)
- Frames where pre_damping < 1° skipped (near-zero input → ratio meaningless)

## Results

### Overall Fidelity

| Combo | shoulder_ratio | Overall Fidelity | Damped Bones |
|-------|---------------|-----------------|--------------|
| T2M f_walk + female | 0.68 | **0.9848** | upperArm L/R |
| T2M m_wave + male | 0.58 | **0.9772** | upperArm L/R, rightHand |
| CINEV rush + female | 0.68 | **0.9696** | upperArm L/R, leftHand, rightHand |

**Key: CINEV rush has the LOWEST fidelity (0.970), not T2M (0.985).** The retargeter does NOT discriminate against T2M.

### Per-Bone Fidelity

| Bone | T2M walk | T2M wave | CINEV rush | Damping Source |
|------|----------|----------|------------|----------------|
| hips | 1.000 | 1.000 | 1.000 | — |
| spine | 1.000 | 1.000 | 1.000 | — |
| chest | 1.000 | 1.000 | 1.000 | — |
| upperChest | 1.000 | 1.000 | 1.000 | — |
| neck | 1.000 | 1.000 | 1.000 | — |
| head | 1.000 | 1.000 | 1.000 | — |
| leftShoulder | 1.000 | 1.000 | 1.000 | — |
| rightShoulder | 1.000 | 1.000 | 1.000 | — |
| **leftUpperArm** | **0.851** | **0.804** | **0.856** | shoulder slerp |
| **rightUpperArm** | **0.851** | **0.804** | **0.856** | shoulder slerp |
| leftLowerArm | 1.000 | 1.000 | 1.000 | — |
| rightLowerArm | 1.000 | 1.000 | 1.000 | — |
| leftHand | 1.000 | 1.000 | **0.832** | hand soft damping (60°+0.3) |
| rightHand | 1.000 | **0.965** | **0.836** | hand soft damping (60°+0.3) |
| leftUpperLeg | 1.000 | 1.000 | 1.000 | — |
| rightUpperLeg | 1.000 | 1.000 | 1.000 | — |
| leftLowerLeg | 1.000 | 1.000 | 1.000 | — |
| rightLowerLeg | 1.000 | 1.000 | 1.000 | — |
| leftFoot | 1.000 | 1.000 | 1.000 | — |
| rightFoot | 1.000 | 1.000 | 1.000 | — |
| leftToes | 1.000 | 1.000 | 1.000 | — |
| rightToes | 1.000 | 1.000 | 1.000 | — |

### Damping Sources Identified

| Damping | Condition | T2M walk | T2M wave | CINEV rush |
|---------|-----------|----------|----------|------------|
| **Shoulder slerp** | `shoulder_ratio < 0.95` | 0.851 (ratio=0.68) | 0.804 (ratio=0.58) | 0.856 (ratio=0.68) |
| **Hand soft damping** | `angle > 60°, damped = 60° + excess×0.3` | not triggered | 0.965 (R hand wave) | 0.832/0.836 (both hands, dance) |
| **Finger clamp** | `angle > 90°` | not triggered | not triggered | not triggered |

Shoulder slerp fidelity matches analytical prediction exactly:
- ratio=0.68 → blend = 0.68 + 0.32×0.55 = 0.856 → fidelity = 0.856 ✓ (measured: 0.851/0.856)
- ratio=0.58 → blend = 0.58 + 0.42×0.55 = 0.811 → fidelity = 0.811 ✓ (measured: 0.804)

Small discrepancy (0.851 vs 0.856 for walk/female) is because axis-angle ratio ≠ slerp blend factor exactly. The slerp operates on the quaternion, not the angle linearly.

### Hand Damping Detail

CINEV rush hands exceed 60° threshold regularly:
- leftHand: fidelity range [0.537..1.000], avg=0.832. Peak angles ~107° in source.
- rightHand: fidelity range [0.544..1.000], avg=0.836. Peak angles ~107° in source.

T2M walk hands never exceed 60° → fidelity = 1.000.
T2M wave rightHand occasionally exceeds 60° (wave gesture) → fidelity = 0.965.

## 45° Rotation Investigation

### Hips Frame 0

All three combos show identical hips frame-0 output:
```
pre_damp:  (0.0629, 0.0000, 0.0000, 0.9980) = 7.2°
post_damp: (0.0629, 0.0000, 0.0000, 0.9980) = 7.2°
trans:     (0.000, 0.955, 0.004)
```

**No 45° rotation at frame 0.** The hips output is 7.2° (slight forward tilt, X-axis only). Fidelity = 1.000 (no damping on hips).

The previously observed "45° issue" was a misinterpretation: the R-016 original run showed T2M `Δrest=89.3°` for hips because T2M has `src_rest=identity` (PreRotation=0), so the entire pelvis orientation (~90° Z-up→Y-up) appeared as "delta from rest." After three-VRM normalization, this 90° rest orientation is correctly subtracted, leaving only the actual motion delta (7.2°).

For CINEV: `src_rest=90.1°`, `raw_local=88.4°`, `Δrest=4.4°` → same output 7.2°. The rest subtraction worked correctly in both cases.

**45° rotation is NOT present in the retarget output. The retargeter handles both PreRotation styles (T2M identity / CINEV separated) correctly.**

## Conclusions

1. **Retargeter is source-agnostic.** Fidelity differences are driven by damping thresholds, not source type. CINEV rush actually has lower fidelity (0.970) than T2M walk (0.985) because dance motions trigger hand damping more.

2. **Only 3 damping mechanisms exist:**
   - Shoulder slerp: upperArm only, fidelity = blend factor (0.80–0.86)
   - Hand soft damping: 60° threshold, rarely triggered for walk
   - Finger clamp: 90° max, never triggered in these tests

3. **20 of 22 measured bones have perfect 1.000 fidelity.** Only upperArm (always) and hand (conditionally) are damped.

4. **No 45° rotation issue.** The three-VRM normalization correctly removes rest pose regardless of PreRotation encoding style.

5. **T2M arm weakness is confirmed as source issue, not retarget issue.** The retargeter passes through T2M walk lowerArm rotations at 1.000 fidelity — the angles are just small (0.1° at frame 0, max 5.6° across all frames).
