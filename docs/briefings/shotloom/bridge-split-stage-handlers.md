---
status: ready
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-477
repo: shotloom
linear: STL-477
spec: ../../plans/proposed/bridge-split-stage-handlers.md
---

### Shotloom coding mode — bridge

**Issue:** STL-477 "Stage bridge handler 모듈 분리"
  Problem: The Stage bridge handler became review-noisy because authored Stage commands, legacy stage mood/clear color, bundle reset, and Stage edit transaction helpers were held in one `handlers/stage.rs` file during the STL-451 split work.
  Acceptance:
  - Split authored Stage command handlers by responsibility.
  - Proposed structure: `handlers/stage/mod.rs` owns dispatch/shared `commit_stage_*` helpers/`StageEditOutcome`; `lifecycle.rs` owns create/duplicate/delete/set_active; `edit.rs` owns update/update_element/replace_renderable; `boundary.rs` owns promote/demote/derived asset helpers.
  - Existing bridge command/event wire shape remains unchanged.
  - Existing tests remain passing or are updated for file moves.
  - `handlers/stage.rs` no longer mixes clear-color/stage-mood/new-bundle wrappers with authored Stage implementation.
  - `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`, and `cargo test --workspace --exclude shotloom-desktop` pass.
  Affected: `crates/shotloom-engine/src/bridge/handlers/stage.rs`, future `crates/shotloom-engine/src/bridge/handlers/stage/*.rs`, `crates/shotloom-engine/src/bridge/mod.rs`, `crates/shotloom-engine/src/bridge/tests/stage.rs` when based on the STL-451 branch.
  Linked: parent STL-451; PR #360 `feat(bridge): add stage authoring contract`; ADR-0026, ADR-0027, ADR-0050.

**Branch:** chore/bridge-split-stage-handlers  (base: origin/main 249b9b6a)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0026 bridge ordering contract, ADR-0027 engine bridge schedule, ADR-0050 Stage entity model, ADR-0003 wasm-bindgen bridge, ADR-0042 canonical timeline DTO ownership when avoiding bridge DTO drift.
**Ask-first triggers for this task:** changing the implementation base from `origin/main` to the sibling `feat/bridge-add-stage-authoring-contract` branch; any bridge command/event/DTO/schema change; any Stage authoring behavior change beyond module extraction; Bevy ECS schedule/plugin-registration changes; new dependencies; broad test rewrites instead of path/module updates.
**Intent lens:** Reduce review noise and isolate Stage authoring responsibilities without changing bridge behavior. The failure mode to prevent is a mega-handler where Stage lifecycle/edit/boundary logic, legacy mood/clear-color wrappers, bundle reset, and transaction helpers cannot be reviewed independently.

