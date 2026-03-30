# R-015: Bone Mapping Integrity Audit

## 1. Config Overview

Both `cinev_male_body.json` and `cinev_female_body.json` have identical bone mappings.

| Category | Count | Notes |
|----------|-------|-------|
| direct_map | 51 | FBX bone → VRM bone |
| accumulate | 3 bones → 1 VRM | spine_03/04/05 → upperChest |
| twist_fold | 12 bones → 6 VRM | All MISSING in FBX |
| root_bone | 1 | root → VRMC_vrm.root_bone |
| ignore_patterns | 9 | correctiveRoot, metacarpal, etc. |
| rest_pose_offsets | 6 | VRM 0.x only (ignored for 1.0) |
| **Total config refs** | **67** unique FBX bone names |

## 2. Mapping Match Results

### headless CLI confirmation
```
bone_tracks: 53
matched_direct: 51
unmatched_config: 0
```

**All 51 direct_map bones found.** 53 tracks = 51 direct + 1 root + 1 accumulate(upperChest).

### Config bones NOT in FBX — ALL twist (12/12)

| Config bone | Target VRM | Status |
|-------------|-----------|--------|
| upperarm_twist_01_l | leftUpperArm | **MISSING** |
| upperarm_twist_02_l | leftUpperArm | **MISSING** |
| upperarm_twist_01_r | rightUpperArm | **MISSING** |
| upperarm_twist_02_r | rightUpperArm | **MISSING** |
| lowerarm_twist_01_l | leftLowerArm | **MISSING** |
| lowerarm_twist_02_l | leftLowerArm | **MISSING** |
| lowerarm_twist_01_r | rightLowerArm | **MISSING** |
| lowerarm_twist_02_r | rightLowerArm | **MISSING** |
| thigh_twist_01_l | leftUpperLeg | **MISSING** |
| thigh_twist_01_r | rightUpperLeg | **MISSING** |
| calf_twist_01_l | leftLowerLeg | **MISSING** |
| calf_twist_01_r | rightLowerLeg | **MISSING** |

Missing in **both** T2M and CINEV FBX. These twist bones exist only in full MetaHuman rigs (Maya/MotionBuilder); baked FBX exports don't include them. Silently skipped by mapping code (mapping.rs:357 `continue`).

### FBX bones NOT in config — 29 bones (expected)

| Category | Bones | Count | Reason |
|----------|-------|-------|--------|
| metacarpal | index/middle/pinky/ring_metacarpal_l/r | 8 | Covered by `ignore_patterns: *metacarpal*` |
| toe phalanges | bigtoe/indextoe/littletoe/middletoe/ringtoe_01/02_l/r | 20 | VRM only has leftToes/rightToes (ball_l/r mapped) |
| neck_02 | neck_02 | 1 | Config maps neck_01 → neck only |

All expected and intentional.

### Arm/Hand Mapping (verified correct)

| FBX bone (with DHIbody: prefix) | Config maps to | VRM bone | Status |
|--------------------------------|---------------|----------|--------|
| lowerarm_l | leftLowerArm | ✓ | **OK** |
| lowerarm_r | rightLowerArm | ✓ | **OK** |
| hand_l | leftHand | ✓ | **OK** |
| hand_r | rightHand | ✓ | **OK** |
| clavicle_l | leftShoulder | ✓ | **OK** |
| clavicle_r | rightShoulder | ✓ | **OK** |
| upperarm_l | leftUpperArm | ✓ | **OK** |
| upperarm_r | rightUpperArm | ✓ | **OK** |

## 3. Rest Pose Comparison

### PreRotation (skeleton rest)

| Bone | T2M PreRot | CINEV PreRot |
|------|-----------|-------------|
| clavicle_l | identity (0°) | (0.090,0.750,-0.060,0.652) = 98.6° |
| upperarm_l | identity (0°) | (-0.024,0.420,-0.014,0.907) = 49.7° |
| lowerarm_l | identity (0°) | (0.000,0.000,-0.315,0.949) = 36.7° |
| hand_l | identity (0°) | (-0.706,0.039,0.013,0.707) = 90.1° |
| clavicle_r | identity (0°) | (0.750,-0.090,-0.652,-0.060) = 186.8° |
| upperarm_r | identity (0°) | (-0.024,0.420,-0.014,0.907) = 49.7° |
| lowerarm_r | identity (0°) | (0.000,0.000,-0.315,0.949) = 36.7° |
| hand_r | identity (0°) | (-0.706,0.039,0.013,0.707) = 90.1° |

T2M: all identity (Blender bakes PreRotation into LclRotation).
CINEV: rich PreRotation (FBX SDK separates rest from animation).

### VRM Rest Pose

