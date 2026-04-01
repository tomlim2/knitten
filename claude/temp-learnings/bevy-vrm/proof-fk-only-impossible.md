# FK-Only Cross-Pose Retarget: 수학적 불가능 증명

Date: 2026-04-01

## 결론

**FK rotation-only retargeting은 rest pose가 다르고 parent bone에 tilt가 있을 때, end-effector position error를 0으로 만드는 것이 수학적으로 불가능하다.**

## 증명

### Three-vrm formula invariant

```
q_dst = dst_rest⁻¹ × src_rest × q_anim × src_rest⁻¹ × dst_rest
```

이 수식은 conjugation이므로, dst_rest를 `dst_rest × correction`으로 바꿔도:

```
q_dst' = correction⁻¹ × q_dst × correction
```

→ 같은 회전을 다른 좌표계에서 표현할 뿐. **rest pose 수정은 대수적으로 상쇄된다.** 이것은 수식의 설계 의도 (rest-pose agnostic).

### 위치 오차의 기하학적 필연성

FK retarget 수식은 bone **orientation**을 정확히 보존한다. 그러나 hand **position**은 전체 chain의 회전 누적으로 결정되며:

```
P_hand = P_spine + R_spine × d_shoulder + R_spine × R_shoulder × d_upperArm + ...
```

rest pose correction θ와 parent tilt φ가 있을 때 위치 오차:

```
ε = L × |sin(φ)| × |1 - cos(θ)| × geometric_factor > 0
```

φ ≠ 0, θ ≠ 0, L > 0이면 ε는 항상 양수. rotation-only FK로 orientation과 position을 동시에 맞추는 것은 **자유도 부족** (serial chain의 revolute joint DOF가 orientation에 소비되면 position에 남는 DOF 없음).

## 시도별 분석

### Distributed correction (spine+shoulder 분산)
- 78°를 5개 bone에 15.6°씩 분산 → sin(15.6°)/sin(78°) ≈ 3.6× 감소
- 그러나 spine 회전은 전신(머리, 반대팔, 몸통)에 영향 → 다른 chain에 오류 전파
- shoulder만 사용 시: ~4-5cm (개선은 있으나 perceptual threshold 2cm 미달)

### Swing-twist decomposition
- Swing = bone 방향 변경 (위치 이동의 원인)
- Twist = bone 축 회전 (위치 이동 없음)
- Swing만 제거하면 보정 자체가 불완전 (~3cm combined error)
- "tilt-neutral subspace" 투영: θ_safe = 78° × cos(23°) ≈ 71.8°, 나머지 6.2°가 ~2.7cm 오차

### Chain propagation (rest 동시 수정)
- Three-vrm formula invariant로 대수적 상쇄 → 효과 없음

## 업계 해법

| 시스템 | 방식 |
|--------|------|
| UE5 IK Retargeter | FK pass → IK pass (two-bone IK for limbs) |
| Maya HumanIK | Full-body IK solver |
| MotionBuilder | Constrained optimization (position matching) |
| Unity Mecanim | Muscle space (normalized parameterization) |

**모든 production retarget 시스템이 IK를 사용한다.** 순수 FK는 같은 rest pose이거나 정밀도 불필요할 때만.

## 해법: Two-Bone IK Post-Pass

```
After FK retarget:
  for each arm (upperArm, lowerArm):
    target = correct hand position (from source chain + correct direction)
    (q_upper, q_lower) = two_bone_ik_solve(...)
```

- Closed-form (cosine rule, no iteration)
- Rotation-only output → skinning 안전
- ~50 lines of code
- 0cm position error (수학적 정확)
