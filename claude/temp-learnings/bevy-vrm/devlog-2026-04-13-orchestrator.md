# 2026-04-13 — Orchestrator stub (shotloom 포팅 #5a)

A → B → gate → C 파이프라인을 단일 진입점으로 묶는 `humanoid_retarget::orchestrate::evaluate_pipeline` 함수 추가. shotloom-import의 형식을 미리 박아둠.

## Why

이전까지 sweep bin (retarget_test)이 A/B/C를 inline으로 흩뿌려 호출. 단점:
- 다른 caller가 같은 흐름 reproduce 못 함 (코드 복사 필요)
- 게이팅 결정 + 변환 layer + 결과 aggregation이 한 곳에 모이지 않음
- shotloom 포팅 시 매번 파이프라인 구조 다시 짜야 함

이 fn 도입 후:
- 단일 호출로 전체 파이프라인 실행
- 결과는 `PipelineResult` struct 한 개 (모든 정보 + diagnostics)
- 미래 caller (viewer diagnostic mode, headless validate, shotloom-import port)는 동일 fn 호출

## API

```rust
pub fn evaluate_pipeline(
    source_asset: &SourceAsset,
    vrm_rest: &VrmRestPose,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> PipelineResult

pub struct PipelineResult {
    pub rubric_a: Option<RubricResult>,
    pub rubric_b: Option<RubricResult>,
    pub rubric_c: Option<RubricResult>,
    pub target_animation: Option<TargetAnimation>,
    pub gated_reason: Option<String>,
    pub error: Option<String>,
    pub diagnostics: Vec<Diagnostic>,
}

impl PipelineResult {
    pub fn is_evaluated(&self) -> bool;
    pub fn is_gated(&self) -> bool;
    pub fn has_error(&self) -> bool;
}
```

## 파이프라인 단계

```
1. rubric_a::evaluate(source_asset)
   ↓
2. rubric_b::evaluate(vrm_rest)
   ↓
3. check_gating(a, b)
   ↓ Some(reason) → return early (gated)
   ↓ None
4. mapping::retarget(source, config, vrm_version)  → MappedAnimation
5. compute_fbx_skeleton_from_parsed(source)        → FbxSkeletonFrames
6. ArpRetargeterInner::new + apply                 → TargetAnimation
7. fk_evaluate::evaluate                            → VrmSkeletonFrames
8. Build src_rotations_by_vrm map (C1.3 residual용)
9. rubric_c::evaluate
   ↓
10. Aggregate all rubric diagnostics → PipelineResult.diagnostics
```

각 step에 실패 시 `error` 필드에 메시지 채우고 early return. 부분 결과 (e.g., A는 통과했는데 mapping 실패)는 그대로 보존.

## 결정들

### Free function vs trait

`trait Pipeline` 안 만들고 free fn. 구현체 1개일 때 trait은 미래 부채. 두 번째 orchestrator (예: 다른 retargeter impl 사용) 생기면 그때 도입.

### Builder vs direct args

`PipelineBuilder::new().source(...).rest(...).build()` 같은 builder 안 함. 4개 인자라 직접 전달이 더 명확. 6+개로 늘어나면 builder 검토.

### Result struct vs enum

Enum (`Gated`/`Evaluated`/`Failed`)도 고려했지만 struct + Optional fields + helper methods가 더 유연:
- 부분 결과 표현 가능 (gated인데 rubric A만 있는 상태 등)
- 새 필드 추가가 enum variant 추가보다 backwards compat
- 호출자가 자유롭게 `.is_evaluated()` 같은 helper로 분기

### `target_animation` 포함

`Option<TargetAnimation>`도 결과에 포함. 미래에 caller가 쟈 결과를 viewer로 전달하거나 파일로 저장할 수 있음. 지금은 안 쓰지만 enable.

## Sweep bin 통합 안 함 (이번 commit)

기존 retarget_test.rs는 inline 파이프라인을 그대로 둠. 이유:
- 빈의 출력 포맷 (rubric별 섹션 헤더, A/B/C 분리 출력)이 evaluate_pipeline 한 호출로는 unicode 못 함
- 빈 통합은 별개 작업으로 분리 (다음 세션 시 가능)
- 이 commit은 **새 모듈 추가**에만 집중

