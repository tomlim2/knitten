# Shoulder/Arm Reference Data — xiao_vroid + CINEV FBX

## Animation
- **FBX**: `25_06672_F_DNTSuperSukiShukiRush_260113.fbx` (17.7s, 531 frames, 30fps)
- **VRM**: `xiao_vroid.vrm` (VRM 1.0, VRoid Studio)
- **Reference frames**: f=360-396 (12-13s 구간)

---

## Proportion Comparison

```
[RQ:PROP] vrm_sh=0.198m fbx_sh=0.291m ratio=0.68 | vrm_arm=0.430m fbx_arm=0.459m ratio=0.94
```

| 부위 | MetaHuman (m) | xiao_vroid (m) | 비율 |
|------|:---:|:---:|:---:|
| Hips height | 0.939 | 0.955 | 1.02 |
| **Shoulder width** | **0.291** | **0.198** | **0.68** |
| Arm length | 0.459 | 0.430 | 0.94 |
| Clavicle lateral | 0.054 | 0.022 | 0.41 |
| UpperArm lateral | 0.144 | 0.078 | 0.54 |

---

## VRM Rest Pose (xiao_vroid.vrm)

| Bone | Local Translation | Local Rotation | Node |
|------|:-:|:-:|------|
| hips | (0, 0.955, 0.004) | (0.063, 0, 0, 0.998) | J_Bip_C_Hips |
| spine | (0, 0.053, 0.006) | (0.013, 0, 0, 1.000) | J_Bip_C_Spine |
| chest | (0, 0.111, -0.014) | (-0.136, 0, 0, 0.991) | J_Bip_C_Chest |
| upperChest | (0, 0.108, -0.001) | (-0.108, 0, 0, 0.994) | J_Bip_C_UpperChest |
| leftShoulder | (0.022, 0.109, 0.007) | (0.168, 0.012, -0.070, 0.983) | J_Bip_L_Shoulder |
| rightShoulder | (-0.022, 0.109, 0.007) | (0.168, -0.012, 0.070, 0.983) | J_Bip_R_Shoulder |
| **leftUpperArm** | **(0.078, 0, 0)** | **(0, 0, 0.071, 0.998)** | J_Bip_L_UpperArm |
| **rightUpperArm** | **(-0.078, 0, 0)** | **(0, 0, -0.071, 0.998)** | J_Bip_R_UpperArm |
| leftLowerArm | (0.221, 0, 0) | identity | J_Bip_L_LowerArm |
| rightLowerArm | (-0.221, 0, 0) | identity | J_Bip_R_LowerArm |
| leftHand | (0.209, 0, 0) | identity | J_Bip_L_Hand |
| rightHand | (-0.209, 0, 0) | identity | J_Bip_R_Hand |

---

## FBX Rest Pose (MetaHuman CINEV)

| Bone | PreRot (°) | LclRest (°) | Translation (cm, UE Z-up) |
|------|:---:|:---:|:-:|
| pelvis | 90.1 | 4.4 | (-1.9, -4.7, 93.9) |
| spine_01 | 17.2 | 11.7 | (2.4, 0, 0) |
| spine_02 | 6.8 | 8.6 | (4.5, -0.5, 0) |
| clavicle_l | 98.6 | 9.8 | (5.4, 0.9, -0.7) |
| **upperarm_l** | **49.7** | **91.4** | **(14.4, -0.2, 0.7)** |
| lowerarm_l | 36.7 | 41.3 | (22.9, 0.6, 0.2) |
| hand_l | 90.1 | 107.3 | (22.9, -1.2, 0.6) |
| clavicle_r | 186.8 | 17.1 | (5.4, 0.9, 0.8) |
| **upperarm_r** | **49.7** | **89.0** | **(-14.3, 0.2, -0.7)** |
| lowerarm_r | 36.7 | 40.1 | (-22.9, -0.6, -0.2) |
| hand_r | 90.1 | 107.4 | (-22.9, 1.2, -0.6) |

---

## RQ Logs at 12-13s (f=360-396)

### Per-frame (Tier 1)
```
[RQ] f=366 hips=0.05m lUL=8° lLL=16° lUA=4° lLA=10° spine=10° elbow=0.15m
[RQ] f=376 hips=0.06m lUL=8° lLL=15° lUA=10° lLA=13° spine=11° elbow=0.09m
[RQ] f=386 hips=0.05m lUL=8° lLL=15° lUA=13° lLA=12° spine=10° elbow=0.10m
[RQ] f=396 hips=0.05m lUL=8° lLL=15° lUA=9° lLA=7° spine=10° elbow=0.17m
```

### Full snapshot (Tier 2)
```
[RQ:ALL] f=366 hips=15° spine=10° chest=14° neck=4° lSh=5° rSh=3° lUA=4° rUA=15° lLA=10° rLA=19° lUL=8° rUL=6° lLL=16° rLL=12°
[RQ:ALL] f=376 hips=14° spine=11° chest=13° neck=4° lSh=4° rSh=3° lUA=10° rUA=6° lLA=13° rLA=12° lUL=8° rUL=7° lLL=15° rLL=12°
```

### Wrist (WRIST diagnostic)
```
[RQ:WRIST] f=366 L vrm=43° fbx=50° diff=-7° twist=318°
[RQ:WRIST] f=366 R vrm=31° fbx=13° diff=+18° twist=32°
[RQ:WRIST] f=376 L vrm=34° fbx=20° diff=+13° twist=34°
[RQ:WRIST] f=386 L vrm=26° fbx=26° diff=-1° twist=25°
```

---

## Key Observations at 12-13s

1. **Elbow distance**: 0.09-0.17m — 팔꿈치가 가까움 (shoulder compensation 9° 적용 후)
2. **좌우 비대칭**: lUA=4° vs rUA=15° (f=366) — 오른팔이 더 큰 에러
3. **Wrist**: R쪽 over-flex +18° 지속
4. **Spine/legs**: 안정적 (8-16°)

## Current Shoulder Compensation
- `shoulder_ratio = 0.68`
- `offset = (1.0 - 0.68) * 0.5 = 0.16 rad ≈ 9°`
- Z축 rotation으로 upperArm을 바깥으로 push
- **효과**: elbow min 0.02m → 0.06m (부분 개선)
