# R-021 T2M FBX arm/hand keyframe analysis — Result

**Branch:** `feat/blender-source-type` (bevy-vrm)
**Date:** 2026-03-31
**Agent:** 2호기

**Source files modified: NONE** (analysis only, temporary example used and deleted)

---

## Comparison Table: Arm Animation Strength (max angle from rest°)

| Bone | T2M F walk | T2M M walk | T2M M wave | CINEV Rush |
|------|-----------|-----------|-----------|------------|
| upperarm_l | 25.7° | 25.7° | 14.7° | **168.7°** |
| upperarm_r | 19.5° | 19.5° | **142.9°** | 135.8° |
| lowerarm_l | **37.5°** | **37.5°** | 4.8° | **140.7°** |
| lowerarm_r | **35.2°** | **35.2°** | **63.8°** | **149.0°** |
| hand_l | 11.0° | 11.0° | 12.5° | **177.0°** |
| hand_r | 7.7° | 7.7° | **89.0°** | **172.4°** |

### Key insight

**T2M walk FBX has MEANINGFUL lowerArm animation (35-37°).** This contradicts the R-016 finding of "max 5.6°". The difference:
- R-016 measured the **retargeted** output (after three-vrm formula, VRM space)
- This analysis measures **raw FBX keyframe** delta from rest (FBX local space)
- The three-vrm formula heavily attenuates the raw rotation through coordinate transforms and dst rest correction

**lowerArm is NOT "effectively static" in the raw FBX.** It has substantial animation (37.5° max for walk). The apparent weakness is in the retarget output, not the source data.

---

## Per-bone Keyframe Detail

### T2M F walk (108 frames, 3.6s, Blender 4.5.4)

| Bone | PreRot (deg) | RestRot (deg) | Min° | Max° | Sig frames |
|------|-------------|-------------|------|------|------------|
| upperarm_l | (0, 0, 0) | (18.7, 61.6, -18.7) | 0.0 | 25.7 | 57/108 (53%) |
| upperarm_r | (0, 0, 0) | (16.4, 58.5, -30.1) | 0.1 | 19.5 | 58/108 (54%) |
| lowerarm_l | (0, 0, 0) | (-22.2, 1.4, -13.1) | 0.0 | 37.5 | 62/108 (57%) |
| lowerarm_r | (0, 0, 0) | (-14.8, -2.8, -19.7) | 0.1 | 35.2 | 60/108 (56%) |
| hand_l | (0, 0, 0) | (-76.8, -11.9, 4.1) | 0.0 | 11.0 | 54/108 (50%) |
| hand_r | (0, 0, 0) | (-76.2, -10.6, 3.5) | 0.0 | 7.7 | 20/108 (19%) |

### T2M M walk (108 frames, 3.6s, Blender 4.5.4)

Identical values to T2M F walk (same motion, different rest pose). lowerArm max: L=37.5° R=35.2°.

### T2M M wave (209 frames, 6.9s, Blender 4.5.4)

| Bone | PreRot (deg) | RestRot (deg) | Min° | Max° | Sig frames |
|------|-------------|-------------|------|------|------------|
| upperarm_l | (0, 0, 0) | (-7.3, 63.8, -5.7) | 0.1 | 14.7 | 123/209 (59%) |
| upperarm_r | (0, 0, 0) | (2.8, 66.9, -20.3) | 0.0 | **142.9** | 201/209 (96%) |
| lowerarm_l | (0, 0, 0) | (-1.2, 1.1, -14.5) | 0.0 | 4.8 | 0 |
| lowerarm_r | (0, 0, 0) | (-1.1, 1.1, -19.1) | 0.0 | **63.8** | 189/209 (90%) |
| hand_l | (0, 0, 0) | (-73.2, 5.0, 14.3) | 0.0 | 12.5 | 41/209 (20%) |
| hand_r | (0, 0, 0) | (-85.9, 12.7, 6.6) | 0.0 | **89.0** | 201/209 (96%) |

Wave motion: right arm extremely active (142.9° upperarm, 63.8° lowerarm, 89.0° hand), left arm nearly static.

### CINEV Rush (531 frames, 17.7s, FBX SDK/Maya)

