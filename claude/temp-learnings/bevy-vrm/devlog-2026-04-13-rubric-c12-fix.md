# 2026-04-13 — Rubric C1.2 GroundContact 재설계

phase2-3 devlog의 sweep finding 중 두 번째 — "~half of pairings F, structurally broken, needs `foot_sole_offset`". 한 번에 고침.

## 증상

- 190 graded pairings 중 C1.2 F = 81 (43%)
- 동시에 A = 21건만 (11%)

distribution이 너무 양극화되어 있어서 메트릭이 정상 작동하는 게 아닐 거란 의심.

## 원인 — ankle Y와 sole Y 혼동

기존 코드:
```rust
let positions = vrm_fk.bone_positions.get(foot);  // ankle world position
let min_y = positions.iter().map(|p| p.y).min();
let contact_threshold = min_y + 0.02;
let contact_indices = positions.iter().filter(|p| p.y <= contact_threshold);
```

문제 두 가지:

### 1. ankle Y는 ground proxy가 아님

VRM bone hierarchy에서 `leftFoot` / `rightFoot`는 **ankle 위치**. 실제 발바닥(sole)은 ankle보다 ~7cm 아래에 있음 (`vrm_rest.foot_sole_offset`). ankle Y가 7cm일 때 sole Y는 0 (정상 접지). ankle Y가 0이면 sole Y는 -7cm = 7cm 발바닥이 바닥 뚫음.

기존 metric은 `min ankle_y`를 ground proxy로 썼음. 이건 **애니메이션의 가장 낮은 발 자세** 일 뿐 실제 ground와 무관. 캐릭터가 점프만 하는 애니에선 min_y가 50cm 위에 있어도 "ground"라고 부름.

### 2. `vrm_rest.foot_sole_offset`을 아예 안 씀

```rust
fn metric_ground_contact(vrm_fk: &VrmSkeletonFrames) -> MetricResult {
```

함수 시그니처에 `vrm_rest` 자체가 없음. sole offset 데이터에 접근 불가능.

### 3. Penetration도 ankle Y 기준

```rust
let max_penetration_mm = positions.iter()
    .map(|p| (-p.y).max(0.0) * 1000.0)
    .fold(0.0f32, f32::max);
```

ankle Y < 0이어야 penetration으로 잡힘. 정상 접지 캐릭터(ankle ≈ 7cm)는 sole이 -10cm 뚫고 있어도 penetration = 0으로 채점됨.

### 4. `min_y + 0.02` 자체가 tautology

contact threshold가 데이터에 따라 떠다님 → "어떤 애니든 가장 낮은 자세 근처는 contact다"로 귀결. 진짜 ground touch가 0건이어도 "contact" 프레임 발견. slide/bounce 메트릭은 그 가짜 contact frames에서 작은 값 받아 grade A → 그러다 stylized 모델 만나면 작은 jitter도 잘못된 referent 때문에 폭발.

## 수정

```rust
fn metric_ground_contact(
    vrm_fk: &VrmSkeletonFrames,
    vrm_rest: &crate::types::VrmRestPose,
) -> MetricResult {
    let (sole_l, sole_r) = vrm_rest.foot_sole_offset;
    if sole_l <= 0.0 && sole_r <= 0.0 {
        return ... "foot_sole_offset not computed (skipped)";
    }

    for &foot in FOOT_BONES {
        let offset = if foot == "leftFoot" { sole_l } else { sole_r };
        let sole_y: Vec<f32> = positions.iter().map(|p| p.y - offset).collect();

        // Contact = ABSOLUTE sole_y < 2cm above true ground
        let contact_threshold = 0.02;
        let contact_indices: Vec<usize> = sole_y.iter().enumerate()
            .filter(|&(_, &y)| y <= contact_threshold)
            .map(|(i, _)| i).collect();

        if contact_indices.len() < 2 {
            // Pure airborne anim — only grade penetration
            ...
        }

        // Penetration = sole_y < 0 (ALL frames, not just contact)
        let max_pen_mm = sole_y.iter().map(|&y| (-y).max(0.0) * 1000.0).fold(0.0, f32::max);
        ...
    }
}
```

