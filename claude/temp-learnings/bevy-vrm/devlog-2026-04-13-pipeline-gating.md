# 2026-04-13 — A/B/C pipeline gating + 포맷-비종속 네이밍 (shotloom 포팅 #4)

phase2-3 devlog의 "three-axis pipeline ordering rule" 실현. Rubric C가 A/B 결과를 알 수 없이 독립 실행되던 문제 해결.

## Why

기존 sweep:
```
vroid_xiao × FC_00078 [Retarget] HARD FAIL: output_has_bones
```

이건 retargeter 잘못이 아님. FC_00078은 facial-only FBX (body 본 없음). 입력 단계에서 차단되어야 할 케이스가 retargeter까지 가서 실패로 카운트됨.

올바른 보고:
```
vroid_xiao × FC_00078  GATED — rubric_a hard fail: body_skin_present
```

차단 위치가 명확해지면:
- regression analysis 시 retargeter 회귀와 input 회귀를 분리 가능
- shotloom-import의 같은 ordering 패턴 mirroring
- "facial FBX인데 body 모델에 retarget" 같은 잘못된 페어링이 즉시 보임

## 사용자 요청 — 포맷-비종속 네이밍

작업 도중 사용자 메시지:
> "그 A는 기존 fbx에서 소스 애니메이션이라고  B는 기존 vrm에서 모델로 명시하는건 어떰?"

오늘 아침 SourceAnim split을 한 마당에 rubric 이름이 여전히 "FBX Source" / "VRM Model"이면 일관성 깨짐. format-agnostic으로 rename 같이 진행.

## 변경

### `quality/mod.rs` — gating helper

```rust
impl RubricResult {
    pub fn first_hard_fail(&self) -> Option<&str> { ... }
}

pub fn check_gating(
    rubric_a: &RubricResult,
    rubric_b: &RubricResult,
) -> Option<String>
```

- `Some(reason)`이면 C 스킵
- `None`이면 retarget + C 진행
- reason 문자열은 sweep output에 그대로 출력

### `quality/rubric_a.rs`

1. **`rubric_name`**: `"FBX Source"` → `"Source Animation"`
2. **`evaluate(fbx)` 내부**: `SourceAnimBody::from_source_asset(fbx)` 로 view 생성, `check_hard_fails(&body)`에 전달
3. **`check_hard_fails`**: 시그니처 `&SourceAnimBody` 로 변경, 내부 필드 접근 모두 `body.*`
4. **새 hard-fail A0.5 `body_skin_present`**:
   ```rust
   let bind_cluster_count = body.bind_world.len();
   HardFailCheck {
       passed: bind_cluster_count > 0,
       detail: format!("{} skin clusters (0 = facial-only)", bind_cluster_count),
   }
   ```
   Body FBX는 skin clusters가 있고, facial-only FBX는 없음 (mesh가 blendshape로 변형, joint 아님). 이게 facial-only 검출의 가장 신뢰할 수 있는 신호.

5. metric 함수들 (`metric_angular_velocity_outliers` 등)은 여전히 `&SourceAsset` 받음. backwards compat 유지. 마이그레이션은 후속 작업.

### `quality/rubric_b.rs`

`rubric_name`: `"VRM Model"` → `"Model"`

(타입 시그니처는 이미 `&VrmRestPose` 받음 — format-agnostic. 변경 없음.)

### `bin/retarget_test.rs`

- A loop: rubric_a 결과를 `HashMap<String, RubricResult>`에 캐시
- B loop: vrm_data tuple에 `score_b: RubricResult` 추가 (4-tuple → 5-tuple)
- C loop: 매 페어링 시작 시 `quality::check_gating(score_a, score_b)` 호출
  - Some(reason) → "GATED — {reason}" 출력 후 continue
  - None → 기존 retarget + rubric_c 흐름
- Summary: `Gated: N` 추가

### Headers rename

```
"===== Rubric A: FBX Source Quality ====="  →  "===== Rubric A: Source Animation Quality ====="
"===== Rubric B: VRM Model Quality ====="    →  "===== Rubric B: Model Quality ====="
```

