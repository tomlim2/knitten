---
title: "VRM Humanoid 본 테이블 — 손가락 포함 49개"
tags:
  - bevy-vrm
  - vrm-spec
  - humanoid
date: 2026-04-10
source: claude
---

# VRM Humanoid 본 테이블

VRM Humanoid 스펙에는 손가락 본까지 포함되어 있다. arp2vrm-score 범위 결정 중 알게 된 사실.

---

## 카테고리

### Required (필수)

게임 엔진/뷰어가 VRM을 정상 로딩하기 위해 반드시 있어야 하는 본.

- `hips`, `spine`, `head`
- `leftUpperArm`, `leftLowerArm`, `leftHand` (+ right)
- `leftUpperLeg`, `leftLowerLeg`, `leftFoot` (+ right)

### Optional — Body

- `chest`, `upperChest`, `neck`
- `leftShoulder`, `rightShoulder`
- `leftToes`, `rightToes`
- `leftEye`, `rightEye`, `jaw`

### Optional — Fingers (한 손당 15개 × 2 = 30개)

각 손가락 3개씩 (Proximal/Intermediate/Distal):

- **Thumb** — Metacarpal, Proximal, Distal *(엄지만 Metacarpal)*
- **Index** — Proximal, Intermediate, Distal
- **Middle** — Proximal, Intermediate, Distal
- **Ring** — Proximal, Intermediate, Distal
- **Little** — Proximal, Intermediate, Distal

---

## VRM 0.x vs 1.0 차이 (엄지 명명)

| Joint | VRM 0.x | VRM 1.0 |
|-------|---------|---------|
| 1 | `leftThumbProximal` | `leftThumbMetacarpal` |
| 2 | `leftThumbIntermediate` | `leftThumbProximal` |
| 3 | `leftThumbDistal` | `leftThumbDistal` |

VRM 1.0에서 엄지 본 이름이 한 칸씩 밀렸다. 호환성 작업할 때 주의.

---

## 총합

- Required: 15개
- Optional Body: 9개 (chest, upperChest, neck, shoulders×2, toes×2, eyes×2, jaw)
- Optional Fingers: 30개
- **Full Humanoid: 54개**

arp2vrm-score 작업 범위 분리 시 이 숫자가 기준.

---

## 참고

- VRM 1.0 spec: <https://github.com/vrm-c/vrm-specification>
- [[learning-skeleton-remap]] — ARP↔VRM 매핑 작업
- [[learning-finger-curl-pipeline]] — 손가락 별도 파이프라인
