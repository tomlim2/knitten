# 2026-04-13 — Rubric B1.2 Proportion universal-F 수정

phase2-3 devlog의 sweep finding 중 가장 가시성 좋은 항목. **두 개의 독립 버그**.

## 증상

12 (실제 19) VRM 전부 B1.2 = F. universal failure pattern은 메트릭 결함의 강한 신호.

## Bug 1 — bone naming off-by-one

`bone_rest_translation`은 **local** translation. 즉 각 키 X에 대해 값은 "X의 origin이 부모 좌표계에서의 위치 = parent→X 벡터".

따라서:
- `t["leftUpperArm"]` = leftShoulder → leftUpperArm 벡터 = **shoulder 길이**
- `t["leftLowerArm"]` = leftUpperArm → leftLowerArm 벡터 = **upper arm 길이**
- `t["leftHand"]` = leftLowerArm → leftHand 벡터 = **lower arm 길이**

기존 코드:
```rust
let ua = get_len("leftUpperArm");  // 실제로는 shoulder 길이
let la = get_len("leftLowerArm");  // 실제로는 upper arm 길이
deviations.push(ratio_deviation(ua / la, 1.0, 1.3));
// shoulder/upper_arm 비율을 upper/lower arm 비율인 척 채점
```

수정: child bone을 써야 함:
```rust
let upper_arm_len = t["leftLowerArm"].length();
let lower_arm_len = t["leftHand"].length();
```

## Bug 2 — `ratio_deviation`이 범위를 무시

```rust
fn ratio_deviation(actual: f32, lo: f32, hi: f32) -> f32 {
    let mid = (lo + hi) / 2.0;
    let deviation = (actual - mid).abs() / mid;
    deviation
}
```

doc comment는 "범위 내면 deviation이 낮다"고 했지만 **lo/hi가 함수 본문에서 사용 안 됨**. 항상 midpoint distance만 반환.

`ratio_deviation(1.0, 1.0, 1.3)` → mid=1.15, |1.0 - 1.15|/1.15 = **0.13** (legitimate range 끝값인데 이미 13% deviation)

기존 grade boundary `< 0.15 → A`라서 범위 끝값들조차 **A를 못 받음**. 양 끝 [1.0, 1.3]에서 모두 0.13 deviation → A 못 받고 B/C로 떨어짐. 거기에 Bug 1까지 합쳐지면 universal F.

수정:
```rust
fn ratio_deviation(actual: f32, lo: f32, hi: f32) -> f32 {
    if actual >= lo && actual <= hi { return 0.0; }
    let mid = (lo + hi) / 2.0;
    if mid <= 0.0 { return 1.0; }
    let edge_dist = if actual < lo { lo - actual } else { actual - hi };
    edge_dist / mid
}
```

## 추가 개선 — arm span 계산을 world position 기반으로

기존: `arm_span_proxy = lua + lla + rua + rla` (sum of bone lengths). 이걸 `hips_height`(=hips Y world)로 나눔.

문제:
- `hips_height`는 캐릭터 총 높이가 아니라 hips Y 위치
- bone length sum은 shoulder width를 빠뜨림
- 두 가지 잘못이 곱해져서 ratio가 1.0 근처 안 나옴

수정: 실제 world position 사용
```rust
let arm_span = (leftHand_world - rightHand_world).xz_length();
let height = head_world.y;
deviations.push(ratio_deviation(arm_span / height, 0.9, 1.1));
```

## Real sweep 결과 (19 VRMs)

| Metric | Before | After |
|--------|--------|-------|
| B1.2 distribution | 0A 0B 0C **19F** | 0A **10B 4C 5F** |
| B Overall | 0A 14B 3C 2F | **12A** 3B 3C 1F |

12개 VRM이 B1.2 수정으로 인해 B Overall A로 승급.

5개 잔존 F:
- `vrm_0x_m_moth` — B1.1도 F (모델 자체 broken)
- `GhostPumpking` (× 2 형태) — 머리 큰 chibi/SD
- `zepeto_1x_m_001` — zepeto 비율
- `4a712f6f UUID`

전부 비표준 stylized 캐릭터로 추정. 메트릭이 universal-fail이 아니라 outlier만 잡으므로 정상.

**Rubric C grades는 변화 없음** (9A 75B 66C 40F 동일) — B 수정이 C로 흐르지 않음. 의도된 axis 분리.

## 교훈

### Universal failure pattern은 즉시 메트릭 결함 의심

모든 입력에서 같은 등급이 나오면, 그건 측정이 아니라 상수. "전부 F"가 보이면 무조건 코드부터 확인.

### `bone_rest_translation` 시맨틱은 헷갈림

"X의 translation"이 X 자체의 길이가 아니라 부모→X 벡터라는 점은 구면 직관과 다름. **rest position이 아니라 rest offset**으로 이름이 더 명확했을 듯. 미래 caller가 또 헷갈리지 않게 `bone_rest_offset_from_parent` 같은 alias나 doc comment 추가 검토 가치 있음.

### Doc comment ≠ 코드

`ratio_deviation`의 doc comment는 "범위 내면 deviation 낮음"이라 했고 그게 의도였지만 코드는 그렇지 않았음. 두 번째 보는 사람이 doc만 믿고 통과 → universal-F가 review에서 잡히지 않음. doc 작성 시 **테스트 1줄로 검증**할 것 (`assert_eq!(ratio_deviation(1.15, 1.0, 1.3), 0.0);`).

## 다음

Rubric B 수정 1건 완료. 남은 후보:
- C1.2 GroundContact 재설계 (~half F, 구조적 — `foot_sole_offset` 미사용)
- C1.1 JointLimit 재설계 (positional fixture 필요)
- Three-axis purity 리뷰 (애매)
