---
project: bevy-vrm
topic: finger-metacarpal-fold
started: 2026-04-06
baseline-commit: 97cba3e
---

# Experiments: bevy-vrm / finger-metacarpal-fold

## Goal

MetaHuman FBX finger는 4 bone (Metacarpal→Proximal→Intermediate→Distal), VRM은 3 bone (Proximal→Intermediate→Distal). FBX Metacarpal의 curl/splay rotation이 VRM에서 손실됨. 이를 복구하여 finger bind pose accuracy 향상.

## Context

- Thumb은 양쪽 다 3 bone → 이미 0.0° verify ✓
- 4 curl fingers에서 FBX Metacarpal bone이 VRM에 대응 없음
- 현재 `apply_finger_bind_pose()`에서 Proximal→child direction만 교정
- Metacarpal의 curl이 무시되어 knuckle 영역 방향 mismatch 발생

## Baseline

| Metric | Value |
|--------|-------|
| finger_verify avg (standing) | 0.0° (matched bones only) |
| Corrected bones | 20/30 |
| Metacarpal curl captured | ❌ None |
| Visual knuckle match | Poor — FBX 4 dots vs VRM 3 dots |

## Approaches Considered

| # | Approach | Complexity | Expected Quality |
|---|----------|-----------|-----------------|
| 1 | Fold Metacarpal→Proximal (`q_meta * q_prox`) | ~20 LOC | 90% |
| 2 | Swing/Twist split (splay→Hand, curl→Proximal) | ~50 LOC | 85% |
| 3 | Virtual Bone insertion at runtime | ~100+ LOC | 100% |
| 4 | Endpoint IK (position-based) | ~80 LOC | 95% |

**Phase 1 plan:** Approach 1 (fold into Proximal)
**Phase 2 plan:** Approach 3 (virtual bone) — when interaction/grip needed

---

## Dead Ends

(none yet)
