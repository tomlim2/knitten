---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-492
repo: shotloom
linear: STL-492
spec: ../../plans/proposed/stage-validation-matrix.md
---

### Shotloom coding mode — docs

**Issue:** STL-492 "Stage validation compatibility matrix 정리"
  Problem: STL-479 will add Stage tags/options validation into the bundle validation path. Without a separate compatibility matrix, every implementation PR would re-decide bounds, rejection codes, and persisted-data compatibility.
  Acceptance:
  - Stage tags, StageRenderable options, bundle-format compatibility, IPC rejection semantics, and tests say the same bounds and failure vocabulary.
  - Stage tags use max 32, display-name validation, and documented normalization.
  - StageRenderable options use max 8192 bytes and max depth 8.
  - Persisted-data compatibility decision and migration/no-migration rationale are durable.
  - Add malformed persisted shot fixture or validator error-attribution tests if the spec determines they are needed.
  Affected: `docs/specs/bundle-format.md`, `docs/ipc/bridge-contract.md`, `docs/specs/stage-entity-model.md`, `crates/shotloom-core/src/model/stage.rs`, `crates/shotloom-core/src/model/shot.rs`, `crates/shotloom-core/src/model/validate.rs`, `crates/shotloom-core/tests/fixtures/`
  Linked: ADR-0005, ADR-0007, ADR-0050, ADR-0051, parent STL-479, related STL-480

