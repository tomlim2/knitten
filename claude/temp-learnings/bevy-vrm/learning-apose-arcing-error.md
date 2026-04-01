# FK Arcing Error — Serial Chain의 Rotation-Only Correction 한계

Date: 2026-03-31 ~ 2026-04-01

## 문제

MetaHuman FBX(A-pose) → VRM(T-pose) retarget에서 arm bone에 78° correction 적용 시, FK chain의 spine X-tilt(23°)와 결합하여 hand가 ~5-8cm Z 방향으로 밀림.

## 10+ 가설 실험 (전부 실패)

| # | 접근 | 결과 | 실패 원인 |
|---|------|:----:|-----------|
| 1 | from_rotation_arc + parent_global basis | ❌ | ~5cm Z arcing error |
| 2 | from_rotation_arc + bone_global basis | ❌ | 동일 |
| 3 | from_rotation_arc + dst_rest_global basis | ❌ | 동일 |
| 4 | XY projection (pure Z축 rotation) | ❌ | 악화 |
| 5 | Up-vector constraint (look_rotation + world up) | △ | 미미한 개선 (~4mm) |
| 6 | FBX local rest rotation 직접 사용 | ❌ | MetaHuman bone convention 불일치 |
| 7 | bone_rest_yup → dst_rest_global 교체 | ❌ | 동일 불일치 |
| 8 | FK inverse (parent world 역산) | ❌ | twist 한계 동일 |
| 9 | src_rest injection | ❌ | 좌우 비대칭 space mismatch |
| 10 | Translation offset (arcing compensation) | △ | CLI에서 Z NEUTRAL, viewer에서 bone-mesh 분리 |
| 11 | Chain propagation (parent+bone rest 동시 수정) | ❌ | three-vrm formula invariant로 상쇄 |

## 근본 원인

```
arcing error = L × sin(78°) × sin(23°) ≈ 7.5cm/segment
```

rotation-only correction이 FK hierarchy에서 parent의 tilt(spine X-tilt 23°)와 결합하여 child position에 간섭. 이건 serial manipulator의 **kinematic coupling** — 수학적으로 제거 불가능.

## 분야별 분석: 왜 joint space 보정이 안 되는가

### 로보틱스 관점
- spine → shoulder → upperArm → lowerArm → hand = **5-DOF serial manipulator**와 동일 구조
- Serial manipulator에서 개별 joint rotation 수정은 "joint-level compensation" — coupling effect 때문에 end-effector position 오차 제거 불가 (수학적으로 증명된 사실)
- 해법: **task space**(end-effector position)에서 목표 정의 후 **IK로 joint space 역산**

### 의료장비 관점
- 수술 로봇(da Vinci 등)에서 정확히 같은 문제: 1mm 오차 = 환자 위험
- **Analytical 2-Bone IK**: end-effector 목표 위치에서 cosine rule로 joint angle 역산. closed-form solution — iteration 불필요
- **Damped Least Squares (DLS)**: singularity(팔 완전 extension) 근처에서 damping factor 추가

### 우주 산업 관점
- ISS Canadarm2 (17.6m): 1° joint 오차 → end-effector 30cm 벗어남 — 스케일만 다르고 현상 동일
- **Resolved Motion Rate Control (RMRC)**: 매 control cycle마다 Jacobian inverse로 task space에서 보정
- 위성 자세 제어의 **cross-coupling torque**도 같은 현상: reaction wheel 하나 돌리면 다른 축에 간섭

### 공통 결론

> **Joint space에서 개별 보정하지 말고, task space에서 목표를 정의한 뒤 역산하라.**

| 분야 | 왜 이 원칙을 쓰는가 | 오차 스케일 |
|------|---------------------|------------|
| 의료 (수술 로봇) | 1mm 오차 = 환자 위험 | cm |
| 우주 (Canadarm2) | 30cm 오차 = 도킹 실패 | m |
| VRM retarget | 5cm 오차 = 팔 뒤로 밀림 | cm |

## 해법: 2-Bone IK Post-Correction

```
1. FK correction 적용 (현재 detect_apose — 대략적 방향 맞추기)
2. FK로 hand world position 계산 → 현재 위치 (arcing error 포함)
3. FBX의 hand world position → 목표 위치
4. upperArm + lowerArm 길이로 2-bone IK 풀기 (cosine rule)
5. 결과 rotation으로 upperArm, lowerArm 교체
```

- **rotation만 수정** → skinning 안전 (translation 보정의 bone-mesh 분리 문제 없음)
- **closed-form** → iteration 없이 정확
- 게임 엔진(UE5 TwoBoneIK), 수술 로봇(da Vinci), 우주 로봇(Canadarm2) 전부에서 쓰는 표준 패턴

## 핵심 교훈

- FK chain에서 rotation-only correction은 parent tilt와의 coupling으로 인해 end-effector position 오차 발생 — 이건 10번 시도해도 안 됨
- "계층 구조의 종속성을 일시적으로 끊고 전역 기준으로 재조립" = kinematic decoupling + IK
- 문제를 joint space가 아닌 task space에서 정의하면 해법이 자명해짐
