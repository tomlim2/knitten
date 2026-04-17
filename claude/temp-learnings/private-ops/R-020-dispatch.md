# Task: R-020 lowerArm rest pose verification — VRM 0.x + 1.0

You are agent #2. Work in the bevy-vrm repo.

## Setup
- Branch: `feat/blender-source-type` (continue from R-019)
- Repo: ~/Desktop/www/bevy-vrm

## Rules
- **NEVER modify source animation.**
- **Do NOT commit.** Agent #1 handles commits.
- **Do NOT break existing tests.**

## Context

lowerArm rest_pose_offsets were added in R-019 for VRM 0.x. But the user observed arm misalignment that may also affect VRM 1.0. The assumption "three-vrm formula handles dst rest correctly for VRM 1.0" has NOT been verified for lowerArm specifically.

### The three-vrm formula (retargeter.rs:806-821)

```rust
// For each frame:
let anim_local_zup = track.src_rest * track.rotations[i];
let anim_local_yup = self.coord_rot * anim_local_zup * self.coord_rot_inv;

// three-vrm: parentRestWorld × animLocal �� boneRestWorld⁻¹
let normalized = (parent_rest_yup * anim_local_yup * bone_rest_yup_inv).normalize();

let mut result = if is_vrm0 {
    normalized
} else {
    // VRM 1.0: full spec formula with dst rest transforms
    (dst_rest_local * dst_rest_global_inv * normalized * dst_rest_global).normalize()
};
```

### Identity test (retargeter.rs:554-599)

At rest pose (frame 0 / identity animation), the formula should produce:
- VRM 0.x: `result ≈ Quat::IDENTITY`
- VRM 1.0: `result ≈ dst_rest_local`

If lowerArm fails this identity test, the three-vrm formula is NOT handling the A-pose → T-pose difference correctly for that bone.

### Available models

VRM 0.x:
- `assets/models/p2v_0x_m_phainon.vrm`
- `assets/models/vrm_0x_f_yoya.vrm`
- `assets/models/vrm_0x_m_ghostpumpking.vrm`
- `assets/models/vrm_0x_m_moth.vrm`
- `assets/models/vrm_0x_m_shimaenaga.vrm`
- `assets/models/vroid_0x_f_minjoon.vrm`

VRM 1.x:
- `assets/models/vroid_1x_f_xiao.vrm`
- `assets/models/zepeto_1x_m_001.vrm`

FBX:
- `assets/fbx/t2m_f_walk.fbx` (Blender)
- `assets/fbx/t2m_m_walk.fbx` (Blender)
- `assets/fbx/25_06672_F_DNTSuperSukiShukiRush_260113.fbx` (Maya)

## Tasks

### 1. Add per-bone rest pose identity diagnostic

In the identity check section (retargeter.rs:554-599), the code already computes `error_angle` per bone. This data exists but is only stored as `identity_fails` (bones > 1°).

Add a new field to `RetargetQuality`:
```rust
pub identity_details: Vec<(String, f32)>,  // ALL bones with their error_angle, not just fails
```

This lets us see lowerArm's exact error angle.

### 2. Write a focused lowerArm diagnostic test

Create a test that:
1. Runs retarget with EACH VRM model (both 0.x and 1.x) × T2M walk FBX
2. For each combo, extracts lowerArm identity error angle
3. Prints a table:

```
| VRM model | version | leftLowerArm error° | rightLowerArm error° | status |
```

If error > 1° on VRM 1.0, the three-vrm formula is NOT handling lowerArm correctly.

### 3. If VRM 1.0 lowerArm fails: investigate WHY

Trace the formula step by step for lowerArm on a VRM 1.0 model:

```
src_rest (FBX PreRotation) = ?
src_rest_global = ?
src_parent_rest_global = ?
dst_rest_local (VRM) = ?
dst_rest_global (VRM) = ?
normalized = ?
result = ?
expected = dst_rest_local = ?
error = ?
```

Print these values. The question is: does the `normalized` step correctly cancel the MetaHuman A-pose lowerArm flexion? If not, where does the error come from?

### 4. If VRM 0.x lowerArm fails: verify offset application

Check if the R-019 offset values actually fix the error. Run the same diagnostic with and without the offset.

### 5. Run headless CLI with all VRM models

```bash
# VRM 0.x
cargo run -p cinev_retarget --bin headless -- \
  assets/models/vroid_0x_f_minjoon.vrm \
  assets/fbx/t2m_f_walk.fbx \
  assets/retarget/cinev_blender_female.json

# VRM 1.x
cargo run -p cinev_retarget --bin headless -- \
  assets/models/vroid_1x_f_xiao.vrm \
  assets/fbx/t2m_f_walk.fbx \
  assets/retarget/cinev_blender_female.json
```

Compare RQ output between 0.x and 1.x. Specifically check identity pass/fail for lowerArm.

## Acceptance Criteria

1. `cargo test -p cinev_retarget` — all pass
2. `cargo clippy -p cinev_retarget -- -D warnings` — no warnings
3. Per-bone identity table for lowerArm across all VRM models produced
4. If VRM 1.0 lowerArm has error > 1°: root cause identified with formula trace
5. If VRM 0.x: offset effectiveness confirmed

## Report

Write results to `~/.claude/private/ops/R-020-result.md`:
- Per-bone identity table (all models × lowerArm)
- Formula trace for lowerArm (if error found)
- Root cause analysis
- Recommended fix (if any)
- cargo test / clippy results