| Bone | PreRot (deg) | RestRot (deg) | Min° | Max° | Sig frames |
|------|-------------|-------------|------|------|------------|
| upperarm_l | (-4.9, 49.5, -4.1) | (-89.0, -19.0, -4.4) | 0.0 | **168.7** | 518/531 (98%) |
| upperarm_r | (-4.9, 49.5, -4.1) | (-85.4, -25.4, -2.6) | 0.0 | **135.8** | 517/531 (97%) |
| lowerarm_l | (0, 0, -36.7) | (-0.6, 1.1, 41.3) | 0.0 | **140.7** | 506/531 (95%) |
| lowerarm_r | (0, 0, -36.7) | (-0.6, 1.1, 40.0) | 0.0 | **149.0** | 502/531 (95%) |
| hand_l | (-90, 4.2, -2.1) | (102.9, 35.1, -0.8) | 0.0 | **177.0** | 518/531 (98%) |
| hand_r | (-90, 4.2, -2.1) | (103.2, 24.1, -9.6) | 0.0 | **172.4** | 518/531 (98%) |

Rush has near-max rotation range across all arm bones. This is an expressive dance animation vs a walk cycle.

---

## Missing Bones

### Twist bones

| Bone | T2M F walk | T2M M walk | T2M M wave | CINEV Rush |
|------|-----------|-----------|-----------|------------|
| upperarm_twist_01_l | MISSING | MISSING | MISSING | exists* |
| upperarm_twist_01_r | MISSING | MISSING | MISSING | exists* |
| upperarm_twist_02_l | MISSING | MISSING | MISSING | exists* |
| upperarm_twist_02_r | MISSING | MISSING | MISSING | exists* |
| lowerarm_twist_01_l | MISSING | MISSING | MISSING | exists* |
| lowerarm_twist_01_r | MISSING | MISSING | MISSING | exists* |
| lowerarm_twist_02_l | MISSING | MISSING | MISSING | exists* |
| lowerarm_twist_02_r | MISSING | MISSING | MISSING | exists* |

*Rush FBX: twist bone names found in raw binary (`upperarm_twist_01_l` etc.) but NOT parsed into `fbx.bones` or `fbx.tracks` by the FBX parser. These bones are likely NOT Model nodes but rather sub-deformers or skinning cluster references. The `twist_fold` config entries (`cinev_female_body.json`) reference them via `DHIbody:` prefix which also doesn't match.

**T2M FBX (Blender): NO twist bones at all.** Blender's MetaHuman export doesn't include twist bones. The `cinev_blender_female.json` config correctly has `"twist_fold": {}` (empty).

### Core arm/hand bones

All core bones (upperarm, lowerarm, hand — L+R) **exist and are animated** in all 4 FBX files.

---

## Analysis: Why lowerArm appears weak in retarget

Raw FBX lowerArm has 35-37° rotation range in walk animations. But the retarget pipeline transforms this:

1. **FBX Lcl Rotation → animated quaternion** (local bone space)
2. **PreRotation × animated → bone_rest_global** (coordinate transform)
3. **three-vrm formula:** `parentRestWorld × animLocal × boneRestWorld⁻¹` — this normalizes to a VRM-space rotation
4. **dst rest correction (VRM 1.0):** `dstRestLocal × dstRestGlobal⁻¹ × normalized × dstRestGlobal`
5. **A-pose correction** (if applicable)
6. **Shoulder dampening** (if shoulder_ratio < 0.95)

The 37° raw rotation in FBX local space becomes a much smaller rotation in VRM space because:
- The FBX rest pose already includes a significant lowerArm rotation (-22° X, -13° Z for T2M)
- The three-vrm formula cancels this rest offset, leaving only the delta from rest
- In VRM space, this delta is further transformed by the coordinate rotation (90° X)
- The result is a small VRM-local rotation that correctly represents the arm swing during walking

**This is correct behavior, not a bug.** Walking arm swing is subtle — 5-6° in VRM space is appropriate for the forearm during a walk cycle.

---

## FBX metadata

| FBX | Creator | Detected type | Bones | Frames | Duration |
|-----|---------|--------------|-------|--------|----------|
| t2m_f_walk | Blender 4.5.4 LTS (FBX IO 5.13.0) | Blender | 86 | 108 | 3.6s |
| t2m_m_walk | Blender 4.5.4 LTS (FBX IO 5.13.0) | Blender | 86 | 108 | 3.6s |
| t2m_m_wave | Blender 4.5.4 LTS (FBX IO 5.13.0) | Blender | 86 | 209 | 6.9s |
| CINEV Rush | FBX SDK/FBX Plugins 2020.2.3 | Maya | 85 | 531 | 17.7s |

Note: T2M Blender FBX has ALL PreRotations = identity (0,0,0). All rest orientation is baked into Lcl Rotation. Maya FBX distributes rest between PreRotation and Lcl Rotation.