**Branch:** `chore/stage-validation-matrix`  (base: `origin/main`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/guidelines/documentation-standard.md, docs/ipc/bridge-contract.md, docs/specs/bundle-format.md, docs/specs/stage-entity-model.md
**ADRs to honor:** ADR-0005 product-owned bundle schema, ADR-0007 shot as primary editing unit, ADR-0018 runtime telemetry/error boundaries, ADR-0021 cross-crate diagnostic type, ADR-0050 Stage entity model, ADR-0051 contract authority tiers
**Ask-first triggers for this task:** Bridge contract, bundle validation rules, core domain-model validation, and migration/no-migration decisions are ask-first surfaces. This briefing starts the docs/test matrix only because the user explicitly requested STL-492. If the spec wants to change the actual validator constants or rejection-code enum beyond documenting STL-479's target, ask before broadening.
**Intent lens:** Prevent data-compatibility and caller-recovery rules from drifting while STL-479 implements Stage lifecycle/edit handlers. The goal is not performance testing or runtime handler behavior; it is one durable matrix that fixes the meaning of Stage tag bounds, StageRenderable option bounds, command rejection codes, and persisted shot load compatibility.

**AC primitive cross-check:**
- Stage tags max 32, display-name validation, normalization: partial - `StageModel.tags` exists in `crates/shotloom-core/src/model/stage.rs`, and `docs/ipc/bridge-contract.md` lists invalid tags under `INVALID_STAGE_PAYLOAD`, but current `origin/main` has no Stage tag validator or concrete normalization rule. Spec must decide whether STL-492 documents the target only or adds tests/constants now.
- StageRenderable.options max 8192 bytes, max depth 8: wrong-shape if treated as already codified - `StageRenderable.options` is currently an unconstrained `serde_json::Map`; `docs/ipc/bridge-contract.md` still says concrete bounds land with the runtime handler PR. STL-492 exists to codify this missing primitive.
- Bundle-format compatibility decision: codified owner - `docs/specs/bundle-format.md` §18.3 defines load policy and schema validation failure categories; §11.1 says `stages` and `active_stage_id` are additive/defaulted for compatibility.
- Bridge contract rejection matrix cross-check: codified owner - `docs/ipc/bridge-contract.md` §13A.2 maps invalid tags and oversized/deep renderable options to `INVALID_STAGE_PAYLOAD`, while display names, transforms, assets, and post-mutation bundle validation use existing specific codes.
- Malformed persisted shot fixture or validator attribution tests: verification-example - `crates/shotloom-core/tests/fixtures/README.md` already has the pattern for fixture-driven load-gate tests; the spec should decide the smallest proof if STL-492 touches validator behavior.
- Lifecycle/edit handler implementation: sibling-owned - STL-479 owns handlers and validator application at command runtime; STL-492 should not implement create/update/delete behavior.
- Promote/demote Stage/Prop boundary implementation: sibling-owned - STL-480 owns Stage/Prop boundary behavior and asset provenance; STL-492 should only keep rejection semantics compatible.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Lock whether STL-492 is docs-only or docs plus focused validator tests/constants before implementation. - evidence: Linear says "문서/매트릭스" but also allows malformed persisted shot fixture or validator attribution tests if needed; `StageRenderable.options` currently has no bounds in code. - AC-trace: STL-492 scope and termination criteria.
- P1: Decide the persisted-data compatibility stance for old shots whose existing Stage tags/options exceed the new bounds. - evidence: `docs/specs/bundle-format.md` §18.3 makes validation the sole loadability gate, and `ShotModel.stages` is already persisted on main. - AC-trace: bundle-format compatibility decision and migration/no-migration rationale.
- P1: Define the exact Stage tag normalization rule. - evidence: Stage background-prop placement tags already have safe tag limits in `docs/ipc/bridge-contract.md` §13A.4, but authored Stage tags have no matching rule. - AC-trace: Stage tags max 32, display-name validation, normalization.
- P1: Confirm `INVALID_STAGE_PAYLOAD` remains the caller-facing bridge rejection for invalid tags and oversized/deep options, rather than splitting new rejection codes. - evidence: `docs/ipc/bridge-contract.md` §13A.2 currently maps those failures to `INVALID_STAGE_PAYLOAD`; `error-handling.md` says new bridge codes need Rust enum, contract tests, TS mirror, and frontend handling. - AC-trace: bridge contract rejection matrix cross-check.
- P2: Decide whether bounds are documented in `docs/specs/stage-entity-model.md`, `docs/specs/bundle-format.md`, `docs/ipc/bridge-contract.md`, or all three at different altitudes. - evidence: AFDS says bundle format owns persisted shape, IPC owns protocol/rejection semantics, Stage spec owns domain behavior. - AC-trace: durable docs must agree.
- P2: If tests are added, choose the smallest oracle: malformed persisted shot fixture, direct `ShotModel` validation test, or bridge handler rejection test deferred to STL-479. - evidence: existing `validate_stage_refs` tests live in `crates/shotloom-core/src/model/shot.rs`; fixture load-gate tests live under `crates/shotloom-core/tests/fixtures/`. - AC-trace: validator error attribution test option.
- P2: Keep STL-492 decoupled from STL-479 implementation details while still allowing STL-479 to consume the matrix. - evidence: Linear says this can run before or after STL-479 but must rebase if constants/rejection codes change. - AC-trace: parallelization section.
- P3: Update PR body with compatibility rationale even if durable docs carry the full matrix. - evidence: Linear termination criteria allows PR body or durable docs, but Shotloom PR guideline requires Impact/API-schema notes for validation semantics. - AC-trace: persisted-data compatibility decision.

**Sibling specs (agent-hub/docs/plans/):**
- `proposed/bridge-wire-contract.md` - HEAD - stance: STL-478 fixed Stage wire DTO/command/event/rejection shapes and explicitly deferred concrete renderable option bounds to handler follow-up work - agrees; STL-492 fills that deferred matrix without changing wire vocabulary.
- `proposed/bridge-add-stage-authoring-contract.md` - HEAD - stance: original broad STL-451 plan included wire contract, handlers, promotion/demotion, atomicity, and docs - agrees on Stage command vocabulary and rejection buckets, but is intentionally broader than STL-492.
- `proposed/bridge-split-stage-handlers.md` - HEAD - stance: STL-477 is handler file layout only after authored handlers exist - agrees by staying out of docs/bounds/compatibility decisions.
- `proposed/core-add-shot-local-stage-model.md` - HEAD - stance: STL-449 added persisted StageModel and explicit stage reference validation with legacy compatibility via serde defaults - agrees; STL-492 must not redesign persistence.
- `proposed/core-stage-renderable-provenance.md` - HEAD - stance: STL-450 added renderable provenance, `representation_hint`, `stage_renderable` asset kind, and asset-reference validation - agrees; STL-492 should reuse those model/validation boundaries and not make stage-map schema authoritative.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; stale inactive `deemotl` token still makes `gh auth status` exit nonzero, but active account is correct.
- [x] commit identity: set in worktree to tomlim2 <deemo@vonvon.me>.
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index.
- [x] category: docs.
- [x] targeted sections loaded.
- [x] AC primitive cross-check recorded.
- [x] spec-risk handoff seeded.
- [x] sibling-spec scan run (Knitten docs/plans; full body read for directly relevant matches).
- [x] worktree created: `shotloom-github/.worktrees/stage-validation-matrix`.
- [x] Linear state moved to In Progress.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
