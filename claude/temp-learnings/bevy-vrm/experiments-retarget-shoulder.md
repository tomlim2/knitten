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
| 003 | Adduction Z-damping | 0.02m | 2-11° | failed — Z축 ≠ adduction 방향 |
| 004 | slerp(ID,rot,0.68) | 0.21m | 22-28° | succeeded — 관통 해결, LIMB 과다 |
| 004b | slerp blend=0.81 | 0.11m | 7-21° | partial |
| 004c | slerp blend=0.86 | 0.07m | 5-17° | **succeeded** — 관통 방지 + LIMB 허용 |

## Dead Ends
- **Static Z-offset on upperArm**: factor 올려도 elbow min 거의 안 변하고 LIMB만 악화
- **Axis-angle Z-component damping**: quaternion Z성분 ≠ 해부학적 adduction, VRM local axis 불일치

---

## Body Aspect Ratio (참고 데이터)

```
MetaHuman: sh=0.291m torso=0.516m aspect=0.564
xiao:      sh=0.198m torso=0.500m aspect=0.396
aspect_ratio = 0.702 (vs pure shoulder_ratio = 0.68)
```

## EXP-004: slerp rotation scaling
- **Status**: `succeeded`
- **Hypothesis**: upperArm rotation을 비례 축소 → elbow 관통 방지
- **Final formula**: `blend = sh_ratio + (1 - sh_ratio) * 0.55` → 0.86 for xiao
- **Tuning**: 0.68 (과다축소) → 0.81 → **0.86** (최적)
- **Result**: `elbow_min=0.07m lUA=5-17°` — 관통 방지 + 자연스러운 arm angle

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

## EXP-003: UpperArm adduction damping (Z-axis decompose)
- **Status**: `failed`
- **Hypothesis**: Z-axis rotation의 adduction 방향만 shoulder_ratio로 damping → elbow_min > 0.05m
- **Fail**: elbow_min < 0.03m
- **Params**: `retargeter.rs adduction damping via Z-component scaling`
- **Result**: `elbow_min=0.02m lUA=2-11°` — baseline과 동일, damping 미작동
- **Why failed**: quaternion axis-angle의 Z성분 ≠ 해부학적 adduction. VRM local Z축이 어깨 벌림/모음 방향과 다름
- → Dead end: axis-angle 기반 방향별 damping은 VRM local axis가 일치하지 않으면 무의미
