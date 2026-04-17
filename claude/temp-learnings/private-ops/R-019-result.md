# R-019 보행 관련 본 rest_pose_offsets 추가 — Result

**Branch:** `feat/blender-source-type` (bevy-vrm, R-018 이어서)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
29 passed, 0 failed
```

## cargo clippy

```
0 warnings (with -D warnings)
```

---

## auto_detect_apose 범위

`retargeter.rs:1006-1011`의 `detect_apose()`는 **4개 arm pair만** 처리:

| bone_name (보정 대상) | child_name (방향 참조) |
|----------------------|----------------------|
| leftShoulder | leftUpperArm |
| leftUpperArm | leftLowerArm |
| rightShoulder | rightUpperArm |
| rightUpperArm | rightLowerArm |

보정은 `bone_name` 쪽에 적용됨. 따라서 자동 보정되는 본: **leftShoulder, leftUpperArm, rightShoulder, rightUpperArm** (4개).

이 4개는 이미 `rest_pose_offsets`에도 있지만, `retargeter.rs:437`에서 `apose_corrections`에 이미 있으면 SKIP되므로 중복 적용 안 됨.

---

## 최종 추가된 본 목록 (10개)

| VRM bone | Offset [x, y, z] rad | Delta° (Rush) | 비고 |
|----------|---------------------|---------------|------|
| leftLowerArm | [-0.01, 0.02, 0.08] | 4.8 | 전완 전방 굴곡 잔차 |
| rightLowerArm | [-0.01, 0.02, 0.06] | 3.6 | 동일 |
| spine | [-0.00, -0.00, -0.10] | 5.6 | 척추 전만 |
| chest | [-0.01, -0.00, -0.03] | 1.8 | 흉추 미세 오프셋 |
| neck | [-0.02, 0.00, -0.25] | 14.3 | 경추 전굴 |
| head | [-0.01, -0.05, 0.19] | 11.1 | 두부 각도 보정 |
| leftLowerLeg | [0.01, -0.05, -0.38] | 22.0 | 무릎 굴곡 보정 |
| rightLowerLeg | [0.01, -0.04, -0.30] | 17.6 | 동일 |
| leftFoot | [-0.05, 0.09, 0.30] | 18.0 | 발목 각도 |
| rightFoot | [0.02, -0.03, 0.25] | 14.2 | 동일 |

값 출처: R-018 `rest_pose_auto_generate_offsets` 테스트 (CINEV Rush FBX의 PreRotation * LclRotation → Euler XYZ radians).

---

## 제외된 본 + 이유

| 카테고리 | 본 | Delta° | 제외 이유 |
|---------|---|--------|----------|
| **auto_detect 중복** | leftShoulder, rightShoulder, leftUpperArm, rightUpperArm | 92-178° | detect_apose가 이미 world-space direction 보정. config offset은 SKIP됨. 기존 값 유지 (하위 호환) |
| **coordinate system** | hips | 88.4° | 극단적 PreRotation은 FBX→VRM 좌표계 차이. retargeter의 coord_rot이 처리. offset으로 보정 부적절 |
| **coordinate system** | leftUpperLeg, rightUpperLeg | 6.6°, 177.7° | rightUpperLeg의 177.7°는 180° 반전 (Z축). 좌표계 문제 |
| **coordinate system** | leftToes, rightToes | 90° | -90° Z PreRotation은 FBX의 toe orientation 표현 방식 |
| **손가락 (A-pose 자연 커브)** | thumb*, index*, middle*, ring*, pinky* (30개) | 2-66° | A-pose에서의 자연스러운 손가락 포지션. 보행 품질과 무관. 엄지는 delta 크지만 MetaHuman 고유의 rest pose |
| **leftHand, rightHand** | — | 39°, 30° | 이미 offset 있음 (기존 6개에 포함) |

---

## 변경 파일 목록

1. `assets/retarget/cinev_female_body.json` — rest_pose_offsets에 10개 본 추가 (6→16)
2. `assets/retarget/cinev_male_body.json` — 동일
3. `assets/retarget/cinev_blender_female.json` — 동일
4. `assets/retarget/cinev_blender_male.json` — 동일

Rust 코드 변경 없음.

---

## headless CLI 결과

모든 VRM 모델이 1.0 (0.x 없음). rest_pose_offsets는 VRM 0.x에서만 적용되므로 headless 출력에 변화 없음:

```
[RQ] bones=53 scale=1.016 vrm=1.0 root180=N shoulder=0.67 arm=0.94
[RQ] identity: PASS 52/52
[RQ] GRADE: B (1 warnings, 0 errors)
```

VRM 0.x 모델이 assets에 없어 실제 offset 적용 효과는 확인 불가. VRM 0.x 모델 확보 시 재검증 필요.

---

## rest_pose_completeness_check 변화

| 항목 | Before (R-018) | After (R-019) |
|------|---------------|---------------|
| Offset 있는 본 | 6 | 16 |
| Delta > 1° & offset 없는 본 | 45 | 35 |
| 감소분 | — | -10 (보행 관련 본 전부 커버) |

남은 35개: 손가락 30개 + hips + thighs 2개 + toes 2개 (모두 coordinate system 차이 또는 A-pose 고유 포지션).
