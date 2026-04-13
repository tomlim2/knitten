# 2026-04-13 — Diagnostic 변환 layer (shotloom 포팅 #3)

shotloom의 `shotloom_common::diagnostic::Diagnostic` (ADR-0021 spec)와 호환되는 변환 layer 추가. bevy-vrm 내부에서는 Grade 시스템 그대로, boundary에서만 Diagnostic으로 변환.

## Why

phase2-3 devlog의 shotloom 포팅 차단 항목 중:
> "1. **Diagnostic-based reporting, not letter grades.** `shotloom_common::diagnostic::Diagnostic {severity: Error/Warning/Info, code, message, location, suggestion, recoverable}`. ADR-0021 formalized it. **Do not introduce new Grade semantics in shotloom-side code.** Bevy-vrm's `Grade::A/B/C/F` must be translatable to severity via a simple mechanical mapping: A→nothing emitted, B→Info, C→Warning, F→Error."

오늘 그 mapping layer 구현. 미래 shotloom 포팅 시 이 파일을 `extern crate shotloom_common;` import로 한 줄 교체.

## 매핑

| Grade | Severity | 이유 |
|-------|----------|------|
| A | (없음) | "passing" — 보고할 것 없음 |
| B | Info | 사소한 편차, retarget 사용 가능 |
| C | Warning | 의미 있는 이슈, 수동 검토 추천 |
| F | Error | retarget 깨짐 또는 입력 무효 |

Hard-fail 체크는 grade 무관 항상 Error (non-recoverable).

## 구조

`crates/humanoid_retarget/src/quality/diagnostic.rs` 신설 (293 LOC, 절반은 doc + 절반은 unit tests).

핵심 타입:
```rust
pub enum Severity { Info, Warning, Error }

pub struct Diagnostic {
    pub severity: Severity,
    pub code: String,                // 예: "C1.2_GroundContact"
    pub message: String,
    pub location: Option<String>,    // rubric name 등
    pub suggestion: Option<String>,  // 미사용 (shotloom 포팅 후)
    pub recoverable: bool,
}
```

핵심 함수:
```rust
pub fn grade_to_severity(grade: Grade) -> Option<Severity>
pub fn rubric_to_diagnostics(result: &RubricResult) -> Vec<Diagnostic>
pub fn aggregate_severity(diags: &[Diagnostic]) -> Option<Severity>

impl Diagnostic {
    pub fn from_metric(metric: &MetricResult, rubric: &str) -> Option<Diagnostic>
    pub fn from_hard_fail(check: &HardFailCheck, rubric: &str) -> Diagnostic
}
```

## 왜 bevy-vrm 내부에선 Grade 유지

- **Grade**가 R&D sweep bin (1-char status per pairing)에 적합 — 한눈에 분포 파악
- **Diagnostic**이 production orchestration (code/location/suggestion 필터링)에 적합
- 둘 다 필요 — 내부 계산은 Grade, boundary 변환은 Diagnostic

이 결정의 핵심: **Grade를 교체하는 게 아니라 추가**. 기존 코드 변경 0, 새 export만 추가. 미래 shotloom-side caller가 `humanoid_retarget::quality::Diagnostic` 호출 가능.

## Unit tests (9개 신규)

```
test grade_a_emits_nothing ... ok
test grade_b_to_info ... ok
test grade_c_to_warning ... ok
test grade_f_to_error ... ok
test rubric_omits_grade_a_metrics ... ok
test hard_fails_always_error_and_non_recoverable ... ok
test passing_hard_fails_omitted ... ok
test aggregate_picks_highest_severity ... ok
test aggregate_empty_returns_none ... ok
```

전부 mapping 시맨틱 검증. 단순한 enum 매핑이지만 boundary fn이라 회귀 자동 감지하려고 fixture 만듦.

`cargo test -p humanoid_retarget`: **44 pass** (9 new + 35 existing).

## Sweep 영향

**없음** — 순수 additive 변경. 기존 caller 0개. 새 타입 export만.

## LOC 변화

| 파일 | Δ |
|------|----|
| `quality/diagnostic.rs` (new) | +293 (절반은 doc + tests) |
| `quality/mod.rs` | +2 (mod + re-export) |
| **net** | +295 |

## 미래 작업 (이번 commit에서 하지 않은 것)

`Diagnostic` 타입은 정의됐지만 **아직 어떤 caller도 사용 안 함**. 다음 단계 (#3 A/B/C gating) 또는 별도 작업에서:
- `retarget-test` 빈에 `--diagnostic-format` flag 추가 → grade letter 대신 Diagnostic JSON 출력
- `lib.rs::retarget_with_skeleton` 결과에 `Vec<Diagnostic>` 추가 (또는 별도 fn)
- shotloom-import orchestrator stub에서 사용 (가상)

지금은 **변환 path만 만들어두기**. 사용처는 caller 필요할 때 그때 추가.

## 차단 항목 진척

| # | 항목 | 상태 |
|---|------|------|
| 1 | SourceAnim body/facial split | ✅ |
| 2 | EXP-006 → postprocess module | ✅ |
| 3 | Diagnostic 변환 layer | ✅ (이번) |
| 4 | A/B/C pipeline gating | ⬜ |
| 5 | C1.1, C1.4 residual 재설계 | ⬜ |

**3/5 (60%) 진척.**

## 교훈

### 변환 layer는 정의만 먼저, caller는 나중

Diagnostic 타입 export만 했고 어떤 retarget bin도 아직 안 씀. "사용 안 하면 dead code 아니냐?" — 아님. 미래 caller (shotloom 포팅 시 첫 사용) 가 type을 보고 즉시 활용 가능. 인터페이스 협상 (negotiation surface) 역할.

### Doc-heavy 모듈

293 LOC 중 절반이 doc + tests. 생산 코드는 ~120 LOC. 처음 본 reader가 mapping 정책 + 미래 shotloom 통합 path를 한 번에 파악할 수 있게.

특히 핵심 doc:
- "Why bevy-vrm keeps Grade" — 두 시스템 공존 정당화
- "Future shape" — shotloom 교체 시 mechanical operation 명시
- "Grade → Severity mapping" 표 — 정책 한눈에

이 doc이 미래 contributor (또는 future-self)가 "왜 Grade를 안 지우고 Diagnostic을 추가했나?" 질문하면 답을 줌.

### Unit test가 enum mapping에도 필요

`grade_to_severity(Grade::A) → None` 같은 1줄 매핑도 unit test 작성. 미래에 누가 `Severity::Info` 정의를 바꾸거나 `Grade::A → Some(Info)`로 잘못 수정하면 즉시 깨짐. cheap insurance.

## 커밋

- bevy-vrm `3302fa5` feat(quality): add Diagnostic conversion layer (Grade -> Severity)
