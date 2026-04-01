# Blender FBX src_rest Fix — rest_rotation_euler을 src_rest로 사용

Date: 2026-04-01

## 문제

Blender FBX(T2M 등)에서 VRM retarget 시 팔이 뒤로 젖혀짐.
PreRotation이 전부 identity → three-vrm 공식이 bone rest orientation을 모름 → rotation 방향 자체가 틀림.

## 핵심 발견

Blender FBX 구조:
```
bone.pre_rotation = identity          ← 무의미
bone.rest_rotation_euler = (51.7, 43.4, -51.7)°  ← bone orientation 여기에 baked
track.rotations[i] = animated Lcl_Rotation        ← rest 포함된 full rotation
```

Maya FBX 구조:
```
bone.pre_rotation = (49.7°)           ← bone orientation
bone.rest_rotation_euler = identity   ← 거의 0
track.rotations[i] = small delta      ← rest 미포함
```

**rest_rotation_euler이 fbx.rs에서 이미 파싱되어 FbxBone에 존재.** 역공학 불필요.

## Fix

mapping.rs에서 Blender 감지 시:

1. `src_rest = euler_to_quat(bone.rest_rotation_euler)` (PreRotation 대신)
2. `delta[i] = rest_quat.inverse() * track.rotations[i]` (animation에서 rest 제거)

이후 `src_rest * delta[i] = rest_euler * (rest_euler⁻¹ * full_lcl) = full_lcl` → Maya와 동일 구조.

## 적용 범위

mapping.rs 내 4곳:
- direct_map (line 148-203)
- accumulate chains (line 205-287)
- root bone (line 113-145)
- twist_fold (line 289-415)

global_rest 계산 (line 77-111)은 이미 `pre_rotation * lcl_rot_rest`이므로 수정 불필요.

## 기대 효과

- FK-only: 팔 뒤로 젖힘 해결, orientation 정확, position ~5cm 오차 (A-pose↔T-pose 차이, FK 한계)
- FK + IK post-pass: position 0cm (완전 정확)

## 이전 오판 정정

t2m-vs-cinev-spec.md에서 "Hypothesis C: PreRotation 차이 → REJECTED"는 틀렸음.
`src_rest * rotations[i]`가 "올바른 full local"을 만드는 건 맞지만, 그 다음 three-vrm 정규화에서 src_rest_global이 identity chain이라 rest pose 분리가 안 되는 게 근본 원인.
