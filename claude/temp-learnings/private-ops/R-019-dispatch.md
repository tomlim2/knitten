# Task: R-019 Add rest_pose_offsets for locomotion bones

You are agent #2. Work in the bevy-vrm repo.

## Setup
- Branch: `feat/blender-source-type` (continue from R-018)
- Repo: ~/Desktop/www/bevy-vrm

## Rules
- **NEVER modify source animation.** No amplification, overlay, or post-processing.
- **Do NOT commit.** Write code only. Agent #1 (control) handles commits.
- **Do NOT break existing tests.**
- **No formula changes.** Config value additions only.

## Context

R-018 completed a full-body rest pose audit. 10 locomotion-critical bones are missing offsets. rest_pose_offsets only apply to VRM 0.x retargeting.

R-018 auto-generated values for target bones:
```json
"leftLowerArm": [-0.01, 0.02, 0.08],
"rightLowerArm": [-0.01, 0.02, 0.06],
"spine": [-0.00, -0.00, -0.10],
"chest": [-0.01, -0.00, -0.03],
"neck": [-0.02, 0.00, -0.25],
"head": [-0.01, -0.05, 0.19],
"leftLowerLeg": [0.01, -0.05, -0.38],
"rightLowerLeg": [0.01, -0.04, -0.30],
"leftFoot": [-0.05, 0.09, 0.30],
"rightFoot": [0.02, -0.03, 0.25]
```

**Warning:** These values are from raw FBX rest → Euler XYZ radians. The retargeter's auto_detect_apose may already correct some bones automatically. You MUST check for overlap before adding.

## Tasks

### 1. Check auto_detect_apose coverage

Read `retargeter.rs` and identify which bones are automatically corrected by auto_detect_apose or any A-pose auto-correction logic. Bones covered by auto-correction must be EXCLUDED from rest_pose_offsets to avoid double correction.

### 2. Add offsets to 4 config JSONs

Files:
- `assets/retarget/cinev_female_body.json`
- `assets/retarget/cinev_male_body.json`
- `assets/retarget/cinev_blender_female.json`
- `assets/retarget/cinev_blender_male.json`

Current rest_pose_offsets (identical in all 4):
```json
"rest_pose_offsets": {
    "leftShoulder": [0.0, 0.0, 0.38],
    "leftUpperArm": [0.0, 0.0, 0.71],
    "rightShoulder": [0.0, 0.0, -0.38],
    "rightUpperArm": [0.0, 0.0, -0.71],
    "leftHand": [-0.67, 0.1, -0.08],
    "rightHand": [0.99, 0.2, -0.05]
}
```

Add only non-overlapping bones. Reference R-018 auto-generated values but verify against actual retargeter internals (`retargeter.rs:414-430`).

### 3. Verify with headless CLI

```bash
cargo run -p cinev_retarget --bin headless -- \
  assets/models/vroid_f_xiao.vrm \
  assets/fbx/t2m_f_walk.fbx \
  assets/retarget/cinev_blender_female.json
```

Check:
- rest_pose_missing_offsets warnings reduced
- No regression in identity tests
- No regression in existing RQ grades

### 4. Run tests

- `cargo test -p cinev_retarget` — all pass
- `cargo clippy -p cinev_retarget -- -D warnings` — no warnings

## Acceptance Criteria

1. All tests pass
2. Clippy clean
3. 4 config JSONs updated with locomotion bone offsets
4. No overlap with auto_detect_apose confirmed
5. Headless CLI shows no missing offset warnings for locomotion bones

## Report

Write results to `~/.claude/private/ops/R-019-result.md`:
- auto_detect_apose coverage (which bones are auto-corrected)
- Final list of added bones + values
- Excluded bones + reasons
- cargo test results
- cargo clippy results
- headless CLI RQ output (before/after if possible)