빈 통합은 별도 PR로:
1. retarget_test.rs를 evaluate_pipeline 호출 기반으로 재작성
2. 출력은 PipelineResult에서 각 rubric을 꺼내 표시

## Unit tests (4개 신규)

```
test outcome_helpers_evaluated ... ok
test outcome_helpers_gated ... ok
test outcome_helpers_error ... ok
test gated_path_aggregates_a_and_b_only ... ok
```

`evaluate_pipeline` 자체의 통합 테스트는 없음 — 실제 SourceAsset / VrmRestPose 빌드가 무거움. 작은 helper 검증만으로 시작. 미래에 `tests/orchestrate_smoke.rs`에서 fixture로 통합 테스트 추가 가능.

`cargo test -p humanoid_retarget`: **48 pass** (4 new + 9 diagnostic + 35 기존).

## LOC 변화

| 파일 | Δ |
|------|----|
| `orchestrate.rs` (new) | +293 (절반 doc + tests) |
| `lib.rs` | +1 |
| **net** | +294 |

## 차단 항목 진척

| # | 항목 | 상태 |
|---|------|------|
| 1 | SourceAnim body/facial split | ✅ |
| 2 | EXP-006 → postprocess module | ✅ |
| 3 | Diagnostic 변환 layer | ✅ |
| 4 | A/B/C pipeline gating | ✅ |
| 5a | Orchestrator stub | ✅ (이번) |
| 5b | C1.1, C1.4 residual 재설계 | ⬜ (별개 세션) |

**5/6 = 83%** (5b는 metric 내부 작업이라 shotloom 포팅 차단 X, 후속 작업).

## shotloom 포팅 시 사용 패턴

```rust
// shotloom-import::import_and_validate
use shotloom_retarget::orchestrate::{evaluate_pipeline, PipelineResult};
use shotloom_retarget::{SourceAsset, VrmRestPose, RetargetConfig, VrmVersion};

pub fn import_and_validate(
    fbx_path: &Path,
    vrm_path: &Path,
    config_path: &Path,
) -> Result<PipelineResult, ImportError> {
    let source = parse_fbx_file(fbx_path)?;
    let vrm_rest = load_vrm_rest(vrm_path)?;
    let config = load_config(config_path)?;
    let vrm_version = detect_vrm_version(vrm_path)?;
    
    let result = evaluate_pipeline(&source, &vrm_rest, &config, vrm_version);
    
    if result.has_error() {
        return Err(ImportError::PipelineError(result.error.unwrap()));
    }
    
    // diagnostics는 shotloom_common::Diagnostic과 형식 호환
    for diag in &result.diagnostics {
        emit_diagnostic_to_user(diag);
    }
    
    Ok(result)
}
```

bevy-vrm 쪽 코드를 한 줄 import만 바꾸면 그대로 작동. mechanical port의 핵심.

## 교훈

### "Orchestrator stub"이 trait 시스템보다 가치 있다

`trait Pipeline { fn run(...) }` 만들고 싶은 유혹이 있지만 free fn 하나로 충분. trait는 multiple impls가 생길 때 가치 발생. 지금은 **shape document**가 핵심 — fn 시그니처 + struct 필드만 박아두면 shotloom port 시 mechanical replacement 가능.

### Result struct field가 enum variant보다 진화 가능

새 필드 추가는 backwards compat 있음. 새 enum variant는 caller match exhaustiveness 깨뜨림. 진화하는 API에선 struct + optional fields가 안전.

### "통합은 다른 PR" 분리가 commit 가독성 향상

이 commit은 "새 모듈 추가"만 함. 빈 통합은 다른 commit으로 분리. 한 번에 두 가지 concern 섞으면 review/revert 어려움. **하나의 commit = 하나의 개념 변경**.

### Doc-heavy 모듈

294 LOC 중 절반 이상이 doc + tests. 생산 코드는 ~120 LOC. 미래 reader (또는 future-self)가 "왜 trait 안 만들었지?" "왜 enum 안 썼지?" 질문 즉시 답.

## 커밋

- bevy-vrm `82cda9d` feat(orchestrate): A -> B -> gate -> C pipeline single entry point
