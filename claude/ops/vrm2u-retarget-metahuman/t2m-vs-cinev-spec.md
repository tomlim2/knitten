# R-012: T2M vs CINEV FBX Spec Comparison

## 1. FBX Metadata

| Property | CINEV (25_06672) | T2M (m_walk/m_wave/f_walk) | Facial (FC_00078) |
|----------|-----------------|---------------------------|-------------------|
| FBX Version | 7500 | 7400 | 7500 |
| Creator | FBX SDK 2020.2.3 | Blender 4.5.4 LTS (FBX IO 5.13.0) | FBX SDK 2020.2.3 |
| OriginalUpAxis | 2 (Z-up) | **-1 (unset)** | 2 (Z-up) |
| UpAxis | 2 (Z) | 2 (Z) | 2 (Z) |
| UnitScaleFactor | 1 | 1 | 1 |
| GlobalSettings | identical except OriginalUpAxis | | |

**Key diff**: T2M `OriginalUpAxis = -1` (Blender doesn't set original axis). All other GlobalSettings identical.

## 2. Skeleton Structure

| Property | CINEV | T2M | Facial |
|----------|-------|-----|--------|
| Bone count | 84 (no Armature node) | 85 (+Armature root) | ~80 (facial mesh bones) |
| DHIbody: prefix | Yes | Yes | Only root |
| Armature node | No | Yes (Blender artifact) | No |
| Mesh node | CAS_BaseModel (sibling to root) | CAS_BaseModel (sibling to root) | BlendShape_g hierarchy |
| Hierarchy depth | root→pelvis→spine chain | Armature→root→pelvis→spine | Flat facial meshes |
| Body bone names | Identical MetaHuman set | Identical MetaHuman set | N/A |

**Bone hierarchy is identical** (same MetaHuman skeleton). T2M has one extra `Armature` node wrapping `DHIbody:root`.

## 3. PreRotation — THE Critical Difference

### CINEV (Maya/MotionBuilder export)
Every bone has **meaningful PreRotation** values baked into the FBX:

| Bone | PreRotation angle |
|------|------------------|
| pelvis | ~90° (x=-0.022, y=-0.707, z=0.022, w=0.707) |
| clavicle_l | 98.6° |
| clavicle_r | 186.8° |
| upperarm_l/r | 49.7° |
| lowerarm_l/r | 36.7° |
| hand_l/r | 90.1° |
| spine_01 | ~8.6° |

### T2M (Blender export)
**ALL PreRotation = identity (0,0,0,1)** — zero on every bone.

### Implication for Retarget
In `retargeter.rs:625`:
```rust
let anim_local_zup = track.src_rest * track.rotations[i];
```

- **CINEV**: `src_rest = PreRotation(49.7°)`, `rotations[i]` = small delta → produces correct full local
- **T2M**: `src_rest = identity`, `rotations[i]` = full rotation (PreRotation already baked in by Blender) → **also produces correct full local**

**The formula is mathematically correct for both cases.** Blender bakes `PreRotation * LclRotation` into the animation curve as a single combined rotation, so `identity * combined = combined` works.

## 4. Arm Bone Rotation Statistics

### Animation Overview

| File | Frames | Animated bones | Blend shapes |
|------|--------|---------------|-------------|
| CINEV 25_06672 | 531 | 84 | 0 |
| T2M m_walk | 108 | 85 | 0 |
| T2M m_wave | 209 | 85 | 0 |
| T2M f_walk | 108 | 85 | 0 |
| Facial FC_00078 | 201 | 1 (root only) | 124 |

### upperarm_l Rotation Range

| File | Angle min | Angle max | **Range** | Avg | Max frame Δ |
|------|-----------|-----------|-----------|-----|-------------|
| CINEV | 12.8° | 131.1° | **118.4°** | 62.1° | 38.27° |
| T2M m_walk | 52.2° | 67.9° | **15.7°** | 62.3° | 2.54° |
| T2M m_wave | 62.2° | 68.9° | **6.7°** | 65.2° | 2.42° |
| T2M f_walk | 56.8° | 72.0° | **15.2°** | 66.7° | 2.54° |

### upperarm_r Rotation Range

| File | Angle min | Angle max | **Range** | Avg | Max frame Δ |
|------|-----------|-----------|-----------|-----|-------------|
| CINEV | 14.4° | 136.1° | **121.7°** | 67.4° | 43.48° |
| T2M m_walk | 61.2° | 69.8° | **8.7°** | 65.6° | 1.80° |
| T2M m_wave | 43.7° | 118.2° | **74.5°** | 71.8° | 19.94° |
| T2M f_walk | 65.5° | 73.5° | **8.0°** | 69.5° | 1.80° |

### lowerarm_l/r Rotation Range

| File | lowerarm_l range | lowerarm_r range |
|------|-----------------|-----------------|
| CINEV | 99.3° | 108.5° |
| T2M m_walk | 37.7° | 34.6° |
| T2M m_wave | 7.6° | 81.0° |
| T2M f_walk | 37.7° | 34.6° |

### clavicle_l/r Rotation Range

| File | clavicle_l range | clavicle_r range |
|------|-----------------|-----------------|
| CINEV | 10.7° | 25.0° |
| T2M m_walk | 5.3° | 1.9° |
| T2M m_wave | 6.1° | 3.5° |
| T2M f_walk | 5.3° | 1.9° |

### hand_l/r Rotation Range

| File | hand_l range | hand_r range |
|------|-------------|-------------|
| CINEV | 117.0° | 134.5° |
| T2M m_walk | 3.7° | 1.6° |
| T2M m_wave | 9.6° | 48.6° |
| T2M f_walk | 3.7° | 1.6° |

## 5. T2M pelvis Rotation — Baked Rest Pose

Critical observation from pelvis animation:

| File | Pelvis f0 rotation | Angle |
|------|-------------------|-------|
| CINEV | (0.0255, 0.0138, -0.0252, 0.9993) | **4.4°** |
| T2M m_walk | (-0.0206, -0.7023, 0.0208, 0.7113) | **89.3°** |

CINEV pelvis `PreRotation = (-0.022,-0.707,0.022,0.707)` ≈ 90°Y. The animation curve stores only ~4.4° delta.

T2M pelvis `PreRotation = identity`. Animation curve stores **89.3°** — the full rotation including the ~90°Y rest pose.

**Both produce the same world-space result**: `PreRot * delta ≈ identity * full_rot ≈ 90°Y + delta`

## 6. Core Diagnosis: Why Arms Look Weak

### Primary Cause: A — T2M source genuinely has small arm motion

| Metric | CINEV (dance) | T2M walk | Factor |
|--------|--------------|----------|--------|
| upperarm range | 118-122° | 8-16° | **~10x smaller** |
| upperarm max frame Δ | 38-43° | 1.8-2.5° | **~20x smaller** |
| lowerarm range | 99-109° | 35-38° | **~3x smaller** |
| hand range | 117-135° | 1.6-3.7° | **~40x smaller** |

This is expected: **CINEV is a dance animation** (SukiShukiRush), **T2M is a walk cycle**. Walk cycles have inherently small arm swing.

Even `t2m_m_wave.fbx` only has significant motion on the **right arm** (74.5° upperarm range, 81° lowerarm range) while left arm stays almost static (6.7° range).

### Secondary Cause: B — Shoulder width compensation dampens further

`retargeter.rs:657-663`:
```rust
if self.shoulder_ratio < 0.95
    && (track.vrm_bone_name == "leftUpperArm" || track.vrm_bone_name == "rightUpperArm")
{
    let blend = self.shoulder_ratio + (1.0 - self.shoulder_ratio) * 0.55;
    result = Quat::IDENTITY.slerp(result, blend);
}
```

If `shoulder_ratio = 0.58` → `blend = 0.58 + 0.42 * 0.55 = 0.811`

This reduces upperarm rotation to **81%** of original. On an already-small 15° range, this cuts visible motion by another 3°.

### Not a Cause: C — PreRotation / rest pose difference

The retarget formula `src_rest * rotations[i]` produces correct world-space rotations for **both** CINEV and T2M formats. Blender's PreRotation-baking doesn't break the math because:
- CINEV: `PreRot * delta` = full local
- T2M: `identity * full` = full local (Blender already combined PreRot + delta into one curve)

The `src_rest_global` and `parent_rest_global` used in the three-vrm formula (`parent_rest × local × bone_rest⁻¹`) also resolve correctly since `global_rest` accumulates from `pre_rotation * lcl_rot_rest`.

## 7. Conclusion

**Hypothesis ranking:**

| Rank | Hypothesis | Verdict | Impact |
|------|-----------|---------|--------|
| 1 | **A: T2M source has small arm motion** | **CONFIRMED** | Primary (10-40x smaller rotation ranges than dance) |
| 2 | **B: Shoulder slerp over-dampens** | Partial | ~19% reduction at ratio=0.58, compounds A |
| 3 | **C: Skeleton structure difference** | **REJECTED** | Math is correct for both PreRotation styles |
| 4 | **D: FBX version / Blender export** | Minimal | OriginalUpAxis=-1 is cosmetic, no functional impact |

### Actionable items

1. **t2m_m_wave.fbx is the real test case** — right arm has 74.5° upperarm range. If wave motion looks weak after retarget, the shoulder_ratio dampening (B) is the culprit.
2. **Walk animations will always look subdued** — 15° arm range is inherent to the motion, not a retarget bug.
3. **Shoulder ratio blend factor 0.55** could be tuned. Current formula: `blend = ratio + (1-ratio)*0.55`. At ratio=0.58, blend=0.81. Consider raising the 0.55 coefficient or applying it only when the motion exceeds a threshold.
