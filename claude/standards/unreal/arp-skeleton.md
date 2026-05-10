---
status: accepted
---
# Auto Rig Pro (ARP) Skeleton Reference

Reference for retargeting ARP-rigged FBX animations to VRM humanoid skeleton.

---

## 1. Naming Convention

ARP uses a `{bone_name}.{side}` pattern:

| Suffix | Meaning | Example |
|--------|---------|---------|
| `.l` | Left side (+X) | `arm_stretch.l`, `shoulder.l` |
| `.r` | Right side (-X) | `arm_stretch.r`, `shoulder.r` |
| `.x` | Center/midline | `root.x`, `spine_01.x`, `neck.x`, `head.x` |

The `.x` suffix is unique to ARP. Most other rigs (UE, Mixamo) have no center suffix at all.

### Bone Type Prefixes

| Prefix | Type | Exported to FBX? | Purpose |
|--------|------|-------------------|---------|
| `c_` | Controller bone | Only finger controllers | Animatable controls; `c_thumb1.l`, `c_index1.l` are the **deformation** bones for fingers |
| *(none)* | Deformation bone | Yes | Mesh skinning: `arm_stretch`, `thigh_stretch`, `spine_01` |
| `_ref` suffix | Reference bone | No | Alignment guides only, removed after rig generation |

Key point: For fingers specifically, ARP exports the `c_` prefixed bones as the deformation bones. This is an exception to the general rule that `c_` bones are non-deforming controllers.

---

## 2. Stretch Bones

ARP uses `_stretch` suffixed bones as the **primary deformation bones** for limbs:

| ARP Stretch Bone | Anatomical Role | Why "stretch"? |
|------------------|-----------------|----------------|
| `arm_stretch.l/r` | Upper arm | Receives twist bone weights when twist bones are removed for export |
| `forearm_stretch.l/r` | Lower arm / forearm | Same |
| `thigh_stretch.l/r` | Upper leg / thigh | Same |
| `leg_stretch.l/r` | Lower leg / calf | Same |

When ARP exports to FBX without twist bones, vertices weighted to twist bones (`arm_twist`, `forearm_twist`) are transferred to the corresponding `_stretch` bone. The stretch bones are the consolidated deformers that contain both the main rotation and absorbed twist weights.

In the Blender rig, ARP also has non-stretch counterparts (`arm.l`, `forearm.l`) which are internal mechanical bones. Only the `_stretch` variants appear in the exported FBX.

---

## 3. Full Bone Hierarchy (FBX Export)

Based on actual ARP FBX exports:

```
root
  root.x                          # pelvis / hips
    spine_01.x
      spine_02.x
        spine_03.x                # upper chest (ARP can have up to 6 spines for UE5)
          neck.x
            head.x
          shoulder.l
            arm_stretch.l
              forearm_stretch.l
                hand.l
                  c_thumb1.l
                    c_thumb2.l
                      c_thumb3.l
                  c_index1.l
                    c_index2.l
                      c_index3.l
                  c_middle1.l
                    c_middle2.l
                      c_middle3.l
                  c_ring1.l
                    c_ring2.l
                      c_ring3.l
                  c_pinky1.l
                    c_pinky2.l
                      c_pinky3.l
          shoulder.r
            arm_stretch.r
              forearm_stretch.r
                hand.r
                  c_thumb1-3.r
                  c_index1-3.r
                  c_middle1-3.r
                  c_ring1-3.r
                  c_pinky1-3.r
    thigh_stretch.l
      leg_stretch.l
        foot.l
          toes_01.l
    thigh_stretch.r
      leg_stretch.r
        foot.r
          toes_01.r
```

Note: `root` (without suffix) is the top-level motion root. `root.x` is the pelvis/hips bone. Some exports may collapse these into a single `root.x`.

### Optional Twist Bones (if exported)

Twist bones sit as siblings or children of their parent stretch bone:

- `arm_twist.l/r` (near `arm_stretch`)
- `forearm_twist.l/r` (near `forearm_stretch`)
- `thigh_twist.l/r` (near `thigh_stretch`)
- `leg_twist.l/r` (near `leg_stretch`)

Most ARP game exports strip twist bones and fold their weights into the stretch bones.

---

## 4. ARP to VRM Humanoid Bone Mapping

### Core Body

| ARP Bone | VRM Humanoid Bone | Notes |
|----------|-------------------|-------|
| `root.x` | `hips` | Pelvis |
| `spine_01.x` | `spine` | |
| `spine_02.x` | `chest` | |
| `spine_03.x` | `upperChest` | If only 3 spines. With more spines, accumulate extras into upperChest |
| `neck.x` | `neck` | |
| `head.x` | `head` | |

### Arms

| ARP Bone | VRM Humanoid Bone |
|----------|-------------------|
| `shoulder.l` | `leftShoulder` |
| `shoulder.r` | `rightShoulder` |
| `arm_stretch.l` | `leftUpperArm` |
| `arm_stretch.r` | `rightUpperArm` |
| `forearm_stretch.l` | `leftLowerArm` |
| `forearm_stretch.r` | `rightLowerArm` |
| `hand.l` | `leftHand` |
| `hand.r` | `rightHand` |

