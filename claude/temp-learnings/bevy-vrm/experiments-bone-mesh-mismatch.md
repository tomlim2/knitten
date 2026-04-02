---
project: bevy-vrm
topic: bone-mesh-mismatch
started: 2026-04-02
baseline-commit: a689ce0
---

# Experiments: bevy-vrm / bone-mesh-mismatch

## Goal

VRM 1.x 모델에서 bone gizmo 위치/방향은 정확한데 mesh(skinned vertex)가 따라오지 않는 현상 해결.

## Problem Report

### 현상
- **모델**: vroid_1x_f_xiao.vrm (VRM 1.0)
- **FBX**: t2m_m_wave.fbx (Blender mocap)
- Bone skeleton(cyan gizmo): hand→middleFinger 방향이 FBX source(yellow)와 일치 (<10° 초록 indicator)
- Mesh(살색): bone 위치와 다른 곳에 렌더링됨. 손이 아래로 처져있음
- CLI 수치: direction error 0.0° — 수치상 완벽하지만 visual 불일치

### 스크린샷 관찰
- 왼손: bone gizmo는 손가락 방향으로 펴져있는데, mesh는 그보다 아래로 처짐
- bone과 mesh 사이에 ~30-50° 정도 회전 차이 (목측)

### 가능한 원인
1. **Bevy skinning formula 불일치**: `joint_matrix = joint_global * IBM` — joint_global이 animation에서 올바르게 업데이트되지 않음
2. **AnimationClip 적용 방식**: retarget이 local rotation을 생성하지만 Bevy가 다른 space에서 적용
3. **VRM 1.0 rest transform**: `dst_rest_local × dst_rest_global⁻¹ × normalized × dst_rest_global` 공식에서 hand 영역의 rest가 부정확
4. **IK2 결과가 Bevy animation에 올바르게 전달되지 않음**: ik_retarget가 bones를 수정하지만 AnimationClip으로 변환 시 정보 손실

### 실험 방향
- EXP-001: IK2를 비활성화하고 pure FK만으로 mesh 일치 확인 → IK2가 원인인지 분리
- EXP-002: hand bone의 rest_local vs AnimationClip keyframe 값 비교
- EXP-003: Bevy에서 hand bone의 GlobalTransform vs skinning 결과 비교

## Baseline

| Metric | Value |
|--------|-------|
| CLI direction error (L) | 0.0° |
| CLI direction error (R) | 0.0° |
| CLI position error (L) | 0.3cm |
| CLI position error (R) | 0.2cm |
| Visual bone-mesh offset (L) | ~30-50° (목측) |
| Visual bone-mesh offset (R) | 비교 불가 (FBX 위치 차이) |
| VRM version | 1.0 |
| Retarget grade | B |

---

## EXP-001: IK2 비활성화로 원인 분리

- **Status**: `active`
- **Hypothesis**: If IK2를 끄고 pure FK(cinev_retarget only)만 적용하면, bone-mesh 불일치가 사라질 것. 그렇다면 IK2의 rotation 수정이 Bevy skinning과 호환되지 않는 것.
- **Fail threshold**: FK only에서도 동일한 bone-mesh 불일치 → IK2가 아닌 다른 원인

### Params
| File | Change | Before | After |
|------|--------|--------|-------|
| src/main.rs | IK2 post-pass 주석 처리 | IK2 enabled | IK2 disabled |

### Metrics
| Metric | Before (IK2 on) | After (IK2 off) | Delta |
|--------|-----------------|-----------------|-------|
| Visual bone-mesh offset (L) | ~30-50° | ~30-50° | 없음 |
| Green indicator | <10° | <10° | 없음 |

### Conclusion
IK2는 원인이 아님. FK only에서도 동일한 bone-mesh 불일치 발생. 문제는 cinev_retarget FK 결과 → Bevy AnimationClip 변환, 또는 Bevy skinning 자체.

### Next
→ EXP-002: AnimationClip 적용 space 검증

---

## EXP-002: VRM 1.0 hand rest rotation 검증

- **Status**: `succeeded` (원인 발견)
- **Hypothesis**: VRM 1.0 hand bone의 rest_local이 특수한 값이라 retarget 공식과 skinning 사이에 mismatch 발생

