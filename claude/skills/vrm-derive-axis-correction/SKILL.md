---
name: vrm-derive-axis-correction
description: Derive per-bone axis-correction quaternions for VRM retargeting from ARP FBX — Rust AXIS_CORRECTION table entries.
---

# vrm-derive-axis-correction

Automates deriving per-bone runtime axis correction quats for the vrm2u-bevy project's Stage 4 rest sync pipeline.

## When to use

- VRM mesh shows arms rotating in wrong direction despite correct magnitude
- Systematic axis mismatch between ARP source and VRM retargeter output
- Need to extend `AXIS_CORRECTION` table in `arp_vrm_user_pose.rs` with new bones
- User captured calibration values via viewer (C key) and wants to derive per-bone corrections

## Arguments

- `<fbx_filename>` — FBX file name inside `assets/fbx/` (e.g. `18360_F_AIGracefulArmsSR_000000.fbx`)
- `<frame>` — Frame number to analyze (e.g. `444` for 14.8s at 30fps)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/vrm-derive-axis-correction <fbx_filename> <frame>`

## Workflow

### Step 1: Validate

- Check repo path from `~/.claude/private/caol-config/repo-paths.json` (key: `vrm2u-bevy`)
- If the FBX path is given without directory, assume `assets/fbx/`
- Verify the frame is within the FBX's frame count (use `hand_fbx_dump` first if unsure)

### Step 2: Build the analyzer

```bash
cd <vrm2u-bevy repo>/crates/cinev_retarget
~/.cargo/bin/cargo build --bin arm_axis_analyze
```

### Step 3: Run the analysis

```bash
cd <vrm2u-bevy repo>
./crates/cinev_retarget/target/debug/arm_axis_analyze \
    assets/fbx/<fbx_filename> \
    <frame>
```

Filter the output to only the `── bone / vrm_bone` sections (pipe through `grep -A 5 "── "`).

### Step 4: Interpret

For each bone, the output contains:
- `ARP delta` — source rotation (ground truth)
- `VRM local` — retargeter output
- `axis diff` — angle between the two axes (ideal: 0°, real: often 100°+)
- `mag ratio` — magnitude of VRM / ARP (ideal: 1.0)
- `basis quat` — the `Quat::from_rotation_arc(vrm_axis, arp_axis)` result

**Red flags** — skip this bone:
- ARP magnitude < 30° (axis numerically unstable for small rotations)
- `mag ratio` < 0.7 or > 1.3 (retargeter has more than axis issue)
- `axis diff` < 20° (already close enough, don't over-correct)

### Step 5: Verify stability across frames

Run the same analysis at 2-3 other frames of the same animation to check if the basis quat values are consistent. If they drift more than 0.1 in any component, the correction is NOT frame-independent and a static table entry is unreliable.

### Step 6: Output Rust code

Generate the additions for `AXIS_CORRECTION` in `crates/cinev_retarget/src/adapters/arp_vrm_user_pose.rs`:

```rust
BonePose {
    vrm_bone_name: "<bone>",
    delta: Quat::from_xyzw(<x>, <y>, <z>, <w>),
},
```

Present only the bones that passed the Step 4 + Step 5 checks.

### Step 7: Apply + test

Ask the user to decide whether to edit the file directly. If yes:
- Edit `AXIS_CORRECTION` in `arp_vrm_user_pose.rs`
- `~/.cargo/bin/cargo build --bin bevy-vrm`
- Launch viewer in background
- Wait for user's visual verification

## Example

```
Input:  /vrm-derive-axis-correction 18360_F_AIGracefulArmsSR_000000.fbx 444

Running arm_axis_analyze on 18360_F_AIGracefulArmsSR_000000.fbx frame 444...

── arm_stretch.l / leftUpperArm
  ARP delta:  33.4°  axis=[-0.226,+0.870,-0.438]
  VRM local:  38.0°  axis=[+0.497,-0.778,-0.383]
  axis diff:  128.4°  mag ratio: 1.137
  basis quat: Quat::from_xyzw(+0.7753, +0.3498, +0.2953, +0.4351)

── forearm_stretch.l / leftLowerArm
  ARP delta:  149.0°  axis=[-0.840,+0.152,-0.520]
  VRM local:  162.3°  axis=[+0.302,-0.435,+0.848]
  axis diff:  139.6°  mag ratio: 1.090
  basis quat: Quat::from_xyzw(+0.1405, -0.8045, -0.4624, +0.3453)

...

Derived corrections (4 stable bones — hands skipped due to magnitude instability):

```rust
BonePose { vrm_bone_name: "leftUpperArm",  delta: Quat::from_xyzw( 0.7753,  0.3498,  0.2953, 0.4351) },
BonePose { vrm_bone_name: "leftLowerArm",  delta: Quat::from_xyzw( 0.1405, -0.8045, -0.4624, 0.3453) },
BonePose { vrm_bone_name: "rightUpperArm", delta: Quat::from_xyzw(-0.3376,  0.6132, -0.6487, 0.2986) },
BonePose { vrm_bone_name: "rightLowerArm", delta: Quat::from_xyzw(-0.0330, -0.7976, -0.4237, 0.4282) },
```