### Legs

| ARP Bone | VRM Humanoid Bone |
|----------|-------------------|
| `thigh_stretch.l` | `leftUpperLeg` |
| `thigh_stretch.r` | `rightUpperLeg` |
| `leg_stretch.l` | `leftLowerLeg` |
| `leg_stretch.r` | `rightLowerLeg` |
| `foot.l` | `leftFoot` |
| `foot.r` | `rightFoot` |
| `toes_01.l` | `leftToes` |
| `toes_01.r` | `rightToes` |

### Fingers (Left)

| ARP Bone | VRM 1.0 Bone | VRM 0.x Bone |
|----------|-------------|-------------|
| `c_thumb1.l` | `leftThumbMetacarpal` | `leftThumbProximal` |
| `c_thumb2.l` | `leftThumbProximal` | `leftThumbIntermediate` |
| `c_thumb3.l` | `leftThumbDistal` | `leftThumbDistal` |
| `c_index1.l` | `leftIndexProximal` | `leftIndexProximal` |
| `c_index2.l` | `leftIndexIntermediate` | `leftIndexIntermediate` |
| `c_index3.l` | `leftIndexDistal` | `leftIndexDistal` |
| `c_middle1.l` | `leftMiddleProximal` | `leftMiddleProximal` |
| `c_middle2.l` | `leftMiddleIntermediate` | `leftMiddleIntermediate` |
| `c_middle3.l` | `leftMiddleDistal` | `leftMiddleDistal` |
| `c_ring1.l` | `leftRingProximal` | `leftRingProximal` |
| `c_ring2.l` | `leftRingIntermediate` | `leftRingIntermediate` |
| `c_ring3.l` | `leftRingDistal` | `leftRingDistal` |
| `c_pinky1.l` | `leftLittleProximal` | `leftLittleProximal` |
| `c_pinky2.l` | `leftLittleIntermediate` | `leftLittleIntermediate` |
| `c_pinky3.l` | `leftLittleDistal` | `leftLittleDistal` |

Right-side fingers follow the same pattern with `.r` suffix and `right` prefix.

Note: VRM 0.x and 1.0 differ in thumb bone naming. VRM 0.x has no Metacarpal, so the mapping shifts by one. Use `vrm_version_overrides` in the retarget config to handle this.

---

## 5. Rest Pose Conventions

- ARP default: **T-pose** (arms straight out at 90 degrees from torso)
- ARP supports posing into A-pose before export (recommended for UE compatibility)
- "Force Rest Pose Export" is enabled by default in ARP's FBX exporter
- "Apply Pose as Rest Pose" bakes the current pose into the skeleton's rest state

When retargeting ARP to VRM:
- VRM uses a **T-pose** rest convention (arms straight out, palms facing down/inward)
- If the ARP source was exported in A-pose, `rest_pose_offsets` are needed for shoulder/upper arm bones
- ARP A-pose lowers arms ~30-45 degrees from T-pose

---

## 6. Key Differences: ARP vs MetaHuman/UE Skeleton

| Feature | ARP (Blender) | MetaHuman/UE (DHIbody:) |
|---------|---------------|--------------------------|
| **Bone prefix** | None (or `c_` for fingers) | `DHIbody:` prefix on all bones |
| **Side suffix** | `.l` / `.r` | `_l` / `_r` |
| **Center suffix** | `.x` | None |
| **Upper arm** | `arm_stretch.l` | `upperarm_l` |
| **Lower arm** | `forearm_stretch.l` | `lowerarm_l` |
| **Upper leg** | `thigh_stretch.l` | `thigh_l` |
| **Lower leg** | `leg_stretch.l` | `calf_l` |
| **Shoulder** | `shoulder.l` | `clavicle_l` |
| **Pelvis** | `root.x` | `pelvis` |
| **Spine count** | 3 default (up to 6 for UE5) | 5 (`spine_01` through `spine_05`) |
| **Neck** | `neck.x` | `neck_01` |
| **Toes** | `toes_01.l` | `ball_l` |
| **Finger naming** | `c_index1.l` | `index_01_l` |
| **Twist bones** | Optional, often stripped for export | Included (`upperarm_twist_01_l`, `lowerarm_twist_01_l`) |
| **Metacarpals** | Not exported by default | Present (`index_metacarpal_l`, `middle_metacarpal_l`) |
| **Rest pose** | T-pose default, A-pose optional | A-pose (MetaHuman standard) |

### Side-by-Side Mapping (Full Skeleton)