**AC primitive cross-check:**
- AC1 split authored Stage command handlers by responsibility: sibling-owned - authored Stage command handlers do not exist on `origin/main`; `crates/shotloom-engine/src/bridge/handlers/stage.rs` on `origin/main` only contains clear color, stage mood, and `new_bundle`. The large authored handler exists on sibling branch `feat/bridge-add-stage-authoring-contract` / closed PR #360, which lists STL-477 as follow-up.
- AC2 proposed `handlers/stage/mod.rs`, `lifecycle.rs`, `edit.rs`, `boundary.rs` structure: verification/example plus required primitive - the structure is not codified in a repo standard. It is a Linear-proposed target layout for the sibling-authored handler, so the spec should lock ownership boundaries before moving code.
- AC3 existing bridge command/event wire shape unchanged: codified - `docs/ipc/bridge-contract.md` owns command/event shapes; `crates/shotloom-core/src/bridge/mod.rs`, generated fixtures, and `apps/editor/src/bridge/types.ts` mirror the wire surface. STL-477 should not touch those unless the split reveals an unavoidable bug, which is ask-first.
- AC4 existing tests remain passing or move with files: codified - `CONTRIBUTING.md` requires Rust lint/test gates and PR co-location; review standards require behavior-preserving tests for changed code. The sibling branch has `crates/shotloom-engine/src/bridge/tests/stage.rs`; `origin/main` does not.
- AC5 `handlers/stage.rs` no longer mixes legacy wrappers and authored implementation: sibling-owned - the mixed mega-file is present on `feat/bridge-add-stage-authoring-contract`, not on `origin/main`. On `origin/main`, the existing file already contains only legacy wrappers/reset behavior.
- AC6 full Rust gates pass: verification-example - gates are required verification, not an implementation primitive. Use focused stage/bridge tests first, then full workspace gates.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements - decide the implementation base before writing code. Evidence: `origin/main` lacks `CreateStage`, `DuplicateStage`, `UpdateStageElement`, `ReplaceStageRenderable`, promote/demote handlers; `feat/bridge-add-stage-authoring-contract` contains them in one large `handlers/stage.rs`; PR #360 is closed with CHANGES_REQUESTED and names STL-477 as follow-up. AC-trace: AC1, AC5.
- P1: Locked Decisions - define the exact module ownership boundary so the split does not become a behavior rewrite. Evidence: Linear proposed `mod.rs` / `lifecycle.rs` / `edit.rs` / `boundary.rs`; sibling branch has shared helpers such as `commit_stage_edit`, `finish_stage_edit`, and `StageEditOutcome` in the same file as command handlers. AC-trace: AC1, AC2.
- P1: Implementation Spec - preserve bridge dispatch and event ordering exactly. Evidence: ADR-0026 requires FIFO command processing and correlated event clusters; ADR-0027 defines bridge drain/apply/finalize/sync/consume ordering; `crates/shotloom-engine/src/bridge/mod.rs` routes commands directly into handler functions. AC-trace: AC3.
- P1: Implementation Spec - prevent partial module extraction from changing Stage/Prop atomicity helpers. Evidence: the STL-451 spec treats promotion/demotion as all-or-nothing coupled mutations across Stage and `PropModel`; helper placement affects rollback and dirty-state marking. Spec question: which shared helpers stay in `mod.rs`, and which helpers become private to `boundary.rs`? AC-trace: AC1, AC2, parent STL-451.
- P2: Verification - run focused tests on the sibling handler surface before full gates: `cargo test -p shotloom-engine bridge::tests::stage --lib`, `cargo test -p shotloom-core --test generate_bridge_fixtures`, then full Rust gates. Evidence: PR #360 test details and Linear end criteria. AC-trace: AC4, AC6.
- P2: Non-Goals - explicitly exclude Stage runtime hydration, command payload/schema changes, new Stage authoring features, editor UI, and legacy background-prop migration. Evidence: Linear excluded scope and STL-451 spec Non-Goals. AC-trace: issue non-scope.
- P2: Traps - keep legacy `handle_set_stage_mood`, `handle_set_clear_color`, and `handle_new_bundle_command` discoverable after the directory split, either in `stage/mod.rs` or a separate legacy/reset module, because `crates/shotloom-engine/src/bridge/mod.rs` currently calls them through `stage::...`. Evidence: `origin/main` stage handler and sibling branch dispatch. AC-trace: AC5.
- P3: Naming - use module names that reflect responsibilities (`lifecycle`, `edit`, `boundary`) and avoid inventing public APIs for private handler internals. Evidence: existing `characters/` handler directory pattern keeps focused private submodules behind `handlers/characters/mod.rs`. AC-trace: AC2.

**Sibling specs (agent-hub/docs/plans/):**
- `proposed/bridge-add-stage-authoring-contract.md` - HEAD - stance: STL-451 adds Stage authoring bridge commands/events/DTOs and focused engine handlers; agrees, but STL-477 depends on that authored handler surface existing before the split can be implemented.
- `briefings/shotloom/bridge-add-stage-authoring-contract.md` - HEAD - stance: Stage authoring contract is bridge category with Stage/Prop boundary and command/event parity; agrees and provides the parent scope.
- `completed/bridge-add-background-prop-batch-spawn.md` - HEAD - stance: legacy background prop batch spawn is a compatibility/debug `PropModel` path; agrees because STL-477 must not fold legacy background props into Stage authoring.
- `proposed/core-add-shot-local-stage-model.md` - HEAD - stance: core Stage persistence intentionally excluded bridge commands/runtime/editor behavior; agrees as the lower-level primitive already landed on base.
- `feat/bridge-add-stage-authoring-contract` branch / PR #360 - sibling implementation evidence - stance: contains the mega-handler that STL-477 is meant to split; disagreement with `origin/main` base only because the target surface is not merged.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <tomandlim@gmail.com>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (agent-hub/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
