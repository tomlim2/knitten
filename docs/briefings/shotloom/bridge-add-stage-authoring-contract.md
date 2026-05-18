---
status: ready
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-451
repo: shotloom
linear: STL-451
spec: ../../plans/bridge-add-stage-authoring-contract.md
---

### Shotloom coding mode — bridge

**Issue:** STL-451 "feat(bridge): Stage authoring command/DTO 계약 추가"
  Problem: StageModel exists, but editor/runtime have no explicit bridge contract for authored Stage lifecycle, active-stage selection, mutation, renderable replacement, or promotion/demotion.
  Acceptance:
  - Rust bridge DTO and TypeScript bridge type share the same wire shape.
  - Each command documents success, rejection, unauthorized target, and missing stage id cases.
  - Stage-owned content and shot-owned `PropModel` boundaries do not mix in the command contract.
  - Promotion/demotion happen only through explicit commands, not automatic import side effects.
  - Bridge fixture generation and editor bridge type tests pass.
  Affected: `crates/shotloom-core/src/bridge/`, `crates/shotloom-core/tests/generate_bridge_fixtures.rs`, `apps/editor/src/bridge/types.ts`, `apps/editor/src/bridge/__tests__/`, `docs/ipc/bridge-contract.md`
  Linked: ADR-0003, ADR-0050, ADR-0051, ADR-0012; blocked-by STL-449 is Done on 2026-05-18 and present on current `origin/main`.

**Branch:** feat/bridge-add-stage-authoring-contract  (base: origin/main bcd185e2)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CLAUDE.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0003 wasm-bindgen command/event bridge, ADR-0051 contract authority tiers, ADR-0050 Stage entity model, ADR-0012 generated stage contract; Proposed ADRs noted: ADR-0026 bridge ordering contract, ADR-0027 engine bridge schedule, ADR-0050 listed as accepted in file but under Proposed index section drift should be ignored in favor of file status.
**Ask-first triggers for this task:** bridge protocol/contract changes; core domain-model or validation-rule changes beyond DTO-only use; TypeScript/Rust wire-shape breaking changes; new dependencies; Bevy ECS ordering/plugin-registration changes; WASM/native runtime split changes; PR creation.
**Intent lens:** Prevent Stage from remaining a persistence-only model. The editor must be able to treat Stage as an authored entity through explicit bridge commands while preserving the Stage-owned versus shot-owned prop boundary from ADR-0050.