| Anatomical | ARP Name | UE/MetaHuman Name |
|------------|----------|-------------------|
| Pelvis | `root.x` | `pelvis` |
| Spine 1 | `spine_01.x` | `spine_01` |
| Spine 2 | `spine_02.x` | `spine_02` |
| Spine 3 | `spine_03.x` | `spine_03` |
| Neck | `neck.x` | `neck_01` |
| Head | `head.x` | `head` |
| L Shoulder | `shoulder.l` | `clavicle_l` |
| L Upper Arm | `arm_stretch.l` | `upperarm_l` |
| L Lower Arm | `forearm_stretch.l` | `lowerarm_l` |
| L Hand | `hand.l` | `hand_l` |
| L Upper Leg | `thigh_stretch.l` | `thigh_l` |
| L Lower Leg | `leg_stretch.l` | `calf_l` |
| L Foot | `foot.l` | `foot_l` |
| L Toes | `toes_01.l` | `ball_l` |
| L Thumb 1 | `c_thumb1.l` | `thumb_01_l` |
| L Index 1 | `c_index1.l` | `index_01_l` |

---

## 7. Retarget Config Template

Example `cinev_arp_body.json` for use with bevy-vrm retargeter:

```json
{
  "name": "cinev_arp_body",
  "source_prefix": [],
  "root_bone": "root",
  "direct_map": {
    "root.x": "hips",
    "spine_01.x": "spine",
    "spine_02.x": "chest",
    "neck.x": "neck",
    "head.x": "head",
    "shoulder.l": "leftShoulder",
    "shoulder.r": "rightShoulder",
    "arm_stretch.l": "leftUpperArm",
    "arm_stretch.r": "rightUpperArm",
    "forearm_stretch.l": "leftLowerArm",
    "forearm_stretch.r": "rightLowerArm",
    "hand.l": "leftHand",
    "hand.r": "rightHand",
    "thigh_stretch.l": "leftUpperLeg",
    "thigh_stretch.r": "rightUpperLeg",
    "leg_stretch.l": "leftLowerLeg",
    "leg_stretch.r": "rightLowerLeg",
    "foot.l": "leftFoot",
    "foot.r": "rightFoot",
    "toes_01.l": "leftToes",
    "toes_01.r": "rightToes",
    "c_thumb1.l": "leftThumbMetacarpal",
    "c_thumb1.r": "rightThumbMetacarpal",
    "c_thumb2.l": "leftThumbProximal",
    "c_thumb2.r": "rightThumbProximal",
    "c_thumb3.l": "leftThumbDistal",
    "c_thumb3.r": "rightThumbDistal",
    "c_index1.l": "leftIndexProximal",
    "c_index1.r": "rightIndexProximal",
    "c_index2.l": "leftIndexIntermediate",
    "c_index2.r": "rightIndexIntermediate",
    "c_index3.l": "leftIndexDistal",
    "c_index3.r": "rightIndexDistal",
    "c_middle1.l": "leftMiddleProximal",
    "c_middle1.r": "rightMiddleProximal",
    "c_middle2.l": "leftMiddleIntermediate",
    "c_middle2.r": "rightMiddleIntermediate",
    "c_middle3.l": "leftMiddleDistal",
    "c_middle3.r": "rightMiddleDistal",
    "c_ring1.l": "leftRingProximal",
    "c_ring1.r": "rightRingProximal",
    "c_ring2.l": "leftRingIntermediate",
    "c_ring2.r": "rightRingIntermediate",
    "c_ring3.l": "leftRingDistal",
    "c_ring3.r": "rightRingDistal",
    "c_pinky1.l": "leftLittleProximal",
    "c_pinky1.r": "rightLittleProximal",
    "c_pinky2.l": "leftLittleIntermediate",
    "c_pinky2.r": "rightLittleIntermediate",
    "c_pinky3.l": "leftLittleDistal",
    "c_pinky3.r": "rightLittleDistal"
  },
  "rest_pose_offsets": {},
  "rest_pose_preserve": {},
  "accumulate": {},
  "twist_fold": {},
  "ignore_patterns": [],
  "vrm_version_overrides": {
    "0.x": {
      "c_thumb1.l": "leftThumbProximal",
      "c_thumb1.r": "rightThumbProximal",
      "c_thumb2.l": "leftThumbIntermediate",
      "c_thumb2.r": "rightThumbIntermediate"
    },
    "1.0": {
      "c_thumb1.l": "leftThumbMetacarpal",
      "c_thumb1.r": "rightThumbMetacarpal"
    }
  }
}
```

Notes:
- `source_prefix` is empty (ARP exports have no prefix, unlike MetaHuman's `DHIbody:`)
- `rest_pose_offsets` need to be tuned per-character if ARP was exported in A-pose
- If the ARP export has extra spine bones (4+), use `accumulate` to fold them into `upperChest`
- ARP exports have no twist bones by default, so `twist_fold` is empty

---

## Sources

- [AutoRigPro Official Documentation - Auto-Rig](https://www.lucky3d.fr/auto-rig-pro/doc/auto_rig.html)
- [AutoRigPro - Game Engine Export](https://lucky3d.fr/auto-rig-pro/doc/ge_export_doc.html)
- [AutoRigPro - Rig Features](https://www.lucky3d.fr/auto-rig-pro/doc/rig_behaviour_doc.html)
- [AutoRigPro - Remap / Retarget](https://www.lucky3d.fr/auto-rig-pro/doc/remap_doc.html)
- [AutoRigPro - FAQ](https://www.lucky3d.fr/auto-rig-pro/doc/faq.html)
