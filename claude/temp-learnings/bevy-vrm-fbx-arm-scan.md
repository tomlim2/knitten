# FBX Arm/Hand Bone Scan: 25_06672_F_DNTSuperSukiShukiRush

## Source
- File: `25_06672_F_DNTSuperSukiShukiRush_260113.fbx`
- Total bones: 84 (prefix: `DHIbody:`)
- **Twist bones: NONE** (no upperarm_twist, lowerarm_twist, hand_twist)

## Critical Finding
**이 FBX에는 twist bone이 없다.** `twist_fold` config가 매칭할 본이 없어 twist distribution 코드가 no-op.
wrist crease의 원인은 twist fold가 아니라 **hand bone의 큰 rest rotation** (PreRot=90°, LclRest=107°).

## Left Arm Chain

| Bone | PreRot | LclRest | Translation (cm) | Anim |
|------|--------|---------|-------------------|------|
| clavicle_l | 98.6° | 9.8° | (5.4, 0.9, -0.7) | ✓ |
| upperarm_l | 49.7° | 91.4° | (14.4, -0.2, 0.7) | ✓ |
| lowerarm_l | 36.7° | 41.3° | (22.9, 0.6, 0.2) | ✓ |
| **hand_l** | **90.1°** | **107.3°** | (22.9, -1.2, 0.6) | ✓ |

## Right Arm Chain

| Bone | PreRot | LclRest | Translation (cm) | Anim |
|------|--------|---------|-------------------|------|
| clavicle_r | 186.8° | 17.1° | (5.4, 0.9, 0.8) | ✓ |
| upperarm_r | 49.7° | 89.0° | (-14.3, 0.2, -0.7) | ✓ |
| lowerarm_r | 36.7° | 40.1° | (-22.9, -0.6, -0.2) | ✓ |
| **hand_r** | **90.1°** | **107.4°** | (-22.9, 1.2, -0.6) | ✓ |

## Left Hand Fingers

| Bone | PreRot | LclRest | Translation (cm) |
|------|--------|---------|-------------------|
| index_metacarpal_l | 6.5° | 0.0° | (2.2, -0.7, -1.8) |
| index_01_l | 21.2° | 25.5° | (4.0, 0.1, -0.2) |
| index_02_l | 16.5° | 17.8° | (3.2, -0.2, -0.1) |
| index_03_l | 7.4° | 14.6° | (1.9, 0.1, -0.1) |
| middle_metacarpal_l | 14.5° | 0.0° | (2.3, -0.9, -0.5) |
| middle_01_l | 20.0° | 20.5° | (4.0, 0.3, 0.0) |
| middle_02_l | 15.3° | 18.0° | (4.2, -0.1, -0.2) |
| middle_03_l | 7.9° | 15.5° | (2.0, 0.3, 0.0) |
| ring_metacarpal_l | 23.3° | 0.0° | (2.3, -0.6, 0.5) |
| ring_01_l | 20.3° | 19.9° | (3.8, 0.4, -0.3) |
| ring_02_l | 14.1° | 22.3° | (3.6, -0.3, 0.0) |
| ring_03_l | 7.3° | 9.7° | (2.0, 0.1, 0.0) |
| pinky_metacarpal_l | 32.6° | 0.0° | (2.3, -0.2, 1.4) |
| pinky_01_l | 17.2° | 32.3° | (3.7, 0.4, -0.1) |
| pinky_02_l | 6.6° | 13.0° | (2.7, -0.1, -0.1) |
| pinky_03_l | 16.1° | 9.7° | (1.7, 0.2, 0.0) |
| thumb_01_l | 59.5° | 16.4° | (1.5, 0.5, -2.5) |
| thumb_02_l | 24.8° | 8.9° | (3.7, 0.1, 0.1) |
| thumb_03_l | 14.6° | 4.5° | (2.2, -0.2, -0.1) |

## Key Observations

1. **hand_l/r PreRot=90° + LclRest=107°** → full rest rotation = PreRot × LclRest ≈ 140°+
   - 이 큰 rest rotation이 three-vrm 공식에서 VRM의 identity rest와 차이를 만듬
   - Identity test는 PASS하지만, 애니메이션 중 이 rest 차이가 bend로 누출

2. **Metacarpal bones: LclRest=0°** → rest에서 움직임 없음, PreRot만 있음
   - 무시해도 안전 (현재 ignore_patterns으로 처리 중)

3. **좌우 대칭**: PreRot 값 동일, translation은 부호 반전

4. **Twist bones 부재**: 이 FBX는 stripped skeleton (CINEV export)
   - twist_fold config는 이 FBX에서 효과 없음
   - twist 관련 수정이 모두 무의미했던 이유

## Skinning Weight (xiao_vroid.vrm)

| Bone | Verts | Avg Weight | Transition |
|------|-------|------------|------------|
| leftLowerArm | 493 | 0.577 | |
| leftHand | 249 | 0.407 | |
| **BOTH** | **90** | — | **12.1%** |

VRM mesh의 wrist transition은 90 verts / 12.1% — MetaHuman 대비 얇음.
