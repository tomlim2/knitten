# R-018 전신 rest pose audit + validator 보강 — Result

**Branch:** `feat/blender-source-type` (bevy-vrm, R-017 이어서)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
29 passed, 0 failed
```

- integration.rs: 24 tests (기존 21 + 신규 3)
- rq_diagnostics.rs: 5 tests (변경 없음)

신규 테스트:
1. `rest_pose_full_audit` — 3개 FBX(Rush Maya, T2M Female Blender, T2M Male Blender) × female config 전수 측정
2. `rest_pose_auto_generate_offsets` — Rush FBX 기준 delta > 1° 본에 대한 offset 자동 계산 출력
3. `rest_pose_completeness_check` — 현재 config에서 누락된 offset 본 목록 보고

## cargo clippy

```
0 warnings (with -D warnings)
```

---

## 전신 rest pose 측정 테이블 — CINEV Rush (Maya)

| FBX bone | VRM bone | PreRot (deg) | LclRot (deg) | Delta° | Cur Offset | Status |
|----------|----------|-------------|-------------|--------|------------|--------|
| pelvis | hips | (-90.0, -86.4, 90.0) | (2.9, 1.7, -2.8) | 88.4 | none | MISSING |
| spine_01 | spine | (0.0, -0.0, -17.2) | (-0.2, -0.1, 11.7) | 5.6 | none | MISSING |
| spine_02 | chest | (-0.0, 0.0, 6.8) | (-0.4, -0.2, -8.6) | 1.8 | none | MISSING |
| neck_01 | neck | (0.0, -0.0, -25.1) | (-1.3, 0.2, 10.9) | 14.3 | none | MISSING |
| head | head | (0.0, -0.0, 12.3) | (-0.4, -2.8, -1.5) | 11.1 | none | MISSING |
| clavicle_l | leftShoulder | (169.0, 81.6, 156.8) | (-6.3, 5.7, -5.3) | 104.4 | [0.00,0.00,0.38] | HAS_OFS |
| clavicle_r | rightShoulder | (169.0, 81.6, -23.2) | (-7.4, 15.2, -3.5) | 178.2 | [0.00,0.00,-0.38] | HAS_OFS |
| upperarm_l | leftUpperArm | (-4.9, 49.5, -4.1) | (-89.0, -19.0, -4.4) | 98.4 | [0.00,0.00,0.71] | HAS_OFS |
| upperarm_r | rightUpperArm | (-4.9, 49.5, -4.1) | (-85.4, -25.4, -2.6) | 92.6 | [0.00,0.00,-0.71] | HAS_OFS |
| lowerarm_l | leftLowerArm | (0.0, 0.0, -36.7) | (-0.6, 1.1, 41.3) | **4.8** | none | **MISSING** |
| lowerarm_r | rightLowerArm | (0.0, 0.0, -36.7) | (-0.6, 1.1, 40.0) | **3.6** | none | **MISSING** |
| hand_l | leftHand | (-90.0, 4.2, -2.1) | (102.9, 35.1, -0.8) | 39.1 | [-0.67,0.10,-0.08] | HAS_OFS |
| hand_r | rightHand | (-90.0, 4.2, -2.1) | (103.2, 24.1, -9.6) | 30.2 | [0.99,0.20,-0.05] | HAS_OFS |
| thigh_l | leftUpperLeg | (8.5, -1.5, -4.7) | (-3.4, 1.0, 8.8) | 6.6 | none | MISSING |
| thigh_r | rightUpperLeg | (8.5, -1.5, 175.3) | (1.5, 7.2, 6.4) | 177.7 | none | MISSING |
| calf_l | leftLowerLeg | (0.0, 0.0, -1.1) | (0.7, -2.9, -20.8) | 22.0 | none | MISSING |
| calf_r | rightLowerLeg | (0.0, 0.0, -1.1) | (0.4, -2.3, -16.3) | 17.6 | none | MISSING |
| foot_l | leftFoot | (0.7, 2.5, 1.9) | (-3.9, 3.0, 14.9) | 18.0 | none | MISSING |
| foot_r | rightFoot | (0.7, 2.5, 1.9) | (-0.1, -4.1, 12.2) | 14.2 | none | MISSING |
| ball_l | leftToes | (0.0, 0.0, -90.0) | (0.0, -0.0, 0.0) | 90.0 | none | MISSING |
| ball_r | rightToes | (0.0, -0.0, -90.0) | (-0.0, 0.0, 0.0) | 90.0 | none | MISSING |
| thumb_01_l | leftThumbMetacarpal | (48.7, 39.0, 10.7) | (13.1, -6.7, -8.0) | 66.0 | none | MISSING |
| thumb_01_r | rightThumbMetacarpal | (48.7, 39.0, 10.7) | (13.1, -6.7, -8.0) | 66.0 | none | MISSING |
| thumb_02_l | leftThumbProximal | (-0.5, -4.5, 24.4) | (-0.6, 0.5, -8.8) | 16.1 | none | MISSING |
| thumb_02_r | rightThumbProximal | (-0.5, -4.5, 24.4) | (-0.6, 0.5, -8.8) | 16.1 | none | MISSING |
| thumb_03_l | leftThumbDistal | (0.1, 0.2, 14.6) | (0.3, 0.2, -4.5) | 10.1 | none | MISSING |
| thumb_03_r | rightThumbDistal | (0.1, 0.2, 14.6) | (0.3, 0.2, -4.5) | 10.1 | none | MISSING |
| index_01 | leftIndexProximal | (-2.8, -4.1, 20.7) | (4.2, 9.5, -22.9) | 6.2 | none | MISSING |
| index_02 | leftIndexIntermediate | (0.1, 0.2, 16.5) | (-0.8, 0.7, -17.8) | 1.8 | none | MISSING |
| index_03 | leftIndexDistal | (0.0, 0.1, 7.4) | (0.5, 0.6, -14.6) | 7.3 | none | MISSING |
| middle_01 | leftMiddleProximal | (-0.7, -4.7, 19.5) | (-0.6, 2.7, -20.3) | 2.1 | none | MISSING |
| middle_02 | leftMiddleIntermediate | (0.1, 0.5, 15.3) | (0.1, 0.9, -17.9) | 3.0 | none | MISSING |
| middle_03 | leftMiddleDistal | (-0.0, -0.2, 7.9) | (0.3, 0.7, -15.5) | 7.7 | none | MISSING |
| ring_01 | leftRingProximal | (0.8, 1.7, 20.3) | (-1.1, -3.5, -19.5) | 2.0 | none | MISSING |
| ring_02 | leftRingIntermediate | (-0.1, 0.4, 14.0) | (-0.5, 0.9, -22.3) | 8.4 | none | MISSING |
| ring_03 | leftRingDistal | (-0.0, -0.4, 7.3) | (0.1, 0.4, -9.7) | 2.4 | none | MISSING |
| pinky_01_l | leftLittleProximal | (2.5, 5.1, 16.4) | (-10.3, -10.7, -27.8) | 16.6 | none | MISSING |
| pinky_01_r | rightLittleProximal | (2.5, 5.1, 16.4) | (-11.1, -10.6, -41.1) | 28.6 | none | MISSING |
| pinky_02 | leftLittleIntermediate | (-0.1, -0.2, 6.6) | (0.2, 0.5, -13.0) | 6.4 | none | MISSING |
| pinky_03 | leftLittleDistal | (-0.0, -0.1, 16.1) | (0.1, 0.4, -9.7) | 6.5 | none | MISSING |

---

## 누락된 본 목록 (delta > 1°, offset 없음)

**현재 config에 offset이 있는 본 (6개):** leftShoulder, rightShoulder, leftUpperArm, rightUpperArm, leftHand, rightHand

**누락된 본 — 총 45개** (Rush FBX 기준):

### 주요 누락 (delta > 10°)
| VRM bone | Delta° | 비고 |
|----------|--------|------|
| rightShoulder | 178.2 | HAS_OFS but value may be inaccurate |
| rightUpperLeg | 177.7 | 극단적 — 180° 뒤집힘 |
| leftShoulder | 104.4 | HAS_OFS but value may be inaccurate |
| leftUpperArm | 98.4 | HAS_OFS |
| rightUpperArm | 92.6 | HAS_OFS |
| leftToes | 90.0 | -90° Z-axis PreRotation |
| rightToes | 90.0 | -90° Z-axis PreRotation |
| hips | 88.4 | 대형 — 복합 PreRotation |
| leftThumbMetacarpal | 66.0 | 엄지 A-pose 자세 |
| rightThumbMetacarpal | 66.0 | |
| leftHand | 39.1 | HAS_OFS |
| rightHand | 30.2 | HAS_OFS |
| rightLittleProximal | 28.6 | |
| leftLowerLeg | 22.0 | **주의: 무릎 굴곡** |
| leftFoot | 18.0 | |
| rightLowerLeg | 17.6 | |
| leftLittleProximal | 16.6 | |
| leftThumbProximal | 16.1 | |
| rightThumbProximal | 16.1 | |
| neck | 14.3 | |
| rightFoot | 14.2 | |
| head | 11.1 | |
| leftThumbDistal | 10.1 | |
| rightThumbDistal | 10.1 | |

### 소규모 누락 (1° < delta ≤ 10°)
| VRM bone | Delta° |
|----------|--------|
| leftRingIntermediate / rightRingIntermediate | 8.4 |
| leftMiddleDistal / rightMiddleDistal | 7.7 |
| leftIndexDistal / rightIndexDistal | 7.3 |
| leftUpperLeg | 6.6 |
| leftLittleDistal / rightLittleDistal | 6.5 |
| leftLittleIntermediate / rightLittleIntermediate | 6.4 |
| leftIndexProximal / rightIndexProximal | 6.2 |
| spine | 5.6 |
| **leftLowerArm** | **4.8** |
| **rightLowerArm** | **3.6** |
| leftMiddleIntermediate / rightMiddleIntermediate | 3.0 |
| leftRingDistal / rightRingDistal | 2.4 |
| leftMiddleProximal / rightMiddleProximal | 2.1 |
| leftRingProximal / rightRingProximal | 2.0 |
| chest | 1.8 |
| leftIndexIntermediate / rightIndexIntermediate | 1.8 |

**lowerArm 확인됨:** leftLowerArm=4.8°, rightLowerArm=3.6° — 배경에서 언급된 전방 굴곡이 PreRotation -36.7° Z에서 비롯됨. Lcl Rotation이 거의 상쇄하지만 잔차 3-5° 존재.

---

## 자동 생성된 rest_pose_offsets JSON

### CINEV Rush female (Maya FBX 기준)

**주의:** 이 값들은 FBX의 raw PreRotation * LclRotation을 Euler XYZ radians로 변환한 것. hips, thighs, toes, clavicle 등 극단적 delta를 가진 본은 coordinate system 차이 때문이며 rest_pose_offsets로 보정하는 것이 적절하지 않을 수 있음 (retargeter의 three-vrm formula가 coordinate transform을 별도 처리).

```json
"rest_pose_offsets": {
    "chest": [-0.01, -0.00, -0.03],
    "head": [-0.01, -0.05, 0.19],
    "hips": [-0.38, -1.54, 0.43],
    "leftFoot": [-0.05, 0.09, 0.30],
    "leftHand": [0.19, 0.05, -0.65],
    "leftIndexDistal": [0.01, 0.01, -0.13],
    "leftIndexIntermediate": [-0.01, 0.02, -0.02],
    "leftIndexProximal": [0.06, 0.08, -0.04],
    "leftLittleDistal": [0.00, 0.00, 0.11],
    "leftLittleIntermediate": [0.00, 0.00, -0.11],
    "leftLittleProximal": [-0.18, -0.09, -0.20],
    "leftLowerArm": [-0.01, 0.02, 0.08],
    "leftLowerLeg": [0.01, -0.05, -0.38],
    "leftMiddleDistal": [0.01, 0.01, -0.13],
    "leftMiddleIntermediate": [-0.00, 0.02, -0.05],
    "leftMiddleProximal": [0.01, -0.03, -0.01],
    "leftRingDistal": [0.00, 0.00, -0.04],
    "leftRingIntermediate": [-0.01, 0.02, -0.14],
    "leftRingProximal": [-0.02, -0.03, 0.01],
    "leftShoulder": [-3.00, 1.32, -3.09],
    "leftThumbDistal": [0.01, 0.01, 0.18],
    "leftThumbMetacarpal": [0.92, 0.69, -0.05],
    "leftThumbProximal": [-0.01, -0.07, 0.27],
    "leftToes": [0.00, -0.00, -1.57],
    "leftUpperArm": [-1.69, 0.53, -0.12],
    "leftUpperLeg": [0.08, -0.03, 0.07],
    "neck": [-0.02, 0.00, -0.25],
    "rightFoot": [0.02, -0.03, 0.25],
    "rightHand": [0.27, -0.09, -0.46],
    "rightIndexDistal": [0.01, 0.01, -0.13],
    "rightIndexIntermediate": [-0.01, 0.02, -0.02],
    "rightIndexProximal": [0.06, 0.08, -0.04],
    "rightLittleDistal": [0.00, 0.00, 0.11],
    "rightLittleIntermediate": [0.00, 0.00, -0.11],
    "rightLittleProximal": [-0.22, -0.09, -0.43],
    "rightLowerArm": [-0.01, 0.02, 0.06],
    "rightLowerLeg": [0.01, -0.04, -0.30],
    "rightMiddleDistal": [0.01, 0.01, -0.13],
    "rightMiddleIntermediate": [-0.00, 0.02, -0.05],
    "rightMiddleProximal": [0.01, -0.03, -0.01],
    "rightRingDistal": [0.00, 0.00, -0.04],
    "rightRingIntermediate": [-0.01, 0.02, -0.14],
    "rightRingProximal": [-0.02, -0.03, 0.01],
    "rightShoulder": [3.09, 1.16, -0.13],
    "rightThumbDistal": [0.01, 0.01, 0.18],
    "rightThumbMetacarpal": [0.92, 0.69, -0.05],
    "rightThumbProximal": [-0.01, -0.07, 0.27],
    "rightToes": [0.00, 0.00, -1.57],
    "rightUpperArm": [-1.59, 0.42, -0.08],
    "rightUpperLeg": [0.17, 0.08, -3.09],
    "spine": [-0.00, -0.00, -0.10]
}
```

### Male config

T2M Blender Male FBX는 T2M Female과 대부분 동일한 rest rotation을 공유 (같은 MetaHuman rig에서 출력). Female의 auto-generated 값이 Male에도 적용 가능. Rush FBX(Maya)만 male-specific FBX가 없으므로 female 기준 값이 male에도 유효.

---

## 변경 파일 목록

### Rust 소스
1. `crates/cinev_retarget/src/retargeter.rs`
   - `RetargetQuality`에 `rest_pose_missing_offsets: Vec<(String, f32)>` 필드 추가
   - `diagnostics()`에 VRM 0.x 전용 rest_pose missing offset warning 추가
   - `apply()`에서 rest_pose_missing_offsets 계산 로직 (three-vrm normalized rest delta 기반)

### 테스트
2. `crates/cinev_retarget/tests/integration.rs`
   - `rest_pose_full_audit` — 3개 FBX × config 전수 측정 테이블
   - `rest_pose_auto_generate_offsets` — 자동 offset 계산 + JSON 출력
   - `rest_pose_completeness_check` — 누락 본 목록 보고
   - helper: `quat_to_euler_deg()`

---

## 핵심 발견

1. **lowerArm 누락 확인됨:** leftLowerArm=4.8°, rightLowerArm=3.6°. PreRotation -36.7° Z (FBX의 forearm twist axis 보정)와 Lcl Rotation +41°/+40° Z가 거의 상쇄하지만 잔차 존재.

2. **전체 45개 본이 delta > 1°:** 현재 6개만 offset 설정됨. 그러나 대부분은 coordinate system 차이(hips, thighs, toes)이거나 A-pose의 자연스러운 손가락 커브(2-10°)이므로, **모든 본에 offset을 넣는 것은 부적절**.

3. **VRM 0.x에서만 영향:** rest_pose_offsets는 retargeter가 VRM 0.x일 때만 적용. VRM 1.0은 three-vrm formula의 dst rest transform이 처리.

4. **auto-detect_apose가 arm 4쌍을 이미 처리:** leftShoulder→leftUpperArm, rightShoulder→rightUpperArm, leftUpperArm→leftLowerArm, rightUpperArm→rightLowerArm. 이들은 world-space direction 비교로 자동 보정되므로 config offset과 중복 시 SKIPPED.

5. **실질적으로 추가가 필요한 본:** neck, head, spine, chest, lowerLeg, foot — 이들은 auto-detect 범위 밖이며 delta 5-22°. 하지만 실제 VRM 0.x retarget 품질에 미치는 영향은 시각적 검증 필요.
