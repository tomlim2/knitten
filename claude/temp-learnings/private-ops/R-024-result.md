# R-024 Fix right arm rotation flip in retarget — Result

**Branch:** `feat/blender-source-type` (bevy-vrm)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
33 passed, 0 failed
```

## cargo clippy

```
0 warnings (both cinev_retarget and bevy-vrm)
```

---

## Root Cause

**`detect_apose()` corrections were applied to VRM 1.0 models where the three-vrm formula already handles rest pose correctly.** This caused double-correction with 73-78° offsets on upperArm bones.

### Diagnostic data (vroid_1x_f_xiao.vrm + T2M walk)

```
[APOSE] leftShoulder  angle=5.8°   — small, shoulder direction close
[APOSE] leftUpperArm  angle=78.4°  — HUGE, A-pose arm drop
[APOSE] rightShoulder angle=5.0°   — small, symmetric with left
[APOSE] rightUpperArm angle=73.3°  — HUGE, A-pose arm drop
```

The upperArm corrections represent the full MetaHuman A-pose arm drop (arms at ~45° from horizontal → T-pose horizontal). For VRM 1.0, the three-vrm formula already converts this via:
```
result = dst_rest_local × dst_rest_global⁻¹ × normalized × dst_rest_global
```

Applying detect_apose 73-78° on top of this creates the observed ~140-210° rot_d in the F5 debug.

### Why L/R asymmetry in F5 debug

The F5 debug compares VRM world rotation vs FBX world rotation (Y-up). The apose_correction post-multiplies the three-vrm result. Due to the quaternion algebra of `result * correction`, the same 78° correction produces different final world rotations depending on the sign of the bone's rest orientation:
- Left arm: correction direction partially aligns with animation, final rot_d appears smaller
- Right arm: correction direction opposes the bone orientation, final rot_d ≈ 170-210°

The correction is equally wrong for both sides, but the F5 metric (world rotation angle difference) measures it differently because of the opposite bone orientations.

---

## Fix

**One-line change in `retargeter.rs:compute_rotations()`:**

```rust
// Before (applied for ALL versions):
if let Some(correction) = apose_correction {
    result = (result * correction).normalize();
}

// After (VRM 0.x only):
if is_vrm0 {
    if let Some(correction) = apose_correction {
        result = (result * correction).normalize();
    }
}
```

For VRM 1.0, detect_apose corrections are now skipped. The three-vrm formula alone produces correct output (identity test PASS 52/52).

For VRM 0.x, corrections are still applied (these models use `normalized` without dst_rest transforms, so manual A-pose correction is needed).

---

## Verification

### Identity test — all models pass at 0.00°
```
vroid_0x_f_minjoon.vrm   A  leftLowerArm=0.00° rightLowerArm=0.00°  OK
vrm_0x_f_yoya.vrm        B  leftLowerArm=0.00° rightLowerArm=0.00°  OK
vroid_1x_f_xiao.vrm      B  leftLowerArm=0.00° rightLowerArm=0.00°  OK
zepeto_1x_m_001.vrm      F  leftLowerArm=0.00° rightLowerArm=0.00°  OK
... all 8 models OK
```

### Expected F5 debug after fix
- Both shoulders: ~5° rot_d (small A-pose difference, now symmetric)
- Both upperArms: similar rot_d (no 78° over-correction)
- Both hands: similar delta distance (no BACKWARD flip)

---

## Changed files

1. `crates/cinev_retarget/src/retargeter.rs`:
   - **Fix:** `compute_rotations()` — apose_correction gated behind `if is_vrm0`
   - **Diagnostics:** `detect_apose()` returns `(HashMap, Vec<String>)` with per-bone direction/angle log
   - Constructor logs APOSE diagnostics to init_log
2. `crates/cinev_retarget/src/bin/headless.rs` — `[RQ] preserve` added to log filter

---

## Note on detect_apose purpose

`detect_apose` was designed to correct A-pose → T-pose direction mismatch. It compares VRM bone-to-child world direction vs FBX bone-to-child world direction and creates a rotation correction.

**For VRM 0.x:** This is necessary because the formula uses `normalized` directly (no dst_rest transforms). The output is in a "neutral" space where manual corrections bridge the rest pose gap.

**For VRM 1.0:** The full three-vrm formula `dst_rest_local × dst_rest_global⁻¹ × normalized × dst_rest_global` already maps from source rest to VRM rest. The detect_apose correction is redundant and causes over-rotation (73-78° per arm bone = arms visually broken).
