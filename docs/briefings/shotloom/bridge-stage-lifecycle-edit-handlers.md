---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-479
repo: shotloom
linear: STL-479
spec: ../../plans/proposed/bridge-stage-lifecycle-edit-handlers.md
---

### Shotloom coding mode - bridge

**Issue:** STL-479 "Stage authoring lifecycle/edit handler 분리"
  Problem: Stage CRUD, active-stage selection, Stage updates, element edits, and renderable replacement must land as a reviewable handler slice instead of staying mixed with promote/demote provenance behavior from the closed PR #360 mega-change.
  Acceptance:
  - `create_stage`, `duplicate_stage`, `delete_stage`, and `set_active_stage` mutate the shot-local Stage model.
  - `update_stage`, `update_stage_element`, and `replace_stage_renderable` mutate only authored Stage data.
  - locked target, missing id, invalid display name, non-finite transform, invalid tags, and invalid renderable options reject deterministically.
  - rejection paths prove no partial mutation, including bundle-validation rollback.
  - success echoes precede the correlated `bundle_changed` event.
  - command/event wire shape stays identical to the STL-478 contract.
  Affected: `crates/shotloom-engine/src/bridge/handlers/stage.rs` or `crates/shotloom-engine/src/bridge/handlers/stage/{mod,lifecycle,edit}.rs`, `crates/shotloom-engine/src/bridge/mod.rs`, `crates/shotloom-engine/src/bridge/tests/stage.rs`, and existing Stage model validation helpers as needed.
  Linked: parent STL-451, sibling STL-478 / PR #370, reference PR #360, sibling STL-477/STL-480/STL-481, ADR-0003, ADR-0026, ADR-0027, ADR-0050, ADR-0051.

**Branch:** `feat/bridge-split-stage-authoring-handlers`  (base: `origin/main` e35264dd)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0003 wasm-bindgen command/event bridge, ADR-0026 bridge ordering contract, ADR-0027 engine bridge schedule, ADR-0050 Stage entity model, ADR-0051 contract authority tiers.
**Ask-first triggers for this task:** starting implementation before STL-478 / PR #370 lands or without explicitly stacking on `feat/bridge-wire-contract`; changing any bridge command/event/DTO/rejection code shape; adding promote/demote asset provenance behavior; changing Stage persistence schema; adding editor UI; Bevy ECS runtime hydration; new dependencies; broad test rewrites that weaken PR #360 handler coverage.
**Intent lens:** Extract the model-only Stage lifecycle/edit behavior from the closed PR #360 reference branch into a small handler PR, while leaving Stage/Prop promote/demote asset provenance to STL-480 and handler directory layout to STL-477. The failure mode to prevent is recreating PR #360 as another oversized mixed contract/handler/provenance change.