**AC primitive cross-check:**
- AC1 Rust/TS same wire shape: codified - `docs/ipc/bridge-contract.md` §6 uses adjacently tagged command/event unions; `crates/shotloom-core/src/bridge/mod.rs` owns `BridgeCommand`; `apps/editor/src/bridge/types.ts` mirrors commands; `contracts/README.md` names bridge fixtures as repository-internal verification artifacts with Rust/TypeScript tests.
- AC2 success/rejection/unauthorized/missing-stage docs: codified pattern, missing Stage-specific entries - `docs/ipc/bridge-contract.md` §23.2 defines `command_rejected`; `CommandRejectionCode` currently has only Stage `UNKNOWN_MOOD`, so the spec must lock new Stage rejection codes or deliberate reuse before implementation.
- AC3 Stage-owned content versus `PropModel`: codified - ADR-0050 says Stage-owned environment content and shot-owned props stay separate; `docs/specs/stage-entity-model.md` concept boundary separates Stage, Stage element, Stage renderable, and Prop; `crates/shotloom-core/src/model/stage.rs` and `shot.rs` implement `stages` plus `active_stage_id` separately from `props`.
- AC4 explicit promotion/demotion only: codified - ADR-0050 says promotion from Stage-owned environment content to `PropModel` is an explicit authoring action; `docs/specs/stage-entity-model.md` Authoring Operations defines Promote set dressing and Demote prop as explicit operations.
- AC5 fixture generation and editor type tests: codified - `crates/shotloom-core/tests/generate_bridge_fixtures.rs` emits command/event fixture scenarios; `apps/editor/src/bridge/__tests__/contract.meta.test.ts` enforces command rejection/runtime error code coverage; `contracts/README.md` names the bridge fixture generator/consumer path.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements - lock the exact Stage command/event vocabulary, including whether commands are durable mutations, whether success echoes are new Stage events or existing `bundle_changed`, and whether active-stage changes emit a dedicated event. Evidence: `docs/ipc/bridge-contract.md` §6, §13A, §16B, §23.2; `crates/shotloom-core/src/bridge/mod.rs` `BridgeCommand` and `BridgeEvent`. AC-trace: AC1, AC2.
- P1: Locked Decisions - define Stage rejection codes before editing Rust/TS arrays: missing stage id, missing element/renderable id, unauthorized target, invalid payload, invalid display name/tags, non-finite transform, duplicate stage id, and boundary violations. Evidence: `CommandRejectionCode` currently lacks Stage-specific authoring codes beyond `UNKNOWN_MOOD`; TS `COMMAND_REJECTION_CODES` must stay mirrored. AC-trace: AC2.
- P1: Requirements - decide the promotion/demotion command atomicity contract: a successful promote removes stage-owned set dressing and creates a shot-owned `PropModel`; a successful demote removes or converts the eligible `PropModel` into Stage-owned set_dressing. Evidence: ADR-0050; `docs/specs/stage-entity-model.md` Authoring Operations; `ShotModel` stores `props`, `stages`, and `active_stage_id` as coupled collections. AC-trace: AC3, AC4.
- P1: Implementation Spec - require prevalidation before mutating coupled state for every command that touches more than one collection or representation. Evidence: `ShotModel::validate_stage_refs` validates active stage, element, and renderable references; promotion/demotion can mutate Stage plus `PropModel` plus emitted event order. Spec question: Can any later failure persist only one side of the artifact? If yes, does the spec pre-validate, rollback, or skip the whole operation? AC-trace: AC3, AC4.
- P2: Verification - fixture coverage should include at least one command-only fixture per new Stage command and at least one rejection fixture per new Stage rejection family, or explicitly document any allow-list in the TS meta-test. Evidence: `generate_bridge_fixtures.rs` Scenario shape and TS `contract.meta.test.ts`. AC-trace: AC1, AC5.
- P2: Non-Goals - confirm this issue does not implement editor UI buttons/panels, Bevy runtime hydration, or legacy `spawn_background_props` removal, and does not change Stage persistence shapes unless the command DTO cannot reference existing model primitives. Evidence: Linear non-scope and ADR-0050 bridge/runtime out-of-scope note. AC-trace: issue non-scope.
- P2: Implementation Spec - decide DTO reuse versus bridge-specific DTOs for `StageModel`, `StageElement`, and `StageRenderable`. Evidence: `docs/ipc/bridge-contract.md` §7A says nested `*Dto` types live in `shotloom-core`; `crates/shotloom-core/src/model/stage.rs` models are persistence types. AC-trace: AC1, AC3.
- P3: Traps - keep legacy background-map compatibility paths documented as compatibility/debug paths and avoid renaming `set_dressing` to "stage prop". Evidence: `docs/specs/stage-entity-model.md` Terminology and Migration From Background Props; `docs/ipc/bridge-contract.md` §14.2b/c. AC-trace: AC3.

**Sibling specs (agent-hub/docs/plans/):**
- `completed/bridge-add-background-prop-batch-spawn.md` - HEAD - stance: background prop batch spawn remains compatibility/debug prop path using `PropModel.tags`; agrees because STL-451 should create Stage-owned commands without reusing background props as Stage entities.
- `completed/bridge-clear-background-props.md` - HEAD - stance: clear command owns only `background_map` tagged `PropModel` cleanup; agrees because legacy clear remains out of Stage authoring scope.
- `completed/stage-add-map-document-parser.md` - HEAD - stance: parser/resolver stays in `shotloom-stage` and must not produce bridge DTOs or mutate `PropModel`; agrees with narrow bridge responsibility.
- `completed/stage-define-map-document-bundle-layout.md` - HEAD - stance: stage-map contract defines background ownership for downstream parser/spawn/clear; agrees but is legacy import POC, not the Stage authoring bridge surface.
- `completed/import-add-prop-gltf.md` and `import-add-prop-gltf-codex.md` - HEAD/open - stance: prop GLB import remains GLB-only asset registration plus prop spawn path; agrees by keeping asset import separate from Stage renderable replacement semantics.
- `drafts/stage-add-map-document-parser-conflict.md` - HEAD - stance: old blocked parser draft said wait for contract; superseded by completed parser/contract plans and current `origin/main`, no disagreement.
- Resolver gap: `ah-resolve-doc-path repo agent-hub` returned missing key, so the scan used the shared checkout at `/Users/younsoolim/Desktop/www/knitten`, which is where the active skill and shared policy were loaded.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (agent-hub/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