VRM (vroid_f_xiao, 1.0): T-pose, all arm bones have near-identity local rotations.
```
leftHand:  local=(0.000,0.000,-0.000,1.000) global=(-0.000,-0.000,0.000,1.000)
rightHand: local=(0.000,0.000,0.000,1.000)  global=(-0.000,0.000,-0.000,1.000)
```

### Hand Rest Orientation Delta (HAND_DIAG)

| Hand | VRM global | FBX global (Y-up) | diff_euler (rad) | diff (deg) |
|------|-----------|-------------------|-----------------|-----------|
| **T2M leftHand** | identity | (-0.467,0.216,-0.547,0.660) | (-0.681,0.921,-1.036) | (-39°,53°,-59°) |
| **T2M rightHand** | identity | (-0.684,-0.575,-0.101,-0.437) | (2.463,0.695,-1.144) | (141°,40°,-66°) |
| CINEV leftHand | identity | (-0.623,0.035,-0.125,0.772) | (-1.342,0.211,-0.154) | (-77°,12°,-9°) |
| CINEV rightHand | identity | (0.812,0.147,0.141,0.547) | (1.974,0.401,-0.092) | (113°,23°,-5°) |

**T2M has larger hand rest deltas than CINEV** (esp. Z-axis: -59° vs -9° for left hand). This difference is handled by the three-VRM normalization formula (`parentRest × animLocal × boneRest⁻¹`), not by A-pose correction (which only applies to shoulder→upperArm and upperArm→lowerArm pairs).

### A-pose Correction Status

The `detect_apose()` function (retargeter.rs:918) computes corrections for 4 arm pairs:
- leftShoulder → leftUpperArm
- leftUpperArm → leftLowerArm
- rightShoulder → rightUpperArm
- rightUpperArm → rightLowerArm

No `[APOSE` log tag exists in the code — corrections are computed silently. They exist but are not logged in the headless CLI output. The `rest_pose_offsets` in config (leftShoulder, leftUpperArm, rightShoulder, rightUpperArm, leftHand, rightHand) are only applied for VRM 0.x; VRM 1.0 relies on auto-detection + three-VRM formula.

## 4. Twist Bone Analysis

### Impact of Missing Twist Bones

Twist bones distribute rotation between a joint and its twist chain. Without them:

| VRM bone | Twist source | Effect of absence |
|----------|-------------|-------------------|
| leftUpperArm | upperarm_twist_01/02_l | Full rotation on upperarm only. No twist distribution. |
| rightUpperArm | upperarm_twist_01/02_r | Same |
| leftLowerArm | lowerarm_twist_01/02_l | Full rotation on lowerarm only. **Wrist twist won't distribute up forearm.** |
| rightLowerArm | lowerarm_twist_01/02_r | Same |
| leftUpperLeg | thigh_twist_01_l | Full rotation on thigh. |
| rightUpperLeg | thigh_twist_01_r | Same |
| leftLowerLeg | calf_twist_01_l | Full rotation on calf. |
| rightLowerLeg | calf_twist_01_r | Same |

**Consequence for arms:** When twist bones are present (full MetaHuman rig), forearm twist is distributed across lowerarm + twist bones, creating smoother deformation. Without them, all twist is concentrated on the single lowerarm bone. For VRM targets (which also have no twist bones), this is actually correct — VRM only has one lowerArm bone, so concentrating rotation there matches the target skeleton.

**Verdict: Missing twist bones are NOT a problem** for T2M→VRM retarget. They would only matter for MetaHuman→MetaHuman retarget.

## 5. Findings Summary

| Issue | Severity | Details |
|-------|----------|---------|
| All 51 direct_map bones match | **OK** | 0 unmatched config bones |
| Arm chain lowerarm/hand correct | **OK** | All 8 arm bones mapped correctly |
| 12 twist bones missing from FBX | **Non-issue** | Expected: baked FBX doesn't include twist bones. Silently skipped. Not needed for VRM target. |
| 29 FBX bones unmapped | **Expected** | metacarpals (ignored), toe phalanges (VRM has no per-toe), neck_02 (only neck_01 used) |
| T2M PreRotation all identity | **Known** | Blender bakes rest into LclRotation. Retarget math handles correctly (R-012 confirmed). |
| Hand rest delta larger in T2M | **Info** | T2M hand has 39-66° more offset than CINEV. Handled by three-VRM formula, not A-pose correction. |
| A-pose corrections not logged | **Info** | detect_apose() runs but results not visible in headless output. |
| rest_pose_offsets VRM 1.0 only | **OK** | Config offsets ignored for VRM 1.0 (correct behavior). |

### Conclusion

**Bone mapping is fully correct.** No mismatches, no missing critical bones. The 51 direct_map + 3 accumulate + root = 55 config bones all resolve with `DHIbody:` prefix. Twist bones are absent from both T2M and CINEV FBX exports but are not needed for VRM retarget. Arm weakness in T2M is NOT a mapping issue.
