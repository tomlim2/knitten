---
skill: cci-codex-port-bevy
timestamp: 2026-04-14T11:28:47+09:00
cwd: /Users/deemooooooooo/Desktop/www/caol-ila
model: gpt-5.4
reasoning_effort: high
---

## Prompt

```
당신은 Rust 워크스페이스 마이그레이션 전문가다. 아래 bevy-vrm 모듈을
shotloom 레포의 shotloom-retarget crate로 이식하는 **계획서**를 작성하라.

## Scope Context (caller-provided)
- Phase: Phase B Session 1 complete (scaffold + ADR-0023 landed). Planning Session 2 (types + rubric + retargeter port).
- Out-of-scope: ValidatedSource/ValidatedTarget marker impl (Session 3), caller migration / viewer wiring (Session 4), shotloom-desktop Tauri icon bug (pre-existing, unrelated)
- Binding ADRs (read these first): docs/adr/adr-0023-retargeter-validation-contract.md (the contract you are porting to); docs/adr/adr-0021-cross-crate-diagnostic-type.md (Diagnostic type shotloom-common owns)
- Known constraints:
  - Quality types (Grade, RubricResult, MetricResult, HardFailCheck, rubric_a/b/c, fk_evaluate, score, detector) stay DOMAIN-LOCAL to shotloom-retarget — never exported to shotloom-common.
  - The bevy-vrm local `quality/diagnostic.rs` module MUST be replaced with imports from shotloom-common::diagnostic (which already exists and has a superset of fields). Do not copy that file.
  - `rubric_to_diagnostics` stays in shotloom-retarget as the one-way lossy projection from RubricResult to Vec<shotloom_common::Diagnostic>.
  - `src/quality/foot.rs` was DELETED upstream as dead code — must NOT be ported.
  - shotloom-retarget owns NO scene/actor/character concept. Assembly is caller responsibility.
  - Public entry point is `evaluate_pipeline` (name may change). Session 2 does not yet gate inputs with ValidatedSource/ValidatedTarget markers — that's Session 3.
  - Source crate name changed: bevy-vrm uses `humanoid_retarget` (NOT `cinev_retarget` — if the skill template mentions that, ignore it).
  - Rename: the source crate root is `crates/humanoid_retarget`, target is `crates/shotloom-retarget` (already scaffolded as empty lib.rs + Cargo.toml).
  - Session 2's single goal: move types/modules so that `cargo check -p shotloom-retarget` passes with real code. NO runtime wiring into shotloom-import yet.

---

## Uncertainty Protocol (binding)
- If given information is not sufficient to reach a conclusion, do not
  fabricate one. Collect such items in a dedicated "Insufficient
  evidence" section at the end.
- If a design decision is not fixed by the binding ADRs or constraints,
  do not guess. Collect it in a "Decision needed" section as an open
  question.
- If an observation is relevant but outside the declared scope, move
  it to an "Out-of-scope observation" section. Do not mix it with the
  in-scope analysis.

---

**대상**: 크레이트 전체 (`crates/humanoid_retarget`)
**소스 레포**: bevy-vrm/crates/humanoid_retarget/
**대상 레포**: shotloom-github/crates/shotloom-retarget/ (빈 scaffold 완료)

**계획서 구조** (반드시 이 순서):

1. **크레이트 한 줄 요약**
2. **의존성 그래프** — 크레이트 내부 모듈 간 그래프 (A → B 형식)
3. **Session-level manifest** — 아래 표 형식으로 제출:

   | Session | Files moved | Renames | Dependencies on previous sessions | Exit criteria |
   |---|---|---|---|---|

   Session 2만 상세히, Session 3/4는 한 줄 요약.
4. **Contract Surface** — shotloom-retarget이 외부에 노출할 함수/타입 (Session 2 말미 기준)
5. **이식 시 주의점** — rename, import path, feature flag, lifetime/ownership 충돌
6. **검증 전략** — 이식 직후 "옮겨졌다"를 증명하는 방법. 기존 bevy-vrm 테스트 중 어느 것을 함께 옮길지.
7. **위험도** — 🟢/🟡/🔴 + 추정 작업 시간 (1시간 단위) + 가장 큰 unknown
8. **Insufficient evidence**
9. **Decision needed**
10. **Out-of-scope observation**

**금지**:
- "그냥 복사하면 됨" 같은 안일한 결론
- 코드를 직접 작성하지 말 것 — 계획만
- 추측성 "may need..." 금지 — 의존성은 grep해서 확인하라

---

## Binding ADRs (preloaded)

### ADR-0023 (retargeter validation contract)

# ADR-0023: Retargeter Validation Contract and Diagnostic Boundary

## Status

Proposed

## Context

Shotloom needs a skeletal animation retargeting pipeline that adapts
source animation (ARP-style humanoid FBX) onto VRM target models. The
pipeline runs both inside the browser (WebGPU editor) and in CLI /
batch sweep contexts for regression testing, and must produce:

1. **A transformed animation** ready to drive a specific VRM character,
   preserving motion geometry as far as the target rig allows.
2. **Operational diagnostics** about whether the transformation could
   run at all — parse failures, missing skeleton bones, NaN outputs,
   rubric hard-fail gates — flowing through the same
   `shotloom-common::Diagnostic` channel other shotloom subsystems
   already use (per ADR-0021).
3. **Quality measurements** about how faithfully the transformation
   matched the source, expressed in a richer grade space than the
   3-level Diagnostic severity — the existing rubric work uses four
   letter grades (A / B / C / F) plus per-metric weighted scores.

These three outputs have two different stakeholders and two different
taxonomies:

- **Operational diagnostics** belong on the cross-crate boundary per
  ADR-0021. They must fit `shotloom-common::Diagnostic` shape (3-level
  severity, `code` / `message` / optional location). Consumed by the
  editor UI error surfaces, CLI exit codes, and orchestration
  pipelines that decide "can we proceed or not."
- **Quality grades** are domain-specific to the retargeter. Compressing
  four grades into three severities loses information that in-crate
  tooling (regression sweeps, per-metric debugging, golden tests)
  legitimately needs. They belong inside the retargeter crate and
  flow across crate boundaries only as a lossy projection when a
  cross-crate consumer asks for "is it fine or not."

Without an explicit decision capturing this split, each subsequent
Phase B session risks either collapsing the rubric system into
Diagnostic (losing information) or inventing yet another cross-crate
quality type (fragmenting ADR-0021). A second, equally load-bearing
question is the scope of the new `shotloom-retarget` crate: does it
own scene / actor / character identity, or is it a pure library that
gets assembled by its callers?

Finally, a structural question: how do we enforce at the type level
that retargeting requires **both** a validated source animation
**and** a validated target model, so that no caller can accidentally
skip either validation gate?

## Decision

### 1. Two disjoint axes: operational diagnostic vs quality grade

Every observation the retargeter pipeline makes belongs on exactly one
axis.

**Operational diagnostic axis.** Uses `shotloom-common::Diagnostic`
per ADR-0021. Three severity levels (`Error` / `Warning` / `Info`).
Produced when the pipeline answers the question "can the retarget
actually run and yield a usable output?"

Examples that belong on the operational axis:

- `no bones in retarget output` after FK evaluation
- `NaN detected in output bone N at frame F`
- `FBX parse error`, `VRM rest extraction failed`, `mapping failed`
- Rubric A hard-fail (source animation structurally invalid, e.g.
  `body_skin_present: 0 skin clusters`)
- Rubric B hard-fail (target model structurally invalid, e.g.
  missing humanoid bones)
- Pipeline gated because A or B hard-failed — the gate reason
  surfaces as a `Diagnostic::Error` so downstream UI can display
  "retarget was not attempted because X."

**Quality grade axis.** Uses `shotloom-retarget`-local types:
`Grade { A, B, C, F }`, `RubricResult { hard_fails, metrics, overall,
overall_score }`, `MetricResult { name, grade, score, detail }`.
Produced when the pipeline answers the question "given that retarget
ran to completion, how faithfully did it preserve the motion?"

Examples that belong on the quality axis:

- `arm path is 75% of source path` (C1.4 Fidelity)
- `joint overshoot 20° on right upper arm` (C1.1 JointLimit residual)
- `stability spike on left toes` (C1.3 Stability residual)
- `source animation has 30° pop` (A1.1 Angular velocity)
- `foot penetrates floor by 20mm` (C1.2 GroundContact)

**Decision heuristic** for new observations:

> If this observation is emitted, can the user view a retargeted
> animation?
>
> - No, because no output was produced → operational, `Error`.
> - No, because a gate refused to run → operational, `Error`
>   (gate reason).
> - Yes, but the output has issues worth flagging → quality grade.
> - Yes, the output is acceptable → silent (`Grade::A`, no
>   diagnostic).

### 2. Domain-local ownership of quality types

`Grade`, `RubricResult`, `MetricResult`, `HardFailCheck`, and the
`rubric_a` / `rubric_b` / `rubric_c` evaluation modules live inside
`shotloom-retarget`. They are not exported to `shotloom-common` and
are not part of the cross-crate type surface.

Cross-crate consumers (`shotloom-web`, `shotloom-native`,
`shotloom-import`) that want a readable "did it go well" answer
receive `Vec<Diagnostic>` produced by a one-way projection function
`rubric_to_diagnostics` living inside `shotloom-retarget`. The
projection is intentionally lossy:

- Hard-fail checks → `Diagnostic::Error` with the hard-fail name as
  `code` and the rubric name as `location`.
- Metric graded `F` → `Diagnostic::Error` with metric name as `code`
  and metric detail as `message`.
- Metric graded `C` → `Diagnostic::Warning` with same fields.
- Metric graded `B` → `Diagnostic::Info` with same fields.
- Metric graded `A` → no diagnostic emitted (passing is silent).

Consumers that need the full 4-grade view (regression sweeps, golden
tests, per-metric debugging) read `RubricResult` directly. Consumers
that only need the boundary-friendly projection read the
`Vec<Diagnostic>` output.

### 3. shotloom-retarget scope: ARP→VRM transformation only

The `shotloom-retarget` crate owns exactly one responsibility:
transforming a validated source skeletal animation (ARP-shaped
humanoid) into a target VRM animation, and grading the result. It
does not own:

- Scene, actor, character, or subject containers. There is no
  `Character` type that bundles a VRM with its current animation.
- File format parsing of VRMs, FBXs, or any other asset. Those live
  in `shotloom-gltf`, the future FBX importer, and their siblings.
- Asset lifecycle management, caching, or persistence. Those are
  orchestration concerns handled by `shotloom-import`,
  `shotloom-stage`, and the bundle layer.
- UI presentation of grades, diagnostics, or intermediate state.

The crate's public surface is a function (or small set of functions)
that accepts validated inputs and returns a validated output plus
diagnostics. Callers compose these functions with their own scene /
actor / assembly concepts as appropriate.

### 4. Type-level "both inputs validated" contract

The retargeter's public entry point requires **both** a validated
source animation **and** a validated target model. This is enforced
at the type level via marker newtypes owned by `shotloom-common`:

```text
shotloom-common::
    pub struct ValidatedSource<'a> { ... }
    pub struct ValidatedTarget<'a> { ... }

shotloom-retarget::
    pub fn retarget(
        src: &ValidatedSource<'_>,
        tgt: &ValidatedTarget<'_>,
    ) -> Result<(TargetAnimation, RubricResult), RetargetError>
```

The markers are constructed by `validate()` constructors that run the
respective rubric gates (Rubric A for source, Rubric B for target)
and return `Result<Self, ValidationError>`. `ValidationError` carries
the failing rubric result for diagnostic projection. A caller that
has not run both validations cannot construct both markers and
therefore cannot call `retarget()` — the contract is enforced by the
compiler, not by documentation.

This is the type-level answer to the "source animation and model are
both required" constraint. Assembly (binding a source animation to a
particular character entity in a scene) remains a caller concern; the
retargeter only knows that both markers are present.

*This ADR defines the contract shape. The actual marker
implementation lands in a later Phase B session, once the crate
skeleton exists and the modules to be ported have settled.*

### 5. Phasing

Phase B splits into sessions so each commit is reviewable:

1. **Session 1 (this ADR + scaffold).** Crate skeleton created,
   ADR-0023 proposed, workspace registered.
2. **Session 2.** Port the domain-local types (`SourceAsset`,
   `MappedAnimation`, `TargetAnimation`, `VrmRestPose`) and the
   rubric modules into `shotloom-retarget`. No caller migration.
3. **Session 3.** Introduce `ValidatedSource` / `ValidatedTarget`
   markers in `shotloom-common`. Wire the retargeter's public entry
   point to consume them. Update `rubric_to_diagnostics` to produce
   `shotloom-common::Diagnostic`.
4. **Session 4.** Caller migration — `shotloom-import`,
   `shotloom-stage`, and any UI surfaces adopt the marker-gated
   contract. Regression sweep moves to the shotloom side.

## Consequences

**Positive.**

- The rubric system's 4-grade information survives the port intact.
  Regression sweeps, per-metric debugging, and golden tests continue
  to work without information loss.
- Cross-crate consumers get the familiar `Vec<Diagnostic>` shape per
  ADR-0021, with no new quality type fragmenting the API.
- The "source + target both required" constraint is enforced by the
  type system, not by convention or documentation. A caller that
  skips Rubric A cannot construct `ValidatedSource`, cannot call
  `retarget()`, and fails to compile.
- `shotloom-retarget` stays a pure library crate with no scene /
  actor concept, which keeps it reusable by future non-editor
  contexts (batch sweep, render CLI, regression tests) without
  dragging editor types along.
- The projection layer (`rubric_to_diagnostics`) is a single
  well-defined boundary, making it easy to audit what cross-crate
  consumers actually see.

**Negative.**

- Two parallel diagnostic-shaped surfaces exist: `RubricResult` and
  `Vec<Diagnostic>`. Tooling that wants both must read both or rely
  on the projection. This duplication is the cost of preserving the
  richer grade space.
- Marker newtypes introduce a lifetime parameter on the retargeter's
  public entry point. Callers must hold their source asset and
  target rest pose alive for the duration of the retarget call. This
  matches the existing borrow structure but is more explicit.
- `ValidatedSource::validate()` and `ValidatedTarget::validate()` run
  their respective rubrics eagerly. Callers that want to skip
  validation (e.g., trusted fast paths in hot loops) must go through
  a separate unchecked constructor, which does not exist in the
  initial contract and would require a follow-up decision.

**Neutral.**

- Phase B is four sessions instead of one. Each session produces a
  reviewable commit, and the scaffold session (this one) does not
  touch any real pipeline code — it only establishes the contract.
- Rubric type names (`Grade`, `RubricResult`, etc.) are not
  prefixed with the crate name, matching the bevy-vrm reference
  implementation and the existing shotloom convention where
  domain-local types use bare names inside their owning crate.

## Alternatives considered

### Collapse rubric into `Diagnostic` with 3 severities

Considered because it would unify the "how did it go" story under a
single type. Rejected because:

- Four grades (A/B/C/F) plus per-metric weighted scores cannot be
  represented in 3 severity levels without losing either the B/C
  distinction or the numeric score.
- Regression sweeps and golden tests that compare metric-level grade
  distributions across runs would lose their signal.
- ADR-0021 explicitly frames `Diagnostic` as "observations, not
  measurements." Rubric outputs are measurements.

### Put rubric types in `shotloom-common` next to `Diagnostic`

Considered because `shotloom-common` is already the home of
cross-cutting types. Rejected because:

- Rubric types carry domain knowledge about humanoid skeletons,
  frame-to-frame angular deltas, and ground contact that does not
  belong in a domain-agnostic foundation crate.
- Every crate depending on `shotloom-common` would transitively
  depend on the retargeter's vocabulary, which is not a cross-cutting
  concern.
- The `rubric_to_diagnostics` projection handles the legitimate
  cross-crate need without leaking internal types.

### No type-level validation — use runtime assertions

Considered for simplicity: `retarget()` accepts raw `SourceAsset` and
`VrmRestPose`, and panics if the caller skipped validation. Rejected
because:

- Runtime assertions in a library crate are brittle and give
  stacktrace-style failures far from the mistake site.
- The cost of marker newtypes is small: two structs in
  `shotloom-common`, ~80 lines total.
- Compile-time enforcement aligns with the broader Rust philosophy
  and matches how ADR-0021 treats `Diagnostic` as a disciplined shape
  rather than a free-form bag.

### Make `shotloom-retarget` scene-aware (bundle Character inside)

Considered because the editor ultimately cares about "this character's
current animation" more than "this animation's retarget result."
Rejected because:

- Scene / actor / character identity belongs in `shotloom-core` and
  `shotloom-stage`, not in a transformation library. Forcing it into
  `shotloom-retarget` would couple the transform to the editor's
  scene model.
- Non-editor consumers (render CLI, batch sweep, regression tests)
  retarget without any scene concept. A scene-aware retargeter
  crate would either duplicate logic or force these consumers to
  build fake scenes.
- The marker-newtype contract already enforces "both inputs present"
  at the type level, which is the only assembly guarantee the
  transformation needs.

### Port bevy-vrm's `Retargeter` trait shape verbatim

Considered for continuity. Rejected because the bevy-vrm
implementation deleted its own `Retargeter` trait as dead code in its
final pre-port cleanup — the trait had a single production
implementation and its signature took raw `&SourceAsset` /
`&VrmRestPose` references with no type-level validation. The shotloom
port is the right place to introduce the marker-based signature that
belongs at a crate boundary; replicating the old shape would mean
porting a known-wrong-shaped trait only to immediately replace it.

## Related

- [ADR-0021: Cross-Crate Diagnostic Type](adr-0021-cross-crate-diagnostic-type.md)
  — establishes the `Diagnostic` contract this ADR layers rubric
  projection on top of.
- [ADR-0010: UI-Independent Functionality in Rust Core](adr-0010-ui-independent-functionality.md)
  — crate responsibility boundary that motivates keeping scene /
  actor concepts out of `shotloom-retarget`.
- [ADR-0018: Runtime Telemetry and Error Boundaries](adr-0018-runtime-telemetry-and-error-boundaries.md)
  — bridge error payload architecture that `rubric_to_diagnostics`
  integrates with.

### ADR-0021 (cross-crate diagnostic type)

# ADR-0021: Cross-Crate Diagnostic Type

## Status

Accepted

## Context

Multiple Shotloom subsystems need to report structured observations about asset
quality, validation state, and evaluation results. Today each subsystem invents
its own reporting shape:

- `shotloom-gltf` defines `VrmDiagnostic` with severity, code, message, and an
  optional asset context string.
- `shotloom-core` defines `RuntimeErrorPayload` and `CommandRejectedPayload` as
  bridge protocol types for infrastructure failures and command rejections.
- The shot-ingestion spec (Pass 7) calls for structured validation diagnostics
  with severity, affected entity ID, human-readable message, and suggested
  action.
- ADR-0009 requires a "structured diagnostic (info severity)" when a non-void
  stage falls back to void rendering.
- The bridge contract (section 23.1) specifies a planned `validation_diagnostics`
  event with recommended fields: severity, code, message, related_ids, location,
  and recoverable.

Without a shared type, diagnostic shapes diverge across crates and the bridge
event payload cannot be standardized. This blocks at least four downstream
design decisions (STL-35, STL-37, STL-38, STL-42).

A key design distinction: **diagnostics are not errors.**

- **Diagnostic**: an observation or report about state — validation warnings,
  info notices, asset quality checks. Collected in a `Vec`, emitted via bridge
  events, displayed in UI. Can be any severity.
- **Error** (`VrmNormalizationError`, `RuntimeErrorPayload`, etc.): an actual
  failure that stops execution. Used with `Result<T, E>` and `?`.

A single operation can produce both: VRM normalization may succeed
(`Ok(asset)`) while carrying `Vec<Diagnostic>` with warnings about missing
metadata.

## Decision

### 1. Diagnostic type lives in `shotloom-common`

`shotloom-common` is the shared foundation crate ("shared error types, math
helpers, and common utilities"). The `Diagnostic` type is domain-agnostic —
it uses only primitive fields (`String`, `Vec<String>`, `Option`) and carries no
domain model dependency. Every workspace crate either already depends on
`shotloom-common` or can add the dependency cheaply.

This keeps the dependency graph clean: shared data types flow from
`shotloom-common`, domain and protocol types live in `shotloom-core`.

Bridge error payloads (`RuntimeErrorPayload`, `CommandRejectedPayload`) remain
in `shotloom-core` as specified by ADR-0018. They serve a different purpose:
infrastructure failure reporting through the bridge protocol. Diagnostics and
bridge errors share some fields but are not the same concern.

### 2. Diagnostic struct

```rust
// shotloom-common/src/diagnostic.rs

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct DiagnosticLocation {
    pub entity_type: String,
    pub entity_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub code: String,
    pub message: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub related_ids: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recoverable: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub location: Option<DiagnosticLocation>,
}
```

Field rationale:

| Field | Type | Purpose |
|-------|------|---------|
| `severity` | `DiagnosticSeverity` | Error (hard-gate, reject), Warning (soft-gate, allow), Info (observation) |
| `code` | `String` | Machine-readable bare `snake_case` identifier scoped by the `source` field: `"missing_required_bone"`, `"overlapping_clips"`. |
| `message` | `String` | Human-readable description |
| `related_ids` | `Vec<String>` | Secondary entity references (clip IDs, bone names, asset IDs) |
| `source` | `Option<String>` | Producing subsystem: `"vrm_parser"`, `"timeline_eval"`. Optional for forward compatibility. |
| `suggestion` | `Option<String>` | Actionable recovery hint when available |
| `recoverable` | `Option<bool>` | Whether the user can take action to fix the issue. `None` when the producer has no guidance (matches `retryable` pattern in `RuntimeErrorPayload`). |
| `location` | `Option<DiagnosticLocation>` | Tagged primary entity: `entity_type` + `entity_id` |

`DiagnosticLocation` uses a tagged-string pattern (`entity_type` + `entity_id`)
to remain domain-agnostic. Entity type values (e.g., `"clip"`, `"character"`,
`"asset"`, `"bone"`) are conventions enforced by a constants module, not a
closed enum in `shotloom-common`.

### 3. Diagnostics are transient

Diagnostics are recomputed each evaluation or validation pass. They are never
stored in the project bundle. The bridge emits them via `validation_diagnostics`
events; the UI replaces its diagnostic state on each emission. Undo/redo does
not track diagnostic state — diagnostics are a derived view of project state.

### 4. No collection wrapper

Consumers use `Vec<Diagnostic>` directly. This is consistent with all existing
bridge payload types (`Vec<String>` for IDs, etc.). No `DiagnosticCollection`
newtype.

### 5. Constructor helpers and Display

```rust
impl Diagnostic {
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self;
    pub fn warning(code: impl Into<String>, message: impl Into<String>) -> Self;
    pub fn info(code: impl Into<String>, message: impl Into<String>) -> Self;

    pub fn with_source(mut self, source: impl Into<String>) -> Self;
    pub fn with_suggestion(mut self, suggestion: impl Into<String>) -> Self;
    pub fn with_related_ids(mut self, ids: Vec<String>) -> Self;
    pub fn with_location(mut self, entity_type: impl Into<String>, entity_id: impl Into<String>) -> Self;
    pub fn with_recoverable(mut self, recoverable: bool) -> Self;
}

impl std::fmt::Display for Diagnostic {
    // Formats as: [ERROR] missing_required_bone: Required bone 'hips' not found
}
```

`Diagnostic` implements `Display` for logging and CLI output. It does **not**
implement `std::error::Error` — diagnostics are observations, not failures.

### 6. Diagnostic codes are crate-local

Diagnostic code constants (e.g., `"invalid_glb"`,
`"overlapping_clips"`) live in the crate that produces the
diagnostic, not in `shotloom-common`. This keeps domain knowledge in
domain crates. `shotloom-common` provides the type; each producing crate
defines its own vocabulary.

### 7. VrmDiagnostic migration

`VrmDiagnostic` remains in `shotloom-gltf` (publicly exported for downstream
use). The `shotloom-import` crate converts `VrmDiagnostic` to `Diagnostic`
at the import boundary via a standalone conversion function. (A `From`
trait impl is not possible due to Rust's orphan rule — neither type is
local to `shotloom-import`.) This avoids forcing `shotloom-gltf` to depend
on `shotloom-common` immediately while keeping the public API unified.

If `shotloom-gltf` later adds a `shotloom-common` dependency for other
reasons, `VrmDiagnostic` can be replaced with `Diagnostic` directly.

The `asset_context: Option<String>` field in `VrmDiagnostic` maps to
`location: Some(DiagnosticLocation { entity_type: "asset_path", entity_id })`,
preserving the JSON pointer path information without semantic loss.

Note: `VrmDiagnosticSeverity` has no `Info` variant. The conversion maps
`Warning` to `DiagnosticSeverity::Warning` and `Error` to
`DiagnosticSeverity::Error`. This is sufficient — VRM validation produces
only warnings and errors, never informational observations.

## Consequences

- All subsystems emit the same diagnostic shape, enabling a single
  `validation_diagnostics` bridge event and a uniform UI diagnostic panel.
- `shotloom-common` gains `serde` as a dependency. This is acceptable since
  most workspace crates already depend on serde transitively.
- The `Diagnostic` type is intentionally simple (all `String` fields, no
  generics, no lifetimes). This prioritizes serialization ease and cross-crate
  compatibility over micro-optimizations.
- Bridge error types (`RuntimeErrorPayload`, `CommandRejectedPayload`) remain
  separate in `shotloom-core`. They serve infrastructure error reporting, not
  domain observation. No unification is needed.
- Diagnostic codes are conventions (string constants), not a closed type. This
  trades compile-time exhaustiveness for cross-crate extensibility.
- Transient-only semantics mean no migration, versioning, or bundle schema
  changes are required.

## Alternatives considered

### Place Diagnostic in `shotloom-core`

Considered because `shotloom-core` already owns bridge DTOs and has serde.
Rejected because `Diagnostic` is domain-agnostic infrastructure (like
telemetry), not domain model. Placing it in `shotloom-core` would force
every diagnostic producer to depend on the domain model crate, even when
they only need the shared observation type. `shotloom-common` is the
correct layer for cross-cutting shared types.

### Trait-based Diagnostic (miette pattern)

A `Diagnostic` trait extending `std::error::Error` with provided methods
for severity, code, help, related, etc. Rejected because:

- Diagnostics are not errors — implementing `Error` conflates observation
  with failure.
- Trait objects require boxing for collection (`Vec<Box<dyn Diagnostic>>`),
  adding allocation overhead and complexity.
- A concrete struct is simpler to serialize, collect, and pass through the
  bridge.

### Dedicated `shotloom-diagnostic` crate

A new crate solely for the diagnostic type. Rejected as premature — the type
is small (~100 LOC) and fits naturally in `shotloom-common`'s stated scope.
If `shotloom-common` grows beyond its intended size, the diagnostic module
can be extracted later without breaking dependents.

### Typed enum for codes instead of strings

A `DiagnosticCode` enum with all possible codes. Rejected because:

- The enum would need to live in the lowest shared crate but contain
  domain-specific variants from every subsystem.
- Adding a new diagnostic would require modifying the shared enum,
  creating unnecessary coupling.
- Path-style string codes with a constants module provide similar
  discoverability without the coupling.

### Structured enum for location

A `DiagnosticLocation` enum with variants like `Clip { clip_id, track_id }`,
`Character { character_id }`, etc. Rejected because it couples
`shotloom-common` to domain entity types. The tagged-string pattern
(`entity_type` + `entity_id`) provides equivalent UI routing capability
without domain coupling.

## Related

- [ADR-0009: Void Stage and Coordinate System](adr-0009-void-stage-and-coordinate-system.md) — requires info-severity diagnostic for stage fallback
- [ADR-0010: UI-Independent Functionality](adr-0010-ui-independent-functionality.md) — crate responsibility boundaries inform placement decision
- [ADR-0018: Runtime Telemetry and Error Boundaries](adr-0018-runtime-telemetry-and-error-boundaries.md) — bridge error payloads remain in `shotloom-core`
- [docs/ipc/bridge-contract.md](../ipc/bridge-contract.md) — section 23.1 `validation_diagnostics` event
- [docs/specs/shot-ingestion.md](../specs/shot-ingestion.md) — Pass 7 validation diagnostic requirements

---

## Cargo.toml (humanoid_retarget)

```toml
[package]
name = "humanoid_retarget"
version = "0.1.0"
edition = "2024"

[dependencies]
fbx_rig = { path = "../fbx_rig" }
vrm0_compat = { path = "../vrm0_compat" }
glam = "0.30"
gltf = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"

[[bin]]
name = "retarget-test"
path = "src/bin/retarget_test.rs"

[[bin]]
name = "pop-scan"
path = "src/bin/pop_scan.rs"

[[bin]]
name = "validate-pipeline"
path = "src/bin/validate_pipeline.rs"

[[bin]]
name = "fbx-summary-scratch"
path = "src/bin/fbx_summary_scratch.rs"
```

## Source file tree with LOC

```
      14 src/adapters/mod.rs
      16 src/topo.rs
      24 src/vrm_compat.rs
      29 tests/finger_axis_map.rs
      31 src/bin/validate_pipeline.rs
      38 src/postprocess/mod.rs
      63 src/bin/pop_scan.rs
      72 src/quality/detector.rs
     104 src/config.rs
     111 src/postprocess/wrist_twist.rs
     115 src/source_anim.rs
     120 src/adapters/arp_vrm_user_pose.rs
     127 src/types.rs
     146 src/lib.rs
     161 src/quality/fk_evaluate.rs
     172 src/finger_rest_align.rs
     179 tests/finger_rest_align.rs
     183 tests/integration.rs
     209 src/bin/retarget_test.rs
     291 src/quality/diagnostic.rs
     300 src/quality/mod.rs
     301 src/orchestrate.rs
     307 src/finger_axis_map.rs
     324 src/quality/score.rs
     331 tests/fixtures/mod.rs
     391 src/quality/validate.rs
     398 src/quality/rubric_b.rs
     438 src/bin/fbx_summary_scratch.rs
     479 src/adapters/arp_vrm.rs
     479 src/mapping.rs
     578 src/quality/rubric_a.rs
     617 tests/metric_fixtures.rs
     708 src/vrm_rest.rs
     751 src/retargeter.rs
     828 src/quality/rubric_c.rs
    9435 total
```

## Source files — full content (LOC ≤ 500)

### `src/orchestrate.rs` (     301 LOC)

```rust
//! A → B → gate → C pipeline orchestration.
//!
//! Single entry point that runs all three rubrics in the correct order
//! with proper gating, returns a unified [`PipelineResult`]. This is the
//! shape `shotloom-import::import_and_validate` will mirror once the
//! shotloom port lands; until then bevy-vrm callers (sweep bin, viewer
//! diagnostic mode, future tests) use the same API.
//!
//! ## Why orchestration lives in its own module
//!
//! The bin already runs A → B → C inline. Extracting into a free
//! function:
//! - **Centralises the order** — gating checks happen in one place
//!   instead of every caller re-implementing them.
//! - **Returns structured output** — diagnostics, gating reason, and
//!   each rubric result are all in one struct so downstream consumers
//!   (Display, JSON serialise, shotloom import) format from the same
//!   shape.
//! - **Mirrors shotloom-import** — when the port lands, the shotloom
//!   side has a function with the same input/output contract, just
//!   importing from `shotloom-retarget` instead of `humanoid_retarget`.
//!
//! ## What this is not
//!
//! - Not a trait — single concrete impl is fine. Tier 1 lesson stands.
//! - Not a builder pattern — function takes refs to inputs the caller
//!   already owns.
//! - Not the only path — callers with custom needs (per-bone overrides,
//!   alternative retargeter impls) still call rubrics directly.

use std::collections::HashMap;

use glam::Quat;

use crate::config::RetargetConfig;
use crate::fbx::SourceAsset;
use crate::quality::{
    Diagnostic, RubricResult, check_gating, rubric_a, rubric_b, rubric_c,
    fk_evaluate, rubric_to_diagnostics,
};
use crate::types::{TargetAnimation, VrmRestPose};
use crate::vrm_compat::VrmVersion;

/// Outcome of running the A → B → gate → C pipeline.
///
/// Field availability depends on how far the pipeline ran:
///
/// - **All three rubrics + retarget output**: `rubric_a`, `rubric_b`,
///   and `rubric_c` are `Some`, `target_animation` is `Some`,
///   `gated_reason` is `None`, `error` is `None`.
/// - **Gated at A or B**: `rubric_a`, `rubric_b` are `Some` (one has a
///   hard fail), `rubric_c` and `target_animation` are `None`,
///   `gated_reason` is `Some(reason)`.
/// - **Pipeline error**: `error` is `Some(message)`. Rubrics may be
///   partial — whatever ran before the error is included.
///
/// `diagnostics` is always populated from whichever rubrics ran.
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
    pub fn is_evaluated(&self) -> bool {
        self.rubric_c.is_some()
    }
    pub fn is_gated(&self) -> bool {
        self.gated_reason.is_some()
    }
    pub fn has_error(&self) -> bool {
        self.error.is_some()
    }
}

/// Run the A → B → gate → C pipeline against a parsed source animation
/// and a target VRM rest pose.
///
/// Caller responsibility:
/// - Parse FBX bytes into a [`SourceAsset`] (FBX-format-level concern,
///   not a pipeline step).
/// - Extract / build [`VrmRestPose`] (VRM-format-level concern).
///
/// Pipeline responsibility:
/// 1. Run [`rubric_a::evaluate`] on the source.
/// 2. Run [`rubric_b::evaluate`] on the VRM rest.
/// 3. Check gating via [`check_gating`]. If either rubric A or B has a
///    hard fail, skip Rubric C and return a gated result.
/// 4. Otherwise, run mapping → retargeter → FK evaluate → Rubric C.
/// 5. Aggregate all rubric results into a flat list of [`Diagnostic`].
///
/// Returns a [`PipelineResult`] with all available data and diagnostics.
pub fn evaluate_pipeline(
    source_asset: &SourceAsset,
    vrm_rest: &VrmRestPose,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> PipelineResult {
    let mut result = PipelineResult {
        rubric_a: None,
        rubric_b: None,
        rubric_c: None,
        target_animation: None,
        gated_reason: None,
        error: None,
        diagnostics: Vec::new(),
    };

    // Step 1: Rubric A (source animation quality)
    let score_a = rubric_a::evaluate(source_asset);
    result.diagnostics.extend(rubric_to_diagnostics(&score_a));
    result.rubric_a = Some(score_a);

    // Step 2: Rubric B (target model quality)
    let score_b = rubric_b::evaluate(vrm_rest);
    result.diagnostics.extend(rubric_to_diagnostics(&score_b));
    result.rubric_b = Some(score_b);

    // Step 3: Gating check
    let (a_ref, b_ref) = (
        result.rubric_a.as_ref().unwrap(),
        result.rubric_b.as_ref().unwrap(),
    );
    if let Some(reason) = check_gating(a_ref, b_ref) {
        result.gated_reason = Some(reason);
        return result;
    }

    // Step 4: Build mapped animation
    let mapped = match crate::mapping::retarget(source_asset, config, vrm_version) {
        Ok(m) => m,
        Err(e) => {
            result.error = Some(format!("mapping failed: {}", e));
            return result;
        }
    };

    // Step 5: Compute FBX skeleton frames for vis + Rubric C C1.4 fidelity
    let fbx_skeleton = match crate::compute_fbx_skeleton_from_parsed(source_asset) {
        Ok(s) => s,
        Err(e) => {
            result.error = Some(format!("compute_fbx_skeleton failed: {}", e));
            return result;
        }
    };

    // Step 6: Run retargeter (default options — viewer-side overrides
    // are a separate concern handled in src/retarget.rs).
    let vrm_to_fbx: HashMap<&str, &str> = mapped
        .bone_tracks
        .iter()
        .map(|t| (t.vrm_bone_name.as_str(), t.src_bone_name.as_str()))
        .collect();
    let fbx_root = vrm_to_fbx.get("VRMC_vrm.root_bone").copied().unwrap_or("");
    let fbx_hips = vrm_to_fbx.get("hips").copied().unwrap_or("");

    let retargeter = crate::ArpRetargeterInner::new(
        vrm_rest.clone(),
        Some(fbx_skeleton.clone()),
        &mapped,
        fbx_root,
        fbx_hips,
    );
    let retarget_output = retargeter.apply(&mapped);

    // Step 7: FK evaluate the retarget output
    let vrm_fk = fk_evaluate::evaluate(&retarget_output, vrm_rest);

    // Step 8: Build residual inputs from the mapped animation.
    //
    // - src_rotations_by_vrm: per-VRM-bone source track, fed to C1.3
    //   Stability residual (frame-to-frame delta comparison).
    // - vrm_to_fbx_name: per-VRM-bone FBX bone name, used by C1.1 to
    //   look up FBX-side positions in fbx_skeleton for world-space
    //   joint-triplet bend residuals.
    let mut src_rotations_by_vrm: HashMap<String, Vec<Quat>> = HashMap::new();
    let mut vrm_to_fbx_name: HashMap<String, String> = HashMap::new();
    for track in &mapped.bone_tracks {
        if let Some(bt) = source_asset.tracks.get(&track.src_bone_name) {
            src_rotations_by_vrm.insert(track.vrm_bone_name.clone(), bt.rotations.clone());
        }
        vrm_to_fbx_name.insert(track.vrm_bone_name.clone(), track.src_bone_name.clone());
    }

    // Step 9: Rubric C (retarget output quality)
    let score_c = rubric_c::evaluate(
        &vrm_fk,
        Some(&fbx_skeleton),
        &retarget_output,
        vrm_rest,
        Some(&src_rotations_by_vrm),
        Some(&vrm_to_fbx_name),
    );
    result.diagnostics.extend(rubric_to_diagnostics(&score_c));
    result.rubric_c = Some(score_c);
    result.target_animation = Some(retarget_output);

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::quality::Severity;

    /// PipelineResult helpers behave correctly across all three
    /// outcome shapes (evaluated, gated, error).
    #[test]
    fn outcome_helpers_evaluated() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: Some(RubricResult {
                rubric_name: "Retarget".into(),
                hard_fails: Vec::new(),
                metrics: Vec::new(),
                overall: crate::quality::Grade::A,
                overall_score: 95.0,
            }),
            target_animation: None,
            gated_reason: None,
            error: None,
            diagnostics: Vec::new(),
        };
        assert!(r.is_evaluated());
        assert!(!r.is_gated());
        assert!(!r.has_error());
    }

    #[test]
    fn outcome_helpers_gated() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: Some("rubric_a hard fail: x".into()),
            error: None,
            diagnostics: Vec::new(),
        };
        assert!(!r.is_evaluated());
        assert!(r.is_gated());
        assert!(!r.has_error());
    }

    #[test]
    fn outcome_helpers_error() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: None,
            error: Some("mapping failed: ...".into()),
            diagnostics: Vec::new(),
        };
        assert!(!r.is_evaluated());
        assert!(!r.is_gated());
        assert!(r.has_error());
    }

    /// Diagnostics aggregation — gated path collects A + B diagnostics
    /// but no C diagnostics.
    #[test]
    fn gated_path_aggregates_a_and_b_only() {
        // Construct a result mimicking what evaluate_pipeline produces
        // when gated at A: A has the hard fail, B is graded normally.
        let mut diags = Vec::new();
        diags.push(Diagnostic {
            severity: Severity::Error,
            code: "body_skin_present".into(),
            message: "hard fail (Source Animation): facial-only".into(),
            location: Some("Source Animation".into()),
            suggestion: None,
            recoverable: false,
        });
        diags.push(Diagnostic {
            severity: Severity::Info,
            code: "B1.2_Proportion".into(),
            message: "minor proportion deviation".into(),
            location: Some("Model".into()),
            suggestion: None,
            recoverable: true,
        });
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: Some("rubric_a hard fail: body_skin_present".into()),
            error: None,
            diagnostics: diags,
        };
        assert_eq!(r.diagnostics.len(), 2);
        assert_eq!(crate::quality::aggregate_severity(&r.diagnostics), Some(Severity::Error));
    }
}
```

### `src/types.rs` (     127 LOC)

```rust
use glam::{Quat, Vec3};
use std::collections::HashMap;

/// Heel/toe contact points for foot flattening (aim IK).
#[derive(Clone, Debug)]
pub struct FootContactData {
    /// (heel_offset_y, toe_offset_y, heel_local_z, toe_local_z) for left foot.
    /// heel/toe_local_z = vertex_z - ankle_z (negative = behind ankle).
    pub left: FootSideContact,
    /// Same for right foot.
    pub right: FootSideContact,
}

#[derive(Clone, Debug)]
pub struct FootSideContact {
    pub heel_offset_y: f32,
    pub toe_offset_y: f32,
    /// Z of heel vertex relative to ankle (negative = behind)
    pub heel_local_z: f32,
    /// Z of toe vertex relative to ankle (positive = in front)
    pub toe_local_z: f32,
}

/// Pure VRM rest pose data — extracted from Bevy entities, no engine dependency.
#[derive(Clone)]
pub struct VrmRestPose {
    /// vrm_bone_name → local rest rotation
    pub bone_rest_local: HashMap<String, Quat>,
    /// vrm_bone_name → skeleton-space global rest rotation
    pub bone_rest_global: HashMap<String, Quat>,
    /// vrm_bone_name → local rest translation
    pub bone_rest_translation: HashMap<String, Vec3>,
    /// vrm_bone_name → world position at rest (for A-pose detection)
    pub bone_world_position: HashMap<String, Vec3>,
    /// vrm_bone_name → parent vrm_bone_name
    pub parent_map: HashMap<String, String>,
    /// VRM hips world-space Y position at rest
    pub hips_height: f32,
    /// Root bone rest rotation — used to detect 180°Y baked models
    pub root_rest_rotation: Quat,
    /// Virtual global orientation for identity-rest bones (VRM 1.0).
    /// Computed from bone→child direction vectors. Used in place of
    /// bone_rest_global when dst_rest is identity to fix bone-mesh mismatch.
    pub virtual_rest_global: HashMap<String, Quat>,
    /// Distance from foot bone to lowest mesh vertex (sole offset).
    /// Used to prevent feet from floating or sinking through ground.
    /// (left_offset, right_offset) in meters. 0.0 if not computed.
    pub foot_sole_offset: (f32, f32),
    /// Heel and toe contact data for foot flattening.
    /// (heel_offset_y, toe_offset_y, heel_to_toe_z_distance) per foot.
    /// heel/toe_offset = ankle_bone_Y - vertex_Y (positive = below ankle).
    /// Used to compute foot rotation for ground-plane alignment.
    pub foot_contact: Option<FootContactData>,
}

/// Per-bone output from the retargeter.
pub struct RetargetedBone {
    pub vrm_bone_name: String,
    pub rotations: Vec<Quat>,
    pub translations: Option<Vec<Vec3>>,
}

/// Complete retarget output ready for animation clip creation.
pub struct TargetAnimation {
    pub duration_secs: f32,
    pub bones: Vec<RetargetedBone>,
    pub expression_tracks: Vec<ExpressionTrack>,
    pub log: Vec<String>,
    pub quality: crate::quality::RetargetQuality,
    pub score: Option<crate::quality::RetargetScore>,
}

#[derive(Debug)]
pub struct MappedAnimation {
    pub name: String,
    pub duration_secs: f32,
    pub bone_tracks: Vec<BoneTrack>,
    pub expression_tracks: Vec<ExpressionTrack>,
    /// Detected FBX source type (Blender, UE, etc.)
    pub source_detected: crate::config::FbxSourceType,
    /// Resolved source type (config override or detected)
    pub source_resolved: crate::config::FbxSourceType,
}

#[derive(Debug, Clone)]
pub struct ExpressionTrack {
    pub vrm_expression_name: String,
    pub weights: Vec<f32>,
}

#[derive(Debug)]
pub struct BoneTrack {
    pub vrm_bone_name: String,
    /// FBX bone name (with prefix, for looking up world rotations)
    pub src_bone_name: String,
    pub timestamps: Vec<f32>,
    /// Raw animation (Lcl Rotation as quat, WITHOUT PreRotation)
    pub rotations: Vec<Quat>,
    pub translations: Option<Vec<Vec3>>,
    /// Source bone LOCAL rest rotation (FBX PreRotation only, for src_local = src_local_rest * delta)
    pub src_local_rest: Quat,
    /// Source bone GLOBAL rest rotation (accumulated PreRotation + Lcl Rotation rest)
    pub src_global_rest: Quat,
    /// Source bone PARENT's global rest rotation
    pub src_parent_global_rest: Quat,
}

/// Decompose a quaternion into swing and twist components around a given axis.
pub fn swing_twist_decompose(q: Quat, twist_axis: Vec3) -> (Quat, Quat) {
    let proj = Vec3::new(q.x, q.y, q.z).dot(twist_axis) * twist_axis;
    let twist = Quat::from_xyzw(proj.x, proj.y, proj.z, q.w).normalize();
    let swing = q * twist.inverse();
    (swing, twist)
}

pub use fbx_rig::FbxSkeletonFrames;

pub struct FbxDiagnostics {
    pub all_bones: Vec<String>,
    pub animated_bones: Vec<String>,
    pub matched_direct: Vec<(String, String)>,
    pub unmatched_config: Vec<String>,
    pub blend_shape_channels: Vec<String>,
    pub source_detected: crate::config::FbxSourceType,
    pub source_resolved: crate::config::FbxSourceType,
    pub creator: Option<String>,
}
```

### `src/bin/pop_scan.rs` (      63 LOC)

```rust
//! Scan FBX rotation tracks for frame-to-frame pops (angular jumps).
//! Reports all bones/frames where delta exceeds threshold.
//!
//! Usage: pop_scan <fbx_path> [threshold_deg=5]

use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: pop_scan <fbx_path> [threshold_deg=5]");
        std::process::exit(2);
    }
    let threshold: f32 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(5.0);

    let bytes = fs::read(&args[1]).expect("read fbx");
    let data = fbx_rig::parse(&bytes).expect("parse");

    println!("FBX: {}", args[1]);
    println!("Bones: {}, Frames: {}, Threshold: {:.1}°", data.bones.len(), data.frame_count, threshold);
    println!();

    let mut pops: Vec<(String, usize, f32, f32, f32)> = Vec::new();

    for (name, track) in &data.tracks {
        let rots = &track.rotations;
        for i in 1..rots.len() {
            let delta_deg = rots[i - 1].angle_between(rots[i]).to_degrees();
            if delta_deg > threshold {
                let prev_deg = rots[i - 1].angle_between(glam::Quat::IDENTITY).to_degrees();
                let curr_deg = rots[i].angle_between(glam::Quat::IDENTITY).to_degrees();
                pops.push((name.clone(), i, delta_deg, prev_deg, curr_deg));
            }
        }
    }

    pops.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap());

    println!("{:<30} {:>6} {:>8} {:>8} {:>8}", "bone", "frame", "delta", "prev|I|", "curr|I|");
    println!("{}", "-".repeat(64));
    for (name, frame, delta, prev, curr) in pops.iter().take(50) {
        println!("{:<30} {:>6} {:>8.1} {:>8.1} {:>8.1}", name, frame, delta, prev, curr);
    }
    if pops.is_empty() {
        println!("No pops found above {:.1}°", threshold);
    } else {
        println!("\nTotal pops: {}", pops.len());

        // Per-bone breakdown
        let mut by_bone: std::collections::HashMap<&str, usize> =
            std::collections::HashMap::new();
        for (name, _, _, _, _) in &pops {
            *by_bone.entry(name.as_str()).or_insert(0) += 1;
        }
        let mut sorted: Vec<(&&str, &usize)> = by_bone.iter().collect();
        sorted.sort_by(|a, b| b.1.cmp(a.1));
        println!("\nPer-bone breakdown:");
        for (name, count) in sorted {
            println!("  {:<30} {:>6}", name, count);
        }
    }
}
```

### `src/bin/validate_pipeline.rs` (      31 LOC)

```rust
//! CLI: validate the full FBX→VRM retarget pipeline.
//!
//! Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>

use std::env;
use std::fs;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>");
        process::exit(2);
    }

    let config_json = fs::read_to_string(&args[1]).expect("read config");
    let fbx_bytes = fs::read(&args[2]).expect("read fbx");
    let vrm_bytes = fs::read(&args[3]).expect("read vrm");

    let result = humanoid_retarget::quality::validate::validate_pipeline(
        &config_json,
        &fbx_bytes,
        &vrm_bytes,
    );

    print!("{}", result);

    if !result.all_passed {
        process::exit(1);
    }
}
```

### `src/bin/fbx_summary_scratch.rs` (     438 LOC)

```rust
use fbx_rig::fbxcel::low::v7400::AttributeValue;
use fbx_rig::fbxcel::pull_parser::any::AnyParser;
use fbx_rig::fbxcel::pull_parser::v7400::Event;
use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
use fbx_rig::{SourceAsset, euler_to_quat, parse};
use glam::Quat;
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

const SAMPLE_RATE: f32 = 30.0;
const FBX_TIME_UNIT: f64 = 46186158000.0;

const STANDARD_BONES: &[(&str, &[&str])] = &[
    ("Hips", &["root.x", "c_root_master.x", "hips"]),
    ("Spine", &["spine_01.x", "spine.x", "spine"]),
    ("Chest", &["spine_02.x", "chest.x", "chest"]),
    ("Neck", &["neck.x", "neck"]),
    ("Head", &["head.x", "head"]),
    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
];

#[derive(Debug)]
struct FileSummary {
    file: String,
    bone_count: usize,
    roots: Vec<String>,
    frame_count: usize,
    fps: f32,
    duration: f32,
    negative_start_frame: Option<f32>,
    missing_standard: Vec<&'static str>,
    rest_vs_frame0: Vec<(String, f32)>,
    jitter_bones: Vec<(String, f32)>,
    weird_names: Vec<String>,
    creator: String,
    source_type: String,
    severity: String,
    retarget_risk: Vec<String>,
}

fn main() {
    let dir = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));

    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
        .expect("failed to read fbx dir")
        .filter_map(|entry| entry.ok().map(|e| e.path()))
        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
        .collect();
    files.sort();

    println!("# FBX Summary Scratch");
    println!("dir: {}", dir.display());
    println!("files: {}", files.len());

    for path in files {
        match analyze_file(&path) {
            Ok(summary) => print_summary(&summary),
            Err(err) => {
                println!("---");
                println!("FILE: {}", path.display());
                println!("STATUS: ERROR");
                println!("ERROR: {}", err);
            }
        }
    }
}

fn analyze_file(path: &Path) -> Result<FileSummary, String> {
    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
    let min_key_time = scan_min_key_time_secs(&bytes)?;

    let mut roots: Vec<String> = fbx
        .bones
        .iter()
        .filter(|(_, bone)| bone.parent.is_none())
        .map(|(name, _)| name.clone())
        .collect();
    roots.sort();

    let missing_standard = STANDARD_BONES
        .iter()
        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
        .map(|(label, _)| *label)
        .collect::<Vec<_>>();

    let mut rest_vs_frame0 = Vec::new();
    for (name, bone) in &fbx.bones {
        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
        let frame0 = fbx
            .tracks
            .get(name)
            .and_then(|track| track.rotations.first())
            .copied()
            .unwrap_or(rest);
        let diff = quat_angle_deg(rest, frame0);
        if diff >= 5.0 {
            rest_vs_frame0.push((name.clone(), diff));
        }
    }
    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut jitter_bones = detect_jitter(&fbx);
    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut weird_names: Vec<String> = fbx
        .bones
        .keys()
        .filter(|name| is_weird_bone_name(name))
        .cloned()
        .collect();
    weird_names.sort();

    let fps = if fbx.duration > 0.0 {
        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
    } else {
        SAMPLE_RATE
    };
    let negative_start_frame = min_key_time
        .filter(|secs| *secs < 0.0)
        .map(|secs| (secs as f32) * SAMPLE_RATE);

    let severity = classify(
        &roots,
        &missing_standard,
        &rest_vs_frame0,
        &jitter_bones,
        negative_start_frame,
    );
    let retarget_risk = retarget_risks(
        &roots,
        &missing_standard,
        &rest_vs_frame0,
        &jitter_bones,
        negative_start_frame,
    );

    Ok(FileSummary {
        file: path.file_name().unwrap().to_string_lossy().into_owned(),
        bone_count: fbx.bones.len(),
        roots,
        frame_count: fbx.frame_count,
        fps,
        duration: fbx.duration,
        negative_start_frame,
        missing_standard,
        rest_vs_frame0,
        jitter_bones,
        weird_names,
        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
        source_type: fbx.detected_source_type.to_string(),
        severity,
        retarget_risk,
    })
}

fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
    aliases.iter().any(|name| bones.contains_key(*name))
}

fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
    let d = a.inverse() * b;
    d.to_axis_angle().1.abs().to_degrees()
}

fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
    let mut out = Vec::new();
    for (name, track) in &fbx.tracks {
        if track.rotations.len() < 5 {
            continue;
        }

        let steps: Vec<f32> = track
            .rotations
            .windows(2)
            .map(|w| quat_angle_deg(w[0], w[1]))
            .collect();
        if steps.len() < 3 {
            continue;
        }

        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
        let mut spike = 0.0f32;
        for i in 1..steps.len() - 1 {
            let prev = steps[i - 1];
            let cur = steps[i];
            let next = steps[i + 1];
            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
                spike = spike.max(cur);
            }
        }
        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
            out.push((name.clone(), spike));
        }
    }
    out
}

fn is_weird_bone_name(name: &str) -> bool {
    if name.chars().any(|c| c.is_whitespace()) {
        return true;
    }
    !name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
}

fn classify(
    _roots: &[String],
    missing_standard: &[&str],
    rest_vs_frame0: &[(String, f32)],
    jitter_bones: &[(String, f32)],
    negative_start_frame: Option<f32>,
) -> String {
    let essential_missing = missing_standard.len();
    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
    let jitter_count = jitter_bones.len();

    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
        || negative_start_frame.is_some()
    {
        "위험".to_string()
    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
        "주의".to_string()
    } else {
        "안전".to_string()
    }
}

fn retarget_risks(
    roots: &[String],
    missing_standard: &[&str],
    rest_vs_frame0: &[(String, f32)],
    jitter_bones: &[(String, f32)],
    negative_start_frame: Option<f32>,
) -> Vec<String> {
    let mut risks = Vec::new();
    if roots.len() > 1 {
        risks.push(format!("다중 루트: {}", roots.join(", ")));
    }
    if !missing_standard.is_empty() {
        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
    }

    let major_rest: Vec<String> = rest_vs_frame0
        .iter()
        .filter(|(_, deg)| *deg >= 20.0)
        .take(4)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect();
    if !major_rest.is_empty() {
        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
    }

    let jitter: Vec<String> = jitter_bones
        .iter()
        .take(4)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect();
    if !jitter.is_empty() {
        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
    }

    if let Some(start_frame) = negative_start_frame {
        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
    }

    if risks.is_empty() {
        risks.push("특이 리스크 없음".to_string());
    }
    risks
}

fn has_hips(missing_standard: &[&str]) -> bool {
    !missing_standard.iter().any(|name| *name == "Hips")
}

fn print_summary(summary: &FileSummary) {
    println!("---");
    println!("FILE: {}", summary.file);
    println!("STATUS: OK");
    println!("SEVERITY: {}", summary.severity);
    println!("BONES: {}", summary.bone_count);
    println!("ROOTS: {}", summary.roots.join(", "));
    println!("FRAMES: {}", summary.frame_count);
    println!("FPS: {:.2}", summary.fps);
    println!("DURATION: {:.3}", summary.duration);
    println!(
        "NEGATIVE_START_FRAME: {}",
        summary
            .negative_start_frame
            .map(|v| format!("{v:.2}"))
            .unwrap_or_else(|| "none".to_string())
    );
    println!(
        "MISSING_STANDARD: {}",
        if summary.missing_standard.is_empty() {
            "none".to_string()
        } else {
            summary.missing_standard.join(", ")
        }
    );
    println!(
        "REST_FRAME0_5DEG: {}",
        format_pairs(&summary.rest_vs_frame0, 12)
    );
    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
    println!(
        "WEIRD_NAMES: {}",
        if summary.weird_names.is_empty() {
            "none".to_string()
        } else {
            summary.weird_names.join(", ")
        }
    );
    println!("CREATOR: {}", summary.creator);
    println!("SOURCE_TYPE: {}", summary.source_type);
    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
}

fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
    if values.is_empty() {
        return "none".to_string();
    }
    let mut parts = values
        .iter()
        .take(limit)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect::<Vec<_>>();
    if values.len() > limit {
        parts.push(format!("... +{}", values.len() - limit));
    }
    parts.join(", ")
}

fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
    let cursor = Cursor::new(bytes);
    let reader = std::io::BufReader::new(cursor);
    let mut parser = match AnyParser::from_seekable_reader(reader)
        .map_err(|e| format!("FBX header: {e}"))?
    {
        AnyParser::V7400(p) => p,
        _ => return Err("unsupported FBX version".to_string()),
    };

    let mut top_section = String::new();
    let mut depth = 0i32;
    let mut min_key_time = f64::MAX;

    loop {
        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
            Event::StartNode(node) => {
                depth += 1;
                let name = node.name().to_string();
                if depth == 1 {
                    top_section = name;
                    continue;
                }
                if top_section == "Objects" && name == "AnimationCurve" {
                    let mut curve_depth = depth;
                    loop {
                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
                            Event::StartNode(child) => {
                                curve_depth += 1;
                                let child_name = child.name().to_string();
                                let mut attrs: Vec<AttributeValue> = Vec::new();
                                let mut reader = child.attributes();
                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
                                    attrs.push(attr);
                                }
                                if child_name == "KeyTime"
                                    && let Some(arr) =
                                        attrs.first().and_then(|a| a.get_arr_i64())
                                    && let Some(local_min) = arr.iter().min()
                                {
                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
                                    min_key_time = min_key_time.min(secs);
                                }
                            }
                            Event::EndNode => {
                                curve_depth -= 1;
                                if curve_depth < depth {
                                    depth -= 1;
                                    break;
                                }
                            }
                            Event::EndFbx(_) => {
                                return Ok(if min_key_time == f64::MAX {
                                    None
                                } else {
                                    Some(min_key_time)
                                });
                            }
                        }
                    }
                }
            }
            Event::EndNode => {
                depth -= 1;
            }
            Event::EndFbx(_) => {
                return Ok(if min_key_time == f64::MAX {
                    None
                } else {
                    Some(min_key_time)
                });
            }
        }
    }
}

#[allow(dead_code)]
fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
    let mut out = BTreeMap::new();
    for item in items {
        *out.entry(item.severity.as_str()).or_insert(0) += 1;
    }
    out
}
```

### `src/bin/retarget_test.rs` (     209 LOC)

```rust
//! Unified retarget quality test runner.
//!
//! Scans VRM models × FBX animations, runs full pipeline + rubric A/B/C scoring.
//!
//! Usage:
//!   retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]

use std::{env, fs, path::Path};
use humanoid_retarget::quality::{rubric_a, rubric_b};
use humanoid_retarget::orchestrate::evaluate_pipeline;
use humanoid_retarget::config::RetargetConfig;
use humanoid_retarget::vrm_compat::VrmVersion;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("Usage: retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]");
        std::process::exit(2);
    }

    let models_dir = &args[1];
    let fbx_dir = &args[2];
    let config_path = &args[3];
    let save_path = args.iter().position(|a| a == "--save").map(|i| args[i + 1].clone());
    let _baseline_path = args.iter().position(|a| a == "--baseline").map(|i| args[i + 1].clone());

    let config_json = fs::read_to_string(config_path)
        .unwrap_or_else(|e| { eprintln!("Failed to read config {}: {}", config_path, e); std::process::exit(1); });
    let config = RetargetConfig::from_json(&config_json)
        .unwrap_or_else(|e| { eprintln!("Failed to parse config: {}", e); std::process::exit(1); });

    // Scan directories
    let vrm_files = scan_dir(models_dir, "vrm");
    let fbx_files = scan_dir(fbx_dir, "fbx");

    println!("Found {} VRM models, {} FBX animations", vrm_files.len(), fbx_files.len());
    println!();

    // ===== Rubric A: Source Animation Quality =====
    // Cache results by FBX path so the C loop can gate on hard-fail
    // status without re-running A.
    println!("===== Rubric A: Source Animation Quality =====");
    let mut rubric_a_cache: std::collections::HashMap<String, humanoid_retarget::quality::RubricResult> =
        std::collections::HashMap::new();
    for fbx_path in &fbx_files {
        let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
        let fbx_bytes = match fs::read(fbx_path) {
            Ok(b) => b,
            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(fbx_name, 42), e); continue; }
        };
        let fbx = match humanoid_retarget::fbx::parse(&fbx_bytes) {
            Ok(f) => f,
            Err(e) => { println!("{:<42} PARSE FAIL — {}", truncate(fbx_name, 42), e); continue; }
        };
        let score_a = rubric_a::evaluate(&fbx);
        println!("{:<42} {}", truncate(fbx_name, 42), score_a);
        rubric_a_cache.insert(fbx_path.clone(), score_a);
    }
    println!();

    // ===== Rubric B: Model Quality =====
    println!("===== Rubric B: Model Quality =====");

    // Parse VRM files and store rest pose + cached B result for the C loop's gating.
    let mut vrm_data: Vec<(String, Vec<u8>, humanoid_retarget::types::VrmRestPose, VrmVersion, humanoid_retarget::quality::RubricResult)> = Vec::new();

    for vrm_path in &vrm_files {
        let vrm_name = Path::new(vrm_path).file_name().unwrap().to_str().unwrap();
        let vrm_bytes = match fs::read(vrm_path) {
            Ok(b) => b,
            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(vrm_name, 42), e); continue; }
        };

        // Detect and handle VRM 0.x
        let is_vrm0 = humanoid_retarget::vrm0_compat::is_vrm0(&vrm_bytes);
        let name_suggests_0x = vrm_name.contains("_0x_") || vrm_name.contains("0x_");
        let vrm_version = if is_vrm0 || name_suggests_0x { VrmVersion::V0x } else { VrmVersion::V1_0 };

        let working_bytes: Vec<u8>;
        let vrm_data_bytes: &[u8] = if is_vrm0 {
            match humanoid_retarget::vrm0_compat::convert(&vrm_bytes) {
                Ok(converted) => { working_bytes = converted; &working_bytes }
                Err(e) => { println!("{:<42} VRM0 CONVERT FAIL — {}", truncate(vrm_name, 42), e); continue; }
            }
        } else {
            &vrm_bytes
        };

        let rest = match humanoid_retarget::vrm_rest::extract_vrm_rest_pose(vrm_data_bytes) {
            Ok(r) => r,
            Err(e) => { println!("{:<42} REST EXTRACT FAIL — {}", truncate(vrm_name, 42), e); continue; }
        };

        let score_b = rubric_b::evaluate(&rest);
        println!("{:<42} {}", truncate(vrm_name, 42), score_b);

        // Store converted bytes if vrm0, original otherwise
        let store_bytes = if is_vrm0 { vrm_data_bytes.to_vec() } else { vrm_bytes };
        vrm_data.push((vrm_name.to_string(), store_bytes, rest, vrm_version, score_b));
    }
    println!();

    // ===== Rubric C: Retarget Output Quality =====
    println!("===== Rubric C: Retarget Output Quality =====");

    let mut pass_count = 0usize;
    let mut fail_count = 0usize;
    let mut gated_count = 0usize;
    let mut total = 0usize;

    for (vrm_name, _vrm_bytes, vrm_rest, vrm_version, score_b) in &vrm_data {
        for fbx_path in &fbx_files {
            let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
            total += 1;

            let label = format!("{} x {}", truncate(vrm_name, 20), truncate(fbx_name, 25));

            // Pre-gating peek for cache-miss handling: bin's A loop
            // prints PARSE FAIL and skips caching, so a missing entry
            // means upstream parse failed. Keep the sweep behavior
            // identical by suppressing the C row in that case
            // (evaluate_pipeline would re-parse and double-print).
            if rubric_a_cache.get(fbx_path).is_none() {
                println!("{:<48} GATED — rubric_a missing (upstream parse fail)", label);
                gated_count += 1;
                continue;
            }
            // Quick gate on cached B before reading bytes — same effect
            // as evaluate_pipeline's gate, but skips a file read on the
            // common B-hard-fail row.
            if let Some(name) = score_b.first_hard_fail() {
                println!("{:<48} GATED — rubric_b hard fail: {}", label, name);
                gated_count += 1;
                continue;
            }

            let fbx_bytes = match fs::read(fbx_path) {
                Ok(b) => b,
                Err(e) => { println!("{:<48} READ FAIL — {}", label, e); fail_count += 1; continue; }
            };
            let fbx_parsed = match humanoid_retarget::fbx::parse(&fbx_bytes) {
                Ok(f) => f,
                Err(e) => { println!("{:<48} PIPELINE FAIL — {}", label, e); fail_count += 1; continue; }
            };

            let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);

            if let Some(reason) = pipeline.gated_reason {
                println!("{:<48} GATED — {}", label, reason);
                gated_count += 1;
                continue;
            }
            if let Some(err) = pipeline.error {
                println!("{:<48} PIPELINE FAIL — {}", label, err);
                fail_count += 1;
                continue;
            }
            let score_c = match pipeline.rubric_c {
                Some(s) => s,
                None => { println!("{:<48} PIPELINE FAIL — no rubric C", label); fail_count += 1; continue; }
            };

            println!("{:<48} {}", label, score_c);
            // Surface detail for any metric that graded F or C
            for m in &score_c.metrics {
                if matches!(m.grade, humanoid_retarget::quality::Grade::F | humanoid_retarget::quality::Grade::C) {
                    println!("{:<48}   ↳ {} ({})", "", m.name, m.detail);
                }
            }
            pass_count += 1;
        }
    }

    println!();
    println!("===== Summary =====");
    println!("Total: {}  Pass: {}  Fail: {}  Gated: {}", total, pass_count, fail_count, gated_count);

    if let Some(path) = save_path {
        // Minimal JSON output — TODO: serialize full RubricResult if needed
        let json = format!(
            r#"{{"total":{},"pass":{},"fail":{}}}"#,
            total, pass_count, fail_count
        );
        match fs::write(&path, &json) {
            Ok(_) => println!("Results saved to {}", path),
            Err(e) => eprintln!("Failed to save results to {}: {}", path, e),
        }
    }
}

fn scan_dir(dir: &str, ext: &str) -> Vec<String> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map(|e| e == ext).unwrap_or(false) {
                if let Some(s) = path.to_str() {
                    files.push(s.to_string());
                }
            }
        }
    }
    files.sort();
    files
}

fn truncate(s: &str, max: usize) -> &str {
    if s.len() > max { &s[..max] } else { s }
}
```

### `src/quality/fk_evaluate.rs` (     161 LOC)

```rust
//! FK evaluation: TargetAnimation → VrmSkeletonFrames
//! Computes per-bone per-frame world positions and rotations
//! by walking the VRM bone hierarchy (same as what Bevy FK does).

use glam::{Quat, Vec3};
use std::collections::{HashMap, HashSet};

/// Per-bone per-frame world positions and rotations,
/// evaluated via FK chain from TargetAnimation local rotations.
pub struct VrmSkeletonFrames {
    pub frame_count: usize,
    pub duration: f32,
    pub bone_positions: HashMap<String, Vec<Vec3>>,
    pub bone_rotations: HashMap<String, Vec<Quat>>,
}

/// Evaluate FK chain from retarget output.
pub fn evaluate(
    result: &crate::TargetAnimation,
    vrm_rest: &crate::types::VrmRestPose,
) -> VrmSkeletonFrames {
    // Determine frame count from first bone track that has rotations.
    let frame_count = result
        .bones
        .iter()
        .map(|b| b.rotations.len())
        .max()
        .unwrap_or(0);

    if frame_count == 0 {
        return VrmSkeletonFrames {
            frame_count: 0,
            duration: result.duration_secs,
            bone_positions: HashMap::new(),
            bone_rotations: HashMap::new(),
        };
    }

    // Build lookup: vrm_bone_name → index in result.bones
    let bone_index: HashMap<&str, usize> = result
        .bones
        .iter()
        .enumerate()
        .map(|(i, b)| (b.vrm_bone_name.as_str(), i))
        .collect();

    // Collect all bone names from rest pose.
    let all_bones: Vec<String> = vrm_rest.bone_rest_local.keys().cloned().collect();

    // Topological sort: parents before children.
    // Pattern mirrors compute_fbx_skeleton_from_parsed.
    let mut ordered: Vec<String> = Vec::new();
    let mut visited: HashSet<String> = HashSet::new();

    for start in &all_bones {
        if visited.contains(start.as_str()) {
            continue;
        }
        let mut chain: Vec<String> = Vec::new();
        let mut in_chain: HashSet<String> = HashSet::new();
        let mut current = start.clone();
        loop {
            if visited.contains(current.as_str()) || in_chain.contains(&current) {
                break;
            }
            in_chain.insert(current.clone());
            chain.push(current.clone());
            if let Some(parent) = vrm_rest.parent_map.get(&current) {
                current = parent.clone();
            } else {
                break;
            }
        }
        for name in chain.into_iter().rev() {
            if visited.insert(name.clone()) {
                ordered.push(name);
            }
        }
    }

    let mut bone_positions: HashMap<String, Vec<Vec3>> = HashMap::new();
    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();

    for frame in 0..frame_count {
        let mut world_transforms: HashMap<String, (Vec3, Quat)> = HashMap::new();

        for name in &ordered {
            // Local rotation: from retarget track if available, else rest pose.
            let local_rot = if let Some(&idx) = bone_index.get(name.as_str()) {
                let track = &result.bones[idx];
                track
                    .rotations
                    .get(frame)
                    .copied()
                    .unwrap_or_else(|| {
                        vrm_rest
                            .bone_rest_local
                            .get(name)
                            .copied()
                            .unwrap_or(Quat::IDENTITY)
                    })
            } else {
                vrm_rest
                    .bone_rest_local
                    .get(name)
                    .copied()
                    .unwrap_or(Quat::IDENTITY)
            };

            // Local translation: use per-frame translation from retarget track if present,
            // otherwise fall back to rest translation.
            let local_translation = if let Some(&idx) = bone_index.get(name.as_str()) {
                let track = &result.bones[idx];
                track
                    .translations
                    .as_ref()
                    .and_then(|ts| ts.get(frame).copied())
                    .unwrap_or_else(|| {
                        vrm_rest
                            .bone_rest_translation
                            .get(name)
                            .copied()
                            .unwrap_or(Vec3::ZERO)
                    })
            } else {
                vrm_rest
                    .bone_rest_translation
                    .get(name)
                    .copied()
                    .unwrap_or(Vec3::ZERO)
            };

            // Look up parent world transform.
            let (parent_pos, parent_rot) = vrm_rest
                .parent_map
                .get(name)
                .and_then(|p| world_transforms.get(p))
                .copied()
                .unwrap_or((Vec3::ZERO, Quat::IDENTITY));

            let world_rot = parent_rot * local_rot;
            let world_pos = parent_pos + parent_rot * local_translation;

            world_transforms.insert(name.clone(), (world_pos, world_rot));
        }

        for name in &ordered {
            if let Some(&(pos, rot)) = world_transforms.get(name) {
                bone_positions.entry(name.clone()).or_default().push(pos);
                bone_rotations.entry(name.clone()).or_default().push(rot);
            }
        }
    }

    VrmSkeletonFrames {
        frame_count,
        duration: result.duration_secs,
        bone_positions,
        bone_rotations,
    }
}
```

### `src/quality/rubric_b.rs` (     398 LOC)

```rust
//! Rubric B: VRM Model Quality
//! Evaluates target VRM model readiness for retargeting.

use super::{Grade, MetricResult, HardFailCheck, RubricResult};

// ─── Grade helpers ────────────────────────────────────────────────────────────

fn grade_score(g: Grade) -> f32 {
    match g {
        Grade::A => 95.0,
        Grade::B => 85.0,
        Grade::C => 75.0,
        Grade::F => 40.0,
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/// All 55 bones in the VRM humanoid spec.
const VRM_ALL_BONES: &[&str] = &[
    "hips", "spine", "chest", "upperChest", "neck", "head",
    "leftEye", "rightEye", "jaw",
    "leftShoulder", "rightShoulder",
    "leftUpperArm", "rightUpperArm",
    "leftLowerArm", "rightLowerArm",
    "leftHand", "rightHand",
    "leftUpperLeg", "rightUpperLeg",
    "leftLowerLeg", "rightLowerLeg",
    "leftFoot", "rightFoot",
    "leftToes", "rightToes",
    "leftThumbMetacarpal", "leftThumbProximal", "leftThumbDistal",
    "leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal",
    "leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal",
    "leftRingProximal", "leftRingIntermediate", "leftRingDistal",
    "leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal",
    "rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal",
    "rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal",
    "rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal",
    "rightRingProximal", "rightRingIntermediate", "rightRingDistal",
    "rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal",
];

/// Required bones for B-0 hard fail check.
const REQUIRED_BONES: &[&str] = &[
    "hips", "spine", "head",
    "leftUpperArm", "leftLowerArm",
    "rightUpperArm", "rightLowerArm",
    "leftUpperLeg", "leftLowerLeg",
    "rightUpperLeg", "rightLowerLeg",
    "leftFoot", "rightFoot",
];

// ─── B-0 Hard Fails ───────────────────────────────────────────────────────────

fn check_hard_fails(vrm_rest: &crate::types::VrmRestPose) -> Vec<HardFailCheck> {
    let mut checks = Vec::new();

    // B0.1: Required humanoid bones present
    let translations = &vrm_rest.bone_rest_translation;
    let missing: Vec<&str> = REQUIRED_BONES
        .iter()
        .copied()
        .filter(|&b| !translations.contains_key(b))
        .collect();

    checks.push(HardFailCheck {
        name: "required_bones".to_string(),
        passed: missing.is_empty(),
        detail: if missing.is_empty() {
            "all required bones present".to_string()
        } else {
            format!("missing: {}", missing.join(", "))
        },
    });

    // B0.2: No NaN in bone rests
    let mut nan_bones: Vec<String> = Vec::new();

    for (name, t) in translations {
        if t.x.is_nan() || t.y.is_nan() || t.z.is_nan() {
            nan_bones.push(name.clone());
        }
    }
    for (name, q) in &vrm_rest.bone_rest_local {
        if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
            if !nan_bones.contains(name) {
                nan_bones.push(name.clone());
            }
        }
    }

    checks.push(HardFailCheck {
        name: "no_nan_in_rest".to_string(),
        passed: nan_bones.is_empty(),
        detail: if nan_bones.is_empty() {
            "no NaN values".to_string()
        } else {
            format!("NaN in bones: {}", nan_bones.join(", "))
        },
    });

    checks
}

// ─── B1.1 Bone Hierarchy Completeness ────────────────────────────────────────

fn metric_completeness(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let translations = &vrm_rest.bone_rest_translation;
    let present = VRM_ALL_BONES.iter().filter(|&&b| translations.contains_key(b)).count();
    let total = VRM_ALL_BONES.len(); // 55

    let coverage = present as f32 / total as f32;

    let grade = if coverage >= 0.95 { Grade::A }       // 52+
        else if coverage >= 0.85 { Grade::B }           // 47+
        else if coverage >= 0.70 { Grade::C }           // 39+
        else { Grade::F };

    MetricResult {
        name: "B1.1_Completeness".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!("{}/{} bones ({:.0}%)", present, total, coverage * 100.0),
    }
}

// ─── B1.2 Proportion Reasonableness ──────────────────────────────────────────

/// Returns 0 when `actual` is within `[lo, hi]`, otherwise the distance from
/// the nearest edge as a fraction of the range midpoint.
fn ratio_deviation(actual: f32, lo: f32, hi: f32) -> f32 {
    if actual >= lo && actual <= hi {
        return 0.0;
    }
    let mid = (lo + hi) / 2.0;
    if mid <= 0.0 {
        return 1.0;
    }
    let edge_dist = if actual < lo { lo - actual } else { actual - hi };
    edge_dist / mid
}

fn metric_proportion(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let t = &vrm_rest.bone_rest_translation;
    let w = &vrm_rest.bone_world_position;

    // Limb length = local translation of the CHILD bone (vector from this
    // bone to the next joint in parent space). e.g. upper arm length is
    // `t["leftLowerArm"]` — the elbow's position in upper arm space.
    let limb_len = |child: &str| -> Option<f32> {
        t.get(child).map(|v| v.length())
    };

    let upper_arm_len = limb_len("leftLowerArm");
    let lower_arm_len = limb_len("leftHand");
    let upper_leg_len = limb_len("leftLowerLeg");
    let lower_leg_len = limb_len("leftFoot");

    let mut deviations: Vec<(String, f32)> = Vec::new();

    // Upper arm / lower arm ratio ~1.0–1.3 (humans: ~1.1)
    if let (Some(ua), Some(la)) = (upper_arm_len, lower_arm_len) {
        if la > 1e-4 {
            deviations.push(("arm".into(), ratio_deviation(ua / la, 1.0, 1.3)));
        }
    }

    // Upper leg / lower leg ratio ~1.0–1.2 (humans: ~1.1)
    if let (Some(ul), Some(ll)) = (upper_leg_len, lower_leg_len) {
        if ll > 1e-4 {
            deviations.push(("leg".into(), ratio_deviation(ul / ll, 1.0, 1.2)));
        }
    }

    // Arm span / total height ~0.9–1.1 (Vitruvian, humans ≈ 1.0).
    // Use world hand-to-hand horizontal distance for arm span and head Y for
    // height — these are robust against bone-naming surprises and don't depend
    // on shoulder bones being rest-aligned to the X axis.
    if let (Some(lh), Some(rh), Some(head)) = (
        w.get("leftHand"), w.get("rightHand"), w.get("head"),
    ) {
        let span_v = *lh - *rh;
        let arm_span = (span_v.x * span_v.x + span_v.z * span_v.z).sqrt();
        let height = head.y;
        if height > 0.1 && arm_span > 0.1 {
            deviations.push(("span".into(), ratio_deviation(arm_span / height, 0.9, 1.1)));
        }
    }

    if deviations.is_empty() {
        return MetricResult {
            name: "B1.2_Proportion".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "insufficient bone data".to_string(),
        };
    }

    let (worst_label, max_dev) = deviations.iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
        .cloned()
        .unwrap_or(("none".into(), 0.0));

    // Range edges already have 0% deviation (ratio_deviation returns 0 in
    // [lo, hi]). 10% slop above that is "still humanoid", 25% is "stretched
    // but recognizable", beyond is stylized/broken.
    let grade = if max_dev < 0.10 { Grade::A }
        else if max_dev < 0.25 { Grade::B }
        else if max_dev < 0.50 { Grade::C }
        else { Grade::F };

    MetricResult {
        name: "B1.2_Proportion".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!("worst={} dev={:.1}%", worst_label, max_dev * 100.0),
    }
}

// ─── B1.3 Rest Pose T-Pose Alignment ─────────────────────────────────────────

/// Given a global rest quaternion, extract the direction the bone points in world space.
/// We rotate the forward axis (+X for arms, -Y for legs) by the quaternion.
fn arm_horizontal_error_deg(global_rot: glam::Quat) -> f32 {
    // In T-pose the upper arm points along ±X (horizontal).
    // Rotate world X by the global rest quat to get the bone's direction.
    let dir = global_rot * glam::Vec3::X;
    // Angle from horizontal = arcsin(|y component|)
    dir.y.abs().asin().to_degrees()
}

fn leg_vertical_error_deg(global_rot: glam::Quat) -> f32 {
    // In rest the lower leg points along -Y (downward).
    let dir = global_rot * (-glam::Vec3::Y);
    // Angle from downward = angle between dir and -Y
    let down = -glam::Vec3::Y;
    let dot = dir.dot(down).clamp(-1.0, 1.0);
    dot.acos().to_degrees()
}

fn metric_tpose(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let g = &vrm_rest.bone_rest_global;

    let mut arm_errors: Vec<f32> = Vec::new();
    let mut leg_errors: Vec<f32> = Vec::new();

    for side in &["left", "right"] {
        let upper_arm_key = format!("{}UpperArm", capitalize(side));
        let lower_leg_key = format!("{}LowerLeg", capitalize(side));

        if let Some(&q) = g.get(&upper_arm_key) {
            arm_errors.push(arm_horizontal_error_deg(q));
        }
        if let Some(&q) = g.get(&lower_leg_key) {
            leg_errors.push(leg_vertical_error_deg(q));
        }
    }

    if arm_errors.is_empty() && leg_errors.is_empty() {
        return MetricResult {
            name: "B1.3_TPose".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "no arm/leg global rest data".to_string(),
        };
    }

    let avg_arm_err = if arm_errors.is_empty() {
        0.0
    } else {
        arm_errors.iter().sum::<f32>() / arm_errors.len() as f32
    };

    let avg_leg_err = if leg_errors.is_empty() {
        0.0
    } else {
        leg_errors.iter().sum::<f32>() / leg_errors.len() as f32
    };

    // Grade by worst of arm or leg
    let arm_grade = if avg_arm_err < 5.0 { Grade::A }
        else if avg_arm_err < 15.0 { Grade::B }
        else if avg_arm_err < 30.0 { Grade::C }
        else { Grade::F };

    let leg_grade = if avg_leg_err < 3.0 { Grade::A }
        else if avg_leg_err < 8.0 { Grade::B }
        else if avg_leg_err < 15.0 { Grade::C }
        else { Grade::F };

    let grade = arm_grade.min(leg_grade);

    MetricResult {
        name: "B1.3_TPose".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!(
            "arm_err={:.1}° leg_err={:.1}°",
            avg_arm_err, avg_leg_err
        ),
    }
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}

// ─── B1.4 Foot Sole Offset ────────────────────────────────────────────────────

fn metric_sole_offset(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let (left_offset, right_offset) = vrm_rest.foot_sole_offset;

    // If both are zero, data was not computed — skip gracefully
    if left_offset == 0.0 && right_offset == 0.0 {
        return MetricResult {
            name: "B1.4_SoleOffset".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "sole offset not computed".to_string(),
        };
    }

    // Difference in meters → convert to mm
    let diff_mm = (left_offset - right_offset).abs() * 1000.0;

    let grade = if diff_mm < 5.0 { Grade::A }
        else if diff_mm < 15.0 { Grade::B }
        else if diff_mm < 30.0 { Grade::C }
        else { Grade::F };

    MetricResult {
        name: "B1.4_SoleOffset".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!(
            "L={:.3}m R={:.3}m diff={:.1}mm",
            left_offset, right_offset, diff_mm
        ),
    }
}

// ─── Overall ──────────────────────────────────────────────────────────────────

/// Evaluate VRM model quality.
pub fn evaluate(vrm_rest: &crate::types::VrmRestPose) -> RubricResult {
    // B-0: Hard fails
    let hard_fails = check_hard_fails(vrm_rest);
    let any_hard_fail = hard_fails.iter().any(|h| !h.passed);

    // B-1: Graded metrics
    let completeness = metric_completeness(vrm_rest);
    let proportion = metric_proportion(vrm_rest);
    let tpose = metric_tpose(vrm_rest);
    let sole = metric_sole_offset(vrm_rest);

    // Weighted overall score
    // Weights: completeness 30%, proportion 25%, tpose 25%, sole 20%
    // If a metric was skipped (data unavailable), redistribute weight
    let mut weighted_score = 0.0f32;
    let mut weight_total = 0.0f32;

    let add_metric = |score: f32, weight: f32, detail: &str,
                      ws: &mut f32, wt: &mut f32| {
        // Skip metrics that returned "insufficient data" style grades with no real signal
        let _ = detail;
        *ws += score * weight;
        *wt += weight;
    };

    add_metric(completeness.score, 0.30, &completeness.detail, &mut weighted_score, &mut weight_total);
    add_metric(proportion.score, 0.25, &proportion.detail, &mut weighted_score, &mut weight_total);
    add_metric(tpose.score, 0.25, &tpose.detail, &mut weighted_score, &mut weight_total);
    add_metric(sole.score, 0.20, &sole.detail, &mut weighted_score, &mut weight_total);

    let overall_score = if weight_total > 0.0 {
        weighted_score / weight_total
    } else {
        100.0
    };

    let overall = if any_hard_fail {
        Grade::F
    } else {
        Grade::from_score(overall_score)
    };

    RubricResult {
        rubric_name: "Model".to_string(),
        hard_fails,
        metrics: vec![completeness, proportion, tpose, sole],
        overall,
        overall_score,
    }
}
```

### `src/quality/detector.rs` (      72 LOC)

```rust
//! Shared spike / quaternion delta detector primitives.
//!
//! Both rubric A (source-animation) and rubric C (retarget-output) apply
//! the same hybrid-threshold spike detector to quaternion delta streams.
//! Keeping the constants and helpers in one place ensures A and C stay in
//! sync — historical bugs came from A and C drifting on the same math.
//!
//! This module ports 1:1 to `shotloom-common::quality_detector` later.

use glam::Quat;

/// Median delta below which a track counts as "effectively static".
/// Tracks below this fall back to the absolute spike threshold.
pub(crate) const STATIC_MEDIAN_FLOOR_DEG: f32 = 2.0;

/// Absolute spike threshold for a static track.
pub(crate) const STATIC_SPIKE_THRESHOLD_DEG: f32 = 15.0;

/// Multiplier on the track's own median delta for active bones. Tuned so
/// periodic motion with peaks at 4× median is not flagged — see
/// fixtures::fast_heel_strike (median=10°, peaks=40°, threshold=45°).
pub(crate) const ACTIVE_MULTIPLIER: f32 = 4.5;

/// Smallest unsigned quaternion angle between `a` and `b`, in degrees.
/// Clamps the dot product to avoid `acos` NaN under float rounding.
pub(crate) fn quat_angle_between(a: Quat, b: Quat) -> f32 {
    let dot = (a.dot(b)).abs().min(1.0);
    2.0 * dot.acos().to_degrees()
}

/// Name-filter for bones the retargeter does not consume as deformation
/// bones. Mirrors common ARP rig conventions:
///   - `*_stretch.*` — IK stretch helpers
///   - `c_*`         — rig control bones
///   - `*_twist.*`   — twist correction bones
/// Anomalous quaternion paths on these bones are irrelevant to retarget
/// quality because they never reach the VRM output.
pub(crate) fn is_non_deformation_bone(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("_stretch")
        || lower.starts_with("c_")
        || lower.contains("_twist")
}

/// Per-bone spikes-per-100-frames from a sequence of frame-to-frame
/// angular deltas (degrees). Hybrid threshold: static tracks
/// (median < STATIC_MEDIAN_FLOOR_DEG) use an absolute spike threshold
/// (STATIC_SPIKE_THRESHOLD_DEG); active tracks use ACTIVE_MULTIPLIER ×
/// median. Shared between rubric A1.1 and rubric C1.3 — both detectors
/// had the same broken 3×median shape before Phase 2.
pub(crate) fn spike_rate_from_deltas(deltas: &[f32]) -> f32 {
    if deltas.is_empty() {
        return 0.0;
    }

    let mut sorted: Vec<f32> = deltas.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = if sorted.len() % 2 == 0 {
        (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
    } else {
        sorted[sorted.len() / 2]
    };

    let threshold = if median < STATIC_MEDIAN_FLOOR_DEG {
        STATIC_SPIKE_THRESHOLD_DEG
    } else {
        ACTIVE_MULTIPLIER * median
    };

    let spike_count = deltas.iter().filter(|&&d| d > threshold).count();
    (spike_count as f32 / deltas.len() as f32) * 100.0
}
```

### `src/quality/mod.rs` (     300 LOC)

```rust
// === Quality Rubric v0.1.0 ===
// Three-tier evaluation: FBX Source (A), VRM Model (B), Retarget Output (C)

/// Letter grade with numeric score
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Grade {
    F = 0,
    C = 70,
    B = 80,
    A = 90,
}

impl Grade {
    pub fn from_score(score: f32) -> Self {
        if score >= 90.0 { Grade::A }
        else if score >= 80.0 { Grade::B }
        else if score >= 70.0 { Grade::C }
        else { Grade::F }
    }

    pub fn label(&self) -> &'static str {
        match self {
            Grade::A => "A",
            Grade::B => "B",
            Grade::C => "C",
            Grade::F => "F",
        }
    }
}

impl std::fmt::Display for Grade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.label())
    }
}

/// A single metric's result
#[derive(Debug, Clone)]
pub struct MetricResult {
    pub name: String,
    pub grade: Grade,
    pub score: f32,
    pub detail: String,
}

/// Hard-fail check result
#[derive(Debug, Clone)]
pub struct HardFailCheck {
    pub name: String,
    pub passed: bool,
    pub detail: String,
}

/// Complete rubric evaluation result
#[derive(Debug, Clone)]
pub struct RubricResult {
    pub rubric_name: String,
    pub hard_fails: Vec<HardFailCheck>,
    pub metrics: Vec<MetricResult>,
    pub overall: Grade,
    pub overall_score: f32,
}

impl RubricResult {
    pub fn has_hard_fail(&self) -> bool {
        self.hard_fails.iter().any(|h| !h.passed)
    }

    /// First failed hard-fail check name, if any. Useful for gating
    /// reason strings.
    pub fn first_hard_fail(&self) -> Option<&str> {
        self.hard_fails.iter().find(|h| !h.passed).map(|h| h.name.as_str())
    }
}

/// A/B/C pipeline gating decision.
///
/// Rubric C (retarget output quality) is meaningless if either the
/// source animation (Rubric A) or the target model (Rubric B) is
/// structurally invalid. This helper inspects A and B rubric results
/// and returns `Some(reason)` if Rubric C evaluation should be
/// skipped, or `None` if the pipeline should proceed to retargeting
/// and Rubric C scoring.
///
/// Reason strings are designed to be printed in sweep output and
/// embedded in [`diagnostic::Diagnostic`] messages downstream.
///
/// ## Why gating
///
/// Without it, the sweep reports `vrm_0x_m_moth × 21566 → C1.x F`
/// as if the retargeter failed, when the actual failure is `moth`'s
/// Rubric B `B1.1_Completeness=F` — the model is missing humanoid
/// bones. Same for facial-only FBX inputs (`FC_00078`) which fail
/// `output_has_bones` hard-fail in Rubric C purely because they
/// have no body animation in the first place.
///
/// shotloom port path: `shotloom-import::import_and_validate`
/// orchestrates A → B → (gate) → C in this order. Bevy-vrm's sweep
/// bin and any other callers should mirror the same shape.
pub fn check_gating(
    rubric_a: &RubricResult,
    rubric_b: &RubricResult,
) -> Option<String> {
    if let Some(name) = rubric_a.first_hard_fail() {
        return Some(format!("rubric_a hard fail: {}", name));
    }
    if let Some(name) = rubric_b.first_hard_fail() {
        return Some(format!("rubric_b hard fail: {}", name));
    }
    None
}

impl std::fmt::Display for RubricResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] ", self.rubric_name)?;
        if self.has_hard_fail() {
            let fails: Vec<&str> = self.hard_fails.iter()
                .filter(|h| !h.passed)
                .map(|h| h.name.as_str())
                .collect();
            return write!(f, "HARD FAIL: {}", fails.join(", "));
        }
        for m in &self.metrics {
            write!(f, "{}={} ", m.name, m.grade)?;
        }
        write!(f, "-> Overall: {}", self.overall)
    }
}

// Sub-modules
pub mod detector;
pub mod diagnostic;
pub mod rubric_a;
pub mod rubric_b;
pub mod rubric_c;
pub mod fk_evaluate;
pub mod validate;
pub mod score;

// Re-export split module types at quality:: level for backwards compatibility
pub use score::{BoneScore, RetargetScore, score_retarget, FingerBoneScore, FingerRestScore, score_fingers};
pub use diagnostic::{Diagnostic, Severity, aggregate_severity, grade_to_severity, rubric_to_diagnostics};

/// Quality grade for retarget output.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RqGrade {
    A,
    B,
    C,
    F,
}

impl RqGrade {
    pub fn is_ok(self) -> bool {
        !matches!(self, RqGrade::F)
    }
}

impl std::fmt::Display for RqGrade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RqGrade::A => write!(f, "A"),
            RqGrade::B => write!(f, "B"),
            RqGrade::C => write!(f, "C"),
            RqGrade::F => write!(f, "F"),
        }
    }
}

/// A single quality diagnostic (warning or error).
#[derive(Debug, Clone)]
pub struct RqDiagnostic {
    pub is_error: bool,
    pub metric: String,
    pub message: String,
}

/// Complete retarget output ready for animation clip creation.
/// LLM-optimized compact quality summary.
pub struct RetargetQuality {
    pub bone_count: usize,
    pub scale_ratio: f32,
    pub identity_total: usize,
    pub identity_pass: usize,
    pub identity_fails: Vec<(String, f32)>,
    pub source_detected: crate::config::FbxSourceType,
    pub source_config: crate::config::FbxSourceType,
}

impl RetargetQuality {
    pub fn diagnostics(&self) -> Vec<RqDiagnostic> {
        let mut d = Vec::new();
        if self.scale_ratio < 0.5 || self.scale_ratio > 2.0 {
            d.push(RqDiagnostic { is_error: true, metric: "scale".into(), message: format!("scale={:.3} — abnormal model size ({:.0}x diff). VRM 0.x coordinate system unconverted?", self.scale_ratio, if self.scale_ratio < 1.0 { 1.0 / self.scale_ratio } else { self.scale_ratio }) });
        } else if self.scale_ratio < 0.8 || self.scale_ratio > 1.3 {
            d.push(RqDiagnostic { is_error: false, metric: "scale".into(), message: format!("scale={:.3} — unusual size ratio. Check avatar proportions.", self.scale_ratio) });
        }
        let fc = self.identity_fails.len();
        if fc > 3 {
            d.push(RqDiagnostic { is_error: true, metric: "identity".into(), message: format!("identity FAIL {}/{} — VRM rest pose may not be A-pose/T-pose.", fc, self.identity_total) });
        } else if fc > 0 {
            d.push(RqDiagnostic { is_error: false, metric: "identity".into(), message: format!("identity FAIL {}/{} — minor rest pose deviations.", fc, self.identity_total) });
        }
        if self.bone_count < 30 {
            d.push(RqDiagnostic { is_error: true, metric: "bones".into(), message: format!("bones={} — too few bone tracks. FBX may be facial-only (no body animation).", self.bone_count) });
        } else if self.bone_count < 45 {
            d.push(RqDiagnostic { is_error: false, metric: "bones".into(), message: format!("bones={} — fewer bones than expected. Some body parts may lack animation.", self.bone_count) });
        }
        d
    }

    pub fn grade(&self) -> RqGrade {
        let diags = self.diagnostics();
        let errors = diags.iter().filter(|d| d.is_error).count();
        let warnings = diags.iter().filter(|d| !d.is_error).count();
        if errors > 0 {
            RqGrade::F
        } else if warnings >= 3 {
            RqGrade::C
        } else if warnings >= 1 {
            RqGrade::B
        } else {
            RqGrade::A
        }
    }

    pub fn to_rq_lines(&self) -> Vec<String> {
        let mut lines = Vec::new();
        lines.push(format!(
            "[RQ] bones={} scale={:.3}",
            self.bone_count, self.scale_ratio,
        ));
        lines.push(format!(
            "[RQ:INFO] source: detected={} config={}",
            self.source_detected, self.source_config,
        ));
        if self.identity_fails.is_empty() {
            lines.push(format!(
                "[RQ] identity: PASS {}/{}",
                self.identity_pass, self.identity_total,
            ));
        } else {
            let fails: Vec<String> = self
                .identity_fails
                .iter()
                .map(|(name, angle)| format!("{}={:.0}°", Self::short_name(name), angle))
                .collect();
            lines.push(format!(
                "[RQ] identity: FAIL {}/{} {}",
                self.identity_fails.len(),
                self.identity_total,
                fails.join(" "),
            ));
        }
        let diags = self.diagnostics();
        for diag in &diags {
            let tag = if diag.is_error { "ERROR" } else { "WARN" };
            lines.push(format!("[RQ:{}] {}", tag, diag.message));
        }
        let grade = self.grade();
        let errors = diags.iter().filter(|d| d.is_error).count();
        let warnings = diags.iter().filter(|d| !d.is_error).count();
        lines.push(format!(
            "[RQ] GRADE: {} ({} warnings, {} errors)",
            grade, warnings, errors,
        ));
        lines
    }

    pub fn short_name(name: &str) -> String {
        match name {
            "leftUpperArm" => "lUA".into(),
            "rightUpperArm" => "rUA".into(),
            "leftLowerArm" => "lLA".into(),
            "rightLowerArm" => "rLA".into(),
            "leftUpperLeg" => "lUL".into(),
            "rightUpperLeg" => "rUL".into(),
            "leftLowerLeg" => "lLL".into(),
            "rightLowerLeg" => "rLL".into(),
            "leftHand" => "lH".into(),
            "rightHand" => "rH".into(),
            "leftFoot" => "lF".into(),
            "rightFoot" => "rF".into(),
            "leftShoulder" => "lSh".into(),
            "rightShoulder" => "rSh".into(),
            s if s.starts_with("left") => format!("l{}", &s[4..std::cmp::min(s.len(), 10)]),
            s if s.starts_with("right") => format!("r{}", &s[5..std::cmp::min(s.len(), 11)]),
            s => s[..std::cmp::min(s.len(), 8)].into(),
        }
    }
}

impl std::fmt::Display for RetargetQuality {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for line in self.to_rq_lines() {
            writeln!(f, "{}", line)?;
        }
        Ok(())
    }
}
```

### `src/quality/score.rs` (     324 LOC)

```rust
// === FK-based Retarget Scoring ===

use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::types::{FbxSkeletonFrames, TargetAnimation, VrmRestPose};
use super::RqGrade;

/// Per-bone error metrics.
pub struct BoneScore {
    pub vrm_bone_name: String,
    pub position_rms_m: f32,
    pub position_max_m: f32,
    pub direction_angle_mean_deg: f32,
    pub direction_angle_max_deg: f32,
    pub grade: RqGrade,
}

/// Complete FK-based retarget scoring.
pub struct RetargetScore {
    pub bone_scores: Vec<BoneScore>,
    pub overall_position_rms_m: f32,
    pub overall_direction_mean_deg: f32,
    pub overall_grade: RqGrade,
    pub frame_count: usize,
}

/// Bones included in FK propagation (includes root + upperChest for correct chain).
const FK_BONES: &[&str] = &[
    "VRMC_vrm.root_bone",
    "hips", "spine", "chest", "upperChest", "neck", "head",
    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
    "leftUpperLeg", "leftLowerLeg", "leftFoot",
    "rightUpperLeg", "rightLowerLeg", "rightFoot",
];

/// Bones that get a score (excludes root).
const SCORED_BONES: &[&str] = &[
    "hips", "spine", "chest", "neck", "head",
    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
    "leftUpperLeg", "leftLowerLeg", "leftFoot",
    "rightUpperLeg", "rightLowerLeg", "rightFoot",
];

const DIRECTION_PAIRS: &[(&str, &str)] = &[
    ("hips", "spine"), ("spine", "chest"), ("chest", "neck"), ("neck", "head"),
    ("leftShoulder", "leftUpperArm"), ("leftUpperArm", "leftLowerArm"), ("leftLowerArm", "leftHand"),
    ("rightShoulder", "rightUpperArm"), ("rightUpperArm", "rightLowerArm"), ("rightLowerArm", "rightHand"),
    ("leftUpperLeg", "leftLowerLeg"), ("leftLowerLeg", "leftFoot"),
    ("rightUpperLeg", "rightLowerLeg"), ("rightLowerLeg", "rightFoot"),
];

/// Compute VRM world positions per frame via FK on retarget result.
fn compute_vrm_world_positions(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
) -> HashMap<String, Vec<Vec3>> {
    let frame_count = result.bones.first().map(|b| b.rotations.len()).unwrap_or(0);
    if frame_count == 0 {
        return HashMap::new();
    }

    // Build lookup: vrm_bone_name → retarget result
    let bone_lookup: HashMap<&str, &crate::types::RetargetedBone> = result.bones.iter()
        .map(|b| (b.vrm_bone_name.as_str(), b))
        .collect();

    // Topological order from parent_map (includes root for correct FK chain)
    let all_bones: Vec<String> = FK_BONES.iter().map(|s| s.to_string()).collect();
    let topo = build_topo_order(&vrm_rest.parent_map, &all_bones);

    let mut world_positions: HashMap<String, Vec<Vec3>> = HashMap::new();

    for frame in 0..frame_count {
        let mut frame_global_pos: HashMap<&str, Vec3> = HashMap::new();
        let mut frame_global_rot: HashMap<&str, Quat> = HashMap::new();

        for bone_name in &topo {
            // Local rotation: from retarget result, or rest pose
            let local_rot = bone_lookup.get(bone_name.as_str())
                .and_then(|b| b.rotations.get(frame).copied())
                .unwrap_or_else(|| vrm_rest.bone_rest_local.get(bone_name).copied().unwrap_or(Quat::IDENTITY));

            // Local translation: from retarget result (hips), or rest translation
            let local_trans = bone_lookup.get(bone_name.as_str())
                .and_then(|b| b.translations.as_ref())
                .and_then(|t| t.get(frame).copied())
                .unwrap_or_else(|| vrm_rest.bone_rest_translation.get(bone_name).copied().unwrap_or(Vec3::ZERO));

            // Parent global transform
            let parent_name = vrm_rest.parent_map.get(bone_name);
            let parent_pos = parent_name
                .and_then(|p| frame_global_pos.get(p.as_str()).copied())
                .unwrap_or(Vec3::ZERO);
            let parent_rot = parent_name
                .and_then(|p| frame_global_rot.get(p.as_str()).copied())
                .unwrap_or(Quat::IDENTITY);

            let world_pos = parent_pos + parent_rot * local_trans;
            let world_rot = (parent_rot * local_rot).normalize();

            frame_global_pos.insert(bone_name.as_str(), world_pos);
            frame_global_rot.insert(bone_name.as_str(), world_rot);
        }

        for bone_name in &topo {
            let pos = frame_global_pos.get(bone_name.as_str()).copied().unwrap_or(Vec3::ZERO);
            world_positions.entry(bone_name.clone()).or_default().push(pos);
        }
    }

    world_positions
}

fn build_topo_order(parent_map: &HashMap<String, String>, bone_names: &[String]) -> Vec<String> {
    let mut order = Vec::new();
    let mut remaining: std::collections::HashSet<&str> = bone_names.iter().map(|s| s.as_str()).collect();
    loop {
        let ready: Vec<String> = remaining.iter()
            .filter(|&&name| {
                parent_map.get(name)
                    .map_or(true, |p| !remaining.contains(p.as_str()))
            })
            .map(|&s| s.to_string())
            .collect();
        if ready.is_empty() { break; }
        for name in &ready {
            remaining.remove(name.as_str());
            order.push(name.clone());
        }
    }
    order
}

/// Score retarget result by comparing FK world positions against FBX source.
pub fn score_retarget(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
    fbx_skeleton: &FbxSkeletonFrames,
    bone_mapping: &HashMap<String, String>, // vrm_name → fbx_name
    scale_ratio: f32,
) -> RetargetScore {
    let vrm_world = compute_vrm_world_positions(result, vrm_rest);
    let frame_count = result.bones.first().map(|b| b.rotations.len()).unwrap_or(0);

    let mut bone_scores = Vec::new();

    // Direction error per bone (from DIRECTION_PAIRS)
    let mut dir_errors_by_bone: HashMap<&str, Vec<f32>> = HashMap::new();

    for &(bone, child) in DIRECTION_PAIRS {
        let vrm_bone_pos = vrm_world.get(bone);
        let vrm_child_pos = vrm_world.get(child);
        let fbx_bone_name = bone_mapping.get(bone);
        let fbx_child_name = bone_mapping.get(child);
        let fbx_bone_pos = fbx_bone_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
        let fbx_child_pos = fbx_child_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

        if let (Some(vb), Some(vc), Some(fb), Some(fc)) = (vrm_bone_pos, vrm_child_pos, fbx_bone_pos, fbx_child_pos) {
            let errors: Vec<f32> = (0..frame_count).filter_map(|f| {
                let vb_p = vb.get(f)?;
                let vc_p = vc.get(f)?;
                let fb_p = fb.get(f)?;
                let fc_p = fc.get(f)?;
                let vrm_dir = (*vc_p - *vb_p).normalize_or_zero();
                let fbx_dir = (Vec3::new(fc_p[0], fc_p[1], fc_p[2]) - Vec3::new(fb_p[0], fb_p[1], fb_p[2])).normalize_or_zero();
                if vrm_dir.length_squared() < 0.5 || fbx_dir.length_squared() < 0.5 { return None; }
                Some(vrm_dir.dot(fbx_dir).clamp(-1.0, 1.0).acos().to_degrees())
            }).collect();
            dir_errors_by_bone.insert(bone, errors);
        }
    }

    // Position error per bone (hips-relative)
    let vrm_hips = vrm_world.get("hips");
    let fbx_hips_name = bone_mapping.get("hips");
    let fbx_hips = fbx_hips_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

    for &bone in SCORED_BONES {
        let vrm_pos = vrm_world.get(bone);
        let fbx_name = bone_mapping.get(bone);
        let fbx_pos = fbx_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

        let pos_errors: Vec<f32> = if let (Some(vp), Some(fp), Some(vh), Some(fh)) = (vrm_pos, fbx_pos, vrm_hips, fbx_hips) {
            (0..frame_count).filter_map(|f| {
                let v = vp.get(f)?;
                let fraw = fp.get(f)?;
                let v_hips = vh.get(f)?;
                let f_hips = fh.get(f)?;
                let vrm_rel = *v - *v_hips;
                let fbx_rel = (Vec3::new(fraw[0], fraw[1], fraw[2]) - Vec3::new(f_hips[0], f_hips[1], f_hips[2])) * scale_ratio;
                Some((vrm_rel - fbx_rel).length())
            }).collect()
        } else {
            Vec::new()
        };

        let pos_rms = if pos_errors.is_empty() { 0.0 } else {
            (pos_errors.iter().map(|e| e * e).sum::<f32>() / pos_errors.len() as f32).sqrt()
        };
        let pos_max = pos_errors.iter().copied().fold(0.0f32, f32::max);

        let dir_errors = dir_errors_by_bone.get(bone).cloned().unwrap_or_default();
        let dir_mean = if dir_errors.is_empty() { -1.0 } else {
            dir_errors.iter().sum::<f32>() / dir_errors.len() as f32
        };
        let dir_max = dir_errors.iter().copied().fold(0.0f32, f32::max);

        let pos_grade = if pos_rms < 0.02 { RqGrade::A } else if pos_rms < 0.05 { RqGrade::B } else if pos_rms < 0.10 { RqGrade::C } else { RqGrade::F };
        let dir_grade = if dir_mean < 0.0 { pos_grade } // no direction data
            else if dir_mean < 5.0 { RqGrade::A } else if dir_mean < 15.0 { RqGrade::B } else if dir_mean < 30.0 { RqGrade::C } else { RqGrade::F };
        let grade = if (pos_grade as u8) > (dir_grade as u8) { pos_grade } else { dir_grade };

        bone_scores.push(BoneScore {
            vrm_bone_name: bone.to_string(),
            position_rms_m: pos_rms,
            position_max_m: pos_max,
            direction_angle_mean_deg: if dir_mean < 0.0 { f32::NAN } else { dir_mean },
            direction_angle_max_deg: if dir_errors.is_empty() { f32::NAN } else { dir_max },
            grade,
        });
    }

    let overall_pos = if bone_scores.is_empty() { 0.0 } else {
        (bone_scores.iter().map(|b| b.position_rms_m * b.position_rms_m).sum::<f32>() / bone_scores.len() as f32).sqrt()
    };
    let dir_scores: Vec<f32> = bone_scores.iter().filter(|b| !b.direction_angle_mean_deg.is_nan()).map(|b| b.direction_angle_mean_deg).collect();
    let overall_dir = if dir_scores.is_empty() { 0.0 } else {
        dir_scores.iter().sum::<f32>() / dir_scores.len() as f32
    };
    let overall_grade = bone_scores.iter().map(|b| b.grade).max_by_key(|g| *g as u8).unwrap_or(RqGrade::A);

    RetargetScore { bone_scores, overall_position_rms_m: overall_pos, overall_direction_mean_deg: overall_dir, overall_grade, frame_count }
}

// === Finger Rest Pose Scoring ===

pub struct FingerBoneScore {
    pub vrm_name: String,
    pub rest_error_deg: f32,
    pub max_delta_deg: f32,
}

pub struct FingerRestScore {
    pub bones: Vec<FingerBoneScore>,
    pub mean_rest_error: f32,
    pub max_rest_error: f32,
    pub grade: RqGrade,
}

/// Score finger retarget: does frame 0 match VRM rest? How much do fingers move?
pub fn score_fingers(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
) -> FingerRestScore {
    let finger_names: Vec<&str> = result.bones.iter()
        .filter(|b| {
            let n = &b.vrm_bone_name;
            n.contains("Thumb") || n.contains("Index") || n.contains("Middle")
                || n.contains("Ring") || n.contains("Little")
        })
        .map(|b| b.vrm_bone_name.as_str())
        .collect();

    let mut bones = Vec::new();
    for &name in &finger_names {
        let bone = result.bones.iter().find(|b| b.vrm_bone_name == name).unwrap();
        let rest = vrm_rest.bone_rest_local.get(name).copied().unwrap_or(Quat::IDENTITY);

        // Frame 0 vs rest (rest pose match)
        let rest_error = bone.rotations.first()
            .map(|&r| r.angle_between(rest).to_degrees())
            .unwrap_or(0.0);

        // Max frame-to-frame delta (animation range)
        let max_delta = if bone.rotations.len() > 1 {
            bone.rotations.windows(2)
                .map(|w| w[0].angle_between(w[1]).to_degrees())
                .fold(0.0f32, f32::max)
        } else { 0.0 };

        bones.push(FingerBoneScore {
            vrm_name: name.to_string(),
            rest_error_deg: rest_error,
            max_delta_deg: max_delta,
        });
    }

    let mean_rest = if bones.is_empty() { 0.0 }
        else { bones.iter().map(|b| b.rest_error_deg).sum::<f32>() / bones.len() as f32 };
    let max_rest = bones.iter().map(|b| b.rest_error_deg).fold(0.0f32, f32::max);

    // Grade: A<1° B<5° C<15° F≥15°
    let grade = if max_rest < 1.0 { RqGrade::A }
        else if max_rest < 5.0 { RqGrade::B }
        else if max_rest < 15.0 { RqGrade::C }
        else { RqGrade::F };

    FingerRestScore { bones, mean_rest_error: mean_rest, max_rest_error: max_rest, grade }
}

impl std::fmt::Display for RetargetScore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "=== Retarget Score ({} frames) ===", self.frame_count)?;
        writeln!(f, "{:<25} {:>8} {:>8} {:>8} {:>8} {:>5}",
            "Bone", "PosRMS", "PosMax", "DirMean", "DirMax", "Grade")?;
        writeln!(f, "{}", "-".repeat(63))?;
        for bs in &self.bone_scores {
            let dir_mean = if bs.direction_angle_mean_deg.is_nan() { "N/A".to_string() }
                else { format!("{:.1}°", bs.direction_angle_mean_deg) };
            let dir_max = if bs.direction_angle_max_deg.is_nan() { "N/A".to_string() }
                else { format!("{:.1}°", bs.direction_angle_max_deg) };
            writeln!(f, "{:<25} {:>6.3}m {:>6.3}m {:>8} {:>8} {:>5}",
                bs.vrm_bone_name, bs.position_rms_m, bs.position_max_m,
                dir_mean, dir_max, bs.grade)?;
        }
        writeln!(f, "{}", "-".repeat(63))?;
        writeln!(f, "{:<25} {:>6.3}m {:>17.1}°        {:>5}",
            "OVERALL", self.overall_position_rms_m, self.overall_direction_mean_deg, self.overall_grade)?;
        Ok(())
    }
}
```

### `src/quality/validate.rs` (     391 LOC)

```rust
//! Pipeline validator: runs the full FBX→VRM retarget pipeline headlessly
//! and checks for failures at each stage.
//!
//! Usage: call `validate_pipeline()` with config JSON, FBX bytes, and VRM bytes.
//! Returns a `ValidationResult` with per-stage pass/fail and details.

use glam::Vec3;

use crate::config::RetargetConfig;
use crate::fbx::SourceAsset;
use crate::types::VrmRestPose;
use crate::vrm_compat::VrmVersion;

/// Per-stage validation result
#[derive(Debug, Clone)]
pub struct StageResult {
    pub name: String,
    pub passed: bool,
    pub details: Vec<String>,
}

/// Full pipeline validation result
#[derive(Debug)]
pub struct ValidationResult {
    pub stages: Vec<StageResult>,
    pub all_passed: bool,
}

impl std::fmt::Display for ValidationResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for stage in &self.stages {
            let icon = if stage.passed { "✓" } else { "✗" };
            writeln!(f, "[{}] {}", icon, stage.name)?;
            for detail in &stage.details {
                writeln!(f, "  {}", detail)?;
            }
        }
        if self.all_passed {
            writeln!(f, "\nPIPELINE VALID")
        } else {
            writeln!(f, "\nPIPELINE INVALID")
        }
    }
}

/// Validate the full retarget pipeline.
///
/// Runs each stage and reports pass/fail with details.
/// Stops at first failure (subsequent stages are skipped).
pub fn validate_pipeline(
    config_json: &str,
    fbx_bytes: &[u8],
    vrm_bytes: &[u8],
) -> ValidationResult {
    let mut stages: Vec<StageResult> = Vec::new();

    // [1] Config validation
    let config = match validate_config(config_json) {
        Ok((config, details)) => {
            stages.push(StageResult { name: "Config".into(), passed: true, details });
            config
        }
        Err(details) => {
            stages.push(StageResult { name: "Config".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [2] FBX Parse validation
    let fbx = match validate_fbx_parse(fbx_bytes) {
        Ok((fbx, details)) => {
            stages.push(StageResult { name: "FBX Parse".into(), passed: true, details });
            fbx
        }
        Err(details) => {
            stages.push(StageResult { name: "FBX Parse".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [3] VRM Load validation
    let (vrm_rest, vrm_version) = match validate_vrm_load(vrm_bytes) {
        Ok((rest, ver, details)) => {
            stages.push(StageResult { name: "VRM Load".into(), passed: true, details });
            (rest, ver)
        }
        Err(details) => {
            stages.push(StageResult { name: "VRM Load".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [4] Mapping validation
    let anim = match validate_mapping(&fbx, &config, vrm_version) {
        Ok((anim, details)) => {
            stages.push(StageResult { name: "Mapping".into(), passed: true, details });
            anim
        }
        Err(details) => {
            stages.push(StageResult { name: "Mapping".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [5] Adapter validation
    let mut vrm_rest_mut = vrm_rest.clone();
    let adapter_details = validate_adapter(&anim, &mut vrm_rest_mut, &config);
    stages.push(StageResult {
        name: "Adapter".into(),
        passed: true,
        details: adapter_details,
    });

    // [6] Retarget validation
    let fbx_skel = crate::compute_fbx_skeleton_from_parsed(&fbx).ok();
    match validate_retarget(&fbx, &anim, vrm_rest_mut, fbx_skel) {
        Ok(details) => {
            stages.push(StageResult { name: "Retarget".into(), passed: true, details });
        }
        Err(details) => {
            stages.push(StageResult { name: "Retarget".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    }

    let all_passed = stages.iter().all(|s| s.passed);
    ValidationResult { stages, all_passed }
}

// ─── Stage implementations ────────────────────────────────────────────────────

fn validate_config(json: &str) -> Result<(RetargetConfig, Vec<String>), Vec<String>> {
    let config =
        RetargetConfig::from_json(json).map_err(|e| vec![format!("parse error: {}", e)])?;
    let mut details = Vec::new();

    details.push(format!("{} direct_map entries", config.direct_map.len()));
    details.push(format!("{} accumulate entries", config.accumulate.len()));
    details.push(format!("{} rest_sync_rules", config.rest_sync_rules.len()));

    // Check for unknown strategy names in rest_sync_rules
    let valid_strategies = ["Skip", "ScalarCurl", "DirectCopy"];
    for (pattern, strategy) in &config.rest_sync_rules {
        if !valid_strategies.contains(&strategy.as_str()) {
            return Err(vec![format!(
                "unknown strategy '{}' for pattern '{}' (valid: {:?})",
                strategy, pattern, valid_strategies
            )]);
        }
    }

    Ok((config, details))
}

fn validate_fbx_parse(bytes: &[u8]) -> Result<(SourceAsset, Vec<String>), Vec<String>> {
    let fbx =
        crate::fbx::parse(bytes).map_err(|e| vec![format!("FBX parse failed: {}", e)])?;
    let mut details = Vec::new();

    details.push(format!(
        "{} bones, {} frames, {:.1}s",
        fbx.bones.len(),
        fbx.frame_count,
        fbx.duration
    ));
    details.push(format!(
        "{}/{} bind clusters",
        fbx.bind_world.len(),
        fbx.bones.len()
    ));
    details.push(format!("source: {:?}", fbx.detected_source_type));

    if fbx.bones.len() < 20 {
        return Err(vec![format!(
            "too few bones: {} (min 20 for humanoid)",
            fbx.bones.len()
        )]);
    }
    if fbx.frame_count < 2 {
        return Err(vec![format!(
            "too few frames: {} (min 2)",
            fbx.frame_count
        )]);
    }

    Ok((fbx, details))
}

fn validate_vrm_load(
    bytes: &[u8],
) -> Result<(VrmRestPose, VrmVersion, Vec<String>), Vec<String>> {
    let mut details = Vec::new();

    // Detect VRM version by inspecting the GLB JSON chunk
    let version = detect_vrm_version(bytes);
    details.push(format!("version: {:?}", version));

    // Extract rest pose from GLB bytes (VRM 1.0 path)
    // VRM 0.x detection: extract_vrm_rest_pose may fail for 0.x — handled below
    let rest = crate::vrm_rest::extract_vrm_rest_pose(bytes).map_err(|e| {
        vec![format!("failed to extract VRM rest pose: {}", e)]
    })?;

    details.push(format!("{} bones in rest", rest.bone_rest_local.len()));

    // Check for required humanoid bones
    let required = [
        "hips", "spine", "head",
        "leftUpperArm", "leftLowerArm",
        "rightUpperArm", "rightLowerArm",
        "leftUpperLeg", "leftLowerLeg",
        "rightUpperLeg", "rightLowerLeg",
        "leftFoot", "rightFoot",
    ];
    let missing: Vec<&str> = required
        .iter()
        .filter(|b| !rest.bone_rest_local.contains_key(**b))
        .copied()
        .collect();
    if !missing.is_empty() {
        return Err(vec![format!("missing required bones: {:?}", missing)]);
    }

    // Check for NaN in rest rotations
    for (name, q) in &rest.bone_rest_local {
        if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
            return Err(vec![format!("NaN in bone rest: {}", name)]);
        }
    }

    // Forward direction: hips rest world rotation must point forward (-Z).
    // VRM convention: character faces -Z at rest. A model authored facing +Z
    // (or with hips baked 180° around Y) is broken at the model level and
    // cannot be fixed by retargeting.
    if let Some(hips_world) = rest.bone_rest_global.get("hips") {
        let fwd = *hips_world * Vec3::NEG_Z;
        if fwd.z > 0.0 {
            return Err(vec![format!(
                "hips rest faces backward (fwd.z={:.3}, expected <0)",
                fwd.z
            )]);
        }
        details.push(format!("hips forward ok (fwd.z={:.3})", fwd.z));
    }

    Ok((rest, version, details))
}

fn validate_mapping(
    fbx: &SourceAsset,
    config: &RetargetConfig,
    version: VrmVersion,
) -> Result<(crate::types::MappedAnimation, Vec<String>), Vec<String>> {
    let anim = crate::mapping::retarget(fbx, config, version)
        .map_err(|e| vec![format!("mapping failed: {}", e)])?;

    let mut details = Vec::new();
    details.push(format!(
        "{} bone tracks, {} expression tracks",
        anim.bone_tracks.len(),
        anim.expression_tracks.len()
    ));
    details.push(format!("{:.1}s duration", anim.duration_secs));

    // Check for NaN in tracks
    for track in &anim.bone_tracks {
        for (i, q) in track.rotations.iter().enumerate() {
            if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
                return Err(vec![format!(
                    "NaN at frame {} in bone {}",
                    i, track.vrm_bone_name
                )]);
            }
        }
    }

    if anim.bone_tracks.is_empty() {
        return Err(vec!["no bone tracks produced".to_string()]);
    }

    Ok((anim, details))
}

fn validate_adapter(
    anim: &crate::types::MappedAnimation,
    vrm_rest: &mut VrmRestPose,
    config: &RetargetConfig,
) -> Vec<String> {
    let mut details = Vec::new();

    let (axis_map, stage3_log) = crate::adapters::arp_vrm::stage3_build_adapter_config(
        &anim.bone_tracks,
        &vrm_rest.bone_rest_local,
        &vrm_rest.bone_rest_global,
    );

    let (overrides, stage4_log) = crate::adapters::arp_vrm::stage4_sync_rest_to_fbx(
        &mut vrm_rest.bone_rest_local,
        &mut vrm_rest.bone_rest_global,
        &vrm_rest.parent_map,
        &anim.bone_tracks,
        &axis_map,
        Some(config),
    );

    details.push(format!("{} axis map entries", axis_map.len()));
    details.push(format!("{} rest overrides", overrides.len()));

    // Emit classification summary from stage4 log
    for line in &stage4_log {
        if line.contains("classified:") {
            details.push(line.clone());
        }
    }

    let _ = stage3_log; // consumed above via details
    details
}

fn validate_retarget(
    fbx: &SourceAsset,
    anim: &crate::types::MappedAnimation,
    vrm_rest: VrmRestPose,
    fbx_skel: Option<crate::types::FbxSkeletonFrames>,
) -> Result<Vec<String>, Vec<String>> {
    // Derive fbx_root and fbx_hips from the animation's bone track names
    // (the same way integration_test.rs derives them from the config map).
    // For the validator we use simple heuristics: hips track → fbx_hips,
    // a root-level bone (no parent in fbx.bones) → fbx_root.
    let fbx_hips = anim
        .bone_tracks
        .iter()
        .find(|t| t.vrm_bone_name == "hips")
        .and_then(|_t| {
            // Look for the FBX bone that has no parent (scene root under hips)
            fbx.bones
                .iter()
                .find(|(_, b)| b.parent.is_none())
                .map(|(name, _)| name.clone())
        })
        .unwrap_or_default();

    let fbx_root = fbx
        .bones
        .iter()
        .find(|(_, b)| b.parent.is_none())
        .map(|(name, _)| name.clone())
        .unwrap_or_default();

    let retargeter =
        crate::ArpRetargeterInner::new(vrm_rest, fbx_skel, anim, &fbx_root, &fbx_hips);
    let result = retargeter.apply(anim);

    let mut details = Vec::new();
    details.push(format!(
        "{} bones, {:.1}s",
        result.bones.len(),
        result.duration_secs
    ));

    if result.bones.is_empty() {
        return Err(vec!["no retarget output bones".to_string()]);
    }

    // Check for NaN in output
    for bone in &result.bones {
        for (i, q) in bone.rotations.iter().enumerate() {
            if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
                return Err(vec![format!(
                    "NaN in retarget output: {} frame {}",
                    bone.vrm_bone_name, i
                )]);
            }
        }
    }

    Ok(details)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Detect VRM version from raw GLB bytes by scanning the JSON chunk for
/// extension markers without full gltf parse.
fn detect_vrm_version(bytes: &[u8]) -> VrmVersion {
    // GLB JSON chunk starts at byte 20 (12-byte header + 8-byte chunk header)
    // Safe fallback: search for VRM extension markers anywhere in the first 64KB
    let probe = &bytes[..bytes.len().min(65536)];
    // SAFETY: lossy UTF-8 conversion is fine for string search
    let snippet = String::from_utf8_lossy(probe);
    VrmVersion::detect_from_gltf_json(&snippet).unwrap_or(VrmVersion::V1_0)
}
```

### `src/quality/diagnostic.rs` (     291 LOC)

```rust
//! Diagnostic conversion layer — bevy-vrm Grade ↔ shotloom Diagnostic.
//!
//! Bevy-vrm grades quality using a 4-level letter system
//! ([`Grade::A`] through [`Grade::F`]). Shotloom's `shotloom_common::
//! diagnostic::Diagnostic` (per ADR-0021) uses a 3-level severity
//! (`Error` / `Warning` / `Info`) plus structured fields. Every bevy-vrm
//! quality output that wants to feed shotloom-side orchestration must
//! pass through this layer first.
//!
//! ## Grade → Severity mapping
//!
//! | Grade | Severity | Reason |
//! |-------|----------|--------|
//! | A     | (omitted) | "passing" — nothing to report |
//! | B     | Info      | minor deviation, retarget is usable |
//! | C     | Warning   | meaningful issue, manual review suggested |
//! | F     | Error     | retarget broken or input invalid |
//!
//! Hard-fail checks always emit `Error` regardless of grade.
//!
//! ## Why bevy-vrm keeps Grade
//!
//! `Grade` is more useful for the rapid-iteration R&D workflow where
//! sweep bins print a 1-character status per pairing. shotloom's
//! Diagnostic is more useful for production orchestration where each
//! issue needs a code, location, and suggestion. Bevy-vrm continues
//! to compute Grade internally; this layer translates only at the
//! boundary where shotloom-shape consumers exist.
//!
//! ## Future shape
//!
//! The struct here is bevy-vrm's stand-in for `shotloom_common::
//! diagnostic::Diagnostic`. When the shotloom port lands, this file
//! gets replaced by an `extern crate shotloom_common;` import — the
//! field set is intentionally identical so the swap is mechanical.
//! Until then, the standalone definition lets bevy-vrm-side tests
//! exercise the conversion path without depending on shotloom.

use super::{Grade, MetricResult, RubricResult};

/// Severity of a single diagnostic, matching shotloom's ADR-0021 levels.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Severity {
    /// Informational note — input is acceptable but has minor deviations.
    /// Maps from Grade::B.
    Info,
    /// Warning — meaningful issue that may degrade output, manual review
    /// suggested. Maps from Grade::C.
    Warning,
    /// Error — retarget broken, input invalid, or hard-fail check failed.
    /// Maps from Grade::F or any failed hard-fail.
    Error,
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Severity::Info => write!(f, "INFO"),
            Severity::Warning => write!(f, "WARN"),
            Severity::Error => write!(f, "ERROR"),
        }
    }
}

/// Convert a [`Grade`] to a [`Severity`]. Returns `None` for Grade::A
/// (passing — nothing to emit).
pub fn grade_to_severity(grade: Grade) -> Option<Severity> {
    match grade {
        Grade::A => None,
        Grade::B => Some(Severity::Info),
        Grade::C => Some(Severity::Warning),
        Grade::F => Some(Severity::Error),
    }
}

/// A single diagnostic — bevy-vrm's stand-in for shotloom's
/// `shotloom_common::diagnostic::Diagnostic`. Field set is identical
/// (per ADR-0021) so the eventual port is a mechanical type swap.
#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub severity: Severity,
    /// Stable code for the diagnostic — typically the metric name
    /// (e.g. "C1.2_GroundContact", "B1.2_Proportion"). Programmatic
    /// consumers filter on this.
    pub code: String,
    /// Human-readable description. Includes the metric's `detail`
    /// field when available.
    pub message: String,
    /// Optional location hint (rubric name, frame index, bone name, ...).
    /// Free-form; not parsed.
    pub location: Option<String>,
    /// Optional remediation hint. Currently empty for all bevy-vrm
    /// diagnostics; populated when shotloom side adds suggestions.
    pub suggestion: Option<String>,
    /// Whether the issue is recoverable — i.e. whether downstream code
    /// can still produce useful output. Hard fails are non-recoverable;
    /// metric grades are recoverable.
    pub recoverable: bool,
}

impl Diagnostic {
    /// Convert a [`MetricResult`] to a [`Diagnostic`]. Returns `None`
    /// when the metric grades A (nothing to report).
    pub fn from_metric(metric: &MetricResult, rubric: &str) -> Option<Diagnostic> {
        let severity = grade_to_severity(metric.grade)?;
        Some(Diagnostic {
            severity,
            code: metric.name.clone(),
            message: format!("{} ({})", metric.name, metric.detail),
            location: Some(rubric.to_string()),
            suggestion: None,
            recoverable: true,
        })
    }

    /// Convert a hard-fail check to an Error diagnostic. Hard fails are
    /// always non-recoverable — they indicate the input or output is
    /// structurally invalid.
    pub fn from_hard_fail(check: &super::HardFailCheck, rubric: &str) -> Diagnostic {
        Diagnostic {
            severity: Severity::Error,
            code: check.name.clone(),
            message: format!("hard fail: {} ({})", check.name, check.detail),
            location: Some(rubric.to_string()),
            suggestion: None,
            recoverable: false,
        }
    }
}

/// Convert an entire [`RubricResult`] into a flat list of diagnostics.
/// Metrics that grade A are omitted. Failed hard-fail checks always
/// emit an Error diagnostic regardless of overall grade.
pub fn rubric_to_diagnostics(result: &RubricResult) -> Vec<Diagnostic> {
    let mut diags = Vec::new();
    for hf in &result.hard_fails {
        if !hf.passed {
            diags.push(Diagnostic::from_hard_fail(hf, &result.rubric_name));
        }
    }
    for m in &result.metrics {
        if let Some(d) = Diagnostic::from_metric(m, &result.rubric_name) {
            diags.push(d);
        }
    }
    diags
}

/// Aggregate severity across a slice of diagnostics. Returns the
/// highest severity present, or `None` if the slice is empty.
pub fn aggregate_severity(diags: &[Diagnostic]) -> Option<Severity> {
    diags.iter().map(|d| d.severity).max()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::quality::{HardFailCheck, MetricResult};

    fn metric(name: &str, grade: Grade) -> MetricResult {
        MetricResult {
            name: name.to_string(),
            grade,
            score: 0.0,
            detail: format!("test detail for {}", name),
        }
    }

    #[test]
    fn grade_a_emits_nothing() {
        assert_eq!(grade_to_severity(Grade::A), None);
    }

    #[test]
    fn grade_b_to_info() {
        assert_eq!(grade_to_severity(Grade::B), Some(Severity::Info));
    }

    #[test]
    fn grade_c_to_warning() {
        assert_eq!(grade_to_severity(Grade::C), Some(Severity::Warning));
    }

    #[test]
    fn grade_f_to_error() {
        assert_eq!(grade_to_severity(Grade::F), Some(Severity::Error));
    }

    #[test]
    fn rubric_omits_grade_a_metrics() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: Vec::new(),
            metrics: vec![
                metric("M1_All_Good", Grade::A),
                metric("M2_Minor", Grade::B),
                metric("M3_Major", Grade::F),
            ],
            overall: Grade::C,
            overall_score: 70.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert_eq!(diags.len(), 2);
        assert_eq!(diags[0].code, "M2_Minor");
        assert_eq!(diags[0].severity, Severity::Info);
        assert_eq!(diags[1].code, "M3_Major");
        assert_eq!(diags[1].severity, Severity::Error);
    }

    #[test]
    fn hard_fails_always_error_and_non_recoverable() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: vec![
                HardFailCheck {
                    name: "input_has_bones".to_string(),
                    passed: false,
                    detail: "no bones found".to_string(),
                },
            ],
            metrics: Vec::new(),
            overall: Grade::F,
            overall_score: 0.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].severity, Severity::Error);
        assert!(!diags[0].recoverable);
    }

    #[test]
    fn passing_hard_fails_omitted() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: vec![
                HardFailCheck {
                    name: "input_has_bones".to_string(),
                    passed: true,
                    detail: "12 bones".to_string(),
                },
            ],
            metrics: Vec::new(),
            overall: Grade::A,
            overall_score: 95.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert!(diags.is_empty());
    }

    #[test]
    fn aggregate_picks_highest_severity() {
        let diags = vec![
            Diagnostic {
                severity: Severity::Info,
                code: "x".into(),
                message: "x".into(),
                location: None,
                suggestion: None,
                recoverable: true,
            },
            Diagnostic {
                severity: Severity::Warning,
                code: "y".into(),
                message: "y".into(),
                location: None,
                suggestion: None,
                recoverable: true,
            },
        ];
        assert_eq!(aggregate_severity(&diags), Some(Severity::Warning));

        let with_error = {
            let mut d = diags.clone();
            d.push(Diagnostic {
                severity: Severity::Error,
                code: "z".into(),
                message: "z".into(),
                location: None,
                suggestion: None,
                recoverable: false,
            });
            d
        };
        assert_eq!(aggregate_severity(&with_error), Some(Severity::Error));
    }

    #[test]
    fn aggregate_empty_returns_none() {
        assert_eq!(aggregate_severity(&[]), None);
    }
}
```

### `src/config.rs` (     104 LOC)

```rust
use serde::Deserialize;
use std::collections::HashMap;

pub use fbx_rig::FbxSourceType;

#[derive(Debug, Deserialize)]
pub struct RetargetConfig {
    pub name: String,
    #[serde(default)]
    pub source_prefix: Vec<String>,
    pub direct_map: HashMap<String, String>,
    #[serde(default)]
    pub accumulate: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub root_bone: Option<String>,
    #[serde(default)]
    pub ignore_patterns: Vec<String>,
    #[serde(default)]
    pub vrm_version_overrides: HashMap<String, HashMap<String, String>>,
    /// FBX blend shape channel name → VRM expression preset name
    #[serde(default)]
    pub expression_map: HashMap<String, String>,
    #[serde(default)]
    pub source_type: FbxSourceType,
    /// Per-bone rest sync strategy overrides. Each entry is a [pattern, strategy]
    /// pair matched against VRM bone names (case-insensitive, `*` wildcard).
    /// Evaluated in order — first match wins. Unmatched bones default to Skip.
    ///
    /// Supported strategies: "Skip", "ScalarCurl", "DirectCopy"
    /// "UserCalibrated" is NOT config-driven — it comes from DEFAULT_POSE lookup.
    #[serde(default)]
    pub rest_sync_rules: Vec<(String, String)>,
}

impl RetargetConfig {
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    pub fn should_ignore(&self, bone_name: &str) -> bool {
        for pattern in &self.ignore_patterns {
            if glob_match(pattern, bone_name) {
                return true;
            }
        }
        false
    }

    pub fn resolve_vrm_bone(&self, src_bone: &str, vrm_version: &str) -> Option<String> {
        if let Some(overrides) = self.vrm_version_overrides.get(vrm_version)
            && let Some(vrm_bone) = overrides.get(src_bone)
        {
            return Some(vrm_bone.clone());
        }
        self.direct_map.get(src_bone).cloned()
    }
}

/// Glob-style pattern match (case-insensitive, `*` wildcard at any position).
///
/// Supports patterns like `"*Thumb*"` (contains), `"left*"` (starts with),
/// `"*Distal"` (ends with), `"leftThumb"` (exact). Multiple `*` are supported
/// via a simple segment-split approach that handles the common cases.
pub fn glob_match(pattern: &str, text: &str) -> bool {
    let p = pattern.to_lowercase();
    let t = text.to_lowercase();

    if !p.contains('*') {
        return p == t;
    }

    // Split on '*' and match segments in order.
    let parts: Vec<&str> = p.split('*').collect();
    let starts_with_star = p.starts_with('*');
    let ends_with_star = p.ends_with('*');

    let mut remaining = t.as_str();

    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        let part_str: &str = part;
        if i == 0 && !starts_with_star {
            // First segment with no leading star → must match at start.
            if !remaining.starts_with(part_str) {
                return false;
            }
            remaining = &remaining[part_str.len()..];
        } else if i == parts.len() - 1 && !ends_with_star {
            // Last segment with no trailing star → must match at end.
            return remaining.ends_with(part_str);
        } else {
            // Middle segment — find first occurrence after current position.
            if let Some(pos) = remaining.find(part_str) {
                remaining = &remaining[pos + part_str.len()..];
            } else {
                return false;
            }
        }
    }

    true
}
```

### `src/lib.rs` (     146 LOC)

```rust
pub mod adapters;
pub mod config;
pub mod finger_axis_map;
pub mod finger_rest_align;
pub mod mapping;
pub mod orchestrate;
pub mod postprocess;
pub mod quality;
pub mod retargeter;
pub mod source_anim;
pub mod topo;
pub mod types;
pub use vrm0_compat;
pub mod vrm_compat;
pub mod vrm_rest;

/// Re-export the `fbx_rig` crate under the historical `fbx` module name
/// so existing call sites (`humanoid_retarget::fbx::parse`, etc.) keep
/// working without churn. New code should prefer `fbx_rig` directly.
pub use fbx_rig as fbx;

pub use glam;
pub use config::FbxSourceType;
pub use fbx_rig::{compute_fbx_skeleton, compute_fbx_skeleton_from_parsed};
pub use quality::{RetargetQuality, RetargetScore, BoneScore, RqDiagnostic, RqGrade, score_retarget, FingerRestScore, FingerBoneScore, score_fingers};
pub use retargeter::{ArpRetargeterInner, IdentityRetargeter, RetargeterOptions};
pub use source_anim::{SourceAnimBody, SourceAnimFacial, SourceFormat};
pub use types::{
    BoneTrack, ExpressionTrack, FbxDiagnostics, FbxSkeletonFrames, TargetAnimation,
    MappedAnimation, RetargetedBone, VrmRestPose, swing_twist_decompose,
};

use thiserror::Error;

use config::RetargetConfig;
use vrm_compat::VrmVersion;

#[derive(Error, Debug)]
pub enum RetargetError {
    #[error("FBX parse error: {0}")]
    FbxParse(String),
    #[error("config error: {0}")]
    Config(String),
    #[error("mapping error: {0}")]
    Mapping(String),
}

impl From<serde_json::Error> for RetargetError {
    fn from(e: serde_json::Error) -> Self {
        RetargetError::Config(e.to_string())
    }
}

impl From<fbx_rig::Error> for RetargetError {
    fn from(e: fbx_rig::Error) -> Self {
        RetargetError::FbxParse(e.to_string())
    }
}

/// Parse FBX once, retarget, and compute skeleton visualization in a single pass.
pub fn retarget_with_skeleton(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics, FbxSkeletonFrames), RetargetError> {
    let config = RetargetConfig::from_json(config_json)?;
    let fbx = fbx::parse(fbx_data)?;

    let source_resolved = resolve_source_type(&config, &fbx);

    // Skip heavy skeleton computation if no real bone animation (facial-only FBX)
    let has_bone_animation = fbx.tracks.values().any(|t| t.rotations.len() > 1);
    let skeleton = if has_bone_animation {
        fbx::compute_fbx_skeleton_from_parsed(&fbx)?
    } else {
        FbxSkeletonFrames {
            frame_count: fbx.frame_count,
            duration: fbx.duration,
            bone_positions: std::collections::HashMap::new(),
            bone_rotations: std::collections::HashMap::new(),
            hierarchy: std::collections::HashMap::new(),
        }
    };

    let mut all_bones: Vec<String> = fbx.bones.keys().cloned().collect();
    all_bones.sort();
    let mut animated_bones: Vec<String> = fbx.tracks.keys().cloned().collect();
    animated_bones.sort();

    let version_key = vrm_version.config_key();
    let mut matched_direct = Vec::new();
    let mut unmatched_config = Vec::new();

    for (src, _vrm_default) in &config.direct_map {
        let vrm = config
            .resolve_vrm_bone(src, version_key)
            .unwrap_or_else(|| _vrm_default.clone());
        let found = fbx.tracks.contains_key(src)
            || config
                .source_prefix
                .iter()
                .any(|p| fbx.tracks.contains_key(&format!("{}{}", p, src)));
        if found {
            matched_direct.push((src.clone(), vrm));
        } else {
            unmatched_config.push(src.clone());
        }
    }

    let mut blend_shape_channels: Vec<String> = fbx.blend_shape_tracks.keys().cloned().collect();
    blend_shape_channels.sort();

    let diag = FbxDiagnostics {
        all_bones,
        animated_bones,
        matched_direct,
        unmatched_config,
        blend_shape_channels,
        source_detected: fbx.detected_source_type,
        source_resolved,
        creator: fbx.creator.clone(),
    };

    let anim = mapping::retarget(&fbx, &config, vrm_version)?;
    Ok((anim, diag, skeleton))
}

pub fn retarget(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics), RetargetError> {
    let (anim, diag, _skeleton) = retarget_with_skeleton(fbx_data, config_json, vrm_version)?;
    Ok((anim, diag))
}

fn resolve_source_type(
    config: &RetargetConfig,
    fbx: &fbx::SourceAsset,
) -> config::FbxSourceType {
    if config.source_type == config::FbxSourceType::Auto {
        fbx.detected_source_type
    } else {
        config.source_type
    }
}
```

### `src/source_anim.rs` (     115 LOC)

```rust
//! Source animation views — body / facial split.
//!
//! `SourceAsset` (in `fbx_rig`) is the canonical file-format wrapper that
//! holds both skeletal animation tracks and blendshape tracks loaded from a
//! single FBX. This module exposes two **borrowing views** over a
//! `SourceAsset` that carry only the slice each downstream consumer cares
//! about:
//!
//! - [`SourceAnimBody`] — bones, tracks, bind world, frame timing.
//!   Consumed by skeletal retargeting (`mapping::retarget_body`).
//! - [`SourceAnimFacial`] — blendshape tracks, frame timing.
//!   Consumed by facial retargeting (`mapping::retarget_facial`).
//!
//! The split is the bevy-vrm side of the shotloom port path: shotloom's
//! `shotloom-t2m` crate owns body animation, `shotloom-vrm` (or a future
//! facial crate) owns blendshapes. Keeping them as separable views here
//! lets the eventual port replace either side without dragging the other
//! along.
//!
//! No copying happens at view construction — the views are zero-cost
//! references into the `SourceAsset` that owns the data. Callers that
//! need a fresh allocation can clone the underlying maps explicitly.
//!
//! ## Future formats
//!
//! `SourceFormat` is an enum with one variant today (`Fbx`). When a second
//! format ships (likely `Glb` or `Bvh`), the views become the abstraction
//! point: each format provides its own view constructors, and the retarget
//! body/facial functions operate on the views without caring about format.

use glam::Mat4;
use std::collections::HashMap;

use crate::config::FbxSourceType;
use crate::fbx::{FbxBone, FbxBoneTrack, SourceAsset};

/// Discriminator for the underlying source animation file format.
///
/// One variant today (`Fbx`). The enum exists so future format additions
/// (Glb, Bvh, Alembic, ...) can be tagged without an API break.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SourceFormat {
    #[default]
    Fbx,
}

/// Body (skeletal) animation slice — borrows from a [`SourceAsset`].
///
/// Holds everything `mapping::retarget_body` needs to produce
/// [`crate::types::BoneTrack`]s, and nothing else. In particular, no
/// blendshape state — facial data lives in [`SourceAnimFacial`].
///
/// Construct via [`SourceAnimBody::from_source_asset`]. The view is a
/// zero-cost borrow; the underlying `SourceAsset` must outlive the view.
pub struct SourceAnimBody<'a> {
    pub format: SourceFormat,
    pub bones: &'a HashMap<String, FbxBone>,
    pub tracks: &'a HashMap<String, FbxBoneTrack>,
    pub bind_world: &'a HashMap<String, Mat4>,
    pub frame_count: usize,
    pub duration: f32,
    pub detected_source_type: FbxSourceType,
}

impl<'a> SourceAnimBody<'a> {
    /// Borrow the body slice from a [`SourceAsset`].
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
        Self {
            format: SourceFormat::Fbx,
            bones: &asset.bones,
            tracks: &asset.tracks,
            bind_world: &asset.bind_world,
            frame_count: asset.frame_count,
            duration: asset.duration,
            detected_source_type: asset.detected_source_type,
        }
    }

    /// Returns true when the body slice has no animation tracks (e.g. a
    /// facial-only FBX). Useful for callers that want to skip body
    /// retargeting on input that has nothing skeletal to retarget.
    pub fn is_empty(&self) -> bool {
        self.tracks.is_empty()
    }
}

/// Facial (blendshape) animation slice — borrows from a [`SourceAsset`].
///
/// Holds blendshape tracks and frame timing only. No bones, no bind world.
/// Consumed by `mapping::retarget_facial` to produce
/// [`crate::types::ExpressionTrack`]s.
pub struct SourceAnimFacial<'a> {
    pub format: SourceFormat,
    pub blend_shape_tracks: &'a HashMap<String, Vec<f32>>,
    pub frame_count: usize,
    pub duration: f32,
}

impl<'a> SourceAnimFacial<'a> {
    /// Borrow the facial slice from a [`SourceAsset`].
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
        Self {
            format: SourceFormat::Fbx,
            blend_shape_tracks: &asset.blend_shape_tracks,
            frame_count: asset.frame_count,
            duration: asset.duration,
        }
    }

    /// Returns true when the facial slice has no blendshape tracks.
    /// Body-only FBX files (most game animations) hit this case.
    pub fn is_empty(&self) -> bool {
        self.blend_shape_tracks.is_empty()
    }
}
```

### `src/finger_rest_align.rs` (     172 LOC)

```rust
//! Stage 2: Finger rest pose alignment.
//!
//! Consumes Stage 1 ([`crate::finger_axis_map`]) output and modifies the
//! VRM bind pose for non-thumb finger bones, injecting the per-FBX baseline
//! curl extracted from ARP rest.
//!
//! The key operation:
//!
//! ```text
//! new_dst_rest_local = old_dst_rest_local × Quat::from_axis_angle(
//!     vrm_curl_axis,
//!     arp_baseline_curl,
//! )
//! ```
//!
//! Then `dst_rest_global` is recomputed in topological order so child
//! finger bones inherit the modified parent rest world correctly.
//!
//! ## Why this is not v1
//!
//! v1 tried `dst_rest_local = src_local_rest` (full quaternion copy in SO(3)).
//! v3 proved that's a tautology when the canonical bind-delta formula is
//! used at init time. The proof's assumption: all transforms are
//! `SO(3) → SO(3)`.
//!
//! Stage 1 + Stage 2 together break that assumption: the curl scalar
//! passes through ℝ (`signed_angle`), and is re-applied around a
//! **different axis** (VRM's axis, not ARP's). The result is geometrically
//! distinct from `src_local_rest` and outside the tautology range.
//!
//! ## Why this won't fight wrist
//!
//! Stage 2 only modifies finger bones (24 non-thumb). The wrist (`leftHand`,
//! `rightHand`) is left untouched. The VRM bind-conjugation formula then
//! runs unchanged with the modified finger rest baseline embedded.
//!
//! If wrist itself is wrong (Opus's warning), this Stage 2 won't fix it —
//! that needs a separate hand-orientation pass. Stage 2's success criterion
//! is "fingers preserve ARP loose-fist baseline at standing", not "whole
//! hand looks correct".

use glam::Quat;
use std::collections::HashMap;

use crate::adapters::arp_vrm::RestAlignOverride;
use crate::finger_axis_map::FingerAxisEntry;

/// One per-bone override entry produced by Stage 2.
#[derive(Debug, Clone)]
pub struct RestOverride {
    pub vrm_bone_name: String,
    pub old_local: Quat,
    pub new_local: Quat,
    pub new_global: Quat,
    pub baseline_deg: f32,
}

/// Apply Stage 2: walk the axis map in topological order (parent before
/// child), build modified local + global rests, return per-bone records.
///
/// Bones are processed in finger-segment order: `*Proximal` → `*Intermediate`
/// → `*Distal`. This guarantees that when a child reads its parent's new
/// global rest, the parent has already been processed.
///
/// Bones whose parent is OUTSIDE the axis map (e.g. `leftIndexProximal`'s
/// parent is `leftHand`) read the parent's UNMODIFIED global rest from
/// `vrm_rest_global`, which is correct because we are not modifying the
/// hand.
pub fn compute_overrides(
    axis_map: &HashMap<String, FingerAxisEntry>,
    vrm_rest_local: &HashMap<String, Quat>,
    vrm_rest_global: &HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Vec<RestOverride> {
    let mut overrides: Vec<RestOverride> = Vec::with_capacity(axis_map.len());
    let mut new_global_by_name: HashMap<String, Quat> = HashMap::new();

    // Sort entries so parents are processed first within each finger chain.
    // VRM finger naming: `<side><Finger>{Proximal,Intermediate,Distal}`.
    let mut sorted_names: Vec<&String> = axis_map.keys().collect();
    sorted_names.sort_by_key(|name| segment_depth(name));

    for vrm_name in sorted_names {
        let entry = &axis_map[vrm_name];

        let old_local = vrm_rest_local
            .get(vrm_name)
            .copied()
            .unwrap_or(Quat::IDENTITY);

        // Stage 2 core: inject scalar baseline curl around VRM axis.
        let curl_quat = Quat::from_axis_angle(
            entry.vrm_axis_local,
            entry.arp_baseline_curl_rad,
        );
        let new_local = (old_local * curl_quat).normalize();

        // Recompute global. Parent's global comes from the override map if
        // we already processed it; otherwise from the original VRM rest.
        let parent_global = parent_map
            .get(vrm_name)
            .and_then(|p| {
                new_global_by_name
                    .get(p)
                    .copied()
                    .or_else(|| vrm_rest_global.get(p).copied())
            })
            .unwrap_or(Quat::IDENTITY);
        let new_global = (parent_global * new_local).normalize();

        new_global_by_name.insert(vrm_name.clone(), new_global);

        overrides.push(RestOverride {
            vrm_bone_name: vrm_name.clone(),
            old_local,
            new_local,
            new_global,
            baseline_deg: entry.arp_baseline_curl_rad.to_degrees(),
        });
    }

    overrides
}

/// Apply Stage 2 IN PLACE: mutates the VRM rest maps and returns
/// RestAlignOverride entries for the existing adapter logging API.
///
/// This is the convenience wrapper used by the `arp_vrm` adapter. It calls
/// [`compute_overrides`] then writes the new locals/globals back into the
/// supplied maps.
pub fn apply_in_place(
    axis_map: &HashMap<String, FingerAxisEntry>,
    vrm_rest_local: &mut HashMap<String, Quat>,
    vrm_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Vec<RestAlignOverride> {
    let overrides = compute_overrides(axis_map, vrm_rest_local, vrm_rest_global, parent_map);

    let mut log = Vec::with_capacity(overrides.len());
    for o in &overrides {
        let old_deg = o.old_local.angle_between(Quat::IDENTITY).to_degrees();
        let new_deg = o.new_local.angle_between(Quat::IDENTITY).to_degrees();

        vrm_rest_local.insert(o.vrm_bone_name.clone(), o.new_local);
        vrm_rest_global.insert(o.vrm_bone_name.clone(), o.new_global);

        log.push(RestAlignOverride {
            vrm_name: o.vrm_bone_name.clone(),
            old_deg,
            new_deg,
            delta_deg: o.baseline_deg,
            chain_check_deg: 0.0,
            hemisphere_flipped: 0,
        });
    }
    log
}

/// Returns 0 for Proximal, 1 for Intermediate, 2 for Distal, 3 otherwise.
/// Used to topologically order finger segments within a chain.
fn segment_depth(vrm_bone_name: &str) -> u32 {
    let lower = vrm_bone_name.to_lowercase();
    if lower.ends_with("proximal") {
        0
    } else if lower.ends_with("intermediate") {
        1
    } else if lower.ends_with("distal") {
        2
    } else {
        3
    }
}
```

### `src/vrm_compat.rs` (      24 LOC)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VrmVersion {
    V0x,
    V1_0,
}

impl VrmVersion {
    pub fn config_key(&self) -> &'static str {
        match self {
            VrmVersion::V0x => "0.x",
            VrmVersion::V1_0 => "1.0",
        }
    }

    pub fn detect_from_gltf_json(json_str: &str) -> Option<Self> {
        if json_str.contains("\"VRMC_vrm\"") {
            Some(VrmVersion::V1_0)
        } else if json_str.contains("\"VRM\"") {
            Some(VrmVersion::V0x)
        } else {
            None
        }
    }
}
```

### `src/adapters/arp_vrm.rs` (     479 LOC)

```rust
//! ARP → VRM full-body rest alignment adapter.
//!
//! Problem: VRM rest pose has many bones (notably hands and the entire finger
//! chain) in a T-pose / bind orientation that does NOT match ARP's rest. The
//! generic delta retarget formula preserves each rig's "0 point", so a small
//! FBX delta from the ARP rest gets applied on top of the VRM rest — and the
//! result keeps the VRM bones near the VRM rest, not near the FBX-animated
//! pose. Fingers stick out straight; hands stick out horizontally.
//!
//! Earlier finger-only iterations (v1 direct copy, v2 parent-world, v3
//! canonical bind-delta formula) all failed because the wrist (`leftHand` /
//! `rightHand`) is also wrong. Fixing the children while their parent is wrong
//! is structurally impossible. The fix is to align the entire VRM humanoid
//! skeleton's rest to ARP's rest.
//!
//! Strategy: walk every VRM bone in topological order (root → leaves). For
//! each bone that has a corresponding ARP source track, override the VRM
//! local rest so that the VRM bone's NEW world rest equals the ARP bone's
//! world rest:
//!
//! ```text
//!     new_local  = inv(parent_world_after_override) * arp_bone_world
//!     new_global = arp_bone_world  (by construction)
//! ```
//!
//! Because we walk parents before children, the parent's `dst_rest_global`
//! has already been replaced with the ARP world value when we read it. The
//! root case (no parent) takes parent_world = identity, so its new_local
//! equals arp_bone_world directly.
//!
//! Translations are not touched — bone lengths stay as VRM provided them.
//! IBM is not touched — the standard skinning shader will deform mesh
//! vertices through the new bone orientations automatically. The retargeter
//! formula in `retargeter.rs::apply` is not touched.
//!
//! Bones without a matching ARP source track (helper bones, IK targets,
//! eye bones, etc.) are skipped silently — their rest stays as the VRM
//! loader provided it.
//!
//! Hemisphere canonicalization (`q.w >= 0`) is applied at every quat
//! boundary so the quaternion double-cover (q ≡ -q as rotations but
//! `angle_between(q, -q) = 180°`) doesn't produce phantom 180° warnings.

use glam::Quat;
use std::collections::{HashMap, HashSet};

use crate::config::RetargetConfig;
use crate::types::BoneTrack;

/// Per-bone diff record for logging.
#[derive(Debug, Clone)]
pub struct RestAlignOverride {
    pub vrm_name: String,
    pub old_deg: f32,
    pub new_deg: f32,
    pub delta_deg: f32,
    /// Residual angle between the new `dst_rest_global` and the ARP world
    /// target. Should be ≈ 0° by construction; non-zero indicates a numerical
    /// error or upstream coord mismatch.
    pub chain_check_deg: f32,
    /// Number of input quats whose hemisphere was flipped on read for this
    /// bone (0..=3). Helps diagnose double-cover origin.
    pub hemisphere_flipped: u32,
}

/// Force a quaternion into the `w >= 0` hemisphere.
#[inline]
fn canonicalize(q: Quat) -> Quat {
    if q.w < 0.0 { -q } else { q }
}

// =====================================================================
// Stage 4 rest sync — strategy-based dispatch
// =====================================================================
//
// Stage 4 modifies VRM `dst_rest_local` / `dst_rest_global` to match the
// loaded FBX's rest pose. Each bone uses ONE of several strategies. This
// is the single source of truth for "which bones get what rest sync
// treatment" — adding a new bone is a one-line change in
// [`rest_sync_strategy`].
//
// ## Strategies
//
// - **Skip**: bone's rest stays as VRM original. Default for anything
//   not explicitly handled.
//
// - **DirectCopy**: `dst_rest_local = src_local_rest` (ARP lcl_rot_rest). Used
//   for the arm chain (upperArm/lowerArm/hand) where directly copying
//   the Blender bone rotation produces a visually correct result.
//   Cheap, simple, but assumes bone-length convention mismatch is small
//   enough not to produce tautology.
//
// - **ScalarCurl**: axis-angle decompose ARP rest → extract scalar angle
//   → reapply around a hardcoded VRM-local axis. v5 finger pipeline.
//   Breaks the v1~v4 SO(3) tautology by passing through ℝ. Essential
//   for bones with severe bone-length convention mismatch (non-thumb
//   fingers: ARP +Y vs VRM +X).
//
// ## Extension
//
// Adding a new bone: extend [`rest_sync_strategy`] to map its name to
// the right strategy.
//
// Adding a new strategy: extend [`RestSyncStrategy`] enum + add an
// `apply_<name>_one` function + dispatch in [`stage4_sync_rest_to_fbx`].

/// Per-bone rest sync strategy at Stage 4.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RestSyncStrategy {
    /// Do not touch this bone's rest.
    Skip,
    /// Overwrite `dst_rest_local` with ARP `src_local_rest` directly.
    DirectCopy,
    /// Scalar curl pipeline (v5 fingers).
    ScalarCurl,
    /// User-calibrated quat — composed on top of VRM rest:
    /// `new_dst_rest_local = old_dst_rest_local * delta`.
    /// Values come from calibration mode (C key) + manual tuning.
    UserCalibrated(Quat),
}

/// Classify a VRM bone's rest sync strategy.
///
/// Priority order:
/// 1. `UserCalibrated` — from `arp_vrm_user_pose::lookup` (carries quat data,
///    never config-driven).
/// 2. Config-driven rules from `config.rest_sync_rules` when provided and
///    non-empty (first glob match wins).
/// 3. Hardcoded fallback — preserves existing behaviour when no config rules
///    are present (backward compatible).
pub fn rest_sync_strategy(vrm_bone_name: &str, config: Option<&RetargetConfig>) -> RestSyncStrategy {
    // UserCalibrated always takes priority (quat data lives in DEFAULT_POSE).
    if let Some(delta) = super::arp_vrm_user_pose::lookup(vrm_bone_name) {
        return RestSyncStrategy::UserCalibrated(delta);
    }

    // Config-driven rules (first match wins).
    if let Some(cfg) = config {
        if !cfg.rest_sync_rules.is_empty() {
            for (pattern, strategy_name) in &cfg.rest_sync_rules {
                if crate::config::glob_match(pattern, vrm_bone_name) {
                    return match strategy_name.as_str() {
                        "ScalarCurl" => RestSyncStrategy::ScalarCurl,
                        "DirectCopy" => RestSyncStrategy::DirectCopy,
                        "Skip" => RestSyncStrategy::Skip,
                        _ => RestSyncStrategy::Skip,
                    };
                }
            }
            // All rules evaluated, none matched → default Skip.
            return RestSyncStrategy::Skip;
        }
    }

    // Hardcoded fallback (backward compatible when rest_sync_rules absent).
    // Thumb: safety fallback — DEFAULT_POSE에 엄지 본이 없으면 VRM 원본 rest 유지.
    // EXP-003 (2026-04-12) DirectCopy 시도는 축 180° 반전으로 엄지가 팔꿈치를 향해 실패.
    let lower = vrm_bone_name.to_lowercase();
    if lower.contains("thumb") {
        return RestSyncStrategy::Skip;
    }
    if ["index", "middle", "ring", "little"]
        .iter()
        .any(|k| lower.contains(k))
    {
        return RestSyncStrategy::ScalarCurl;
    }

    RestSyncStrategy::Skip
}

/// DirectCopy strategy — one bone. Returns `None` if the bone has no
/// ARP source track.
fn apply_direct_copy_one(
    bone_name: &str,
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
) -> Option<RestAlignOverride> {
    let src_local_rest = bone_tracks
        .iter()
        .find(|t| t.vrm_bone_name == bone_name)
        .map(|t| t.src_local_rest)?;

    let old_local = dst_rest_local
        .get(bone_name)
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_local = canonicalize(src_local_rest.normalize());

    let parent_global = parent_map
        .get(bone_name)
        .and_then(|p| dst_rest_global.get(p.as_str()))
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_global = canonicalize((parent_global * new_local).normalize());

    dst_rest_local.insert(bone_name.to_string(), new_local);
    dst_rest_global.insert(bone_name.to_string(), new_global);

    Some(RestAlignOverride {
        vrm_name: bone_name.to_string(),
        old_deg: old_local.angle_between(Quat::IDENTITY).to_degrees(),
        new_deg: new_local.angle_between(Quat::IDENTITY).to_degrees(),
        delta_deg: (old_local.inverse() * new_local)
            .angle_between(Quat::IDENTITY)
            .to_degrees(),
        chain_check_deg: 0.0,
        hemisphere_flipped: 0,
    })
}

/// UserCalibrated — compose user delta on top of existing VRM rest.
///   new_local = old_local * user_delta
/// Matches how the viewer's calibration mode displays the pose.
fn apply_user_calibrated_one(
    bone_name: &str,
    user_delta: Quat,
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Option<RestAlignOverride> {
    let old_local = dst_rest_local
        .get(bone_name)
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_local = canonicalize((old_local * user_delta).normalize());

    let parent_global = parent_map
        .get(bone_name)
        .and_then(|p| dst_rest_global.get(p.as_str()))
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_global = canonicalize((parent_global * new_local).normalize());

    dst_rest_local.insert(bone_name.to_string(), new_local);
    dst_rest_global.insert(bone_name.to_string(), new_global);

    Some(RestAlignOverride {
        vrm_name: bone_name.to_string(),
        old_deg: old_local.angle_between(Quat::IDENTITY).to_degrees(),
        new_deg: new_local.angle_between(Quat::IDENTITY).to_degrees(),
        delta_deg: user_delta.angle_between(Quat::IDENTITY).to_degrees(),
        chain_check_deg: 0.0,
        hemisphere_flipped: 0,
    })
}

/// Topologically sort a bone name set so parents appear before children
/// (when parent is also in the set). Deterministic ordering for bones
/// at the same depth (alphabetical).
fn topo_sort_bones(bones: &[String], parent_map: &HashMap<String, String>) -> Vec<String> {
    let set: HashSet<String> = bones.iter().cloned().collect();
    let mut visited: HashSet<String> = HashSet::with_capacity(set.len());
    let mut result: Vec<String> = Vec::with_capacity(set.len());

    fn visit(
        bone: &str,
        set: &HashSet<String>,
        parent_map: &HashMap<String, String>,
        visited: &mut HashSet<String>,
        result: &mut Vec<String>,
    ) {
        if visited.contains(bone) || !set.contains(bone) {
            return;
        }
        if let Some(parent) = parent_map.get(bone) {
            visit(parent, set, parent_map, visited, result);
        }
        visited.insert(bone.to_string());
        result.push(bone.to_string());
    }

    let mut sorted_bones: Vec<&String> = set.iter().collect();
    sorted_bones.sort();
    for bone in sorted_bones {
        visit(bone, &set, parent_map, &mut visited, &mut result);
    }
    result
}

/// **Stage 3: ARP → VRM structural adapter.**
///
/// Builds per-bone axis correspondence info between ARP (Blender, bone
/// length +Y) and VRM (glTF, bone length +X) for non-thumb fingers. This
/// is a STRUCTURAL conversion that depends on rig conventions, NOT on the
/// specific FBX's pose. Does not mutate `dst_rest_local` beyond any
/// diagnostic side-effects.
///
/// Returns: finger axis map + warnings (including the B-DIAG / HAND-DIAG
/// diagnostic lines). The axis map is consumed by Stage 4 to apply per-FBX
/// baseline curls.
pub fn stage3_build_adapter_config(
    bone_tracks: &[BoneTrack],
    dst_rest_local: &HashMap<String, Quat>,
    dst_rest_global: &HashMap<String, Quat>,
) -> (
    HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
    Vec<String>,
) {
    let mut warnings = vec!["[STAGE-3] ARP → VRM structural adapter".to_string()];
    let (axis_map, diag) = crate::finger_axis_map::compute_axis_map(
        bone_tracks,
        dst_rest_local,
        dst_rest_global,
    );
    warnings.push(format!(
        "[STAGE-3] axis map built: {} non-thumb finger bones",
        axis_map.len()
    ));
    warnings.extend(diag);
    (axis_map, warnings)
}

/// **Stage 4: Sync VRM rest pose to the currently loaded FBX rest pose.**
///
/// Single-entry dispatch loop. Each bone with an ARP source track is
/// classified via [`rest_sync_strategy`] and routed to the matching
/// handler. Adding a new bone or strategy type happens via the classifier
/// + per-strategy apply function; this function stays unchanged.
///
/// Topological order within each strategy group ensures parent
/// `dst_rest_global` updates propagate to children before the child is
/// processed.
pub fn stage4_sync_rest_to_fbx(
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
    axis_map: &HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
    config: Option<&RetargetConfig>,
) -> (Vec<RestAlignOverride>, Vec<String>) {
    let mut warnings = vec!["[STAGE-4] Sync VRM rest to FBX rest pose".to_string()];

    // Classify each ARP-tracked bone by its rest sync strategy.
    let mut direct_bones: Vec<String> = Vec::new();
    let mut curl_bones: Vec<String> = Vec::new();
    let mut user_calib_bones: Vec<(String, Quat)> = Vec::new();
    for track in bone_tracks {
        match rest_sync_strategy(&track.vrm_bone_name, config) {
            RestSyncStrategy::DirectCopy => direct_bones.push(track.vrm_bone_name.clone()),
            RestSyncStrategy::ScalarCurl => curl_bones.push(track.vrm_bone_name.clone()),
            RestSyncStrategy::UserCalibrated(q) => {
                user_calib_bones.push((track.vrm_bone_name.clone(), q))
            }
            RestSyncStrategy::Skip => {}
        }
    }
    warnings.push(format!(
        "[STAGE-4] classified: {} DirectCopy, {} UserCalibrated, {} ScalarCurl, {} Skip",
        direct_bones.len(),
        user_calib_bones.len(),
        curl_bones.len(),
        bone_tracks.len()
            - direct_bones.len()
            - user_calib_bones.len()
            - curl_bones.len(),
    ));

    let mut all_overrides: Vec<RestAlignOverride> = Vec::new();

    // === Strategy: DirectCopy ===
    let direct_ordered = topo_sort_bones(&direct_bones, parent_map);
    for bone_name in &direct_ordered {
        if let Some(ovr) = apply_direct_copy_one(
            bone_name,
            dst_rest_local,
            dst_rest_global,
            parent_map,
            bone_tracks,
        ) {
            all_overrides.push(ovr);
        }
    }
    warnings.push(format!(
        "[STAGE-4.DirectCopy] {} bones synced",
        direct_ordered.len()
    ));

    // === Strategy: UserCalibrated ===
    let user_calib_names: Vec<String> =
        user_calib_bones.iter().map(|(n, _)| n.clone()).collect();
    let uc_ordered = topo_sort_bones(&user_calib_names, parent_map);
    for bone_name in &uc_ordered {
        let Some((_, delta)) = user_calib_bones.iter().find(|(n, _)| n == bone_name) else {
            continue;
        };
        if let Some(ovr) = apply_user_calibrated_one(
            bone_name,
            *delta,
            dst_rest_local,
            dst_rest_global,
            parent_map,
        ) {
            all_overrides.push(ovr);
        }
    }
    warnings.push(format!(
        "[STAGE-4.UserCalibrated] {} bones synced",
        uc_ordered.len()
    ));

    // === Strategy: ScalarCurl ===
    // Delegates to v5 finger_rest_align which has its own topo walk
    // (segment_depth ordering for finger chains). Uses the axis_map
    // built by Stage 3. Safe to run after DirectCopy because finger
    // bones are leaves of the arm chain — no back-ref to arm rests.
    let curl_overrides = crate::finger_rest_align::apply_in_place(
        axis_map,
        dst_rest_local,
        dst_rest_global,
        parent_map,
    );
    warnings.push(format!(
        "[STAGE-4.ScalarCurl] {} bones synced (avg baseline {:.1}°)",
        curl_overrides.len(),
        if curl_overrides.is_empty() {
            0.0
        } else {
            curl_overrides.iter().map(|o| o.delta_deg).sum::<f32>()
                / curl_overrides.len() as f32
        }
    ));
    all_overrides.extend(curl_overrides);

    (all_overrides, warnings)
}

/// Top-level entry point — calls Stage 3 then Stage 4 in sequence.
///
/// `config` is optional. When `Some` and `config.rest_sync_rules` is non-empty,
/// bone classification is config-driven. When `None` or rules are empty, the
/// hardcoded fallback is used (backward compatible).
pub fn align_full_body_rest(
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
    config: Option<&RetargetConfig>,
) -> (Vec<RestAlignOverride>, Vec<String>) {
    let mut warnings = Vec::new();

    // Stage 3: ARP → VRM structural adapter
    let (axis_map, stage3_warnings) =
        stage3_build_adapter_config(bone_tracks, dst_rest_local, dst_rest_global);
    warnings.extend(stage3_warnings);

    if axis_map.is_empty() {
        warnings.push(
            "[STAGE-3] no finger candidates — skipping Stage 4".to_string(),
        );
        return (Vec::new(), warnings);
    }

    // Stage 4: Sync VRM rest to FBX rest pose
    let (overrides, stage4_warnings) = stage4_sync_rest_to_fbx(
        dst_rest_local,
        dst_rest_global,
        parent_map,
        bone_tracks,
        &axis_map,
        config,
    );
    warnings.extend(stage4_warnings);

    (overrides, warnings)
}

// =====================================================================
// Backwards-compatible aliases for older callers (will be removed once all
// call sites use the new names directly).
// =====================================================================

/// Alias for the old finger-only entry point. Now performs full-body
/// alignment — finger-only is no longer supported.
pub use align_full_body_rest as align_finger_rest;

pub type FingerRestOverride = RestAlignOverride;
```

### `src/adapters/arp_vrm_user_pose.rs` (     120 LOC)

```rust
//! ARP → VRM user-authored rest pose.
//!
//! Unlike automatic rest sync (which reads ARP source bone rotations
//! and tries to project them into VRM bone-local frame), this module
//! stores **hand-authored quats** that the user visually calibrated in
//! the VRM viewer's calibration mode (`C` key).
//!
//! Why this works where automatic ARP-to-VRM translation fails:
//!
//! - ARP bones use Blender convention (bone length = local +Y).
//! - VRM bones use glTF convention (bone length = local +X).
//! - Same quat components interpreted in different local frames produce
//!   different world directions → visible axis mismatch.
//! - Automatic frame-conversion math is error-prone (basis-swap signs,
//!   palm-normal orientation, left/right asymmetry).
//!
//! By having the user **directly construct the rest pose in VRM frame**
//! via the calibration viewer, the resulting quats are already in the
//! correct target frame — no math-based translation required. The
//! user's eyes are the coordinate converter.
//!
//! ## Extending
//!
//! 1. Launch `cargo run --bin bevy-vrm`
//! 2. Load a preset (`F8` / `F9` / `F7`)
//! 3. Press `G` once to enable bone gizmo (shows the selection arrow)
//! 4. Press `C` to enter calibration mode (freezes to T-pose)
//! 5. `Tab` to cycle to the bone you want, rotate with `Q/E/A/D/Z/X`
//! 6. Press `P` to copy the values to clipboard
//! 7. Paste into [`default_pose()`] below
//!
//! ## Scope
//!
//! Current pose targets an "arms down at sides" natural standing rest.
//! This becomes the new VRM baseline — animations then apply delta on
//! top, so any animation whose starting frame is close to arms-down
//! standing will look correct out of the box.

use glam::Quat;

/// Per-bone user-authored rest delta. Applied as
/// `new_dst_rest_local = old_dst_rest_local * delta`.
#[derive(Debug, Clone, Copy)]
pub struct BonePose {
    pub vrm_bone_name: &'static str,
    pub delta: Quat,
}

/// The default user-authored ARP → VRM rest pose (F8 standing @ 3.7s).
/// Captured by manual calibration in the viewer.
///
/// **Shoulder intentionally excluded** — adding shoulder over-rotates
/// the cumulative hand frame and breaks downstream v5 finger curl.
pub const DEFAULT_POSE: &[BonePose] = &[
    // Left arm chain
    BonePose {
        vrm_bone_name: "leftUpperArm",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.6428, 0.7660), // 80° around -Z
    },
    BonePose {
        vrm_bone_name: "leftLowerArm",
        delta: Quat::from_xyzw(0.0000, -0.1305, 0.0000, 0.9914), // 15° around -Y
    },
    // Right arm chain
    BonePose {
        vrm_bone_name: "rightUpperArm",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.6428, 0.7660), // 80° around +Z
    },
    BonePose {
        vrm_bone_name: "rightLowerArm",
        delta: Quat::from_xyzw(0.0000, 0.0872, 0.0000, 0.9962), // 10° around +Y
    },
    // Thumb chain — EXP-004 (2026-04-12). UserCalibrated path activated
    // via arp_vrm_user_pose::lookup. Left-side values calibrated visually
    // in viewer (P→calibration, Tab→thumb bone, Q/W/A/S/Z/X to rotate,
    // C to copy). Right-side values MIRROR-GUESSED by flipping Y/Z signs
    // per existing arm chain convention — verify and retune if incorrect.
    //
    // Background: EXP-003 DirectCopy failed (thumb → elbow). EXP-004
    // activates authored-offset path per original TODO in rest_sync_strategy.
    BonePose {
        vrm_bone_name: "leftThumbMetacarpal",
        delta: Quat::from_xyzw(0.0000, -0.0872, 0.0000, 0.9962), // -10° Y
    },
    BonePose {
        vrm_bone_name: "leftThumbProximal",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.2164, 0.9763), // -25° Z
    },
    BonePose {
        vrm_bone_name: "leftThumbDistal",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.2164, 0.9763), // -25° Z
    },
    BonePose {
        vrm_bone_name: "rightThumbMetacarpal",
        delta: Quat::from_xyzw(0.0000, 0.0872, 0.0000, 0.9962), // +10° Y (mirror guess)
    },
    BonePose {
        vrm_bone_name: "rightThumbProximal",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.2164, 0.9763), // +25° Z (mirror guess)
    },
    BonePose {
        vrm_bone_name: "rightThumbDistal",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.2164, 0.9763), // +25° Z (mirror guess)
    },
    // Hand wrist twist (EXP-005 hardcoded -55°/+55°) was promoted to dynamic
    // per-frame FBX right-wrist-delta transfer in src/retarget.rs (EXP-006).
    // Removing the static entries lets the dynamic pass measure FBX wrist
    // rotation each frame and apply that magnitude — matching the animation
    // motion instead of a fixed offset.
];

/// Look up a user-authored delta by VRM bone name. Returns `None` if
/// the bone is not in the pose (which means: use a different strategy
/// or skip).
pub fn lookup(vrm_bone_name: &str) -> Option<Quat> {
    DEFAULT_POSE
        .iter()
        .find(|p| p.vrm_bone_name == vrm_bone_name)
        .map(|p| p.delta)
}
```

### `src/adapters/mod.rs` (      14 LOC)

```rust
//! Rig-pair adapters: pre-retarget rest pose alignment between specific
//! source/target rig combinations.
//!
//! Adapters are NOT part of the generic retarget pipeline. They live as
//! pure init-time functions that mutate the destination rest pose before
//! `Retargeter::new` builds its per-bone `BoneData`. This keeps the delta
//! retarget formula completely untouched and lets us isolate rig-specific
//! quirks (e.g., ARP fingers baked into a fist while VRM fingers are flat)
//! to the boundary instead of leaking into core math.
//!
//! Each adapter is feature-gated by an explicit boolean. Default = off.

pub mod arp_vrm;
pub mod arp_vrm_user_pose;
```

### `src/finger_axis_map.rs` (     307 LOC)

```rust
//! Stage 1: Finger axis matching.
//!
//! Per-bone correspondence between ARP curl axis (in FBX bone-local frame)
//! and VRM curl axis (in VRM bone-local frame). ARP and VRM have different
//! bone-internal axis conventions:
//!
//!   ARP : bone length = +Y (Blender convention), curl axis ≈ ±X
//!   VRM : bone length = ±X (dump-vrm-transforms findings), curl axis ≈ ±Z
//!
//! This module derives both per-bone and outputs an axis map that Stage 2
//! (`finger_rest_align`) consumes.
//!
//! Key insight from Phase 0: ARP loose-fist rest pose IS the curl rotation,
//! so `rest_local.to_axis_angle()` gives us the curl axis directly. No need
//! for animation-based detection.
//!
//! Thumb is excluded from this v5 module — `c_thumb*` bones have multi-axis
//! rest (carpometacarpal coupling) and need a different approach. They are
//! left to existing pipeline or hand-authored offsets.

use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::types::BoneTrack;

/// Per-bone axis correspondence + baseline curl scalar.
///
/// `arp_baseline_curl_rad` is extracted here (not in Stage 2) because it's
/// derived from the same `to_axis_angle()` decomposition as the axis itself,
/// so doing it twice would waste work.
#[derive(Debug, Clone)]
pub struct FingerAxisEntry {
    pub vrm_bone_name: String,
    /// ARP curl axis in FBX bone-local frame (unit vector).
    pub arp_axis_local: Vec3,
    /// VRM curl axis in VRM bone-local frame (unit vector).
    pub vrm_axis_local: Vec3,
    /// Magnitude of ARP rest_local around `arp_axis_local`. This is the
    /// per-FBX baseline curl that Stage 2 injects into the VRM rest.
    /// Positive scalar (radians).
    pub arp_baseline_curl_rad: f32,
}

/// Returns true if the VRM bone name belongs to a non-thumb finger bone
/// that this module handles. Thumb bones are excluded (multi-axis rest).
pub fn is_handled_finger(vrm_bone_name: &str) -> bool {
    let lower = vrm_bone_name.to_lowercase();
    if lower.contains("thumb") {
        return false;
    }
    ["index", "middle", "ring", "little", "pinky"]
        .iter()
        .any(|k| lower.contains(k))
}

/// Returns true for any finger bone (incl. thumb). Used for diagnostics
/// and so the caller can route thumbs to a different code path.
pub fn is_any_finger(vrm_bone_name: &str) -> bool {
    let lower = vrm_bone_name.to_lowercase();
    ["thumb", "index", "middle", "ring", "little", "pinky"]
        .iter()
        .any(|k| lower.contains(k))
}

/// Derive ARP curl axis + baseline curl from a BoneTrack's rest pose.
///
/// The full FBX local rest is recoverable from the BoneTrack as
/// `inv(src_parent_global_rest) * src_global_rest`. Its axis-angle
/// decomposition gives us:
///   - axis: the curl rotation axis in bone-local frame (we want this)
///   - angle: the curl magnitude (we want this too — saves redundant work)
///
/// If the rest is near-identity (`< 1°`), the axis is undefined; we return
/// `Vec3::X` as a safe fallback (will be skipped by Stage 2 anyway because
/// baseline ≈ 0).
fn derive_arp_axis_and_baseline(track: &BoneTrack) -> (Vec3, f32) {
    let full_local_rest = track.src_parent_global_rest.inverse() * track.src_global_rest;
    let (axis, angle) = full_local_rest.to_axis_angle();
    if angle.abs() < 1.0_f32.to_radians() {
        return (Vec3::X, 0.0);
    }
    (axis.normalize_or_zero(), angle.abs())
}

/// Derive VRM curl axis for a non-thumb finger bone.
///
/// From `dump-vrm-transforms` findings:
///   - Left fingers : bone length axis = +X (rest_local ≈ identity)
///   - Right fingers: bone length axis = -X (mirrored)
///
/// Curl axis must be perpendicular to bone length AND oriented so that
/// positive rotation curls the finger toward the **palm** (inward, not
/// the back of the hand).
///
/// First viewer test (`+Z` left / `-Z` right) showed fingers curling toward
/// the **back of the hand** — correct axis, wrong sign. Flipped here.
pub fn vrm_curl_axis_for(vrm_bone_name: &str) -> Vec3 {
    let is_right = vrm_bone_name.to_lowercase().starts_with("right")
        || vrm_bone_name.to_lowercase().contains("right");
    if is_right {
        Vec3::new(0.0, 0.0, 1.0)
    } else {
        Vec3::new(0.0, 0.0, -1.0)
    }
}

/// Derive VRM curl axis via Option B: transport the ARP curl axis through
/// **world space** using both rigs' global rest rotations.
///
/// Formula:
///   src_global_rest * arp_axis_local  →  ARP curl axis in world frame
///   dst_rest_global.inverse() * (...) →  same physical direction expressed
///                                        in VRM bone-local frame
///
/// An earlier version used `inv(dst_rest_local) * src_rest_local * arp_axis`,
/// which silently collapsed to `arp_axis` because finger-level local rests
/// are near-identity in both rigs. That dropped the ARP (Blender, bone length
/// = +Y) vs VRM (glTF, bone length = +X) convention difference, which lives
/// in the accumulated world rotation of the parent chain — not in any local
/// rest. This world-space form captures it.
fn derive_vrm_axis_option_b(
    src_global_rest: Quat,
    dst_rest_global: Quat,
    arp_axis_local: Vec3,
) -> Vec3 {
    let arp_axis_world = src_global_rest * arp_axis_local;
    let vrm_local = dst_rest_global.inverse() * arp_axis_world;
    vrm_local.normalize_or_zero()
}

/// Angular error between two unit vectors, in degrees. Returns 0 if either
/// vector is zero-length.
fn axis_angle_error_deg(a: Vec3, b: Vec3) -> f32 {
    if a.length_squared() < 1e-8 || b.length_squared() < 1e-8 {
        return 0.0;
    }
    a.normalize().dot(b.normalize()).clamp(-1.0, 1.0).acos().to_degrees()
}

/// Stage 1 entry point. Walks every BoneTrack, builds per-bone axis +
/// baseline curl entries for non-thumb fingers. Also emits a diagnostic
/// log that dry-runs Option B (rest-delta axis derivation) on **every**
/// finger bone, including thumbs, for post-session analysis.
///
/// Returns `(axis_map, diagnostics)`. The diagnostics Vec is a set of
/// human-readable log lines the adapter appends to its warnings.
pub fn compute_axis_map(
    bone_tracks: &[BoneTrack],
    dst_rest_local: &HashMap<String, Quat>,
    dst_rest_global: &HashMap<String, Quat>,
) -> (HashMap<String, FingerAxisEntry>, Vec<String>) {
    let mut map = HashMap::new();
    let mut diagnostics: Vec<String> = Vec::new();

    diagnostics.push(
        "[B-DIAG] Option B dry-run: derived = inv(dst_rest_global) * src_global_rest * arp_axis"
            .to_string(),
    );
    diagnostics.push(
        "[B-DIAG] bone                         arp_axis            hard_axis  derived_axis         err°"
            .to_string(),
    );

    // Stable order for diff-friendly output.
    let mut sorted_tracks: Vec<&BoneTrack> = bone_tracks
        .iter()
        .filter(|t| is_any_finger(&t.vrm_bone_name))
        .collect();
    sorted_tracks.sort_by(|a, b| a.vrm_bone_name.cmp(&b.vrm_bone_name));

    let mut nonthumb_errors: Vec<f32> = Vec::new();
    let mut nonthumb_worst: f32 = 0.0;
    let mut nonthumb_worst_name = String::new();

    for track in &sorted_tracks {
        let name = &track.vrm_bone_name;

        let (arp_axis, baseline_rad) = derive_arp_axis_and_baseline(track);
        let src_global = track.src_global_rest;
        let dst_global = dst_rest_global.get(name).copied().unwrap_or(Quat::IDENTITY);
        let derived = derive_vrm_axis_option_b(src_global, dst_global, arp_axis);
        let _ = dst_rest_local; // retained in signature for future hardcode path

        let is_thumb = name.to_lowercase().contains("thumb");
        // VRM curl axis in finger's local frame. Finger is a child of hand;
        // when Stage H rotates the hand rest, the finger's local frame rotates
        // WITH it, so local -Z/+Z automatically maps to the NEW palm direction
        // in world. No compensation needed.
        let hard_axis = if is_thumb {
            Vec3::ZERO
        } else {
            vrm_curl_axis_for(name)
        };
        let err_deg = if is_thumb {
            f32::NAN
        } else {
            axis_angle_error_deg(hard_axis, derived)
        };

        diagnostics.push(format!(
            "[B-DIAG] {:<28} [{:>+5.2},{:>+5.2},{:>+5.2}] [{:>+5.2},{:>+5.2},{:>+5.2}] [{:>+5.2},{:>+5.2},{:>+5.2}] {:>6}",
            name,
            arp_axis.x, arp_axis.y, arp_axis.z,
            hard_axis.x, hard_axis.y, hard_axis.z,
            derived.x, derived.y, derived.z,
            if err_deg.is_nan() { "n/a".to_string() } else { format!("{:.1}", err_deg) },
        ));

        if !is_thumb && !err_deg.is_nan() {
            nonthumb_errors.push(err_deg);
            if err_deg > nonthumb_worst {
                nonthumb_worst = err_deg;
                nonthumb_worst_name = name.clone();
            }
        }

        // Only non-thumb bones populate the axis_map that Stage 2 consumes.
        if is_handled_finger(name) {
            map.insert(
                name.clone(),
                FingerAxisEntry {
                    vrm_bone_name: name.clone(),
                    arp_axis_local: arp_axis,
                    vrm_axis_local: hard_axis,
                    arp_baseline_curl_rad: baseline_rad,
                },
            );
        }
    }

    // Hand bone diagnostic: measure the ARP vs VRM bind-orientation delta
    // for leftHand/rightHand. Reports BOTH:
    //   - raw   : delta in FBX native frame (Z-up for Maya/UE, Y-up for Blender)
    //   - yup   : delta after coord_rot = Rx(-π/2) applied to src (Z-up→Y-up)
    // If the FBX is Blender-sourced, the two should match.
    // If non-Blender and `yup` ≈ 0°, the 170° was a coord-system mismatch
    // and the wrist is actually aligned.
    diagnostics.push(String::new());
    diagnostics.push(
        "[HAND-DIAG] wrist rest-orientation delta: ARP vs VRM bind".to_string(),
    );
    diagnostics.push(
        "[HAND-DIAG] bone       |dst|°  |src|°  raw°    yup°    yup_axis".to_string(),
    );
    let coord_rot = Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2);
    let coord_rot_inv = coord_rot.inverse();
    for hand_name in &["leftHand", "rightHand"] {
        let dst_g = dst_rest_global
            .get(*hand_name)
            .copied()
            .unwrap_or(Quat::IDENTITY);
        let src_g = bone_tracks
            .iter()
            .find(|t| t.vrm_bone_name == *hand_name)
            .map(|t| t.src_global_rest)
            .unwrap_or(Quat::IDENTITY);
        let src_g_yup = coord_rot * src_g * coord_rot_inv;

        let angle = |q: Quat| -> (Vec3, f32) {
            let c = if q.w < 0.0 { -q } else { q };
            let (ax, an) = c.to_axis_angle();
            (ax, an.to_degrees())
        };
        let (_, raw_deg) = angle((src_g * dst_g.inverse()).normalize());
        let (yup_axis, yup_deg) = angle((src_g_yup * dst_g.inverse()).normalize());

        diagnostics.push(format!(
            "[HAND-DIAG] {:<10} {:>6.1}  {:>6.1}  {:>6.1}  {:>6.1}  [{:>+5.2},{:>+5.2},{:>+5.2}]",
            hand_name,
            dst_g.angle_between(Quat::IDENTITY).to_degrees(),
            src_g.angle_between(Quat::IDENTITY).to_degrees(),
            raw_deg,
            yup_deg,
            yup_axis.x, yup_axis.y, yup_axis.z,
        ));
    }
    diagnostics.push(String::new());

    if !nonthumb_errors.is_empty() {
        let mean = nonthumb_errors.iter().sum::<f32>() / nonthumb_errors.len() as f32;
        diagnostics.push(format!(
            "[B-DIAG] non-thumb summary: n={} mean_err={:.2}° max_err={:.2}° @ {}",
            nonthumb_errors.len(),
            mean,
            nonthumb_worst,
            nonthumb_worst_name,
        ));
        diagnostics.push(format!(
            "[B-DIAG] gate (5° threshold): {}",
            if nonthumb_worst <= 5.0 {
                "PASS — Option B candidate for post-wrist work"
            } else if nonthumb_worst <= 15.0 {
                "SOFT-FAIL — above 5° but within wrist-error budget; re-check after task #2"
            } else {
                "HARD-FAIL — kill Option B"
            }
        ));
    } else {
        diagnostics.push(
            "[B-DIAG] no non-thumb finger tracks found — cannot evaluate gate".to_string(),
        );
    }

    (map, diagnostics)
}

// Tests moved to crates/humanoid_retarget/tests/finger_axis_map.rs
```

### `src/topo.rs` (      16 LOC)

```rust
use std::collections::HashMap;

pub fn build_vrm_topo_order(parent_map: &HashMap<String, String>) -> Vec<String> {
    let mut all_bones: std::collections::HashSet<&str> = parent_map.keys().map(|s| s.as_str()).collect();
    for parent in parent_map.values() { all_bones.insert(parent); }
    let mut order = Vec::new();
    let mut remaining: std::collections::HashSet<&str> = all_bones;
    loop {
        let ready: Vec<&str> = remaining.iter()
            .filter(|&&name| parent_map.get(name).map_or(true, |p| !remaining.contains(p.as_str())))
            .copied().collect();
        if ready.is_empty() { break; }
        for name in &ready { remaining.remove(*name); order.push(name.to_string()); }
    }
    order
}
```

### `src/mapping.rs` (     479 LOC)

```rust
use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::config::RetargetConfig;
use crate::fbx::{FbxBone, SourceAsset};
use crate::source_anim::{SourceAnimBody, SourceAnimFacial};
use crate::vrm_compat::VrmVersion;
use crate::{BoneTrack, ExpressionTrack, RetargetError, MappedAnimation};

/// VRM virtual root bone name (matches bevy_vrm1's Vrm::ROOT_BONE)
const VRM_ROOT_BONE: &str = "VRMC_vrm.root_bone";

/// 2단계: 손가락 global_rest를 재계산 (parent × local_rest). 체인 순서 보존 위해 topo.
fn recompute_finger_globals(
    global_rest: &mut HashMap<String, Quat>,
    local_rest: &HashMap<String, Quat>,
    bones: &HashMap<String, FbxBone>,
    is_finger: &dyn Fn(&str) -> bool,
) {
    let finger_names: Vec<String> = bones
        .keys()
        .filter(|n| is_finger(n))
        .cloned()
        .collect();
    let mut pending: std::collections::HashSet<String> = finger_names.into_iter().collect();
    loop {
        let ready: Vec<String> = pending
            .iter()
            .filter(|name| {
                let bone = &bones[*name];
                bone.parent.as_ref().is_none_or(|p| !pending.contains(p))
            })
            .cloned()
            .collect();
        if ready.is_empty() {
            break;
        }
        for name in ready {
            let bone = &bones[&name];
            let parent_global = bone
                .parent
                .as_ref()
                .and_then(|p| global_rest.get(p))
                .copied()
                .unwrap_or(Quat::IDENTITY);
            let local = local_rest.get(&name).copied().unwrap_or(Quat::IDENTITY);
            global_rest.insert(name.clone(), parent_global * local);
            pending.remove(&name);
        }
    }
}

/// A안: ground truth override — Deformer::Cluster.TransformLink이 있는 본은
/// Euler 재구성 결과를 bind pose rotation으로 교체. global_rest는 본별 절대값이라
/// 개별 덮어쓰기가 안전 (children도 자신의 bind_world로 독립 해결됨).
/// Rationale: docs/retarget-learnings.md 2026-04-12 — 팔/손 체인 Δ 50~170°
/// 증상의 근본 원인이 PreRot * LclRest 수동 재구성의 부호/순서 버그로 확정됨.
///
/// 손가락 제외 + 재계산: bind와 rest의 축이 180° 다름 (dump에서 Δ 120°+ 확인).
/// 기존 v5 scalar curl + AXIS_CORRECTION이 rest axis 기준으로 튜닝돼 있어
/// 손가락만 bind로 바꾸면 보정이 역방향 작용. 하지만 단순 제외만 하면
/// hand는 bind인데 finger의 global_rest는 옛 Euler hand 기준이라
/// hand-local frame이 깨지고 첫 마디가 공중으로 날아감 — 계층 경계 불일치.
/// 해결: 손가락의 global_rest = bind(parent) * local_rest(finger)로 재계산.
/// 이러면 finger의 hand-local은 원래와 동일해 v5 curl이 정상 작동.
fn apply_bind_overrides_view(
    global_rest: &mut HashMap<String, Quat>,
    local_rest: &HashMap<String, Quat>,
    body: &SourceAnimBody<'_>,
) {
    let is_finger_name = |n: &str| -> bool {
        let l = n.to_lowercase();
        l.contains("index")
            || l.contains("middle")
            || l.contains("ring")
            || l.contains("pinky")
            || l.contains("thumb")
    };

    // 1단계: 손가락 아닌 본만 bind override.
    for (name, bind_m) in body.bind_world {
        if is_finger_name(name) {
            continue;
        }
        let (_scale, bind_rot, _trans) = bind_m.to_scale_rotation_translation();
        global_rest.insert(name.clone(), bind_rot);
    }

    recompute_finger_globals(global_rest, local_rest, body.bones, &is_finger_name);
}

fn build_prefix_map_view(
    config: &RetargetConfig,
    body: &SourceAnimBody<'_>,
) -> HashMap<String, String> {
    let mut map = HashMap::new();

    let mut config_bones: Vec<&str> = Vec::new();
    for src in config.direct_map.keys() {
        config_bones.push(src);
    }
    for bones in config.accumulate.values() {
        for b in bones {
            config_bones.push(b);
        }
    }
    if let Some(ref rb) = config.root_bone {
        config_bones.push(rb);
    }

    for &cfg_bone in &config_bones {
        if body.tracks.contains_key(cfg_bone) || body.bones.contains_key(cfg_bone) {
            map.insert(cfg_bone.to_string(), cfg_bone.to_string());
            continue;
        }
        for prefix in &config.source_prefix {
            let prefixed = format!("{}{}", prefix, cfg_bone);
            if body.tracks.contains_key(&prefixed) || body.bones.contains_key(&prefixed) {
                map.insert(cfg_bone.to_string(), prefixed);
                break;
            }
        }
    }

    map
}

/// Convert FBX translation to glTF Y-up (meters).
/// UE/Maya: Z-up cm → (x, z, -y) * 0.01
/// Blender: root bone -90°X already handles Z→Y in FK, just pass through.
fn fbx_to_gltf_translation(v: Vec3, is_blender: bool) -> Vec3 {
    if is_blender {
        // Blender FBX: Z-up meters → Y-up meters (no cm→m needed)
        Vec3::new(v.x, v.z, -v.y)
    } else {
        // UE/Maya: Z-up cm → Y-up meters
        Vec3::new(v.x * 0.01, v.z * 0.01, -v.y * 0.01)
    }
}

/// Body retargeting: produces VRM bone tracks from a [`SourceAnimBody`] view.
///
/// shotloom port path: this is what `shotloom-t2m` (or whichever crate owns
/// body animation) calls. Facial blendshapes go through
/// [`retarget_facial`]; the two are independent.
pub fn retarget_body(
    body: &SourceAnimBody<'_>,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> Result<Vec<BoneTrack>, RetargetError> {
    let version_key = vrm_version.config_key();
    let frame_count = body.frame_count;

    let prefix_map = build_prefix_map_view(config, body);

    let timestamps: Vec<f32> = (0..frame_count).map(|i| i as f32 / 30.0).collect();

    let mut result_tracks: Vec<BoneTrack> = Vec::new();

    let resolve = |cfg_name: &str| -> Option<&String> { prefix_map.get(cfg_name) };

    // Blender FBX: PreRotation is identity, bone orientation baked into rest_rotation_euler.
    // Use rest_rotation_euler as src_local_rest, convert animation to delta-from-rest.
    let is_blender = if config.source_type != crate::config::FbxSourceType::Auto {
        config.source_type == crate::config::FbxSourceType::Blender
    } else {
        body.detected_source_type == crate::config::FbxSourceType::Blender
    };

    // Compute global rest rotation for each FBX bone
    // Full local rest = PreRotation * Lcl_Rotation_rest (both contribute to bind pose)
    let mut global_rest: HashMap<String, Quat> = HashMap::new();
    let mut local_rest: HashMap<String, Quat> = HashMap::new();
    // Topological order: process parents first
    let mut to_process: Vec<String> = body.bones.keys().cloned().collect();
    let mut processed = std::collections::HashSet::new();
    while !to_process.is_empty() {
        let mut progress = false;
        to_process.retain(|name| {
            let bone = &body.bones[name];
            let parent_done = bone.parent.as_ref().is_none_or(|p| processed.contains(p));
            if parent_done {
                let parent_global = bone
                    .parent
                    .as_ref()
                    .and_then(|p| global_rest.get(p))
                    .copied()
                    .unwrap_or(Quat::IDENTITY);
                let lcl_rot_rest =
                    crate::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
                let full_local = bone.pre_rotation * lcl_rot_rest;
                local_rest.insert(name.clone(), full_local);
                global_rest.insert(name.clone(), parent_global * full_local);
                processed.insert(name.clone());
                progress = true;
                false // remove from to_process
            } else {
                true // keep
            }
        });
        if !progress {
            break;
        }
    }

    apply_bind_overrides_view(&mut global_rest, &local_rest, body);

    // 0. Root bone → VRM virtual root bone (translation + rotation)
    if let Some(ref root_name) = config.root_bone
        && let Some(fbx_name) = resolve(root_name)
        && let Some(track) = body.tracks.get(fbx_name)
    {
        let bone = body.bones.get(fbx_name);
        let lcl_rot_rest = bone
            .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
            .unwrap_or(Quat::IDENTITY);
        let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
        let src_local_rest = if is_blender {
            // Include PreRotation (root has -90°X; non-root is identity).
            // Delta uses lcl_rot_rest only, so full_anim = pre_rot * anim.
            pre_rot * lcl_rot_rest
        } else {
            pre_rot
        };
        let rotations = if is_blender {
            let rest_inv = lcl_rot_rest.inverse();
            track.rotations.iter().map(|&r| rest_inv * r).collect()
        } else {
            track.rotations.clone()
        };

        // Root translations: UE Z-up → VRM Y-up, cm → m
        let translations: Vec<Vec3> = track
            .translations
            .iter()
            .map(|&t| fbx_to_gltf_translation(t, is_blender))
            .collect();

        let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);
        let src_parent_global_rest = bone
            .and_then(|b| b.parent.as_ref())
            .and_then(|p| global_rest.get(p))
            .copied()
            .unwrap_or(Quat::IDENTITY);
        result_tracks.push(BoneTrack {
            vrm_bone_name: VRM_ROOT_BONE.to_string(),
            src_bone_name: fbx_name.clone(),
            timestamps: timestamps.clone(),
            rotations,
            translations: Some(translations),
            src_local_rest,
            src_global_rest,
            src_parent_global_rest,
        });
    }

    // 1. Direct mapping — raw deltas
    for (src_bone, vrm_bone_default) in &config.direct_map {
        let vrm_bone = config
            .resolve_vrm_bone(src_bone, version_key)
            .unwrap_or_else(|| vrm_bone_default.clone());

        if config.should_ignore(src_bone) {
            continue;
        }

        let fbx_name = match resolve(src_bone) {
            Some(n) => n,
            None => continue,
        };

        if let Some(track) = body.tracks.get(fbx_name) {
            let bone = body.bones.get(fbx_name);
            let lcl_rot_rest = bone
                .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
                .unwrap_or(Quat::IDENTITY);
            let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
            let src_local_rest = if is_blender {
                pre_rot * lcl_rot_rest
            } else {
                pre_rot
            };
            let rotations = if is_blender {
                let rest_inv = lcl_rot_rest.inverse();
                track.rotations.iter().map(|&r| rest_inv * r).collect()
            } else {
                track.rotations.clone()
            };

            let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);

            // For hips: include pelvis translation (converted to glTF Y-up)
            let translations = if vrm_bone == "hips" {
                let bone_rest_t = bone.map(|b| b.rest_translation).unwrap_or(Vec3::ZERO);
                Some(
                    track
                        .translations
                        .iter()
                        .map(|&t| {
                            // Delta from rest position, converted to glTF Y-up
                            let delta_t = t - bone_rest_t;
                            fbx_to_gltf_translation(delta_t, is_blender)
                        })
                        .collect(),
                )
            } else {
                None
            };

            let src_parent_global_rest = bone
                .and_then(|b| b.parent.as_ref())
                .and_then(|p| global_rest.get(p))
                .copied()
                .unwrap_or(Quat::IDENTITY);
            result_tracks.push(BoneTrack {
                vrm_bone_name: vrm_bone,
                src_bone_name: fbx_name.clone(),
                timestamps: timestamps.clone(),
                rotations,
                translations,
                src_local_rest,
                src_global_rest,
                src_parent_global_rest,
                });
        }
    }

    // 2. Accumulate chains (spine, neck, root+pelvis)
    for (vrm_bone, src_bones) in &config.accumulate {
        let mut accumulated = vec![Quat::IDENTITY; frame_count];
        let mut any_matched = false;
        let mut first_src_rest = Quat::IDENTITY;
        let is_hips = vrm_bone == "hips";

        for (bone_idx, cfg_name) in src_bones.iter().enumerate() {
            let fbx_name = match resolve(cfg_name) {
                Some(n) => n,
                None => continue,
            };

            if let Some(track) = body.tracks.get(fbx_name) {
                let bone = body.bones.get(fbx_name);
                let lcl_rot_rest = bone
                    .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
                    .unwrap_or(Quat::IDENTITY);
                if bone_idx == 0 {
                    let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
                    first_src_rest = if is_blender {
                        pre_rot * lcl_rot_rest
                    } else {
                        pre_rot
                    };
                }
                any_matched = true;

                let rest_inv = lcl_rot_rest.inverse();
                for (i, &r) in track.rotations.iter().enumerate() {
                    if i < frame_count {
                        let rot = if is_blender { rest_inv * r } else { r };
                        accumulated[i] *= rot;
                    }
                }
            }
        }

        if !any_matched {
            continue;
        }

        // Use LAST bone's global for src_global_rest (accumulated chain endpoint)
        // Use FIRST bone's parent for src_parent_global_rest (chain entry point)
        let first_fbx = src_bones.first().and_then(|n| resolve(n));
        let last_fbx = src_bones.iter().rev().find_map(|n| resolve(n));
        let src_global_rest = last_fbx
            .and_then(|n| global_rest.get(n))
            .copied()
            .unwrap_or(first_src_rest);
        let src_parent_global_rest = first_fbx
            .and_then(|n| body.bones.get(n.as_str()))
            .and_then(|b| b.parent.as_ref())
            .and_then(|p| global_rest.get(p))
            .copied()
            .unwrap_or(Quat::IDENTITY);
        // For hips accumulate: include last bone's (pelvis) translation
        let translations = if is_hips {
            let last_cfg = src_bones.last();
            let last_fbx = last_cfg.and_then(|n| resolve(n));
            last_fbx.and_then(|name| {
                let bone = body.bones.get(name)?;
                let track = body.tracks.get(name)?;
                let bone_rest_t = bone.rest_translation;
                Some(
                    track
                        .translations
                        .iter()
                        .map(|&t| {
                            let delta_t = t - bone_rest_t;
                            fbx_to_gltf_translation(delta_t, is_blender)
                        })
                        .collect(),
                )
            })
        } else {
            None
        };

        // Use last resolved FBX bone name for world rotation lookup
        let acc_src_name = last_fbx.cloned().unwrap_or_default();
        result_tracks.push(BoneTrack {
            vrm_bone_name: vrm_bone.clone(),
            src_bone_name: acc_src_name,
            timestamps: timestamps.clone(),
            rotations: accumulated,
            translations,
            src_local_rest: first_src_rest,
            src_global_rest,
            src_parent_global_rest,
        });
    }

    Ok(result_tracks)
}

/// Facial retargeting: produces VRM expression tracks from a
/// [`SourceAnimFacial`] view.
///
/// shotloom port path: this is what the facial expression handler crate
/// (or in bevy-vrm's case, today's same crate) calls. Body skeletal data
/// is handled separately by [`retarget_body`].
pub fn retarget_facial(
    facial: &SourceAnimFacial<'_>,
    config: &RetargetConfig,
) -> Vec<ExpressionTrack> {
    let mut expression_tracks: Vec<ExpressionTrack> = Vec::new();
    for (fbx_channel, weights) in facial.blend_shape_tracks {
        if let Some(vrm_expr) = config.expression_map.get(fbx_channel) {
            expression_tracks.push(ExpressionTrack {
                vrm_expression_name: vrm_expr.clone(),
                weights: weights.clone(),
            });
        }
    }
    expression_tracks
}

/// Combined body + facial retarget — backwards-compatible wrapper.
///
/// New callers that own a `SourceAsset` and want both body and facial
/// tracks in one [`MappedAnimation`] use this. Callers that need only
/// one half (e.g. shotloom-side body-only or facial-only consumers) call
/// [`retarget_body`] / [`retarget_facial`] directly with the appropriate
/// view from `SourceAnimBody::from_source_asset` /
/// `SourceAnimFacial::from_source_asset`.
pub fn retarget(
    fbx: &SourceAsset,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> Result<MappedAnimation, RetargetError> {
    let body = SourceAnimBody::from_source_asset(fbx);
    let facial = SourceAnimFacial::from_source_asset(fbx);

    let bone_tracks = retarget_body(&body, config, vrm_version)?;
    let expression_tracks = retarget_facial(&facial, config);

    let source_resolved = if config.source_type != crate::config::FbxSourceType::Auto {
        config.source_type
    } else {
        fbx.detected_source_type
    };

    Ok(MappedAnimation {
        name: config.name.clone(),
        duration_secs: fbx.duration,
        bone_tracks,
        expression_tracks,
        source_detected: fbx.detected_source_type,
        source_resolved,
    })
}
```

### `src/postprocess/wrist_twist.rs` (     111 LOC)

```rust
//! Wrist twist transfer — EXP-006.
//!
//! Reads each FBX wrist's per-frame forearm-relative rotation, extracts
//! the twist component around the forearm bone-length axis, and applies
//! that scalar magnitude as a local-X rotation on the matching VRM hand
//! bone. Each side reads its own FBX track.
//!
//! Replaces the prior EXP-005 hardcoded `±55°` UserCalibrated entries:
//! that approach worked for one calibrated frame but didn't track the
//! animation. EXP-006 follows the FBX wrist motion frame-by-frame.
//!
//! ## Math
//!
//! For each frame and each hand:
//!
//! ```text
//!     fa_w = coord * fbx_forearm_rot[f] * coord_inv          // FBX Z-up → Y-up
//!     fh_w = coord * fbx_hand_rot[f]    * coord_inv
//!     fbx_wrist_delta = fa_w.inverse() * fh_w                // forearm-relative
//!     (_swing, twist) = swing_twist_decompose(delta, +Y)     // 1-DOF twist
//!     (axis, angle) = twist.to_axis_angle()
//!     signed_angle = if axis.y >= 0 { angle } else { -angle }
//!     extra = Quat::from_rotation_x(-signed_angle)            // VRM hand local X
//!     vrm_hand_rot[f] = vrm_hand_rot[f] * extra
//! ```
//!
//! The `-signed_angle` sign matches the user's calibrated direction
//! convention (visual baseline established in calibration mode).
//!
//! ## Coordinates
//!
//! `coord = Quat::from_rotation_x(-π/2)` rotates FBX Z-up axes to glTF
//! Y-up axes — the same conversion the viewer's `[WRIST-ROT]` diagnostic
//! applies to FBX bone rotations before measurement.
//!
//! ## Limits
//!
//! - **Twist only** — swing (the 2-DOF direction component) is left to
//!   the upstream retargeter / `Pass 2` direction correction. This pass
//!   only touches the 1-DOF rotation around the bone-length axis.
//! - **Skips when no FBX skeleton** — caller passes
//!   `Option<&FbxSkeletonFrames>`; on `None` the function returns
//!   without applying anything.
//! - **Both hands by default** — operates on `leftHand` and `rightHand`
//!   if both have matching FBX tracks via `vrm_to_fbx`.
//!
//! ## Diagnostics
//!
//! Returns log lines describing per-side max applied magnitude:
//!
//! ```text
//!     [postprocess::wrist_twist] leftHand: 142 frames, max=42.3°
//!     [postprocess::wrist_twist] rightHand: 142 frames, max=51.7°
//! ```

use std::collections::HashMap;

use glam::{Quat, Vec3};

use crate::fbx::FbxSkeletonFrames;
use crate::types::TargetAnimation;

/// Apply per-frame FBX wrist twist transfer to both hands.
///
/// Reads `fbx_forearm` / `fbx_hand` rotation tracks from `fbx_skel`,
/// resolved through `vrm_to_fbx`. Mutates the matching hand bone tracks
/// in `anim` in place. Returns one log line per hand processed.
pub fn apply_wrist_twist_transfer(
    anim: &mut TargetAnimation,
    fbx_skel: &FbxSkeletonFrames,
    vrm_to_fbx: &HashMap<String, String>,
) -> Vec<String> {
    let coord = Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2);
    let coord_inv = coord.inverse();

    let sides: [(&str, &str); 2] = [
        ("leftLowerArm", "leftHand"),
        ("rightLowerArm", "rightHand"),
    ];

    let mut logs = Vec::new();
    for (vrm_forearm, vrm_hand) in sides {
        let Some(fak) = vrm_to_fbx.get(vrm_forearm).map(|s| s.as_str()) else { continue };
        let Some(fhk) = vrm_to_fbx.get(vrm_hand).map(|s| s.as_str()) else { continue };
        let Some(fars) = fbx_skel.bone_rotations.get(fak) else { continue };
        let Some(fhrs) = fbx_skel.bone_rotations.get(fhk) else { continue };
        let Some(rh) = anim.bones.iter_mut().find(|b| b.vrm_bone_name == vrm_hand) else { continue };

        let n = rh.rotations.len().min(fars.len()).min(fhrs.len());
        let mut max_applied_deg = 0.0f32;
        for f in 0..n {
            let fa_w = coord * fars[f] * coord_inv;
            let fh_w = coord * fhrs[f] * coord_inv;
            let fbx_wrist_delta = (fa_w.inverse() * fh_w).normalize();
            let (_swing, twist) = crate::types::swing_twist_decompose(fbx_wrist_delta, Vec3::Y);
            let (twist_axis, twist_angle) = twist.to_axis_angle();
            let signed = if twist_axis.y >= 0.0 { twist_angle } else { -twist_angle };
            let extra = Quat::from_rotation_x(-signed);
            rh.rotations[f] = (rh.rotations[f] * extra).normalize();
            let mag_deg = signed.abs().to_degrees();
            if mag_deg > max_applied_deg {
                max_applied_deg = mag_deg;
            }
        }
        logs.push(format!(
            "[postprocess::wrist_twist] {}: {} frames, max={:.1}°",
            vrm_hand, n, max_applied_deg
        ));
    }
    logs
}
```

### `src/postprocess/mod.rs` (      38 LOC)

```rust
//! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
//! after the retargeter has produced it.
//!
//! Each post-process step is a free function that mutates the animation
//! in place and returns log lines describing what it did. No traits, no
//! shared context — just a small set of focused fns the caller chains
//! together.
//!
//! ## When to add a new post-process step
//!
//! Add to this module when you have a fix that:
//! - Depends on data outside the retargeter's `apply()` (FBX skeleton,
//!   sole height, IK targets, ...) so it can't live inside the
//!   retargeter passes.
//! - Needs to be available to multiple callers (viewer, sweep bin,
//!   future shotloom-side orchestration).
//! - Operates on the already-retargeted output, not on raw FBX or VRM.
//!
//! ## When NOT to add here
//!
//! - The fix is per-frame inside the retargeter pipeline → it's a
//!   retargeter pass, not a post-process. Add to `retargeter::apply`.
//! - The fix is at init time on `dst_rest_*` → use the
//!   `adapters::arp_vrm` rest sync system.
//! - The fix is a one-off for a single VRM → use UserCalibrated entries
//!   in `adapters::arp_vrm_user_pose`.
//!
//! ## Promotion to trait
//!
//! Today every post-process is a free function. When a stateful
//! post-process appears (one that needs pre-computed cache or shared
//! resources between frames), introduce a `trait AnimPostprocess` then,
//! not before. Tier 1 devlog lesson: `trait`s are only worth it when
//! `impl`s are 2 or more.

pub mod wrist_twist;

pub use wrist_twist::apply_wrist_twist_transfer;
```

## Source files — public surface only (LOC > 500, TRUNCATED)

### `src/quality/rubric_c.rs` (     828 LOC, [TRUNCATED: public surface only])

```rust
27:use glam::{Quat, Vec3};
28:use std::collections::HashMap;
30:use super::{Grade, HardFailCheck, MetricResult, RubricResult};
31:use super::fk_evaluate::VrmSkeletonFrames;
35:fn grade_score(g: Grade) -> f32 {
52:const JOINT_LIMITS: &[(&str, f32)] = &[
65:const FOOT_BONES: &[&str] = &["leftFoot", "rightFoot"];
68:const EFFECTOR_MAP: &[(&[&str], &str)] = &[
78:fn check_hard_fails(vrm_fk: &VrmSkeletonFrames) -> Vec<HardFailCheck> {
178:const WORLD_BEND_TRIPLETS: &[(&str, &str, &str, f32)] = &[
195:fn vrm_bend_at_frame(
218:fn src_bend_at_frame(
244:fn metric_joint_limit_overshoot(
367:fn metric_ground_contact(
528:fn metric_temporal_stability_residual(
659:fn metric_fidelity(
750:pub fn evaluate(
```

### `src/quality/rubric_a.rs` (     578 LOC, [TRUNCATED: public surface only])

```rust
4:use super::{Grade, MetricResult, HardFailCheck, RubricResult};
5:use glam::Quat;
10:fn grade_score(g: Grade) -> f32 {
21:fn check_hard_fails(body: &crate::source_anim::SourceAnimBody<'_>) -> Vec<HardFailCheck> {
110:fn spike_rate(rotations: &[Quat]) -> f32 {
121:fn metric_angular_velocity_outliers(fbx: &crate::fbx::SourceAsset) -> MetricResult {
190:fn metric_bone_symmetry(fbx: &crate::fbx::SourceAsset) -> MetricResult {
268:fn is_foot_bone(name: &str) -> bool {
272:fn metric_foot_contact(
397:const FPS: f32 = 30.0;
402:const JERK_VELOCITY_STATIC_FLOOR_DEG_S: f32 = 50.0;
407:const JERK_STATIC_THRESHOLD_DEG_S3: f32 = 15_000.0;
412:const JERK_ACTIVE_MULTIPLIER: f32 = 4.5;
414:fn metric_smoothness(fbx: &crate::fbx::SourceAsset) -> MetricResult {
510:pub fn evaluate(fbx: &crate::fbx::SourceAsset) -> RubricResult {
```

### `src/vrm_rest.rs` (     708 LOC, [TRUNCATED: public surface only])

```rust
6:use glam::{Mat4, Quat, Vec3};
7:use std::collections::HashMap;
9:use crate::VrmRestPose;
12:pub enum VrmRestError {
28:pub fn extract_vrm_rest_pose(glb_bytes: &[u8]) -> Result<VrmRestPose, VrmRestError> {
260:pub fn compute_virtual_rest_global(
354:fn compute_foot_sole_offset(
370:fn compute_foot_sole_offset_skinned(
527:fn compute_foot_contact(
664:fn extract_mesh_min_y(glb_bytes: &[u8]) -> Option<f32> {
```

### `src/retargeter.rs` (     751 LOC, [TRUNCATED: public surface only])

```rust
1:use glam::{Quat, Vec3};
2:use std::collections::HashMap;
4:use crate::fbx::SourceAsset;
5:use crate::quality::RetargetQuality;
6:use crate::types::{
10:use crate::RetargetError;
13:const DIRECTION_CORRECTION_ITERATIONS: usize = 3;
15:const DIRECTION_CORRECTION_LO_RAD: f32 = 0.0873;
17:const DIRECTION_CORRECTION_HI_RAD: f32 = 0.2618;
20:struct BoneData {
39:struct CorrectionPair {
48:struct FrameBuffers {
60:struct FbxPairFrameData {
82:pub struct ArpRetargeterInner {
104:pub struct RetargeterOptions {
112:impl ArpRetargeterInner {
695:pub struct IdentityRetargeter {
699:impl IdentityRetargeter {
```

## tests/ file list (bodies omitted — test surface only)

```
      29 tests/finger_axis_map.rs
     179 tests/finger_rest_align.rs
     183 tests/integration.rs
     331 tests/fixtures/mod.rs
     617 tests/metric_fixtures.rs
    1339 total
```

## Critical test file — tests/metric_fixtures.rs (full, 617 LOC)

```rust
//! Phase 0 — Metric fixture runner.
//!
//! Runs every rubric_a metric (and rubric_c with minimal VRM stubs)
//! against each of the 6 hand-written synthetic fixtures. Each test
//! asserts the *hand-computed correct* expected value from the fixture
//! comment. A failing test is a locked bug reproduction, not an error
//! in the test — it documents a metric that disagrees with the
//! comment's arithmetic.
//!
//! Run with `cargo test --test metric_fixtures`. Use `-- --nocapture`
//! to see the per-metric detail lines.

mod fixtures;

use fixtures::*;
use glam::{Quat, Vec3};
use humanoid_retarget::fbx::SourceAsset;
use humanoid_retarget::quality::fk_evaluate::VrmSkeletonFrames;
use humanoid_retarget::quality::{Grade, RubricResult, rubric_a, rubric_c};
use humanoid_retarget::types::{
    FbxSkeletonFrames, TargetAnimation, VrmRestPose,
};
use std::collections::HashMap;

// ── rubric A helpers ─────────────────────────────────────────────────────────

fn run_a(fbx: &SourceAsset) -> RubricResult {
    rubric_a::evaluate(fbx)
}

fn metric(r: &RubricResult, name_prefix: &str) -> Grade {
    r.metrics
        .iter()
        .find(|m| m.name.starts_with(name_prefix))
        .map(|m| m.grade)
        .unwrap_or(Grade::A)
}

fn print_rubric(tag: &str, r: &RubricResult) {
    println!("[{tag}] overall={} score={:.1}", r.overall.label(), r.overall_score);
    for h in &r.hard_fails {
        println!(
            "  hardfail {}: {} ({})",
            if h.passed { "PASS" } else { "FAIL" },
            h.name,
            h.detail
        );
    }
    for m in &r.metrics {
        println!("  {} = {} — {}", m.name, m.grade.label(), m.detail);
    }
}

// ── Fixture 1: identity_30_frames ────────────────────────────────────────────
// Expected: every metric Grade::A, overall A.

#[test]
fn rubric_a_identity() {
    let fbx = identity_30_frames();
    let r = run_a(&fbx);
    print_rubric("A/identity", &r);
    assert!(!r.has_hard_fail(), "identity fixture should pass hard fails");
    assert_eq!(metric(&r, "A1.1"), Grade::A);
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    assert_eq!(metric(&r, "A1.4"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 2: arm_linear_sweep ──────────────────────────────────────────────
// Expected: Grade::A everywhere (constant-rate rotation, 3°/frame).

#[test]
fn rubric_a_arm_linear_sweep() {
    let fbx = arm_linear_sweep();
    let r = run_a(&fbx);
    print_rubric("A/arm_linear_sweep", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "A1.1"), Grade::A, "linear sweep is not a spike");
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    assert_eq!(metric(&r, "A1.4"), Grade::A, "constant velocity → zero jerk");
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 3: single_discontinuity ──────────────────────────────────────────
// HAND-EXPECTED: A1.1 should detect the 30° discontinuity → at worst
// non-A grade. ACTUAL: median-zero early-out returns 0. Test is RED.

#[test]
fn rubric_a_single_discontinuity() {
    let fbx = single_discontinuity();
    let r = run_a(&fbx);
    print_rubric("A/single_discontinuity", &r);
    assert!(!r.has_hard_fail());
    // A correct spike detector should notice the 30° jump.
    assert_ne!(
        metric(&r, "A1.1"),
        Grade::A,
        "A1.1 should detect the one legitimate discontinuity; median-zero \
         early-out bug hides it"
    );
}

// ── Fixture 4: periodic_arm_swing ────────────────────────────────────────────
// Expected: Grade::A for A1.1 / A1.2. A1.4 expected B (smooth sinusoid
// but |jerk| bound ≈ 8200 °/s³ crosses 5000 threshold).

#[test]
fn rubric_a_periodic_arm_swing() {
    let fbx = periodic_arm_swing();
    let r = run_a(&fbx);
    print_rubric("A/periodic_arm_swing", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "periodic motion is not a gimbal spike"
    );
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    let a14 = metric(&r, "A1.4");
    assert!(
        matches!(a14, Grade::A | Grade::B),
        "A1.4 jerk on a smooth 30° sinusoid should be A or B, got {}",
        a14.label()
    );
}

// ── Fixture 5: mirrored_jumping_jack ─────────────────────────────────────────
// Expected: Grade::A everywhere. Bind is symmetric so A1.2 is A regardless
// of animation; per-bone rates are 0 (constant step); jerk 0.

#[test]
fn rubric_a_mirrored_jumping_jack() {
    let fbx = mirrored_jumping_jack();
    let r = run_a(&fbx);
    print_rubric("A/mirrored_jumping_jack", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "A1.1"), Grade::A);
    assert_eq!(metric(&r, "A1.2"), Grade::A, "bind pose is perfectly symmetric");
    assert_eq!(metric(&r, "A1.4"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 7: stretch_bones_only ────────────────────────────────────────────
// ARP stretch helpers get a 60° sawtooth; every real bone is static.
// A correct A1.1 should filter stretch bones out of its evaluation pool
// entirely → Grade A. Current: not filtered → RED.

#[test]
fn rubric_a_stretch_bones_only() {
    let fbx = stretch_bones_only();
    let r = run_a(&fbx);
    print_rubric("A/stretch_bones_only", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "ARP stretch helpers are not retargeted; A1.1 should name-filter \
         `*_stretch.*` out of its evaluation pool"
    );
}

// ── Fixture 6: fast_heel_strike ──────────────────────────────────────────────
// HAND-EXPECTED: Grade::A — periodic sawtooth is legitimate motion.
// ACTUAL: A1.1 returns C because 3×median threshold flags the wraparound
// steps. RED.

#[test]
fn rubric_a_fast_heel_strike() {
    let fbx = fast_heel_strike();
    let r = run_a(&fbx);
    print_rubric("A/fast_heel_strike", &r);
    assert!(!r.has_hard_fail());
    // Correct detector should not flag periodic in-band peaks.
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "periodic sawtooth with 4× in-band peaks is not a spike; \
         current 3×median detector false-flags it"
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Rubric C plumbing
// ═════════════════════════════════════════════════════════════════════════════
//
// Rubric C reads per-frame VRM bone positions + rotations. We build
// those directly from each FBX fixture by renaming ARP-style bones to
// VRM-humanoid bones and computing a trivial forward kinematic chain
// that leaves every joint at its rest position (bone_positions static)
// but faithfully propagates the fixture's per-frame local rotations.
// fidelity is skipped (src_fk = None).

const ARP_TO_VRM: &[(&str, &str)] = &[
    ("root.x", "hips"),
    ("spine.x", "spine"),
    ("chest.x", "chest"),
    ("neck.x", "neck"),
    ("head.x", "head"),
    ("shoulder.l", "leftShoulder"),
    ("shoulder.r", "rightShoulder"),
    ("arm.l", "leftUpperArm"),
    ("arm.r", "rightUpperArm"),
    ("forearm.l", "leftLowerArm"),
    ("forearm.r", "rightLowerArm"),
    ("hand.l", "leftHand"),
    ("hand.r", "rightHand"),
    ("thigh.l", "leftUpperLeg"),
    ("thigh.r", "rightUpperLeg"),
    ("leg.l", "leftLowerLeg"),
    ("leg.r", "rightLowerLeg"),
    ("foot.l", "leftFoot"),
    ("foot.r", "rightFoot"),
];

/// Static VRM rest positions (world-space, y-up meters). The actual
/// numeric values don't matter to stability / joint_limit — only ground
/// contact reads them, and it only cares about foot.y which we peg
/// slightly above zero. All positions are constant across frames.
fn vrm_rest_positions() -> HashMap<&'static str, Vec3> {
    let mut m = HashMap::new();
    m.insert("hips", Vec3::new(0.0, 0.9, 0.0));
    m.insert("spine", Vec3::new(0.0, 1.0, 0.0));
    m.insert("chest", Vec3::new(0.0, 1.1, 0.0));
    m.insert("neck", Vec3::new(0.0, 1.45, 0.0));
    m.insert("head", Vec3::new(0.0, 1.6, 0.0));
    m.insert("leftShoulder", Vec3::new(0.1, 1.4, 0.0));
    m.insert("rightShoulder", Vec3::new(-0.1, 1.4, 0.0));
    m.insert("leftUpperArm", Vec3::new(0.2, 1.4, 0.0));
    m.insert("rightUpperArm", Vec3::new(-0.2, 1.4, 0.0));
    m.insert("leftLowerArm", Vec3::new(0.45, 1.4, 0.0));
    m.insert("rightLowerArm", Vec3::new(-0.45, 1.4, 0.0));
    m.insert("leftHand", Vec3::new(0.65, 1.4, 0.0));
    m.insert("rightHand", Vec3::new(-0.65, 1.4, 0.0));
    m.insert("leftUpperLeg", Vec3::new(0.1, 0.9, 0.0));
    m.insert("rightUpperLeg", Vec3::new(-0.1, 0.9, 0.0));
    m.insert("leftLowerLeg", Vec3::new(0.1, 0.5, 0.0));
    m.insert("rightLowerLeg", Vec3::new(-0.1, 0.5, 0.0));
    m.insert("leftFoot", Vec3::new(0.1, 0.05, 0.0));
    m.insert("rightFoot", Vec3::new(-0.1, 0.05, 0.0));
    m
}

struct CInputs {
    vrm_fk: VrmSkeletonFrames,
    result: TargetAnimation,
    vrm_rest: VrmRestPose,
}

/// Build the VRM-side `VrmRestPose` used by rubric C. This is test
/// harness scaffolding: it describes rubric B's "validated target rest"
/// for these synthetic fixtures. Independent of whatever retargeter we
/// plug in via the `Retargeter` trait.
fn build_vrm_rest_for_fixtures() -> VrmRestPose {
    let rests = vrm_rest_positions();
    let mut bone_rest_local: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_global: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_translation: HashMap<String, Vec3> = HashMap::new();
    let mut bone_world_position: HashMap<String, Vec3> = HashMap::new();
    let mut virtual_rest_global: HashMap<String, Quat> = HashMap::new();

    for (_arp, vrm) in ARP_TO_VRM {
        let rest_pos = rests.get(vrm).copied().unwrap_or(Vec3::ZERO);
        bone_rest_local.insert((*vrm).to_string(), Quat::IDENTITY);
        bone_rest_global.insert((*vrm).to_string(), Quat::IDENTITY);
        bone_rest_translation.insert((*vrm).to_string(), rest_pos);
        bone_world_position.insert((*vrm).to_string(), rest_pos);
        virtual_rest_global.insert((*vrm).to_string(), Quat::IDENTITY);
    }

    let mut parent_map: HashMap<String, String> = HashMap::new();
    for (child, parent) in &[
        ("spine", "hips"),
        ("chest", "spine"),
        ("neck", "chest"),
        ("head", "neck"),
        ("leftShoulder", "chest"),
        ("rightShoulder", "chest"),
        ("leftUpperArm", "leftShoulder"),
        ("rightUpperArm", "rightShoulder"),
        ("leftLowerArm", "leftUpperArm"),
        ("rightLowerArm", "rightUpperArm"),
        ("leftHand", "leftLowerArm"),
        ("rightHand", "rightLowerArm"),
        ("leftUpperLeg", "hips"),
        ("rightUpperLeg", "hips"),
        ("leftLowerLeg", "leftUpperLeg"),
        ("rightLowerLeg", "rightUpperLeg"),
        ("leftFoot", "leftLowerLeg"),
        ("rightFoot", "rightLowerLeg"),
    ] {
        parent_map.insert((*child).to_string(), (*parent).to_string());
    }

    VrmRestPose {
        bone_rest_local,
        bone_rest_global,
        bone_rest_translation,
        bone_world_position,
        parent_map,
        hips_height: 0.9,
        root_rest_rotation: Quat::IDENTITY,
        virtual_rest_global,
        foot_sole_offset: (0.0, 0.0),
        foot_contact: None,
    }
}

/// Build `VrmSkeletonFrames` for rubric C's positional metrics. Rubric C
/// wants world-space bone positions per frame; since the identity
/// retargeter doesn't move joints (only propagates local rotations at
/// fixed rest positions), we peg every frame's position at the rest
/// position. Also reads rotations back out of the `TargetAnimation` so
/// the two are consistent.
fn build_vrm_fk_from_result(
    result: &TargetAnimation,
    frame_count: usize,
    duration: f32,
) -> VrmSkeletonFrames {
    let rests = vrm_rest_positions();
    let mut bone_positions: HashMap<String, Vec<Vec3>> = HashMap::new();
    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();

    for bone in &result.bones {
        let rest_pos = rests
            .get(bone.vrm_bone_name.as_str())
            .copied()
            .unwrap_or(Vec3::ZERO);
        bone_positions.insert(bone.vrm_bone_name.clone(), vec![rest_pos; frame_count]);
        bone_rotations.insert(bone.vrm_bone_name.clone(), bone.rotations.clone());
    }

    VrmSkeletonFrames {
        frame_count,
        duration,
        bone_positions,
        bone_rotations,
    }
}

fn build_c_inputs(fbx: &SourceAsset) -> CInputs {
    use humanoid_retarget::IdentityRetargeter;

    let vrm_rest = build_vrm_rest_for_fixtures();

    let bone_map: Vec<(String, String)> = ARP_TO_VRM
        .iter()
        .map(|(arp, vrm)| ((*arp).to_string(), (*vrm).to_string()))
        .collect();
    let identity = IdentityRetargeter::new(bone_map);
    let result = identity
        .retarget(fbx, &vrm_rest)
        .expect("IdentityRetargeter is infallible on synthetic fixtures");

    let vrm_fk = build_vrm_fk_from_result(&result, fbx.frame_count, fbx.duration);

    CInputs {
        vrm_fk,
        result,
        vrm_rest,
    }
}

fn run_c(fbx: &SourceAsset) -> RubricResult {
    // Rubric pipeline ordering: A (source) before C (retargeter). If A
    // hard-fails, running C on the same input is meaningless — C scores
    // the retargeter, not the input, and a broken input can't produce a
    // trustworthy retargeter score. Mirrors shotloom-import's
    // `import_and_validate` gating.
    let a = rubric_a::evaluate(fbx);
    if a.has_hard_fail() {
        panic!(
            "rubric A hard-failed on this fixture; rubric C was not run (upstream-A gate)"
        );
    }
    let c = build_c_inputs(fbx);
    let src_fk: Option<&FbxSkeletonFrames> = None;

    // Per-VRM-bone source rotation tracks — feeds C1.3 Stability
    // residual. Uses the same ARP_TO_VRM mapping the identity
    // retargeter consumed.
    let mut src_rotations_by_vrm: HashMap<String, Vec<Quat>> = HashMap::new();
    // Per-VRM-bone FBX bone name — feeds C1.1 world-space triplet
    // lookup. Absent from the fixture harness (no FbxSkeletonFrames),
    // so C1.1 will be skipped here regardless. Left in place so the
    // fixture run_c mirrors the orchestrator signature shape.
    let mut vrm_to_fbx_name: HashMap<String, String> = HashMap::new();
    for (arp, vrm) in ARP_TO_VRM {
        if let Some(track) = fbx.tracks.get(*arp) {
            src_rotations_by_vrm.insert((*vrm).to_string(), track.rotations.clone());
        }
        vrm_to_fbx_name.insert((*vrm).to_string(), (*arp).to_string());
    }

    rubric_c::evaluate(
        &c.vrm_fk,
        src_fk,
        &c.result,
        &c.vrm_rest,
        Some(&src_rotations_by_vrm),
        Some(&vrm_to_fbx_name),
    )
}

// ── Rubric C per-fixture tests ───────────────────────────────────────────────
// All static bone positions → ground_contact should be Grade::A across
// the board; joint_limit reacts to the fixture's local rotations;
// stability reacts to the fixture's rotation deltas; fidelity is absent.

#[test]
fn rubric_c_identity() {
    let r = run_c(&identity_30_frames());
    print_rubric("C/identity", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    assert_eq!(metric(&r, "C1.3"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

#[test]
fn rubric_c_arm_linear_sweep() {
    let r = run_c(&arm_linear_sweep());
    print_rubric("C/arm_linear_sweep", &r);
    assert!(!r.has_hard_fail());
    // leftUpperArm reaches only 87°, well under the 180° UpperArm limit.
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Constant-rate rotation has constant velocity → zero pop frames.
    assert_eq!(metric(&r, "C1.3"), Grade::A);
}

#[test]
fn rubric_c_single_discontinuity() {
    let r = run_c(&single_discontinuity());
    print_rubric("C/single_discontinuity", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Post-residual redesign (C1.1 + C1.3 + C1.4): the 30° pop and any
    // joint-angle weirdness live in the input, not in the retargeter.
    // Under identity passthrough every input→output residual is zero,
    // so all three residual metrics grade A. Input issues are caught
    // by rubric A (see `rubric_a_single_discontinuity` above). This
    // replaces the pre-2026-04-13 locked contradiction that asserted
    // C1.3 != A.
    assert_eq!(
        metric(&r, "C1.1"),
        Grade::A,
        "identity retargeter introduced zero joint overshoot; C1.1 \
         must not re-penalize input joint angles rubric A already caught"
    );
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "identity retargeter introduced zero residual; C1.3 must not \
         re-penalize input quality rubric A already caught"
    );
}

#[test]
fn rubric_c_periodic_arm_swing() {
    let r = run_c(&periodic_arm_swing());
    print_rubric("C/periodic_arm_swing", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Smooth sinusoid should not produce pop frames.
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "periodic smooth motion is not a pop"
    );
}

#[test]
fn rubric_c_mirrored_jumping_jack() {
    let r = run_c(&mirrored_jumping_jack());
    print_rubric("C/mirrored_jumping_jack", &r);
    assert!(!r.has_hard_fail());
    // Arm 87° + Leg 58° — well under joint limits.
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    assert_eq!(metric(&r, "C1.3"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

#[test]
fn rubric_c_fast_heel_strike() {
    let r = run_c(&fast_heel_strike());
    print_rubric("C/fast_heel_strike", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // HAND-EXPECTED: periodic sawtooth is legitimate motion, not
    // instability. Current 3×median detector in C1.3 mirrors A1.1's
    // false-positive pattern.
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "C1.3 should not flag periodic sawtooth as temporal instability"
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Rubric C identity-passthrough contradiction (Phase 3.5, 2026-04-13)
// ═════════════════════════════════════════════════════════════════════════════
//
// Rubric C is defined as "input→output residual only" — see the axis
// rule documented at the top of `src/quality/rubric_c.rs`. Under that
// rule, when the retargeter is an identity function (output == input),
// every Rubric C metric MUST grade A regardless of how ugly the input
// animation is. The retargeter did nothing, so it cannot have done
// anything wrong.
//
// `build_c_inputs` is already an identity retargeter: it copies each
// ARP bone's rotation track onto the matching VRM humanoid bone name.
// So for any fixture whose Rubric A would grade non-A, the Rubric C
// pass should still grade A if and only if the C metrics respect the
// input-output residual rule.
//
// The test below feeds `single_discontinuity` (a known Rubric A non-A
// input: one 30° jump on arm.l at frame 10) through the identity
// retargeter. A correctly-shaped Rubric C must grade C1.3 = A because
// the retargeter introduced ZERO new deltas — it passed through the
// exact ugly input the user provided.
//
// Current C1.3 grades this as B (see `rubric_c_single_discontinuity`
// above, which explicitly asserts `!= A` and passes). That is the
// structural bug: C1.3 reads only `vrm_fk.bone_rotations` and answers
// "does the output animation have pops?", a Rubric A question. It
// does not compare input to output; it has no concept of residual.
//
// This test is marked `#[ignore]` and locks the contradiction as
// executable evidence. Run with `cargo test -- --ignored` to confirm
// it fails with a clear message. The fix is a residual-based C1.3
// redesign scheduled for the next metric session — NOT a detector
// tuning pass. Detector tuning on C1.3 cannot fix this because the
// bug is that C1.3 is measuring the wrong function.

#[test]
fn rubric_c_identity_passthrough_c13_should_not_flag_input_spikes() {
    // Input carries a known Rubric A non-A: one 30° jump on arm.l.
    let fbx = single_discontinuity();
    // `build_c_inputs` is the identity retargeter — VRM tracks are
    // exact copies of the ARP tracks. So the retargeter did nothing.
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "identity retargeter introduced zero new rotation deltas; C1.3 \
         must not penalize input quality it had no hand in creating"
    );
}

/// C1.1 residual sibling of the C1.3 identity passthrough contract.
///
/// Rubric C scores the retargeter. Joint-limit violations that live in
/// the source animation are a Rubric A concern — C1.1 must not double
/// count them. Under an identity retargeter the per-frame joint bend
/// angle on the VRM side equals the source side exactly, so overshoot
/// is zero for every matched bone across every frame.
///
/// The fixture (`single_discontinuity`) has one 30° pop on `arm.l`.
/// Pre-2026-04-14 C1.1 read `angle_between(vrm_out, vrm_rest)` in
/// isolation and graded by `JOINT_LIMITS` thresholds, potentially
/// flagging the input pop. Post-redesign the metric uses `max(0,
/// vrm_bend − src_bend)` and correctly reports zero overshoot.
#[test]
fn rubric_c_identity_passthrough_c11_should_not_flag_input_joint_angles() {
    let fbx = single_discontinuity();
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough_c11 (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "C1.1"),
        Grade::A,
        "identity retargeter introduced zero joint overshoot; C1.1 \
         must not re-penalize input joint angles rubric A already caught"
    );
}

/// C1.4 residual sibling. Fixture hips heights (src = vrm = 0.9 m)
/// give `size_ratio = 1.0`, so `normalized = vrm_path / src_path`
/// exactly. Under an identity retargeter vrm path equals src path by
/// construction (same rotation tracks against identical rest), so the
/// normalized ratio is 1.0 → grade A.
///
/// Pre-2026-04-14 C1.4 used raw `vrm_path / src_path` and was already
/// correct on identity fixtures with matching scale; the real bug
/// landed on small-stylized VRMs in the sweep where `vrm_hips <
/// src_hips` produced a raw ratio < 1 purely from scale. This test
/// locks the size-normalization path on the fixture side so that the
/// sweep behavior is mirrored by a hermetic unit test.
#[test]
fn rubric_c_identity_passthrough_c14_should_not_flag_proportion() {
    let fbx = single_discontinuity();
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough_c14 (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    // C1.4 is skipped when vrm_fk has static positions (no path to
    // measure). `single_discontinuity` has static rest positions across
    // frames, so expect the metric to be absent or grade A — treat
    // "absent" as equivalent to A since skipping means rubric C did
    // not charge the retargeter anything on this axis.
    let c14 = r.metrics.iter().find(|m| m.name == "C1.4_Fidelity");
    match c14 {
        Some(m) => assert_eq!(
            m.grade,
            Grade::A,
            "identity retargeter against matching hips height must \
             normalize to a 1.0× path ratio on C1.4"
        ),
        None => {
            // skipped (no src_fk in fixture harness) — acceptable:
            // zero weight charged, not a failure.
        }
    }
}
```
```

## Response

OpenAI Codex v0.117.0 (research preview)
--------
workdir: /Users/deemooooooooo/Desktop/www/caol-ila
model: gpt-5.4
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, /Users/deemooooooooo/.codex/memories]
reasoning effort: none
reasoning summaries: none
session id: 019d89d1-e713-7b31-bb8c-19d1f349ff94
--------
user
중요: 모든 답변은 **한국어**로. 코드 블록은 영어로 두되 설명·결론·요약·권장사항은 한국어. 마크다운으로. 결론은 굵게.

---

당신은 Rust 워크스페이스 마이그레이션 전문가다. 아래 bevy-vrm 모듈을
shotloom 레포의 shotloom-retarget crate로 이식하는 **계획서**를 작성하라.

## Scope Context (caller-provided)
- Phase: Phase B Session 1 complete (scaffold + ADR-0023 landed). Planning Session 2 (types + rubric + retargeter port).
- Out-of-scope: ValidatedSource/ValidatedTarget marker impl (Session 3), caller migration / viewer wiring (Session 4), shotloom-desktop Tauri icon bug (pre-existing, unrelated)
- Binding ADRs (read these first): docs/adr/adr-0023-retargeter-validation-contract.md (the contract you are porting to); docs/adr/adr-0021-cross-crate-diagnostic-type.md (Diagnostic type shotloom-common owns)
- Known constraints:
  - Quality types (Grade, RubricResult, MetricResult, HardFailCheck, rubric_a/b/c, fk_evaluate, score, detector) stay DOMAIN-LOCAL to shotloom-retarget — never exported to shotloom-common.
  - The bevy-vrm local `quality/diagnostic.rs` module MUST be replaced with imports from shotloom-common::diagnostic (which already exists and has a superset of fields). Do not copy that file.
  - `rubric_to_diagnostics` stays in shotloom-retarget as the one-way lossy projection from RubricResult to Vec<shotloom_common::Diagnostic>.
  - `src/quality/foot.rs` was DELETED upstream as dead code — must NOT be ported.
  - shotloom-retarget owns NO scene/actor/character concept. Assembly is caller responsibility.
  - Public entry point is `evaluate_pipeline` (name may change). Session 2 does not yet gate inputs with ValidatedSource/ValidatedTarget markers — that's Session 3.
  - Source crate name changed: bevy-vrm uses `humanoid_retarget` (NOT `cinev_retarget` — if the skill template mentions that, ignore it).
  - Rename: the source crate root is `crates/humanoid_retarget`, target is `crates/shotloom-retarget` (already scaffolded as empty lib.rs + Cargo.toml).
  - Session 2's single goal: move types/modules so that `cargo check -p shotloom-retarget` passes with real code. NO runtime wiring into shotloom-import yet.

---

## Uncertainty Protocol (binding)
- If given information is not sufficient to reach a conclusion, do not
  fabricate one. Collect such items in a dedicated "Insufficient
  evidence" section at the end.
- If a design decision is not fixed by the binding ADRs or constraints,
  do not guess. Collect it in a "Decision needed" section as an open
  question.
- If an observation is relevant but outside the declared scope, move
  it to an "Out-of-scope observation" section. Do not mix it with the
  in-scope analysis.

---

**대상**: 크레이트 전체 (`crates/humanoid_retarget`)
**소스 레포**: bevy-vrm/crates/humanoid_retarget/
**대상 레포**: shotloom-github/crates/shotloom-retarget/ (빈 scaffold 완료)

**계획서 구조** (반드시 이 순서):

1. **크레이트 한 줄 요약**
2. **의존성 그래프** — 크레이트 내부 모듈 간 그래프 (A → B 형식)
3. **Session-level manifest** — 아래 표 형식으로 제출:

   | Session | Files moved | Renames | Dependencies on previous sessions | Exit criteria |
   |---|---|---|---|---|

   Session 2만 상세히, Session 3/4는 한 줄 요약.
4. **Contract Surface** — shotloom-retarget이 외부에 노출할 함수/타입 (Session 2 말미 기준)
5. **이식 시 주의점** — rename, import path, feature flag, lifetime/ownership 충돌
6. **검증 전략** — 이식 직후 "옮겨졌다"를 증명하는 방법. 기존 bevy-vrm 테스트 중 어느 것을 함께 옮길지.
7. **위험도** — 🟢/🟡/🔴 + 추정 작업 시간 (1시간 단위) + 가장 큰 unknown
8. **Insufficient evidence**
9. **Decision needed**
10. **Out-of-scope observation**

**금지**:
- "그냥 복사하면 됨" 같은 안일한 결론
- 코드를 직접 작성하지 말 것 — 계획만
- 추측성 "may need..." 금지 — 의존성은 grep해서 확인하라

---

## Binding ADRs (preloaded)

### ADR-0023 (retargeter validation contract)

# ADR-0023: Retargeter Validation Contract and Diagnostic Boundary

## Status

Proposed

## Context

Shotloom needs a skeletal animation retargeting pipeline that adapts
source animation (ARP-style humanoid FBX) onto VRM target models. The
pipeline runs both inside the browser (WebGPU editor) and in CLI /
batch sweep contexts for regression testing, and must produce:

1. **A transformed animation** ready to drive a specific VRM character,
   preserving motion geometry as far as the target rig allows.
2. **Operational diagnostics** about whether the transformation could
   run at all — parse failures, missing skeleton bones, NaN outputs,
   rubric hard-fail gates — flowing through the same
   `shotloom-common::Diagnostic` channel other shotloom subsystems
   already use (per ADR-0021).
3. **Quality measurements** about how faithfully the transformation
   matched the source, expressed in a richer grade space than the
   3-level Diagnostic severity — the existing rubric work uses four
   letter grades (A / B / C / F) plus per-metric weighted scores.

These three outputs have two different stakeholders and two different
taxonomies:

- **Operational diagnostics** belong on the cross-crate boundary per
  ADR-0021. They must fit `shotloom-common::Diagnostic` shape (3-level
  severity, `code` / `message` / optional location). Consumed by the
  editor UI error surfaces, CLI exit codes, and orchestration
  pipelines that decide "can we proceed or not."
- **Quality grades** are domain-specific to the retargeter. Compressing
  four grades into three severities loses information that in-crate
  tooling (regression sweeps, per-metric debugging, golden tests)
  legitimately needs. They belong inside the retargeter crate and
  flow across crate boundaries only as a lossy projection when a
  cross-crate consumer asks for "is it fine or not."

Without an explicit decision capturing this split, each subsequent
Phase B session risks either collapsing the rubric system into
Diagnostic (losing information) or inventing yet another cross-crate
quality type (fragmenting ADR-0021). A second, equally load-bearing
question is the scope of the new `shotloom-retarget` crate: does it
own scene / actor / character identity, or is it a pure library that
gets assembled by its callers?

Finally, a structural question: how do we enforce at the type level
that retargeting requires **both** a validated source animation
**and** a validated target model, so that no caller can accidentally
skip either validation gate?

## Decision

### 1. Two disjoint axes: operational diagnostic vs quality grade

Every observation the retargeter pipeline makes belongs on exactly one
axis.

**Operational diagnostic axis.** Uses `shotloom-common::Diagnostic`
per ADR-0021. Three severity levels (`Error` / `Warning` / `Info`).
Produced when the pipeline answers the question "can the retarget
actually run and yield a usable output?"

Examples that belong on the operational axis:

- `no bones in retarget output` after FK evaluation
- `NaN detected in output bone N at frame F`
- `FBX parse error`, `VRM rest extraction failed`, `mapping failed`
- Rubric A hard-fail (source animation structurally invalid, e.g.
  `body_skin_present: 0 skin clusters`)
- Rubric B hard-fail (target model structurally invalid, e.g.
  missing humanoid bones)
- Pipeline gated because A or B hard-failed — the gate reason
  surfaces as a `Diagnostic::Error` so downstream UI can display
  "retarget was not attempted because X."

**Quality grade axis.** Uses `shotloom-retarget`-local types:
`Grade { A, B, C, F }`, `RubricResult { hard_fails, metrics, overall,
overall_score }`, `MetricResult { name, grade, score, detail }`.
Produced when the pipeline answers the question "given that retarget
ran to completion, how faithfully did it preserve the motion?"

Examples that belong on the quality axis:

- `arm path is 75% of source path` (C1.4 Fidelity)
- `joint overshoot 20° on right upper arm` (C1.1 JointLimit residual)
- `stability spike on left toes` (C1.3 Stability residual)
- `source animation has 30° pop` (A1.1 Angular velocity)
- `foot penetrates floor by 20mm` (C1.2 GroundContact)

**Decision heuristic** for new observations:

> If this observation is emitted, can the user view a retargeted
> animation?
>
> - No, because no output was produced → operational, `Error`.
> - No, because a gate refused to run → operational, `Error`
>   (gate reason).
> - Yes, but the output has issues worth flagging → quality grade.
> - Yes, the output is acceptable → silent (`Grade::A`, no
>   diagnostic).

### 2. Domain-local ownership of quality types

`Grade`, `RubricResult`, `MetricResult`, `HardFailCheck`, and the
`rubric_a` / `rubric_b` / `rubric_c` evaluation modules live inside
`shotloom-retarget`. They are not exported to `shotloom-common` and
are not part of the cross-crate type surface.

Cross-crate consumers (`shotloom-web`, `shotloom-native`,
`shotloom-import`) that want a readable "did it go well" answer
receive `Vec<Diagnostic>` produced by a one-way projection function
`rubric_to_diagnostics` living inside `shotloom-retarget`. The
projection is intentionally lossy:

- Hard-fail checks → `Diagnostic::Error` with the hard-fail name as
  `code` and the rubric name as `location`.
- Metric graded `F` → `Diagnostic::Error` with metric name as `code`
  and metric detail as `message`.
- Metric graded `C` → `Diagnostic::Warning` with same fields.
- Metric graded `B` → `Diagnostic::Info` with same fields.
- Metric graded `A` → no diagnostic emitted (passing is silent).

Consumers that need the full 4-grade view (regression sweeps, golden
tests, per-metric debugging) read `RubricResult` directly. Consumers
that only need the boundary-friendly projection read the
`Vec<Diagnostic>` output.

### 3. shotloom-retarget scope: ARP→VRM transformation only

The `shotloom-retarget` crate owns exactly one responsibility:
transforming a validated source skeletal animation (ARP-shaped
humanoid) into a target VRM animation, and grading the result. It
does not own:

- Scene, actor, character, or subject containers. There is no
  `Character` type that bundles a VRM with its current animation.
- File format parsing of VRMs, FBXs, or any other asset. Those live
  in `shotloom-gltf`, the future FBX importer, and their siblings.
- Asset lifecycle management, caching, or persistence. Those are
  orchestration concerns handled by `shotloom-import`,
  `shotloom-stage`, and the bundle layer.
- UI presentation of grades, diagnostics, or intermediate state.

The crate's public surface is a function (or small set of functions)
that accepts validated inputs and returns a validated output plus
diagnostics. Callers compose these functions with their own scene /
actor / assembly concepts as appropriate.

### 4. Type-level "both inputs validated" contract

The retargeter's public entry point requires **both** a validated
source animation **and** a validated target model. This is enforced
at the type level via marker newtypes owned by `shotloom-common`:

```text
shotloom-common::
    pub struct ValidatedSource<'a> { ... }
    pub struct ValidatedTarget<'a> { ... }

shotloom-retarget::
    pub fn retarget(
        src: &ValidatedSource<'_>,
        tgt: &ValidatedTarget<'_>,
    ) -> Result<(TargetAnimation, RubricResult), RetargetError>
```

The markers are constructed by `validate()` constructors that run the
respective rubric gates (Rubric A for source, Rubric B for target)
and return `Result<Self, ValidationError>`. `ValidationError` carries
the failing rubric result for diagnostic projection. A caller that
has not run both validations cannot construct both markers and
therefore cannot call `retarget()` — the contract is enforced by the
compiler, not by documentation.

This is the type-level answer to the "source animation and model are
both required" constraint. Assembly (binding a source animation to a
particular character entity in a scene) remains a caller concern; the
retargeter only knows that both markers are present.

*This ADR defines the contract shape. The actual marker
implementation lands in a later Phase B session, once the crate
skeleton exists and the modules to be ported have settled.*

### 5. Phasing

Phase B splits into sessions so each commit is reviewable:

1. **Session 1 (this ADR + scaffold).** Crate skeleton created,
   ADR-0023 proposed, workspace registered.
2. **Session 2.** Port the domain-local types (`SourceAsset`,
   `MappedAnimation`, `TargetAnimation`, `VrmRestPose`) and the
   rubric modules into `shotloom-retarget`. No caller migration.
3. **Session 3.** Introduce `ValidatedSource` / `ValidatedTarget`
   markers in `shotloom-common`. Wire the retargeter's public entry
   point to consume them. Update `rubric_to_diagnostics` to produce
   `shotloom-common::Diagnostic`.
4. **Session 4.** Caller migration — `shotloom-import`,
   `shotloom-stage`, and any UI surfaces adopt the marker-gated
   contract. Regression sweep moves to the shotloom side.

## Consequences

**Positive.**

- The rubric system's 4-grade information survives the port intact.
  Regression sweeps, per-metric debugging, and golden tests continue
  to work without information loss.
- Cross-crate consumers get the familiar `Vec<Diagnostic>` shape per
  ADR-0021, with no new quality type fragmenting the API.
- The "source + target both required" constraint is enforced by the
  type system, not by convention or documentation. A caller that
  skips Rubric A cannot construct `ValidatedSource`, cannot call
  `retarget()`, and fails to compile.
- `shotloom-retarget` stays a pure library crate with no scene /
  actor concept, which keeps it reusable by future non-editor
  contexts (batch sweep, render CLI, regression tests) without
  dragging editor types along.
- The projection layer (`rubric_to_diagnostics`) is a single
  well-defined boundary, making it easy to audit what cross-crate
  consumers actually see.

**Negative.**

- Two parallel diagnostic-shaped surfaces exist: `RubricResult` and
  `Vec<Diagnostic>`. Tooling that wants both must read both or rely
  on the projection. This duplication is the cost of preserving the
  richer grade space.
- Marker newtypes introduce a lifetime parameter on the retargeter's
  public entry point. Callers must hold their source asset and
  target rest pose alive for the duration of the retarget call. This
  matches the existing borrow structure but is more explicit.
- `ValidatedSource::validate()` and `ValidatedTarget::validate()` run
  their respective rubrics eagerly. Callers that want to skip
  validation (e.g., trusted fast paths in hot loops) must go through
  a separate unchecked constructor, which does not exist in the
  initial contract and would require a follow-up decision.

**Neutral.**

- Phase B is four sessions instead of one. Each session produces a
  reviewable commit, and the scaffold session (this one) does not
  touch any real pipeline code — it only establishes the contract.
- Rubric type names (`Grade`, `RubricResult`, etc.) are not
  prefixed with the crate name, matching the bevy-vrm reference
  implementation and the existing shotloom convention where
  domain-local types use bare names inside their owning crate.

## Alternatives considered

### Collapse rubric into `Diagnostic` with 3 severities

Considered because it would unify the "how did it go" story under a
single type. Rejected because:

- Four grades (A/B/C/F) plus per-metric weighted scores cannot be
  represented in 3 severity levels without losing either the B/C
  distinction or the numeric score.
- Regression sweeps and golden tests that compare metric-level grade
  distributions across runs would lose their signal.
- ADR-0021 explicitly frames `Diagnostic` as "observations, not
  measurements." Rubric outputs are measurements.

### Put rubric types in `shotloom-common` next to `Diagnostic`

Considered because `shotloom-common` is already the home of
cross-cutting types. Rejected because:

- Rubric types carry domain knowledge about humanoid skeletons,
  frame-to-frame angular deltas, and ground contact that does not
  belong in a domain-agnostic foundation crate.
- Every crate depending on `shotloom-common` would transitively
  depend on the retargeter's vocabulary, which is not a cross-cutting
  concern.
- The `rubric_to_diagnostics` projection handles the legitimate
  cross-crate need without leaking internal types.

### No type-level validation — use runtime assertions

Considered for simplicity: `retarget()` accepts raw `SourceAsset` and
`VrmRestPose`, and panics if the caller skipped validation. Rejected
because:

- Runtime assertions in a library crate are brittle and give
  stacktrace-style failures far from the mistake site.
- The cost of marker newtypes is small: two structs in
  `shotloom-common`, ~80 lines total.
- Compile-time enforcement aligns with the broader Rust philosophy
  and matches how ADR-0021 treats `Diagnostic` as a disciplined shape
  rather than a free-form bag.

### Make `shotloom-retarget` scene-aware (bundle Character inside)

Considered because the editor ultimately cares about "this character's
current animation" more than "this animation's retarget result."
Rejected because:

- Scene / actor / character identity belongs in `shotloom-core` and
  `shotloom-stage`, not in a transformation library. Forcing it into
  `shotloom-retarget` would couple the transform to the editor's
  scene model.
- Non-editor consumers (render CLI, batch sweep, regression tests)
  retarget without any scene concept. A scene-aware retargeter
  crate would either duplicate logic or force these consumers to
  build fake scenes.
- The marker-newtype contract already enforces "both inputs present"
  at the type level, which is the only assembly guarantee the
  transformation needs.

### Port bevy-vrm's `Retargeter` trait shape verbatim

Considered for continuity. Rejected because the bevy-vrm
implementation deleted its own `Retargeter` trait as dead code in its
final pre-port cleanup — the trait had a single production
implementation and its signature took raw `&SourceAsset` /
`&VrmRestPose` references with no type-level validation. The shotloom
port is the right place to introduce the marker-based signature that
belongs at a crate boundary; replicating the old shape would mean
porting a known-wrong-shaped trait only to immediately replace it.

## Related

- [ADR-0021: Cross-Crate Diagnostic Type](adr-0021-cross-crate-diagnostic-type.md)
  — establishes the `Diagnostic` contract this ADR layers rubric
  projection on top of.
- [ADR-0010: UI-Independent Functionality in Rust Core](adr-0010-ui-independent-functionality.md)
  — crate responsibility boundary that motivates keeping scene /
  actor concepts out of `shotloom-retarget`.
- [ADR-0018: Runtime Telemetry and Error Boundaries](adr-0018-runtime-telemetry-and-error-boundaries.md)
  — bridge error payload architecture that `rubric_to_diagnostics`
  integrates with.

### ADR-0021 (cross-crate diagnostic type)

# ADR-0021: Cross-Crate Diagnostic Type

## Status

Accepted

## Context

Multiple Shotloom subsystems need to report structured observations about asset
quality, validation state, and evaluation results. Today each subsystem invents
its own reporting shape:

- `shotloom-gltf` defines `VrmDiagnostic` with severity, code, message, and an
  optional asset context string.
- `shotloom-core` defines `RuntimeErrorPayload` and `CommandRejectedPayload` as
  bridge protocol types for infrastructure failures and command rejections.
- The shot-ingestion spec (Pass 7) calls for structured validation diagnostics
  with severity, affected entity ID, human-readable message, and suggested
  action.
- ADR-0009 requires a "structured diagnostic (info severity)" when a non-void
  stage falls back to void rendering.
- The bridge contract (section 23.1) specifies a planned `validation_diagnostics`
  event with recommended fields: severity, code, message, related_ids, location,
  and recoverable.

Without a shared type, diagnostic shapes diverge across crates and the bridge
event payload cannot be standardized. This blocks at least four downstream
design decisions (STL-35, STL-37, STL-38, STL-42).

A key design distinction: **diagnostics are not errors.**

- **Diagnostic**: an observation or report about state — validation warnings,
  info notices, asset quality checks. Collected in a `Vec`, emitted via bridge
  events, displayed in UI. Can be any severity.
- **Error** (`VrmNormalizationError`, `RuntimeErrorPayload`, etc.): an actual
  failure that stops execution. Used with `Result<T, E>` and `?`.

A single operation can produce both: VRM normalization may succeed
(`Ok(asset)`) while carrying `Vec<Diagnostic>` with warnings about missing
metadata.

## Decision

### 1. Diagnostic type lives in `shotloom-common`

`shotloom-common` is the shared foundation crate ("shared error types, math
helpers, and common utilities"). The `Diagnostic` type is domain-agnostic —
it uses only primitive fields (`String`, `Vec<String>`, `Option`) and carries no
domain model dependency. Every workspace crate either already depends on
`shotloom-common` or can add the dependency cheaply.

This keeps the dependency graph clean: shared data types flow from
`shotloom-common`, domain and protocol types live in `shotloom-core`.

Bridge error payloads (`RuntimeErrorPayload`, `CommandRejectedPayload`) remain
in `shotloom-core` as specified by ADR-0018. They serve a different purpose:
infrastructure failure reporting through the bridge protocol. Diagnostics and
bridge errors share some fields but are not the same concern.

### 2. Diagnostic struct

```rust
// shotloom-common/src/diagnostic.rs

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct DiagnosticLocation {
    pub entity_type: String,
    pub entity_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub code: String,
    pub message: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub related_ids: Vec<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recoverable: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub location: Option<DiagnosticLocation>,
}
```

Field rationale:

| Field | Type | Purpose |
|-------|------|---------|
| `severity` | `DiagnosticSeverity` | Error (hard-gate, reject), Warning (soft-gate, allow), Info (observation) |
| `code` | `String` | Machine-readable bare `snake_case` identifier scoped by the `source` field: `"missing_required_bone"`, `"overlapping_clips"`. |
| `message` | `String` | Human-readable description |
| `related_ids` | `Vec<String>` | Secondary entity references (clip IDs, bone names, asset IDs) |
| `source` | `Option<String>` | Producing subsystem: `"vrm_parser"`, `"timeline_eval"`. Optional for forward compatibility. |
| `suggestion` | `Option<String>` | Actionable recovery hint when available |
| `recoverable` | `Option<bool>` | Whether the user can take action to fix the issue. `None` when the producer has no guidance (matches `retryable` pattern in `RuntimeErrorPayload`). |
| `location` | `Option<DiagnosticLocation>` | Tagged primary entity: `entity_type` + `entity_id` |

`DiagnosticLocation` uses a tagged-string pattern (`entity_type` + `entity_id`)
to remain domain-agnostic. Entity type values (e.g., `"clip"`, `"character"`,
`"asset"`, `"bone"`) are conventions enforced by a constants module, not a
closed enum in `shotloom-common`.

### 3. Diagnostics are transient

Diagnostics are recomputed each evaluation or validation pass. They are never
stored in the project bundle. The bridge emits them via `validation_diagnostics`
events; the UI replaces its diagnostic state on each emission. Undo/redo does
not track diagnostic state — diagnostics are a derived view of project state.

### 4. No collection wrapper

Consumers use `Vec<Diagnostic>` directly. This is consistent with all existing
bridge payload types (`Vec<String>` for IDs, etc.). No `DiagnosticCollection`
newtype.

### 5. Constructor helpers and Display

```rust
impl Diagnostic {
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self;
    pub fn warning(code: impl Into<String>, message: impl Into<String>) -> Self;
    pub fn info(code: impl Into<String>, message: impl Into<String>) -> Self;

    pub fn with_source(mut self, source: impl Into<String>) -> Self;
    pub fn with_suggestion(mut self, suggestion: impl Into<String>) -> Self;
    pub fn with_related_ids(mut self, ids: Vec<String>) -> Self;
    pub fn with_location(mut self, entity_type: impl Into<String>, entity_id: impl Into<String>) -> Self;
    pub fn with_recoverable(mut self, recoverable: bool) -> Self;
}

impl std::fmt::Display for Diagnostic {
    // Formats as: [ERROR] missing_required_bone: Required bone 'hips' not found
}
```

`Diagnostic` implements `Display` for logging and CLI output. It does **not**
implement `std::error::Error` — diagnostics are observations, not failures.

### 6. Diagnostic codes are crate-local

Diagnostic code constants (e.g., `"invalid_glb"`,
`"overlapping_clips"`) live in the crate that produces the
diagnostic, not in `shotloom-common`. This keeps domain knowledge in
domain crates. `shotloom-common` provides the type; each producing crate
defines its own vocabulary.

### 7. VrmDiagnostic migration

`VrmDiagnostic` remains in `shotloom-gltf` (publicly exported for downstream
use). The `shotloom-import` crate converts `VrmDiagnostic` to `Diagnostic`
at the import boundary via a standalone conversion function. (A `From`
trait impl is not possible due to Rust's orphan rule — neither type is
local to `shotloom-import`.) This avoids forcing `shotloom-gltf` to depend
on `shotloom-common` immediately while keeping the public API unified.

If `shotloom-gltf` later adds a `shotloom-common` dependency for other
reasons, `VrmDiagnostic` can be replaced with `Diagnostic` directly.

The `asset_context: Option<String>` field in `VrmDiagnostic` maps to
`location: Some(DiagnosticLocation { entity_type: "asset_path", entity_id })`,
preserving the JSON pointer path information without semantic loss.

Note: `VrmDiagnosticSeverity` has no `Info` variant. The conversion maps
`Warning` to `DiagnosticSeverity::Warning` and `Error` to
`DiagnosticSeverity::Error`. This is sufficient — VRM validation produces
only warnings and errors, never informational observations.

## Consequences

- All subsystems emit the same diagnostic shape, enabling a single
  `validation_diagnostics` bridge event and a uniform UI diagnostic panel.
- `shotloom-common` gains `serde` as a dependency. This is acceptable since
  most workspace crates already depend on serde transitively.
- The `Diagnostic` type is intentionally simple (all `String` fields, no
  generics, no lifetimes). This prioritizes serialization ease and cross-crate
  compatibility over micro-optimizations.
- Bridge error types (`RuntimeErrorPayload`, `CommandRejectedPayload`) remain
  separate in `shotloom-core`. They serve infrastructure error reporting, not
  domain observation. No unification is needed.
- Diagnostic codes are conventions (string constants), not a closed type. This
  trades compile-time exhaustiveness for cross-crate extensibility.
- Transient-only semantics mean no migration, versioning, or bundle schema
  changes are required.

## Alternatives considered

### Place Diagnostic in `shotloom-core`

Considered because `shotloom-core` already owns bridge DTOs and has serde.
Rejected because `Diagnostic` is domain-agnostic infrastructure (like
telemetry), not domain model. Placing it in `shotloom-core` would force
every diagnostic producer to depend on the domain model crate, even when
they only need the shared observation type. `shotloom-common` is the
correct layer for cross-cutting shared types.

### Trait-based Diagnostic (miette pattern)

A `Diagnostic` trait extending `std::error::Error` with provided methods
for severity, code, help, related, etc. Rejected because:

- Diagnostics are not errors — implementing `Error` conflates observation
  with failure.
- Trait objects require boxing for collection (`Vec<Box<dyn Diagnostic>>`),
  adding allocation overhead and complexity.
- A concrete struct is simpler to serialize, collect, and pass through the
  bridge.

### Dedicated `shotloom-diagnostic` crate

A new crate solely for the diagnostic type. Rejected as premature — the type
is small (~100 LOC) and fits naturally in `shotloom-common`'s stated scope.
If `shotloom-common` grows beyond its intended size, the diagnostic module
can be extracted later without breaking dependents.

### Typed enum for codes instead of strings

A `DiagnosticCode` enum with all possible codes. Rejected because:

- The enum would need to live in the lowest shared crate but contain
  domain-specific variants from every subsystem.
- Adding a new diagnostic would require modifying the shared enum,
  creating unnecessary coupling.
- Path-style string codes with a constants module provide similar
  discoverability without the coupling.

### Structured enum for location

A `DiagnosticLocation` enum with variants like `Clip { clip_id, track_id }`,
`Character { character_id }`, etc. Rejected because it couples
`shotloom-common` to domain entity types. The tagged-string pattern
(`entity_type` + `entity_id`) provides equivalent UI routing capability
without domain coupling.

## Related

- [ADR-0009: Void Stage and Coordinate System](adr-0009-void-stage-and-coordinate-system.md) — requires info-severity diagnostic for stage fallback
- [ADR-0010: UI-Independent Functionality](adr-0010-ui-independent-functionality.md) — crate responsibility boundaries inform placement decision
- [ADR-0018: Runtime Telemetry and Error Boundaries](adr-0018-runtime-telemetry-and-error-boundaries.md) — bridge error payloads remain in `shotloom-core`
- [docs/ipc/bridge-contract.md](../ipc/bridge-contract.md) — section 23.1 `validation_diagnostics` event
- [docs/specs/shot-ingestion.md](../specs/shot-ingestion.md) — Pass 7 validation diagnostic requirements

---

## Cargo.toml (humanoid_retarget)

```toml
[package]
name = "humanoid_retarget"
version = "0.1.0"
edition = "2024"

[dependencies]
fbx_rig = { path = "../fbx_rig" }
vrm0_compat = { path = "../vrm0_compat" }
glam = "0.30"
gltf = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"

[[bin]]
name = "retarget-test"
path = "src/bin/retarget_test.rs"

[[bin]]
name = "pop-scan"
path = "src/bin/pop_scan.rs"

[[bin]]
name = "validate-pipeline"
path = "src/bin/validate_pipeline.rs"

[[bin]]
name = "fbx-summary-scratch"
path = "src/bin/fbx_summary_scratch.rs"
```

## Source file tree with LOC

```
      14 src/adapters/mod.rs
      16 src/topo.rs
      24 src/vrm_compat.rs
      29 tests/finger_axis_map.rs
      31 src/bin/validate_pipeline.rs
      38 src/postprocess/mod.rs
      63 src/bin/pop_scan.rs
      72 src/quality/detector.rs
     104 src/config.rs
     111 src/postprocess/wrist_twist.rs
     115 src/source_anim.rs
     120 src/adapters/arp_vrm_user_pose.rs
     127 src/types.rs
     146 src/lib.rs
     161 src/quality/fk_evaluate.rs
     172 src/finger_rest_align.rs
     179 tests/finger_rest_align.rs
     183 tests/integration.rs
     209 src/bin/retarget_test.rs
     291 src/quality/diagnostic.rs
     300 src/quality/mod.rs
     301 src/orchestrate.rs
     307 src/finger_axis_map.rs
     324 src/quality/score.rs
     331 tests/fixtures/mod.rs
     391 src/quality/validate.rs
     398 src/quality/rubric_b.rs
     438 src/bin/fbx_summary_scratch.rs
     479 src/adapters/arp_vrm.rs
     479 src/mapping.rs
     578 src/quality/rubric_a.rs
     617 tests/metric_fixtures.rs
     708 src/vrm_rest.rs
     751 src/retargeter.rs
     828 src/quality/rubric_c.rs
    9435 total
```

## Source files — full content (LOC ≤ 500)

### `src/orchestrate.rs` (     301 LOC)

```rust
//! A → B → gate → C pipeline orchestration.
//!
//! Single entry point that runs all three rubrics in the correct order
//! with proper gating, returns a unified [`PipelineResult`]. This is the
//! shape `shotloom-import::import_and_validate` will mirror once the
//! shotloom port lands; until then bevy-vrm callers (sweep bin, viewer
//! diagnostic mode, future tests) use the same API.
//!
//! ## Why orchestration lives in its own module
//!
//! The bin already runs A → B → C inline. Extracting into a free
//! function:
//! - **Centralises the order** — gating checks happen in one place
//!   instead of every caller re-implementing them.
//! - **Returns structured output** — diagnostics, gating reason, and
//!   each rubric result are all in one struct so downstream consumers
//!   (Display, JSON serialise, shotloom import) format from the same
//!   shape.
//! - **Mirrors shotloom-import** — when the port lands, the shotloom
//!   side has a function with the same input/output contract, just
//!   importing from `shotloom-retarget` instead of `humanoid_retarget`.
//!
//! ## What this is not
//!
//! - Not a trait — single concrete impl is fine. Tier 1 lesson stands.
//! - Not a builder pattern — function takes refs to inputs the caller
//!   already owns.
//! - Not the only path — callers with custom needs (per-bone overrides,
//!   alternative retargeter impls) still call rubrics directly.

use std::collections::HashMap;

use glam::Quat;

use crate::config::RetargetConfig;
use crate::fbx::SourceAsset;
use crate::quality::{
    Diagnostic, RubricResult, check_gating, rubric_a, rubric_b, rubric_c,
    fk_evaluate, rubric_to_diagnostics,
};
use crate::types::{TargetAnimation, VrmRestPose};
use crate::vrm_compat::VrmVersion;

/// Outcome of running the A → B → gate → C pipeline.
///
/// Field availability depends on how far the pipeline ran:
///
/// - **All three rubrics + retarget output**: `rubric_a`, `rubric_b`,
///   and `rubric_c` are `Some`, `target_animation` is `Some`,
///   `gated_reason` is `None`, `error` is `None`.
/// - **Gated at A or B**: `rubric_a`, `rubric_b` are `Some` (one has a
///   hard fail), `rubric_c` and `target_animation` are `None`,
///   `gated_reason` is `Some(reason)`.
/// - **Pipeline error**: `error` is `Some(message)`. Rubrics may be
///   partial — whatever ran before the error is included.
///
/// `diagnostics` is always populated from whichever rubrics ran.
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
    pub fn is_evaluated(&self) -> bool {
        self.rubric_c.is_some()
    }
    pub fn is_gated(&self) -> bool {
        self.gated_reason.is_some()
    }
    pub fn has_error(&self) -> bool {
        self.error.is_some()
    }
}

/// Run the A → B → gate → C pipeline against a parsed source animation
/// and a target VRM rest pose.
///
/// Caller responsibility:
/// - Parse FBX bytes into a [`SourceAsset`] (FBX-format-level concern,
///   not a pipeline step).
/// - Extract / build [`VrmRestPose`] (VRM-format-level concern).
///
/// Pipeline responsibility:
/// 1. Run [`rubric_a::evaluate`] on the source.
/// 2. Run [`rubric_b::evaluate`] on the VRM rest.
/// 3. Check gating via [`check_gating`]. If either rubric A or B has a
///    hard fail, skip Rubric C and return a gated result.
/// 4. Otherwise, run mapping → retargeter → FK evaluate → Rubric C.
/// 5. Aggregate all rubric results into a flat list of [`Diagnostic`].
///
/// Returns a [`PipelineResult`] with all available data and diagnostics.
pub fn evaluate_pipeline(
    source_asset: &SourceAsset,
    vrm_rest: &VrmRestPose,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> PipelineResult {
    let mut result = PipelineResult {
        rubric_a: None,
        rubric_b: None,
        rubric_c: None,
        target_animation: None,
        gated_reason: None,
        error: None,
        diagnostics: Vec::new(),
    };

    // Step 1: Rubric A (source animation quality)
    let score_a = rubric_a::evaluate(source_asset);
    result.diagnostics.extend(rubric_to_diagnostics(&score_a));
    result.rubric_a = Some(score_a);

    // Step 2: Rubric B (target model quality)
    let score_b = rubric_b::evaluate(vrm_rest);
    result.diagnostics.extend(rubric_to_diagnostics(&score_b));
    result.rubric_b = Some(score_b);

    // Step 3: Gating check
    let (a_ref, b_ref) = (
        result.rubric_a.as_ref().unwrap(),
        result.rubric_b.as_ref().unwrap(),
    );
    if let Some(reason) = check_gating(a_ref, b_ref) {
        result.gated_reason = Some(reason);
        return result;
    }

    // Step 4: Build mapped animation
    let mapped = match crate::mapping::retarget(source_asset, config, vrm_version) {
        Ok(m) => m,
        Err(e) => {
            result.error = Some(format!("mapping failed: {}", e));
            return result;
        }
    };

    // Step 5: Compute FBX skeleton frames for vis + Rubric C C1.4 fidelity
    let fbx_skeleton = match crate::compute_fbx_skeleton_from_parsed(source_asset) {
        Ok(s) => s,
        Err(e) => {
            result.error = Some(format!("compute_fbx_skeleton failed: {}", e));
            return result;
        }
    };

    // Step 6: Run retargeter (default options — viewer-side overrides
    // are a separate concern handled in src/retarget.rs).
    let vrm_to_fbx: HashMap<&str, &str> = mapped
        .bone_tracks
        .iter()
        .map(|t| (t.vrm_bone_name.as_str(), t.src_bone_name.as_str()))
        .collect();
    let fbx_root = vrm_to_fbx.get("VRMC_vrm.root_bone").copied().unwrap_or("");
    let fbx_hips = vrm_to_fbx.get("hips").copied().unwrap_or("");

    let retargeter = crate::ArpRetargeterInner::new(
        vrm_rest.clone(),
        Some(fbx_skeleton.clone()),
        &mapped,
        fbx_root,
        fbx_hips,
    );
    let retarget_output = retargeter.apply(&mapped);

    // Step 7: FK evaluate the retarget output
    let vrm_fk = fk_evaluate::evaluate(&retarget_output, vrm_rest);

    // Step 8: Build residual inputs from the mapped animation.
    //
    // - src_rotations_by_vrm: per-VRM-bone source track, fed to C1.3
    //   Stability residual (frame-to-frame delta comparison).
    // - vrm_to_fbx_name: per-VRM-bone FBX bone name, used by C1.1 to
    //   look up FBX-side positions in fbx_skeleton for world-space
    //   joint-triplet bend residuals.
    let mut src_rotations_by_vrm: HashMap<String, Vec<Quat>> = HashMap::new();
    let mut vrm_to_fbx_name: HashMap<String, String> = HashMap::new();
    for track in &mapped.bone_tracks {
        if let Some(bt) = source_asset.tracks.get(&track.src_bone_name) {
            src_rotations_by_vrm.insert(track.vrm_bone_name.clone(), bt.rotations.clone());
        }
        vrm_to_fbx_name.insert(track.vrm_bone_name.clone(), track.src_bone_name.clone());
    }

    // Step 9: Rubric C (retarget output quality)
    let score_c = rubric_c::evaluate(
        &vrm_fk,
        Some(&fbx_skeleton),
        &retarget_output,
        vrm_rest,
        Some(&src_rotations_by_vrm),
        Some(&vrm_to_fbx_name),
    );
    result.diagnostics.extend(rubric_to_diagnostics(&score_c));
    result.rubric_c = Some(score_c);
    result.target_animation = Some(retarget_output);

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::quality::Severity;

    /// PipelineResult helpers behave correctly across all three
    /// outcome shapes (evaluated, gated, error).
    #[test]
    fn outcome_helpers_evaluated() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: Some(RubricResult {
                rubric_name: "Retarget".into(),
                hard_fails: Vec::new(),
                metrics: Vec::new(),
                overall: crate::quality::Grade::A,
                overall_score: 95.0,
            }),
            target_animation: None,
            gated_reason: None,
            error: None,
            diagnostics: Vec::new(),
        };
        assert!(r.is_evaluated());
        assert!(!r.is_gated());
        assert!(!r.has_error());
    }

    #[test]
    fn outcome_helpers_gated() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: Some("rubric_a hard fail: x".into()),
            error: None,
            diagnostics: Vec::new(),
        };
        assert!(!r.is_evaluated());
        assert!(r.is_gated());
        assert!(!r.has_error());
    }

    #[test]
    fn outcome_helpers_error() {
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: None,
            error: Some("mapping failed: ...".into()),
            diagnostics: Vec::new(),
        };
        assert!(!r.is_evaluated());
        assert!(!r.is_gated());
        assert!(r.has_error());
    }

    /// Diagnostics aggregation — gated path collects A + B diagnostics
    /// but no C diagnostics.
    #[test]
    fn gated_path_aggregates_a_and_b_only() {
        // Construct a result mimicking what evaluate_pipeline produces
        // when gated at A: A has the hard fail, B is graded normally.
        let mut diags = Vec::new();
        diags.push(Diagnostic {
            severity: Severity::Error,
            code: "body_skin_present".into(),
            message: "hard fail (Source Animation): facial-only".into(),
            location: Some("Source Animation".into()),
            suggestion: None,
            recoverable: false,
        });
        diags.push(Diagnostic {
            severity: Severity::Info,
            code: "B1.2_Proportion".into(),
            message: "minor proportion deviation".into(),
            location: Some("Model".into()),
            suggestion: None,
            recoverable: true,
        });
        let r = PipelineResult {
            rubric_a: None,
            rubric_b: None,
            rubric_c: None,
            target_animation: None,
            gated_reason: Some("rubric_a hard fail: body_skin_present".into()),
            error: None,
            diagnostics: diags,
        };
        assert_eq!(r.diagnostics.len(), 2);
        assert_eq!(crate::quality::aggregate_severity(&r.diagnostics), Some(Severity::Error));
    }
}
```

### `src/types.rs` (     127 LOC)

```rust
use glam::{Quat, Vec3};
use std::collections::HashMap;

/// Heel/toe contact points for foot flattening (aim IK).
#[derive(Clone, Debug)]
pub struct FootContactData {
    /// (heel_offset_y, toe_offset_y, heel_local_z, toe_local_z) for left foot.
    /// heel/toe_local_z = vertex_z - ankle_z (negative = behind ankle).
    pub left: FootSideContact,
    /// Same for right foot.
    pub right: FootSideContact,
}

#[derive(Clone, Debug)]
pub struct FootSideContact {
    pub heel_offset_y: f32,
    pub toe_offset_y: f32,
    /// Z of heel vertex relative to ankle (negative = behind)
    pub heel_local_z: f32,
    /// Z of toe vertex relative to ankle (positive = in front)
    pub toe_local_z: f32,
}

/// Pure VRM rest pose data — extracted from Bevy entities, no engine dependency.
#[derive(Clone)]
pub struct VrmRestPose {
    /// vrm_bone_name → local rest rotation
    pub bone_rest_local: HashMap<String, Quat>,
    /// vrm_bone_name → skeleton-space global rest rotation
    pub bone_rest_global: HashMap<String, Quat>,
    /// vrm_bone_name → local rest translation
    pub bone_rest_translation: HashMap<String, Vec3>,
    /// vrm_bone_name → world position at rest (for A-pose detection)
    pub bone_world_position: HashMap<String, Vec3>,
    /// vrm_bone_name → parent vrm_bone_name
    pub parent_map: HashMap<String, String>,
    /// VRM hips world-space Y position at rest
    pub hips_height: f32,
    /// Root bone rest rotation — used to detect 180°Y baked models
    pub root_rest_rotation: Quat,
    /// Virtual global orientation for identity-rest bones (VRM 1.0).
    /// Computed from bone→child direction vectors. Used in place of
    /// bone_rest_global when dst_rest is identity to fix bone-mesh mismatch.
    pub virtual_rest_global: HashMap<String, Quat>,
    /// Distance from foot bone to lowest mesh vertex (sole offset).
    /// Used to prevent feet from floating or sinking through ground.
    /// (left_offset, right_offset) in meters. 0.0 if not computed.
    pub foot_sole_offset: (f32, f32),
    /// Heel and toe contact data for foot flattening.
    /// (heel_offset_y, toe_offset_y, heel_to_toe_z_distance) per foot.
    /// heel/toe_offset = ankle_bone_Y - vertex_Y (positive = below ankle).
    /// Used to compute foot rotation for ground-plane alignment.
    pub foot_contact: Option<FootContactData>,
}

/// Per-bone output from the retargeter.
pub struct RetargetedBone {
    pub vrm_bone_name: String,
    pub rotations: Vec<Quat>,
    pub translations: Option<Vec<Vec3>>,
}

/// Complete retarget output ready for animation clip creation.
pub struct TargetAnimation {
    pub duration_secs: f32,
    pub bones: Vec<RetargetedBone>,
    pub expression_tracks: Vec<ExpressionTrack>,
    pub log: Vec<String>,
    pub quality: crate::quality::RetargetQuality,
    pub score: Option<crate::quality::RetargetScore>,
}

#[derive(Debug)]
pub struct MappedAnimation {
    pub name: String,
    pub duration_secs: f32,
    pub bone_tracks: Vec<BoneTrack>,
    pub expression_tracks: Vec<ExpressionTrack>,
    /// Detected FBX source type (Blender, UE, etc.)
    pub source_detected: crate::config::FbxSourceType,
    /// Resolved source type (config override or detected)
    pub source_resolved: crate::config::FbxSourceType,
}

#[derive(Debug, Clone)]
pub struct ExpressionTrack {
    pub vrm_expression_name: String,
    pub weights: Vec<f32>,
}

#[derive(Debug)]
pub struct BoneTrack {
    pub vrm_bone_name: String,
    /// FBX bone name (with prefix, for looking up world rotations)
    pub src_bone_name: String,
    pub timestamps: Vec<f32>,
    /// Raw animation (Lcl Rotation as quat, WITHOUT PreRotation)
    pub rotations: Vec<Quat>,
    pub translations: Option<Vec<Vec3>>,
    /// Source bone LOCAL rest rotation (FBX PreRotation only, for src_local = src_local_rest * delta)
    pub src_local_rest: Quat,
    /// Source bone GLOBAL rest rotation (accumulated PreRotation + Lcl Rotation rest)
    pub src_global_rest: Quat,
    /// Source bone PARENT's global rest rotation
    pub src_parent_global_rest: Quat,
}

/// Decompose a quaternion into swing and twist components around a given axis.
pub fn swing_twist_decompose(q: Quat, twist_axis: Vec3) -> (Quat, Quat) {
    let proj = Vec3::new(q.x, q.y, q.z).dot(twist_axis) * twist_axis;
    let twist = Quat::from_xyzw(proj.x, proj.y, proj.z, q.w).normalize();
    let swing = q * twist.inverse();
    (swing, twist)
}

pub use fbx_rig::FbxSkeletonFrames;

pub struct FbxDiagnostics {
    pub all_bones: Vec<String>,
    pub animated_bones: Vec<String>,
    pub matched_direct: Vec<(String, String)>,
    pub unmatched_config: Vec<String>,
    pub blend_shape_channels: Vec<String>,
    pub source_detected: crate::config::FbxSourceType,
    pub source_resolved: crate::config::FbxSourceType,
    pub creator: Option<String>,
}
```

### `src/bin/pop_scan.rs` (      63 LOC)

```rust
//! Scan FBX rotation tracks for frame-to-frame pops (angular jumps).
//! Reports all bones/frames where delta exceeds threshold.
//!
//! Usage: pop_scan <fbx_path> [threshold_deg=5]

use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: pop_scan <fbx_path> [threshold_deg=5]");
        std::process::exit(2);
    }
    let threshold: f32 = args.get(2).and_then(|s| s.parse().ok()).unwrap_or(5.0);

    let bytes = fs::read(&args[1]).expect("read fbx");
    let data = fbx_rig::parse(&bytes).expect("parse");

    println!("FBX: {}", args[1]);
    println!("Bones: {}, Frames: {}, Threshold: {:.1}°", data.bones.len(), data.frame_count, threshold);
    println!();

    let mut pops: Vec<(String, usize, f32, f32, f32)> = Vec::new();

    for (name, track) in &data.tracks {
        let rots = &track.rotations;
        for i in 1..rots.len() {
            let delta_deg = rots[i - 1].angle_between(rots[i]).to_degrees();
            if delta_deg > threshold {
                let prev_deg = rots[i - 1].angle_between(glam::Quat::IDENTITY).to_degrees();
                let curr_deg = rots[i].angle_between(glam::Quat::IDENTITY).to_degrees();
                pops.push((name.clone(), i, delta_deg, prev_deg, curr_deg));
            }
        }
    }

    pops.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap());

    println!("{:<30} {:>6} {:>8} {:>8} {:>8}", "bone", "frame", "delta", "prev|I|", "curr|I|");
    println!("{}", "-".repeat(64));
    for (name, frame, delta, prev, curr) in pops.iter().take(50) {
        println!("{:<30} {:>6} {:>8.1} {:>8.1} {:>8.1}", name, frame, delta, prev, curr);
    }
    if pops.is_empty() {
        println!("No pops found above {:.1}°", threshold);
    } else {
        println!("\nTotal pops: {}", pops.len());

        // Per-bone breakdown
        let mut by_bone: std::collections::HashMap<&str, usize> =
            std::collections::HashMap::new();
        for (name, _, _, _, _) in &pops {
            *by_bone.entry(name.as_str()).or_insert(0) += 1;
        }
        let mut sorted: Vec<(&&str, &usize)> = by_bone.iter().collect();
        sorted.sort_by(|a, b| b.1.cmp(a.1));
        println!("\nPer-bone breakdown:");
        for (name, count) in sorted {
            println!("  {:<30} {:>6}", name, count);
        }
    }
}
```

### `src/bin/validate_pipeline.rs` (      31 LOC)

```rust
//! CLI: validate the full FBX→VRM retarget pipeline.
//!
//! Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>

use std::env;
use std::fs;
use std::process;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("Usage: validate-pipeline <config.json> <fbx_path> <vrm_path>");
        process::exit(2);
    }

    let config_json = fs::read_to_string(&args[1]).expect("read config");
    let fbx_bytes = fs::read(&args[2]).expect("read fbx");
    let vrm_bytes = fs::read(&args[3]).expect("read vrm");

    let result = humanoid_retarget::quality::validate::validate_pipeline(
        &config_json,
        &fbx_bytes,
        &vrm_bytes,
    );

    print!("{}", result);

    if !result.all_passed {
        process::exit(1);
    }
}
```

### `src/bin/fbx_summary_scratch.rs` (     438 LOC)

```rust
use fbx_rig::fbxcel::low::v7400::AttributeValue;
use fbx_rig::fbxcel::pull_parser::any::AnyParser;
use fbx_rig::fbxcel::pull_parser::v7400::Event;
use fbx_rig::fbxcel::pull_parser::v7400::attribute::loaders::DirectLoader;
use fbx_rig::{SourceAsset, euler_to_quat, parse};
use glam::Quat;
use std::collections::{BTreeMap, HashMap};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

const SAMPLE_RATE: f32 = 30.0;
const FBX_TIME_UNIT: f64 = 46186158000.0;

const STANDARD_BONES: &[(&str, &[&str])] = &[
    ("Hips", &["root.x", "c_root_master.x", "hips"]),
    ("Spine", &["spine_01.x", "spine.x", "spine"]),
    ("Chest", &["spine_02.x", "chest.x", "chest"]),
    ("Neck", &["neck.x", "neck"]),
    ("Head", &["head.x", "head"]),
    ("L Shoulder", &["shoulder.l", "c_shoulder.l", "leftShoulder"]),
    ("R Shoulder", &["shoulder.r", "c_shoulder.r", "rightShoulder"]),
    ("L UpperArm", &["arm_stretch.l", "arm.l", "c_arm_fk.l", "leftUpperArm"]),
    ("R UpperArm", &["arm_stretch.r", "arm.r", "c_arm_fk.r", "rightUpperArm"]),
    ("L LowerArm", &["forearm_stretch.l", "forearm.l", "c_forearm_fk.l", "leftLowerArm"]),
    ("R LowerArm", &["forearm_stretch.r", "forearm.r", "c_forearm_fk.r", "rightLowerArm"]),
    ("L Hand", &["hand.l", "c_hand_fk.l", "c_hand.l", "leftHand"]),
    ("R Hand", &["hand.r", "c_hand_fk.r", "c_hand.r", "rightHand"]),
    ("L UpLeg", &["thigh_stretch.l", "thigh.l", "c_thigh_fk.l", "leftUpperLeg"]),
    ("R UpLeg", &["thigh_stretch.r", "thigh.r", "c_thigh_fk.r", "rightUpperLeg"]),
    ("L Leg", &["leg_stretch.l", "leg.l", "c_leg_fk.l", "leftLowerLeg"]),
    ("R Leg", &["leg_stretch.r", "leg.r", "c_leg_fk.r", "rightLowerLeg"]),
    ("L Foot", &["foot.l", "c_foot_fk.l", "c_foot.l", "leftFoot"]),
    ("R Foot", &["foot.r", "c_foot_fk.r", "c_foot.r", "rightFoot"]),
];

#[derive(Debug)]
struct FileSummary {
    file: String,
    bone_count: usize,
    roots: Vec<String>,
    frame_count: usize,
    fps: f32,
    duration: f32,
    negative_start_frame: Option<f32>,
    missing_standard: Vec<&'static str>,
    rest_vs_frame0: Vec<(String, f32)>,
    jitter_bones: Vec<(String, f32)>,
    weird_names: Vec<String>,
    creator: String,
    source_type: String,
    severity: String,
    retarget_risk: Vec<String>,
}

fn main() {
    let dir = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("../../assets/fbx"));

    let mut files: Vec<PathBuf> = fs::read_dir(&dir)
        .expect("failed to read fbx dir")
        .filter_map(|entry| entry.ok().map(|e| e.path()))
        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("fbx"))
        .collect();
    files.sort();

    println!("# FBX Summary Scratch");
    println!("dir: {}", dir.display());
    println!("files: {}", files.len());

    for path in files {
        match analyze_file(&path) {
            Ok(summary) => print_summary(&summary),
            Err(err) => {
                println!("---");
                println!("FILE: {}", path.display());
                println!("STATUS: ERROR");
                println!("ERROR: {}", err);
            }
        }
    }
}

fn analyze_file(path: &Path) -> Result<FileSummary, String> {
    let bytes = fs::read(path).map_err(|e| format!("read failed: {e}"))?;
    let fbx = parse(&bytes).map_err(|e| format!("parse failed: {e}"))?;
    let min_key_time = scan_min_key_time_secs(&bytes)?;

    let mut roots: Vec<String> = fbx
        .bones
        .iter()
        .filter(|(_, bone)| bone.parent.is_none())
        .map(|(name, _)| name.clone())
        .collect();
    roots.sort();

    let missing_standard = STANDARD_BONES
        .iter()
        .filter(|(_, aliases)| !has_any_bone(&fbx.bones, aliases))
        .map(|(label, _)| *label)
        .collect::<Vec<_>>();

    let mut rest_vs_frame0 = Vec::new();
    for (name, bone) in &fbx.bones {
        let rest = euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
        let frame0 = fbx
            .tracks
            .get(name)
            .and_then(|track| track.rotations.first())
            .copied()
            .unwrap_or(rest);
        let diff = quat_angle_deg(rest, frame0);
        if diff >= 5.0 {
            rest_vs_frame0.push((name.clone(), diff));
        }
    }
    rest_vs_frame0.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut jitter_bones = detect_jitter(&fbx);
    jitter_bones.sort_by(|a, b| b.1.total_cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut weird_names: Vec<String> = fbx
        .bones
        .keys()
        .filter(|name| is_weird_bone_name(name))
        .cloned()
        .collect();
    weird_names.sort();

    let fps = if fbx.duration > 0.0 {
        ((fbx.frame_count.saturating_sub(1)) as f32 / fbx.duration).max(0.0)
    } else {
        SAMPLE_RATE
    };
    let negative_start_frame = min_key_time
        .filter(|secs| *secs < 0.0)
        .map(|secs| (secs as f32) * SAMPLE_RATE);

    let severity = classify(
        &roots,
        &missing_standard,
        &rest_vs_frame0,
        &jitter_bones,
        negative_start_frame,
    );
    let retarget_risk = retarget_risks(
        &roots,
        &missing_standard,
        &rest_vs_frame0,
        &jitter_bones,
        negative_start_frame,
    );

    Ok(FileSummary {
        file: path.file_name().unwrap().to_string_lossy().into_owned(),
        bone_count: fbx.bones.len(),
        roots,
        frame_count: fbx.frame_count,
        fps,
        duration: fbx.duration,
        negative_start_frame,
        missing_standard,
        rest_vs_frame0,
        jitter_bones,
        weird_names,
        creator: fbx.creator.unwrap_or_else(|| "-".to_string()),
        source_type: fbx.detected_source_type.to_string(),
        severity,
        retarget_risk,
    })
}

fn has_any_bone(bones: &HashMap<String, fbx_rig::FbxBone>, aliases: &[&str]) -> bool {
    aliases.iter().any(|name| bones.contains_key(*name))
}

fn quat_angle_deg(a: Quat, b: Quat) -> f32 {
    let d = a.inverse() * b;
    d.to_axis_angle().1.abs().to_degrees()
}

fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
    let mut out = Vec::new();
    for (name, track) in &fbx.tracks {
        if track.rotations.len() < 5 {
            continue;
        }

        let steps: Vec<f32> = track
            .rotations
            .windows(2)
            .map(|w| quat_angle_deg(w[0], w[1]))
            .collect();
        if steps.len() < 3 {
            continue;
        }

        let avg = steps.iter().copied().sum::<f32>() / steps.len() as f32;
        let mut spike = 0.0f32;
        for i in 1..steps.len() - 1 {
            let prev = steps[i - 1];
            let cur = steps[i];
            let next = steps[i + 1];
            if cur > 12.0 && cur > prev * 2.5 && cur > next * 2.5 {
                spike = spike.max(cur);
            }
        }
        if spike > 0.0 && (avg < 8.0 || spike > avg * 3.0) {
            out.push((name.clone(), spike));
        }
    }
    out
}

fn is_weird_bone_name(name: &str) -> bool {
    if name.chars().any(|c| c.is_whitespace()) {
        return true;
    }
    !name
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '_' | ':' | '-'))
}

fn classify(
    _roots: &[String],
    missing_standard: &[&str],
    rest_vs_frame0: &[(String, f32)],
    jitter_bones: &[(String, f32)],
    negative_start_frame: Option<f32>,
) -> String {
    let essential_missing = missing_standard.len();
    let rest_critical = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 20.0).count();
    let rest_warn = rest_vs_frame0.iter().filter(|(_, deg)| *deg >= 5.0).count();
    let jitter_count = jitter_bones.len();

    if essential_missing >= 6 || !missing_standard.is_empty() && !has_hips(missing_standard)
        || negative_start_frame.is_some()
    {
        "위험".to_string()
    } else if essential_missing >= 1 || rest_warn >= 1 || rest_critical >= 1 || jitter_count >= 1 {
        "주의".to_string()
    } else {
        "안전".to_string()
    }
}

fn retarget_risks(
    roots: &[String],
    missing_standard: &[&str],
    rest_vs_frame0: &[(String, f32)],
    jitter_bones: &[(String, f32)],
    negative_start_frame: Option<f32>,
) -> Vec<String> {
    let mut risks = Vec::new();
    if roots.len() > 1 {
        risks.push(format!("다중 루트: {}", roots.join(", ")));
    }
    if !missing_standard.is_empty() {
        risks.push(format!("표준 본 누락: {}", missing_standard.join(", ")));
    }

    let major_rest: Vec<String> = rest_vs_frame0
        .iter()
        .filter(|(_, deg)| *deg >= 20.0)
        .take(4)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect();
    if !major_rest.is_empty() {
        risks.push(format!("rest-frame0 큰 차이: {}", major_rest.join(", ")));
    }

    let jitter: Vec<String> = jitter_bones
        .iter()
        .take(4)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect();
    if !jitter.is_empty() {
        risks.push(format!("jitter 후보: {}", jitter.join(", ")));
    }

    if let Some(start_frame) = negative_start_frame {
        risks.push(format!("음수 시작 프레임 {:.1}", start_frame));
    }

    if risks.is_empty() {
        risks.push("특이 리스크 없음".to_string());
    }
    risks
}

fn has_hips(missing_standard: &[&str]) -> bool {
    !missing_standard.iter().any(|name| *name == "Hips")
}

fn print_summary(summary: &FileSummary) {
    println!("---");
    println!("FILE: {}", summary.file);
    println!("STATUS: OK");
    println!("SEVERITY: {}", summary.severity);
    println!("BONES: {}", summary.bone_count);
    println!("ROOTS: {}", summary.roots.join(", "));
    println!("FRAMES: {}", summary.frame_count);
    println!("FPS: {:.2}", summary.fps);
    println!("DURATION: {:.3}", summary.duration);
    println!(
        "NEGATIVE_START_FRAME: {}",
        summary
            .negative_start_frame
            .map(|v| format!("{v:.2}"))
            .unwrap_or_else(|| "none".to_string())
    );
    println!(
        "MISSING_STANDARD: {}",
        if summary.missing_standard.is_empty() {
            "none".to_string()
        } else {
            summary.missing_standard.join(", ")
        }
    );
    println!(
        "REST_FRAME0_5DEG: {}",
        format_pairs(&summary.rest_vs_frame0, 12)
    );
    println!("JITTER: {}", format_pairs(&summary.jitter_bones, 8));
    println!(
        "WEIRD_NAMES: {}",
        if summary.weird_names.is_empty() {
            "none".to_string()
        } else {
            summary.weird_names.join(", ")
        }
    );
    println!("CREATOR: {}", summary.creator);
    println!("SOURCE_TYPE: {}", summary.source_type);
    println!("RETARGET_RISK: {}", summary.retarget_risk.join(" | "));
}

fn format_pairs(values: &[(String, f32)], limit: usize) -> String {
    if values.is_empty() {
        return "none".to_string();
    }
    let mut parts = values
        .iter()
        .take(limit)
        .map(|(name, deg)| format!("{name} {:.1}°", deg))
        .collect::<Vec<_>>();
    if values.len() > limit {
        parts.push(format!("... +{}", values.len() - limit));
    }
    parts.join(", ")
}

fn scan_min_key_time_secs(bytes: &[u8]) -> Result<Option<f64>, String> {
    let cursor = Cursor::new(bytes);
    let reader = std::io::BufReader::new(cursor);
    let mut parser = match AnyParser::from_seekable_reader(reader)
        .map_err(|e| format!("FBX header: {e}"))?
    {
        AnyParser::V7400(p) => p,
        _ => return Err("unsupported FBX version".to_string()),
    };

    let mut top_section = String::new();
    let mut depth = 0i32;
    let mut min_key_time = f64::MAX;

    loop {
        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
            Event::StartNode(node) => {
                depth += 1;
                let name = node.name().to_string();
                if depth == 1 {
                    top_section = name;
                    continue;
                }
                if top_section == "Objects" && name == "AnimationCurve" {
                    let mut curve_depth = depth;
                    loop {
                        match parser.next_event().map_err(|e| format!("FBX parse: {e}"))? {
                            Event::StartNode(child) => {
                                curve_depth += 1;
                                let child_name = child.name().to_string();
                                let mut attrs: Vec<AttributeValue> = Vec::new();
                                let mut reader = child.attributes();
                                while let Ok(Some(attr)) = reader.load_next(DirectLoader) {
                                    attrs.push(attr);
                                }
                                if child_name == "KeyTime"
                                    && let Some(arr) =
                                        attrs.first().and_then(|a| a.get_arr_i64())
                                    && let Some(local_min) = arr.iter().min()
                                {
                                    let secs = *local_min as f64 / FBX_TIME_UNIT;
                                    min_key_time = min_key_time.min(secs);
                                }
                            }
                            Event::EndNode => {
                                curve_depth -= 1;
                                if curve_depth < depth {
                                    depth -= 1;
                                    break;
                                }
                            }
                            Event::EndFbx(_) => {
                                return Ok(if min_key_time == f64::MAX {
                                    None
                                } else {
                                    Some(min_key_time)
                                });
                            }
                        }
                    }
                }
            }
            Event::EndNode => {
                depth -= 1;
            }
            Event::EndFbx(_) => {
                return Ok(if min_key_time == f64::MAX {
                    None
                } else {
                    Some(min_key_time)
                });
            }
        }
    }
}

#[allow(dead_code)]
fn _group_counts_by_severity(items: &[FileSummary]) -> BTreeMap<&str, usize> {
    let mut out = BTreeMap::new();
    for item in items {
        *out.entry(item.severity.as_str()).or_insert(0) += 1;
    }
    out
}
```

### `src/bin/retarget_test.rs` (     209 LOC)

```rust
//! Unified retarget quality test runner.
//!
//! Scans VRM models × FBX animations, runs full pipeline + rubric A/B/C scoring.
//!
//! Usage:
//!   retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]

use std::{env, fs, path::Path};
use humanoid_retarget::quality::{rubric_a, rubric_b};
use humanoid_retarget::orchestrate::evaluate_pipeline;
use humanoid_retarget::config::RetargetConfig;
use humanoid_retarget::vrm_compat::VrmVersion;

fn main() {
    let args: Vec<String> = env::args().collect();
    if args.len() < 4 {
        eprintln!("Usage: retarget-test <models_dir> <fbx_dir> <config_path> [--save output.json] [--baseline baseline.json]");
        std::process::exit(2);
    }

    let models_dir = &args[1];
    let fbx_dir = &args[2];
    let config_path = &args[3];
    let save_path = args.iter().position(|a| a == "--save").map(|i| args[i + 1].clone());
    let _baseline_path = args.iter().position(|a| a == "--baseline").map(|i| args[i + 1].clone());

    let config_json = fs::read_to_string(config_path)
        .unwrap_or_else(|e| { eprintln!("Failed to read config {}: {}", config_path, e); std::process::exit(1); });
    let config = RetargetConfig::from_json(&config_json)
        .unwrap_or_else(|e| { eprintln!("Failed to parse config: {}", e); std::process::exit(1); });

    // Scan directories
    let vrm_files = scan_dir(models_dir, "vrm");
    let fbx_files = scan_dir(fbx_dir, "fbx");

    println!("Found {} VRM models, {} FBX animations", vrm_files.len(), fbx_files.len());
    println!();

    // ===== Rubric A: Source Animation Quality =====
    // Cache results by FBX path so the C loop can gate on hard-fail
    // status without re-running A.
    println!("===== Rubric A: Source Animation Quality =====");
    let mut rubric_a_cache: std::collections::HashMap<String, humanoid_retarget::quality::RubricResult> =
        std::collections::HashMap::new();
    for fbx_path in &fbx_files {
        let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
        let fbx_bytes = match fs::read(fbx_path) {
            Ok(b) => b,
            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(fbx_name, 42), e); continue; }
        };
        let fbx = match humanoid_retarget::fbx::parse(&fbx_bytes) {
            Ok(f) => f,
            Err(e) => { println!("{:<42} PARSE FAIL — {}", truncate(fbx_name, 42), e); continue; }
        };
        let score_a = rubric_a::evaluate(&fbx);
        println!("{:<42} {}", truncate(fbx_name, 42), score_a);
        rubric_a_cache.insert(fbx_path.clone(), score_a);
    }
    println!();

    // ===== Rubric B: Model Quality =====
    println!("===== Rubric B: Model Quality =====");

    // Parse VRM files and store rest pose + cached B result for the C loop's gating.
    let mut vrm_data: Vec<(String, Vec<u8>, humanoid_retarget::types::VrmRestPose, VrmVersion, humanoid_retarget::quality::RubricResult)> = Vec::new();

    for vrm_path in &vrm_files {
        let vrm_name = Path::new(vrm_path).file_name().unwrap().to_str().unwrap();
        let vrm_bytes = match fs::read(vrm_path) {
            Ok(b) => b,
            Err(e) => { println!("{:<42} READ FAIL — {}", truncate(vrm_name, 42), e); continue; }
        };

        // Detect and handle VRM 0.x
        let is_vrm0 = humanoid_retarget::vrm0_compat::is_vrm0(&vrm_bytes);
        let name_suggests_0x = vrm_name.contains("_0x_") || vrm_name.contains("0x_");
        let vrm_version = if is_vrm0 || name_suggests_0x { VrmVersion::V0x } else { VrmVersion::V1_0 };

        let working_bytes: Vec<u8>;
        let vrm_data_bytes: &[u8] = if is_vrm0 {
            match humanoid_retarget::vrm0_compat::convert(&vrm_bytes) {
                Ok(converted) => { working_bytes = converted; &working_bytes }
                Err(e) => { println!("{:<42} VRM0 CONVERT FAIL — {}", truncate(vrm_name, 42), e); continue; }
            }
        } else {
            &vrm_bytes
        };

        let rest = match humanoid_retarget::vrm_rest::extract_vrm_rest_pose(vrm_data_bytes) {
            Ok(r) => r,
            Err(e) => { println!("{:<42} REST EXTRACT FAIL — {}", truncate(vrm_name, 42), e); continue; }
        };

        let score_b = rubric_b::evaluate(&rest);
        println!("{:<42} {}", truncate(vrm_name, 42), score_b);

        // Store converted bytes if vrm0, original otherwise
        let store_bytes = if is_vrm0 { vrm_data_bytes.to_vec() } else { vrm_bytes };
        vrm_data.push((vrm_name.to_string(), store_bytes, rest, vrm_version, score_b));
    }
    println!();

    // ===== Rubric C: Retarget Output Quality =====
    println!("===== Rubric C: Retarget Output Quality =====");

    let mut pass_count = 0usize;
    let mut fail_count = 0usize;
    let mut gated_count = 0usize;
    let mut total = 0usize;

    for (vrm_name, _vrm_bytes, vrm_rest, vrm_version, score_b) in &vrm_data {
        for fbx_path in &fbx_files {
            let fbx_name = Path::new(fbx_path).file_name().unwrap().to_str().unwrap();
            total += 1;

            let label = format!("{} x {}", truncate(vrm_name, 20), truncate(fbx_name, 25));

            // Pre-gating peek for cache-miss handling: bin's A loop
            // prints PARSE FAIL and skips caching, so a missing entry
            // means upstream parse failed. Keep the sweep behavior
            // identical by suppressing the C row in that case
            // (evaluate_pipeline would re-parse and double-print).
            if rubric_a_cache.get(fbx_path).is_none() {
                println!("{:<48} GATED — rubric_a missing (upstream parse fail)", label);
                gated_count += 1;
                continue;
            }
            // Quick gate on cached B before reading bytes — same effect
            // as evaluate_pipeline's gate, but skips a file read on the
            // common B-hard-fail row.
            if let Some(name) = score_b.first_hard_fail() {
                println!("{:<48} GATED — rubric_b hard fail: {}", label, name);
                gated_count += 1;
                continue;
            }

            let fbx_bytes = match fs::read(fbx_path) {
                Ok(b) => b,
                Err(e) => { println!("{:<48} READ FAIL — {}", label, e); fail_count += 1; continue; }
            };
            let fbx_parsed = match humanoid_retarget::fbx::parse(&fbx_bytes) {
                Ok(f) => f,
                Err(e) => { println!("{:<48} PIPELINE FAIL — {}", label, e); fail_count += 1; continue; }
            };

            let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);

            if let Some(reason) = pipeline.gated_reason {
                println!("{:<48} GATED — {}", label, reason);
                gated_count += 1;
                continue;
            }
            if let Some(err) = pipeline.error {
                println!("{:<48} PIPELINE FAIL — {}", label, err);
                fail_count += 1;
                continue;
            }
            let score_c = match pipeline.rubric_c {
                Some(s) => s,
                None => { println!("{:<48} PIPELINE FAIL — no rubric C", label); fail_count += 1; continue; }
            };

            println!("{:<48} {}", label, score_c);
            // Surface detail for any metric that graded F or C
            for m in &score_c.metrics {
                if matches!(m.grade, humanoid_retarget::quality::Grade::F | humanoid_retarget::quality::Grade::C) {
                    println!("{:<48}   ↳ {} ({})", "", m.name, m.detail);
                }
            }
            pass_count += 1;
        }
    }

    println!();
    println!("===== Summary =====");
    println!("Total: {}  Pass: {}  Fail: {}  Gated: {}", total, pass_count, fail_count, gated_count);

    if let Some(path) = save_path {
        // Minimal JSON output — TODO: serialize full RubricResult if needed
        let json = format!(
            r#"{{"total":{},"pass":{},"fail":{}}}"#,
            total, pass_count, fail_count
        );
        match fs::write(&path, &json) {
            Ok(_) => println!("Results saved to {}", path),
            Err(e) => eprintln!("Failed to save results to {}: {}", path, e),
        }
    }
}

fn scan_dir(dir: &str, ext: &str) -> Vec<String> {
    let mut files = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().map(|e| e == ext).unwrap_or(false) {
                if let Some(s) = path.to_str() {
                    files.push(s.to_string());
                }
            }
        }
    }
    files.sort();
    files
}

fn truncate(s: &str, max: usize) -> &str {
    if s.len() > max { &s[..max] } else { s }
}
```

### `src/quality/fk_evaluate.rs` (     161 LOC)

```rust
//! FK evaluation: TargetAnimation → VrmSkeletonFrames
//! Computes per-bone per-frame world positions and rotations
//! by walking the VRM bone hierarchy (same as what Bevy FK does).

use glam::{Quat, Vec3};
use std::collections::{HashMap, HashSet};

/// Per-bone per-frame world positions and rotations,
/// evaluated via FK chain from TargetAnimation local rotations.
pub struct VrmSkeletonFrames {
    pub frame_count: usize,
    pub duration: f32,
    pub bone_positions: HashMap<String, Vec<Vec3>>,
    pub bone_rotations: HashMap<String, Vec<Quat>>,
}

/// Evaluate FK chain from retarget output.
pub fn evaluate(
    result: &crate::TargetAnimation,
    vrm_rest: &crate::types::VrmRestPose,
) -> VrmSkeletonFrames {
    // Determine frame count from first bone track that has rotations.
    let frame_count = result
        .bones
        .iter()
        .map(|b| b.rotations.len())
        .max()
        .unwrap_or(0);

    if frame_count == 0 {
        return VrmSkeletonFrames {
            frame_count: 0,
            duration: result.duration_secs,
            bone_positions: HashMap::new(),
            bone_rotations: HashMap::new(),
        };
    }

    // Build lookup: vrm_bone_name → index in result.bones
    let bone_index: HashMap<&str, usize> = result
        .bones
        .iter()
        .enumerate()
        .map(|(i, b)| (b.vrm_bone_name.as_str(), i))
        .collect();

    // Collect all bone names from rest pose.
    let all_bones: Vec<String> = vrm_rest.bone_rest_local.keys().cloned().collect();

    // Topological sort: parents before children.
    // Pattern mirrors compute_fbx_skeleton_from_parsed.
    let mut ordered: Vec<String> = Vec::new();
    let mut visited: HashSet<String> = HashSet::new();

    for start in &all_bones {
        if visited.contains(start.as_str()) {
            continue;
        }
        let mut chain: Vec<String> = Vec::new();
        let mut in_chain: HashSet<String> = HashSet::new();
        let mut current = start.clone();
        loop {
            if visited.contains(current.as_str()) || in_chain.contains(&current) {
                break;
            }
            in_chain.insert(current.clone());
            chain.push(current.clone());
            if let Some(parent) = vrm_rest.parent_map.get(&current) {
                current = parent.clone();
            } else {
                break;
            }
        }
        for name in chain.into_iter().rev() {
            if visited.insert(name.clone()) {
                ordered.push(name);
            }
        }
    }

    let mut bone_positions: HashMap<String, Vec<Vec3>> = HashMap::new();
    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();

    for frame in 0..frame_count {
        let mut world_transforms: HashMap<String, (Vec3, Quat)> = HashMap::new();

        for name in &ordered {
            // Local rotation: from retarget track if available, else rest pose.
            let local_rot = if let Some(&idx) = bone_index.get(name.as_str()) {
                let track = &result.bones[idx];
                track
                    .rotations
                    .get(frame)
                    .copied()
                    .unwrap_or_else(|| {
                        vrm_rest
                            .bone_rest_local
                            .get(name)
                            .copied()
                            .unwrap_or(Quat::IDENTITY)
                    })
            } else {
                vrm_rest
                    .bone_rest_local
                    .get(name)
                    .copied()
                    .unwrap_or(Quat::IDENTITY)
            };

            // Local translation: use per-frame translation from retarget track if present,
            // otherwise fall back to rest translation.
            let local_translation = if let Some(&idx) = bone_index.get(name.as_str()) {
                let track = &result.bones[idx];
                track
                    .translations
                    .as_ref()
                    .and_then(|ts| ts.get(frame).copied())
                    .unwrap_or_else(|| {
                        vrm_rest
                            .bone_rest_translation
                            .get(name)
                            .copied()
                            .unwrap_or(Vec3::ZERO)
                    })
            } else {
                vrm_rest
                    .bone_rest_translation
                    .get(name)
                    .copied()
                    .unwrap_or(Vec3::ZERO)
            };

            // Look up parent world transform.
            let (parent_pos, parent_rot) = vrm_rest
                .parent_map
                .get(name)
                .and_then(|p| world_transforms.get(p))
                .copied()
                .unwrap_or((Vec3::ZERO, Quat::IDENTITY));

            let world_rot = parent_rot * local_rot;
            let world_pos = parent_pos + parent_rot * local_translation;

            world_transforms.insert(name.clone(), (world_pos, world_rot));
        }

        for name in &ordered {
            if let Some(&(pos, rot)) = world_transforms.get(name) {
                bone_positions.entry(name.clone()).or_default().push(pos);
                bone_rotations.entry(name.clone()).or_default().push(rot);
            }
        }
    }

    VrmSkeletonFrames {
        frame_count,
        duration: result.duration_secs,
        bone_positions,
        bone_rotations,
    }
}
```

### `src/quality/rubric_b.rs` (     398 LOC)

```rust
//! Rubric B: VRM Model Quality
//! Evaluates target VRM model readiness for retargeting.

use super::{Grade, MetricResult, HardFailCheck, RubricResult};

// ─── Grade helpers ────────────────────────────────────────────────────────────

fn grade_score(g: Grade) -> f32 {
    match g {
        Grade::A => 95.0,
        Grade::B => 85.0,
        Grade::C => 75.0,
        Grade::F => 40.0,
    }
}

// ─── Constants ────────────────────────────────────────────────────────────────

/// All 55 bones in the VRM humanoid spec.
const VRM_ALL_BONES: &[&str] = &[
    "hips", "spine", "chest", "upperChest", "neck", "head",
    "leftEye", "rightEye", "jaw",
    "leftShoulder", "rightShoulder",
    "leftUpperArm", "rightUpperArm",
    "leftLowerArm", "rightLowerArm",
    "leftHand", "rightHand",
    "leftUpperLeg", "rightUpperLeg",
    "leftLowerLeg", "rightLowerLeg",
    "leftFoot", "rightFoot",
    "leftToes", "rightToes",
    "leftThumbMetacarpal", "leftThumbProximal", "leftThumbDistal",
    "leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal",
    "leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal",
    "leftRingProximal", "leftRingIntermediate", "leftRingDistal",
    "leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal",
    "rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal",
    "rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal",
    "rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal",
    "rightRingProximal", "rightRingIntermediate", "rightRingDistal",
    "rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal",
];

/// Required bones for B-0 hard fail check.
const REQUIRED_BONES: &[&str] = &[
    "hips", "spine", "head",
    "leftUpperArm", "leftLowerArm",
    "rightUpperArm", "rightLowerArm",
    "leftUpperLeg", "leftLowerLeg",
    "rightUpperLeg", "rightLowerLeg",
    "leftFoot", "rightFoot",
];

// ─── B-0 Hard Fails ───────────────────────────────────────────────────────────

fn check_hard_fails(vrm_rest: &crate::types::VrmRestPose) -> Vec<HardFailCheck> {
    let mut checks = Vec::new();

    // B0.1: Required humanoid bones present
    let translations = &vrm_rest.bone_rest_translation;
    let missing: Vec<&str> = REQUIRED_BONES
        .iter()
        .copied()
        .filter(|&b| !translations.contains_key(b))
        .collect();

    checks.push(HardFailCheck {
        name: "required_bones".to_string(),
        passed: missing.is_empty(),
        detail: if missing.is_empty() {
            "all required bones present".to_string()
        } else {
            format!("missing: {}", missing.join(", "))
        },
    });

    // B0.2: No NaN in bone rests
    let mut nan_bones: Vec<String> = Vec::new();

    for (name, t) in translations {
        if t.x.is_nan() || t.y.is_nan() || t.z.is_nan() {
            nan_bones.push(name.clone());
        }
    }
    for (name, q) in &vrm_rest.bone_rest_local {
        if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
            if !nan_bones.contains(name) {
                nan_bones.push(name.clone());
            }
        }
    }

    checks.push(HardFailCheck {
        name: "no_nan_in_rest".to_string(),
        passed: nan_bones.is_empty(),
        detail: if nan_bones.is_empty() {
            "no NaN values".to_string()
        } else {
            format!("NaN in bones: {}", nan_bones.join(", "))
        },
    });

    checks
}

// ─── B1.1 Bone Hierarchy Completeness ────────────────────────────────────────

fn metric_completeness(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let translations = &vrm_rest.bone_rest_translation;
    let present = VRM_ALL_BONES.iter().filter(|&&b| translations.contains_key(b)).count();
    let total = VRM_ALL_BONES.len(); // 55

    let coverage = present as f32 / total as f32;

    let grade = if coverage >= 0.95 { Grade::A }       // 52+
        else if coverage >= 0.85 { Grade::B }           // 47+
        else if coverage >= 0.70 { Grade::C }           // 39+
        else { Grade::F };

    MetricResult {
        name: "B1.1_Completeness".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!("{}/{} bones ({:.0}%)", present, total, coverage * 100.0),
    }
}

// ─── B1.2 Proportion Reasonableness ──────────────────────────────────────────

/// Returns 0 when `actual` is within `[lo, hi]`, otherwise the distance from
/// the nearest edge as a fraction of the range midpoint.
fn ratio_deviation(actual: f32, lo: f32, hi: f32) -> f32 {
    if actual >= lo && actual <= hi {
        return 0.0;
    }
    let mid = (lo + hi) / 2.0;
    if mid <= 0.0 {
        return 1.0;
    }
    let edge_dist = if actual < lo { lo - actual } else { actual - hi };
    edge_dist / mid
}

fn metric_proportion(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let t = &vrm_rest.bone_rest_translation;
    let w = &vrm_rest.bone_world_position;

    // Limb length = local translation of the CHILD bone (vector from this
    // bone to the next joint in parent space). e.g. upper arm length is
    // `t["leftLowerArm"]` — the elbow's position in upper arm space.
    let limb_len = |child: &str| -> Option<f32> {
        t.get(child).map(|v| v.length())
    };

    let upper_arm_len = limb_len("leftLowerArm");
    let lower_arm_len = limb_len("leftHand");
    let upper_leg_len = limb_len("leftLowerLeg");
    let lower_leg_len = limb_len("leftFoot");

    let mut deviations: Vec<(String, f32)> = Vec::new();

    // Upper arm / lower arm ratio ~1.0–1.3 (humans: ~1.1)
    if let (Some(ua), Some(la)) = (upper_arm_len, lower_arm_len) {
        if la > 1e-4 {
            deviations.push(("arm".into(), ratio_deviation(ua / la, 1.0, 1.3)));
        }
    }

    // Upper leg / lower leg ratio ~1.0–1.2 (humans: ~1.1)
    if let (Some(ul), Some(ll)) = (upper_leg_len, lower_leg_len) {
        if ll > 1e-4 {
            deviations.push(("leg".into(), ratio_deviation(ul / ll, 1.0, 1.2)));
        }
    }

    // Arm span / total height ~0.9–1.1 (Vitruvian, humans ≈ 1.0).
    // Use world hand-to-hand horizontal distance for arm span and head Y for
    // height — these are robust against bone-naming surprises and don't depend
    // on shoulder bones being rest-aligned to the X axis.
    if let (Some(lh), Some(rh), Some(head)) = (
        w.get("leftHand"), w.get("rightHand"), w.get("head"),
    ) {
        let span_v = *lh - *rh;
        let arm_span = (span_v.x * span_v.x + span_v.z * span_v.z).sqrt();
        let height = head.y;
        if height > 0.1 && arm_span > 0.1 {
            deviations.push(("span".into(), ratio_deviation(arm_span / height, 0.9, 1.1)));
        }
    }

    if deviations.is_empty() {
        return MetricResult {
            name: "B1.2_Proportion".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "insufficient bone data".to_string(),
        };
    }

    let (worst_label, max_dev) = deviations.iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
        .cloned()
        .unwrap_or(("none".into(), 0.0));

    // Range edges already have 0% deviation (ratio_deviation returns 0 in
    // [lo, hi]). 10% slop above that is "still humanoid", 25% is "stretched
    // but recognizable", beyond is stylized/broken.
    let grade = if max_dev < 0.10 { Grade::A }
        else if max_dev < 0.25 { Grade::B }
        else if max_dev < 0.50 { Grade::C }
        else { Grade::F };

    MetricResult {
        name: "B1.2_Proportion".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!("worst={} dev={:.1}%", worst_label, max_dev * 100.0),
    }
}

// ─── B1.3 Rest Pose T-Pose Alignment ─────────────────────────────────────────

/// Given a global rest quaternion, extract the direction the bone points in world space.
/// We rotate the forward axis (+X for arms, -Y for legs) by the quaternion.
fn arm_horizontal_error_deg(global_rot: glam::Quat) -> f32 {
    // In T-pose the upper arm points along ±X (horizontal).
    // Rotate world X by the global rest quat to get the bone's direction.
    let dir = global_rot * glam::Vec3::X;
    // Angle from horizontal = arcsin(|y component|)
    dir.y.abs().asin().to_degrees()
}

fn leg_vertical_error_deg(global_rot: glam::Quat) -> f32 {
    // In rest the lower leg points along -Y (downward).
    let dir = global_rot * (-glam::Vec3::Y);
    // Angle from downward = angle between dir and -Y
    let down = -glam::Vec3::Y;
    let dot = dir.dot(down).clamp(-1.0, 1.0);
    dot.acos().to_degrees()
}

fn metric_tpose(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let g = &vrm_rest.bone_rest_global;

    let mut arm_errors: Vec<f32> = Vec::new();
    let mut leg_errors: Vec<f32> = Vec::new();

    for side in &["left", "right"] {
        let upper_arm_key = format!("{}UpperArm", capitalize(side));
        let lower_leg_key = format!("{}LowerLeg", capitalize(side));

        if let Some(&q) = g.get(&upper_arm_key) {
            arm_errors.push(arm_horizontal_error_deg(q));
        }
        if let Some(&q) = g.get(&lower_leg_key) {
            leg_errors.push(leg_vertical_error_deg(q));
        }
    }

    if arm_errors.is_empty() && leg_errors.is_empty() {
        return MetricResult {
            name: "B1.3_TPose".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "no arm/leg global rest data".to_string(),
        };
    }

    let avg_arm_err = if arm_errors.is_empty() {
        0.0
    } else {
        arm_errors.iter().sum::<f32>() / arm_errors.len() as f32
    };

    let avg_leg_err = if leg_errors.is_empty() {
        0.0
    } else {
        leg_errors.iter().sum::<f32>() / leg_errors.len() as f32
    };

    // Grade by worst of arm or leg
    let arm_grade = if avg_arm_err < 5.0 { Grade::A }
        else if avg_arm_err < 15.0 { Grade::B }
        else if avg_arm_err < 30.0 { Grade::C }
        else { Grade::F };

    let leg_grade = if avg_leg_err < 3.0 { Grade::A }
        else if avg_leg_err < 8.0 { Grade::B }
        else if avg_leg_err < 15.0 { Grade::C }
        else { Grade::F };

    let grade = arm_grade.min(leg_grade);

    MetricResult {
        name: "B1.3_TPose".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!(
            "arm_err={:.1}° leg_err={:.1}°",
            avg_arm_err, avg_leg_err
        ),
    }
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        None => String::new(),
        Some(f) => f.to_uppercase().to_string() + c.as_str(),
    }
}

// ─── B1.4 Foot Sole Offset ────────────────────────────────────────────────────

fn metric_sole_offset(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
    let (left_offset, right_offset) = vrm_rest.foot_sole_offset;

    // If both are zero, data was not computed — skip gracefully
    if left_offset == 0.0 && right_offset == 0.0 {
        return MetricResult {
            name: "B1.4_SoleOffset".to_string(),
            grade: Grade::A,
            score: grade_score(Grade::A),
            detail: "sole offset not computed".to_string(),
        };
    }

    // Difference in meters → convert to mm
    let diff_mm = (left_offset - right_offset).abs() * 1000.0;

    let grade = if diff_mm < 5.0 { Grade::A }
        else if diff_mm < 15.0 { Grade::B }
        else if diff_mm < 30.0 { Grade::C }
        else { Grade::F };

    MetricResult {
        name: "B1.4_SoleOffset".to_string(),
        grade,
        score: grade_score(grade),
        detail: format!(
            "L={:.3}m R={:.3}m diff={:.1}mm",
            left_offset, right_offset, diff_mm
        ),
    }
}

// ─── Overall ──────────────────────────────────────────────────────────────────

/// Evaluate VRM model quality.
pub fn evaluate(vrm_rest: &crate::types::VrmRestPose) -> RubricResult {
    // B-0: Hard fails
    let hard_fails = check_hard_fails(vrm_rest);
    let any_hard_fail = hard_fails.iter().any(|h| !h.passed);

    // B-1: Graded metrics
    let completeness = metric_completeness(vrm_rest);
    let proportion = metric_proportion(vrm_rest);
    let tpose = metric_tpose(vrm_rest);
    let sole = metric_sole_offset(vrm_rest);

    // Weighted overall score
    // Weights: completeness 30%, proportion 25%, tpose 25%, sole 20%
    // If a metric was skipped (data unavailable), redistribute weight
    let mut weighted_score = 0.0f32;
    let mut weight_total = 0.0f32;

    let add_metric = |score: f32, weight: f32, detail: &str,
                      ws: &mut f32, wt: &mut f32| {
        // Skip metrics that returned "insufficient data" style grades with no real signal
        let _ = detail;
        *ws += score * weight;
        *wt += weight;
    };

    add_metric(completeness.score, 0.30, &completeness.detail, &mut weighted_score, &mut weight_total);
    add_metric(proportion.score, 0.25, &proportion.detail, &mut weighted_score, &mut weight_total);
    add_metric(tpose.score, 0.25, &tpose.detail, &mut weighted_score, &mut weight_total);
    add_metric(sole.score, 0.20, &sole.detail, &mut weighted_score, &mut weight_total);

    let overall_score = if weight_total > 0.0 {
        weighted_score / weight_total
    } else {
        100.0
    };

    let overall = if any_hard_fail {
        Grade::F
    } else {
        Grade::from_score(overall_score)
    };

    RubricResult {
        rubric_name: "Model".to_string(),
        hard_fails,
        metrics: vec![completeness, proportion, tpose, sole],
        overall,
        overall_score,
    }
}
```

### `src/quality/detector.rs` (      72 LOC)

```rust
//! Shared spike / quaternion delta detector primitives.
//!
//! Both rubric A (source-animation) and rubric C (retarget-output) apply
//! the same hybrid-threshold spike detector to quaternion delta streams.
//! Keeping the constants and helpers in one place ensures A and C stay in
//! sync — historical bugs came from A and C drifting on the same math.
//!
//! This module ports 1:1 to `shotloom-common::quality_detector` later.

use glam::Quat;

/// Median delta below which a track counts as "effectively static".
/// Tracks below this fall back to the absolute spike threshold.
pub(crate) const STATIC_MEDIAN_FLOOR_DEG: f32 = 2.0;

/// Absolute spike threshold for a static track.
pub(crate) const STATIC_SPIKE_THRESHOLD_DEG: f32 = 15.0;

/// Multiplier on the track's own median delta for active bones. Tuned so
/// periodic motion with peaks at 4× median is not flagged — see
/// fixtures::fast_heel_strike (median=10°, peaks=40°, threshold=45°).
pub(crate) const ACTIVE_MULTIPLIER: f32 = 4.5;

/// Smallest unsigned quaternion angle between `a` and `b`, in degrees.
/// Clamps the dot product to avoid `acos` NaN under float rounding.
pub(crate) fn quat_angle_between(a: Quat, b: Quat) -> f32 {
    let dot = (a.dot(b)).abs().min(1.0);
    2.0 * dot.acos().to_degrees()
}

/// Name-filter for bones the retargeter does not consume as deformation
/// bones. Mirrors common ARP rig conventions:
///   - `*_stretch.*` — IK stretch helpers
///   - `c_*`         — rig control bones
///   - `*_twist.*`   — twist correction bones
/// Anomalous quaternion paths on these bones are irrelevant to retarget
/// quality because they never reach the VRM output.
pub(crate) fn is_non_deformation_bone(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("_stretch")
        || lower.starts_with("c_")
        || lower.contains("_twist")
}

/// Per-bone spikes-per-100-frames from a sequence of frame-to-frame
/// angular deltas (degrees). Hybrid threshold: static tracks
/// (median < STATIC_MEDIAN_FLOOR_DEG) use an absolute spike threshold
/// (STATIC_SPIKE_THRESHOLD_DEG); active tracks use ACTIVE_MULTIPLIER ×
/// median. Shared between rubric A1.1 and rubric C1.3 — both detectors
/// had the same broken 3×median shape before Phase 2.
pub(crate) fn spike_rate_from_deltas(deltas: &[f32]) -> f32 {
    if deltas.is_empty() {
        return 0.0;
    }

    let mut sorted: Vec<f32> = deltas.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let median = if sorted.len() % 2 == 0 {
        (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
    } else {
        sorted[sorted.len() / 2]
    };

    let threshold = if median < STATIC_MEDIAN_FLOOR_DEG {
        STATIC_SPIKE_THRESHOLD_DEG
    } else {
        ACTIVE_MULTIPLIER * median
    };

    let spike_count = deltas.iter().filter(|&&d| d > threshold).count();
    (spike_count as f32 / deltas.len() as f32) * 100.0
}
```

### `src/quality/mod.rs` (     300 LOC)

```rust
// === Quality Rubric v0.1.0 ===
// Three-tier evaluation: FBX Source (A), VRM Model (B), Retarget Output (C)

/// Letter grade with numeric score
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Grade {
    F = 0,
    C = 70,
    B = 80,
    A = 90,
}

impl Grade {
    pub fn from_score(score: f32) -> Self {
        if score >= 90.0 { Grade::A }
        else if score >= 80.0 { Grade::B }
        else if score >= 70.0 { Grade::C }
        else { Grade::F }
    }

    pub fn label(&self) -> &'static str {
        match self {
            Grade::A => "A",
            Grade::B => "B",
            Grade::C => "C",
            Grade::F => "F",
        }
    }
}

impl std::fmt::Display for Grade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.label())
    }
}

/// A single metric's result
#[derive(Debug, Clone)]
pub struct MetricResult {
    pub name: String,
    pub grade: Grade,
    pub score: f32,
    pub detail: String,
}

/// Hard-fail check result
#[derive(Debug, Clone)]
pub struct HardFailCheck {
    pub name: String,
    pub passed: bool,
    pub detail: String,
}

/// Complete rubric evaluation result
#[derive(Debug, Clone)]
pub struct RubricResult {
    pub rubric_name: String,
    pub hard_fails: Vec<HardFailCheck>,
    pub metrics: Vec<MetricResult>,
    pub overall: Grade,
    pub overall_score: f32,
}

impl RubricResult {
    pub fn has_hard_fail(&self) -> bool {
        self.hard_fails.iter().any(|h| !h.passed)
    }

    /// First failed hard-fail check name, if any. Useful for gating
    /// reason strings.
    pub fn first_hard_fail(&self) -> Option<&str> {
        self.hard_fails.iter().find(|h| !h.passed).map(|h| h.name.as_str())
    }
}

/// A/B/C pipeline gating decision.
///
/// Rubric C (retarget output quality) is meaningless if either the
/// source animation (Rubric A) or the target model (Rubric B) is
/// structurally invalid. This helper inspects A and B rubric results
/// and returns `Some(reason)` if Rubric C evaluation should be
/// skipped, or `None` if the pipeline should proceed to retargeting
/// and Rubric C scoring.
///
/// Reason strings are designed to be printed in sweep output and
/// embedded in [`diagnostic::Diagnostic`] messages downstream.
///
/// ## Why gating
///
/// Without it, the sweep reports `vrm_0x_m_moth × 21566 → C1.x F`
/// as if the retargeter failed, when the actual failure is `moth`'s
/// Rubric B `B1.1_Completeness=F` — the model is missing humanoid
/// bones. Same for facial-only FBX inputs (`FC_00078`) which fail
/// `output_has_bones` hard-fail in Rubric C purely because they
/// have no body animation in the first place.
///
/// shotloom port path: `shotloom-import::import_and_validate`
/// orchestrates A → B → (gate) → C in this order. Bevy-vrm's sweep
/// bin and any other callers should mirror the same shape.
pub fn check_gating(
    rubric_a: &RubricResult,
    rubric_b: &RubricResult,
) -> Option<String> {
    if let Some(name) = rubric_a.first_hard_fail() {
        return Some(format!("rubric_a hard fail: {}", name));
    }
    if let Some(name) = rubric_b.first_hard_fail() {
        return Some(format!("rubric_b hard fail: {}", name));
    }
    None
}

impl std::fmt::Display for RubricResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] ", self.rubric_name)?;
        if self.has_hard_fail() {
            let fails: Vec<&str> = self.hard_fails.iter()
                .filter(|h| !h.passed)
                .map(|h| h.name.as_str())
                .collect();
            return write!(f, "HARD FAIL: {}", fails.join(", "));
        }
        for m in &self.metrics {
            write!(f, "{}={} ", m.name, m.grade)?;
        }
        write!(f, "-> Overall: {}", self.overall)
    }
}

// Sub-modules
pub mod detector;
pub mod diagnostic;
pub mod rubric_a;
pub mod rubric_b;
pub mod rubric_c;
pub mod fk_evaluate;
pub mod validate;
pub mod score;

// Re-export split module types at quality:: level for backwards compatibility
pub use score::{BoneScore, RetargetScore, score_retarget, FingerBoneScore, FingerRestScore, score_fingers};
pub use diagnostic::{Diagnostic, Severity, aggregate_severity, grade_to_severity, rubric_to_diagnostics};

/// Quality grade for retarget output.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RqGrade {
    A,
    B,
    C,
    F,
}

impl RqGrade {
    pub fn is_ok(self) -> bool {
        !matches!(self, RqGrade::F)
    }
}

impl std::fmt::Display for RqGrade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RqGrade::A => write!(f, "A"),
            RqGrade::B => write!(f, "B"),
            RqGrade::C => write!(f, "C"),
            RqGrade::F => write!(f, "F"),
        }
    }
}

/// A single quality diagnostic (warning or error).
#[derive(Debug, Clone)]
pub struct RqDiagnostic {
    pub is_error: bool,
    pub metric: String,
    pub message: String,
}

/// Complete retarget output ready for animation clip creation.
/// LLM-optimized compact quality summary.
pub struct RetargetQuality {
    pub bone_count: usize,
    pub scale_ratio: f32,
    pub identity_total: usize,
    pub identity_pass: usize,
    pub identity_fails: Vec<(String, f32)>,
    pub source_detected: crate::config::FbxSourceType,
    pub source_config: crate::config::FbxSourceType,
}

impl RetargetQuality {
    pub fn diagnostics(&self) -> Vec<RqDiagnostic> {
        let mut d = Vec::new();
        if self.scale_ratio < 0.5 || self.scale_ratio > 2.0 {
            d.push(RqDiagnostic { is_error: true, metric: "scale".into(), message: format!("scale={:.3} — abnormal model size ({:.0}x diff). VRM 0.x coordinate system unconverted?", self.scale_ratio, if self.scale_ratio < 1.0 { 1.0 / self.scale_ratio } else { self.scale_ratio }) });
        } else if self.scale_ratio < 0.8 || self.scale_ratio > 1.3 {
            d.push(RqDiagnostic { is_error: false, metric: "scale".into(), message: format!("scale={:.3} — unusual size ratio. Check avatar proportions.", self.scale_ratio) });
        }
        let fc = self.identity_fails.len();
        if fc > 3 {
            d.push(RqDiagnostic { is_error: true, metric: "identity".into(), message: format!("identity FAIL {}/{} — VRM rest pose may not be A-pose/T-pose.", fc, self.identity_total) });
        } else if fc > 0 {
            d.push(RqDiagnostic { is_error: false, metric: "identity".into(), message: format!("identity FAIL {}/{} — minor rest pose deviations.", fc, self.identity_total) });
        }
        if self.bone_count < 30 {
            d.push(RqDiagnostic { is_error: true, metric: "bones".into(), message: format!("bones={} — too few bone tracks. FBX may be facial-only (no body animation).", self.bone_count) });
        } else if self.bone_count < 45 {
            d.push(RqDiagnostic { is_error: false, metric: "bones".into(), message: format!("bones={} — fewer bones than expected. Some body parts may lack animation.", self.bone_count) });
        }
        d
    }

    pub fn grade(&self) -> RqGrade {
        let diags = self.diagnostics();
        let errors = diags.iter().filter(|d| d.is_error).count();
        let warnings = diags.iter().filter(|d| !d.is_error).count();
        if errors > 0 {
            RqGrade::F
        } else if warnings >= 3 {
            RqGrade::C
        } else if warnings >= 1 {
            RqGrade::B
        } else {
            RqGrade::A
        }
    }

    pub fn to_rq_lines(&self) -> Vec<String> {
        let mut lines = Vec::new();
        lines.push(format!(
            "[RQ] bones={} scale={:.3}",
            self.bone_count, self.scale_ratio,
        ));
        lines.push(format!(
            "[RQ:INFO] source: detected={} config={}",
            self.source_detected, self.source_config,
        ));
        if self.identity_fails.is_empty() {
            lines.push(format!(
                "[RQ] identity: PASS {}/{}",
                self.identity_pass, self.identity_total,
            ));
        } else {
            let fails: Vec<String> = self
                .identity_fails
                .iter()
                .map(|(name, angle)| format!("{}={:.0}°", Self::short_name(name), angle))
                .collect();
            lines.push(format!(
                "[RQ] identity: FAIL {}/{} {}",
                self.identity_fails.len(),
                self.identity_total,
                fails.join(" "),
            ));
        }
        let diags = self.diagnostics();
        for diag in &diags {
            let tag = if diag.is_error { "ERROR" } else { "WARN" };
            lines.push(format!("[RQ:{}] {}", tag, diag.message));
        }
        let grade = self.grade();
        let errors = diags.iter().filter(|d| d.is_error).count();
        let warnings = diags.iter().filter(|d| !d.is_error).count();
        lines.push(format!(
            "[RQ] GRADE: {} ({} warnings, {} errors)",
            grade, warnings, errors,
        ));
        lines
    }

    pub fn short_name(name: &str) -> String {
        match name {
            "leftUpperArm" => "lUA".into(),
            "rightUpperArm" => "rUA".into(),
            "leftLowerArm" => "lLA".into(),
            "rightLowerArm" => "rLA".into(),
            "leftUpperLeg" => "lUL".into(),
            "rightUpperLeg" => "rUL".into(),
            "leftLowerLeg" => "lLL".into(),
            "rightLowerLeg" => "rLL".into(),
            "leftHand" => "lH".into(),
            "rightHand" => "rH".into(),
            "leftFoot" => "lF".into(),
            "rightFoot" => "rF".into(),
            "leftShoulder" => "lSh".into(),
            "rightShoulder" => "rSh".into(),
            s if s.starts_with("left") => format!("l{}", &s[4..std::cmp::min(s.len(), 10)]),
            s if s.starts_with("right") => format!("r{}", &s[5..std::cmp::min(s.len(), 11)]),
            s => s[..std::cmp::min(s.len(), 8)].into(),
        }
    }
}

impl std::fmt::Display for RetargetQuality {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for line in self.to_rq_lines() {
            writeln!(f, "{}", line)?;
        }
        Ok(())
    }
}
```

### `src/quality/score.rs` (     324 LOC)

```rust
// === FK-based Retarget Scoring ===

use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::types::{FbxSkeletonFrames, TargetAnimation, VrmRestPose};
use super::RqGrade;

/// Per-bone error metrics.
pub struct BoneScore {
    pub vrm_bone_name: String,
    pub position_rms_m: f32,
    pub position_max_m: f32,
    pub direction_angle_mean_deg: f32,
    pub direction_angle_max_deg: f32,
    pub grade: RqGrade,
}

/// Complete FK-based retarget scoring.
pub struct RetargetScore {
    pub bone_scores: Vec<BoneScore>,
    pub overall_position_rms_m: f32,
    pub overall_direction_mean_deg: f32,
    pub overall_grade: RqGrade,
    pub frame_count: usize,
}

/// Bones included in FK propagation (includes root + upperChest for correct chain).
const FK_BONES: &[&str] = &[
    "VRMC_vrm.root_bone",
    "hips", "spine", "chest", "upperChest", "neck", "head",
    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
    "leftUpperLeg", "leftLowerLeg", "leftFoot",
    "rightUpperLeg", "rightLowerLeg", "rightFoot",
];

/// Bones that get a score (excludes root).
const SCORED_BONES: &[&str] = &[
    "hips", "spine", "chest", "neck", "head",
    "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand",
    "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand",
    "leftUpperLeg", "leftLowerLeg", "leftFoot",
    "rightUpperLeg", "rightLowerLeg", "rightFoot",
];

const DIRECTION_PAIRS: &[(&str, &str)] = &[
    ("hips", "spine"), ("spine", "chest"), ("chest", "neck"), ("neck", "head"),
    ("leftShoulder", "leftUpperArm"), ("leftUpperArm", "leftLowerArm"), ("leftLowerArm", "leftHand"),
    ("rightShoulder", "rightUpperArm"), ("rightUpperArm", "rightLowerArm"), ("rightLowerArm", "rightHand"),
    ("leftUpperLeg", "leftLowerLeg"), ("leftLowerLeg", "leftFoot"),
    ("rightUpperLeg", "rightLowerLeg"), ("rightLowerLeg", "rightFoot"),
];

/// Compute VRM world positions per frame via FK on retarget result.
fn compute_vrm_world_positions(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
) -> HashMap<String, Vec<Vec3>> {
    let frame_count = result.bones.first().map(|b| b.rotations.len()).unwrap_or(0);
    if frame_count == 0 {
        return HashMap::new();
    }

    // Build lookup: vrm_bone_name → retarget result
    let bone_lookup: HashMap<&str, &crate::types::RetargetedBone> = result.bones.iter()
        .map(|b| (b.vrm_bone_name.as_str(), b))
        .collect();

    // Topological order from parent_map (includes root for correct FK chain)
    let all_bones: Vec<String> = FK_BONES.iter().map(|s| s.to_string()).collect();
    let topo = build_topo_order(&vrm_rest.parent_map, &all_bones);

    let mut world_positions: HashMap<String, Vec<Vec3>> = HashMap::new();

    for frame in 0..frame_count {
        let mut frame_global_pos: HashMap<&str, Vec3> = HashMap::new();
        let mut frame_global_rot: HashMap<&str, Quat> = HashMap::new();

        for bone_name in &topo {
            // Local rotation: from retarget result, or rest pose
            let local_rot = bone_lookup.get(bone_name.as_str())
                .and_then(|b| b.rotations.get(frame).copied())
                .unwrap_or_else(|| vrm_rest.bone_rest_local.get(bone_name).copied().unwrap_or(Quat::IDENTITY));

            // Local translation: from retarget result (hips), or rest translation
            let local_trans = bone_lookup.get(bone_name.as_str())
                .and_then(|b| b.translations.as_ref())
                .and_then(|t| t.get(frame).copied())
                .unwrap_or_else(|| vrm_rest.bone_rest_translation.get(bone_name).copied().unwrap_or(Vec3::ZERO));

            // Parent global transform
            let parent_name = vrm_rest.parent_map.get(bone_name);
            let parent_pos = parent_name
                .and_then(|p| frame_global_pos.get(p.as_str()).copied())
                .unwrap_or(Vec3::ZERO);
            let parent_rot = parent_name
                .and_then(|p| frame_global_rot.get(p.as_str()).copied())
                .unwrap_or(Quat::IDENTITY);

            let world_pos = parent_pos + parent_rot * local_trans;
            let world_rot = (parent_rot * local_rot).normalize();

            frame_global_pos.insert(bone_name.as_str(), world_pos);
            frame_global_rot.insert(bone_name.as_str(), world_rot);
        }

        for bone_name in &topo {
            let pos = frame_global_pos.get(bone_name.as_str()).copied().unwrap_or(Vec3::ZERO);
            world_positions.entry(bone_name.clone()).or_default().push(pos);
        }
    }

    world_positions
}

fn build_topo_order(parent_map: &HashMap<String, String>, bone_names: &[String]) -> Vec<String> {
    let mut order = Vec::new();
    let mut remaining: std::collections::HashSet<&str> = bone_names.iter().map(|s| s.as_str()).collect();
    loop {
        let ready: Vec<String> = remaining.iter()
            .filter(|&&name| {
                parent_map.get(name)
                    .map_or(true, |p| !remaining.contains(p.as_str()))
            })
            .map(|&s| s.to_string())
            .collect();
        if ready.is_empty() { break; }
        for name in &ready {
            remaining.remove(name.as_str());
            order.push(name.clone());
        }
    }
    order
}

/// Score retarget result by comparing FK world positions against FBX source.
pub fn score_retarget(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
    fbx_skeleton: &FbxSkeletonFrames,
    bone_mapping: &HashMap<String, String>, // vrm_name → fbx_name
    scale_ratio: f32,
) -> RetargetScore {
    let vrm_world = compute_vrm_world_positions(result, vrm_rest);
    let frame_count = result.bones.first().map(|b| b.rotations.len()).unwrap_or(0);

    let mut bone_scores = Vec::new();

    // Direction error per bone (from DIRECTION_PAIRS)
    let mut dir_errors_by_bone: HashMap<&str, Vec<f32>> = HashMap::new();

    for &(bone, child) in DIRECTION_PAIRS {
        let vrm_bone_pos = vrm_world.get(bone);
        let vrm_child_pos = vrm_world.get(child);
        let fbx_bone_name = bone_mapping.get(bone);
        let fbx_child_name = bone_mapping.get(child);
        let fbx_bone_pos = fbx_bone_name.and_then(|n| fbx_skeleton.bone_positions.get(n));
        let fbx_child_pos = fbx_child_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

        if let (Some(vb), Some(vc), Some(fb), Some(fc)) = (vrm_bone_pos, vrm_child_pos, fbx_bone_pos, fbx_child_pos) {
            let errors: Vec<f32> = (0..frame_count).filter_map(|f| {
                let vb_p = vb.get(f)?;
                let vc_p = vc.get(f)?;
                let fb_p = fb.get(f)?;
                let fc_p = fc.get(f)?;
                let vrm_dir = (*vc_p - *vb_p).normalize_or_zero();
                let fbx_dir = (Vec3::new(fc_p[0], fc_p[1], fc_p[2]) - Vec3::new(fb_p[0], fb_p[1], fb_p[2])).normalize_or_zero();
                if vrm_dir.length_squared() < 0.5 || fbx_dir.length_squared() < 0.5 { return None; }
                Some(vrm_dir.dot(fbx_dir).clamp(-1.0, 1.0).acos().to_degrees())
            }).collect();
            dir_errors_by_bone.insert(bone, errors);
        }
    }

    // Position error per bone (hips-relative)
    let vrm_hips = vrm_world.get("hips");
    let fbx_hips_name = bone_mapping.get("hips");
    let fbx_hips = fbx_hips_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

    for &bone in SCORED_BONES {
        let vrm_pos = vrm_world.get(bone);
        let fbx_name = bone_mapping.get(bone);
        let fbx_pos = fbx_name.and_then(|n| fbx_skeleton.bone_positions.get(n));

        let pos_errors: Vec<f32> = if let (Some(vp), Some(fp), Some(vh), Some(fh)) = (vrm_pos, fbx_pos, vrm_hips, fbx_hips) {
            (0..frame_count).filter_map(|f| {
                let v = vp.get(f)?;
                let fraw = fp.get(f)?;
                let v_hips = vh.get(f)?;
                let f_hips = fh.get(f)?;
                let vrm_rel = *v - *v_hips;
                let fbx_rel = (Vec3::new(fraw[0], fraw[1], fraw[2]) - Vec3::new(f_hips[0], f_hips[1], f_hips[2])) * scale_ratio;
                Some((vrm_rel - fbx_rel).length())
            }).collect()
        } else {
            Vec::new()
        };

        let pos_rms = if pos_errors.is_empty() { 0.0 } else {
            (pos_errors.iter().map(|e| e * e).sum::<f32>() / pos_errors.len() as f32).sqrt()
        };
        let pos_max = pos_errors.iter().copied().fold(0.0f32, f32::max);

        let dir_errors = dir_errors_by_bone.get(bone).cloned().unwrap_or_default();
        let dir_mean = if dir_errors.is_empty() { -1.0 } else {
            dir_errors.iter().sum::<f32>() / dir_errors.len() as f32
        };
        let dir_max = dir_errors.iter().copied().fold(0.0f32, f32::max);

        let pos_grade = if pos_rms < 0.02 { RqGrade::A } else if pos_rms < 0.05 { RqGrade::B } else if pos_rms < 0.10 { RqGrade::C } else { RqGrade::F };
        let dir_grade = if dir_mean < 0.0 { pos_grade } // no direction data
            else if dir_mean < 5.0 { RqGrade::A } else if dir_mean < 15.0 { RqGrade::B } else if dir_mean < 30.0 { RqGrade::C } else { RqGrade::F };
        let grade = if (pos_grade as u8) > (dir_grade as u8) { pos_grade } else { dir_grade };

        bone_scores.push(BoneScore {
            vrm_bone_name: bone.to_string(),
            position_rms_m: pos_rms,
            position_max_m: pos_max,
            direction_angle_mean_deg: if dir_mean < 0.0 { f32::NAN } else { dir_mean },
            direction_angle_max_deg: if dir_errors.is_empty() { f32::NAN } else { dir_max },
            grade,
        });
    }

    let overall_pos = if bone_scores.is_empty() { 0.0 } else {
        (bone_scores.iter().map(|b| b.position_rms_m * b.position_rms_m).sum::<f32>() / bone_scores.len() as f32).sqrt()
    };
    let dir_scores: Vec<f32> = bone_scores.iter().filter(|b| !b.direction_angle_mean_deg.is_nan()).map(|b| b.direction_angle_mean_deg).collect();
    let overall_dir = if dir_scores.is_empty() { 0.0 } else {
        dir_scores.iter().sum::<f32>() / dir_scores.len() as f32
    };
    let overall_grade = bone_scores.iter().map(|b| b.grade).max_by_key(|g| *g as u8).unwrap_or(RqGrade::A);

    RetargetScore { bone_scores, overall_position_rms_m: overall_pos, overall_direction_mean_deg: overall_dir, overall_grade, frame_count }
}

// === Finger Rest Pose Scoring ===

pub struct FingerBoneScore {
    pub vrm_name: String,
    pub rest_error_deg: f32,
    pub max_delta_deg: f32,
}

pub struct FingerRestScore {
    pub bones: Vec<FingerBoneScore>,
    pub mean_rest_error: f32,
    pub max_rest_error: f32,
    pub grade: RqGrade,
}

/// Score finger retarget: does frame 0 match VRM rest? How much do fingers move?
pub fn score_fingers(
    result: &TargetAnimation,
    vrm_rest: &VrmRestPose,
) -> FingerRestScore {
    let finger_names: Vec<&str> = result.bones.iter()
        .filter(|b| {
            let n = &b.vrm_bone_name;
            n.contains("Thumb") || n.contains("Index") || n.contains("Middle")
                || n.contains("Ring") || n.contains("Little")
        })
        .map(|b| b.vrm_bone_name.as_str())
        .collect();

    let mut bones = Vec::new();
    for &name in &finger_names {
        let bone = result.bones.iter().find(|b| b.vrm_bone_name == name).unwrap();
        let rest = vrm_rest.bone_rest_local.get(name).copied().unwrap_or(Quat::IDENTITY);

        // Frame 0 vs rest (rest pose match)
        let rest_error = bone.rotations.first()
            .map(|&r| r.angle_between(rest).to_degrees())
            .unwrap_or(0.0);

        // Max frame-to-frame delta (animation range)
        let max_delta = if bone.rotations.len() > 1 {
            bone.rotations.windows(2)
                .map(|w| w[0].angle_between(w[1]).to_degrees())
                .fold(0.0f32, f32::max)
        } else { 0.0 };

        bones.push(FingerBoneScore {
            vrm_name: name.to_string(),
            rest_error_deg: rest_error,
            max_delta_deg: max_delta,
        });
    }

    let mean_rest = if bones.is_empty() { 0.0 }
        else { bones.iter().map(|b| b.rest_error_deg).sum::<f32>() / bones.len() as f32 };
    let max_rest = bones.iter().map(|b| b.rest_error_deg).fold(0.0f32, f32::max);

    // Grade: A<1° B<5° C<15° F≥15°
    let grade = if max_rest < 1.0 { RqGrade::A }
        else if max_rest < 5.0 { RqGrade::B }
        else if max_rest < 15.0 { RqGrade::C }
        else { RqGrade::F };

    FingerRestScore { bones, mean_rest_error: mean_rest, max_rest_error: max_rest, grade }
}

impl std::fmt::Display for RetargetScore {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        writeln!(f, "=== Retarget Score ({} frames) ===", self.frame_count)?;
        writeln!(f, "{:<25} {:>8} {:>8} {:>8} {:>8} {:>5}",
            "Bone", "PosRMS", "PosMax", "DirMean", "DirMax", "Grade")?;
        writeln!(f, "{}", "-".repeat(63))?;
        for bs in &self.bone_scores {
            let dir_mean = if bs.direction_angle_mean_deg.is_nan() { "N/A".to_string() }
                else { format!("{:.1}°", bs.direction_angle_mean_deg) };
            let dir_max = if bs.direction_angle_max_deg.is_nan() { "N/A".to_string() }
                else { format!("{:.1}°", bs.direction_angle_max_deg) };
            writeln!(f, "{:<25} {:>6.3}m {:>6.3}m {:>8} {:>8} {:>5}",
                bs.vrm_bone_name, bs.position_rms_m, bs.position_max_m,
                dir_mean, dir_max, bs.grade)?;
        }
        writeln!(f, "{}", "-".repeat(63))?;
        writeln!(f, "{:<25} {:>6.3}m {:>17.1}°        {:>5}",
            "OVERALL", self.overall_position_rms_m, self.overall_direction_mean_deg, self.overall_grade)?;
        Ok(())
    }
}
```

### `src/quality/validate.rs` (     391 LOC)

```rust
//! Pipeline validator: runs the full FBX→VRM retarget pipeline headlessly
//! and checks for failures at each stage.
//!
//! Usage: call `validate_pipeline()` with config JSON, FBX bytes, and VRM bytes.
//! Returns a `ValidationResult` with per-stage pass/fail and details.

use glam::Vec3;

use crate::config::RetargetConfig;
use crate::fbx::SourceAsset;
use crate::types::VrmRestPose;
use crate::vrm_compat::VrmVersion;

/// Per-stage validation result
#[derive(Debug, Clone)]
pub struct StageResult {
    pub name: String,
    pub passed: bool,
    pub details: Vec<String>,
}

/// Full pipeline validation result
#[derive(Debug)]
pub struct ValidationResult {
    pub stages: Vec<StageResult>,
    pub all_passed: bool,
}

impl std::fmt::Display for ValidationResult {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        for stage in &self.stages {
            let icon = if stage.passed { "✓" } else { "✗" };
            writeln!(f, "[{}] {}", icon, stage.name)?;
            for detail in &stage.details {
                writeln!(f, "  {}", detail)?;
            }
        }
        if self.all_passed {
            writeln!(f, "\nPIPELINE VALID")
        } else {
            writeln!(f, "\nPIPELINE INVALID")
        }
    }
}

/// Validate the full retarget pipeline.
///
/// Runs each stage and reports pass/fail with details.
/// Stops at first failure (subsequent stages are skipped).
pub fn validate_pipeline(
    config_json: &str,
    fbx_bytes: &[u8],
    vrm_bytes: &[u8],
) -> ValidationResult {
    let mut stages: Vec<StageResult> = Vec::new();

    // [1] Config validation
    let config = match validate_config(config_json) {
        Ok((config, details)) => {
            stages.push(StageResult { name: "Config".into(), passed: true, details });
            config
        }
        Err(details) => {
            stages.push(StageResult { name: "Config".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [2] FBX Parse validation
    let fbx = match validate_fbx_parse(fbx_bytes) {
        Ok((fbx, details)) => {
            stages.push(StageResult { name: "FBX Parse".into(), passed: true, details });
            fbx
        }
        Err(details) => {
            stages.push(StageResult { name: "FBX Parse".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [3] VRM Load validation
    let (vrm_rest, vrm_version) = match validate_vrm_load(vrm_bytes) {
        Ok((rest, ver, details)) => {
            stages.push(StageResult { name: "VRM Load".into(), passed: true, details });
            (rest, ver)
        }
        Err(details) => {
            stages.push(StageResult { name: "VRM Load".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [4] Mapping validation
    let anim = match validate_mapping(&fbx, &config, vrm_version) {
        Ok((anim, details)) => {
            stages.push(StageResult { name: "Mapping".into(), passed: true, details });
            anim
        }
        Err(details) => {
            stages.push(StageResult { name: "Mapping".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    };

    // [5] Adapter validation
    let mut vrm_rest_mut = vrm_rest.clone();
    let adapter_details = validate_adapter(&anim, &mut vrm_rest_mut, &config);
    stages.push(StageResult {
        name: "Adapter".into(),
        passed: true,
        details: adapter_details,
    });

    // [6] Retarget validation
    let fbx_skel = crate::compute_fbx_skeleton_from_parsed(&fbx).ok();
    match validate_retarget(&fbx, &anim, vrm_rest_mut, fbx_skel) {
        Ok(details) => {
            stages.push(StageResult { name: "Retarget".into(), passed: true, details });
        }
        Err(details) => {
            stages.push(StageResult { name: "Retarget".into(), passed: false, details });
            return ValidationResult { all_passed: false, stages };
        }
    }

    let all_passed = stages.iter().all(|s| s.passed);
    ValidationResult { stages, all_passed }
}

// ─── Stage implementations ────────────────────────────────────────────────────

fn validate_config(json: &str) -> Result<(RetargetConfig, Vec<String>), Vec<String>> {
    let config =
        RetargetConfig::from_json(json).map_err(|e| vec![format!("parse error: {}", e)])?;
    let mut details = Vec::new();

    details.push(format!("{} direct_map entries", config.direct_map.len()));
    details.push(format!("{} accumulate entries", config.accumulate.len()));
    details.push(format!("{} rest_sync_rules", config.rest_sync_rules.len()));

    // Check for unknown strategy names in rest_sync_rules
    let valid_strategies = ["Skip", "ScalarCurl", "DirectCopy"];
    for (pattern, strategy) in &config.rest_sync_rules {
        if !valid_strategies.contains(&strategy.as_str()) {
            return Err(vec![format!(
                "unknown strategy '{}' for pattern '{}' (valid: {:?})",
                strategy, pattern, valid_strategies
            )]);
        }
    }

    Ok((config, details))
}

fn validate_fbx_parse(bytes: &[u8]) -> Result<(SourceAsset, Vec<String>), Vec<String>> {
    let fbx =
        crate::fbx::parse(bytes).map_err(|e| vec![format!("FBX parse failed: {}", e)])?;
    let mut details = Vec::new();

    details.push(format!(
        "{} bones, {} frames, {:.1}s",
        fbx.bones.len(),
        fbx.frame_count,
        fbx.duration
    ));
    details.push(format!(
        "{}/{} bind clusters",
        fbx.bind_world.len(),
        fbx.bones.len()
    ));
    details.push(format!("source: {:?}", fbx.detected_source_type));

    if fbx.bones.len() < 20 {
        return Err(vec![format!(
            "too few bones: {} (min 20 for humanoid)",
            fbx.bones.len()
        )]);
    }
    if fbx.frame_count < 2 {
        return Err(vec![format!(
            "too few frames: {} (min 2)",
            fbx.frame_count
        )]);
    }

    Ok((fbx, details))
}

fn validate_vrm_load(
    bytes: &[u8],
) -> Result<(VrmRestPose, VrmVersion, Vec<String>), Vec<String>> {
    let mut details = Vec::new();

    // Detect VRM version by inspecting the GLB JSON chunk
    let version = detect_vrm_version(bytes);
    details.push(format!("version: {:?}", version));

    // Extract rest pose from GLB bytes (VRM 1.0 path)
    // VRM 0.x detection: extract_vrm_rest_pose may fail for 0.x — handled below
    let rest = crate::vrm_rest::extract_vrm_rest_pose(bytes).map_err(|e| {
        vec![format!("failed to extract VRM rest pose: {}", e)]
    })?;

    details.push(format!("{} bones in rest", rest.bone_rest_local.len()));

    // Check for required humanoid bones
    let required = [
        "hips", "spine", "head",
        "leftUpperArm", "leftLowerArm",
        "rightUpperArm", "rightLowerArm",
        "leftUpperLeg", "leftLowerLeg",
        "rightUpperLeg", "rightLowerLeg",
        "leftFoot", "rightFoot",
    ];
    let missing: Vec<&str> = required
        .iter()
        .filter(|b| !rest.bone_rest_local.contains_key(**b))
        .copied()
        .collect();
    if !missing.is_empty() {
        return Err(vec![format!("missing required bones: {:?}", missing)]);
    }

    // Check for NaN in rest rotations
    for (name, q) in &rest.bone_rest_local {
        if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
            return Err(vec![format!("NaN in bone rest: {}", name)]);
        }
    }

    // Forward direction: hips rest world rotation must point forward (-Z).
    // VRM convention: character faces -Z at rest. A model authored facing +Z
    // (or with hips baked 180° around Y) is broken at the model level and
    // cannot be fixed by retargeting.
    if let Some(hips_world) = rest.bone_rest_global.get("hips") {
        let fwd = *hips_world * Vec3::NEG_Z;
        if fwd.z > 0.0 {
            return Err(vec![format!(
                "hips rest faces backward (fwd.z={:.3}, expected <0)",
                fwd.z
            )]);
        }
        details.push(format!("hips forward ok (fwd.z={:.3})", fwd.z));
    }

    Ok((rest, version, details))
}

fn validate_mapping(
    fbx: &SourceAsset,
    config: &RetargetConfig,
    version: VrmVersion,
) -> Result<(crate::types::MappedAnimation, Vec<String>), Vec<String>> {
    let anim = crate::mapping::retarget(fbx, config, version)
        .map_err(|e| vec![format!("mapping failed: {}", e)])?;

    let mut details = Vec::new();
    details.push(format!(
        "{} bone tracks, {} expression tracks",
        anim.bone_tracks.len(),
        anim.expression_tracks.len()
    ));
    details.push(format!("{:.1}s duration", anim.duration_secs));

    // Check for NaN in tracks
    for track in &anim.bone_tracks {
        for (i, q) in track.rotations.iter().enumerate() {
            if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
                return Err(vec![format!(
                    "NaN at frame {} in bone {}",
                    i, track.vrm_bone_name
                )]);
            }
        }
    }

    if anim.bone_tracks.is_empty() {
        return Err(vec!["no bone tracks produced".to_string()]);
    }

    Ok((anim, details))
}

fn validate_adapter(
    anim: &crate::types::MappedAnimation,
    vrm_rest: &mut VrmRestPose,
    config: &RetargetConfig,
) -> Vec<String> {
    let mut details = Vec::new();

    let (axis_map, stage3_log) = crate::adapters::arp_vrm::stage3_build_adapter_config(
        &anim.bone_tracks,
        &vrm_rest.bone_rest_local,
        &vrm_rest.bone_rest_global,
    );

    let (overrides, stage4_log) = crate::adapters::arp_vrm::stage4_sync_rest_to_fbx(
        &mut vrm_rest.bone_rest_local,
        &mut vrm_rest.bone_rest_global,
        &vrm_rest.parent_map,
        &anim.bone_tracks,
        &axis_map,
        Some(config),
    );

    details.push(format!("{} axis map entries", axis_map.len()));
    details.push(format!("{} rest overrides", overrides.len()));

    // Emit classification summary from stage4 log
    for line in &stage4_log {
        if line.contains("classified:") {
            details.push(line.clone());
        }
    }

    let _ = stage3_log; // consumed above via details
    details
}

fn validate_retarget(
    fbx: &SourceAsset,
    anim: &crate::types::MappedAnimation,
    vrm_rest: VrmRestPose,
    fbx_skel: Option<crate::types::FbxSkeletonFrames>,
) -> Result<Vec<String>, Vec<String>> {
    // Derive fbx_root and fbx_hips from the animation's bone track names
    // (the same way integration_test.rs derives them from the config map).
    // For the validator we use simple heuristics: hips track → fbx_hips,
    // a root-level bone (no parent in fbx.bones) → fbx_root.
    let fbx_hips = anim
        .bone_tracks
        .iter()
        .find(|t| t.vrm_bone_name == "hips")
        .and_then(|_t| {
            // Look for the FBX bone that has no parent (scene root under hips)
            fbx.bones
                .iter()
                .find(|(_, b)| b.parent.is_none())
                .map(|(name, _)| name.clone())
        })
        .unwrap_or_default();

    let fbx_root = fbx
        .bones
        .iter()
        .find(|(_, b)| b.parent.is_none())
        .map(|(name, _)| name.clone())
        .unwrap_or_default();

    let retargeter =
        crate::ArpRetargeterInner::new(vrm_rest, fbx_skel, anim, &fbx_root, &fbx_hips);
    let result = retargeter.apply(anim);

    let mut details = Vec::new();
    details.push(format!(
        "{} bones, {:.1}s",
        result.bones.len(),
        result.duration_secs
    ));

    if result.bones.is_empty() {
        return Err(vec!["no retarget output bones".to_string()]);
    }

    // Check for NaN in output
    for bone in &result.bones {
        for (i, q) in bone.rotations.iter().enumerate() {
            if q.x.is_nan() || q.y.is_nan() || q.z.is_nan() || q.w.is_nan() {
                return Err(vec![format!(
                    "NaN in retarget output: {} frame {}",
                    bone.vrm_bone_name, i
                )]);
            }
        }
    }

    Ok(details)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Detect VRM version from raw GLB bytes by scanning the JSON chunk for
/// extension markers without full gltf parse.
fn detect_vrm_version(bytes: &[u8]) -> VrmVersion {
    // GLB JSON chunk starts at byte 20 (12-byte header + 8-byte chunk header)
    // Safe fallback: search for VRM extension markers anywhere in the first 64KB
    let probe = &bytes[..bytes.len().min(65536)];
    // SAFETY: lossy UTF-8 conversion is fine for string search
    let snippet = String::from_utf8_lossy(probe);
    VrmVersion::detect_from_gltf_json(&snippet).unwrap_or(VrmVersion::V1_0)
}
```

### `src/quality/diagnostic.rs` (     291 LOC)

```rust
//! Diagnostic conversion layer — bevy-vrm Grade ↔ shotloom Diagnostic.
//!
//! Bevy-vrm grades quality using a 4-level letter system
//! ([`Grade::A`] through [`Grade::F`]). Shotloom's `shotloom_common::
//! diagnostic::Diagnostic` (per ADR-0021) uses a 3-level severity
//! (`Error` / `Warning` / `Info`) plus structured fields. Every bevy-vrm
//! quality output that wants to feed shotloom-side orchestration must
//! pass through this layer first.
//!
//! ## Grade → Severity mapping
//!
//! | Grade | Severity | Reason |
//! |-------|----------|--------|
//! | A     | (omitted) | "passing" — nothing to report |
//! | B     | Info      | minor deviation, retarget is usable |
//! | C     | Warning   | meaningful issue, manual review suggested |
//! | F     | Error     | retarget broken or input invalid |
//!
//! Hard-fail checks always emit `Error` regardless of grade.
//!
//! ## Why bevy-vrm keeps Grade
//!
//! `Grade` is more useful for the rapid-iteration R&D workflow where
//! sweep bins print a 1-character status per pairing. shotloom's
//! Diagnostic is more useful for production orchestration where each
//! issue needs a code, location, and suggestion. Bevy-vrm continues
//! to compute Grade internally; this layer translates only at the
//! boundary where shotloom-shape consumers exist.
//!
//! ## Future shape
//!
//! The struct here is bevy-vrm's stand-in for `shotloom_common::
//! diagnostic::Diagnostic`. When the shotloom port lands, this file
//! gets replaced by an `extern crate shotloom_common;` import — the
//! field set is intentionally identical so the swap is mechanical.
//! Until then, the standalone definition lets bevy-vrm-side tests
//! exercise the conversion path without depending on shotloom.

use super::{Grade, MetricResult, RubricResult};

/// Severity of a single diagnostic, matching shotloom's ADR-0021 levels.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Severity {
    /// Informational note — input is acceptable but has minor deviations.
    /// Maps from Grade::B.
    Info,
    /// Warning — meaningful issue that may degrade output, manual review
    /// suggested. Maps from Grade::C.
    Warning,
    /// Error — retarget broken, input invalid, or hard-fail check failed.
    /// Maps from Grade::F or any failed hard-fail.
    Error,
}

impl std::fmt::Display for Severity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Severity::Info => write!(f, "INFO"),
            Severity::Warning => write!(f, "WARN"),
            Severity::Error => write!(f, "ERROR"),
        }
    }
}

/// Convert a [`Grade`] to a [`Severity`]. Returns `None` for Grade::A
/// (passing — nothing to emit).
pub fn grade_to_severity(grade: Grade) -> Option<Severity> {
    match grade {
        Grade::A => None,
        Grade::B => Some(Severity::Info),
        Grade::C => Some(Severity::Warning),
        Grade::F => Some(Severity::Error),
    }
}

/// A single diagnostic — bevy-vrm's stand-in for shotloom's
/// `shotloom_common::diagnostic::Diagnostic`. Field set is identical
/// (per ADR-0021) so the eventual port is a mechanical type swap.
#[derive(Debug, Clone)]
pub struct Diagnostic {
    pub severity: Severity,
    /// Stable code for the diagnostic — typically the metric name
    /// (e.g. "C1.2_GroundContact", "B1.2_Proportion"). Programmatic
    /// consumers filter on this.
    pub code: String,
    /// Human-readable description. Includes the metric's `detail`
    /// field when available.
    pub message: String,
    /// Optional location hint (rubric name, frame index, bone name, ...).
    /// Free-form; not parsed.
    pub location: Option<String>,
    /// Optional remediation hint. Currently empty for all bevy-vrm
    /// diagnostics; populated when shotloom side adds suggestions.
    pub suggestion: Option<String>,
    /// Whether the issue is recoverable — i.e. whether downstream code
    /// can still produce useful output. Hard fails are non-recoverable;
    /// metric grades are recoverable.
    pub recoverable: bool,
}

impl Diagnostic {
    /// Convert a [`MetricResult`] to a [`Diagnostic`]. Returns `None`
    /// when the metric grades A (nothing to report).
    pub fn from_metric(metric: &MetricResult, rubric: &str) -> Option<Diagnostic> {
        let severity = grade_to_severity(metric.grade)?;
        Some(Diagnostic {
            severity,
            code: metric.name.clone(),
            message: format!("{} ({})", metric.name, metric.detail),
            location: Some(rubric.to_string()),
            suggestion: None,
            recoverable: true,
        })
    }

    /// Convert a hard-fail check to an Error diagnostic. Hard fails are
    /// always non-recoverable — they indicate the input or output is
    /// structurally invalid.
    pub fn from_hard_fail(check: &super::HardFailCheck, rubric: &str) -> Diagnostic {
        Diagnostic {
            severity: Severity::Error,
            code: check.name.clone(),
            message: format!("hard fail: {} ({})", check.name, check.detail),
            location: Some(rubric.to_string()),
            suggestion: None,
            recoverable: false,
        }
    }
}

/// Convert an entire [`RubricResult`] into a flat list of diagnostics.
/// Metrics that grade A are omitted. Failed hard-fail checks always
/// emit an Error diagnostic regardless of overall grade.
pub fn rubric_to_diagnostics(result: &RubricResult) -> Vec<Diagnostic> {
    let mut diags = Vec::new();
    for hf in &result.hard_fails {
        if !hf.passed {
            diags.push(Diagnostic::from_hard_fail(hf, &result.rubric_name));
        }
    }
    for m in &result.metrics {
        if let Some(d) = Diagnostic::from_metric(m, &result.rubric_name) {
            diags.push(d);
        }
    }
    diags
}

/// Aggregate severity across a slice of diagnostics. Returns the
/// highest severity present, or `None` if the slice is empty.
pub fn aggregate_severity(diags: &[Diagnostic]) -> Option<Severity> {
    diags.iter().map(|d| d.severity).max()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::quality::{HardFailCheck, MetricResult};

    fn metric(name: &str, grade: Grade) -> MetricResult {
        MetricResult {
            name: name.to_string(),
            grade,
            score: 0.0,
            detail: format!("test detail for {}", name),
        }
    }

    #[test]
    fn grade_a_emits_nothing() {
        assert_eq!(grade_to_severity(Grade::A), None);
    }

    #[test]
    fn grade_b_to_info() {
        assert_eq!(grade_to_severity(Grade::B), Some(Severity::Info));
    }

    #[test]
    fn grade_c_to_warning() {
        assert_eq!(grade_to_severity(Grade::C), Some(Severity::Warning));
    }

    #[test]
    fn grade_f_to_error() {
        assert_eq!(grade_to_severity(Grade::F), Some(Severity::Error));
    }

    #[test]
    fn rubric_omits_grade_a_metrics() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: Vec::new(),
            metrics: vec![
                metric("M1_All_Good", Grade::A),
                metric("M2_Minor", Grade::B),
                metric("M3_Major", Grade::F),
            ],
            overall: Grade::C,
            overall_score: 70.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert_eq!(diags.len(), 2);
        assert_eq!(diags[0].code, "M2_Minor");
        assert_eq!(diags[0].severity, Severity::Info);
        assert_eq!(diags[1].code, "M3_Major");
        assert_eq!(diags[1].severity, Severity::Error);
    }

    #[test]
    fn hard_fails_always_error_and_non_recoverable() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: vec![
                HardFailCheck {
                    name: "input_has_bones".to_string(),
                    passed: false,
                    detail: "no bones found".to_string(),
                },
            ],
            metrics: Vec::new(),
            overall: Grade::F,
            overall_score: 0.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].severity, Severity::Error);
        assert!(!diags[0].recoverable);
    }

    #[test]
    fn passing_hard_fails_omitted() {
        let result = RubricResult {
            rubric_name: "Test".to_string(),
            hard_fails: vec![
                HardFailCheck {
                    name: "input_has_bones".to_string(),
                    passed: true,
                    detail: "12 bones".to_string(),
                },
            ],
            metrics: Vec::new(),
            overall: Grade::A,
            overall_score: 95.0,
        };
        let diags = rubric_to_diagnostics(&result);
        assert!(diags.is_empty());
    }

    #[test]
    fn aggregate_picks_highest_severity() {
        let diags = vec![
            Diagnostic {
                severity: Severity::Info,
                code: "x".into(),
                message: "x".into(),
                location: None,
                suggestion: None,
                recoverable: true,
            },
            Diagnostic {
                severity: Severity::Warning,
                code: "y".into(),
                message: "y".into(),
                location: None,
                suggestion: None,
                recoverable: true,
            },
        ];
        assert_eq!(aggregate_severity(&diags), Some(Severity::Warning));

        let with_error = {
            let mut d = diags.clone();
            d.push(Diagnostic {
                severity: Severity::Error,
                code: "z".into(),
                message: "z".into(),
                location: None,
                suggestion: None,
                recoverable: false,
            });
            d
        };
        assert_eq!(aggregate_severity(&with_error), Some(Severity::Error));
    }

    #[test]
    fn aggregate_empty_returns_none() {
        assert_eq!(aggregate_severity(&[]), None);
    }
}
```

### `src/config.rs` (     104 LOC)

```rust
use serde::Deserialize;
use std::collections::HashMap;

pub use fbx_rig::FbxSourceType;

#[derive(Debug, Deserialize)]
pub struct RetargetConfig {
    pub name: String,
    #[serde(default)]
    pub source_prefix: Vec<String>,
    pub direct_map: HashMap<String, String>,
    #[serde(default)]
    pub accumulate: HashMap<String, Vec<String>>,
    #[serde(default)]
    pub root_bone: Option<String>,
    #[serde(default)]
    pub ignore_patterns: Vec<String>,
    #[serde(default)]
    pub vrm_version_overrides: HashMap<String, HashMap<String, String>>,
    /// FBX blend shape channel name → VRM expression preset name
    #[serde(default)]
    pub expression_map: HashMap<String, String>,
    #[serde(default)]
    pub source_type: FbxSourceType,
    /// Per-bone rest sync strategy overrides. Each entry is a [pattern, strategy]
    /// pair matched against VRM bone names (case-insensitive, `*` wildcard).
    /// Evaluated in order — first match wins. Unmatched bones default to Skip.
    ///
    /// Supported strategies: "Skip", "ScalarCurl", "DirectCopy"
    /// "UserCalibrated" is NOT config-driven — it comes from DEFAULT_POSE lookup.
    #[serde(default)]
    pub rest_sync_rules: Vec<(String, String)>,
}

impl RetargetConfig {
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    pub fn should_ignore(&self, bone_name: &str) -> bool {
        for pattern in &self.ignore_patterns {
            if glob_match(pattern, bone_name) {
                return true;
            }
        }
        false
    }

    pub fn resolve_vrm_bone(&self, src_bone: &str, vrm_version: &str) -> Option<String> {
        if let Some(overrides) = self.vrm_version_overrides.get(vrm_version)
            && let Some(vrm_bone) = overrides.get(src_bone)
        {
            return Some(vrm_bone.clone());
        }
        self.direct_map.get(src_bone).cloned()
    }
}

/// Glob-style pattern match (case-insensitive, `*` wildcard at any position).
///
/// Supports patterns like `"*Thumb*"` (contains), `"left*"` (starts with),
/// `"*Distal"` (ends with), `"leftThumb"` (exact). Multiple `*` are supported
/// via a simple segment-split approach that handles the common cases.
pub fn glob_match(pattern: &str, text: &str) -> bool {
    let p = pattern.to_lowercase();
    let t = text.to_lowercase();

    if !p.contains('*') {
        return p == t;
    }

    // Split on '*' and match segments in order.
    let parts: Vec<&str> = p.split('*').collect();
    let starts_with_star = p.starts_with('*');
    let ends_with_star = p.ends_with('*');

    let mut remaining = t.as_str();

    for (i, part) in parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        let part_str: &str = part;
        if i == 0 && !starts_with_star {
            // First segment with no leading star → must match at start.
            if !remaining.starts_with(part_str) {
                return false;
            }
            remaining = &remaining[part_str.len()..];
        } else if i == parts.len() - 1 && !ends_with_star {
            // Last segment with no trailing star → must match at end.
            return remaining.ends_with(part_str);
        } else {
            // Middle segment — find first occurrence after current position.
            if let Some(pos) = remaining.find(part_str) {
                remaining = &remaining[pos + part_str.len()..];
            } else {
                return false;
            }
        }
    }

    true
}
```

### `src/lib.rs` (     146 LOC)

```rust
pub mod adapters;
pub mod config;
pub mod finger_axis_map;
pub mod finger_rest_align;
pub mod mapping;
pub mod orchestrate;
pub mod postprocess;
pub mod quality;
pub mod retargeter;
pub mod source_anim;
pub mod topo;
pub mod types;
pub use vrm0_compat;
pub mod vrm_compat;
pub mod vrm_rest;

/// Re-export the `fbx_rig` crate under the historical `fbx` module name
/// so existing call sites (`humanoid_retarget::fbx::parse`, etc.) keep
/// working without churn. New code should prefer `fbx_rig` directly.
pub use fbx_rig as fbx;

pub use glam;
pub use config::FbxSourceType;
pub use fbx_rig::{compute_fbx_skeleton, compute_fbx_skeleton_from_parsed};
pub use quality::{RetargetQuality, RetargetScore, BoneScore, RqDiagnostic, RqGrade, score_retarget, FingerRestScore, FingerBoneScore, score_fingers};
pub use retargeter::{ArpRetargeterInner, IdentityRetargeter, RetargeterOptions};
pub use source_anim::{SourceAnimBody, SourceAnimFacial, SourceFormat};
pub use types::{
    BoneTrack, ExpressionTrack, FbxDiagnostics, FbxSkeletonFrames, TargetAnimation,
    MappedAnimation, RetargetedBone, VrmRestPose, swing_twist_decompose,
};

use thiserror::Error;

use config::RetargetConfig;
use vrm_compat::VrmVersion;

#[derive(Error, Debug)]
pub enum RetargetError {
    #[error("FBX parse error: {0}")]
    FbxParse(String),
    #[error("config error: {0}")]
    Config(String),
    #[error("mapping error: {0}")]
    Mapping(String),
}

impl From<serde_json::Error> for RetargetError {
    fn from(e: serde_json::Error) -> Self {
        RetargetError::Config(e.to_string())
    }
}

impl From<fbx_rig::Error> for RetargetError {
    fn from(e: fbx_rig::Error) -> Self {
        RetargetError::FbxParse(e.to_string())
    }
}

/// Parse FBX once, retarget, and compute skeleton visualization in a single pass.
pub fn retarget_with_skeleton(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics, FbxSkeletonFrames), RetargetError> {
    let config = RetargetConfig::from_json(config_json)?;
    let fbx = fbx::parse(fbx_data)?;

    let source_resolved = resolve_source_type(&config, &fbx);

    // Skip heavy skeleton computation if no real bone animation (facial-only FBX)
    let has_bone_animation = fbx.tracks.values().any(|t| t.rotations.len() > 1);
    let skeleton = if has_bone_animation {
        fbx::compute_fbx_skeleton_from_parsed(&fbx)?
    } else {
        FbxSkeletonFrames {
            frame_count: fbx.frame_count,
            duration: fbx.duration,
            bone_positions: std::collections::HashMap::new(),
            bone_rotations: std::collections::HashMap::new(),
            hierarchy: std::collections::HashMap::new(),
        }
    };

    let mut all_bones: Vec<String> = fbx.bones.keys().cloned().collect();
    all_bones.sort();
    let mut animated_bones: Vec<String> = fbx.tracks.keys().cloned().collect();
    animated_bones.sort();

    let version_key = vrm_version.config_key();
    let mut matched_direct = Vec::new();
    let mut unmatched_config = Vec::new();

    for (src, _vrm_default) in &config.direct_map {
        let vrm = config
            .resolve_vrm_bone(src, version_key)
            .unwrap_or_else(|| _vrm_default.clone());
        let found = fbx.tracks.contains_key(src)
            || config
                .source_prefix
                .iter()
                .any(|p| fbx.tracks.contains_key(&format!("{}{}", p, src)));
        if found {
            matched_direct.push((src.clone(), vrm));
        } else {
            unmatched_config.push(src.clone());
        }
    }

    let mut blend_shape_channels: Vec<String> = fbx.blend_shape_tracks.keys().cloned().collect();
    blend_shape_channels.sort();

    let diag = FbxDiagnostics {
        all_bones,
        animated_bones,
        matched_direct,
        unmatched_config,
        blend_shape_channels,
        source_detected: fbx.detected_source_type,
        source_resolved,
        creator: fbx.creator.clone(),
    };

    let anim = mapping::retarget(&fbx, &config, vrm_version)?;
    Ok((anim, diag, skeleton))
}

pub fn retarget(
    fbx_data: &[u8],
    config_json: &str,
    vrm_version: VrmVersion,
) -> Result<(MappedAnimation, FbxDiagnostics), RetargetError> {
    let (anim, diag, _skeleton) = retarget_with_skeleton(fbx_data, config_json, vrm_version)?;
    Ok((anim, diag))
}

fn resolve_source_type(
    config: &RetargetConfig,
    fbx: &fbx::SourceAsset,
) -> config::FbxSourceType {
    if config.source_type == config::FbxSourceType::Auto {
        fbx.detected_source_type
    } else {
        config.source_type
    }
}
```

### `src/source_anim.rs` (     115 LOC)

```rust
//! Source animation views — body / facial split.
//!
//! `SourceAsset` (in `fbx_rig`) is the canonical file-format wrapper that
//! holds both skeletal animation tracks and blendshape tracks loaded from a
//! single FBX. This module exposes two **borrowing views** over a
//! `SourceAsset` that carry only the slice each downstream consumer cares
//! about:
//!
//! - [`SourceAnimBody`] — bones, tracks, bind world, frame timing.
//!   Consumed by skeletal retargeting (`mapping::retarget_body`).
//! - [`SourceAnimFacial`] — blendshape tracks, frame timing.
//!   Consumed by facial retargeting (`mapping::retarget_facial`).
//!
//! The split is the bevy-vrm side of the shotloom port path: shotloom's
//! `shotloom-t2m` crate owns body animation, `shotloom-vrm` (or a future
//! facial crate) owns blendshapes. Keeping them as separable views here
//! lets the eventual port replace either side without dragging the other
//! along.
//!
//! No copying happens at view construction — the views are zero-cost
//! references into the `SourceAsset` that owns the data. Callers that
//! need a fresh allocation can clone the underlying maps explicitly.
//!
//! ## Future formats
//!
//! `SourceFormat` is an enum with one variant today (`Fbx`). When a second
//! format ships (likely `Glb` or `Bvh`), the views become the abstraction
//! point: each format provides its own view constructors, and the retarget
//! body/facial functions operate on the views without caring about format.

use glam::Mat4;
use std::collections::HashMap;

use crate::config::FbxSourceType;
use crate::fbx::{FbxBone, FbxBoneTrack, SourceAsset};

/// Discriminator for the underlying source animation file format.
///
/// One variant today (`Fbx`). The enum exists so future format additions
/// (Glb, Bvh, Alembic, ...) can be tagged without an API break.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SourceFormat {
    #[default]
    Fbx,
}

/// Body (skeletal) animation slice — borrows from a [`SourceAsset`].
///
/// Holds everything `mapping::retarget_body` needs to produce
/// [`crate::types::BoneTrack`]s, and nothing else. In particular, no
/// blendshape state — facial data lives in [`SourceAnimFacial`].
///
/// Construct via [`SourceAnimBody::from_source_asset`]. The view is a
/// zero-cost borrow; the underlying `SourceAsset` must outlive the view.
pub struct SourceAnimBody<'a> {
    pub format: SourceFormat,
    pub bones: &'a HashMap<String, FbxBone>,
    pub tracks: &'a HashMap<String, FbxBoneTrack>,
    pub bind_world: &'a HashMap<String, Mat4>,
    pub frame_count: usize,
    pub duration: f32,
    pub detected_source_type: FbxSourceType,
}

impl<'a> SourceAnimBody<'a> {
    /// Borrow the body slice from a [`SourceAsset`].
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
        Self {
            format: SourceFormat::Fbx,
            bones: &asset.bones,
            tracks: &asset.tracks,
            bind_world: &asset.bind_world,
            frame_count: asset.frame_count,
            duration: asset.duration,
            detected_source_type: asset.detected_source_type,
        }
    }

    /// Returns true when the body slice has no animation tracks (e.g. a
    /// facial-only FBX). Useful for callers that want to skip body
    /// retargeting on input that has nothing skeletal to retarget.
    pub fn is_empty(&self) -> bool {
        self.tracks.is_empty()
    }
}

/// Facial (blendshape) animation slice — borrows from a [`SourceAsset`].
///
/// Holds blendshape tracks and frame timing only. No bones, no bind world.
/// Consumed by `mapping::retarget_facial` to produce
/// [`crate::types::ExpressionTrack`]s.
pub struct SourceAnimFacial<'a> {
    pub format: SourceFormat,
    pub blend_shape_tracks: &'a HashMap<String, Vec<f32>>,
    pub frame_count: usize,
    pub duration: f32,
}

impl<'a> SourceAnimFacial<'a> {
    /// Borrow the facial slice from a [`SourceAsset`].
    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
        Self {
            format: SourceFormat::Fbx,
            blend_shape_tracks: &asset.blend_shape_tracks,
            frame_count: asset.frame_count,
            duration: asset.duration,
        }
    }

    /// Returns true when the facial slice has no blendshape tracks.
    /// Body-only FBX files (most game animations) hit this case.
    pub fn is_empty(&self) -> bool {
        self.blend_shape_tracks.is_empty()
    }
}
```

### `src/finger_rest_align.rs` (     172 LOC)

```rust
//! Stage 2: Finger rest pose alignment.
//!
//! Consumes Stage 1 ([`crate::finger_axis_map`]) output and modifies the
//! VRM bind pose for non-thumb finger bones, injecting the per-FBX baseline
//! curl extracted from ARP rest.
//!
//! The key operation:
//!
//! ```text
//! new_dst_rest_local = old_dst_rest_local × Quat::from_axis_angle(
//!     vrm_curl_axis,
//!     arp_baseline_curl,
//! )
//! ```
//!
//! Then `dst_rest_global` is recomputed in topological order so child
//! finger bones inherit the modified parent rest world correctly.
//!
//! ## Why this is not v1
//!
//! v1 tried `dst_rest_local = src_local_rest` (full quaternion copy in SO(3)).
//! v3 proved that's a tautology when the canonical bind-delta formula is
//! used at init time. The proof's assumption: all transforms are
//! `SO(3) → SO(3)`.
//!
//! Stage 1 + Stage 2 together break that assumption: the curl scalar
//! passes through ℝ (`signed_angle`), and is re-applied around a
//! **different axis** (VRM's axis, not ARP's). The result is geometrically
//! distinct from `src_local_rest` and outside the tautology range.
//!
//! ## Why this won't fight wrist
//!
//! Stage 2 only modifies finger bones (24 non-thumb). The wrist (`leftHand`,
//! `rightHand`) is left untouched. The VRM bind-conjugation formula then
//! runs unchanged with the modified finger rest baseline embedded.
//!
//! If wrist itself is wrong (Opus's warning), this Stage 2 won't fix it —
//! that needs a separate hand-orientation pass. Stage 2's success criterion
//! is "fingers preserve ARP loose-fist baseline at standing", not "whole
//! hand looks correct".

use glam::Quat;
use std::collections::HashMap;

use crate::adapters::arp_vrm::RestAlignOverride;
use crate::finger_axis_map::FingerAxisEntry;

/// One per-bone override entry produced by Stage 2.
#[derive(Debug, Clone)]
pub struct RestOverride {
    pub vrm_bone_name: String,
    pub old_local: Quat,
    pub new_local: Quat,
    pub new_global: Quat,
    pub baseline_deg: f32,
}

/// Apply Stage 2: walk the axis map in topological order (parent before
/// child), build modified local + global rests, return per-bone records.
///
/// Bones are processed in finger-segment order: `*Proximal` → `*Intermediate`
/// → `*Distal`. This guarantees that when a child reads its parent's new
/// global rest, the parent has already been processed.
///
/// Bones whose parent is OUTSIDE the axis map (e.g. `leftIndexProximal`'s
/// parent is `leftHand`) read the parent's UNMODIFIED global rest from
/// `vrm_rest_global`, which is correct because we are not modifying the
/// hand.
pub fn compute_overrides(
    axis_map: &HashMap<String, FingerAxisEntry>,
    vrm_rest_local: &HashMap<String, Quat>,
    vrm_rest_global: &HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Vec<RestOverride> {
    let mut overrides: Vec<RestOverride> = Vec::with_capacity(axis_map.len());
    let mut new_global_by_name: HashMap<String, Quat> = HashMap::new();

    // Sort entries so parents are processed first within each finger chain.
    // VRM finger naming: `<side><Finger>{Proximal,Intermediate,Distal}`.
    let mut sorted_names: Vec<&String> = axis_map.keys().collect();
    sorted_names.sort_by_key(|name| segment_depth(name));

    for vrm_name in sorted_names {
        let entry = &axis_map[vrm_name];

        let old_local = vrm_rest_local
            .get(vrm_name)
            .copied()
            .unwrap_or(Quat::IDENTITY);

        // Stage 2 core: inject scalar baseline curl around VRM axis.
        let curl_quat = Quat::from_axis_angle(
            entry.vrm_axis_local,
            entry.arp_baseline_curl_rad,
        );
        let new_local = (old_local * curl_quat).normalize();

        // Recompute global. Parent's global comes from the override map if
        // we already processed it; otherwise from the original VRM rest.
        let parent_global = parent_map
            .get(vrm_name)
            .and_then(|p| {
                new_global_by_name
                    .get(p)
                    .copied()
                    .or_else(|| vrm_rest_global.get(p).copied())
            })
            .unwrap_or(Quat::IDENTITY);
        let new_global = (parent_global * new_local).normalize();

        new_global_by_name.insert(vrm_name.clone(), new_global);

        overrides.push(RestOverride {
            vrm_bone_name: vrm_name.clone(),
            old_local,
            new_local,
            new_global,
            baseline_deg: entry.arp_baseline_curl_rad.to_degrees(),
        });
    }

    overrides
}

/// Apply Stage 2 IN PLACE: mutates the VRM rest maps and returns
/// RestAlignOverride entries for the existing adapter logging API.
///
/// This is the convenience wrapper used by the `arp_vrm` adapter. It calls
/// [`compute_overrides`] then writes the new locals/globals back into the
/// supplied maps.
pub fn apply_in_place(
    axis_map: &HashMap<String, FingerAxisEntry>,
    vrm_rest_local: &mut HashMap<String, Quat>,
    vrm_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Vec<RestAlignOverride> {
    let overrides = compute_overrides(axis_map, vrm_rest_local, vrm_rest_global, parent_map);

    let mut log = Vec::with_capacity(overrides.len());
    for o in &overrides {
        let old_deg = o.old_local.angle_between(Quat::IDENTITY).to_degrees();
        let new_deg = o.new_local.angle_between(Quat::IDENTITY).to_degrees();

        vrm_rest_local.insert(o.vrm_bone_name.clone(), o.new_local);
        vrm_rest_global.insert(o.vrm_bone_name.clone(), o.new_global);

        log.push(RestAlignOverride {
            vrm_name: o.vrm_bone_name.clone(),
            old_deg,
            new_deg,
            delta_deg: o.baseline_deg,
            chain_check_deg: 0.0,
            hemisphere_flipped: 0,
        });
    }
    log
}

/// Returns 0 for Proximal, 1 for Intermediate, 2 for Distal, 3 otherwise.
/// Used to topologically order finger segments within a chain.
fn segment_depth(vrm_bone_name: &str) -> u32 {
    let lower = vrm_bone_name.to_lowercase();
    if lower.ends_with("proximal") {
        0
    } else if lower.ends_with("intermediate") {
        1
    } else if lower.ends_with("distal") {
        2
    } else {
        3
    }
}
```

### `src/vrm_compat.rs` (      24 LOC)

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VrmVersion {
    V0x,
    V1_0,
}

impl VrmVersion {
    pub fn config_key(&self) -> &'static str {
        match self {
            VrmVersion::V0x => "0.x",
            VrmVersion::V1_0 => "1.0",
        }
    }

    pub fn detect_from_gltf_json(json_str: &str) -> Option<Self> {
        if json_str.contains("\"VRMC_vrm\"") {
            Some(VrmVersion::V1_0)
        } else if json_str.contains("\"VRM\"") {
            Some(VrmVersion::V0x)
        } else {
            None
        }
    }
}
```

### `src/adapters/arp_vrm.rs` (     479 LOC)

```rust
//! ARP → VRM full-body rest alignment adapter.
//!
//! Problem: VRM rest pose has many bones (notably hands and the entire finger
//! chain) in a T-pose / bind orientation that does NOT match ARP's rest. The
//! generic delta retarget formula preserves each rig's "0 point", so a small
//! FBX delta from the ARP rest gets applied on top of the VRM rest — and the
//! result keeps the VRM bones near the VRM rest, not near the FBX-animated
//! pose. Fingers stick out straight; hands stick out horizontally.
//!
//! Earlier finger-only iterations (v1 direct copy, v2 parent-world, v3
//! canonical bind-delta formula) all failed because the wrist (`leftHand` /
//! `rightHand`) is also wrong. Fixing the children while their parent is wrong
//! is structurally impossible. The fix is to align the entire VRM humanoid
//! skeleton's rest to ARP's rest.
//!
//! Strategy: walk every VRM bone in topological order (root → leaves). For
//! each bone that has a corresponding ARP source track, override the VRM
//! local rest so that the VRM bone's NEW world rest equals the ARP bone's
//! world rest:
//!
//! ```text
//!     new_local  = inv(parent_world_after_override) * arp_bone_world
//!     new_global = arp_bone_world  (by construction)
//! ```
//!
//! Because we walk parents before children, the parent's `dst_rest_global`
//! has already been replaced with the ARP world value when we read it. The
//! root case (no parent) takes parent_world = identity, so its new_local
//! equals arp_bone_world directly.
//!
//! Translations are not touched — bone lengths stay as VRM provided them.
//! IBM is not touched — the standard skinning shader will deform mesh
//! vertices through the new bone orientations automatically. The retargeter
//! formula in `retargeter.rs::apply` is not touched.
//!
//! Bones without a matching ARP source track (helper bones, IK targets,
//! eye bones, etc.) are skipped silently — their rest stays as the VRM
//! loader provided it.
//!
//! Hemisphere canonicalization (`q.w >= 0`) is applied at every quat
//! boundary so the quaternion double-cover (q ≡ -q as rotations but
//! `angle_between(q, -q) = 180°`) doesn't produce phantom 180° warnings.

use glam::Quat;
use std::collections::{HashMap, HashSet};

use crate::config::RetargetConfig;
use crate::types::BoneTrack;

/// Per-bone diff record for logging.
#[derive(Debug, Clone)]
pub struct RestAlignOverride {
    pub vrm_name: String,
    pub old_deg: f32,
    pub new_deg: f32,
    pub delta_deg: f32,
    /// Residual angle between the new `dst_rest_global` and the ARP world
    /// target. Should be ≈ 0° by construction; non-zero indicates a numerical
    /// error or upstream coord mismatch.
    pub chain_check_deg: f32,
    /// Number of input quats whose hemisphere was flipped on read for this
    /// bone (0..=3). Helps diagnose double-cover origin.
    pub hemisphere_flipped: u32,
}

/// Force a quaternion into the `w >= 0` hemisphere.
#[inline]
fn canonicalize(q: Quat) -> Quat {
    if q.w < 0.0 { -q } else { q }
}

// =====================================================================
// Stage 4 rest sync — strategy-based dispatch
// =====================================================================
//
// Stage 4 modifies VRM `dst_rest_local` / `dst_rest_global` to match the
// loaded FBX's rest pose. Each bone uses ONE of several strategies. This
// is the single source of truth for "which bones get what rest sync
// treatment" — adding a new bone is a one-line change in
// [`rest_sync_strategy`].
//
// ## Strategies
//
// - **Skip**: bone's rest stays as VRM original. Default for anything
//   not explicitly handled.
//
// - **DirectCopy**: `dst_rest_local = src_local_rest` (ARP lcl_rot_rest). Used
//   for the arm chain (upperArm/lowerArm/hand) where directly copying
//   the Blender bone rotation produces a visually correct result.
//   Cheap, simple, but assumes bone-length convention mismatch is small
//   enough not to produce tautology.
//
// - **ScalarCurl**: axis-angle decompose ARP rest → extract scalar angle
//   → reapply around a hardcoded VRM-local axis. v5 finger pipeline.
//   Breaks the v1~v4 SO(3) tautology by passing through ℝ. Essential
//   for bones with severe bone-length convention mismatch (non-thumb
//   fingers: ARP +Y vs VRM +X).
//
// ## Extension
//
// Adding a new bone: extend [`rest_sync_strategy`] to map its name to
// the right strategy.
//
// Adding a new strategy: extend [`RestSyncStrategy`] enum + add an
// `apply_<name>_one` function + dispatch in [`stage4_sync_rest_to_fbx`].

/// Per-bone rest sync strategy at Stage 4.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RestSyncStrategy {
    /// Do not touch this bone's rest.
    Skip,
    /// Overwrite `dst_rest_local` with ARP `src_local_rest` directly.
    DirectCopy,
    /// Scalar curl pipeline (v5 fingers).
    ScalarCurl,
    /// User-calibrated quat — composed on top of VRM rest:
    /// `new_dst_rest_local = old_dst_rest_local * delta`.
    /// Values come from calibration mode (C key) + manual tuning.
    UserCalibrated(Quat),
}

/// Classify a VRM bone's rest sync strategy.
///
/// Priority order:
/// 1. `UserCalibrated` — from `arp_vrm_user_pose::lookup` (carries quat data,
///    never config-driven).
/// 2. Config-driven rules from `config.rest_sync_rules` when provided and
///    non-empty (first glob match wins).
/// 3. Hardcoded fallback — preserves existing behaviour when no config rules
///    are present (backward compatible).
pub fn rest_sync_strategy(vrm_bone_name: &str, config: Option<&RetargetConfig>) -> RestSyncStrategy {
    // UserCalibrated always takes priority (quat data lives in DEFAULT_POSE).
    if let Some(delta) = super::arp_vrm_user_pose::lookup(vrm_bone_name) {
        return RestSyncStrategy::UserCalibrated(delta);
    }

    // Config-driven rules (first match wins).
    if let Some(cfg) = config {
        if !cfg.rest_sync_rules.is_empty() {
            for (pattern, strategy_name) in &cfg.rest_sync_rules {
                if crate::config::glob_match(pattern, vrm_bone_name) {
                    return match strategy_name.as_str() {
                        "ScalarCurl" => RestSyncStrategy::ScalarCurl,
                        "DirectCopy" => RestSyncStrategy::DirectCopy,
                        "Skip" => RestSyncStrategy::Skip,
                        _ => RestSyncStrategy::Skip,
                    };
                }
            }
            // All rules evaluated, none matched → default Skip.
            return RestSyncStrategy::Skip;
        }
    }

    // Hardcoded fallback (backward compatible when rest_sync_rules absent).
    // Thumb: safety fallback — DEFAULT_POSE에 엄지 본이 없으면 VRM 원본 rest 유지.
    // EXP-003 (2026-04-12) DirectCopy 시도는 축 180° 반전으로 엄지가 팔꿈치를 향해 실패.
    let lower = vrm_bone_name.to_lowercase();
    if lower.contains("thumb") {
        return RestSyncStrategy::Skip;
    }
    if ["index", "middle", "ring", "little"]
        .iter()
        .any(|k| lower.contains(k))
    {
        return RestSyncStrategy::ScalarCurl;
    }

    RestSyncStrategy::Skip
}

/// DirectCopy strategy — one bone. Returns `None` if the bone has no
/// ARP source track.
fn apply_direct_copy_one(
    bone_name: &str,
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
) -> Option<RestAlignOverride> {
    let src_local_rest = bone_tracks
        .iter()
        .find(|t| t.vrm_bone_name == bone_name)
        .map(|t| t.src_local_rest)?;

    let old_local = dst_rest_local
        .get(bone_name)
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_local = canonicalize(src_local_rest.normalize());

    let parent_global = parent_map
        .get(bone_name)
        .and_then(|p| dst_rest_global.get(p.as_str()))
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_global = canonicalize((parent_global * new_local).normalize());

    dst_rest_local.insert(bone_name.to_string(), new_local);
    dst_rest_global.insert(bone_name.to_string(), new_global);

    Some(RestAlignOverride {
        vrm_name: bone_name.to_string(),
        old_deg: old_local.angle_between(Quat::IDENTITY).to_degrees(),
        new_deg: new_local.angle_between(Quat::IDENTITY).to_degrees(),
        delta_deg: (old_local.inverse() * new_local)
            .angle_between(Quat::IDENTITY)
            .to_degrees(),
        chain_check_deg: 0.0,
        hemisphere_flipped: 0,
    })
}

/// UserCalibrated — compose user delta on top of existing VRM rest.
///   new_local = old_local * user_delta
/// Matches how the viewer's calibration mode displays the pose.
fn apply_user_calibrated_one(
    bone_name: &str,
    user_delta: Quat,
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
) -> Option<RestAlignOverride> {
    let old_local = dst_rest_local
        .get(bone_name)
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_local = canonicalize((old_local * user_delta).normalize());

    let parent_global = parent_map
        .get(bone_name)
        .and_then(|p| dst_rest_global.get(p.as_str()))
        .copied()
        .unwrap_or(Quat::IDENTITY);
    let new_global = canonicalize((parent_global * new_local).normalize());

    dst_rest_local.insert(bone_name.to_string(), new_local);
    dst_rest_global.insert(bone_name.to_string(), new_global);

    Some(RestAlignOverride {
        vrm_name: bone_name.to_string(),
        old_deg: old_local.angle_between(Quat::IDENTITY).to_degrees(),
        new_deg: new_local.angle_between(Quat::IDENTITY).to_degrees(),
        delta_deg: user_delta.angle_between(Quat::IDENTITY).to_degrees(),
        chain_check_deg: 0.0,
        hemisphere_flipped: 0,
    })
}

/// Topologically sort a bone name set so parents appear before children
/// (when parent is also in the set). Deterministic ordering for bones
/// at the same depth (alphabetical).
fn topo_sort_bones(bones: &[String], parent_map: &HashMap<String, String>) -> Vec<String> {
    let set: HashSet<String> = bones.iter().cloned().collect();
    let mut visited: HashSet<String> = HashSet::with_capacity(set.len());
    let mut result: Vec<String> = Vec::with_capacity(set.len());

    fn visit(
        bone: &str,
        set: &HashSet<String>,
        parent_map: &HashMap<String, String>,
        visited: &mut HashSet<String>,
        result: &mut Vec<String>,
    ) {
        if visited.contains(bone) || !set.contains(bone) {
            return;
        }
        if let Some(parent) = parent_map.get(bone) {
            visit(parent, set, parent_map, visited, result);
        }
        visited.insert(bone.to_string());
        result.push(bone.to_string());
    }

    let mut sorted_bones: Vec<&String> = set.iter().collect();
    sorted_bones.sort();
    for bone in sorted_bones {
        visit(bone, &set, parent_map, &mut visited, &mut result);
    }
    result
}

/// **Stage 3: ARP → VRM structural adapter.**
///
/// Builds per-bone axis correspondence info between ARP (Blender, bone
/// length +Y) and VRM (glTF, bone length +X) for non-thumb fingers. This
/// is a STRUCTURAL conversion that depends on rig conventions, NOT on the
/// specific FBX's pose. Does not mutate `dst_rest_local` beyond any
/// diagnostic side-effects.
///
/// Returns: finger axis map + warnings (including the B-DIAG / HAND-DIAG
/// diagnostic lines). The axis map is consumed by Stage 4 to apply per-FBX
/// baseline curls.
pub fn stage3_build_adapter_config(
    bone_tracks: &[BoneTrack],
    dst_rest_local: &HashMap<String, Quat>,
    dst_rest_global: &HashMap<String, Quat>,
) -> (
    HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
    Vec<String>,
) {
    let mut warnings = vec!["[STAGE-3] ARP → VRM structural adapter".to_string()];
    let (axis_map, diag) = crate::finger_axis_map::compute_axis_map(
        bone_tracks,
        dst_rest_local,
        dst_rest_global,
    );
    warnings.push(format!(
        "[STAGE-3] axis map built: {} non-thumb finger bones",
        axis_map.len()
    ));
    warnings.extend(diag);
    (axis_map, warnings)
}

/// **Stage 4: Sync VRM rest pose to the currently loaded FBX rest pose.**
///
/// Single-entry dispatch loop. Each bone with an ARP source track is
/// classified via [`rest_sync_strategy`] and routed to the matching
/// handler. Adding a new bone or strategy type happens via the classifier
/// + per-strategy apply function; this function stays unchanged.
///
/// Topological order within each strategy group ensures parent
/// `dst_rest_global` updates propagate to children before the child is
/// processed.
pub fn stage4_sync_rest_to_fbx(
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
    axis_map: &HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
    config: Option<&RetargetConfig>,
) -> (Vec<RestAlignOverride>, Vec<String>) {
    let mut warnings = vec!["[STAGE-4] Sync VRM rest to FBX rest pose".to_string()];

    // Classify each ARP-tracked bone by its rest sync strategy.
    let mut direct_bones: Vec<String> = Vec::new();
    let mut curl_bones: Vec<String> = Vec::new();
    let mut user_calib_bones: Vec<(String, Quat)> = Vec::new();
    for track in bone_tracks {
        match rest_sync_strategy(&track.vrm_bone_name, config) {
            RestSyncStrategy::DirectCopy => direct_bones.push(track.vrm_bone_name.clone()),
            RestSyncStrategy::ScalarCurl => curl_bones.push(track.vrm_bone_name.clone()),
            RestSyncStrategy::UserCalibrated(q) => {
                user_calib_bones.push((track.vrm_bone_name.clone(), q))
            }
            RestSyncStrategy::Skip => {}
        }
    }
    warnings.push(format!(
        "[STAGE-4] classified: {} DirectCopy, {} UserCalibrated, {} ScalarCurl, {} Skip",
        direct_bones.len(),
        user_calib_bones.len(),
        curl_bones.len(),
        bone_tracks.len()
            - direct_bones.len()
            - user_calib_bones.len()
            - curl_bones.len(),
    ));

    let mut all_overrides: Vec<RestAlignOverride> = Vec::new();

    // === Strategy: DirectCopy ===
    let direct_ordered = topo_sort_bones(&direct_bones, parent_map);
    for bone_name in &direct_ordered {
        if let Some(ovr) = apply_direct_copy_one(
            bone_name,
            dst_rest_local,
            dst_rest_global,
            parent_map,
            bone_tracks,
        ) {
            all_overrides.push(ovr);
        }
    }
    warnings.push(format!(
        "[STAGE-4.DirectCopy] {} bones synced",
        direct_ordered.len()
    ));

    // === Strategy: UserCalibrated ===
    let user_calib_names: Vec<String> =
        user_calib_bones.iter().map(|(n, _)| n.clone()).collect();
    let uc_ordered = topo_sort_bones(&user_calib_names, parent_map);
    for bone_name in &uc_ordered {
        let Some((_, delta)) = user_calib_bones.iter().find(|(n, _)| n == bone_name) else {
            continue;
        };
        if let Some(ovr) = apply_user_calibrated_one(
            bone_name,
            *delta,
            dst_rest_local,
            dst_rest_global,
            parent_map,
        ) {
            all_overrides.push(ovr);
        }
    }
    warnings.push(format!(
        "[STAGE-4.UserCalibrated] {} bones synced",
        uc_ordered.len()
    ));

    // === Strategy: ScalarCurl ===
    // Delegates to v5 finger_rest_align which has its own topo walk
    // (segment_depth ordering for finger chains). Uses the axis_map
    // built by Stage 3. Safe to run after DirectCopy because finger
    // bones are leaves of the arm chain — no back-ref to arm rests.
    let curl_overrides = crate::finger_rest_align::apply_in_place(
        axis_map,
        dst_rest_local,
        dst_rest_global,
        parent_map,
    );
    warnings.push(format!(
        "[STAGE-4.ScalarCurl] {} bones synced (avg baseline {:.1}°)",
        curl_overrides.len(),
        if curl_overrides.is_empty() {
            0.0
        } else {
            curl_overrides.iter().map(|o| o.delta_deg).sum::<f32>()
                / curl_overrides.len() as f32
        }
    ));
    all_overrides.extend(curl_overrides);

    (all_overrides, warnings)
}

/// Top-level entry point — calls Stage 3 then Stage 4 in sequence.
///
/// `config` is optional. When `Some` and `config.rest_sync_rules` is non-empty,
/// bone classification is config-driven. When `None` or rules are empty, the
/// hardcoded fallback is used (backward compatible).
pub fn align_full_body_rest(
    dst_rest_local: &mut HashMap<String, Quat>,
    dst_rest_global: &mut HashMap<String, Quat>,
    parent_map: &HashMap<String, String>,
    bone_tracks: &[BoneTrack],
    config: Option<&RetargetConfig>,
) -> (Vec<RestAlignOverride>, Vec<String>) {
    let mut warnings = Vec::new();

    // Stage 3: ARP → VRM structural adapter
    let (axis_map, stage3_warnings) =
        stage3_build_adapter_config(bone_tracks, dst_rest_local, dst_rest_global);
    warnings.extend(stage3_warnings);

    if axis_map.is_empty() {
        warnings.push(
            "[STAGE-3] no finger candidates — skipping Stage 4".to_string(),
        );
        return (Vec::new(), warnings);
    }

    // Stage 4: Sync VRM rest to FBX rest pose
    let (overrides, stage4_warnings) = stage4_sync_rest_to_fbx(
        dst_rest_local,
        dst_rest_global,
        parent_map,
        bone_tracks,
        &axis_map,
        config,
    );
    warnings.extend(stage4_warnings);

    (overrides, warnings)
}

// =====================================================================
// Backwards-compatible aliases for older callers (will be removed once all
// call sites use the new names directly).
// =====================================================================

/// Alias for the old finger-only entry point. Now performs full-body
/// alignment — finger-only is no longer supported.
pub use align_full_body_rest as align_finger_rest;

pub type FingerRestOverride = RestAlignOverride;
```

### `src/adapters/arp_vrm_user_pose.rs` (     120 LOC)

```rust
//! ARP → VRM user-authored rest pose.
//!
//! Unlike automatic rest sync (which reads ARP source bone rotations
//! and tries to project them into VRM bone-local frame), this module
//! stores **hand-authored quats** that the user visually calibrated in
//! the VRM viewer's calibration mode (`C` key).
//!
//! Why this works where automatic ARP-to-VRM translation fails:
//!
//! - ARP bones use Blender convention (bone length = local +Y).
//! - VRM bones use glTF convention (bone length = local +X).
//! - Same quat components interpreted in different local frames produce
//!   different world directions → visible axis mismatch.
//! - Automatic frame-conversion math is error-prone (basis-swap signs,
//!   palm-normal orientation, left/right asymmetry).
//!
//! By having the user **directly construct the rest pose in VRM frame**
//! via the calibration viewer, the resulting quats are already in the
//! correct target frame — no math-based translation required. The
//! user's eyes are the coordinate converter.
//!
//! ## Extending
//!
//! 1. Launch `cargo run --bin bevy-vrm`
//! 2. Load a preset (`F8` / `F9` / `F7`)
//! 3. Press `G` once to enable bone gizmo (shows the selection arrow)
//! 4. Press `C` to enter calibration mode (freezes to T-pose)
//! 5. `Tab` to cycle to the bone you want, rotate with `Q/E/A/D/Z/X`
//! 6. Press `P` to copy the values to clipboard
//! 7. Paste into [`default_pose()`] below
//!
//! ## Scope
//!
//! Current pose targets an "arms down at sides" natural standing rest.
//! This becomes the new VRM baseline — animations then apply delta on
//! top, so any animation whose starting frame is close to arms-down
//! standing will look correct out of the box.

use glam::Quat;

/// Per-bone user-authored rest delta. Applied as
/// `new_dst_rest_local = old_dst_rest_local * delta`.
#[derive(Debug, Clone, Copy)]
pub struct BonePose {
    pub vrm_bone_name: &'static str,
    pub delta: Quat,
}

/// The default user-authored ARP → VRM rest pose (F8 standing @ 3.7s).
/// Captured by manual calibration in the viewer.
///
/// **Shoulder intentionally excluded** — adding shoulder over-rotates
/// the cumulative hand frame and breaks downstream v5 finger curl.
pub const DEFAULT_POSE: &[BonePose] = &[
    // Left arm chain
    BonePose {
        vrm_bone_name: "leftUpperArm",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.6428, 0.7660), // 80° around -Z
    },
    BonePose {
        vrm_bone_name: "leftLowerArm",
        delta: Quat::from_xyzw(0.0000, -0.1305, 0.0000, 0.9914), // 15° around -Y
    },
    // Right arm chain
    BonePose {
        vrm_bone_name: "rightUpperArm",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.6428, 0.7660), // 80° around +Z
    },
    BonePose {
        vrm_bone_name: "rightLowerArm",
        delta: Quat::from_xyzw(0.0000, 0.0872, 0.0000, 0.9962), // 10° around +Y
    },
    // Thumb chain — EXP-004 (2026-04-12). UserCalibrated path activated
    // via arp_vrm_user_pose::lookup. Left-side values calibrated visually
    // in viewer (P→calibration, Tab→thumb bone, Q/W/A/S/Z/X to rotate,
    // C to copy). Right-side values MIRROR-GUESSED by flipping Y/Z signs
    // per existing arm chain convention — verify and retune if incorrect.
    //
    // Background: EXP-003 DirectCopy failed (thumb → elbow). EXP-004
    // activates authored-offset path per original TODO in rest_sync_strategy.
    BonePose {
        vrm_bone_name: "leftThumbMetacarpal",
        delta: Quat::from_xyzw(0.0000, -0.0872, 0.0000, 0.9962), // -10° Y
    },
    BonePose {
        vrm_bone_name: "leftThumbProximal",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.2164, 0.9763), // -25° Z
    },
    BonePose {
        vrm_bone_name: "leftThumbDistal",
        delta: Quat::from_xyzw(0.0000, 0.0000, -0.2164, 0.9763), // -25° Z
    },
    BonePose {
        vrm_bone_name: "rightThumbMetacarpal",
        delta: Quat::from_xyzw(0.0000, 0.0872, 0.0000, 0.9962), // +10° Y (mirror guess)
    },
    BonePose {
        vrm_bone_name: "rightThumbProximal",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.2164, 0.9763), // +25° Z (mirror guess)
    },
    BonePose {
        vrm_bone_name: "rightThumbDistal",
        delta: Quat::from_xyzw(0.0000, 0.0000, 0.2164, 0.9763), // +25° Z (mirror guess)
    },
    // Hand wrist twist (EXP-005 hardcoded -55°/+55°) was promoted to dynamic
    // per-frame FBX right-wrist-delta transfer in src/retarget.rs (EXP-006).
    // Removing the static entries lets the dynamic pass measure FBX wrist
    // rotation each frame and apply that magnitude — matching the animation
    // motion instead of a fixed offset.
];

/// Look up a user-authored delta by VRM bone name. Returns `None` if
/// the bone is not in the pose (which means: use a different strategy
/// or skip).
pub fn lookup(vrm_bone_name: &str) -> Option<Quat> {
    DEFAULT_POSE
        .iter()
        .find(|p| p.vrm_bone_name == vrm_bone_name)
        .map(|p| p.delta)
}
```

### `src/adapters/mod.rs` (      14 LOC)

```rust
//! Rig-pair adapters: pre-retarget rest pose alignment between specific
//! source/target rig combinations.
//!
//! Adapters are NOT part of the generic retarget pipeline. They live as
//! pure init-time functions that mutate the destination rest pose before
//! `Retargeter::new` builds its per-bone `BoneData`. This keeps the delta
//! retarget formula completely untouched and lets us isolate rig-specific
//! quirks (e.g., ARP fingers baked into a fist while VRM fingers are flat)
//! to the boundary instead of leaking into core math.
//!
//! Each adapter is feature-gated by an explicit boolean. Default = off.

pub mod arp_vrm;
pub mod arp_vrm_user_pose;
```

### `src/finger_axis_map.rs` (     307 LOC)

```rust
//! Stage 1: Finger axis matching.
//!
//! Per-bone correspondence between ARP curl axis (in FBX bone-local frame)
//! and VRM curl axis (in VRM bone-local frame). ARP and VRM have different
//! bone-internal axis conventions:
//!
//!   ARP : bone length = +Y (Blender convention), curl axis ≈ ±X
//!   VRM : bone length = ±X (dump-vrm-transforms findings), curl axis ≈ ±Z
//!
//! This module derives both per-bone and outputs an axis map that Stage 2
//! (`finger_rest_align`) consumes.
//!
//! Key insight from Phase 0: ARP loose-fist rest pose IS the curl rotation,
//! so `rest_local.to_axis_angle()` gives us the curl axis directly. No need
//! for animation-based detection.
//!
//! Thumb is excluded from this v5 module — `c_thumb*` bones have multi-axis
//! rest (carpometacarpal coupling) and need a different approach. They are
//! left to existing pipeline or hand-authored offsets.

use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::types::BoneTrack;

/// Per-bone axis correspondence + baseline curl scalar.
///
/// `arp_baseline_curl_rad` is extracted here (not in Stage 2) because it's
/// derived from the same `to_axis_angle()` decomposition as the axis itself,
/// so doing it twice would waste work.
#[derive(Debug, Clone)]
pub struct FingerAxisEntry {
    pub vrm_bone_name: String,
    /// ARP curl axis in FBX bone-local frame (unit vector).
    pub arp_axis_local: Vec3,
    /// VRM curl axis in VRM bone-local frame (unit vector).
    pub vrm_axis_local: Vec3,
    /// Magnitude of ARP rest_local around `arp_axis_local`. This is the
    /// per-FBX baseline curl that Stage 2 injects into the VRM rest.
    /// Positive scalar (radians).
    pub arp_baseline_curl_rad: f32,
}

/// Returns true if the VRM bone name belongs to a non-thumb finger bone
/// that this module handles. Thumb bones are excluded (multi-axis rest).
pub fn is_handled_finger(vrm_bone_name: &str) -> bool {
    let lower = vrm_bone_name.to_lowercase();
    if lower.contains("thumb") {
        return false;
    }
    ["index", "middle", "ring", "little", "pinky"]
        .iter()
        .any(|k| lower.contains(k))
}

/// Returns true for any finger bone (incl. thumb). Used for diagnostics
/// and so the caller can route thumbs to a different code path.
pub fn is_any_finger(vrm_bone_name: &str) -> bool {
    let lower = vrm_bone_name.to_lowercase();
    ["thumb", "index", "middle", "ring", "little", "pinky"]
        .iter()
        .any(|k| lower.contains(k))
}

/// Derive ARP curl axis + baseline curl from a BoneTrack's rest pose.
///
/// The full FBX local rest is recoverable from the BoneTrack as
/// `inv(src_parent_global_rest) * src_global_rest`. Its axis-angle
/// decomposition gives us:
///   - axis: the curl rotation axis in bone-local frame (we want this)
///   - angle: the curl magnitude (we want this too — saves redundant work)
///
/// If the rest is near-identity (`< 1°`), the axis is undefined; we return
/// `Vec3::X` as a safe fallback (will be skipped by Stage 2 anyway because
/// baseline ≈ 0).
fn derive_arp_axis_and_baseline(track: &BoneTrack) -> (Vec3, f32) {
    let full_local_rest = track.src_parent_global_rest.inverse() * track.src_global_rest;
    let (axis, angle) = full_local_rest.to_axis_angle();
    if angle.abs() < 1.0_f32.to_radians() {
        return (Vec3::X, 0.0);
    }
    (axis.normalize_or_zero(), angle.abs())
}

/// Derive VRM curl axis for a non-thumb finger bone.
///
/// From `dump-vrm-transforms` findings:
///   - Left fingers : bone length axis = +X (rest_local ≈ identity)
///   - Right fingers: bone length axis = -X (mirrored)
///
/// Curl axis must be perpendicular to bone length AND oriented so that
/// positive rotation curls the finger toward the **palm** (inward, not
/// the back of the hand).
///
/// First viewer test (`+Z` left / `-Z` right) showed fingers curling toward
/// the **back of the hand** — correct axis, wrong sign. Flipped here.
pub fn vrm_curl_axis_for(vrm_bone_name: &str) -> Vec3 {
    let is_right = vrm_bone_name.to_lowercase().starts_with("right")
        || vrm_bone_name.to_lowercase().contains("right");
    if is_right {
        Vec3::new(0.0, 0.0, 1.0)
    } else {
        Vec3::new(0.0, 0.0, -1.0)
    }
}

/// Derive VRM curl axis via Option B: transport the ARP curl axis through
/// **world space** using both rigs' global rest rotations.
///
/// Formula:
///   src_global_rest * arp_axis_local  →  ARP curl axis in world frame
///   dst_rest_global.inverse() * (...) →  same physical direction expressed
///                                        in VRM bone-local frame
///
/// An earlier version used `inv(dst_rest_local) * src_rest_local * arp_axis`,
/// which silently collapsed to `arp_axis` because finger-level local rests
/// are near-identity in both rigs. That dropped the ARP (Blender, bone length
/// = +Y) vs VRM (glTF, bone length = +X) convention difference, which lives
/// in the accumulated world rotation of the parent chain — not in any local
/// rest. This world-space form captures it.
fn derive_vrm_axis_option_b(
    src_global_rest: Quat,
    dst_rest_global: Quat,
    arp_axis_local: Vec3,
) -> Vec3 {
    let arp_axis_world = src_global_rest * arp_axis_local;
    let vrm_local = dst_rest_global.inverse() * arp_axis_world;
    vrm_local.normalize_or_zero()
}

/// Angular error between two unit vectors, in degrees. Returns 0 if either
/// vector is zero-length.
fn axis_angle_error_deg(a: Vec3, b: Vec3) -> f32 {
    if a.length_squared() < 1e-8 || b.length_squared() < 1e-8 {
        return 0.0;
    }
    a.normalize().dot(b.normalize()).clamp(-1.0, 1.0).acos().to_degrees()
}

/// Stage 1 entry point. Walks every BoneTrack, builds per-bone axis +
/// baseline curl entries for non-thumb fingers. Also emits a diagnostic
/// log that dry-runs Option B (rest-delta axis derivation) on **every**
/// finger bone, including thumbs, for post-session analysis.
///
/// Returns `(axis_map, diagnostics)`. The diagnostics Vec is a set of
/// human-readable log lines the adapter appends to its warnings.
pub fn compute_axis_map(
    bone_tracks: &[BoneTrack],
    dst_rest_local: &HashMap<String, Quat>,
    dst_rest_global: &HashMap<String, Quat>,
) -> (HashMap<String, FingerAxisEntry>, Vec<String>) {
    let mut map = HashMap::new();
    let mut diagnostics: Vec<String> = Vec::new();

    diagnostics.push(
        "[B-DIAG] Option B dry-run: derived = inv(dst_rest_global) * src_global_rest * arp_axis"
            .to_string(),
    );
    diagnostics.push(
        "[B-DIAG] bone                         arp_axis            hard_axis  derived_axis         err°"
            .to_string(),
    );

    // Stable order for diff-friendly output.
    let mut sorted_tracks: Vec<&BoneTrack> = bone_tracks
        .iter()
        .filter(|t| is_any_finger(&t.vrm_bone_name))
        .collect();
    sorted_tracks.sort_by(|a, b| a.vrm_bone_name.cmp(&b.vrm_bone_name));

    let mut nonthumb_errors: Vec<f32> = Vec::new();
    let mut nonthumb_worst: f32 = 0.0;
    let mut nonthumb_worst_name = String::new();

    for track in &sorted_tracks {
        let name = &track.vrm_bone_name;

        let (arp_axis, baseline_rad) = derive_arp_axis_and_baseline(track);
        let src_global = track.src_global_rest;
        let dst_global = dst_rest_global.get(name).copied().unwrap_or(Quat::IDENTITY);
        let derived = derive_vrm_axis_option_b(src_global, dst_global, arp_axis);
        let _ = dst_rest_local; // retained in signature for future hardcode path

        let is_thumb = name.to_lowercase().contains("thumb");
        // VRM curl axis in finger's local frame. Finger is a child of hand;
        // when Stage H rotates the hand rest, the finger's local frame rotates
        // WITH it, so local -Z/+Z automatically maps to the NEW palm direction
        // in world. No compensation needed.
        let hard_axis = if is_thumb {
            Vec3::ZERO
        } else {
            vrm_curl_axis_for(name)
        };
        let err_deg = if is_thumb {
            f32::NAN
        } else {
            axis_angle_error_deg(hard_axis, derived)
        };

        diagnostics.push(format!(
            "[B-DIAG] {:<28} [{:>+5.2},{:>+5.2},{:>+5.2}] [{:>+5.2},{:>+5.2},{:>+5.2}] [{:>+5.2},{:>+5.2},{:>+5.2}] {:>6}",
            name,
            arp_axis.x, arp_axis.y, arp_axis.z,
            hard_axis.x, hard_axis.y, hard_axis.z,
            derived.x, derived.y, derived.z,
            if err_deg.is_nan() { "n/a".to_string() } else { format!("{:.1}", err_deg) },
        ));

        if !is_thumb && !err_deg.is_nan() {
            nonthumb_errors.push(err_deg);
            if err_deg > nonthumb_worst {
                nonthumb_worst = err_deg;
                nonthumb_worst_name = name.clone();
            }
        }

        // Only non-thumb bones populate the axis_map that Stage 2 consumes.
        if is_handled_finger(name) {
            map.insert(
                name.clone(),
                FingerAxisEntry {
                    vrm_bone_name: name.clone(),
                    arp_axis_local: arp_axis,
                    vrm_axis_local: hard_axis,
                    arp_baseline_curl_rad: baseline_rad,
                },
            );
        }
    }

    // Hand bone diagnostic: measure the ARP vs VRM bind-orientation delta
    // for leftHand/rightHand. Reports BOTH:
    //   - raw   : delta in FBX native frame (Z-up for Maya/UE, Y-up for Blender)
    //   - yup   : delta after coord_rot = Rx(-π/2) applied to src (Z-up→Y-up)
    // If the FBX is Blender-sourced, the two should match.
    // If non-Blender and `yup` ≈ 0°, the 170° was a coord-system mismatch
    // and the wrist is actually aligned.
    diagnostics.push(String::new());
    diagnostics.push(
        "[HAND-DIAG] wrist rest-orientation delta: ARP vs VRM bind".to_string(),
    );
    diagnostics.push(
        "[HAND-DIAG] bone       |dst|°  |src|°  raw°    yup°    yup_axis".to_string(),
    );
    let coord_rot = Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2);
    let coord_rot_inv = coord_rot.inverse();
    for hand_name in &["leftHand", "rightHand"] {
        let dst_g = dst_rest_global
            .get(*hand_name)
            .copied()
            .unwrap_or(Quat::IDENTITY);
        let src_g = bone_tracks
            .iter()
            .find(|t| t.vrm_bone_name == *hand_name)
            .map(|t| t.src_global_rest)
            .unwrap_or(Quat::IDENTITY);
        let src_g_yup = coord_rot * src_g * coord_rot_inv;

        let angle = |q: Quat| -> (Vec3, f32) {
            let c = if q.w < 0.0 { -q } else { q };
            let (ax, an) = c.to_axis_angle();
            (ax, an.to_degrees())
        };
        let (_, raw_deg) = angle((src_g * dst_g.inverse()).normalize());
        let (yup_axis, yup_deg) = angle((src_g_yup * dst_g.inverse()).normalize());

        diagnostics.push(format!(
            "[HAND-DIAG] {:<10} {:>6.1}  {:>6.1}  {:>6.1}  {:>6.1}  [{:>+5.2},{:>+5.2},{:>+5.2}]",
            hand_name,
            dst_g.angle_between(Quat::IDENTITY).to_degrees(),
            src_g.angle_between(Quat::IDENTITY).to_degrees(),
            raw_deg,
            yup_deg,
            yup_axis.x, yup_axis.y, yup_axis.z,
        ));
    }
    diagnostics.push(String::new());

    if !nonthumb_errors.is_empty() {
        let mean = nonthumb_errors.iter().sum::<f32>() / nonthumb_errors.len() as f32;
        diagnostics.push(format!(
            "[B-DIAG] non-thumb summary: n={} mean_err={:.2}° max_err={:.2}° @ {}",
            nonthumb_errors.len(),
            mean,
            nonthumb_worst,
            nonthumb_worst_name,
        ));
        diagnostics.push(format!(
            "[B-DIAG] gate (5° threshold): {}",
            if nonthumb_worst <= 5.0 {
                "PASS — Option B candidate for post-wrist work"
            } else if nonthumb_worst <= 15.0 {
                "SOFT-FAIL — above 5° but within wrist-error budget; re-check after task #2"
            } else {
                "HARD-FAIL — kill Option B"
            }
        ));
    } else {
        diagnostics.push(
            "[B-DIAG] no non-thumb finger tracks found — cannot evaluate gate".to_string(),
        );
    }

    (map, diagnostics)
}

// Tests moved to crates/humanoid_retarget/tests/finger_axis_map.rs
```

### `src/topo.rs` (      16 LOC)

```rust
use std::collections::HashMap;

pub fn build_vrm_topo_order(parent_map: &HashMap<String, String>) -> Vec<String> {
    let mut all_bones: std::collections::HashSet<&str> = parent_map.keys().map(|s| s.as_str()).collect();
    for parent in parent_map.values() { all_bones.insert(parent); }
    let mut order = Vec::new();
    let mut remaining: std::collections::HashSet<&str> = all_bones;
    loop {
        let ready: Vec<&str> = remaining.iter()
            .filter(|&&name| parent_map.get(name).map_or(true, |p| !remaining.contains(p.as_str())))
            .copied().collect();
        if ready.is_empty() { break; }
        for name in &ready { remaining.remove(*name); order.push(name.to_string()); }
    }
    order
}
```

### `src/mapping.rs` (     479 LOC)

```rust
use glam::{Quat, Vec3};
use std::collections::HashMap;

use crate::config::RetargetConfig;
use crate::fbx::{FbxBone, SourceAsset};
use crate::source_anim::{SourceAnimBody, SourceAnimFacial};
use crate::vrm_compat::VrmVersion;
use crate::{BoneTrack, ExpressionTrack, RetargetError, MappedAnimation};

/// VRM virtual root bone name (matches bevy_vrm1's Vrm::ROOT_BONE)
const VRM_ROOT_BONE: &str = "VRMC_vrm.root_bone";

/// 2단계: 손가락 global_rest를 재계산 (parent × local_rest). 체인 순서 보존 위해 topo.
fn recompute_finger_globals(
    global_rest: &mut HashMap<String, Quat>,
    local_rest: &HashMap<String, Quat>,
    bones: &HashMap<String, FbxBone>,
    is_finger: &dyn Fn(&str) -> bool,
) {
    let finger_names: Vec<String> = bones
        .keys()
        .filter(|n| is_finger(n))
        .cloned()
        .collect();
    let mut pending: std::collections::HashSet<String> = finger_names.into_iter().collect();
    loop {
        let ready: Vec<String> = pending
            .iter()
            .filter(|name| {
                let bone = &bones[*name];
                bone.parent.as_ref().is_none_or(|p| !pending.contains(p))
            })
            .cloned()
            .collect();
        if ready.is_empty() {
            break;
        }
        for name in ready {
            let bone = &bones[&name];
            let parent_global = bone
                .parent
                .as_ref()
                .and_then(|p| global_rest.get(p))
                .copied()
                .unwrap_or(Quat::IDENTITY);
            let local = local_rest.get(&name).copied().unwrap_or(Quat::IDENTITY);
            global_rest.insert(name.clone(), parent_global * local);
            pending.remove(&name);
        }
    }
}

/// A안: ground truth override — Deformer::Cluster.TransformLink이 있는 본은
/// Euler 재구성 결과를 bind pose rotation으로 교체. global_rest는 본별 절대값이라
/// 개별 덮어쓰기가 안전 (children도 자신의 bind_world로 독립 해결됨).
/// Rationale: docs/retarget-learnings.md 2026-04-12 — 팔/손 체인 Δ 50~170°
/// 증상의 근본 원인이 PreRot * LclRest 수동 재구성의 부호/순서 버그로 확정됨.
///
/// 손가락 제외 + 재계산: bind와 rest의 축이 180° 다름 (dump에서 Δ 120°+ 확인).
/// 기존 v5 scalar curl + AXIS_CORRECTION이 rest axis 기준으로 튜닝돼 있어
/// 손가락만 bind로 바꾸면 보정이 역방향 작용. 하지만 단순 제외만 하면
/// hand는 bind인데 finger의 global_rest는 옛 Euler hand 기준이라
/// hand-local frame이 깨지고 첫 마디가 공중으로 날아감 — 계층 경계 불일치.
/// 해결: 손가락의 global_rest = bind(parent) * local_rest(finger)로 재계산.
/// 이러면 finger의 hand-local은 원래와 동일해 v5 curl이 정상 작동.
fn apply_bind_overrides_view(
    global_rest: &mut HashMap<String, Quat>,
    local_rest: &HashMap<String, Quat>,
    body: &SourceAnimBody<'_>,
) {
    let is_finger_name = |n: &str| -> bool {
        let l = n.to_lowercase();
        l.contains("index")
            || l.contains("middle")
            || l.contains("ring")
            || l.contains("pinky")
            || l.contains("thumb")
    };

    // 1단계: 손가락 아닌 본만 bind override.
    for (name, bind_m) in body.bind_world {
        if is_finger_name(name) {
            continue;
        }
        let (_scale, bind_rot, _trans) = bind_m.to_scale_rotation_translation();
        global_rest.insert(name.clone(), bind_rot);
    }

    recompute_finger_globals(global_rest, local_rest, body.bones, &is_finger_name);
}

fn build_prefix_map_view(
    config: &RetargetConfig,
    body: &SourceAnimBody<'_>,
) -> HashMap<String, String> {
    let mut map = HashMap::new();

    let mut config_bones: Vec<&str> = Vec::new();
    for src in config.direct_map.keys() {
        config_bones.push(src);
    }
    for bones in config.accumulate.values() {
        for b in bones {
            config_bones.push(b);
        }
    }
    if let Some(ref rb) = config.root_bone {
        config_bones.push(rb);
    }

    for &cfg_bone in &config_bones {
        if body.tracks.contains_key(cfg_bone) || body.bones.contains_key(cfg_bone) {
            map.insert(cfg_bone.to_string(), cfg_bone.to_string());
            continue;
        }
        for prefix in &config.source_prefix {
            let prefixed = format!("{}{}", prefix, cfg_bone);
            if body.tracks.contains_key(&prefixed) || body.bones.contains_key(&prefixed) {
                map.insert(cfg_bone.to_string(), prefixed);
                break;
            }
        }
    }

    map
}

/// Convert FBX translation to glTF Y-up (meters).
/// UE/Maya: Z-up cm → (x, z, -y) * 0.01
/// Blender: root bone -90°X already handles Z→Y in FK, just pass through.
fn fbx_to_gltf_translation(v: Vec3, is_blender: bool) -> Vec3 {
    if is_blender {
        // Blender FBX: Z-up meters → Y-up meters (no cm→m needed)
        Vec3::new(v.x, v.z, -v.y)
    } else {
        // UE/Maya: Z-up cm → Y-up meters
        Vec3::new(v.x * 0.01, v.z * 0.01, -v.y * 0.01)
    }
}

/// Body retargeting: produces VRM bone tracks from a [`SourceAnimBody`] view.
///
/// shotloom port path: this is what `shotloom-t2m` (or whichever crate owns
/// body animation) calls. Facial blendshapes go through
/// [`retarget_facial`]; the two are independent.
pub fn retarget_body(
    body: &SourceAnimBody<'_>,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> Result<Vec<BoneTrack>, RetargetError> {
    let version_key = vrm_version.config_key();
    let frame_count = body.frame_count;

    let prefix_map = build_prefix_map_view(config, body);

    let timestamps: Vec<f32> = (0..frame_count).map(|i| i as f32 / 30.0).collect();

    let mut result_tracks: Vec<BoneTrack> = Vec::new();

    let resolve = |cfg_name: &str| -> Option<&String> { prefix_map.get(cfg_name) };

    // Blender FBX: PreRotation is identity, bone orientation baked into rest_rotation_euler.
    // Use rest_rotation_euler as src_local_rest, convert animation to delta-from-rest.
    let is_blender = if config.source_type != crate::config::FbxSourceType::Auto {
        config.source_type == crate::config::FbxSourceType::Blender
    } else {
        body.detected_source_type == crate::config::FbxSourceType::Blender
    };

    // Compute global rest rotation for each FBX bone
    // Full local rest = PreRotation * Lcl_Rotation_rest (both contribute to bind pose)
    let mut global_rest: HashMap<String, Quat> = HashMap::new();
    let mut local_rest: HashMap<String, Quat> = HashMap::new();
    // Topological order: process parents first
    let mut to_process: Vec<String> = body.bones.keys().cloned().collect();
    let mut processed = std::collections::HashSet::new();
    while !to_process.is_empty() {
        let mut progress = false;
        to_process.retain(|name| {
            let bone = &body.bones[name];
            let parent_done = bone.parent.as_ref().is_none_or(|p| processed.contains(p));
            if parent_done {
                let parent_global = bone
                    .parent
                    .as_ref()
                    .and_then(|p| global_rest.get(p))
                    .copied()
                    .unwrap_or(Quat::IDENTITY);
                let lcl_rot_rest =
                    crate::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
                let full_local = bone.pre_rotation * lcl_rot_rest;
                local_rest.insert(name.clone(), full_local);
                global_rest.insert(name.clone(), parent_global * full_local);
                processed.insert(name.clone());
                progress = true;
                false // remove from to_process
            } else {
                true // keep
            }
        });
        if !progress {
            break;
        }
    }

    apply_bind_overrides_view(&mut global_rest, &local_rest, body);

    // 0. Root bone → VRM virtual root bone (translation + rotation)
    if let Some(ref root_name) = config.root_bone
        && let Some(fbx_name) = resolve(root_name)
        && let Some(track) = body.tracks.get(fbx_name)
    {
        let bone = body.bones.get(fbx_name);
        let lcl_rot_rest = bone
            .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
            .unwrap_or(Quat::IDENTITY);
        let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
        let src_local_rest = if is_blender {
            // Include PreRotation (root has -90°X; non-root is identity).
            // Delta uses lcl_rot_rest only, so full_anim = pre_rot * anim.
            pre_rot * lcl_rot_rest
        } else {
            pre_rot
        };
        let rotations = if is_blender {
            let rest_inv = lcl_rot_rest.inverse();
            track.rotations.iter().map(|&r| rest_inv * r).collect()
        } else {
            track.rotations.clone()
        };

        // Root translations: UE Z-up → VRM Y-up, cm → m
        let translations: Vec<Vec3> = track
            .translations
            .iter()
            .map(|&t| fbx_to_gltf_translation(t, is_blender))
            .collect();

        let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);
        let src_parent_global_rest = bone
            .and_then(|b| b.parent.as_ref())
            .and_then(|p| global_rest.get(p))
            .copied()
            .unwrap_or(Quat::IDENTITY);
        result_tracks.push(BoneTrack {
            vrm_bone_name: VRM_ROOT_BONE.to_string(),
            src_bone_name: fbx_name.clone(),
            timestamps: timestamps.clone(),
            rotations,
            translations: Some(translations),
            src_local_rest,
            src_global_rest,
            src_parent_global_rest,
        });
    }

    // 1. Direct mapping — raw deltas
    for (src_bone, vrm_bone_default) in &config.direct_map {
        let vrm_bone = config
            .resolve_vrm_bone(src_bone, version_key)
            .unwrap_or_else(|| vrm_bone_default.clone());

        if config.should_ignore(src_bone) {
            continue;
        }

        let fbx_name = match resolve(src_bone) {
            Some(n) => n,
            None => continue,
        };

        if let Some(track) = body.tracks.get(fbx_name) {
            let bone = body.bones.get(fbx_name);
            let lcl_rot_rest = bone
                .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
                .unwrap_or(Quat::IDENTITY);
            let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
            let src_local_rest = if is_blender {
                pre_rot * lcl_rot_rest
            } else {
                pre_rot
            };
            let rotations = if is_blender {
                let rest_inv = lcl_rot_rest.inverse();
                track.rotations.iter().map(|&r| rest_inv * r).collect()
            } else {
                track.rotations.clone()
            };

            let src_global_rest = global_rest.get(fbx_name).copied().unwrap_or(src_local_rest);

            // For hips: include pelvis translation (converted to glTF Y-up)
            let translations = if vrm_bone == "hips" {
                let bone_rest_t = bone.map(|b| b.rest_translation).unwrap_or(Vec3::ZERO);
                Some(
                    track
                        .translations
                        .iter()
                        .map(|&t| {
                            // Delta from rest position, converted to glTF Y-up
                            let delta_t = t - bone_rest_t;
                            fbx_to_gltf_translation(delta_t, is_blender)
                        })
                        .collect(),
                )
            } else {
                None
            };

            let src_parent_global_rest = bone
                .and_then(|b| b.parent.as_ref())
                .and_then(|p| global_rest.get(p))
                .copied()
                .unwrap_or(Quat::IDENTITY);
            result_tracks.push(BoneTrack {
                vrm_bone_name: vrm_bone,
                src_bone_name: fbx_name.clone(),
                timestamps: timestamps.clone(),
                rotations,
                translations,
                src_local_rest,
                src_global_rest,
                src_parent_global_rest,
                });
        }
    }

    // 2. Accumulate chains (spine, neck, root+pelvis)
    for (vrm_bone, src_bones) in &config.accumulate {
        let mut accumulated = vec![Quat::IDENTITY; frame_count];
        let mut any_matched = false;
        let mut first_src_rest = Quat::IDENTITY;
        let is_hips = vrm_bone == "hips";

        for (bone_idx, cfg_name) in src_bones.iter().enumerate() {
            let fbx_name = match resolve(cfg_name) {
                Some(n) => n,
                None => continue,
            };

            if let Some(track) = body.tracks.get(fbx_name) {
                let bone = body.bones.get(fbx_name);
                let lcl_rot_rest = bone
                    .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
                    .unwrap_or(Quat::IDENTITY);
                if bone_idx == 0 {
                    let pre_rot = bone.map(|b| b.pre_rotation).unwrap_or(Quat::IDENTITY);
                    first_src_rest = if is_blender {
                        pre_rot * lcl_rot_rest
                    } else {
                        pre_rot
                    };
                }
                any_matched = true;

                let rest_inv = lcl_rot_rest.inverse();
                for (i, &r) in track.rotations.iter().enumerate() {
                    if i < frame_count {
                        let rot = if is_blender { rest_inv * r } else { r };
                        accumulated[i] *= rot;
                    }
                }
            }
        }

        if !any_matched {
            continue;
        }

        // Use LAST bone's global for src_global_rest (accumulated chain endpoint)
        // Use FIRST bone's parent for src_parent_global_rest (chain entry point)
        let first_fbx = src_bones.first().and_then(|n| resolve(n));
        let last_fbx = src_bones.iter().rev().find_map(|n| resolve(n));
        let src_global_rest = last_fbx
            .and_then(|n| global_rest.get(n))
            .copied()
            .unwrap_or(first_src_rest);
        let src_parent_global_rest = first_fbx
            .and_then(|n| body.bones.get(n.as_str()))
            .and_then(|b| b.parent.as_ref())
            .and_then(|p| global_rest.get(p))
            .copied()
            .unwrap_or(Quat::IDENTITY);
        // For hips accumulate: include last bone's (pelvis) translation
        let translations = if is_hips {
            let last_cfg = src_bones.last();
            let last_fbx = last_cfg.and_then(|n| resolve(n));
            last_fbx.and_then(|name| {
                let bone = body.bones.get(name)?;
                let track = body.tracks.get(name)?;
                let bone_rest_t = bone.rest_translation;
                Some(
                    track
                        .translations
                        .iter()
                        .map(|&t| {
                            let delta_t = t - bone_rest_t;
                            fbx_to_gltf_translation(delta_t, is_blender)
                        })
                        .collect(),
                )
            })
        } else {
            None
        };

        // Use last resolved FBX bone name for world rotation lookup
        let acc_src_name = last_fbx.cloned().unwrap_or_default();
        result_tracks.push(BoneTrack {
            vrm_bone_name: vrm_bone.clone(),
            src_bone_name: acc_src_name,
            timestamps: timestamps.clone(),
            rotations: accumulated,
            translations,
            src_local_rest: first_src_rest,
            src_global_rest,
            src_parent_global_rest,
        });
    }

    Ok(result_tracks)
}

/// Facial retargeting: produces VRM expression tracks from a
/// [`SourceAnimFacial`] view.
///
/// shotloom port path: this is what the facial expression handler crate
/// (or in bevy-vrm's case, today's same crate) calls. Body skeletal data
/// is handled separately by [`retarget_body`].
pub fn retarget_facial(
    facial: &SourceAnimFacial<'_>,
    config: &RetargetConfig,
) -> Vec<ExpressionTrack> {
    let mut expression_tracks: Vec<ExpressionTrack> = Vec::new();
    for (fbx_channel, weights) in facial.blend_shape_tracks {
        if let Some(vrm_expr) = config.expression_map.get(fbx_channel) {
            expression_tracks.push(ExpressionTrack {
                vrm_expression_name: vrm_expr.clone(),
                weights: weights.clone(),
            });
        }
    }
    expression_tracks
}

/// Combined body + facial retarget — backwards-compatible wrapper.
///
/// New callers that own a `SourceAsset` and want both body and facial
/// tracks in one [`MappedAnimation`] use this. Callers that need only
/// one half (e.g. shotloom-side body-only or facial-only consumers) call
/// [`retarget_body`] / [`retarget_facial`] directly with the appropriate
/// view from `SourceAnimBody::from_source_asset` /
/// `SourceAnimFacial::from_source_asset`.
pub fn retarget(
    fbx: &SourceAsset,
    config: &RetargetConfig,
    vrm_version: VrmVersion,
) -> Result<MappedAnimation, RetargetError> {
    let body = SourceAnimBody::from_source_asset(fbx);
    let facial = SourceAnimFacial::from_source_asset(fbx);

    let bone_tracks = retarget_body(&body, config, vrm_version)?;
    let expression_tracks = retarget_facial(&facial, config);

    let source_resolved = if config.source_type != crate::config::FbxSourceType::Auto {
        config.source_type
    } else {
        fbx.detected_source_type
    };

    Ok(MappedAnimation {
        name: config.name.clone(),
        duration_secs: fbx.duration,
        bone_tracks,
        expression_tracks,
        source_detected: fbx.detected_source_type,
        source_resolved,
    })
}
```

### `src/postprocess/wrist_twist.rs` (     111 LOC)

```rust
//! Wrist twist transfer — EXP-006.
//!
//! Reads each FBX wrist's per-frame forearm-relative rotation, extracts
//! the twist component around the forearm bone-length axis, and applies
//! that scalar magnitude as a local-X rotation on the matching VRM hand
//! bone. Each side reads its own FBX track.
//!
//! Replaces the prior EXP-005 hardcoded `±55°` UserCalibrated entries:
//! that approach worked for one calibrated frame but didn't track the
//! animation. EXP-006 follows the FBX wrist motion frame-by-frame.
//!
//! ## Math
//!
//! For each frame and each hand:
//!
//! ```text
//!     fa_w = coord * fbx_forearm_rot[f] * coord_inv          // FBX Z-up → Y-up
//!     fh_w = coord * fbx_hand_rot[f]    * coord_inv
//!     fbx_wrist_delta = fa_w.inverse() * fh_w                // forearm-relative
//!     (_swing, twist) = swing_twist_decompose(delta, +Y)     // 1-DOF twist
//!     (axis, angle) = twist.to_axis_angle()
//!     signed_angle = if axis.y >= 0 { angle } else { -angle }
//!     extra = Quat::from_rotation_x(-signed_angle)            // VRM hand local X
//!     vrm_hand_rot[f] = vrm_hand_rot[f] * extra
//! ```
//!
//! The `-signed_angle` sign matches the user's calibrated direction
//! convention (visual baseline established in calibration mode).
//!
//! ## Coordinates
//!
//! `coord = Quat::from_rotation_x(-π/2)` rotates FBX Z-up axes to glTF
//! Y-up axes — the same conversion the viewer's `[WRIST-ROT]` diagnostic
//! applies to FBX bone rotations before measurement.
//!
//! ## Limits
//!
//! - **Twist only** — swing (the 2-DOF direction component) is left to
//!   the upstream retargeter / `Pass 2` direction correction. This pass
//!   only touches the 1-DOF rotation around the bone-length axis.
//! - **Skips when no FBX skeleton** — caller passes
//!   `Option<&FbxSkeletonFrames>`; on `None` the function returns
//!   without applying anything.
//! - **Both hands by default** — operates on `leftHand` and `rightHand`
//!   if both have matching FBX tracks via `vrm_to_fbx`.
//!
//! ## Diagnostics
//!
//! Returns log lines describing per-side max applied magnitude:
//!
//! ```text
//!     [postprocess::wrist_twist] leftHand: 142 frames, max=42.3°
//!     [postprocess::wrist_twist] rightHand: 142 frames, max=51.7°
//! ```

use std::collections::HashMap;

use glam::{Quat, Vec3};

use crate::fbx::FbxSkeletonFrames;
use crate::types::TargetAnimation;

/// Apply per-frame FBX wrist twist transfer to both hands.
///
/// Reads `fbx_forearm` / `fbx_hand` rotation tracks from `fbx_skel`,
/// resolved through `vrm_to_fbx`. Mutates the matching hand bone tracks
/// in `anim` in place. Returns one log line per hand processed.
pub fn apply_wrist_twist_transfer(
    anim: &mut TargetAnimation,
    fbx_skel: &FbxSkeletonFrames,
    vrm_to_fbx: &HashMap<String, String>,
) -> Vec<String> {
    let coord = Quat::from_rotation_x(-std::f32::consts::FRAC_PI_2);
    let coord_inv = coord.inverse();

    let sides: [(&str, &str); 2] = [
        ("leftLowerArm", "leftHand"),
        ("rightLowerArm", "rightHand"),
    ];

    let mut logs = Vec::new();
    for (vrm_forearm, vrm_hand) in sides {
        let Some(fak) = vrm_to_fbx.get(vrm_forearm).map(|s| s.as_str()) else { continue };
        let Some(fhk) = vrm_to_fbx.get(vrm_hand).map(|s| s.as_str()) else { continue };
        let Some(fars) = fbx_skel.bone_rotations.get(fak) else { continue };
        let Some(fhrs) = fbx_skel.bone_rotations.get(fhk) else { continue };
        let Some(rh) = anim.bones.iter_mut().find(|b| b.vrm_bone_name == vrm_hand) else { continue };

        let n = rh.rotations.len().min(fars.len()).min(fhrs.len());
        let mut max_applied_deg = 0.0f32;
        for f in 0..n {
            let fa_w = coord * fars[f] * coord_inv;
            let fh_w = coord * fhrs[f] * coord_inv;
            let fbx_wrist_delta = (fa_w.inverse() * fh_w).normalize();
            let (_swing, twist) = crate::types::swing_twist_decompose(fbx_wrist_delta, Vec3::Y);
            let (twist_axis, twist_angle) = twist.to_axis_angle();
            let signed = if twist_axis.y >= 0.0 { twist_angle } else { -twist_angle };
            let extra = Quat::from_rotation_x(-signed);
            rh.rotations[f] = (rh.rotations[f] * extra).normalize();
            let mag_deg = signed.abs().to_degrees();
            if mag_deg > max_applied_deg {
                max_applied_deg = mag_deg;
            }
        }
        logs.push(format!(
            "[postprocess::wrist_twist] {}: {} frames, max={:.1}°",
            vrm_hand, n, max_applied_deg
        ));
    }
    logs
}
```

### `src/postprocess/mod.rs` (      38 LOC)

```rust
//! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
//! after the retargeter has produced it.
//!
//! Each post-process step is a free function that mutates the animation
//! in place and returns log lines describing what it did. No traits, no
//! shared context — just a small set of focused fns the caller chains
//! together.
//!
//! ## When to add a new post-process step
//!
//! Add to this module when you have a fix that:
//! - Depends on data outside the retargeter's `apply()` (FBX skeleton,
//!   sole height, IK targets, ...) so it can't live inside the
//!   retargeter passes.
//! - Needs to be available to multiple callers (viewer, sweep bin,
//!   future shotloom-side orchestration).
//! - Operates on the already-retargeted output, not on raw FBX or VRM.
//!
//! ## When NOT to add here
//!
//! - The fix is per-frame inside the retargeter pipeline → it's a
//!   retargeter pass, not a post-process. Add to `retargeter::apply`.
//! - The fix is at init time on `dst_rest_*` → use the
//!   `adapters::arp_vrm` rest sync system.
//! - The fix is a one-off for a single VRM → use UserCalibrated entries
//!   in `adapters::arp_vrm_user_pose`.
//!
//! ## Promotion to trait
//!
//! Today every post-process is a free function. When a stateful
//! post-process appears (one that needs pre-computed cache or shared
//! resources between frames), introduce a `trait AnimPostprocess` then,
//! not before. Tier 1 devlog lesson: `trait`s are only worth it when
//! `impl`s are 2 or more.

pub mod wrist_twist;

pub use wrist_twist::apply_wrist_twist_transfer;
```

## Source files — public surface only (LOC > 500, TRUNCATED)

### `src/quality/rubric_c.rs` (     828 LOC, [TRUNCATED: public surface only])

```rust
27:use glam::{Quat, Vec3};
28:use std::collections::HashMap;
30:use super::{Grade, HardFailCheck, MetricResult, RubricResult};
31:use super::fk_evaluate::VrmSkeletonFrames;
35:fn grade_score(g: Grade) -> f32 {
52:const JOINT_LIMITS: &[(&str, f32)] = &[
65:const FOOT_BONES: &[&str] = &["leftFoot", "rightFoot"];
68:const EFFECTOR_MAP: &[(&[&str], &str)] = &[
78:fn check_hard_fails(vrm_fk: &VrmSkeletonFrames) -> Vec<HardFailCheck> {
178:const WORLD_BEND_TRIPLETS: &[(&str, &str, &str, f32)] = &[
195:fn vrm_bend_at_frame(
218:fn src_bend_at_frame(
244:fn metric_joint_limit_overshoot(
367:fn metric_ground_contact(
528:fn metric_temporal_stability_residual(
659:fn metric_fidelity(
750:pub fn evaluate(
```

### `src/quality/rubric_a.rs` (     578 LOC, [TRUNCATED: public surface only])

```rust
4:use super::{Grade, MetricResult, HardFailCheck, RubricResult};
5:use glam::Quat;
10:fn grade_score(g: Grade) -> f32 {
21:fn check_hard_fails(body: &crate::source_anim::SourceAnimBody<'_>) -> Vec<HardFailCheck> {
110:fn spike_rate(rotations: &[Quat]) -> f32 {
121:fn metric_angular_velocity_outliers(fbx: &crate::fbx::SourceAsset) -> MetricResult {
190:fn metric_bone_symmetry(fbx: &crate::fbx::SourceAsset) -> MetricResult {
268:fn is_foot_bone(name: &str) -> bool {
272:fn metric_foot_contact(
397:const FPS: f32 = 30.0;
402:const JERK_VELOCITY_STATIC_FLOOR_DEG_S: f32 = 50.0;
407:const JERK_STATIC_THRESHOLD_DEG_S3: f32 = 15_000.0;
412:const JERK_ACTIVE_MULTIPLIER: f32 = 4.5;
414:fn metric_smoothness(fbx: &crate::fbx::SourceAsset) -> MetricResult {
510:pub fn evaluate(fbx: &crate::fbx::SourceAsset) -> RubricResult {
```

### `src/vrm_rest.rs` (     708 LOC, [TRUNCATED: public surface only])

```rust
6:use glam::{Mat4, Quat, Vec3};
7:use std::collections::HashMap;
9:use crate::VrmRestPose;
12:pub enum VrmRestError {
28:pub fn extract_vrm_rest_pose(glb_bytes: &[u8]) -> Result<VrmRestPose, VrmRestError> {
260:pub fn compute_virtual_rest_global(
354:fn compute_foot_sole_offset(
370:fn compute_foot_sole_offset_skinned(
527:fn compute_foot_contact(
664:fn extract_mesh_min_y(glb_bytes: &[u8]) -> Option<f32> {
```

### `src/retargeter.rs` (     751 LOC, [TRUNCATED: public surface only])

```rust
1:use glam::{Quat, Vec3};
2:use std::collections::HashMap;
4:use crate::fbx::SourceAsset;
5:use crate::quality::RetargetQuality;
6:use crate::types::{
10:use crate::RetargetError;
13:const DIRECTION_CORRECTION_ITERATIONS: usize = 3;
15:const DIRECTION_CORRECTION_LO_RAD: f32 = 0.0873;
17:const DIRECTION_CORRECTION_HI_RAD: f32 = 0.2618;
20:struct BoneData {
39:struct CorrectionPair {
48:struct FrameBuffers {
60:struct FbxPairFrameData {
82:pub struct ArpRetargeterInner {
104:pub struct RetargeterOptions {
112:impl ArpRetargeterInner {
695:pub struct IdentityRetargeter {
699:impl IdentityRetargeter {
```

## tests/ file list (bodies omitted — test surface only)

```
      29 tests/finger_axis_map.rs
     179 tests/finger_rest_align.rs
     183 tests/integration.rs
     331 tests/fixtures/mod.rs
     617 tests/metric_fixtures.rs
    1339 total
```

## Critical test file — tests/metric_fixtures.rs (full, 617 LOC)

```rust
//! Phase 0 — Metric fixture runner.
//!
//! Runs every rubric_a metric (and rubric_c with minimal VRM stubs)
//! against each of the 6 hand-written synthetic fixtures. Each test
//! asserts the *hand-computed correct* expected value from the fixture
//! comment. A failing test is a locked bug reproduction, not an error
//! in the test — it documents a metric that disagrees with the
//! comment's arithmetic.
//!
//! Run with `cargo test --test metric_fixtures`. Use `-- --nocapture`
//! to see the per-metric detail lines.

mod fixtures;

use fixtures::*;
use glam::{Quat, Vec3};
use humanoid_retarget::fbx::SourceAsset;
use humanoid_retarget::quality::fk_evaluate::VrmSkeletonFrames;
use humanoid_retarget::quality::{Grade, RubricResult, rubric_a, rubric_c};
use humanoid_retarget::types::{
    FbxSkeletonFrames, TargetAnimation, VrmRestPose,
};
use std::collections::HashMap;

// ── rubric A helpers ─────────────────────────────────────────────────────────

fn run_a(fbx: &SourceAsset) -> RubricResult {
    rubric_a::evaluate(fbx)
}

fn metric(r: &RubricResult, name_prefix: &str) -> Grade {
    r.metrics
        .iter()
        .find(|m| m.name.starts_with(name_prefix))
        .map(|m| m.grade)
        .unwrap_or(Grade::A)
}

fn print_rubric(tag: &str, r: &RubricResult) {
    println!("[{tag}] overall={} score={:.1}", r.overall.label(), r.overall_score);
    for h in &r.hard_fails {
        println!(
            "  hardfail {}: {} ({})",
            if h.passed { "PASS" } else { "FAIL" },
            h.name,
            h.detail
        );
    }
    for m in &r.metrics {
        println!("  {} = {} — {}", m.name, m.grade.label(), m.detail);
    }
}

// ── Fixture 1: identity_30_frames ────────────────────────────────────────────
// Expected: every metric Grade::A, overall A.

#[test]
fn rubric_a_identity() {
    let fbx = identity_30_frames();
    let r = run_a(&fbx);
    print_rubric("A/identity", &r);
    assert!(!r.has_hard_fail(), "identity fixture should pass hard fails");
    assert_eq!(metric(&r, "A1.1"), Grade::A);
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    assert_eq!(metric(&r, "A1.4"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 2: arm_linear_sweep ──────────────────────────────────────────────
// Expected: Grade::A everywhere (constant-rate rotation, 3°/frame).

#[test]
fn rubric_a_arm_linear_sweep() {
    let fbx = arm_linear_sweep();
    let r = run_a(&fbx);
    print_rubric("A/arm_linear_sweep", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "A1.1"), Grade::A, "linear sweep is not a spike");
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    assert_eq!(metric(&r, "A1.4"), Grade::A, "constant velocity → zero jerk");
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 3: single_discontinuity ──────────────────────────────────────────
// HAND-EXPECTED: A1.1 should detect the 30° discontinuity → at worst
// non-A grade. ACTUAL: median-zero early-out returns 0. Test is RED.

#[test]
fn rubric_a_single_discontinuity() {
    let fbx = single_discontinuity();
    let r = run_a(&fbx);
    print_rubric("A/single_discontinuity", &r);
    assert!(!r.has_hard_fail());
    // A correct spike detector should notice the 30° jump.
    assert_ne!(
        metric(&r, "A1.1"),
        Grade::A,
        "A1.1 should detect the one legitimate discontinuity; median-zero \
         early-out bug hides it"
    );
}

// ── Fixture 4: periodic_arm_swing ────────────────────────────────────────────
// Expected: Grade::A for A1.1 / A1.2. A1.4 expected B (smooth sinusoid
// but |jerk| bound ≈ 8200 °/s³ crosses 5000 threshold).

#[test]
fn rubric_a_periodic_arm_swing() {
    let fbx = periodic_arm_swing();
    let r = run_a(&fbx);
    print_rubric("A/periodic_arm_swing", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "periodic motion is not a gimbal spike"
    );
    assert_eq!(metric(&r, "A1.2"), Grade::A);
    let a14 = metric(&r, "A1.4");
    assert!(
        matches!(a14, Grade::A | Grade::B),
        "A1.4 jerk on a smooth 30° sinusoid should be A or B, got {}",
        a14.label()
    );
}

// ── Fixture 5: mirrored_jumping_jack ─────────────────────────────────────────
// Expected: Grade::A everywhere. Bind is symmetric so A1.2 is A regardless
// of animation; per-bone rates are 0 (constant step); jerk 0.

#[test]
fn rubric_a_mirrored_jumping_jack() {
    let fbx = mirrored_jumping_jack();
    let r = run_a(&fbx);
    print_rubric("A/mirrored_jumping_jack", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "A1.1"), Grade::A);
    assert_eq!(metric(&r, "A1.2"), Grade::A, "bind pose is perfectly symmetric");
    assert_eq!(metric(&r, "A1.4"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

// ── Fixture 7: stretch_bones_only ────────────────────────────────────────────
// ARP stretch helpers get a 60° sawtooth; every real bone is static.
// A correct A1.1 should filter stretch bones out of its evaluation pool
// entirely → Grade A. Current: not filtered → RED.

#[test]
fn rubric_a_stretch_bones_only() {
    let fbx = stretch_bones_only();
    let r = run_a(&fbx);
    print_rubric("A/stretch_bones_only", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "ARP stretch helpers are not retargeted; A1.1 should name-filter \
         `*_stretch.*` out of its evaluation pool"
    );
}

// ── Fixture 6: fast_heel_strike ──────────────────────────────────────────────
// HAND-EXPECTED: Grade::A — periodic sawtooth is legitimate motion.
// ACTUAL: A1.1 returns C because 3×median threshold flags the wraparound
// steps. RED.

#[test]
fn rubric_a_fast_heel_strike() {
    let fbx = fast_heel_strike();
    let r = run_a(&fbx);
    print_rubric("A/fast_heel_strike", &r);
    assert!(!r.has_hard_fail());
    // Correct detector should not flag periodic in-band peaks.
    assert_eq!(
        metric(&r, "A1.1"),
        Grade::A,
        "periodic sawtooth with 4× in-band peaks is not a spike; \
         current 3×median detector false-flags it"
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Rubric C plumbing
// ═════════════════════════════════════════════════════════════════════════════
//
// Rubric C reads per-frame VRM bone positions + rotations. We build
// those directly from each FBX fixture by renaming ARP-style bones to
// VRM-humanoid bones and computing a trivial forward kinematic chain
// that leaves every joint at its rest position (bone_positions static)
// but faithfully propagates the fixture's per-frame local rotations.
// fidelity is skipped (src_fk = None).

const ARP_TO_VRM: &[(&str, &str)] = &[
    ("root.x", "hips"),
    ("spine.x", "spine"),
    ("chest.x", "chest"),
    ("neck.x", "neck"),
    ("head.x", "head"),
    ("shoulder.l", "leftShoulder"),
    ("shoulder.r", "rightShoulder"),
    ("arm.l", "leftUpperArm"),
    ("arm.r", "rightUpperArm"),
    ("forearm.l", "leftLowerArm"),
    ("forearm.r", "rightLowerArm"),
    ("hand.l", "leftHand"),
    ("hand.r", "rightHand"),
    ("thigh.l", "leftUpperLeg"),
    ("thigh.r", "rightUpperLeg"),
    ("leg.l", "leftLowerLeg"),
    ("leg.r", "rightLowerLeg"),
    ("foot.l", "leftFoot"),
    ("foot.r", "rightFoot"),
];

/// Static VRM rest positions (world-space, y-up meters). The actual
/// numeric values don't matter to stability / joint_limit — only ground
/// contact reads them, and it only cares about foot.y which we peg
/// slightly above zero. All positions are constant across frames.
fn vrm_rest_positions() -> HashMap<&'static str, Vec3> {
    let mut m = HashMap::new();
    m.insert("hips", Vec3::new(0.0, 0.9, 0.0));
    m.insert("spine", Vec3::new(0.0, 1.0, 0.0));
    m.insert("chest", Vec3::new(0.0, 1.1, 0.0));
    m.insert("neck", Vec3::new(0.0, 1.45, 0.0));
    m.insert("head", Vec3::new(0.0, 1.6, 0.0));
    m.insert("leftShoulder", Vec3::new(0.1, 1.4, 0.0));
    m.insert("rightShoulder", Vec3::new(-0.1, 1.4, 0.0));
    m.insert("leftUpperArm", Vec3::new(0.2, 1.4, 0.0));
    m.insert("rightUpperArm", Vec3::new(-0.2, 1.4, 0.0));
    m.insert("leftLowerArm", Vec3::new(0.45, 1.4, 0.0));
    m.insert("rightLowerArm", Vec3::new(-0.45, 1.4, 0.0));
    m.insert("leftHand", Vec3::new(0.65, 1.4, 0.0));
    m.insert("rightHand", Vec3::new(-0.65, 1.4, 0.0));
    m.insert("leftUpperLeg", Vec3::new(0.1, 0.9, 0.0));
    m.insert("rightUpperLeg", Vec3::new(-0.1, 0.9, 0.0));
    m.insert("leftLowerLeg", Vec3::new(0.1, 0.5, 0.0));
    m.insert("rightLowerLeg", Vec3::new(-0.1, 0.5, 0.0));
    m.insert("leftFoot", Vec3::new(0.1, 0.05, 0.0));
    m.insert("rightFoot", Vec3::new(-0.1, 0.05, 0.0));
    m
}

struct CInputs {
    vrm_fk: VrmSkeletonFrames,
    result: TargetAnimation,
    vrm_rest: VrmRestPose,
}

/// Build the VRM-side `VrmRestPose` used by rubric C. This is test
/// harness scaffolding: it describes rubric B's "validated target rest"
/// for these synthetic fixtures. Independent of whatever retargeter we
/// plug in via the `Retargeter` trait.
fn build_vrm_rest_for_fixtures() -> VrmRestPose {
    let rests = vrm_rest_positions();
    let mut bone_rest_local: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_global: HashMap<String, Quat> = HashMap::new();
    let mut bone_rest_translation: HashMap<String, Vec3> = HashMap::new();
    let mut bone_world_position: HashMap<String, Vec3> = HashMap::new();
    let mut virtual_rest_global: HashMap<String, Quat> = HashMap::new();

    for (_arp, vrm) in ARP_TO_VRM {
        let rest_pos = rests.get(vrm).copied().unwrap_or(Vec3::ZERO);
        bone_rest_local.insert((*vrm).to_string(), Quat::IDENTITY);
        bone_rest_global.insert((*vrm).to_string(), Quat::IDENTITY);
        bone_rest_translation.insert((*vrm).to_string(), rest_pos);
        bone_world_position.insert((*vrm).to_string(), rest_pos);
        virtual_rest_global.insert((*vrm).to_string(), Quat::IDENTITY);
    }

    let mut parent_map: HashMap<String, String> = HashMap::new();
    for (child, parent) in &[
        ("spine", "hips"),
        ("chest", "spine"),
        ("neck", "chest"),
        ("head", "neck"),
        ("leftShoulder", "chest"),
        ("rightShoulder", "chest"),
        ("leftUpperArm", "leftShoulder"),
        ("rightUpperArm", "rightShoulder"),
        ("leftLowerArm", "leftUpperArm"),
        ("rightLowerArm", "rightUpperArm"),
        ("leftHand", "leftLowerArm"),
        ("rightHand", "rightLowerArm"),
        ("leftUpperLeg", "hips"),
        ("rightUpperLeg", "hips"),
        ("leftLowerLeg", "leftUpperLeg"),
        ("rightLowerLeg", "rightUpperLeg"),
        ("leftFoot", "leftLowerLeg"),
        ("rightFoot", "rightLowerLeg"),
    ] {
        parent_map.insert((*child).to_string(), (*parent).to_string());
    }

    VrmRestPose {
        bone_rest_local,
        bone_rest_global,
        bone_rest_translation,
        bone_world_position,
        parent_map,
        hips_height: 0.9,
        root_rest_rotation: Quat::IDENTITY,
        virtual_rest_global,
        foot_sole_offset: (0.0, 0.0),
        foot_contact: None,
    }
}

/// Build `VrmSkeletonFrames` for rubric C's positional metrics. Rubric C
/// wants world-space bone positions per frame; since the identity
/// retargeter doesn't move joints (only propagates local rotations at
/// fixed rest positions), we peg every frame's position at the rest
/// position. Also reads rotations back out of the `TargetAnimation` so
/// the two are consistent.
fn build_vrm_fk_from_result(
    result: &TargetAnimation,
    frame_count: usize,
    duration: f32,
) -> VrmSkeletonFrames {
    let rests = vrm_rest_positions();
    let mut bone_positions: HashMap<String, Vec<Vec3>> = HashMap::new();
    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();

    for bone in &result.bones {
        let rest_pos = rests
            .get(bone.vrm_bone_name.as_str())
            .copied()
            .unwrap_or(Vec3::ZERO);
        bone_positions.insert(bone.vrm_bone_name.clone(), vec![rest_pos; frame_count]);
        bone_rotations.insert(bone.vrm_bone_name.clone(), bone.rotations.clone());
    }

    VrmSkeletonFrames {
        frame_count,
        duration,
        bone_positions,
        bone_rotations,
    }
}

fn build_c_inputs(fbx: &SourceAsset) -> CInputs {
    use humanoid_retarget::IdentityRetargeter;

    let vrm_rest = build_vrm_rest_for_fixtures();

    let bone_map: Vec<(String, String)> = ARP_TO_VRM
        .iter()
        .map(|(arp, vrm)| ((*arp).to_string(), (*vrm).to_string()))
        .collect();
    let identity = IdentityRetargeter::new(bone_map);
    let result = identity
        .retarget(fbx, &vrm_rest)
        .expect("IdentityRetargeter is infallible on synthetic fixtures");

    let vrm_fk = build_vrm_fk_from_result(&result, fbx.frame_count, fbx.duration);

    CInputs {
        vrm_fk,
        result,
        vrm_rest,
    }
}

fn run_c(fbx: &SourceAsset) -> RubricResult {
    // Rubric pipeline ordering: A (source) before C (retargeter). If A
    // hard-fails, running C on the same input is meaningless — C scores
    // the retargeter, not the input, and a broken input can't produce a
    // trustworthy retargeter score. Mirrors shotloom-import's
    // `import_and_validate` gating.
    let a = rubric_a::evaluate(fbx);
    if a.has_hard_fail() {
        panic!(
            "rubric A hard-failed on this fixture; rubric C was not run (upstream-A gate)"
        );
    }
    let c = build_c_inputs(fbx);
    let src_fk: Option<&FbxSkeletonFrames> = None;

    // Per-VRM-bone source rotation tracks — feeds C1.3 Stability
    // residual. Uses the same ARP_TO_VRM mapping the identity
    // retargeter consumed.
    let mut src_rotations_by_vrm: HashMap<String, Vec<Quat>> = HashMap::new();
    // Per-VRM-bone FBX bone name — feeds C1.1 world-space triplet
    // lookup. Absent from the fixture harness (no FbxSkeletonFrames),
    // so C1.1 will be skipped here regardless. Left in place so the
    // fixture run_c mirrors the orchestrator signature shape.
    let mut vrm_to_fbx_name: HashMap<String, String> = HashMap::new();
    for (arp, vrm) in ARP_TO_VRM {
        if let Some(track) = fbx.tracks.get(*arp) {
            src_rotations_by_vrm.insert((*vrm).to_string(), track.rotations.clone());
        }
        vrm_to_fbx_name.insert((*vrm).to_string(), (*arp).to_string());
    }

    rubric_c::evaluate(
        &c.vrm_fk,
        src_fk,
        &c.result,
        &c.vrm_rest,
        Some(&src_rotations_by_vrm),
        Some(&vrm_to_fbx_name),
    )
}

// ── Rubric C per-fixture tests ───────────────────────────────────────────────
// All static bone positions → ground_contact should be Grade::A across
// the board; joint_limit reacts to the fixture's local rotations;
// stability reacts to the fixture's rotation deltas; fidelity is absent.

#[test]
fn rubric_c_identity() {
    let r = run_c(&identity_30_frames());
    print_rubric("C/identity", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    assert_eq!(metric(&r, "C1.3"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

#[test]
fn rubric_c_arm_linear_sweep() {
    let r = run_c(&arm_linear_sweep());
    print_rubric("C/arm_linear_sweep", &r);
    assert!(!r.has_hard_fail());
    // leftUpperArm reaches only 87°, well under the 180° UpperArm limit.
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Constant-rate rotation has constant velocity → zero pop frames.
    assert_eq!(metric(&r, "C1.3"), Grade::A);
}

#[test]
fn rubric_c_single_discontinuity() {
    let r = run_c(&single_discontinuity());
    print_rubric("C/single_discontinuity", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Post-residual redesign (C1.1 + C1.3 + C1.4): the 30° pop and any
    // joint-angle weirdness live in the input, not in the retargeter.
    // Under identity passthrough every input→output residual is zero,
    // so all three residual metrics grade A. Input issues are caught
    // by rubric A (see `rubric_a_single_discontinuity` above). This
    // replaces the pre-2026-04-13 locked contradiction that asserted
    // C1.3 != A.
    assert_eq!(
        metric(&r, "C1.1"),
        Grade::A,
        "identity retargeter introduced zero joint overshoot; C1.1 \
         must not re-penalize input joint angles rubric A already caught"
    );
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "identity retargeter introduced zero residual; C1.3 must not \
         re-penalize input quality rubric A already caught"
    );
}

#[test]
fn rubric_c_periodic_arm_swing() {
    let r = run_c(&periodic_arm_swing());
    print_rubric("C/periodic_arm_swing", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // Smooth sinusoid should not produce pop frames.
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "periodic smooth motion is not a pop"
    );
}

#[test]
fn rubric_c_mirrored_jumping_jack() {
    let r = run_c(&mirrored_jumping_jack());
    print_rubric("C/mirrored_jumping_jack", &r);
    assert!(!r.has_hard_fail());
    // Arm 87° + Leg 58° — well under joint limits.
    assert_eq!(metric(&r, "C1.1"), Grade::A);
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    assert_eq!(metric(&r, "C1.3"), Grade::A);
    assert_eq!(r.overall, Grade::A);
}

#[test]
fn rubric_c_fast_heel_strike() {
    let r = run_c(&fast_heel_strike());
    print_rubric("C/fast_heel_strike", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(metric(&r, "C1.2"), Grade::A);
    // HAND-EXPECTED: periodic sawtooth is legitimate motion, not
    // instability. Current 3×median detector in C1.3 mirrors A1.1's
    // false-positive pattern.
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "C1.3 should not flag periodic sawtooth as temporal instability"
    );
}

// ═════════════════════════════════════════════════════════════════════════════
// Rubric C identity-passthrough contradiction (Phase 3.5, 2026-04-13)
// ═════════════════════════════════════════════════════════════════════════════
//
// Rubric C is defined as "input→output residual only" — see the axis
// rule documented at the top of `src/quality/rubric_c.rs`. Under that
// rule, when the retargeter is an identity function (output == input),
// every Rubric C metric MUST grade A regardless of how ugly the input
// animation is. The retargeter did nothing, so it cannot have done
// anything wrong.
//
// `build_c_inputs` is already an identity retargeter: it copies each
// ARP bone's rotation track onto the matching VRM humanoid bone name.
// So for any fixture whose Rubric A would grade non-A, the Rubric C
// pass should still grade A if and only if the C metrics respect the
// input-output residual rule.
//
// The test below feeds `single_discontinuity` (a known Rubric A non-A
// input: one 30° jump on arm.l at frame 10) through the identity
// retargeter. A correctly-shaped Rubric C must grade C1.3 = A because
// the retargeter introduced ZERO new deltas — it passed through the
// exact ugly input the user provided.
//
// Current C1.3 grades this as B (see `rubric_c_single_discontinuity`
// above, which explicitly asserts `!= A` and passes). That is the
// structural bug: C1.3 reads only `vrm_fk.bone_rotations` and answers
// "does the output animation have pops?", a Rubric A question. It
// does not compare input to output; it has no concept of residual.
//
// This test is marked `#[ignore]` and locks the contradiction as
// executable evidence. Run with `cargo test -- --ignored` to confirm
// it fails with a clear message. The fix is a residual-based C1.3
// redesign scheduled for the next metric session — NOT a detector
// tuning pass. Detector tuning on C1.3 cannot fix this because the
// bug is that C1.3 is measuring the wrong function.

#[test]
fn rubric_c_identity_passthrough_c13_should_not_flag_input_spikes() {
    // Input carries a known Rubric A non-A: one 30° jump on arm.l.
    let fbx = single_discontinuity();
    // `build_c_inputs` is the identity retargeter — VRM tracks are
    // exact copies of the ARP tracks. So the retargeter did nothing.
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "C1.3"),
        Grade::A,
        "identity retargeter introduced zero new rotation deltas; C1.3 \
         must not penalize input quality it had no hand in creating"
    );
}

/// C1.1 residual sibling of the C1.3 identity passthrough contract.
///
/// Rubric C scores the retargeter. Joint-limit violations that live in
/// the source animation are a Rubric A concern — C1.1 must not double
/// count them. Under an identity retargeter the per-frame joint bend
/// angle on the VRM side equals the source side exactly, so overshoot
/// is zero for every matched bone across every frame.
///
/// The fixture (`single_discontinuity`) has one 30° pop on `arm.l`.
/// Pre-2026-04-14 C1.1 read `angle_between(vrm_out, vrm_rest)` in
/// isolation and graded by `JOINT_LIMITS` thresholds, potentially
/// flagging the input pop. Post-redesign the metric uses `max(0,
/// vrm_bend − src_bend)` and correctly reports zero overshoot.
#[test]
fn rubric_c_identity_passthrough_c11_should_not_flag_input_joint_angles() {
    let fbx = single_discontinuity();
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough_c11 (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    assert_eq!(
        metric(&r, "C1.1"),
        Grade::A,
        "identity retargeter introduced zero joint overshoot; C1.1 \
         must not re-penalize input joint angles rubric A already caught"
    );
}

/// C1.4 residual sibling. Fixture hips heights (src = vrm = 0.9 m)
/// give `size_ratio = 1.0`, so `normalized = vrm_path / src_path`
/// exactly. Under an identity retargeter vrm path equals src path by
/// construction (same rotation tracks against identical rest), so the
/// normalized ratio is 1.0 → grade A.
///
/// Pre-2026-04-14 C1.4 used raw `vrm_path / src_path` and was already
/// correct on identity fixtures with matching scale; the real bug
/// landed on small-stylized VRMs in the sweep where `vrm_hips <
/// src_hips` produced a raw ratio < 1 purely from scale. This test
/// locks the size-normalization path on the fixture side so that the
/// sweep behavior is mirrored by a hermetic unit test.
#[test]
fn rubric_c_identity_passthrough_c14_should_not_flag_proportion() {
    let fbx = single_discontinuity();
    let r = run_c(&fbx);
    print_rubric("C/identity_passthrough_c14 (single_discontinuity)", &r);
    assert!(!r.has_hard_fail());
    // C1.4 is skipped when vrm_fk has static positions (no path to
    // measure). `single_discontinuity` has static rest positions across
    // frames, so expect the metric to be absent or grade A — treat
    // "absent" as equivalent to A since skipping means rubric C did
    // not charge the retargeter anything on this axis.
    let c14 = r.metrics.iter().find(|m| m.name == "C1.4_Fidelity");
    match c14 {
        Some(m) => assert_eq!(
            m.grade,
            Grade::A,
            "identity retargeter against matching hips height must \
             normalize to a 1.0× path ratio on C1.4"
        ),
        None => {
            // skipped (no src_fk in fixture harness) — acceptable:
            // zero weight charged, not a failure.
        }
    }
}
```

codex
요청 범위는 `crates/humanoid_retarget` 전체를 기준으로 `crates/shotloom-retarget`로 옮기는 Session 2 계획서 작성입니다. 먼저 워크스페이스의 실제 파일 구조와 ADR, 그리고 `shotloom-retarget`/`shotloom-common`의 현재 상태를 확인해 의존성 그래프와 계약 표면을 사실 기반으로 정리하겠습니다.
exec
/bin/zsh -lc "rg -n \"name = \\\"shotloom-retarget\\\"|name = \\\"shotloom-common\\\"|name = \\\"humanoid_retarget\\\"|workspace\" Cargo.toml crates/**/Cargo.toml" in /Users/deemooooooooo/Desktop/www/caol-ila
 exited 1 in 0ms:
zsh:1: no matches found: crates/**/Cargo.toml

exec
/bin/zsh -lc "rg --files docs/adr crates | rg 'adr-0021|adr-0023|shotloom-retarget|shotloom-common|humanoid_retarget|Cargo.toml"'$'"'" in /Users/deemooooooooo/Desktop/www/caol-ila
 exited 1 in 0ms:
rg: docs/adr: No such file or directory (os error 2)
rg: crates: No such file or directory (os error 2)

codex
현재 작업 디렉터리와 실제 레포 루트를 다시 잡겠습니다. 방금 경로가 비어 있었기 때문에, 먼저 상위 트리에서 워크스페이스 루트를 찾은 뒤 그 기준으로 ADR과 크레이트를 확인하겠습니다.
exec
/bin/zsh -lc pwd in /Users/deemooooooooo/Desktop/www/caol-ila
 succeeded in 0ms:
/Users/deemooooooooo/Desktop/www/caol-ila

exec
/bin/zsh -lc 'ls -la' in /Users/deemooooooooo/Desktop/www/caol-ila
 succeeded in 0ms:
total 24
drwxr-xr-x@  9 deemooooooooo  staff   288 Apr 10 15:17 .
drwxr-xr-x@ 12 deemooooooooo  staff   384 Apr 14 10:24 ..
drwxr-xr-x   4 deemooooooooo  staff   128 Apr 14 11:23 .claude
drwxr-xr-x  15 deemooooooooo  staff   480 Apr 14 10:47 .git
-rw-r--r--@  1 deemooooooooo  staff  1005 Apr  6 08:14 .gitignore
-rw-r--r--@  1 deemooooooooo  staff  5159 Mar 23 11:39 README.md
drwxr-xr-x  12 deemooooooooo  staff   384 Apr 14 10:43 claude
drwxr-xr-x@  4 deemooooooooo  staff   128 Apr 10 16:16 drinks
drwxr-xr-x@  3 deemooooooooo  staff    96 Apr  1 12:21 project-logs

exec
/bin/zsh -lc "find .. -maxdepth 3 \\( -name Cargo.toml -o -name adr-0023-retargeter-validation-contract.md -o -name adr-0021-cross-crate-diagnostic-type.md \\) | sed 's#"'^#FOUND #'"'" in /Users/deemooooooooo/Desktop/www/caol-ila
 succeeded in 0ms:
FOUND ../megamelange/vrm2u/Cargo.toml
FOUND ../bevy-vrm/Cargo.toml
FOUND ../shotloom-github/Cargo.toml

exec
/bin/zsh -lc "ls -R crates/shotloom-retarget crates/shotloom-common | sed -n '1,220p'" in /Users/deemooooooooo/Desktop/www/shotloom-github
exec
/bin/zsh -lc "rg -n \"name = \\\"shotloom-retarget\\\"|name = \\\"shotloom-common\\\"|members =|resolver\" Cargo.toml crates/*/Cargo.toml" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-common:
Cargo.toml
README.md
src

crates/shotloom-common/src:
diagnostic.rs
lib.rs
telemetry.rs

crates/shotloom-retarget:
Cargo.toml
src

crates/shotloom-retarget/src:
lib.rs

 succeeded in 0ms:
crates/shotloom-retarget/Cargo.toml:2:name = "shotloom-retarget"
Cargo.toml:2:members = [
Cargo.toml:19:resolver = "2"
crates/shotloom-common/Cargo.toml:2:name = "shotloom-common"

exec
/bin/zsh -lc "rg --files docs crates | rg 'adr-0021|adr-0023|shotloom-retarget|shotloom-common'" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-common/src/diagnostic.rs
crates/shotloom-common/src/lib.rs
crates/shotloom-common/src/telemetry.rs
crates/shotloom-common/README.md
crates/shotloom-common/Cargo.toml
docs/adr/adr-0021-cross-crate-diagnostic-type.md
docs/adr/adr-0023-retargeter-validation-contract.md
crates/shotloom-retarget/Cargo.toml
crates/shotloom-retarget/src/lib.rs

exec
/bin/zsh -lc "sed -n '1,200p' crates/shotloom-common/src/lib.rs" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
//! Shared types, math helpers, and common utilities for Shotloom.

pub mod diagnostic;
pub mod telemetry;

pub use diagnostic::Diagnostic;

exec
/bin/zsh -lc "sed -n '1,220p' crates/shotloom-common/src/diagnostic.rs" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
//! Cross-crate diagnostic type for structured validation and observation
//! reporting.
//!
//! **Diagnostics are not errors.** A `Diagnostic` is an observation or report
//! about state — validation warnings, info notices, asset quality checks. An
//! operation can succeed (`Ok(result)`) while carrying `Vec<Diagnostic>` with
//! warnings. For actual failures that stop execution, use the error types in
//! each crate (e.g., `VrmNormalizationError`, `RuntimeErrorPayload`).
//!
//! Diagnostics are transient: recomputed each evaluation or validation pass,
//! never stored in the project bundle. The bridge emits them via
//! `validation_diagnostics` events; the UI replaces its diagnostic state on
//! each emission.
//!
//! See ADR-0021 for the full design rationale.

use serde::{Deserialize, Serialize};

/// Severity level for a diagnostic.
///
/// - `Error`: hard-gate — the asset or operation should be rejected.
/// - `Warning`: soft-gate — the asset or operation is allowed but has issues.
/// - `Info`: observation — informational notice (e.g., void stage fallback).
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DiagnosticSeverity {
    Error,
    Warning,
    Info,
}

/// Location of the primary entity related to a diagnostic.
///
/// Uses a tagged-string pattern to remain domain-agnostic. Entity type values
/// (e.g., `"clip"`, `"character"`, `"asset"`, `"bone"`) are conventions
/// defined by producing crates, not a closed enum.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub struct DiagnosticLocation {
    pub entity_type: String,
    pub entity_id: String,
}

/// A structured observation about asset quality, validation state, or
/// evaluation results.
///
/// See the module documentation for the "diagnostics are not errors"
/// distinction.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    /// Machine-readable code — bare `snake_case` identifier (e.g.,
    /// `"missing_required_bone"`, `"overlapping_clips"`). The `source` field
    /// identifies the producing subsystem.
    pub code: String,
    /// Human-readable description.
    pub message: String,
    /// Secondary entity references (clip IDs, bone names, asset IDs).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub related_ids: Vec<String>,
    /// Producing subsystem: `"vrm_parser"`, `"timeline_eval"`.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    /// Actionable recovery hint when available.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub suggestion: Option<String>,
    /// Whether the user can take action to fix the issue. `None` when the
    /// producer has no guidance.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub recoverable: Option<bool>,
    /// Tagged primary entity for UI routing.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub location: Option<DiagnosticLocation>,
}

impl Diagnostic {
    /// Create an error-severity diagnostic.
    pub fn error(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Error,
            code: code.into(),
            message: message.into(),
            related_ids: Vec::new(),
            source: None,
            suggestion: None,
            recoverable: None,
            location: None,
        }
    }

    /// Create a warning-severity diagnostic.
    pub fn warning(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Warning,
            code: code.into(),
            message: message.into(),
            related_ids: Vec::new(),
            source: None,
            suggestion: None,
            recoverable: None,
            location: None,
        }
    }

    /// Create an info-severity diagnostic.
    pub fn info(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            severity: DiagnosticSeverity::Info,
            code: code.into(),
            message: message.into(),
            related_ids: Vec::new(),
            source: None,
            suggestion: None,
            recoverable: None,
            location: None,
        }
    }

    pub fn with_source(mut self, source: impl Into<String>) -> Self {
        self.source = Some(source.into());
        self
    }

    pub fn with_suggestion(mut self, suggestion: impl Into<String>) -> Self {
        self.suggestion = Some(suggestion.into());
        self
    }

    pub fn with_related_ids(mut self, ids: Vec<String>) -> Self {
        self.related_ids = ids;
        self
    }

    pub fn with_location(
        mut self,
        entity_type: impl Into<String>,
        entity_id: impl Into<String>,
    ) -> Self {
        self.location = Some(DiagnosticLocation {
            entity_type: entity_type.into(),
            entity_id: entity_id.into(),
        });
        self
    }

    pub fn with_recoverable(mut self, recoverable: bool) -> Self {
        self.recoverable = Some(recoverable);
        self
    }
}

impl std::fmt::Display for Diagnostic {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let level = match self.severity {
            DiagnosticSeverity::Error => "ERROR",
            DiagnosticSeverity::Warning => "WARN",
            DiagnosticSeverity::Info => "INFO",
        };
        write!(f, "[{}] {}: {}", level, self.code, self.message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constructors_produce_correct_severity() {
        let e = Diagnostic::error("code", "msg");
        assert_eq!(e.severity, DiagnosticSeverity::Error);

        let w = Diagnostic::warning("code", "msg");
        assert_eq!(w.severity, DiagnosticSeverity::Warning);

        let i = Diagnostic::info("code", "msg");
        assert_eq!(i.severity, DiagnosticSeverity::Info);
    }

    #[test]
    fn builder_chaining() {
        let d = Diagnostic::warning("missing_meta", "Missing VRM metadata")
            .with_source("vrm_parser")
            .with_suggestion("Re-export with metadata filled in")
            .with_related_ids(vec!["bone_hips".into()])
            .with_location("asset", "avatar.vrm")
            .with_recoverable(true);

        assert_eq!(d.source.as_deref(), Some("vrm_parser"));
        assert_eq!(
            d.suggestion.as_deref(),
            Some("Re-export with metadata filled in")
        );
        assert_eq!(d.related_ids, vec!["bone_hips"]);
        assert_eq!(
            d.location,
            Some(DiagnosticLocation {
                entity_type: "asset".into(),
                entity_id: "avatar.vrm".into(),
            })
        );
        assert_eq!(d.recoverable, Some(true));
    }

    #[test]
    fn display_format() {
        let d = Diagnostic::error("missing_required_bone", "Required bone 'hips' not found");
        assert_eq!(
            d.to_string(),
            "[ERROR] missing_required_bone: Required bone 'hips' not found"
        );

        let w = Diagnostic::warning("overlapping_clips", "Clips overlap");
        assert_eq!(w.to_string(), "[WARN] overlapping_clips: Clips overlap");

        let i = Diagnostic::info("void_fallback", "Using void stage");
        assert_eq!(i.to_string(), "[INFO] void_fallback: Using void stage");
    }

    #[test]
    fn serde_roundtrip() {

exec
/bin/zsh -lc "sed -n '1,200p' crates/shotloom-retarget/Cargo.toml && printf '\\n---LIB---\\n' && sed -n '1,200p' crates/shotloom-retarget/src/lib.rs" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
[package]
name = "shotloom-retarget"
version.workspace = true
edition.workspace = true
license.workspace = true
repository.workspace = true

[dependencies]
serde = { workspace = true }

---LIB---
//! ARP (humanoid FBX) → VRM skeletal animation retargeting.
//!
//! This crate owns the transformation from a validated source humanoid
//! animation onto a validated VRM target model, plus the rubric-based
//! quality grading of the result. It does **not** own scene, actor,
//! character, or assembly concepts — those are caller responsibilities
//! in `shotloom-stage`, `shotloom-import`, or editor code.
//!
//! # Current state
//!
//! This is the Phase B session 1 scaffold. The crate currently exposes
//! no types or functions; subsequent sessions will port the domain-local
//! types (`SourceAsset`, `MappedAnimation`, `TargetAnimation`,
//! `VrmRestPose`, `Grade`, `RubricResult`, rubric evaluation modules)
//! and wire the public entry point to a marker-gated contract.
//!
//! # Contract preview
//!
//! See [ADR-0023](../../../docs/adr/adr-0023-retargeter-validation-contract.md)
//! for the binding design decisions:
//!
//! - **Operational diagnostic axis** — uses `shotloom-common::Diagnostic`
//!   per ADR-0021 for cross-crate reporting of "can retarget run."
//! - **Quality grade axis** — uses crate-local `Grade` / `RubricResult`
//!   for the 4-level rubric scoring of "how faithful was it."
//! - **Type-level validation** — the public entry point will consume
//!   `shotloom_common::ValidatedSource<'_>` and
//!   `shotloom_common::ValidatedTarget<'_>`, enforcing "both inputs
//!   validated" at compile time.
//! - **Scope boundary** — ARP→VRM transformation only. Scene, actor,
//!   character, and assembly remain caller concerns.

// Placeholder modules. Session 2+ will populate these with ported
// implementations. Keeping them declared here means the module tree
// is visible in the first commit, and later sessions are purely
// additive.

// (No modules declared yet — the scaffold is intentionally empty so
// that cargo check passes without warnings about dead placeholders.)

codex
타깃 쪽 사실은 확인됐습니다. 이제 소스 크레이트에서 실제 `mod`/`use crate::...` 관계를 grep해서 내부 모듈 의존성 그래프와 Session 2 이동 단위를 확정하겠습니다.
exec
/bin/zsh -lc 'find crates/humanoid_retarget/src -maxdepth 3 -type f | sort' in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "sed -n '1,220p' Cargo.toml" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
[package]
name = "bevy-vrm"
version = "0.1.0"
edition = "2024"

[[bin]]
name = "bevy-vrm"
path = "src/main.rs"

[[bin]]
name = "analyze-fbx"
path = "src/bin/analyze_fbx.rs"

[[bin]]
name = "dump-vrm-transforms"
path = "src/bin/dump_vrm_transforms.rs"

[dependencies]
bevy = { version = "0.18", features = ["wayland", "bevy_dev_tools"] }
bevy_vrm1 = { path = "crates/vrm2u_bevy", package = "bevy_vrm1" }
bevy_panorbit_camera = "0.34"
bevy_file_dialog = "0.9"
directories = "6.0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
humanoid_retarget = { path = "crates/humanoid_retarget" }

# Enable optimizations for all crates in dev builds
# (prevents stack overflow from debug-mode frame bloat in fbxcel/miniz_oxide)
[profile.dev]
opt-level = 2

[profile.dev.package."*"]
opt-level = 2

# fbxcel + zlib: opt-level 3 to prevent debug-mode stack frame bloat
# (miniz_oxide DecompressorOxide + fbxcel AttributeValue enums cause stack overflow in debug)
# Stack-heavy crates: opt-level 3 to prevent debug-mode stack frame bloat
# (miniz_oxide DecompressorOxide + fbxcel AttributeValue enums cause stack overflow in debug)
[profile.dev.package.fbxcel]
opt-level = 3
[profile.dev.package.miniz_oxide]
opt-level = 3
[profile.dev.package.flate2]
opt-level = 3
[profile.dev.package.humanoid_retarget]
opt-level = 3

 succeeded in 0ms:
crates/humanoid_retarget/src/adapters/arp_vrm.rs
crates/humanoid_retarget/src/adapters/arp_vrm_user_pose.rs
crates/humanoid_retarget/src/adapters/mod.rs
crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs
crates/humanoid_retarget/src/bin/pop_scan.rs
crates/humanoid_retarget/src/bin/retarget_test.rs
crates/humanoid_retarget/src/bin/validate_pipeline.rs
crates/humanoid_retarget/src/config.rs
crates/humanoid_retarget/src/finger_axis_map.rs
crates/humanoid_retarget/src/finger_rest_align.rs
crates/humanoid_retarget/src/lib.rs
crates/humanoid_retarget/src/mapping.rs
crates/humanoid_retarget/src/orchestrate.rs
crates/humanoid_retarget/src/postprocess/mod.rs
crates/humanoid_retarget/src/postprocess/wrist_twist.rs
crates/humanoid_retarget/src/quality/detector.rs
crates/humanoid_retarget/src/quality/diagnostic.rs
crates/humanoid_retarget/src/quality/fk_evaluate.rs
crates/humanoid_retarget/src/quality/mod.rs
crates/humanoid_retarget/src/quality/rubric_a.rs
crates/humanoid_retarget/src/quality/rubric_b.rs
crates/humanoid_retarget/src/quality/rubric_c.rs
crates/humanoid_retarget/src/quality/score.rs
crates/humanoid_retarget/src/quality/validate.rs
crates/humanoid_retarget/src/retargeter.rs
crates/humanoid_retarget/src/source_anim.rs
crates/humanoid_retarget/src/topo.rs
crates/humanoid_retarget/src/types.rs
crates/humanoid_retarget/src/vrm_compat.rs
crates/humanoid_retarget/src/vrm_rest.rs

exec
/bin/zsh -lc 'rg -n "''^(pub mod |mod )|use crate::|crate::[A-Za-z_][A-Za-z0-9_:]*" crates/humanoid_retarget/src --glob '"'"'!**/bin/**'"'" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
crates/humanoid_retarget/src/postprocess/mod.rs:1://! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
crates/humanoid_retarget/src/postprocess/mod.rs:36:pub mod wrist_twist;
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:60:use crate::fbx::FbxSkeletonFrames;
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:61:use crate::types::TargetAnimation;
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:95:            let (_swing, twist) = crate::types::swing_twist_decompose(fbx_wrist_delta, Vec3::Y);
crates/humanoid_retarget/src/mapping.rs:4:use crate::config::RetargetConfig;
crates/humanoid_retarget/src/mapping.rs:5:use crate::fbx::{FbxBone, SourceAsset};
crates/humanoid_retarget/src/mapping.rs:6:use crate::source_anim::{SourceAnimBody, SourceAnimFacial};
crates/humanoid_retarget/src/mapping.rs:7:use crate::vrm_compat::VrmVersion;
crates/humanoid_retarget/src/mapping.rs:8:use crate::{BoneTrack, ExpressionTrack, RetargetError, MappedAnimation};
crates/humanoid_retarget/src/mapping.rs:164:    let is_blender = if config.source_type != crate::config::FbxSourceType::Auto {
crates/humanoid_retarget/src/mapping.rs:165:        config.source_type == crate::config::FbxSourceType::Blender
crates/humanoid_retarget/src/mapping.rs:167:        body.detected_source_type == crate::config::FbxSourceType::Blender
crates/humanoid_retarget/src/mapping.rs:190:                    crate::fbx::euler_to_quat(bone.rest_rotation_euler, bone.rotation_order);
crates/humanoid_retarget/src/mapping.rs:215:            .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:275:                .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:344:                    .map(|b| crate::fbx::euler_to_quat(b.rest_rotation_euler, b.rotation_order))
crates/humanoid_retarget/src/mapping.rs:465:    let source_resolved = if config.source_type != crate::config::FbxSourceType::Auto {
crates/humanoid_retarget/src/retargeter.rs:4:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/retargeter.rs:5:use crate::quality::RetargetQuality;
crates/humanoid_retarget/src/retargeter.rs:6:use crate::types::{
crates/humanoid_retarget/src/retargeter.rs:10:use crate::RetargetError;
crates/humanoid_retarget/src/retargeter.rs:96:    foot_contact: Option<crate::types::FootContactData>,
crates/humanoid_retarget/src/retargeter.rs:142:            let (overrides, warnings) = crate::adapters::arp_vrm::align_full_body_rest(
crates/humanoid_retarget/src/retargeter.rs:208:        let is_blender = anim.source_resolved == crate::config::FbxSourceType::Blender;
crates/humanoid_retarget/src/retargeter.rs:219:        let topo = crate::topo::build_vrm_topo_order(&vrm_rest.parent_map);
crates/humanoid_retarget/src/retargeter.rs:221:        let track_by_name: HashMap<&str, &crate::types::BoneTrack> = anim.bone_tracks.iter()
crates/humanoid_retarget/src/retargeter.rs:331:        track_by_name: &HashMap<&str, &crate::types::BoneTrack>,
crates/humanoid_retarget/src/retargeter.rs:454:            let foot_sides: [(Option<usize>, &crate::types::FootSideContact); 2] = [
crates/humanoid_retarget/src/retargeter.rs:592:        let track_by_name: HashMap<&str, &crate::types::BoneTrack> = anim.bone_tracks.iter()
crates/humanoid_retarget/src/source_anim.rs:34:use crate::config::FbxSourceType;
crates/humanoid_retarget/src/source_anim.rs:35:use crate::fbx::{FbxBone, FbxBoneTrack, SourceAsset};
crates/humanoid_retarget/src/source_anim.rs:50:/// [`crate::types::BoneTrack`]s, and nothing else. In particular, no
crates/humanoid_retarget/src/source_anim.rs:91:/// [`crate::types::ExpressionTrack`]s.
crates/humanoid_retarget/src/finger_axis_map.rs:24:use crate::types::BoneTrack;
crates/humanoid_retarget/src/vrm_rest.rs:9:use crate::VrmRestPose;
crates/humanoid_retarget/src/vrm_rest.rs:530:) -> Option<crate::types::FootContactData> {
crates/humanoid_retarget/src/vrm_rest.rs:634:    let build_side = |foot: &str, toes: &str| -> crate::types::FootSideContact {
crates/humanoid_retarget/src/vrm_rest.rs:654:        crate::types::FootSideContact { heel_offset_y, toe_offset_y, heel_local_z, toe_local_z }
crates/humanoid_retarget/src/vrm_rest.rs:660:    Some(crate::types::FootContactData { left, right })
crates/humanoid_retarget/src/types.rs:69:    pub quality: crate::quality::RetargetQuality,
crates/humanoid_retarget/src/types.rs:70:    pub score: Option<crate::quality::RetargetScore>,
crates/humanoid_retarget/src/types.rs:80:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:82:    pub source_resolved: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:124:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/types.rs:125:    pub source_resolved: crate::config::FbxSourceType,
crates/humanoid_retarget/src/lib.rs:1:pub mod adapters;
crates/humanoid_retarget/src/lib.rs:2:pub mod config;
crates/humanoid_retarget/src/lib.rs:3:pub mod finger_axis_map;
crates/humanoid_retarget/src/lib.rs:4:pub mod finger_rest_align;
crates/humanoid_retarget/src/lib.rs:5:pub mod mapping;
crates/humanoid_retarget/src/lib.rs:6:pub mod orchestrate;
crates/humanoid_retarget/src/lib.rs:7:pub mod postprocess;
crates/humanoid_retarget/src/lib.rs:8:pub mod quality;
crates/humanoid_retarget/src/lib.rs:9:pub mod retargeter;
crates/humanoid_retarget/src/lib.rs:10:pub mod source_anim;
crates/humanoid_retarget/src/lib.rs:11:pub mod topo;
crates/humanoid_retarget/src/lib.rs:12:pub mod types;
crates/humanoid_retarget/src/lib.rs:14:pub mod vrm_compat;
crates/humanoid_retarget/src/lib.rs:15:pub mod vrm_rest;
crates/humanoid_retarget/src/quality/diagnostic.rs:156:mod tests {
crates/humanoid_retarget/src/quality/diagnostic.rs:158:    use crate::quality::{HardFailCheck, MetricResult};
crates/humanoid_retarget/src/adapters/mod.rs:13:pub mod arp_vrm;
crates/humanoid_retarget/src/adapters/mod.rs:14:pub mod arp_vrm_user_pose;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:47:use crate::config::RetargetConfig;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:48:use crate::types::BoneTrack;
crates/humanoid_retarget/src/adapters/arp_vrm.rs:141:                if crate::config::glob_match(pattern, vrm_bone_name) {
crates/humanoid_retarget/src/adapters/arp_vrm.rs:299:    HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:303:    let (axis_map, diag) = crate::finger_axis_map::compute_axis_map(
crates/humanoid_retarget/src/adapters/arp_vrm.rs:331:    axis_map: &HashMap<String, crate::finger_axis_map::FingerAxisEntry>,
crates/humanoid_retarget/src/adapters/arp_vrm.rs:409:    let curl_overrides = crate::finger_rest_align::apply_in_place(
crates/humanoid_retarget/src/quality/validate.rs:9:use crate::config::RetargetConfig;
crates/humanoid_retarget/src/quality/validate.rs:10:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/quality/validate.rs:11:use crate::types::VrmRestPose;
crates/humanoid_retarget/src/quality/validate.rs:12:use crate::vrm_compat::VrmVersion;
crates/humanoid_retarget/src/quality/validate.rs:115:    let fbx_skel = crate::compute_fbx_skeleton_from_parsed(&fbx).ok();
crates/humanoid_retarget/src/quality/validate.rs:157:        crate::fbx::parse(bytes).map_err(|e| vec![format!("FBX parse failed: {}", e)])?;
crates/humanoid_retarget/src/quality/validate.rs:200:    let rest = crate::vrm_rest::extract_vrm_rest_pose(bytes).map_err(|e| {
crates/humanoid_retarget/src/quality/validate.rs:253:) -> Result<(crate::types::MappedAnimation, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:254:    let anim = crate::mapping::retarget(fbx, config, version)
crates/humanoid_retarget/src/quality/validate.rs:285:    anim: &crate::types::MappedAnimation,
crates/humanoid_retarget/src/quality/validate.rs:291:    let (axis_map, stage3_log) = crate::adapters::arp_vrm::stage3_build_adapter_config(
crates/humanoid_retarget/src/quality/validate.rs:297:    let (overrides, stage4_log) = crate::adapters::arp_vrm::stage4_sync_rest_to_fbx(
crates/humanoid_retarget/src/quality/validate.rs:322:    anim: &crate::types::MappedAnimation,
crates/humanoid_retarget/src/quality/validate.rs:324:    fbx_skel: Option<crate::types::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/validate.rs:351:        crate::ArpRetargeterInner::new(vrm_rest, fbx_skel, anim, &fbx_root, &fbx_hips);
crates/humanoid_retarget/src/quality/fk_evaluate.rs:19:    result: &crate::TargetAnimation,
crates/humanoid_retarget/src/quality/fk_evaluate.rs:20:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/orchestrate.rs:35:use crate::config::RetargetConfig;
crates/humanoid_retarget/src/orchestrate.rs:36:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/orchestrate.rs:37:use crate::quality::{
crates/humanoid_retarget/src/orchestrate.rs:41:use crate::types::{TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/orchestrate.rs:42:use crate::vrm_compat::VrmVersion;
crates/humanoid_retarget/src/orchestrate.rs:134:    let mapped = match crate::mapping::retarget(source_asset, config, vrm_version) {
crates/humanoid_retarget/src/orchestrate.rs:143:    let fbx_skeleton = match crate::compute_fbx_skeleton_from_parsed(source_asset) {
crates/humanoid_retarget/src/orchestrate.rs:161:    let retargeter = crate::ArpRetargeterInner::new(
crates/humanoid_retarget/src/orchestrate.rs:206:mod tests {
crates/humanoid_retarget/src/orchestrate.rs:208:    use crate::quality::Severity;
crates/humanoid_retarget/src/orchestrate.rs:221:                overall: crate::quality::Grade::A,
crates/humanoid_retarget/src/orchestrate.rs:299:        assert_eq!(crate::quality::aggregate_severity(&r.diagnostics), Some(Severity::Error));
crates/humanoid_retarget/src/quality/mod.rs:131:pub mod detector;
crates/humanoid_retarget/src/quality/mod.rs:132:pub mod diagnostic;
crates/humanoid_retarget/src/quality/mod.rs:133:pub mod rubric_a;
crates/humanoid_retarget/src/quality/mod.rs:134:pub mod rubric_b;
crates/humanoid_retarget/src/quality/mod.rs:135:pub mod rubric_c;
crates/humanoid_retarget/src/quality/mod.rs:136:pub mod fk_evaluate;
crates/humanoid_retarget/src/quality/mod.rs:137:pub mod validate;
crates/humanoid_retarget/src/quality/mod.rs:138:pub mod score;
crates/humanoid_retarget/src/quality/mod.rs:186:    pub source_detected: crate::config::FbxSourceType,
crates/humanoid_retarget/src/quality/mod.rs:187:    pub source_config: crate::config::FbxSourceType,
crates/humanoid_retarget/src/finger_rest_align.rs:3://! Consumes Stage 1 ([`crate::finger_axis_map`]) output and modifies the
crates/humanoid_retarget/src/finger_rest_align.rs:45:use crate::adapters::arp_vrm::RestAlignOverride;
crates/humanoid_retarget/src/finger_rest_align.rs:46:use crate::finger_axis_map::FingerAxisEntry;
crates/humanoid_retarget/src/quality/score.rs:6:use crate::types::{FbxSkeletonFrames, TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/quality/score.rs:66:    let bone_lookup: HashMap<&str, &crate::types::RetargetedBone> = result.bones.iter()
crates/humanoid_retarget/src/quality/rubric_c.rs:246:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:369:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_c.rs:661:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:752:    src_fk: Option<&crate::FbxSkeletonFrames>,
crates/humanoid_retarget/src/quality/rubric_c.rs:753:    result: &crate::TargetAnimation,
crates/humanoid_retarget/src/quality/rubric_c.rs:754:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_b.rs:55:fn check_hard_fails(vrm_rest: &crate::types::VrmRestPose) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_b.rs:107:fn metric_completeness(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:143:fn metric_proportion(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:241:fn metric_tpose(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:314:fn metric_sole_offset(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:349:pub fn evaluate(vrm_rest: &crate::types::VrmRestPose) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:21:fn check_hard_fails(body: &crate::source_anim::SourceAnimBody<'_>) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_a.rs:121:fn metric_angular_velocity_outliers(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:190:fn metric_bone_symmetry(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:273:    fbx: &crate::fbx::SourceAsset,
crates/humanoid_retarget/src/quality/rubric_a.rs:274:    skeleton: &crate::types::FbxSkeletonFrames,
crates/humanoid_retarget/src/quality/rubric_a.rs:414:fn metric_smoothness(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:510:pub fn evaluate(fbx: &crate::fbx::SourceAsset) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:511:    let body = crate::source_anim::SourceAnimBody::from_source_asset(fbx);
crates/humanoid_retarget/src/quality/rubric_a.rs:523:        match crate::compute_fbx_skeleton_from_parsed(fbx) {

exec
/bin/zsh -lc "sed -n '1,220p' crates/humanoid_retarget/Cargo.toml" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
[package]
name = "humanoid_retarget"
version = "0.1.0"
edition = "2024"

[dependencies]
fbx_rig = { path = "../fbx_rig" }
vrm0_compat = { path = "../vrm0_compat" }
glam = "0.30"
gltf = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
thiserror = "2"

[[bin]]
name = "retarget-test"
path = "src/bin/retarget_test.rs"

[[bin]]
name = "pop-scan"
path = "src/bin/pop_scan.rs"

[[bin]]
name = "validate-pipeline"
path = "src/bin/validate_pipeline.rs"

[[bin]]
name = "fbx-summary-scratch"
path = "src/bin/fbx_summary_scratch.rs"

exec
/bin/zsh -lc "sed -n '1,260p' Cargo.toml" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
[workspace]
members = [
    "crates/shotloom-common",
    "crates/shotloom-core",
    "crates/shotloom-engine",
    "crates/shotloom-web",
    "crates/shotloom-render-cli",
    "crates/shotloom-gltf",
    "crates/shotloom-s2m",
    "crates/shotloom-stage",
    "crates/shotloom-import",
    "crates/shotloom-retarget",
    "crates/shotloom-t2m",
    "crates/shotloom-tts",
    "crates/shotloom-native",
    "crates/shotloom-tauri",
    "apps/desktop/src-tauri",
]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
license = "MIT"
repository = "https://github.com/placeholder/shotloom"

[workspace.dependencies]
bevy = { version = "0.18", default-features = false }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
wgpu = "27"
wasm-bindgen = "0.2"
getrandom = "0.2"
crossbeam-channel = "0.5"
winit = "0.30"
pollster = "0.4"
log = "0.4"
tracing = { version = "0.1", features = ["log"] }
tracing-log = "0.2"
tracing-subscriber = { version = "0.3", features = ["env-filter", "fmt", "std"] }
tauri = { version = "2" }
tauri-build = { version = "2" }
tauri-plugin-screenshots = "2.2"
raw-window-handle = "0.6"
bevy_vrm1 = "0.6.3"

exec
/bin/zsh -lc "find crates -maxdepth 2 -name Cargo.toml | sort | sed -n '1,220p'" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-common/Cargo.toml
crates/shotloom-core/Cargo.toml
crates/shotloom-engine/Cargo.toml
crates/shotloom-gltf/Cargo.toml
crates/shotloom-import/Cargo.toml
crates/shotloom-native/Cargo.toml
crates/shotloom-render-cli/Cargo.toml
crates/shotloom-retarget/Cargo.toml
crates/shotloom-s2m/Cargo.toml
crates/shotloom-stage/Cargo.toml
crates/shotloom-t2m/Cargo.toml
crates/shotloom-tauri/Cargo.toml
crates/shotloom-tts/Cargo.toml
crates/shotloom-web/Cargo.toml

exec
/bin/zsh -lc 'rg -n "fbx_rig|vrm0_compat|gltf =|thiserror|glam =|serde_json" Cargo.toml crates/*/Cargo.toml' in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-core/Cargo.toml:11:serde_json = { workspace = true }
crates/shotloom-common/Cargo.toml:16:serde_json = { workspace = true }
Cargo.toml:30:serde_json = "1"
crates/shotloom-s2m/Cargo.toml:11:serde_json = { workspace = true }
crates/shotloom-web/Cargo.toml:16:serde_json = { workspace = true }
crates/shotloom-tauri/Cargo.toml:15:serde_json = { workspace = true }
crates/shotloom-gltf/Cargo.toml:10:serde_json = { workspace = true }
crates/shotloom-gltf/Cargo.toml:11:thiserror = "2"
crates/shotloom-import/Cargo.toml:12:shotloom-gltf = { path = "../shotloom-gltf" }
crates/shotloom-import/Cargo.toml:18:thiserror = "2"
crates/shotloom-import/Cargo.toml:21:serde_json = { workspace = true }

exec
/bin/zsh -lc "sed -n '1,260p' crates/humanoid_retarget/tests/integration.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
use humanoid_retarget::{config::RetargetConfig, vrm_compat::VrmVersion};
use std::fs;

/// Only config available in repo: arp_body.json
fn arp_config_json() -> String {
    fs::read_to_string("../../assets/retarget/arp_body.json")
        .expect("arp_body.json should exist")
}

/// Body animation FBX available in repo
fn fbx_body() -> Vec<u8> {
    fs::read("../../assets/fbx/17857_M_AIStndWide_241204.fbx")
        .expect("body FBX should exist")
}

/// Facial-only FBX available in repo
fn fbx_flutter() -> Vec<u8> {
    fs::read("../../assets/fbx/FC_00078_F_SuddenFlutter_Anime.fbx")
        .expect("flutter FBX should exist")
}

// =============================================================================
// 1. Config parsing
// =============================================================================

#[test]
fn config_parse_arp() {
    let json = arp_config_json();
    let config = RetargetConfig::from_json(&json).expect("arp config should parse");
    assert_eq!(config.name, "arp_body");
    assert!(!config.direct_map.is_empty(), "direct_map should have entries");
}

#[test]
fn config_resolve_vrm_bone() {
    let json = arp_config_json();
    let config = RetargetConfig::from_json(&json).unwrap();
    // root.x → hips is the standard ARP pelvis mapping
    assert_eq!(
        config.resolve_vrm_bone("root.x", "1.0"),
        Some("hips".to_string())
    );
}

// =============================================================================
// 2. FBX parsing
// =============================================================================

#[test]
fn fbx_parse_body() {
    let data = fbx_body();
    let fbx = humanoid_retarget::fbx::parse(&data).expect("body FBX should parse");
    assert!(fbx.bones.len() > 20, "should have >20 bones, got {}", fbx.bones.len());
    assert!(fbx.frame_count > 0, "should have frames");
    assert!(fbx.duration > 0.0, "duration should be positive");
}

#[test]
fn fbx_parse_flutter() {
    let data = fbx_flutter();
    let fbx = humanoid_retarget::fbx::parse(&data).expect("flutter FBX should parse");
    assert!(fbx.bones.len() > 0, "should have bones");
    assert!(fbx.frame_count > 0, "should have frames");
}

// =============================================================================
// 3. Retarget execution
// =============================================================================

#[test]
fn retarget_body_v1() {
    let (anim, diag) =
        humanoid_retarget::retarget(&fbx_body(), &arp_config_json(), VrmVersion::V1_0)
            .expect("retarget should succeed");
    assert!(!anim.bone_tracks.is_empty(), "should produce bone tracks");
    assert!(anim.duration_secs > 0.0, "duration should be positive");
    assert!(!diag.matched_direct.is_empty(), "should have matched bones");
}

#[test]
fn retarget_body_v0() {
    let (anim, _) =
        humanoid_retarget::retarget(&fbx_body(), &arp_config_json(), VrmVersion::V0x)
            .expect("retarget v0 should succeed");
    assert!(!anim.bone_tracks.is_empty());
}

// =============================================================================
// 4. Bone count
// =============================================================================

#[test]
fn retarget_bone_count() {
    let config_json = arp_config_json();
    let (anim, diag) =
        humanoid_retarget::retarget(&fbx_body(), &config_json, VrmVersion::V1_0).unwrap();
    assert!(
        anim.bone_tracks.len() >= 10,
        "expected >=10 bone tracks, got {}",
        anim.bone_tracks.len()
    );
    let config = RetargetConfig::from_json(&config_json).unwrap();
    assert!(
        diag.matched_direct.len() <= config.direct_map.len(),
        "matched should not exceed config entries"
    );
}

// =============================================================================
// 5. Skeleton computation
// =============================================================================

#[test]
fn compute_fbx_skeleton_works() {
    let skeleton = humanoid_retarget::compute_fbx_skeleton(&fbx_body())
        .expect("skeleton computation should succeed");
    assert!(skeleton.frame_count > 0);
    assert!(skeleton.duration > 0.0);
    assert!(!skeleton.bone_positions.is_empty());
    assert!(!skeleton.hierarchy.is_empty());
}

#[test]
fn compute_fbx_skeleton_invalid() {
    assert!(humanoid_retarget::compute_fbx_skeleton(&[]).is_err());
}

// =============================================================================
// 6. retarget_with_skeleton
// =============================================================================

#[test]
fn retarget_with_skeleton_works() {
    let (anim, _diag, skeleton) =
        humanoid_retarget::retarget_with_skeleton(&fbx_body(), &arp_config_json(), VrmVersion::V1_0)
            .expect("retarget_with_skeleton should succeed");
    assert!(!anim.bone_tracks.is_empty());
    assert!(skeleton.frame_count > 0);
}

// =============================================================================
// 7. Facial-only FBX retarget
// =============================================================================

#[test]
fn retarget_facial_fbx_ok() {
    let result = humanoid_retarget::retarget(&fbx_flutter(), &arp_config_json(), VrmVersion::V1_0);
    assert!(result.is_ok(), "facial-only FBX retarget should not error");
}

// =============================================================================
// 8. Invalid FBX → error, not panic
// =============================================================================

#[test]
fn invalid_fbx_returns_error() {
    let config_json = arp_config_json();
    assert!(
        humanoid_retarget::retarget(&[], &config_json, VrmVersion::V1_0).is_err(),
        "empty FBX should return error"
    );
    assert!(
        humanoid_retarget::retarget(b"not a valid fbx", &config_json, VrmVersion::V1_0).is_err(),
        "garbage FBX should return error"
    );
}

// =============================================================================
// 9. Invalid config → error, not panic
// =============================================================================

#[test]
fn invalid_config_returns_error() {
    let fbx_data = fbx_body();
    assert!(
        humanoid_retarget::retarget(&fbx_data, "", VrmVersion::V1_0).is_err(),
        "empty config should return error"
    );
    assert!(
        humanoid_retarget::retarget(&fbx_data, "{}", VrmVersion::V1_0).is_err(),
        "empty JSON object should return error"
    );
}

exec
/bin/zsh -lc "sed -n '1,260p' crates/humanoid_retarget/tests/finger_rest_align.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
//! Integration tests for `finger_rest_align` (Stage 2 of v5 finger pipeline).
//!
//! These tests use synthetic axis maps + rest data — no FBX dependency.
//! End-to-end tests with real FBX live in `integration.rs` (when wired).

use std::collections::HashMap;

use humanoid_retarget::finger_axis_map::FingerAxisEntry;
use humanoid_retarget::finger_rest_align::{apply_in_place, compute_overrides};
use humanoid_retarget::glam::{Quat, Vec3};

fn synth_entry(name: &str, baseline_deg: f32) -> FingerAxisEntry {
    // Curl-toward-palm: -Z for left, +Z for right (sign flipped after
    // first viewer test where fingers curled toward back of hand)
    let vrm_axis = if name.starts_with("right") {
        Vec3::new(0.0, 0.0, 1.0)
    } else {
        Vec3::new(0.0, 0.0, -1.0)
    };
    FingerAxisEntry {
        vrm_bone_name: name.to_string(),
        arp_axis_local: Vec3::new(-1.0, 0.0, 0.0),
        vrm_axis_local: vrm_axis,
        arp_baseline_curl_rad: baseline_deg.to_radians(),
    }
}

fn build_left_index_chain() -> (
    HashMap<String, FingerAxisEntry>,
    HashMap<String, Quat>,
    HashMap<String, Quat>,
    HashMap<String, String>,
) {
    let mut axis_map = HashMap::new();
    axis_map.insert(
        "leftIndexProximal".to_string(),
        synth_entry("leftIndexProximal", 50.0),
    );
    axis_map.insert(
        "leftIndexIntermediate".to_string(),
        synth_entry("leftIndexIntermediate", 50.0),
    );
    axis_map.insert(
        "leftIndexDistal".to_string(),
        synth_entry("leftIndexDistal", 40.0),
    );

    let mut rest_local = HashMap::new();
    rest_local.insert("leftHand".to_string(), Quat::IDENTITY);
    rest_local.insert("leftIndexProximal".to_string(), Quat::IDENTITY);
    rest_local.insert("leftIndexIntermediate".to_string(), Quat::IDENTITY);
    rest_local.insert("leftIndexDistal".to_string(), Quat::IDENTITY);

    let mut rest_global = rest_local.clone();
    // hand rest_global stays IDENTITY
    rest_global.insert("leftHand".to_string(), Quat::IDENTITY);
    rest_global.insert("leftIndexProximal".to_string(), Quat::IDENTITY);
    rest_global.insert("leftIndexIntermediate".to_string(), Quat::IDENTITY);
    rest_global.insert("leftIndexDistal".to_string(), Quat::IDENTITY);

    let mut parent_map = HashMap::new();
    parent_map.insert("leftIndexProximal".to_string(), "leftHand".to_string());
    parent_map.insert(
        "leftIndexIntermediate".to_string(),
        "leftIndexProximal".to_string(),
    );
    parent_map.insert(
        "leftIndexDistal".to_string(),
        "leftIndexIntermediate".to_string(),
    );

    (axis_map, rest_local, rest_global, parent_map)
}

#[test]
fn baseline_curl_injected_into_local() {
    let (axis_map, rest_local, rest_global, parent_map) = build_left_index_chain();

    let overrides = compute_overrides(&axis_map, &rest_local, &rest_global, &parent_map);
    assert_eq!(overrides.len(), 3, "should produce 3 finger overrides");

    // Each new_local should be approximately the curl quat (since old was identity)
    let proximal = overrides
        .iter()
        .find(|o| o.vrm_bone_name == "leftIndexProximal")
        .unwrap();

    let expected = Quat::from_axis_angle(Vec3::new(0.0, 0.0, -1.0), 50.0_f32.to_radians());
    assert!(
        proximal.new_local.abs_diff_eq(expected, 1e-5),
        "new_local should equal Quat::from_axis_angle(VRM_axis, baseline)"
    );
    assert!((proximal.baseline_deg - 50.0).abs() < 0.01);
}

#[test]
fn parent_global_propagates_to_child() {
    let (axis_map, rest_local, rest_global, parent_map) = build_left_index_chain();

    let overrides = compute_overrides(&axis_map, &rest_local, &rest_global, &parent_map);

    // Build name → override lookup
    let by_name: HashMap<&str, &_> = overrides
        .iter()
        .map(|o| (o.vrm_bone_name.as_str(), o))
        .collect();

    let proximal = by_name["leftIndexProximal"];
    let intermediate = by_name["leftIndexIntermediate"];

    // Intermediate's new_global should equal proximal's new_global × intermediate's new_local
    let expected = (proximal.new_global * intermediate.new_local).normalize();
    assert!(
        intermediate.new_global.abs_diff_eq(expected, 1e-5),
        "child global should be parent_new_global × child_new_local"
    );
}

#[test]
fn topo_order_proximal_before_intermediate_before_distal() {
    let (axis_map, rest_local, rest_global, parent_map) = build_left_index_chain();

    let overrides = compute_overrides(&axis_map, &rest_local, &rest_global, &parent_map);

    let positions: HashMap<&str, usize> = overrides
        .iter()
        .enumerate()
        .map(|(i, o)| (o.vrm_bone_name.as_str(), i))
        .collect();

    assert!(positions["leftIndexProximal"] < positions["leftIndexIntermediate"]);
    assert!(positions["leftIndexIntermediate"] < positions["leftIndexDistal"]);
}

#[test]
fn apply_in_place_mutates_rest_maps() {
    let (axis_map, mut rest_local, mut rest_global, parent_map) = build_left_index_chain();

    let log = apply_in_place(&axis_map, &mut rest_local, &mut rest_global, &parent_map);
    assert_eq!(log.len(), 3);

    // After apply_in_place, the maps should contain the new values
    let new_proximal = rest_local["leftIndexProximal"];
    let expected = Quat::from_axis_angle(Vec3::new(0.0, 0.0, -1.0), 50.0_f32.to_radians());
    assert!(new_proximal.abs_diff_eq(expected, 1e-5));

    // Hand should be unchanged
    assert_eq!(rest_local["leftHand"], Quat::IDENTITY);
}

#[test]
fn right_side_uses_negative_z_axis() {
    let mut axis_map = HashMap::new();
    axis_map.insert(
        "rightIndexProximal".to_string(),
        synth_entry("rightIndexProximal", 50.0),
    );

    let mut rest_local = HashMap::new();
    rest_local.insert("rightIndexProximal".to_string(), Quat::IDENTITY);
    rest_local.insert("rightHand".to_string(), Quat::IDENTITY);

    let rest_global = rest_local.clone();

    let mut parent_map = HashMap::new();
    parent_map.insert("rightIndexProximal".to_string(), "rightHand".to_string());

    let overrides = compute_overrides(&axis_map, &rest_local, &rest_global, &parent_map);
    let proximal = &overrides[0];

    let expected_positive_z =
        Quat::from_axis_angle(Vec3::new(0.0, 0.0, 1.0), 50.0_f32.to_radians());
    assert!(
        proximal.new_local.abs_diff_eq(expected_positive_z, 1e-5),
        "right finger should curl around +Z (mirror of left -Z)"
    );

    let _ = (rest_global, &rest_local);
}

exec
/bin/zsh -lc "sed -n '1,220p' crates/humanoid_retarget/tests/finger_axis_map.rs" in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
//! Integration tests for `finger_axis_map` (Stage 1 of v5 finger pipeline).

use humanoid_retarget::finger_axis_map::{is_any_finger, is_handled_finger, vrm_curl_axis_for};
use humanoid_retarget::glam::Vec3;

#[test]
fn handled_finger_excludes_thumb() {
    assert!(is_handled_finger("leftIndexProximal"));
    assert!(is_handled_finger("rightMiddleDistal"));
    assert!(!is_handled_finger("leftThumbProximal"));
    assert!(!is_handled_finger("leftHand"));
}

#[test]
fn any_finger_includes_thumb() {
    assert!(is_any_finger("leftThumbProximal"));
    assert!(is_any_finger("rightLittleIntermediate"));
    assert!(!is_any_finger("leftHand"));
}

#[test]
fn vrm_curl_axis_mirrored() {
    // Sign flipped after first viewer test — fingers were curling toward
    // the back of the hand. Correct curl-toward-palm uses -Z left / +Z right.
    let left = vrm_curl_axis_for("leftIndexProximal");
    let right = vrm_curl_axis_for("rightIndexProximal");
    assert_eq!(left, Vec3::new(0.0, 0.0, -1.0));
    assert_eq!(right, Vec3::new(0.0, 0.0, 1.0));
}

codex
소스 쪽 테스트와 실제 모듈 결합도까지 확인했습니다. 추가로 Session 2에서 막히는 외부 의존성(`fbx_rig`, `vrm0_compat`, `glam`, `gltf`, `thiserror`)이 shotloom 워크스페이스에 이미 있는지 확인하고, 없으면 계획서에 명시적으로 반영하겠습니다.
exec
/bin/zsh -lc "find crates -maxdepth 2 -type d | sort | rg 'fbx|vrm0|retarget|t2m|gltf'" in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-gltf
crates/shotloom-gltf/src
crates/shotloom-retarget
crates/shotloom-retarget/src
crates/shotloom-t2m
crates/shotloom-t2m/src

exec
/bin/zsh -lc 'rg -n "SourceAsset|MappedAnimation|TargetAnimation|VrmRestPose|evaluate_pipeline|rubric_to_diagnostics|ArpRetargeterInner|RetargeterOptions|IdentityRetargeter|RubricResult|Grade|HardFailCheck|MetricResult" crates/humanoid_retarget/src crates/humanoid_retarget/tests' in /Users/deemooooooooo/Desktop/www/bevy-vrm
 succeeded in 0ms:
crates/humanoid_retarget/src/postprocess/mod.rs:1://! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
crates/humanoid_retarget/tests/fixtures/mod.rs:3://! Every builder below constructs an `SourceAsset` by hand from
crates/humanoid_retarget/tests/fixtures/mod.rs:28:use humanoid_retarget::fbx::{FbxBone, FbxBoneTrack, SourceAsset, FbxSourceType};
crates/humanoid_retarget/tests/fixtures/mod.rs:71:/// Build a base SourceAsset where every bone has an identity rotation track
crates/humanoid_retarget/tests/fixtures/mod.rs:73:fn base_fbx() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:99:    SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:111:fn override_track(fbx: &mut SourceAsset, bone: &str, rotations: Vec<Quat>) {
crates/humanoid_retarget/tests/fixtures/mod.rs:124://   hand_avg = 0, other_avg = 0 → both Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:126://   Every bind matrix is identity. L/R pairs all delta = 0° → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:129://   are all frames; consecutive slide = 0 mm → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:131://   angular velocity = 0 → jerk = 0 → p99 = 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:133:pub fn identity_30_frames() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:146://   non-hand avg = 0; hand avg (hand.l/r, finger1.l) = 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:147:// Expected A1.2: bind symmetric → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:150://   jerk = |90-90| × 30 = 0. Others: 0. p99 = 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:152:pub fn arm_linear_sweep() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:171://   Worst bone grade → at least Grade B or worse (depending on scoring).
crates/humanoid_retarget/tests/fixtures/mod.rs:176://   arm.l spike_rate = 0 → Grade A. The metric MISSES the discontinuity.
crates/humanoid_retarget/tests/fixtures/mod.rs:181:pub fn single_discontinuity() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:203://   spike_rate = 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:204:// A1.2: bind symmetric → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:207://   p99 ≤ ~8246 → Grade B (between 5000 and 10000).
crates/humanoid_retarget/tests/fixtures/mod.rs:210:pub fn periodic_arm_swing() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:230://   All bind matrices are identity → all pair deltas = 0° → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:232://   fixture 2 → all rates 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:233:// A1.4: velocity constant per bone → jerk 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:235:pub fn mirrored_jumping_jack() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:270://   `other_grade(4.93)`: not <1, not <3, 4.93 < 8 → Grade C.
crates/humanoid_retarget/tests/fixtures/mod.rs:271:// Hand bones (hand.l, hand.r, finger1.l): static → rate 0 → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:272:// Worst of {A, C} = C → A1.1 = Grade C.
crates/humanoid_retarget/tests/fixtures/mod.rs:279:// RED: asserting Grade::A will fail because current A1.1 returns C.
crates/humanoid_retarget/tests/fixtures/mod.rs:299:// HAND-EXPECTED: Grade A. The retargeter does not consume stretch
crates/humanoid_retarget/tests/fixtures/mod.rs:303:// entirely, leaving only 22 static real bones → 0 rate → Grade A.
crates/humanoid_retarget/tests/fixtures/mod.rs:307:pub fn stretch_bones_only() -> SourceAsset {
crates/humanoid_retarget/tests/fixtures/mod.rs:319:pub fn fast_heel_strike() -> SourceAsset {
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:61:use crate::types::TargetAnimation;
crates/humanoid_retarget/src/postprocess/wrist_twist.rs:69:    anim: &mut TargetAnimation,
crates/humanoid_retarget/src/mapping.rs:5:use crate::fbx::{FbxBone, SourceAsset};
crates/humanoid_retarget/src/mapping.rs:8:use crate::{BoneTrack, ExpressionTrack, RetargetError, MappedAnimation};
crates/humanoid_retarget/src/mapping.rs:448:/// New callers that own a `SourceAsset` and want both body and facial
crates/humanoid_retarget/src/mapping.rs:449:/// tracks in one [`MappedAnimation`] use this. Callers that need only
crates/humanoid_retarget/src/mapping.rs:455:    fbx: &SourceAsset,
crates/humanoid_retarget/src/mapping.rs:458:) -> Result<MappedAnimation, RetargetError> {
crates/humanoid_retarget/src/mapping.rs:471:    Ok(MappedAnimation {
crates/humanoid_retarget/tests/metric_fixtures.rs:17:use humanoid_retarget::fbx::SourceAsset;
crates/humanoid_retarget/tests/metric_fixtures.rs:19:use humanoid_retarget::quality::{Grade, RubricResult, rubric_a, rubric_c};
crates/humanoid_retarget/tests/metric_fixtures.rs:21:    FbxSkeletonFrames, TargetAnimation, VrmRestPose,
crates/humanoid_retarget/tests/metric_fixtures.rs:27:fn run_a(fbx: &SourceAsset) -> RubricResult {
crates/humanoid_retarget/tests/metric_fixtures.rs:31:fn metric(r: &RubricResult, name_prefix: &str) -> Grade {
crates/humanoid_retarget/tests/metric_fixtures.rs:36:        .unwrap_or(Grade::A)
crates/humanoid_retarget/tests/metric_fixtures.rs:39:fn print_rubric(tag: &str, r: &RubricResult) {
crates/humanoid_retarget/tests/metric_fixtures.rs:55:// Expected: every metric Grade::A, overall A.
crates/humanoid_retarget/tests/metric_fixtures.rs:63:    assert_eq!(metric(&r, "A1.1"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:64:    assert_eq!(metric(&r, "A1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:65:    assert_eq!(metric(&r, "A1.4"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:66:    assert_eq!(r.overall, Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:70:// Expected: Grade::A everywhere (constant-rate rotation, 3°/frame).
crates/humanoid_retarget/tests/metric_fixtures.rs:78:    assert_eq!(metric(&r, "A1.1"), Grade::A, "linear sweep is not a spike");
crates/humanoid_retarget/tests/metric_fixtures.rs:79:    assert_eq!(metric(&r, "A1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:80:    assert_eq!(metric(&r, "A1.4"), Grade::A, "constant velocity → zero jerk");
crates/humanoid_retarget/tests/metric_fixtures.rs:81:    assert_eq!(r.overall, Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:97:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:104:// Expected: Grade::A for A1.1 / A1.2. A1.4 expected B (smooth sinusoid
crates/humanoid_retarget/tests/metric_fixtures.rs:115:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:118:    assert_eq!(metric(&r, "A1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:121:        matches!(a14, Grade::A | Grade::B),
crates/humanoid_retarget/tests/metric_fixtures.rs:128:// Expected: Grade::A everywhere. Bind is symmetric so A1.2 is A regardless
crates/humanoid_retarget/tests/metric_fixtures.rs:137:    assert_eq!(metric(&r, "A1.1"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:138:    assert_eq!(metric(&r, "A1.2"), Grade::A, "bind pose is perfectly symmetric");
crates/humanoid_retarget/tests/metric_fixtures.rs:139:    assert_eq!(metric(&r, "A1.4"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:140:    assert_eq!(r.overall, Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:146:// entirely → Grade A. Current: not filtered → RED.
crates/humanoid_retarget/tests/metric_fixtures.rs:156:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:163:// HAND-EXPECTED: Grade::A — periodic sawtooth is legitimate motion.
crates/humanoid_retarget/tests/metric_fixtures.rs:176:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:245:    result: TargetAnimation,
crates/humanoid_retarget/tests/metric_fixtures.rs:246:    vrm_rest: VrmRestPose,
crates/humanoid_retarget/tests/metric_fixtures.rs:249:/// Build the VRM-side `VrmRestPose` used by rubric C. This is test
crates/humanoid_retarget/tests/metric_fixtures.rs:253:fn build_vrm_rest_for_fixtures() -> VrmRestPose {
crates/humanoid_retarget/tests/metric_fixtures.rs:294:    VrmRestPose {
crates/humanoid_retarget/tests/metric_fixtures.rs:312:/// position. Also reads rotations back out of the `TargetAnimation` so
crates/humanoid_retarget/tests/metric_fixtures.rs:315:    result: &TargetAnimation,
crates/humanoid_retarget/tests/metric_fixtures.rs:340:fn build_c_inputs(fbx: &SourceAsset) -> CInputs {
crates/humanoid_retarget/tests/metric_fixtures.rs:341:    use humanoid_retarget::IdentityRetargeter;
crates/humanoid_retarget/tests/metric_fixtures.rs:349:    let identity = IdentityRetargeter::new(bone_map);
crates/humanoid_retarget/tests/metric_fixtures.rs:352:        .expect("IdentityRetargeter is infallible on synthetic fixtures");
crates/humanoid_retarget/tests/metric_fixtures.rs:363:fn run_c(fbx: &SourceAsset) -> RubricResult {
crates/humanoid_retarget/tests/metric_fixtures.rs:405:// All static bone positions → ground_contact should be Grade::A across
crates/humanoid_retarget/tests/metric_fixtures.rs:414:    assert_eq!(metric(&r, "C1.1"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:415:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:416:    assert_eq!(metric(&r, "C1.3"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:417:    assert_eq!(r.overall, Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:426:    assert_eq!(metric(&r, "C1.1"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:427:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:429:    assert_eq!(metric(&r, "C1.3"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:437:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:447:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:453:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:464:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:468:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:479:    assert_eq!(metric(&r, "C1.1"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:480:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:481:    assert_eq!(metric(&r, "C1.3"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:482:    assert_eq!(r.overall, Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:490:    assert_eq!(metric(&r, "C1.2"), Grade::A);
crates/humanoid_retarget/tests/metric_fixtures.rs:496:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:548:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:575:        Grade::A,
crates/humanoid_retarget/tests/metric_fixtures.rs:608:            Grade::A,
crates/humanoid_retarget/src/retargeter.rs:4:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/retargeter.rs:7:    ExpressionTrack, FbxSkeletonFrames, TargetAnimation, MappedAnimation,
crates/humanoid_retarget/src/retargeter.rs:8:    RetargetedBone, VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:67:/// `MappedAnimation` via [`ArpRetargeterInner::apply`].
crates/humanoid_retarget/src/retargeter.rs:73:/// sites (`orchestrate::evaluate_pipeline`, `bin/retarget_test.rs`,
crates/humanoid_retarget/src/retargeter.rs:82:pub struct ArpRetargeterInner {
crates/humanoid_retarget/src/retargeter.rs:102:/// Default: all features off — ArpRetargeterInner behaves as before.
crates/humanoid_retarget/src/retargeter.rs:104:pub struct RetargeterOptions {
crates/humanoid_retarget/src/retargeter.rs:112:impl ArpRetargeterInner {
crates/humanoid_retarget/src/retargeter.rs:114:        vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:116:        anim: &MappedAnimation,
crates/humanoid_retarget/src/retargeter.rs:126:            RetargeterOptions::default(),
crates/humanoid_retarget/src/retargeter.rs:131:        mut vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:133:        anim: &MappedAnimation,
crates/humanoid_retarget/src/retargeter.rs:136:        options: RetargeterOptions,
crates/humanoid_retarget/src/retargeter.rs:314:        ArpRetargeterInner {
crates/humanoid_retarget/src/retargeter.rs:445:        anim: &MappedAnimation,
crates/humanoid_retarget/src/retargeter.rs:585:    pub fn apply(&self, anim: &MappedAnimation) -> TargetAnimation {
crates/humanoid_retarget/src/retargeter.rs:673:        TargetAnimation {
crates/humanoid_retarget/src/retargeter.rs:695:pub struct IdentityRetargeter {
crates/humanoid_retarget/src/retargeter.rs:699:impl IdentityRetargeter {
crates/humanoid_retarget/src/retargeter.rs:701:        IdentityRetargeter { bone_map }
crates/humanoid_retarget/src/retargeter.rs:709:        src: &SourceAsset,
crates/humanoid_retarget/src/retargeter.rs:710:        vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/retargeter.rs:711:    ) -> Result<TargetAnimation, RetargetError> {
crates/humanoid_retarget/src/retargeter.rs:741:        Ok(TargetAnimation {
crates/humanoid_retarget/src/source_anim.rs:3://! `SourceAsset` (in `fbx_rig`) is the canonical file-format wrapper that
crates/humanoid_retarget/src/source_anim.rs:6://! `SourceAsset` that carry only the slice each downstream consumer cares
crates/humanoid_retarget/src/source_anim.rs:21://! references into the `SourceAsset` that owns the data. Callers that
crates/humanoid_retarget/src/source_anim.rs:35:use crate::fbx::{FbxBone, FbxBoneTrack, SourceAsset};
crates/humanoid_retarget/src/source_anim.rs:47:/// Body (skeletal) animation slice — borrows from a [`SourceAsset`].
crates/humanoid_retarget/src/source_anim.rs:54:/// zero-cost borrow; the underlying `SourceAsset` must outlive the view.
crates/humanoid_retarget/src/source_anim.rs:66:    /// Borrow the body slice from a [`SourceAsset`].
crates/humanoid_retarget/src/source_anim.rs:67:    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
crates/humanoid_retarget/src/source_anim.rs:87:/// Facial (blendshape) animation slice — borrows from a [`SourceAsset`].
crates/humanoid_retarget/src/source_anim.rs:100:    /// Borrow the facial slice from a [`SourceAsset`].
crates/humanoid_retarget/src/source_anim.rs:101:    pub fn from_source_asset(asset: &'a SourceAsset) -> Self {
crates/humanoid_retarget/src/lib.rs:25:pub use quality::{RetargetQuality, RetargetScore, BoneScore, RqDiagnostic, RqGrade, score_retarget, FingerRestScore, FingerBoneScore, score_fingers};
crates/humanoid_retarget/src/lib.rs:26:pub use retargeter::{ArpRetargeterInner, IdentityRetargeter, RetargeterOptions};
crates/humanoid_retarget/src/lib.rs:29:    BoneTrack, ExpressionTrack, FbxDiagnostics, FbxSkeletonFrames, TargetAnimation,
crates/humanoid_retarget/src/lib.rs:30:    MappedAnimation, RetargetedBone, VrmRestPose, swing_twist_decompose,
crates/humanoid_retarget/src/lib.rs:65:) -> Result<(MappedAnimation, FbxDiagnostics, FbxSkeletonFrames), RetargetError> {
crates/humanoid_retarget/src/lib.rs:132:) -> Result<(MappedAnimation, FbxDiagnostics), RetargetError> {
crates/humanoid_retarget/src/lib.rs:139:    fbx: &fbx::SourceAsset,
crates/humanoid_retarget/src/quality/diagnostic.rs:1://! Diagnostic conversion layer — bevy-vrm Grade ↔ shotloom Diagnostic.
crates/humanoid_retarget/src/quality/diagnostic.rs:4://! ([`Grade::A`] through [`Grade::F`]). Shotloom's `shotloom_common::
crates/humanoid_retarget/src/quality/diagnostic.rs:10://! ## Grade → Severity mapping
crates/humanoid_retarget/src/quality/diagnostic.rs:12://! | Grade | Severity | Reason |
crates/humanoid_retarget/src/quality/diagnostic.rs:21://! ## Why bevy-vrm keeps Grade
crates/humanoid_retarget/src/quality/diagnostic.rs:23://! `Grade` is more useful for the rapid-iteration R&D workflow where
crates/humanoid_retarget/src/quality/diagnostic.rs:27://! to compute Grade internally; this layer translates only at the
crates/humanoid_retarget/src/quality/diagnostic.rs:39:use super::{Grade, MetricResult, RubricResult};
crates/humanoid_retarget/src/quality/diagnostic.rs:45:    /// Maps from Grade::B.
crates/humanoid_retarget/src/quality/diagnostic.rs:48:    /// suggested. Maps from Grade::C.
crates/humanoid_retarget/src/quality/diagnostic.rs:51:    /// Maps from Grade::F or any failed hard-fail.
crates/humanoid_retarget/src/quality/diagnostic.rs:65:/// Convert a [`Grade`] to a [`Severity`]. Returns `None` for Grade::A
crates/humanoid_retarget/src/quality/diagnostic.rs:67:pub fn grade_to_severity(grade: Grade) -> Option<Severity> {
crates/humanoid_retarget/src/quality/diagnostic.rs:69:        Grade::A => None,
crates/humanoid_retarget/src/quality/diagnostic.rs:70:        Grade::B => Some(Severity::Info),
crates/humanoid_retarget/src/quality/diagnostic.rs:71:        Grade::C => Some(Severity::Warning),
crates/humanoid_retarget/src/quality/diagnostic.rs:72:        Grade::F => Some(Severity::Error),
crates/humanoid_retarget/src/quality/diagnostic.rs:102:    /// Convert a [`MetricResult`] to a [`Diagnostic`]. Returns `None`
crates/humanoid_retarget/src/quality/diagnostic.rs:104:    pub fn from_metric(metric: &MetricResult, rubric: &str) -> Option<Diagnostic> {
crates/humanoid_retarget/src/quality/diagnostic.rs:119:    pub fn from_hard_fail(check: &super::HardFailCheck, rubric: &str) -> Diagnostic {
crates/humanoid_retarget/src/quality/diagnostic.rs:131:/// Convert an entire [`RubricResult`] into a flat list of diagnostics.
crates/humanoid_retarget/src/quality/diagnostic.rs:134:pub fn rubric_to_diagnostics(result: &RubricResult) -> Vec<Diagnostic> {
crates/humanoid_retarget/src/quality/diagnostic.rs:158:    use crate::quality::{HardFailCheck, MetricResult};
crates/humanoid_retarget/src/quality/diagnostic.rs:160:    fn metric(name: &str, grade: Grade) -> MetricResult {
crates/humanoid_retarget/src/quality/diagnostic.rs:161:        MetricResult {
crates/humanoid_retarget/src/quality/diagnostic.rs:171:        assert_eq!(grade_to_severity(Grade::A), None);
crates/humanoid_retarget/src/quality/diagnostic.rs:176:        assert_eq!(grade_to_severity(Grade::B), Some(Severity::Info));
crates/humanoid_retarget/src/quality/diagnostic.rs:181:        assert_eq!(grade_to_severity(Grade::C), Some(Severity::Warning));
crates/humanoid_retarget/src/quality/diagnostic.rs:186:        assert_eq!(grade_to_severity(Grade::F), Some(Severity::Error));
crates/humanoid_retarget/src/quality/diagnostic.rs:191:        let result = RubricResult {
crates/humanoid_retarget/src/quality/diagnostic.rs:195:                metric("M1_All_Good", Grade::A),
crates/humanoid_retarget/src/quality/diagnostic.rs:196:                metric("M2_Minor", Grade::B),
crates/humanoid_retarget/src/quality/diagnostic.rs:197:                metric("M3_Major", Grade::F),
crates/humanoid_retarget/src/quality/diagnostic.rs:199:            overall: Grade::C,
crates/humanoid_retarget/src/quality/diagnostic.rs:202:        let diags = rubric_to_diagnostics(&result);
crates/humanoid_retarget/src/quality/diagnostic.rs:212:        let result = RubricResult {
crates/humanoid_retarget/src/quality/diagnostic.rs:215:                HardFailCheck {
crates/humanoid_retarget/src/quality/diagnostic.rs:222:            overall: Grade::F,
crates/humanoid_retarget/src/quality/diagnostic.rs:225:        let diags = rubric_to_diagnostics(&result);
crates/humanoid_retarget/src/quality/diagnostic.rs:233:        let result = RubricResult {
crates/humanoid_retarget/src/quality/diagnostic.rs:236:                HardFailCheck {
crates/humanoid_retarget/src/quality/diagnostic.rs:243:            overall: Grade::A,
crates/humanoid_retarget/src/quality/diagnostic.rs:246:        let diags = rubric_to_diagnostics(&result);
crates/humanoid_retarget/src/vrm_rest.rs:1://! Extract VrmRestPose from a VRM/GLB file without Bevy.
crates/humanoid_retarget/src/vrm_rest.rs:9:use crate::VrmRestPose;
crates/humanoid_retarget/src/vrm_rest.rs:25:/// Extract VrmRestPose from a VRM 1.0 GLB binary.
crates/humanoid_retarget/src/vrm_rest.rs:28:pub fn extract_vrm_rest_pose(glb_bytes: &[u8]) -> Result<VrmRestPose, VrmRestError> {
crates/humanoid_retarget/src/vrm_rest.rs:153:    // Build VrmRestPose
crates/humanoid_retarget/src/vrm_rest.rs:239:    Ok(VrmRestPose {
crates/humanoid_retarget/src/quality/validate.rs:10:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/quality/validate.rs:11:use crate::types::VrmRestPose;
crates/humanoid_retarget/src/quality/validate.rs:155:fn validate_fbx_parse(bytes: &[u8]) -> Result<(SourceAsset, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:191:) -> Result<(VrmRestPose, VrmVersion, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:250:    fbx: &SourceAsset,
crates/humanoid_retarget/src/quality/validate.rs:253:) -> Result<(crate::types::MappedAnimation, Vec<String>), Vec<String>> {
crates/humanoid_retarget/src/quality/validate.rs:285:    anim: &crate::types::MappedAnimation,
crates/humanoid_retarget/src/quality/validate.rs:286:    vrm_rest: &mut VrmRestPose,
crates/humanoid_retarget/src/quality/validate.rs:321:    fbx: &SourceAsset,
crates/humanoid_retarget/src/quality/validate.rs:322:    anim: &crate::types::MappedAnimation,
crates/humanoid_retarget/src/quality/validate.rs:323:    vrm_rest: VrmRestPose,
crates/humanoid_retarget/src/quality/validate.rs:351:        crate::ArpRetargeterInner::new(vrm_rest, fbx_skel, anim, &fbx_root, &fbx_hips);
crates/humanoid_retarget/src/orchestrate.rs:36:use crate::fbx::SourceAsset;
crates/humanoid_retarget/src/orchestrate.rs:38:    Diagnostic, RubricResult, check_gating, rubric_a, rubric_b, rubric_c,
crates/humanoid_retarget/src/orchestrate.rs:39:    fk_evaluate, rubric_to_diagnostics,
crates/humanoid_retarget/src/orchestrate.rs:41:use crate::types::{TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/orchestrate.rs:59:    pub rubric_a: Option<RubricResult>,
crates/humanoid_retarget/src/orchestrate.rs:60:    pub rubric_b: Option<RubricResult>,
crates/humanoid_retarget/src/orchestrate.rs:61:    pub rubric_c: Option<RubricResult>,
crates/humanoid_retarget/src/orchestrate.rs:62:    pub target_animation: Option<TargetAnimation>,
crates/humanoid_retarget/src/orchestrate.rs:84:/// - Parse FBX bytes into a [`SourceAsset`] (FBX-format-level concern,
crates/humanoid_retarget/src/orchestrate.rs:86:/// - Extract / build [`VrmRestPose`] (VRM-format-level concern).
crates/humanoid_retarget/src/orchestrate.rs:97:pub fn evaluate_pipeline(
crates/humanoid_retarget/src/orchestrate.rs:98:    source_asset: &SourceAsset,
crates/humanoid_retarget/src/orchestrate.rs:99:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/orchestrate.rs:115:    result.diagnostics.extend(rubric_to_diagnostics(&score_a));
crates/humanoid_retarget/src/orchestrate.rs:120:    result.diagnostics.extend(rubric_to_diagnostics(&score_b));
crates/humanoid_retarget/src/orchestrate.rs:161:    let retargeter = crate::ArpRetargeterInner::new(
crates/humanoid_retarget/src/orchestrate.rs:198:    result.diagnostics.extend(rubric_to_diagnostics(&score_c));
crates/humanoid_retarget/src/orchestrate.rs:217:            rubric_c: Some(RubricResult {
crates/humanoid_retarget/src/orchestrate.rs:221:                overall: crate::quality::Grade::A,
crates/humanoid_retarget/src/orchestrate.rs:270:        // Construct a result mimicking what evaluate_pipeline produces
crates/humanoid_retarget/src/quality/fk_evaluate.rs:1://! FK evaluation: TargetAnimation → VrmSkeletonFrames
crates/humanoid_retarget/src/quality/fk_evaluate.rs:9:/// evaluated via FK chain from TargetAnimation local rotations.
crates/humanoid_retarget/src/quality/fk_evaluate.rs:19:    result: &crate::TargetAnimation,
crates/humanoid_retarget/src/quality/fk_evaluate.rs:20:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/mod.rs:6:pub enum Grade {
crates/humanoid_retarget/src/quality/mod.rs:13:impl Grade {
crates/humanoid_retarget/src/quality/mod.rs:15:        if score >= 90.0 { Grade::A }
crates/humanoid_retarget/src/quality/mod.rs:16:        else if score >= 80.0 { Grade::B }
crates/humanoid_retarget/src/quality/mod.rs:17:        else if score >= 70.0 { Grade::C }
crates/humanoid_retarget/src/quality/mod.rs:18:        else { Grade::F }
crates/humanoid_retarget/src/quality/mod.rs:23:            Grade::A => "A",
crates/humanoid_retarget/src/quality/mod.rs:24:            Grade::B => "B",
crates/humanoid_retarget/src/quality/mod.rs:25:            Grade::C => "C",
crates/humanoid_retarget/src/quality/mod.rs:26:            Grade::F => "F",
crates/humanoid_retarget/src/quality/mod.rs:31:impl std::fmt::Display for Grade {
crates/humanoid_retarget/src/quality/mod.rs:39:pub struct MetricResult {
crates/humanoid_retarget/src/quality/mod.rs:41:    pub grade: Grade,
crates/humanoid_retarget/src/quality/mod.rs:48:pub struct HardFailCheck {
crates/humanoid_retarget/src/quality/mod.rs:56:pub struct RubricResult {
crates/humanoid_retarget/src/quality/mod.rs:58:    pub hard_fails: Vec<HardFailCheck>,
crates/humanoid_retarget/src/quality/mod.rs:59:    pub metrics: Vec<MetricResult>,
crates/humanoid_retarget/src/quality/mod.rs:60:    pub overall: Grade,
crates/humanoid_retarget/src/quality/mod.rs:64:impl RubricResult {
crates/humanoid_retarget/src/quality/mod.rs:101:    rubric_a: &RubricResult,
crates/humanoid_retarget/src/quality/mod.rs:102:    rubric_b: &RubricResult,
crates/humanoid_retarget/src/quality/mod.rs:113:impl std::fmt::Display for RubricResult {
crates/humanoid_retarget/src/quality/mod.rs:142:pub use diagnostic::{Diagnostic, Severity, aggregate_severity, grade_to_severity, rubric_to_diagnostics};
crates/humanoid_retarget/src/quality/mod.rs:146:pub enum RqGrade {
crates/humanoid_retarget/src/quality/mod.rs:153:impl RqGrade {
crates/humanoid_retarget/src/quality/mod.rs:155:        !matches!(self, RqGrade::F)
crates/humanoid_retarget/src/quality/mod.rs:159:impl std::fmt::Display for RqGrade {
crates/humanoid_retarget/src/quality/mod.rs:162:            RqGrade::A => write!(f, "A"),
crates/humanoid_retarget/src/quality/mod.rs:163:            RqGrade::B => write!(f, "B"),
crates/humanoid_retarget/src/quality/mod.rs:164:            RqGrade::C => write!(f, "C"),
crates/humanoid_retarget/src/quality/mod.rs:165:            RqGrade::F => write!(f, "F"),
crates/humanoid_retarget/src/quality/mod.rs:212:    pub fn grade(&self) -> RqGrade {
crates/humanoid_retarget/src/quality/mod.rs:217:            RqGrade::F
crates/humanoid_retarget/src/quality/mod.rs:219:            RqGrade::C
crates/humanoid_retarget/src/quality/mod.rs:221:            RqGrade::B
crates/humanoid_retarget/src/quality/mod.rs:223:            RqGrade::A
crates/humanoid_retarget/src/quality/rubric_a.rs:4:use super::{Grade, MetricResult, HardFailCheck, RubricResult};
crates/humanoid_retarget/src/quality/rubric_a.rs:7:// ─── Grade helpers ────────────────────────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_a.rs:10:fn grade_score(g: Grade) -> f32 {
crates/humanoid_retarget/src/quality/rubric_a.rs:12:        Grade::A => 95.0,
crates/humanoid_retarget/src/quality/rubric_a.rs:13:        Grade::B => 85.0,
crates/humanoid_retarget/src/quality/rubric_a.rs:14:        Grade::C => 75.0,
crates/humanoid_retarget/src/quality/rubric_a.rs:15:        Grade::F => 40.0,
crates/humanoid_retarget/src/quality/rubric_a.rs:21:fn check_hard_fails(body: &crate::source_anim::SourceAnimBody<'_>) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_a.rs:26:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_a.rs:33:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_a.rs:40:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_a.rs:50:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_a.rs:68:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_a.rs:98:// Grades on the worst bone, not the average. Averaging diluted single-
crates/humanoid_retarget/src/quality/rubric_a.rs:100:// 21 zeros, avg 0.16 → false Grade A).
crates/humanoid_retarget/src/quality/rubric_a.rs:121:fn metric_angular_velocity_outliers(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:134:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:136:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:137:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:155:        Grade::A
crates/humanoid_retarget/src/quality/rubric_a.rs:157:        Grade::B
crates/humanoid_retarget/src/quality/rubric_a.rs:159:        Grade::C
crates/humanoid_retarget/src/quality/rubric_a.rs:161:        Grade::F
crates/humanoid_retarget/src/quality/rubric_a.rs:169:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:190:fn metric_bone_symmetry(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:231:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:233:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:234:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:245:        Grade::A
crates/humanoid_retarget/src/quality/rubric_a.rs:247:        Grade::B
crates/humanoid_retarget/src/quality/rubric_a.rs:249:        Grade::C
crates/humanoid_retarget/src/quality/rubric_a.rs:251:        Grade::F
crates/humanoid_retarget/src/quality/rubric_a.rs:254:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:273:    fbx: &crate::fbx::SourceAsset,
crates/humanoid_retarget/src/quality/rubric_a.rs:275:) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:284:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:286:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:287:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:294:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:296:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:297:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:345:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:347:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:348:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:355:    let grade = if avg_slide < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_a.rs:356:        else if avg_slide < 15.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_a.rs:357:        else if avg_slide < 30.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_a.rs:358:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_a.rs:360:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:374://      × 28 zero-jerks, yielding p99=0 and a false Grade A.
crates/humanoid_retarget/src/quality/rubric_a.rs:394:// Grade on max per-bone rate (same boundaries as A1.1 / C1.3):
crates/humanoid_retarget/src/quality/rubric_a.rs:414:fn metric_smoothness(fbx: &crate::fbx::SourceAsset) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:458:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:460:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_a.rs:461:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_a.rs:479:        Grade::A
crates/humanoid_retarget/src/quality/rubric_a.rs:481:        Grade::B
crates/humanoid_retarget/src/quality/rubric_a.rs:483:        Grade::C
crates/humanoid_retarget/src/quality/rubric_a.rs:485:        Grade::F
crates/humanoid_retarget/src/quality/rubric_a.rs:493:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:508:/// the input is the body view of a SourceAsset (which today wraps an
crates/humanoid_retarget/src/quality/rubric_a.rs:510:pub fn evaluate(fbx: &crate::fbx::SourceAsset) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_a.rs:517:    // A-1: Graded metrics
crates/humanoid_retarget/src/quality/rubric_a.rs:522:    let foot_opt: Option<MetricResult> =
crates/humanoid_retarget/src/quality/rubric_a.rs:560:        Grade::F
crates/humanoid_retarget/src/quality/rubric_a.rs:562:        Grade::from_score(overall_score)
crates/humanoid_retarget/src/quality/rubric_a.rs:571:    RubricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:4:use super::{Grade, MetricResult, HardFailCheck, RubricResult};
crates/humanoid_retarget/src/quality/rubric_b.rs:6:// ─── Grade helpers ────────────────────────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_b.rs:8:fn grade_score(g: Grade) -> f32 {
crates/humanoid_retarget/src/quality/rubric_b.rs:10:        Grade::A => 95.0,
crates/humanoid_retarget/src/quality/rubric_b.rs:11:        Grade::B => 85.0,
crates/humanoid_retarget/src/quality/rubric_b.rs:12:        Grade::C => 75.0,
crates/humanoid_retarget/src/quality/rubric_b.rs:13:        Grade::F => 40.0,
crates/humanoid_retarget/src/quality/rubric_b.rs:55:fn check_hard_fails(vrm_rest: &crate::types::VrmRestPose) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_b.rs:66:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_b.rs:92:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_b.rs:107:fn metric_completeness(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:114:    let grade = if coverage >= 0.95 { Grade::A }       // 52+
crates/humanoid_retarget/src/quality/rubric_b.rs:115:        else if coverage >= 0.85 { Grade::B }           // 47+
crates/humanoid_retarget/src/quality/rubric_b.rs:116:        else if coverage >= 0.70 { Grade::C }           // 39+
crates/humanoid_retarget/src/quality/rubric_b.rs:117:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_b.rs:119:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:143:fn metric_proportion(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:191:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:193:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_b.rs:194:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_b.rs:207:    let grade = if max_dev < 0.10 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_b.rs:208:        else if max_dev < 0.25 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_b.rs:209:        else if max_dev < 0.50 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_b.rs:210:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_b.rs:212:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:241:fn metric_tpose(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:260:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:262:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_b.rs:263:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_b.rs:280:    // Grade by worst of arm or leg
crates/humanoid_retarget/src/quality/rubric_b.rs:281:    let arm_grade = if avg_arm_err < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_b.rs:282:        else if avg_arm_err < 15.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_b.rs:283:        else if avg_arm_err < 30.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_b.rs:284:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_b.rs:286:    let leg_grade = if avg_leg_err < 3.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_b.rs:287:        else if avg_leg_err < 8.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_b.rs:288:        else if avg_leg_err < 15.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_b.rs:289:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_b.rs:293:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:314:fn metric_sole_offset(vrm_rest: &crate::types::VrmRestPose) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:319:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:321:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_b.rs:322:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_b.rs:330:    let grade = if diff_mm < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_b.rs:331:        else if diff_mm < 15.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_b.rs:332:        else if diff_mm < 30.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_b.rs:333:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_b.rs:335:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:349:pub fn evaluate(vrm_rest: &crate::types::VrmRestPose) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_b.rs:354:    // B-1: Graded metrics
crates/humanoid_retarget/src/quality/rubric_b.rs:386:        Grade::F
crates/humanoid_retarget/src/quality/rubric_b.rs:388:        Grade::from_score(overall_score)
crates/humanoid_retarget/src/quality/rubric_b.rs:391:    RubricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:30:use super::{Grade, HardFailCheck, MetricResult, RubricResult};
crates/humanoid_retarget/src/quality/rubric_c.rs:33:// ─── Grade helpers ────────────────────────────────────────────────────────────
crates/humanoid_retarget/src/quality/rubric_c.rs:35:fn grade_score(g: Grade) -> f32 {
crates/humanoid_retarget/src/quality/rubric_c.rs:37:        Grade::A => 95.0,
crates/humanoid_retarget/src/quality/rubric_c.rs:38:        Grade::B => 85.0,
crates/humanoid_retarget/src/quality/rubric_c.rs:39:        Grade::C => 75.0,
crates/humanoid_retarget/src/quality/rubric_c.rs:40:        Grade::F => 40.0,
crates/humanoid_retarget/src/quality/rubric_c.rs:78:fn check_hard_fails(vrm_fk: &VrmSkeletonFrames) -> Vec<HardFailCheck> {
crates/humanoid_retarget/src/quality/rubric_c.rs:83:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_c.rs:116:    checks.push(HardFailCheck {
crates/humanoid_retarget/src/quality/rubric_c.rs:193:/// pipeline. Built by the caller from `MappedAnimation.bone_tracks`.
crates/humanoid_retarget/src/quality/rubric_c.rs:248:) -> Option<MetricResult> {
crates/humanoid_retarget/src/quality/rubric_c.rs:251:        return Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:253:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:254:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:316:        return Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:318:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:319:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:324:    // Grade thresholds tuned to absorb baseline retargeter pose-correction
crates/humanoid_retarget/src/quality/rubric_c.rs:334:        Grade::A
crates/humanoid_retarget/src/quality/rubric_c.rs:336:        Grade::B
crates/humanoid_retarget/src/quality/rubric_c.rs:338:        Grade::C
crates/humanoid_retarget/src/quality/rubric_c.rs:340:        Grade::F
crates/humanoid_retarget/src/quality/rubric_c.rs:349:    Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:369:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_c.rs:370:) -> MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:372:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:374:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:375:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:382:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:384:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:385:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:390:    let mut all_grades: Vec<Grade> = Vec::new();
crates/humanoid_retarget/src/quality/rubric_c.rs:427:            let pen_grade = if max_pen_mm < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_c.rs:428:                else if max_pen_mm < 15.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_c.rs:429:                else if max_pen_mm < 30.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_c.rs:430:                else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_c.rs:471:        let slide_grade = if max_slide_mm < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_c.rs:472:            else if max_slide_mm < 10.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_c.rs:473:            else if max_slide_mm < 25.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_c.rs:474:            else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_c.rs:476:        let bounce_grade = if max_bounce_mm < 3.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_c.rs:477:            else if max_bounce_mm < 8.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_c.rs:478:            else if max_bounce_mm < 15.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_c.rs:479:            else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_c.rs:481:        let penetration_grade = if max_penetration_mm < 5.0 { Grade::A }
crates/humanoid_retarget/src/quality/rubric_c.rs:482:            else if max_penetration_mm < 15.0 { Grade::B }
crates/humanoid_retarget/src/quality/rubric_c.rs:483:            else if max_penetration_mm < 30.0 { Grade::C }
crates/humanoid_retarget/src/quality/rubric_c.rs:484:            else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_c.rs:495:        return MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:497:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:498:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:503:    let grade = all_grades.into_iter().min().unwrap_or(Grade::A);
crates/humanoid_retarget/src/quality/rubric_c.rs:505:    MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:531:) -> Option<MetricResult> {
crates/humanoid_retarget/src/quality/rubric_c.rs:533:        return Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:535:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:536:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:582:        return Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:584:            grade: Grade::A,
crates/humanoid_retarget/src/quality/rubric_c.rs:585:            score: grade_score(Grade::A),
crates/humanoid_retarget/src/quality/rubric_c.rs:605:        Grade::A
crates/humanoid_retarget/src/quality/rubric_c.rs:607:        Grade::B
crates/humanoid_retarget/src/quality/rubric_c.rs:609:        Grade::C
crates/humanoid_retarget/src/quality/rubric_c.rs:611:        Grade::F
crates/humanoid_retarget/src/quality/rubric_c.rs:619:    Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:632:// averaged across matched effectors. Grade thresholds are intentionally
crates/humanoid_retarget/src/quality/rubric_c.rs:662:) -> Option<MetricResult> {
crates/humanoid_retarget/src/quality/rubric_c.rs:715:    let grade = if (0.85..=1.15).contains(&mean_ratio) { Grade::A }
crates/humanoid_retarget/src/quality/rubric_c.rs:716:        else if (0.70..=1.40).contains(&mean_ratio) { Grade::B }
crates/humanoid_retarget/src/quality/rubric_c.rs:717:        else if (0.35..=2.50).contains(&mean_ratio) { Grade::C }
crates/humanoid_retarget/src/quality/rubric_c.rs:718:        else { Grade::F };
crates/humanoid_retarget/src/quality/rubric_c.rs:720:    Some(MetricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:753:    result: &crate::TargetAnimation,
crates/humanoid_retarget/src/quality/rubric_c.rs:754:    vrm_rest: &crate::types::VrmRestPose,
crates/humanoid_retarget/src/quality/rubric_c.rs:757:) -> RubricResult {
crates/humanoid_retarget/src/quality/rubric_c.rs:763:    // C-1: Graded metrics
crates/humanoid_retarget/src/quality/rubric_c.rs:804:        Grade::F
crates/humanoid_retarget/src/quality/rubric_c.rs:806:        Grade::from_score(overall_score)
crates/humanoid_retarget/src/quality/rubric_c.rs:821:    RubricResult {
crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs:5:use fbx_rig::{SourceAsset, euler_to_quat, parse};
crates/humanoid_retarget/src/bin/fbx_summary_scratch.rs:184:fn detect_jitter(fbx: &SourceAsset) -> Vec<(String, f32)> {
crates/humanoid_retarget/src/types.rs:26:pub struct VrmRestPose {
crates/humanoid_retarget/src/types.rs:64:pub struct TargetAnimation {
crates/humanoid_retarget/src/types.rs:74:pub struct MappedAnimation {
crates/humanoid_retarget/src/quality/score.rs:6:use crate::types::{FbxSkeletonFrames, TargetAnimation, VrmRestPose};
crates/humanoid_retarget/src/quality/score.rs:7:use super::RqGrade;
crates/humanoid_retarget/src/quality/score.rs:16:    pub grade: RqGrade,
crates/humanoid_retarget/src/quality/score.rs:24:    pub overall_grade: RqGrade,
crates/humanoid_retarget/src/quality/score.rs:57:    result: &TargetAnimation,
crates/humanoid_retarget/src/quality/score.rs:58:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:139:    result: &TargetAnimation,
crates/humanoid_retarget/src/quality/score.rs:140:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:211:        let pos_grade = if pos_rms < 0.02 { RqGrade::A } else if pos_rms < 0.05 { RqGrade::B } else if pos_rms < 0.10 { RqGrade::C } else { RqGrade::F };
crates/humanoid_retarget/src/quality/score.rs:213:            else if dir_mean < 5.0 { RqGrade::A } else if dir_mean < 15.0 { RqGrade::B } else if dir_mean < 30.0 { RqGrade::C } else { RqGrade::F };
crates/humanoid_retarget/src/quality/score.rs:233:    let overall_grade = bone_scores.iter().map(|b| b.grade).max_by_key(|g| *g as u8).unwrap_or(RqGrade::A);
crates/humanoid_retarget/src/quality/score.rs:250:    pub grade: RqGrade,
crates/humanoid_retarget/src/quality/score.rs:255:    result: &TargetAnimation,
crates/humanoid_retarget/src/quality/score.rs:256:    vrm_rest: &VrmRestPose,
crates/humanoid_retarget/src/quality/score.rs:295:    // Grade: A<1° B<5° C<15° F≥15°
crates/humanoid_retarget/src/quality/score.rs:296:    let grade = if max_rest < 1.0 { RqGrade::A }
crates/humanoid_retarget/src/quality/score.rs:297:        else if max_rest < 5.0 { RqGrade::B }
crates/humanoid_retarget/src/quality/score.rs:298:        else if max_rest < 15.0 { RqGrade::C }
crates/humanoid_retarget/src/quality/score.rs:299:        else { RqGrade::F };
crates/humanoid_retarget/src/quality/score.rs:308:            "Bone", "PosRMS", "PosMax", "DirMean", "DirMax", "Grade")?;
crates/humanoid_retarget/src/bin/retarget_test.rs:10:use humanoid_retarget::orchestrate::evaluate_pipeline;
crates/humanoid_retarget/src/bin/retarget_test.rs:43:    let mut rubric_a_cache: std::collections::HashMap<String, humanoid_retarget::quality::RubricResult> =
crates/humanoid_retarget/src/bin/retarget_test.rs:65:    let mut vrm_data: Vec<(String, Vec<u8>, humanoid_retarget::types::VrmRestPose, VrmVersion, humanoid_retarget::quality::RubricResult)> = Vec::new();
crates/humanoid_retarget/src/bin/retarget_test.rs:122:            // (evaluate_pipeline would re-parse and double-print).
crates/humanoid_retarget/src/bin/retarget_test.rs:129:            // as evaluate_pipeline's gate, but skips a file read on the
crates/humanoid_retarget/src/bin/retarget_test.rs:146:            let pipeline = evaluate_pipeline(&fbx_parsed, vrm_rest, &config, *vrm_version);
crates/humanoid_retarget/src/bin/retarget_test.rs:166:                if matches!(m.grade, humanoid_retarget::quality::Grade::F | humanoid_retarget::quality::Grade::C) {
crates/humanoid_retarget/src/bin/retarget_test.rs:179:        // Minimal JSON output — TODO: serialize full RubricResult if needed

exec
/bin/zsh -lc 'rg -n "pub struct ValidatedSource|pub struct ValidatedTarget|shotloom_common::Diagnostic|shotloom-common::Diagnostic|DiagnosticSeverity|DiagnosticLocation" crates docs' in /Users/deemooooooooo/Desktop/www/shotloom-github
 succeeded in 0ms:
crates/shotloom-common/src/diagnostic.rs:26:pub enum DiagnosticSeverity {
crates/shotloom-common/src/diagnostic.rs:39:pub struct DiagnosticLocation {
crates/shotloom-common/src/diagnostic.rs:51:    pub severity: DiagnosticSeverity,
crates/shotloom-common/src/diagnostic.rs:73:    pub location: Option<DiagnosticLocation>,
crates/shotloom-common/src/diagnostic.rs:80:            severity: DiagnosticSeverity::Error,
crates/shotloom-common/src/diagnostic.rs:94:            severity: DiagnosticSeverity::Warning,
crates/shotloom-common/src/diagnostic.rs:108:            severity: DiagnosticSeverity::Info,
crates/shotloom-common/src/diagnostic.rs:139:        self.location = Some(DiagnosticLocation {
crates/shotloom-common/src/diagnostic.rs:155:            DiagnosticSeverity::Error => "ERROR",
crates/shotloom-common/src/diagnostic.rs:156:            DiagnosticSeverity::Warning => "WARN",
crates/shotloom-common/src/diagnostic.rs:157:            DiagnosticSeverity::Info => "INFO",
crates/shotloom-common/src/diagnostic.rs:170:        assert_eq!(e.severity, DiagnosticSeverity::Error);
crates/shotloom-common/src/diagnostic.rs:173:        assert_eq!(w.severity, DiagnosticSeverity::Warning);
crates/shotloom-common/src/diagnostic.rs:176:        assert_eq!(i.severity, DiagnosticSeverity::Info);
crates/shotloom-common/src/diagnostic.rs:196:            Some(DiagnosticLocation {
crates/shotloom-common/src/diagnostic.rs:252:        assert_eq!(d.severity, DiagnosticSeverity::Warning);
crates/shotloom-common/src/diagnostic.rs:278:        let loc = DiagnosticLocation {
crates/shotloom-common/src/diagnostic.rs:284:        let back: DiagnosticLocation = serde_json::from_str(&json).unwrap();
crates/shotloom-gltf/src/vrm_normalization.rs:52:pub enum VrmDiagnosticSeverity {
crates/shotloom-gltf/src/vrm_normalization.rs:60:    pub severity: VrmDiagnosticSeverity,
crates/shotloom-gltf/src/vrm_normalization.rs:74:            severity: VrmDiagnosticSeverity::Warning,
crates/shotloom-gltf/src/vrm_normalization.rs:87:            severity: VrmDiagnosticSeverity::Error,
crates/shotloom-gltf/src/vrm_normalization.rs:100:            severity: VrmDiagnosticSeverity::Info,
crates/shotloom-gltf/src/vrm_normalization.rs:1938:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:1961:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:1984:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2007:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2030:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2048:        assert_eq!(missing.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2065:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2087:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2109:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2132:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2156:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2207:            assert_eq!(invalid_meta.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2219:                assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2262:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2283:            assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2316:            assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2333:            .any(|d| d.code == "missing_meta" && d.severity == VrmDiagnosticSeverity::Warning));
crates/shotloom-gltf/src/vrm_normalization.rs:2345:            assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2366:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2378:        assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2404:            assert_eq!(diag.severity, VrmDiagnosticSeverity::Error);
crates/shotloom-gltf/src/vrm_normalization.rs:2463:        assert_eq!(blink_warn.severity, VrmDiagnosticSeverity::Warning);
crates/shotloom-gltf/src/vrm_normalization.rs:2550:        assert_eq!(synth.severity, VrmDiagnosticSeverity::Info);
crates/shotloom-gltf/src/lib.rs:12:    VrmDiagnosticSeverity, VrmFlavor, VrmMetadataSummary, VrmNormalizationError,
crates/shotloom-retarget/src/lib.rs:22://! - **Operational diagnostic axis** — uses `shotloom-common::Diagnostic`
crates/shotloom-core/tests/generate_bridge_fixtures.rs:4:use shotloom_common::Diagnostic;
crates/shotloom-import/src/lib.rs:22:use shotloom_common::diagnostic::{Diagnostic, DiagnosticLocation, DiagnosticSeverity};
crates/shotloom-import/src/lib.rs:24:    normalize_vrm, VrmDiagnostic, VrmDiagnosticSeverity, VrmFlavor, VrmNormalizationError,
crates/shotloom-import/src/lib.rs:82:        VrmDiagnosticSeverity::Warning => DiagnosticSeverity::Warning,
crates/shotloom-import/src/lib.rs:83:        VrmDiagnosticSeverity::Error => DiagnosticSeverity::Error,
crates/shotloom-import/src/lib.rs:84:        VrmDiagnosticSeverity::Info => DiagnosticSeverity::Info,
crates/shotloom-import/src/lib.rs:87:    let location = vrm.asset_context.map(|context| DiagnosticLocation {
crates/shotloom-import/src/lib.rs:294:            severity: VrmDiagnosticSeverity::Warning,
crates/shotloom-import/src/lib.rs:301:        assert_eq!(d.severity, DiagnosticSeverity::Warning);
crates/shotloom-import/src/lib.rs:308:            Some(DiagnosticLocation {
crates/shotloom-import/src/lib.rs:318:            severity: VrmDiagnosticSeverity::Error,
crates/shotloom-import/src/lib.rs:325:        assert_eq!(d.severity, DiagnosticSeverity::Error);
crates/shotloom-import/src/lib.rs:335:            severity: VrmDiagnosticSeverity::Info,
crates/shotloom-import/src/lib.rs:342:        assert_eq!(d.severity, DiagnosticSeverity::Info);
crates/shotloom-import/src/lib.rs:347:            Some(DiagnosticLocation {
crates/shotloom-core/src/bridge.rs:43:use shotloom_common::Diagnostic;
docs/specs/vrm-character-validation.md:46:A hard-gate failure is reported as a `VrmDiagnosticSeverity::Error` and is
docs/specs/vrm-character-validation.md:90:A soft-gate finding is reported as a `VrmDiagnosticSeverity::Warning`.
docs/adr/adr-0021-cross-crate-diagnostic-type.md:67:pub enum DiagnosticSeverity {
docs/adr/adr-0021-cross-crate-diagnostic-type.md:75:pub struct DiagnosticLocation {
docs/adr/adr-0021-cross-crate-diagnostic-type.md:82:    pub severity: DiagnosticSeverity,
docs/adr/adr-0021-cross-crate-diagnostic-type.md:94:    pub location: Option<DiagnosticLocation>,
docs/adr/adr-0021-cross-crate-diagnostic-type.md:102:| `severity` | `DiagnosticSeverity` | Error (hard-gate, reject), Warning (soft-gate, allow), Info (observation) |
docs/adr/adr-0021-cross-crate-diagnostic-type.md:109:| `location` | `Option<DiagnosticLocation>` | Tagged primary entity: `entity_type` + `entity_id` |
docs/adr/adr-0021-cross-crate-diagnostic-type.md:111:`DiagnosticLocation` uses a tagged-string pattern (`entity_type` + `entity_id`)
docs/adr/adr-0021-cross-crate-diagnostic-type.md:173:`location: Some(DiagnosticLocation { entity_type: "asset_path", entity_id })`,
docs/adr/adr-0021-cross-crate-diagnostic-type.md:176:Note: `VrmDiagnosticSeverity` has no `Info` variant. The conversion maps
docs/adr/adr-0021-cross-crate-diagnostic-type.md:177:`Warning` to `DiagnosticSeverity::Warning` and `Error` to
docs/adr/adr-0021-cross-crate-diagnostic-type.md:178:`DiagnosticSeverity::Error`. This is sufficient — VRM validation produces
docs/adr/adr-0021-cross-crate-diagnostic-type.md:241:A `DiagnosticLocation` enum with variants like `Clip { clip_id, track_id }`,
docs/adr/adr-0023-retargeter-validation-contract.md:19:   `shotloom-common::Diagnostic` channel other shotloom subsystems
docs/adr/adr-0023-retargeter-validation-contract.md:30:  ADR-0021. They must fit `shotloom-common::Diagnostic` shape (3-level
docs/adr/adr-0023-retargeter-validation-contract.md:61:**Operational diagnostic axis.** Uses `shotloom-common::Diagnostic`
docs/adr/adr-0023-retargeter-validation-contract.md:160:    pub struct ValidatedSource<'a> { ... }
docs/adr/adr-0023-retargeter-validation-contract.md:161:    pub struct ValidatedTarget<'a> { ... }
docs/adr/adr-0023-retargeter-validation-contract.md:199:   `shotloom-common::Diagnostic`.

exec
/bin/zsh -lc "rg -n \"cfg\\(feature|feature =|features =\" crates/humanoid_retarget/src crates/humanoid_retarget/tests" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc "rg -n \"quality::validate|validate_pipeline\\(|retarget_with_skeleton\\(|pub fn retarget\\(|pub fn retarget_with_skeleton\\(\" crates/humanoid_retarget/src crates/humanoid_retarget/tests" in /Users/deemooooooooo/Desktop/www/bevy-vrm
exec
/bin/zsh -lc 'rg -n "pub fn evaluate_pipeline|pub struct PipelineResult|pub fn rubric_to_diagnostics|pub fn check_gating|pub struct ArpRetargeterInner|pub struct RetargeterOptions|pub struct IdentityRetargeter|pub fn extract_vrm_rest_pose|pub struct VrmRestPose|pub struct TargetAnimation|pub struct MappedAnimation|pub enum Grade|pub struct RubricResult|pub struct MetricResult|pub struct HardFailCheck" crates/humanoid_retarget/src' in /Users/deemooooooooo/Desktop/www/bevy-vrm
 exited 1 in 0ms:
 succeeded in 0ms:
crates/humanoid_retarget/tests/integration.rs:135:        humanoid_retarget::retarget_with_skeleton(&fbx_body(), &arp_config_json(), VrmVersion::V1_0)
crates/humanoid_retarget/src/mapping.rs:454:pub fn retarget(
crates/humanoid_retarget/src/retargeter.rs:707:    pub fn retarget(
crates/humanoid_retarget/src/lib.rs:61:pub fn retarget_with_skeleton(
crates/humanoid_retarget/src/lib.rs:128:pub fn retarget(
crates/humanoid_retarget/src/lib.rs:133:    let (anim, diag, _skeleton) = retarget_with_skeleton(fbx_data, config_json, vrm_version)?;
crates/humanoid_retarget/src/quality/validate.rs:4://! Usage: call `validate_pipeline()` with config JSON, FBX bytes, and VRM bytes.
crates/humanoid_retarget/src/quality/validate.rs:50:pub fn validate_pipeline(
crates/humanoid_retarget/src/bin/validate_pipeline.rs:20:    let result = humanoid_retarget::quality::validate::validate_pipeline(

 succeeded in 0ms:
crates/humanoid_retarget/src/retargeter.rs:82:pub struct ArpRetargeterInner {
crates/humanoid_retarget/src/retargeter.rs:104:pub struct RetargeterOptions {
crates/humanoid_retarget/src/retargeter.rs:695:pub struct IdentityRetargeter {
crates/humanoid_retarget/src/vrm_rest.rs:28:pub fn extract_vrm_rest_pose(glb_bytes: &[u8]) -> Result<VrmRestPose, VrmRestError> {
crates/humanoid_retarget/src/quality/diagnostic.rs:134:pub fn rubric_to_diagnostics(result: &RubricResult) -> Vec<Diagnostic> {
crates/humanoid_retarget/src/quality/mod.rs:6:pub enum Grade {
crates/humanoid_retarget/src/quality/mod.rs:39:pub struct MetricResult {
crates/humanoid_retarget/src/quality/mod.rs:48:pub struct HardFailCheck {
crates/humanoid_retarget/src/quality/mod.rs:56:pub struct RubricResult {
crates/humanoid_retarget/src/quality/mod.rs:100:pub fn check_gating(
crates/humanoid_retarget/src/types.rs:26:pub struct VrmRestPose {
crates/humanoid_retarget/src/types.rs:64:pub struct TargetAnimation {
crates/humanoid_retarget/src/types.rs:74:pub struct MappedAnimation {
crates/humanoid_retarget/src/orchestrate.rs:58:pub struct PipelineResult {
crates/humanoid_retarget/src/orchestrate.rs:97:pub fn evaluate_pipeline(

codex
## 1. **크레이트 한 줄 요약**

`humanoid_retarget`는 **ARP 계열 FBX 휴머노이드 애니메이션을 VRM rest pose에 매핑·리타게팅하고, A/B/C rubric으로 입력·타깃·출력 품질을 평가하는 순수 라이브러리 크레이트**다.

## 2. **의존성 그래프**

내부 모듈 의존성은 grep 기준으로 아래처럼 묶인다.

- `lib` → `adapters`, `config`, `finger_axis_map`, `finger_rest_align`, `mapping`, `orchestrate`, `postprocess`, `quality`, `retargeter`, `source_anim`, `topo`, `types`, `vrm_compat`, `vrm_rest`
- `orchestrate` → `config` → `mapping` → `retargeter` → `quality::{rubric_a,rubric_b,rubric_c,fk_evaluate,rubric_to_diagnostics,check_gating}` → `types` → `vrm_compat`
- `mapping` → `config`, `source_anim`, `types`, `vrm_compat`
- `retargeter` → `adapters::arp_vrm`, `topo`, `types`, `quality`, `config`
- `adapters::arp_vrm` → `config`, `finger_axis_map`, `finger_rest_align`, `adapters::arp_vrm_user_pose`, `types`
- `finger_rest_align` → `finger_axis_map`, `adapters::arp_vrm`
- `quality::mod` → `detector`, `rubric_a`, `rubric_b`, `rubric_c`, `fk_evaluate`, `score`, `validate`
- `quality::rubric_a` → `source_anim`, `detector`, `types`, `fbx` re-export, `compute_fbx_skeleton_from_parsed`
- `quality::rubric_b` → `types::VrmRestPose`
- `quality::rubric_c` → `quality::fk_evaluate::VrmSkeletonFrames`, `types::VrmRestPose`, `TargetAnimation`, `FbxSkeletonFrames`
- `quality::validate` → `config`, `mapping`, `adapters::arp_vrm`, `retargeter`, `vrm_rest`, `types`, `vrm_compat`
- `vrm_rest` → `types`
- `postprocess::wrist_twist` → `types`
- `source_anim` → `config::FbxSourceType`, `fbx::SourceAsset`
- `topo` → 독립
- `config` → 독립

## 3. **Session-level manifest**

| Session | Files moved | Renames | Dependencies on previous sessions | Exit criteria |
|---|---|---|---|---|
| 2 | `src/{config.rs, finger_axis_map.rs, finger_rest_align.rs, mapping.rs, orchestrate.rs, retargeter.rs, source_anim.rs, topo.rs, types.rs, vrm_compat.rs, vrm_rest.rs}`; `src/adapters/{mod.rs, arp_vrm.rs, arp_vrm_user_pose.rs}`; `src/postprocess/{mod.rs, wrist_twist.rs}`; `src/quality/{mod.rs, detector.rs, fk_evaluate.rs, rubric_a.rs, rubric_b.rs, rubric_c.rs, score.rs}`; 테스트는 `tests/{finger_axis_map.rs, finger_rest_align.rs, metric_fixtures.rs, fixtures/mod.rs}` 우선 이식 | 크레이트 경로 `humanoid_retarget` → `shotloom_retarget`; 소스 루트 `crates/humanoid_retarget` → `crates/shotloom-retarget`; `crate::fbx` historical re-export 유지 여부 결정 필요; `quality/diagnostic.rs`는 **미이식**하고 `shotloom_common::diagnostic` import + 로컬 `rubric_to_diagnostics`로 대체; `src/bin/*` 미이식; 삭제된 `src/quality/foot.rs` 미이식 | Session 1 scaffold + ADR-0023 + ADR-0021 | `cargo check -p shotloom-retarget` 통과; `PipelineResult.diagnostics`와 `rubric_to_diagnostics`가 `Vec<shotloom_common::Diagnostic>` 사용; `foot.rs` 없음; `quality/diagnostic.rs` 복사 없음; caller 크레이트 수정 없음 |
| 3 | `shotloom-common`에 `ValidatedSource` / `ValidatedTarget` marker 추가, `shotloom-retarget` public entry를 marker-gated로 전환 | `evaluate_pipeline` 또는 후속 public fn 시그니처를 marker 입력으로 변경 | Session 2 code landed | marker 없이 public retarget 호출 불가, diagnostic projection 유지 |
| 4 | `shotloom-import`, `shotloom-stage`, UI/viewer 쪽 caller migration | 기존 raw-input 호출부를 marker-gated 계약으로 교체 | Session 3 markers landed | caller migration 완료, shotloom 측 회귀 경로 정착 |

## 4. **Contract Surface**

Session 2 말미 기준 외부 노출 표면은 이렇게 잡는 것이 맞다.

- 주 엔트리:
  - `evaluate_pipeline(&SourceAsset, &VrmRestPose, &RetargetConfig, VrmVersion) -> PipelineResult`
- 결과 타입:
  - `PipelineResult`
  - `MappedAnimation`
  - `TargetAnimation`
  - `RetargetedBone`
  - `BoneTrack`
  - `ExpressionTrack`
  - `VrmRestPose`
- 품질 타입:
  - `Grade`
  - `MetricResult`
  - `HardFailCheck`
  - `RubricResult`
- 품질 평가 함수:
  - `rubric_a::evaluate`
  - `rubric_b::evaluate`
  - `rubric_c::evaluate`
  - `fk_evaluate::evaluate`
  - `check_gating`
  - `rubric_to_diagnostics`
- 운영 진단 경계:
  - `PipelineResult.diagnostics: Vec<shotloom_common::Diagnostic>`
  - `rubric_to_diagnostics(&RubricResult) -> Vec<shotloom_common::Diagnostic>`

세션 2에서는 marker gate가 아직 없으므로 `ValidatedSource` / `ValidatedTarget`는 포함되지 않는다.

## 5. **이식 시 주의점**

- 크레이트명 변경:
  - Cargo package는 `shotloom-retarget`, 코드 import 경로는 `shotloom_retarget`.
- Diagnostic 교체:
  - `src/quality/diagnostic.rs`는 복사 금지.
  - `shotloom_common::diagnostic::{Diagnostic, DiagnosticSeverity}`를 직접 사용해야 한다.
  - 기존 `Severity`, `location: Option<String>`, `recoverable: bool` 형태는 `DiagnosticSeverity`, `DiagnosticLocation`, `recoverable: Option<bool>`에 맞게 조정해야 한다.
- 경로 변경:
  - 소스는 `crate::fbx::SourceAsset`를 광범위하게 사용한다.
  - 실제로는 `pub use fbx_rig as fbx` re-export 위에 서 있으므로, `fbx_rig` 확보 전략이 먼저 필요하다.
- edition 차이:
  - 소스 크레이트는 `edition = "2024"`, 타깃 워크스페이스는 `edition.workspace = true`로 `2021`.
  - 세션 2 성공 기준은 반드시 shotloom 쪽 edition 2021에서의 컴파일이다.
- Cargo feature:
  - grep 결과 `cfg(feature)` / Cargo feature 사용은 없다.
  - 포팅 이슈는 feature flag보다 **runtime 옵션(`RetargeterOptions`)과 외부 crate 확보** 쪽이다.
- 소유권/borrow:
  - `SourceAnimBody<'a>` / `SourceAnimFacial<'a>`가 `SourceAsset`를 borrow한다.
  - Session 3 marker 도입 전에도 이 borrow 구조는 유지되므로, 불필요한 소유권 전환보다 기존 참조 흐름을 보존하는 편이 안전하다.
- 범위 통제:
  - `src/bin/*`, `tests/integration.rs`, `quality::validate.rs`는 Session 2의 단일 목표인 `cargo check`에 필수는 아니다.
  - 반대로 `score.rs`, `RetargetQuality`, `RetargetScore`는 `TargetAnimation` 필드 때문에 같이 와야 한다.

## 6. **검증 전략**

이식 직후 “옮겨졌다”를 증명하는 최소 검증은 세 층으로 잡아야 한다.

- 컴파일 검증:
  - `cargo check -p shotloom-retarget`
  - 이것이 Session 2의 하드 exit criteria다.
- hermetic 테스트 이식:
  - `tests/finger_axis_map.rs`
  - `tests/finger_rest_align.rs`
  - `tests/metric_fixtures.rs`
  - `tests/fixtures/mod.rs`
- 모듈 내부 테스트 유지/재작성:
  - `orchestrate.rs`의 helper/aggregation 테스트 유지
  - 기존 `quality/diagnostic.rs` 테스트는 파일 자체를 이식하지 말고, `rubric_to_diagnostics` 새 위치에서 `shotloom_common::Diagnostic` 기준으로 다시 작성

함께 옮기지 않을 테스트는 아래다.

- `tests/integration.rs`
  - bevy-vrm 레포의 `../../assets/...` 경로에 직접 의존
  - Session 2 목표인 real-code compile proof에는 필요 없다
- `src/bin/*`
  - CLI/scratch 도구이며 caller migration 이전 단계와도 맞지 않는다

## 7. **위험도**

- **🟡**
- 추정 작업 시간: **14시간**
- 가장 큰 unknown: **`fbx_rig`와 `vrm0_compat`를 shotloom 워크스페이스에서 어떤 방식으로 확보할지**

## 8. **Insufficient evidence**

- `retargeter.rs`, `vrm_rest.rs`, `quality/rubric_a.rs`, `quality/rubric_c.rs`는 public surface만 제공되어 있어, 내부 line-by-line 수정량과 정확한 컴파일 파손 지점은 현 자료만으로 확정할 수 없다.
- shotloom 레포에는 현재 `fbx_rig` / `vrm0_compat` 크레이트가 없고, 동등 대체 타입도 확인되지 않았다.
- `shotloom-retarget`의 Session 2 시점 public API를 어디까지 공개할지에 대한 기존 consumer 합의는 로컬 repo에서 확인되지 않았다.

## 9. **Decision needed**

- `SourceAsset`를 Session 2 public boundary에 그대로 둘 것인가:
  - 실제 소스는 domain-local 타입이 아니라 `fbx_rig::SourceAsset` re-export다.
  - 임시로 그대로 노출할지, shotloom 쪽 별도 래퍼/alias를 둘지 결정이 필요하다.
- `quality::validate.rs`를 Session 2에 포함할 것인가:
  - 실사용 public entry는 `evaluate_pipeline`이고, `validate.rs`는 bin 지향 validator다.
  - 컴파일 성공만 목표라면 제외가 더 깔끔하다.
- Session 2에서 legacy convenience API를 유지할 것인가:
  - `lib.rs`의 `retarget`, `retarget_with_skeleton`, `IdentityRetargeter`, `ArpRetargeterInner`를 계속 public으로 둘지 결정이 필요하다.
- `rubric_to_diagnostics`의 물리적 위치:
  - `quality/diagnostic.rs`는 복사 금지이므로, `quality/mod.rs`에 둘지 새 projection 모듈로 분리할지 결정이 필요하다.

## 10. **Out-of-scope observation**

- `tests/integration.rs`는 shotloom 레포 자산 배치와 맞지 않아 Session 2 성공 판단 기준으로 쓰기 어렵다.
- 소스 크레이트의 `src/bin/{retarget_test,pop_scan,validate_pipeline,fbx_summary_scratch}.rs`는 연구/CLI 성격이며, caller migration 이전에는 포트 우선순위가 낮다.
- `shotloom-desktop`의 Tauri icon bug는 주어진 범위 밖이다.

**결론: Session 2는 `orchestrate + retargeter + rubric A/B/C + supporting types/modules`를 한 번에 옮기되, `quality/diagnostic.rs`와 `src/bin/*`는 제외하고 `shotloom_common::Diagnostic` 경계로 바로 맞추는 방식이 가장 안전하다. 성공 기준은 테스트보다 먼저 `cargo check -p shotloom-retarget`이며, 이를 뒷받침하는 회귀 증명으로는 hermetic한 `finger_*`/`metric_fixtures` 테스트만 선별 이식하는 계획이 맞다.**
tokens used
116,855
## 1. **크레이트 한 줄 요약**

`humanoid_retarget`는 **ARP 계열 FBX 휴머노이드 애니메이션을 VRM rest pose에 매핑·리타게팅하고, A/B/C rubric으로 입력·타깃·출력 품질을 평가하는 순수 라이브러리 크레이트**다.

## 2. **의존성 그래프**

내부 모듈 의존성은 grep 기준으로 아래처럼 묶인다.

- `lib` → `adapters`, `config`, `finger_axis_map`, `finger_rest_align`, `mapping`, `orchestrate`, `postprocess`, `quality`, `retargeter`, `source_anim`, `topo`, `types`, `vrm_compat`, `vrm_rest`
- `orchestrate` → `config` → `mapping` → `retargeter` → `quality::{rubric_a,rubric_b,rubric_c,fk_evaluate,rubric_to_diagnostics,check_gating}` → `types` → `vrm_compat`
- `mapping` → `config`, `source_anim`, `types`, `vrm_compat`
- `retargeter` → `adapters::arp_vrm`, `topo`, `types`, `quality`, `config`
- `adapters::arp_vrm` → `config`, `finger_axis_map`, `finger_rest_align`, `adapters::arp_vrm_user_pose`, `types`
- `finger_rest_align` → `finger_axis_map`, `adapters::arp_vrm`
- `quality::mod` → `detector`, `rubric_a`, `rubric_b`, `rubric_c`, `fk_evaluate`, `score`, `validate`
- `quality::rubric_a` → `source_anim`, `detector`, `types`, `fbx` re-export, `compute_fbx_skeleton_from_parsed`
- `quality::rubric_b` → `types::VrmRestPose`
- `quality::rubric_c` → `quality::fk_evaluate::VrmSkeletonFrames`, `types::VrmRestPose`, `TargetAnimation`, `FbxSkeletonFrames`
- `quality::validate` → `config`, `mapping`, `adapters::arp_vrm`, `retargeter`, `vrm_rest`, `types`, `vrm_compat`
- `vrm_rest` → `types`
- `postprocess::wrist_twist` → `types`
- `source_anim` → `config::FbxSourceType`, `fbx::SourceAsset`
- `topo` → 독립
- `config` → 독립

## 3. **Session-level manifest**

| Session | Files moved | Renames | Dependencies on previous sessions | Exit criteria |
|---|---|---|---|---|
| 2 | `src/{config.rs, finger_axis_map.rs, finger_rest_align.rs, mapping.rs, orchestrate.rs, retargeter.rs, source_anim.rs, topo.rs, types.rs, vrm_compat.rs, vrm_rest.rs}`; `src/adapters/{mod.rs, arp_vrm.rs, arp_vrm_user_pose.rs}`; `src/postprocess/{mod.rs, wrist_twist.rs}`; `src/quality/{mod.rs, detector.rs, fk_evaluate.rs, rubric_a.rs, rubric_b.rs, rubric_c.rs, score.rs}`; 테스트는 `tests/{finger_axis_map.rs, finger_rest_align.rs, metric_fixtures.rs, fixtures/mod.rs}` 우선 이식 | 크레이트 경로 `humanoid_retarget` → `shotloom_retarget`; 소스 루트 `crates/humanoid_retarget` → `crates/shotloom-retarget`; `crate::fbx` historical re-export 유지 여부 결정 필요; `quality/diagnostic.rs`는 **미이식**하고 `shotloom_common::diagnostic` import + 로컬 `rubric_to_diagnostics`로 대체; `src/bin/*` 미이식; 삭제된 `src/quality/foot.rs` 미이식 | Session 1 scaffold + ADR-0023 + ADR-0021 | `cargo check -p shotloom-retarget` 통과; `PipelineResult.diagnostics`와 `rubric_to_diagnostics`가 `Vec<shotloom_common::Diagnostic>` 사용; `foot.rs` 없음; `quality/diagnostic.rs` 복사 없음; caller 크레이트 수정 없음 |
| 3 | `shotloom-common`에 `ValidatedSource` / `ValidatedTarget` marker 추가, `shotloom-retarget` public entry를 marker-gated로 전환 | `evaluate_pipeline` 또는 후속 public fn 시그니처를 marker 입력으로 변경 | Session 2 code landed | marker 없이 public retarget 호출 불가, diagnostic projection 유지 |
| 4 | `shotloom-import`, `shotloom-stage`, UI/viewer 쪽 caller migration | 기존 raw-input 호출부를 marker-gated 계약으로 교체 | Session 3 markers landed | caller migration 완료, shotloom 측 회귀 경로 정착 |

## 4. **Contract Surface**

Session 2 말미 기준 외부 노출 표면은 이렇게 잡는 것이 맞다.

- 주 엔트리:
  - `evaluate_pipeline(&SourceAsset, &VrmRestPose, &RetargetConfig, VrmVersion) -> PipelineResult`
- 결과 타입:
  - `PipelineResult`
  - `MappedAnimation`
  - `TargetAnimation`
  - `RetargetedBone`
  - `BoneTrack`
  - `ExpressionTrack`
  - `VrmRestPose`
- 품질 타입:
  - `Grade`
  - `MetricResult`
  - `HardFailCheck`
  - `RubricResult`
- 품질 평가 함수:
  - `rubric_a::evaluate`
  - `rubric_b::evaluate`
  - `rubric_c::evaluate`
  - `fk_evaluate::evaluate`
  - `check_gating`
  - `rubric_to_diagnostics`
- 운영 진단 경계:
  - `PipelineResult.diagnostics: Vec<shotloom_common::Diagnostic>`
  - `rubric_to_diagnostics(&RubricResult) -> Vec<shotloom_common::Diagnostic>`

세션 2에서는 marker gate가 아직 없으므로 `ValidatedSource` / `ValidatedTarget`는 포함되지 않는다.

## 5. **이식 시 주의점**

- 크레이트명 변경:
  - Cargo package는 `shotloom-retarget`, 코드 import 경로는 `shotloom_retarget`.
- Diagnostic 교체:
  - `src/quality/diagnostic.rs`는 복사 금지.
  - `shotloom_common::diagnostic::{Diagnostic, DiagnosticSeverity}`를 직접 사용해야 한다.
  - 기존 `Severity`, `location: Option<String>`, `recoverable: bool` 형태는 `DiagnosticSeverity`, `DiagnosticLocation`, `recoverable: Option<bool>`에 맞게 조정해야 한다.
- 경로 변경:
  - 소스는 `crate::fbx::SourceAsset`를 광범위하게 사용한다.
  - 실제로는 `pub use fbx_rig as fbx` re-export 위에 서 있으므로, `fbx_rig` 확보 전략이 먼저 필요하다.
- edition 차이:
  - 소스 크레이트는 `edition = "2024"`, 타깃 워크스페이스는 `edition.workspace = true`로 `2021`.
  - 세션 2 성공 기준은 반드시 shotloom 쪽 edition 2021에서의 컴파일이다.
- Cargo feature:
  - grep 결과 `cfg(feature)` / Cargo feature 사용은 없다.
  - 포팅 이슈는 feature flag보다 **runtime 옵션(`RetargeterOptions`)과 외부 crate 확보** 쪽이다.
- 소유권/borrow:
  - `SourceAnimBody<'a>` / `SourceAnimFacial<'a>`가 `SourceAsset`를 borrow한다.
  - Session 3 marker 도입 전에도 이 borrow 구조는 유지되므로, 불필요한 소유권 전환보다 기존 참조 흐름을 보존하는 편이 안전하다.
- 범위 통제:
  - `src/bin/*`, `tests/integration.rs`, `quality::validate.rs`는 Session 2의 단일 목표인 `cargo check`에 필수는 아니다.
  - 반대로 `score.rs`, `RetargetQuality`, `RetargetScore`는 `TargetAnimation` 필드 때문에 같이 와야 한다.

## 6. **검증 전략**

이식 직후 “옮겨졌다”를 증명하는 최소 검증은 세 층으로 잡아야 한다.

- 컴파일 검증:
  - `cargo check -p shotloom-retarget`
  - 이것이 Session 2의 하드 exit criteria다.
- hermetic 테스트 이식:
  - `tests/finger_axis_map.rs`
  - `tests/finger_rest_align.rs`
  - `tests/metric_fixtures.rs`
  - `tests/fixtures/mod.rs`
- 모듈 내부 테스트 유지/재작성:
  - `orchestrate.rs`의 helper/aggregation 테스트 유지
  - 기존 `quality/diagnostic.rs` 테스트는 파일 자체를 이식하지 말고, `rubric_to_diagnostics` 새 위치에서 `shotloom_common::Diagnostic` 기준으로 다시 작성

함께 옮기지 않을 테스트는 아래다.

- `tests/integration.rs`
  - bevy-vrm 레포의 `../../assets/...` 경로에 직접 의존
  - Session 2 목표인 real-code compile proof에는 필요 없다
- `src/bin/*`
  - CLI/scratch 도구이며 caller migration 이전 단계와도 맞지 않는다

## 7. **위험도**

- **🟡**
- 추정 작업 시간: **14시간**
- 가장 큰 unknown: **`fbx_rig`와 `vrm0_compat`를 shotloom 워크스페이스에서 어떤 방식으로 확보할지**

## 8. **Insufficient evidence**

- `retargeter.rs`, `vrm_rest.rs`, `quality/rubric_a.rs`, `quality/rubric_c.rs`는 public surface만 제공되어 있어, 내부 line-by-line 수정량과 정확한 컴파일 파손 지점은 현 자료만으로 확정할 수 없다.
- shotloom 레포에는 현재 `fbx_rig` / `vrm0_compat` 크레이트가 없고, 동등 대체 타입도 확인되지 않았다.
- `shotloom-retarget`의 Session 2 시점 public API를 어디까지 공개할지에 대한 기존 consumer 합의는 로컬 repo에서 확인되지 않았다.

## 9. **Decision needed**

- `SourceAsset`를 Session 2 public boundary에 그대로 둘 것인가:
  - 실제 소스는 domain-local 타입이 아니라 `fbx_rig::SourceAsset` re-export다.
  - 임시로 그대로 노출할지, shotloom 쪽 별도 래퍼/alias를 둘지 결정이 필요하다.
- `quality::validate.rs`를 Session 2에 포함할 것인가:
  - 실사용 public entry는 `evaluate_pipeline`이고, `validate.rs`는 bin 지향 validator다.
  - 컴파일 성공만 목표라면 제외가 더 깔끔하다.
- Session 2에서 legacy convenience API를 유지할 것인가:
  - `lib.rs`의 `retarget`, `retarget_with_skeleton`, `IdentityRetargeter`, `ArpRetargeterInner`를 계속 public으로 둘지 결정이 필요하다.
- `rubric_to_diagnostics`의 물리적 위치:
  - `quality/diagnostic.rs`는 복사 금지이므로, `quality/mod.rs`에 둘지 새 projection 모듈로 분리할지 결정이 필요하다.

## 10. **Out-of-scope observation**

- `tests/integration.rs`는 shotloom 레포 자산 배치와 맞지 않아 Session 2 성공 판단 기준으로 쓰기 어렵다.
- 소스 크레이트의 `src/bin/{retarget_test,pop_scan,validate_pipeline,fbx_summary_scratch}.rs`는 연구/CLI 성격이며, caller migration 이전에는 포트 우선순위가 낮다.
- `shotloom-desktop`의 Tauri icon bug는 주어진 범위 밖이다.

**결론: Session 2는 `orchestrate + retargeter + rubric A/B/C + supporting types/modules`를 한 번에 옮기되, `quality/diagnostic.rs`와 `src/bin/*`는 제외하고 `shotloom_common::Diagnostic` 경계로 바로 맞추는 방식이 가장 안전하다. 성공 기준은 테스트보다 먼저 `cargo check -p shotloom-retarget`이며, 이를 뒷받침하는 회귀 증명으로는 hermetic한 `finger_*`/`metric_fixtures` 테스트만 선별 이식하는 계획이 맞다.**