Apply to file? [y/n]
```

## Background

The retargeter preserves rotation magnitude but interprets the rotation axis in each rig's own local bone frame. ARP (Blender) uses bone-length = +Y, VRM (glTF) uses +X. Plus accumulated parent chain rest differences. Result: axes end up ~100-145° off in world space for the same physical motion.

Since the frame difference is systematic per bone (constant across frames), a single basis quat applied as
```
corrected = basis * retargeter_output * basis.inverse()
```
rotates the axis to match ARP without touching magnitude.

**Limitation**: This does NOT correct magnitude ratio mismatch (typical 0.9-1.15x). For bones where magnitude matters, a second pass with angle scaling is needed.

## ⚠️ Past mistakes (DO NOT REPEAT)

### Mistake 1: applying conjugation to ABSOLUTE rotation

```rust
// WRONG — rotates the REST pose too, destroying standing animations
tf.rotation = basis * tf.rotation * basis.inverse();
```

At standing rest frame, `tf.rotation ≈ dst_rest_local` (the baseline). Conjugating this rotates the REST axis, warping the T-pose / standing pose.

**Fix**: apply conjugation to the DELTA from rest only:

```rust
// CORRECT — preserves rest, only rotates the animation delta
let rest = rest_transform.rotation;
let delta = rest.inverse() * tf.rotation;
let corrected_delta = basis * delta * basis.inverse();
tf.rotation = rest * corrected_delta;
```

At rest frame, `delta ≈ identity`, so `corrected_delta ≈ identity`, so `tf.rotation ≈ rest` — unchanged. At animated frames, only the delta's axis gets rotated.

### Mistake 2: deriving from a single animation and applying globally

A basis derived from a single animation can be motion-range-specific. Always verify the basis is stable across:
- Multiple frames of the SAME animation (Step 5 in the workflow)
- At least ONE other animation (e.g. if derived from graceful arms, test with standing + running)

If the basis works for one animation but breaks others, it's not a systematic error — it's per-animation and shouldn't be in the global table.

### Mistake 3: correcting bones with small rotation magnitude

For rotations under ~30°, quaternion axis extraction is numerically unstable. The derived axis can swing wildly frame-to-frame even though the rotation is nearly identity. Do NOT derive corrections for:
- Hand bones (small rotations)
- Any bone where `ARP magnitude < 30°` in the analysis output

Filter these out in Step 4.

### 🚨 Mistake 4: OVERWRITING existing corrections instead of LAYERING

**Most important principle. User explicitly flagged this.**

Corrections should **supplement** each other case by case, NOT replace prior values. When the user provides new calibration values for a bone that ALREADY has an entry in `AXIS_CORRECTION`:

1. **Do NOT blindly replace the existing entry.**
2. Ask the user: "이 값을 기존 값을 대체할까요, 아니면 다른 케이스용으로 추가할까요?"
3. If supplementing:
   - Tag the correction by case (animation name, frame range, pose type)
   - Either:
     - Extend the table with a conditional entry (per-animation lookup), OR
     - Compose the two basis quats (if both are truly universal corrections)
4. If replacing:
   - Preserve the old value as a comment for reference
   - Record which case triggered the change

Never silently lose prior calibration data — each value represents user effort.

**Current design constraint**: `AXIS_CORRECTION` is a flat per-bone table with no case dimension. When multiple cases need different corrections for the same bone, extend the data model to `(vrm_bone, case_key) → quat`.

### Verification checklist after ANY correction change

After modifying `AXIS_CORRECTION`, always verify:
- [ ] F8 standing — arms still drop naturally to sides
- [ ] F9 running — arms swing correctly through the run cycle
- [ ] F7 happy — arms movement looks natural
- [ ] The specific case the new correction was derived from looks correct
- [ ] Calibration mode (C key) still enters T-pose cleanly

If ANY of the first three regress, the correction is not universal and needs to become case-specific, not global.

### 🚨 Mistake 5: treating frame-range analysis as PRESCRIPTIVE

**User explicitly flagged this.**

When asking the user (or the tool) for "앞뒤 N프레임 데이터", the purpose is to see **diversity of motion cases** — e.g., arm moving left vs right vs up vs down, small vs large rotations, fast vs slow. The data is DESCRIPTIVE (shows what motions exist in the animation), NOT PRESCRIPTIVE (NOT a spec for how to apply corrections).

**Wrong interpretation**: "Frame 100 showed axis X, so apply correction X to all frames."
**Correct interpretation**: "Frames 40-160 showed various motion cases. Are the axis errors consistent across all cases? If yes, one correction suffices. If no, we need case-specific corrections OR a different approach entirely."

Step 5 of the workflow (stability check across frames) exists precisely for this. Do not skip it.

**If the axis error varies across cases**:
- Derive the correction per case (animation or motion-direction)
- Do NOT collapse to a single "average" correction — it breaks all cases
- Extend the data model to include case-keyed corrections

## Related

- `crates/cinev_retarget/src/bin/arm_axis_analyze.rs` — the analyzer binary
- `crates/cinev_retarget/src/adapters/arp_vrm_user_pose.rs` — target file for corrections
- `src/calibration.rs::apply_axis_correction` — runtime apply system
- `KEYBINDINGS.md` — viewer calibration mode docs (C key)
