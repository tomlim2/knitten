---
project: bevy-vrm
topic: finger-backward-curl
started: 2026-04-07
baseline-commit: 735839c
---

# Experiments: bevy-vrm / finger-backward-curl

## Goal

Animated finger curl이 뒤로 젖혀지는 문제 해결. CLI backward detection 0개 + bone direction error < 20° 달성.

## 유저 핵심 인사이트

> "왜 손가락은 자꾸 뒤로 젖혀지는거죠? 만일 relative로 꺾이는거면 좌표계 맞추거나 혹은 포워드 벡터같은걸로 움직이면 되는거 아님?"

> "엄지를 제외한 다른 손가락 마디의 좌우로 움직이는 거 못하게해주면 안되나요? 돌리는것도 없애주세요."

## Root Cause

Three-vrm formula `parentRest × animLocal × boneRest⁻¹`의 `parentRest` conjugation이 FBX arm A-pose를 포함. 이 conjugation이 curl 평면을 ~45° 틀어서 forward curl이 backward로 나옴. IK2 hand swing/twist correction이 이를 더 악화 (Pre-IK2: 3 backward borderline → Post-IK2: 6 backward severe).

## Baseline

- Backward bones: 6 (right hand, post-IK2)
- Right Proximal direction: rest 9-23°, peak 16-26°
- Right Intermediate direction: rest 37-54°, peak 41-55°
- Pre-IK2 backward: 3 (Intermediate only, Z ≈ -0.14 borderline)

---

## EXP-001: Position-based rebasis (A-E variants)

- **Status**: `failed`
- **Hypothesis**: Hand orientation rebasis conjugation으로 arm A-pose 제거 → backward 0
- **Fail threshold**: backward > 4 → fail

### Variants
| ID | Change | Backward |
|----|--------|----------|
| A | Middle finger direction only | 6 |
| B | Convention palm (0,-1,0) | 5 |
| C | Slerp 0.5 (half strength) | 6 |
| D | Proximal only rebasis | 6 |
| E | No swing-twist filter | 6 |

### Conclusion
Rebasis 방식/강도/범위 무관하게 backward 동일. Rebasis는 backward의 원인이 아님. Three-vrm parentRest conjugation 자체가 원인 (EXP-F/H로 확인).

---

## EXP-002: Local-delta + PreRotation conjugation

- **Status**: `partial`
- **Hypothesis**: parentRest 제거하고 PreRotation만 conjugation → backward 0
- **Fail threshold**: direction peak > 60° → fail

### Params
| Change | Detail |
|--------|--------|
| Formula | `result = coord × pre_rot × (lcl_rest⁻¹ × anim) × pre_rot⁻¹ × coord⁻¹` |

### Metrics
| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Backward (right) | 6 | 1 (borderline -0.02) | -5 ✓ |
| Proximal peak direction | 16-26° | 39-45° | +20° ✗ |
| Intermediate peak direction | 41-55° | 42-74° | worse ✗ |

### Conclusion
Backward 거의 해결하지만 direction accuracy 크게 저하. PreRotation만으로는 VRM bone axis와 안 맞아서 curl이 Y쪽으로 치우침. Direction vs backward 트레이드오프.

---

## EXP-003: IK2 hand twist compensation

- **Status**: `succeeded` (partial)
- **Hypothesis**: IK2 hand change에서 twist(palm roll)만 Intermediate에서 보상 → backward 해결 + direction 유지
- **Fail threshold**: backward > 2 or direction peak > 40°

### Params
| Change | Detail |
|--------|--------|
| Location | `ik/mod.rs` apply() |
| Scope | Animated Intermediate/Distal only |
| Formula | `(swing, twist) = decompose(hand_change, ±X); finger = twist⁻¹ × finger` |

### Metrics (twist compensation on Intermediate only)
| Metric | Before (no comp) | After | Delta |
|--------|-------------------|-------|-------|
| Backward (right) | 6 | 0 ✓ | -6 |
| Backward (left) | 0 | 1 (borderline +0.14) | +1 |
| Right Intermediate peak | 41-55° | 16-29° ✓ | -25° |
| Right Proximal peak | 16-26° | 16-26° (unchanged) | 0 |

### Conclusion
Intermediate backward 완전 해결, direction도 16-29°로 개선. Proximal은 rebasis 결과 유지. Left hand borderline 1개 잔존 (static finger, 무시 가능 수준).

**주의**: compensation을 Proximal까지 적용하면 direction 크게 악화 (42-59°). Intermediate/Distal만 적용해야.

---

## Dead Ends

1. **Per-finger direction correction** (pre/post-multiply): FBX world direction에 A-pose arm 포함 → rebasis와 이중 보정, coordinate space 순환 의존
2. **Intermediate parentRest override to hand**: parentRest와 boneRest 관계 파괴 → 더 악화
3. **Backward Z-sign negate**: rest child_dir.z ≈ 0이라 detection 실패, hacky
4. **Full compensation (hand⁻¹ × fk × finger)**: IK2 direction correction까지 되돌려서 direction 악화 (53-128° FLIP)
5. **All-finger twist compensation**: Proximal에 적용하면 hand와 이중 보정

---

## Current Best: EXP-003

Twist-only compensation on animated Intermediate/Distal:
- Right backward: 0 ✓
- Left backward: 1 borderline
- Right Intermediate peak: 16-29° ✓
- Right Proximal peak: 16-26° (rebasis 한계)

## EXP-004: Full compensation + curl axis reconstruction

- **Status**: `failed`
- **Hypothesis**: hand_ik⁻¹ × hand_fk × finger로 frame 변환 후 curl axis projection → backward 0 + direction 유지

### Conclusion
Local space에서 curl axis가 forward여도, IK2 hand world rotation이 curl plane을 뒤집어서 world backward 발생. Local rotation 조작으로는 world backward 해결 불가. IK2 hand와 finger FK의 coordinate frame 불일치가 근본 원인.

시도한 변형:
- Full compensation only: backward 0 but direction 53-128° FLIP
- Full compensation + curl reconstruction: backward 5, magnitude OK
- Twist-only compensation + curl reconstruction: backward 4-6
- All-finger twist compensation: magnitude 3x 폭발 (107° vs 34°)
- Hyperextension clamp: local forward ≠ world forward

## 근본 원인 (최종 정리)

1. Three-vrm `parentRest` conjugation이 arm A-pose를 curl plane에 bake
2. IK2 hand swing/twist correction이 hand world frame 변경 → finger FK 전파
3. 이 두 효과가 합쳐져서 **local forward curl이 world backward direction으로 나타남**
4. Local rotation 단독 조작으로는 해결 불가 — world space에서 finger 계산 필요

## 해결 방향 (다음 세션)

1. **IK2 후 finger world-space 재계산**: IK2 hand 확정 후, finger world rotation을 직접 계산. FBX finger world → VRM finger world delta, IK2 hand 기준으로 local 변환.
2. **Muscle space**: bend/splay/twist 스칼라 분해 → 재조립. IK2 hand frame에 의존하지 않는 representation.
3. **IK2 finger 통합**: IK2 solver가 finger도 함께 처리, hand correction과 finger를 동시 해결.

## TODO

- [ ] IK2 후 finger world-space 재계산 구현
- [ ] Thumb 별도 처리
- [ ] 다른 FBX/VRM 조합 테스트
