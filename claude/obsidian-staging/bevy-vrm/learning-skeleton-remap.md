---
title: "Skeleton remap: VRM→FBX rest pose 변환"
tags: [bevy-vrm, retarget, skeleton-remap]
created: 2026-04-08
---

# Skeleton Remap

## Problem

Three-vrm retarget pipeline의 구조적 한계:
- `parentRest` conjugation에 arm A-pose leak
- Finger backward curl (workaround 누적)
- Sitting pose에서 scale ratio 깨짐 (hips height 기준)

## Solution: VRM skeleton을 FBX skeleton에 맞춰 변환

VRM 로드 시 각 bone의 rest rotation을 FBX bone의 rest rotation으로 교체. Inverse bind matrix 업데이트로 mesh 모양 유지. FBX animation 직접 적용 → three-vrm formula 불필요.

### 핵심 수식

```
offset = fbx_rest_global_yup × vrm_rest_global⁻¹
```

VRM 1.0은 identity rest → offset ≈ fbx_rest_global_yup.

### Animation 적용

Remap 후:
```
delta = fbx_local_rest⁻¹ × fbx_local_anim  (rest 대비 변화)
vrm_bone_local = delta_yup  (직접 적용)
```

## Module

`crates/cinev_retarget/src/skeleton_remap.rs`
- `compute_remap()`: VRM↔FBX per-bone offset 계산
- `apply_remap_animation()`: FBX animation을 remap space delta로 변환
- `RemappedBoneTrack`: 결과 구조체

## 검증 데이터

| FBX | Bones | Avg Offset |
|-----|-------|-----------|
| male_standing | 52 | 158° |
| male_sitting | 53 | 119° |

Offset이 크지만 정상 — VRM identity rest vs FBX A-pose rest의 차이.

## 관련 결정

- Scale ratio: leg chain length 기준으로 변경 (hips Y → pose 독립)
- 기존 pipeline: 유지 (fallback), remap은 opt-in
- IBM 재계산: loader.rs의 기존 GLB binary patch 패턴 재활용