### Metrics
| Metric | Value |
|--------|-------|
| leftHand vrm_local | (0, 0, 0, 1) = **identity** |
| rightHand vrm_local | (0, 0, 0, 1) = **identity** |
| leftHand vrm_global | (0, 0, 0, 1) = **identity** |
| rightHand vrm_global | (0, 0, 0, 1) = **identity** |
| FBX leftHand global_yup | (-0.486, 0.423, -0.498, 0.580) |
| FBX rightHand global_yup | (-0.610, -0.646, -0.245, -0.388) |
| REST fwd_err L | 21.2° |
| REST fwd_err R | 41.2° |

### Conclusion
VRM 1.0 hand bone rest = identity. glTF에서 bone은 "방향 없이 위치만" 가짐.
Bone gizmo(GlobalTransform)는 animation rotation이 올바르게 적용되어 보이지만,
skinning은 IBM(Inverse Bind Matrix) 기준으로 vertex를 변환하므로
bone의 "논리적 방향"과 "mesh가 바라보는 방향"이 다를 수 있음.

**핵심**: retarget 공식의 `dst_rest_local × dst_rest_global⁻¹ × normalized × dst_rest_global`에서
dst_rest가 identity이면 normalized 그대로 통과 → FBX의 bone orientation이
VRM의 bone orientation과 다른 부분이 보정되지 않음.

### Next
→ EXP-003: retarget formula가 identity rest에서 정확한지 수학적 검증

---

## EXP-003: identity rest에서의 three-vrm 공식 분석

- **Status**: `active`
- **Hypothesis**: VRM 1.0 hand의 rest가 identity일 때, three-vrm 공식이
`normalized = parent_rest_src × anim_local × bone_rest_src⁻¹` 자체를 그대로 출력.
이 normalized는 FBX 좌표계 기준이므로 VRM mesh의 bind pose와 맞지 않음.
rest가 non-identity인 bone(예: upperArm)에서는 `dst_rest` 항이 보정하지만,
identity rest에서는 보정이 사라짐.
- **Fail threshold**: identity rest에서도 공식이 올바르다면 → skinning/IBM 검증으로 전환

### Analysis

**Three-vrm formula with identity rest (VRM 1.0 hand):**
```
dst_rest_local = I, dst_rest_global = I

result = I × I⁻¹ × normalized × I = normalized
       = parent_rest_src × anim_local × bone_rest_src⁻¹
```

→ VRM target 보정 항(dst_rest)이 완전히 사라짐. FBX normalized rotation이 그대로 출력.

**VRM 1.0 (vroid_1x_f_xiao) arm chain rest values:**

| Bone | vrm_local | Identity? |
|------|-----------|-----------|
| leftShoulder | (0.168, 0.012, -0.070, 0.983) | No |
| leftUpperArm | (0.000, 0.000, 0.071, 0.998) | ~Yes |
| leftLowerArm | (0.000, 0.000, 0.000, 1.000) | **Yes** |
| leftHand | (0.000, 0.000, 0.000, 1.000) | **Yes** |

LowerArm + Hand 둘 다 identity → three-vrm 보정 없음.
Bone gizmo(GlobalTransform)는 animation이 올바르게 반영되지만,
mesh skinning은 IBM 기준이므로 bone "논리적 축"이 아닌 "rest world 기준"으로 deform.

### Conclusion
Identity rest에서 three-vrm 공식의 dst_rest 보정이 사라지는 것이 근본 원인.
이는 VRM 1.0 spec의 특성 — glTF bone은 orientation을 갖지 않고 position만 가짐.

**해결 방향:**
1. 현재 direction vector alignment(hand→finger)이 이 gap을 채우고 있지만, swing만 보정하고 twist는 못 함
2. VRM rest가 identity인 bone에 대해, FBX와 VRM의 "bone direction"(parent→child vector) 차이를 보정하는 별도 rotation offset 필요
3. 이 offset은 A-pose correction과 유사하지만 hand/lowerArm 전용

### Next
→ 이 발견을 learnings에 기록하고, 해결은 다음 세션에서 진행
