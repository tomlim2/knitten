# StoryPreviz Skeleton Analysis

## Project Type

- **Stack:** React + Three.js (React Three Fiber) frontend, FastAPI backend
- **Renderer:** Three.js FBXLoader via `@react-three/drei` useFBX
- **Character Models:** FBX binary format (male/female variants)
- **Animation Source:** T2M API (text-to-motion) → returns FBX files with baked animation
- **No retarget code:** FBX animations play directly on matching skeleton via Three.js AnimationMixer

## Skeleton Type

**UE MetaHuman (Digital Human Initiative) skeleton** with `DHIbody:` prefix.

- 84 unique bones per character (male = female, identical set)
- Prefix: `DHIbody:` (e.g., `DHIbody:pelvis`, `DHIbody:spine_01`)
- Convention: UE4/UE5 MetaHuman body skeleton naming
- NOT Mixamo, NOT VRM humanoid, NOT SMPL

## Bone Hierarchy (main chain)

```
root
└─ pelvis
   ├─ spine_01
   │  └─ spine_02
   │     └─ spine_03
   │        └─ spine_04
   │           └─ spine_05
   │              ├─ neck_01
   │              │  └─ neck_02
   │              │     └─ head
   │              ├─ clavicle_l
   │              │  └─ upperarm_l
   │              │     └─ lowerarm_l
   │              │        └─ hand_l
   │              │           ├─ thumb_01_l → 02 → 03
   │              │           ├─ index_metacarpal_l → 01 → 02 → 03
   │              │           ├─ middle_metacarpal_l → 01 → 02 → 03
   │              │           ├─ ring_metacarpal_l → 01 → 02 → 03
   │              │           └─ pinky_metacarpal_l → 01 → 02 → 03
   │              └─ clavicle_r (mirror)
   ├─ thigh_l
   │  └─ calf_l
   │     └─ foot_l
   │        └─ ball_l
   │           ├─ bigtoe_01_l → 02
   │           ├─ indextoe_01_l → 02
   │           ├─ middletoe_01_l → 02
   │           ├─ ringtoe_01_l → 02
   │           └─ littletoe_01_l → 02
   └─ thigh_r (mirror)
```

## Full Bone List (84 bones, no prefix)

### Core chain (16)
root, pelvis, spine_01, spine_02, spine_03, spine_04, spine_05, neck_01, neck_02, head, clavicle_l, clavicle_r, upperarm_l, upperarm_r, lowerarm_l, lowerarm_r

### Hands (30)
hand_l, hand_r, thumb_01/02/03_l/r, index_metacarpal_l/r, index_01/02/03_l/r, middle_metacarpal_l/r, middle_01/02/03_l/r, ring_metacarpal_l/r, ring_01/02/03_l/r, pinky_metacarpal_l/r, pinky_01/02/03_l/r

### Legs (8)
thigh_l, thigh_r, calf_l, calf_r, foot_l, foot_r, ball_l, ball_r

### Toes (20)
bigtoe_01/02_l/r, indextoe_01/02_l/r, middletoe_01/02_l/r, ringtoe_01/02_l/r, littletoe_01/02_l/r

### IK targets (10 — present in FBX but not animated)
ik_foot_root, ik_foot_l, ik_foot_r, ik_hand_root, ik_hand_gun, ik_hand_l, ik_hand_r, interaction, center_of_mass (exact names may vary)

## VRM Humanoid Bone Mapping

| VRM 1.0 | MetaHuman (DHIbody:) | Notes |
|---------|---------------------|-------|
| hips | pelvis | |
| spine | spine_01 | MetaHuman has 5 spine bones |
| chest | spine_03 | |
| upperChest | spine_05 | |
| neck | neck_01 | MetaHuman has neck_01 + neck_02 |
| head | head | |
| leftShoulder | clavicle_l | |
| rightShoulder | clavicle_r | |
| leftUpperArm | upperarm_l | |
| rightUpperArm | upperarm_r | |
| leftLowerArm | lowerarm_l | |
| rightLowerArm | lowerarm_r | |
| leftHand | hand_l | |
| rightHand | hand_r | |
| leftUpperLeg | thigh_l | |
| rightUpperLeg | thigh_r | |
| leftLowerLeg | calf_l | |
| rightLowerLeg | calf_r | |
| leftFoot | foot_l | |
| rightFoot | foot_r | |
| leftToes | ball_l | |
| rightToes | ball_r | |
| leftThumbMetacarpal | thumb_01_l | |
| leftThumbProximal | thumb_02_l | |
| leftThumbDistal | thumb_03_l | |
| leftIndexProximal | index_01_l | |
| leftIndexIntermediate | index_02_l | |
| leftIndexDistal | index_03_l | |
| leftMiddleProximal | middle_01_l | |
| leftMiddleIntermediate | middle_02_l | |
| leftMiddleDistal | middle_03_l | |
| leftRingProximal | ring_01_l | |
| leftRingIntermediate | ring_02_l | |
| leftRingDistal | ring_03_l | |
| leftLittleProximal | pinky_01_l | |
| leftLittleIntermediate | pinky_02_l | |
| leftLittleDistal | pinky_03_l | |

Right side mirrors left. VRM has no `_metacarpal` for index/middle/ring/pinky.

## Retarget Considerations

1. **Spine mismatch:** MetaHuman has 5 spine bones (01-05), VRM has 2-4 (spine, chest, upperChest). Need distribution or skipping.
2. **Neck mismatch:** MetaHuman has 2 neck bones, VRM has 1. Merge neck_01+neck_02 or use neck_01 only.
3. **Root bone:** MetaHuman `root` → VRM has no explicit root bone (hips is root). Translation goes to hips.
4. **DHIbody: prefix:** Must strip prefix when matching. T2M FBX uses `DHIbody:` prefix in bone names.
5. **Metacarpal bones:** MetaHuman has index/middle/ring/pinky metacarpals, VRM does not. Skip these.
6. **Toe bones:** MetaHuman has 5 individual toes × 2 phalanges. VRM has only leftToes/rightToes. Ignore individual toes.
7. **Coordinate system:** FBX Z-up vs VRM Y-up. Standard FBX→glTF coordinate conversion needed.
8. **T2M animations:** Generated FBX may have subset of bones (body only, no fingers/toes). Verify at runtime.

## T2M API Flow

```
Text prompt → T2M API (internal server) → FBX binary (hex-encoded) → Three.js FBXLoader → AnimationMixer
```

- No retarget in current pipeline — T2M outputs FBX matching the DHI skeleton directly
- For VRM integration, retarget is required: VRM skeleton ≠ MetaHuman skeleton