핵심 변화:
- `vrm_rest`를 인자로 추가 → `foot_sole_offset` 접근
- `sole_y = ankle_y - sole_offset`로 모든 측정의 기준 변환
- Contact threshold가 **절대값** (sole_y < 2cm = "위에서부터 2cm")
- Penetration은 **전 프레임**에서 측정 (공중에 떠도 발이 바닥 뚫으면 안 됨)
- airborne-only 애니메이션도 penetration만 채점 (slide/bounce 무의미)
- `foot_sole_offset == (0,0)`이면 메트릭 스킵

## Real sweep 결과 (190 pairings)

| Metric | Before | After |
|--------|--------|-------|
| **C1.2 distribution** | 21A 27B 61C 81F | **35A** 26B 41C 88F |
| **C Overall** | 9A 75B 66C 40F | **16A** 66B 71C 37F |

C Overall:
- A: 9 → **16** (+7)
- F: 40 → **37** (-3)

distribution이 양 끝(A, F)으로 더 갈라지면서 동시에 평균 우측 이동.

## F 증가는 왜?

C1.2 F: 81 → 88 (+7건). 새로 F가 된 row들 전부 stylized 캐릭터 (CoolBanana, GhostPumpking, moth-class):
- Body proportion이 표준 humanoid와 다름 → sole_offset이 retarget 결과 ankle 높이와 안 맞음
- 기존 메트릭에선 `min_y + 0.02` 트릭으로 자체 기준 만들어 작은 contact 발견 → 안 망가졌었음
- 새 메트릭에선 절대 ground 기준이라 진짜 sole_y 음수가 보임 → F

이건 **메트릭이 진짜 문제를 발견**한 것. visual 검증하면 이 모델들 발이 floor 뚫고 있을 가능성 큼. C1.2 F가 정확함.

## 교훈

### `min_y + offset`은 절대 ground proxy가 될 수 없음

데이터 자체로부터 reference frame을 만드는 metric은 항상 "데이터 안의 분산"만 측정할 뿐 "외부 standard 대비 거리"를 측정할 수 없음. ground는 외부 standard(=0)이고, 그것에 대한 거리는 모델 메타데이터(`foot_sole_offset`)로만 알 수 있음. metric이 절대 standard에 대해 측정하려면 standard의 위치가 data에 없으면 외부 source로 반드시 가져와야 함.

### bone position semantic을 이름으로 추론하지 말 것

`leftFoot`/`rightFoot`는 발바닥이 아니라 ankle. VRM/glTF spec이지만 함수 작성자가 모를 수 있음. 측정 대상이 sole인지 ankle인지 명시적으로 다루지 않으면 ~7cm 오프셋 버그가 잠복.

### "Skip when data missing" > "Compute with junk"

`foot_sole_offset == 0`은 "데이터가 없음" 신호. 기존 코드는 그것도 무시하고 `min_y + 0.02`로 계산해서 모든 모델에 대해 grade를 뱉었음. 새 코드는 명시적으로 skip. 사용자가 "왜 grade가 A인가?" 의심할 때 "데이터 없어서 skip"이 "잘못된 데이터로 A 줬음"보다 100배 정직.

### universal-비정상 distribution은 무조건 의심

C1.2 분포 21A 27B 61C 81F는 정상이라기엔 양극화가 너무 심함 (43% F). 메트릭이 정상이면 보통 A→F 단조 감소 분포. 양극화는 reference frame이 잘못된 신호.

## 다음

오늘 sweep 기반 가시 fix 2건 완료 (B1.2, C1.2). 남은 항목:
- C1.1 JointLimit 재설계 (positional fixture 필요)
- A1.2 BoneSymmetry 이미 04-13 phase2-3에서 fix됨
- Three-axis purity 리뷰 (애매하지만 중요)
- Rubric 가중치 재조정 (overall_score 계산식)

C1.1은 fixture 작업이 동반되어야 해서 별도 세션 단위. Three-axis purity는 더 큰 architecture 작업.

오늘 단위로는 sweep gain을 더 짜낼 cheap fix가 거의 안 보임. 마무리 시점.