**AC primitive cross-check:**
- Stage lifecycle/edit command wire shape: sibling-owned - `origin/main` has no authored Stage command family; STL-478 / PR #370 owns Rust/TS command, event, DTO, fixture, and IPC contract shape. Evidence: `rg` on `origin/main` finds only legacy `SetStageMood`, `SpawnBackgroundProps`, and `ClearBackgroundProps`; PR #370 is open on `feat/bridge-wire-contract`.
- Existing handler reference: verification-example - closed PR #360 / branch `feat/bridge-add-stage-authoring-contract` already contains `handle_create_stage`, `handle_duplicate_stage`, `handle_delete_stage`, `handle_set_active_stage`, `handle_update_stage`, `handle_update_stage_element`, and `handle_replace_stage_renderable`. Treat it as behavior evidence, not a merge target.
- Handler module split: sibling-owned - STL-477 owns the `handlers/stage/` directory/facade split. STL-479 may use that structure only if it is already present or if the implementation stacks naturally; otherwise it should keep file churn focused on lifecycle/edit behavior.
- Promote/demote and derived asset provenance: sibling-owned - STL-480 owns `promote_stage_content_to_prop`, `demote_prop_to_stage_content`, derived `AssetCatalog` entries, and Stage/Prop asset provenance rules. STL-479 should not implement or modify those paths.
- Rejection vocabulary: codified by sibling contract - STL-478 locks Stage-specific rejection codes and TS mirrors. STL-479 should consume `StageNotFound`, `StageElementNotFound`, `StageRenderableNotFound`, `DuplicateStageId`, `StageTargetNotEditable`, `InvalidStagePayload`, and broad existing codes without renaming them.
- Display-name rejection: codified - existing `shotloom_core::model::validate_display_name` and the display-name handler mapping own `INVALID_DISPLAY_NAME` / `DUPLICATE_DISPLAY_NAME` behavior. STL-479 should reuse the local mapping rather than parsing messages.
- No partial mutation / rollback: codified - error-handling and bridge event rules require command-domain refusal through `CommandRejectedPayload`; PR #360 reference uses clone-before-edit plus `bundle.validate()` rollback. STL-479 must prove final model state, not only emitted rejection.
- Success echo then `bundle_changed`: codified - bridge contract command/event model and existing engine handler tests assert correlated mutation-specific event ordering before broad bundle refresh.
- Invalid tags/options: reference-owned until merged - `origin/main` lacks `validate_stage_tags` and `validate_stage_renderable_options`; PR #360 reference contains those helpers and tests. The spec must decide whether STL-479 depends on STL-478 carrying those helpers or must add only the validation primitives needed by lifecycle/edit.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements - lock implementation base before writing code. Evidence: `origin/main` lacks authored Stage commands/events and tag/options validators; PR #370 contains wire contract and placeholder dispatch; PR #360 reference contains the full handler behavior. AC-trace: STL-479 end criteria says command/event wire shape must match the contract PR.
- P1: Locked Decisions - define STL-479 as lifecycle/edit-only: create, duplicate, delete, set-active, update-stage, update-element, and replace-renderable. Evidence: Linear excludes promote/demote, derived asset registration/reuse, and handler module split. AC-trace: STL-479 scope and excluded scope.
- P1: Implementation Spec - preserve event ordering exactly: Stage success event first, then correlated `bundle_changed`; rejection emits no success event and no partial model mutation. Evidence: bridge contract §17.1 / `bundle_changed` behavior and PR #360 tests. AC-trace: success echo -> bundle_changed ordering.
- P1: Implementation Spec - define rollback helper ownership before coding. Evidence: PR #360 reference uses shared `commit_stage_edit`, `finish_stage_edit`, and `StageEditOutcome`; STL-477 may later move these into a facade. AC-trace: rollback-on-rejection / bundle validation rollback.
- P1: Verification - include failure tests for shared paths, not just per-command happy paths: missing `shot_id`, invalid stage id, missing stage/element/renderable, locked element edit, invalid display name, non-finite transform, invalid tags, invalid renderable options, and bundle-validation rollback. Evidence: PR #360 review repeatedly requested rejection coverage. AC-trace: STL-479 rejection scope and no-partial-mutation criteria.
- P2: Non-Goals - explicitly reject any Stage/Prop asset derivation, hidden-promotion behavior, shared-renderable promotion, demotion selection cleanup, or provenance-chain reuse in this spec. Evidence: PR #360 review split recommendation and STL-480 sibling scope. AC-trace: STL-479 excluded scope.
- P2: Traps - do not treat the PR #360 branch as the final diff. Use it to cherry-pick or replay only lifecycle/edit logic against the live STL-478 contract. Evidence: PR #360 close note says it remains source/reference but should not be reviewed or merged as-is. AC-trace: split-from-#360 context.
- P2: Verification - run focused handler tests before full gates: `cargo test -p shotloom-engine bridge::tests::stage --lib`, `cargo test -p shotloom-core --test generate_bridge_fixtures`, then full Rust gates with `--exclude shotloom-desktop`. Evidence: Shotloom rules and PR #360/370 test details. AC-trace: fixture/contract parity and handler behavior.
- P3: Naming - branch/worktree names should avoid Linear IDs; if a new branch is needed after PR #370 merges, prefer `feat/bridge-stage-lifecycle-edit-handlers` or a similarly concise Conventional Branch name. Evidence: CONTRIBUTING branch policy and `~/.claude/rules/shotloom.md` worktree naming.

**Sibling specs (agent-hub/docs/plans/):**
- `proposed/bridge-wire-contract.md` - HEAD - stance: STL-478 adds Stage command/event/DTO/rejection wire shape and temporary placeholder rejection only; agrees and is a direct prerequisite for STL-479.
- `briefings/shotloom/bridge-wire-contract.md` - HEAD - stance: engine handler implementation is sibling-owned by STL-479/STL-480/STL-481; agrees with this lifecycle/edit slice.
- `proposed/bridge-add-stage-authoring-contract.md` - HEAD - stance: original all-in-one STL-451 plan covering wire, lifecycle/edit, promote/demote provenance, docs, and tests; agrees on behavior vocabulary but is too broad and must be split.
- `proposed/bridge-split-stage-handlers.md` - HEAD - stance: STL-477 is layout-only over an existing authored Stage handler surface; agrees that handler module split must not change STL-479 behavior.
- `briefings/shotloom/bridge-split-stage-handlers.md` - HEAD - stance: current `origin/main` has no authored Stage handler to split; agrees that implementation must either stack on the reference/contract surface or wait for equivalent code to land.
- `feat/bridge-add-stage-authoring-contract` branch / closed PR #360 - reference implementation evidence - stance: contains lifecycle/edit handlers plus promote/demote and provenance behavior; agrees on lifecycle/edit behavior but includes sibling STL-480/STL-481 scope.
- `feat/bridge-wire-contract` branch / PR #370 - live prerequisite - stance: contains the wire-only contract and placeholder runtime rejection; agrees and should be the base or merge prerequisite for STL-479 implementation.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity for STL-479 worktree configured: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans and direct PR #360/#370 evidence)
- [x] worktree created: `shotloom/.worktrees/bridge-split-stage-authoring-handlers`
- [x] Linear state moved to In Progress

Ready with one base warning: implementation should wait for STL-478 / PR #370 to merge, or the next spec must explicitly choose a stacked branch on `feat/bridge-wire-contract`. If this briefing is OK, next step is `/shotloom-draft-spec`.
