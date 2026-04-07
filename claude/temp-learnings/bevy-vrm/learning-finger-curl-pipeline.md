---
title: "Finger retarget: curl-only pipeline + movement taxonomy"
tags: [bevy-vrm, retarget, finger, learnings]
date: 2026-04-07
source: claude
---

# Finger Retarget: Curl-Only Pipeline

손가락 FK retarget에서 curl만 전달하고 twist를 제거하는 파이프라인 학습.

---

## 손가락 움직임 4가지

| 움직임 | 축 | 설명 | 전달 여부 |
|--------|-----|------|-----------|
| **Curl (flexion)** | bone axis에 수직 | 안쪽으로 구부리기 (주먹) | O |
| **Extension** | curl 반대 | 바깥으로 펴기 | O (curl의 음수) |
| **Splay (abduction)** | bone axis에 수직, curl과 직교 | 좌우로 벌리기 | O (swing에 포함) |
| **Twist (axial rotation)** | bone axis (±X) | 뼈 축 따라 비틀기 | X (제거) |

> [!info] Curl + splay = swing, twist = bone axis roll. Swing-twist 분해로 twist만 제거하면 curl+splay 보존.

---

## Curl-Only Pipeline (현재)

```
FBX euler → euler_to_quat → absolute rotation
↓ (Blender: rest_inv × absolute = delta)
Mapping: BoneTrack { src_rest, rotations(delta), src_rest_global, src_parent_rest_global }
↓
Three-quat: parentRest_yup × (src_rest × delta) × boneRest_yup⁻¹
↓
VRM 1.0: dst_rest_local × dst_rest_global⁻¹ × normalized × dst_rest_global
↓
Non-thumb: swing_twist(result, bone_axis=±X) → swing만 보존 (twist 제거)
↓
Thumb: 그대로 (abduction이 bone axis 회전이라 twist 제거하면 안 됨)
```

---

## 3가지 소스별 처리

| 소스 | Thumb | Non-thumb |
|------|-------|-----------|
| Three-quat (animated) | 그대로 | swing만 (twist 제거) |
| Bind-pose (static FBX) | XZ-plane correction | swing만 (twist 제거) |
| Default curl (fallback) | 안 씀 | 15°/20°/10° + splay ±3°/0°/-3°/-6° |

---

## Default Curl 값 (생체역학 근거)

| Joint | 코드 | 논문 평균 | 비고 |
|-------|------|----------|------|
| MCP (Proximal) | 15° | 30-35° | 보수적 (논문의 ~50%) |
| PIP (Intermediate) | 20° | 40-45° | 보수적 |
| DIP (Distal) | 10° | 14-15° | 논문과 유사 |

- 출처: Flexion and Extension Angles of Resting Fingers and Wrist (tandfonline)
- 게임에서는 논문 값의 50-70%가 자연스러움

---

## 핵심 교훈

1. **Z-euler extract 실패**: three-quat formula 결과의 Z축 ≠ VRM curl 축. FBX arm rest가 다르면 curl이 다른 축으로 매핑됨
2. **Swing-twist(X축)가 정답**: bone axis roll만 제거, curl+splay는 축 무관하게 보존
3. **FBX world position 기반 curl 측정 오류**: parent bone 회전이 합산되어 실제 local curl보다 3-5배 크게 나옴
4. **Static 판정 주의**: FBX finger bone이 미세한 animation 있으면 is_static=false → default curl 안 먹힘
5. **단계적 접근**: curl만 안정시킨 후 splay/twist 순서로 추가
