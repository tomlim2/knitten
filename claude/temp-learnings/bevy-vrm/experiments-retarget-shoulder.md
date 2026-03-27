---
project: bevy-vrm
topic: retarget-shoulder
started: 2026-03-27
baseline-commit: 22e1ce5
---

# Experiments: bevy-vrm / retarget-shoulder

## Goal

MetaHuman→xiao_vroid 리타겟 시 어깨 너비 차이(0.68 ratio)로 인한 팔꿈치 모임 현상 해결.

## Baseline

```
[RQ:PROP] vrm_sh=0.198m fbx_sh=0.291m ratio=0.68 | vrm_arm=0.430m fbx_arm=0.459m ratio=0.94
[RQ] f=37 ... elbow=0.02m  (최소, 팔꿈치 거의 붙음)
[RQ] f=67 ... elbow=0.58m  (최대, 팔 벌렸을 때)
```

| Metric | Value |
|--------|-------|
| Shoulder ratio | 0.68 (VRM 32% 좁음) |
| Elbow min distance | 0.02m |
| Elbow max distance | 0.58m |
| LIMB lUA | 4-10° |

---

## EXP-001: Static Z-offset 9° on UpperArm

- **Status**: `succeeded` (부분)
- **Hypothesis**: upperArm에 `(1-0.68)*0.5=0.16rad≈9°` Z축 바깥 offset을 주면 elbow min > 0.10m
- **Fail threshold**: elbow min < 0.05m → 폐기

### Params
| File | Change | Before | After |
|------|--------|--------|-------|
| retargeter.rs | shoulder Z-offset | 없음 | `(1-ratio)*0.5` rad |

### Metrics
| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Elbow min | 0.02m | 0.06m | +0.04m |
| Elbow at f=155 | ~0.10m | 0.15m | +0.05m |
| LIMB lUA | 4-10° | 4-13° | +3° (약간 증가) |

### Conclusion
부분 성공. elbow min 0.02→0.06m. 하지만 0.06m는 여전히 좁음.
factor 0.5가 약할 수 있음.

### Next
→ EXP-002: factor를 0.8로 올리기

---

## EXP-002: Static Z-offset factor 0.8

- **Status**: `active`
- **Hypothesis**: factor 0.5→0.8로 올리면 offset≈15°, elbow min > 0.10m
- **Fail threshold**: 팔 내린 포즈에서 시각적으로 부자연스러우면 → 다른 접근

### Params
| File | Change | Before | After |
|------|--------|--------|-------|
| retargeter.rs | shoulder offset factor | 0.5 | 0.8 |

### Metrics
| Metric | EXP-001 (0.5) | EXP-002 (0.8) | Delta |
|--------|:---:|:---:|:---:|
| Elbow min | 0.06m | **0.07m** | +0.01m |
| Elbow at f=156 | 0.15m | 0.15m | 0 |
| Elbow at f=216 | 0.12m | 0.11m | -0.01m |
| LIMB lUA | 4-10° | 5-16° | +6° (악화) |

### Conclusion
실패에 가까움. elbow min 0.06→0.07m (거의 변화 없음).
LIMB lUA는 5-16°로 악화 (offset이 arm angle을 왜곡).
Static Z-offset 방식의 한계 — 모든 포즈에 동일 offset이 일부 포즈에서 역효과.

### Next
→ EXP-003: 다른 접근 필요. 옵션:
  - A. Elbow minimum distance constraint (동적)
  - B. UpperArm adduction damping (안쪽 회전만 제한)
  - C. 포기 (비례적으로 맞는 결과이므로 수용)

---

## Dead Ends

(아직 없음)
