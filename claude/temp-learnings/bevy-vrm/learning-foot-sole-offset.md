---
title: "Foot sole offset: static calibration vs dynamic contact"
tags: [bevy-vrm, retarget, foot, ground-contact]
created: 2026-04-07
---

# Foot Sole Offset

## Problem

Retarget 후 캐릭터 발이 바닥을 뚫거나 떠있음. 원인: VRM foot bone → mesh 바닥 거리(sole offset)가 FBX와 다름.

- VRM foot bone Y: 0.130m (mesh 바닥에서 13cm 위)
- FBX foot bone Y: 0.099m (mesh 바닥에서 10cm 위)
- Scale ratio: 1.09

## Solution: Static Calibration (Opus 제안, 채택)

```
sole_delta = vrm_sole_offset - (fbx_sole_offset × scale_ratio)
           = 0.130 - (0.099 × 1.09) = +0.022m
→ hips Y를 0.022m 올리기
```

### 왜 이게 맞나
- 구조적(skeleton→mesh) 차이를 한 번 보정
- 모든 포즈에 동일 적용 (서기, 앉기, 눕기) — 구조 보정이라 행동 무관
- 기존 hips translation 코드에 한 줄 추가

### 왜 다른 방식은 안 되나
- **Foot IK + ground constraint**: 아직 불필요, 지형 대응 시 별도 시스템
- **Y clamp (foot_Y - sole >= 0)**: 앉기/눕기에서 발을 강제로 올려서 포즈 파괴
- **Contact-gated grounding** (Codex): 5-7일 공수, 현 단계에서 과도

### 주의점
- FBX sole offset: FBX skeleton의 foot bone Y at rest (Y=0이 ground 기준)
- scale_ratio는 hips 기준 — leg 길이 기준이 더 정확하지만 1-2cm 오차 수용
- Dynamic ground contact (walk cycle foot slide)는 별도 이슈로 분리

## Data

sole offset 계산: VRM GLB mesh vertices에서 최하위 Y 스캔.
```
foot_sole_offset = foot_bone_Y - mesh_min_Y
```

VrmRestPose에 저장 → Retargeter가 자동으로 접근. 복수 VRM 로드 시 각각 자기 값 사용.
