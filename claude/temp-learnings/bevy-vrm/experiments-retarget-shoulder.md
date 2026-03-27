---
project: bevy-vrm
topic: retarget-shoulder
started: 2026-03-27
baseline-commit: 22e1ce5
---

# Experiments: bevy-vrm / retarget-shoulder

## Goal
팔꿈치가 몸통 메시를 뚫지 않도록 보정. 손이 붙는 건 OK.

## Baseline
```
sh_ratio=0.68 arm_ratio=0.94 elbow_min=0.02m elbow_max=0.58m lUA=4-10°
```

---

## Results Summary

| EXP | Approach | elbow_min | lUA | Status |
|-----|----------|:---------:|:---:|--------|
| 001 | Z-offset 9° (factor=0.5) | 0.06m | 4-13° | partial |
| 002 | Z-offset 15° (factor=0.8) | 0.07m | 5-16° | failed — LIMB 악화, elbow 미개선 |

## Dead Ends
- **Static Z-offset on upperArm**: factor 올려도 elbow min 거의 안 변하고 LIMB만 악화. 모든 포즈에 동일 offset → 일부 포즈에서 역효과.

---

## EXP-001: Z-offset 9°
- **Status**: `partial`
- **Hypothesis**: `(1-0.68)*0.5=9°` Z-offset → elbow_min > 0.10m
- **Fail**: elbow_min < 0.05m
- **Params**: `retargeter.rs shoulder_offset factor=0.5`
- **Result**: `elbow_min=0.06m lUA=4-13°` — elbow +0.04m but still tight
- → EXP-002

## EXP-002: Z-offset 15°
- **Status**: `failed`
- **Hypothesis**: factor=0.8 → elbow_min > 0.10m
- **Fail**: LIMB > 15° or 시각적 부자연
- **Params**: `retargeter.rs shoulder_offset factor=0.8`
- **Result**: `elbow_min=0.07m lUA=5-16°` — +0.01m only, LIMB 악화
- **Why failed**: static offset은 모든 프레임 동일 → 팔 벌렸을 때 과보정, 모았을 때 부족
- → EXP-003: 동적 접근 필요

## EXP-003: UpperArm adduction damping
- **Status**: `pending`
- **Hypothesis**: 안쪽 회전(adduction)만 shoulder_ratio로 damping하면 몸통 관통 방지 + 바깥 동작 유지
- **Fail**: 자연스러운 팔 모으기 포즈가 깨지면 → 폐기
