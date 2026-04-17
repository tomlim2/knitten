# Task: R-022 rest_pose_preserve — partial A-pose retention in retarget output

You are agent #2. Work in the bevy-vrm repo.

## Setup
- Branch: `feat/blender-source-type` (continue)
- Repo: ~/Desktop/www/bevy-vrm

## Rules
- **NEVER modify source animation.**
- **Do NOT commit.**
- **Do NOT break existing tests.**

## Context

The three-vrm formula correctly removes source A-pose and produces VRM T-pose at rest. Mathematically correct, but visually wrong: MetaHuman walks with slightly bent lowerArm (A-pose), but VRM walks with straight arms because the A-pose flexion is fully canceled.

We want to **partially preserve** source A-pose characteristics in the retarget output. For example, keep 100% of lowerArm A-pose bend so the VRM also has slightly bent arms during walk.

## Design

### New config field: `rest_pose_preserve`

Add to `RetargetConfig` in `config.rs`:
```rust
/// Per-bone A-pose preservation factor (0.0 = full T-pose, 1.0 = keep full A-pose offset)
#[serde(default)]
pub rest_pose_preserve: HashMap<String, f32>,
```

### Compute A-pose offset per bone

At rest pose, the three-vrm `normalized` value represents the source bone's rest orientation in VRM-normalized space. For a bone with A-pose offset, `normalized` at rest ≠ identity. This `normalized` at rest IS the A-pose offset we want to partially preserve.

The identity check already computes this (retargeter.rs:554-599):
```rust
// At rest: anim_local_zup = src_rest * lcl_rot_rest
// normalized = parentRestYup × animLocalYup × boneRestYup⁻¹
// For bones with A-pose offset, normalized ≠ identity at rest
```

Store this per-bone: `apose_rest_normalized: HashMap<String, Quat>`

### Apply preservation in the per-frame loop

In `retarget_bone_rotations()` (retargeter.rs ~806), after computing `result`:

```rust
// After existing result computation...
if let Some(&preserve_factor) = self.rest_pose_preserve.get(&track.vrm_bone_name) {
    if preserve_factor > 0.0 {
        if let Some(&apose_offset) = self.apose_rest_normalized.get(&track.vrm_bone_name) {
            // apose_offset is the normalized rest rotation (A-pose in VRM space)
            // Blend it into the result
            let preservation = Quat::IDENTITY.slerp(apose_offset, preserve_factor);
            result = (result * preservation).normalize();
        }
    }
}
```

This should go BEFORE shoulder slerp / hand damping / finger clamp, so those still work on top.

### Where to compute apose_rest_normalized

In `Retargeter::new()` or `new_with_unmatched()`, during the identity check loop (retargeter.rs:554-599), the `normalized` value at rest is already computed. Store it:

```rust
let mut apose_rest_normalized: HashMap<String, Quat> = HashMap::new();

// In the identity check loop:
let normalized = (parent_rest_yup * anim_local_yup * bone_rest_yup.inverse()).normalize();
let apose_angle = normalized.angle_between(Quat::IDENTITY).to_degrees();
if apose_angle > 0.5 {  // only store meaningful offsets
    apose_rest_normalized.insert(track.vrm_bone_name.clone(), normalized);
}
```

Store `rest_pose_preserve` config and `apose_rest_normalized` in the `Retargeter` struct.

## Tasks

### 1. Add `rest_pose_preserve` to config.rs

```rust
#[serde(default)]
pub rest_pose_preserve: HashMap<String, f32>,
```

### 2. Compute and store apose_rest_normalized in Retargeter

In `new_with_unmatched()`, during identity check, capture the normalized rest rotation per bone.

### 3. Apply preservation in retarget_bone_rotations()

After result computation, before shoulder slerp / damping, apply the preservation blend.

### 4. Update config JSONs — add rest_pose_preserve for lowerArm

All 4 config files:
```json
"rest_pose_preserve": {
    "leftLowerArm": 1.0,
    "rightLowerArm": 1.0
}
```

Start with 1.0 (full A-pose preservation). We can tune later.

### 5. Tests

```rust
#[test]
fn rest_pose_preserve_lowerarm() {
    // T2M walk + blender female config (has rest_pose_preserve)
    // Verify lowerArm output at frame 0 is NOT equal to dst_rest_local
    // (because A-pose offset is preserved)
    // The angle should be approximately the A-pose flexion (~4-5°)
}

#[test]
fn rest_pose_preserve_backward_compat() {
    // Female config (no rest_pose_preserve) — behavior unchanged
    // Identity test should still pass for lowerArm
}
```

### 6. Update headless CLI RQ output

Add source info line showing which bones have rest_pose_preserve active:
```
[RQ] preserve: leftLowerArm=1.00 rightLowerArm=1.00
```

## Acceptance Criteria

1. `cargo test -p cinev_retarget` — all pass
2. `cargo clippy -p cinev_retarget -- -D warnings` — no warnings
3. With rest_pose_preserve=1.0, lowerArm at frame 0 shows ~4-5° offset from T-pose (A-pose preserved)
4. Without rest_pose_preserve (existing configs), behavior unchanged
5. Existing identity tests still pass (may need to exclude preserved bones from identity fail check)

## Report

Write results to `~/.claude/private/ops/R-022-result.md`:
- lowerArm angle at frame 0: before vs after preservation
- cargo test / clippy results
- Any issues with identity test interaction
- Changed files list