## 시도 1번 실패 원인

처음에는 `body_animation_present`로 "tracks 중 rotations.len() > 1인 게 1개 이상"으로 정의했었음. FC_00078도 통과했음 — facial FBX에도 body 본 트랙이 1+ frame씩 있어서.

`bind_world.len() > 0`로 변경 후 FC_00078 정확히 검출. body FBX는 skin cluster이 있고 facial는 없음, 깔끔한 boolean signal.

교훈: "animation 있냐"는 모호함. "skin이 있냐"가 명확. **rig type signal은 skin/bind 데이터에서 찾을 것**.

## 결과

| Metric | Before | After |
|--------|--------|-------|
| Hard fails (Rubric C) | 19 | **0** |
| Gated | 0 | **19** |
| Retarget graded | 190 | 190 |
| Distribution | 12A 65B 75C 38F | 12A 65B 75C 38F (변화 없음) |

19개 facial-only 페어링이 **C에서 fail이 아니라 A에서 gate**로 재분류. 실제 graded retarget의 분포는 정확히 동일.

## 검증

- `cargo test -p humanoid_retarget`: 44/44 pass
- Sweep: 19 GATED + 190 graded + 0 hard fails (정확)
- Sample gated row:
  ```
  vroid_1x_f_xiao.vrm x FC_00078_F_SuddenFlutter_  GATED — rubric_a hard fail: body_skin_present
  ```

## LOC 변화

| 파일 | Δ |
|------|----|
| `quality/mod.rs` | +43 (helper + check_gating + doc) |
| `quality/rubric_a.rs` | +44 / -23 (rename + view + new hard-fail + doc) |
| `quality/rubric_b.rs` | +1 / -1 (rename only) |
| `bin/retarget_test.rs` | +35 / -7 (caching + gating logic) |
| **net** | +109 / -32 = +77 |

## 차단 항목 진척

| # | 항목 | 상태 |
|---|------|------|
| 1 | SourceAnim body/facial split | ✅ |
| 2 | EXP-006 → postprocess module | ✅ |
| 3 | Diagnostic 변환 layer | ✅ |
| 4 | A/B/C pipeline gating | ✅ (이번) |
| 5 | C1.1, C1.4 residual 재설계 | ⬜ |

**4/5 (80%) 진척.**

## 교훈

### "input failure"와 "output failure"는 같은 등급으로 보고하면 안 된다

기존 sweep는 둘 다 "F"로 보고함. retargeter 회귀를 정확히 추적하려면 input failure를 F가 아닌 별도 카테고리(GATED)로 분리 필수.

### Rig type signal은 bind/skin data에서 찾을 것

facial vs body 구분을 "track count" 같은 modal data로 시도하면 facial에도 body 본 트랙이 있는 케이스에 걸림. **structural signal**(bind_world entries)을 써야 정확.

### Format-agnostic naming은 사용자가 짚어줘야 안다

내가 SourceAnim split을 만들 때 rubric_name 문자열은 의식적으로 안 건드렸음. 사용자가 "이왕이면 rename도" 해달라고 짚어줘야 인지. 다음 비슷한 split 작업 시 doc/string도 같이 점검할 것 — checklist 항목.

### 내부 함수는 backwards compat 유지하면서 외부만 마이그레이션

`rubric_a::evaluate(&SourceAsset)` 시그니처는 그대로. 내부 hard_fails만 view 받음. Metric fns는 추후 migration. **부분 마이그레이션이 가능한 layered 변경**이 일반적으로 best.

### `check_gating()`은 trait 없는 free fn으로 충분

Orchestration 객체 (RetargetSession 등) 만들지 않고 단일 free fn. caller가 자유롭게 결과를 묶음. 미래에 stateful orchestration이 필요해지면 그때 trait 도입. tier1 devlog 교훈 그대로.

## 커밋

- bevy-vrm `ab2c175` feat: A/B/C pipeline gating + format-agnostic rubric naming
