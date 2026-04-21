---
title: "Finger retarget: rebasis approaches & palm normal survey"
tags: [bevy-vrm, retarget, finger, rebasis]
created: 2026-04-07
---

# Finger Retarget: Rebasis Approaches

## Problem

Three-vrm formula의 `parentRestWorld`에 FBX arm A-pose가 포함되어 finger curl axis가 ~60-90° 틀어짐. Curl magnitude는 100% 전달되지만 방향이 잘못됨.

## 시도한 접근법

### 1. World-space delta (Wicked Engine 방식) — 실패

```
src_diff = fbx_anim_world × fbx_rest_world⁻¹
tgt_world = src_diff × vrm_rest_global
tgt_local = vrm_parent_rest⁻¹ × tgt_world
```

**실패 원인**: Intermediate/Distal bone의 parent가 animated 상태라서 `vrm_parent_rest⁻¹ × tgt_world`가 틀림. Proximal만 맞고 하위 segment에서 깨짐.

### 2. Local-delta (FBX world rotation에서 local 역산) — 실패

```
fbx_local = parent_world⁻¹ × bone_world
delta = local_rest⁻¹ × local_anim
result = coord_rot × delta × coord_rot⁻¹
```

**실패 원인**: `delta = lcl_rot_rest⁻¹ × anim_quat`만 추출. PreRotation conjugation이 누락되어 bone-local space에서의 delta가 VRM space에 맞지 않음. 수학적으로 `coord × pre_rot × delta × pre_rot⁻¹ × coord⁻¹`이어야 하는데 `coord × delta × coord⁻¹`만 계산.

### 3. Hand rebasis conjugation — 부분 성공 (현재 사용)

```
rebasis = vrm_hand_orient × fbx_hand_orient⁻¹
result = rebasis × three_vrm_result × rebasis⁻¹
```

Three-vrm 결과를 rebasis로 conjugate하면 arm A-pose → T-pose 변환. 수학적으로 `parentRestWorld`과 `boneRestWorld`의 arm chain 부분을 VRM arm chain으로 교체하는 것과 동일.

**결과:**
- Rotation axis error: 60-90° → **10-17°**
- Rotation magnitude: **100%** 전달
- Bone direction (rest): **9-23°** (Proximal), 37-54° (Intermediate, FK 누적)
- 단, animated finger에서 ~10° axis 오차가 Z 방향 반전으로 나타남 (뒤로 꺾이는 현상)

### 4. Per-finger direction correction — 실패

Rebasis 후 잔여 axis 오차를 `from_rotation_arc`로 보정 시도.

**실패 원인**: FBX world direction에 A-pose arm이 포함되어 rebasis와 이중 보정. FBX direction을 rebased space로 변환해야 하는데, 이 변환 자체가 rebasis에 의존하는 순환 문제.

## Position-based Hand Orientation

Hand rebasis 계산에 bone positions 사용 (forward + palm normal + side axis):

```rust
let fwd = (middle_pos - hand_pos).normalize();
let palm_n = to_index.cross(to_ring).normalize(); // or vice versa
let side_v = fwd.cross(palm_n).normalize();
let up = side_v.cross(fwd).normalize();
let orient = Quat::from_mat3(&Mat3::from_cols(fwd, up, side_v));
```

FBX와 VRM 양쪽에 같은 방식 적용 → rebasis = vrm_orient × fbx_orient⁻¹

## Palm Normal Convention Survey

Convention `(0, -1, 0)`과의 각도 차이:

| Model Type | Model | Conv° |
|------------|-------|-------|
| VRoid 1.x | vroid_1x_m_c_normal | 6.4° |
| VRoid 1.x | vroid_1x_f_xiao | 6.6° |
| VRoid 1.x | vroid_1x_f_m_small | 6.4° |
| VRoid 1.x | vroid_1x_m_g_small | 6.5° |
| VRoid 0.x | vroid_0x_f_minjoon | 6.9° |
| VRM 0.x | vrm_0x_f_yoya | 8.2° |
| VRM 0.x | vrm_0x_m_ghostpumpking | 20.1° |
| PMX→VRM | p2v_0x_m_phainon | **42.3°** |
| Custom | CoolBanana | 1.8° |
| Zepeto | zepeto_1x_m_001 | 2.3° |

**결론:**
- VRoid 모델: 6.4-6.9° → convention 사용 가능
- PMX 변환 모델: 42° → convention 불가, position 기반 필수
- Finger spread: 전 모델 23-29° (일관적)

## 실험 결과 (A-H)

실험으로 backward curl 원인 분리:
- A (middle dir only), B (convention palm), C (slerp 0.5), D (proximal only), E (no swing-twist): 모두 6 backward — rebasis 변형은 무관
- F (no rebasis, dst_rest only): 4 backward — three-vrm 자체 문제
- G (rebasis, no dst_rest): 6 backward — rebasis가 2개 추가
- H (no rebasis, no dst_rest): 4 backward — three-vrm `parentRest` conjugation이 근본 원인

**Local-delta + PreRotation conjugation**: backward 6→1, 하지만 direction 39-74° (나쁨)

## 남은 과제

1. **Three-vrm parentRest conjugation이 Intermediate Z를 뒤집는 근본 문제**
2. Local-delta는 backward 해결하지만 direction accuracy 희생
3. 둘 다 잡는 hybrid 접근 필요 (next session)

## CLI 검증 도구

- `finger-diag`: bone direction(FK world), axis error, curl magnitude 비교
- `palm-check`: VRM palm normal convention 조사
