---
status: proposed
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-477
repo: shotloom
linear: STL-477
briefing: ../../briefings/shotloom/bridge-split-stage-handlers.md
---

# Split Stage Bridge Handlers

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/bridge-split-stage-handlers.md`
  defines STL-477 as a bridge-handler refactor spawned from the large STL-451
  authored Stage branch.
- Current truth: current `origin/main` only has legacy Stage mood, clear-color,
  and `new_bundle` logic in `crates/shotloom-engine/src/bridge/handlers/stage.rs`;
  the authored Stage mega-handler exists on the closed PR #360 reference branch
  `feat/bridge-add-stage-authoring-contract`.
- Required change: split the reference branch's authored Stage handler into
  responsibility-focused modules without changing command/event wire shape,
  Stage/Prop behavior, event order, dirty marking, or rollback semantics.
- Locked boundary: this is a stacked/refactor spec over the authored Stage
  handler surface; it must not recreate the whole STL-451 contract as a new
  monolithic PR against `main`, add Stage features, change bridge schemas, or
  alter runtime hydration.
- Proof method: compare exported handler function names and dispatch wiring,
  run focused Stage bridge tests from the reference branch, then run the
  required Rust workspace gates.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Current main Stage handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Already Done / Legacy only | On `origin/main`, this file contains `handle_set_clear_color`, `handle_set_stage_mood`, and `handle_new_bundle_command`; no authored Stage commands exist. |
| Reference authored handler | `feat/bridge-add-stage-authoring-contract:crates/shotloom-engine/src/bridge/handlers/stage.rs` | Partial / Refactor target | PR #360 reference branch has a 1346-line handler containing lifecycle, edit, boundary, derived asset, rollback, finish, selection-cleanup, and legacy wrapper logic. |
| Bridge dispatch | `crates/shotloom-engine/src/bridge/mod.rs` and reference branch equivalent | Partial | `origin/main` routes only legacy Stage commands; the reference branch routes create/duplicate/delete/set-active/update/update-element/replace-renderable/promote/demote into `stage::...` handler functions. |
| Handler module precedent | `crates/shotloom-engine/src/bridge/handlers/characters/mod.rs` | Already Done | Uses a facade module with private child modules and stable dispatcher-facing functions; this is the closest local pattern for a Stage handler directory. |
| Legacy background prop path | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | Owns `spawn_background_props` and `clear_background_props`; these remain compatibility/debug `PropModel` paths and are not moved into Stage authoring. |
| Authored Stage tests | `feat/bridge-add-stage-authoring-contract:crates/shotloom-engine/src/bridge/tests/stage.rs` | Partial / Verification source | The reference branch has focused tests for Stage lifecycle, edit, boundary, rollback, derived assets, event order, selection cleanup, and validation failures. |
| Bridge contract | `docs/ipc/bridge-contract.md` | Already Done for behavior; out of scope for split | Wire command/event behavior belongs here. STL-477 should not change it except to update file-path navigation if the handler path is documented. |
| Parent spec | `docs/plans/proposed/bridge-add-stage-authoring-contract.md` in Knitten | Already Done / Parent scope | Locks Stage authoring command/event behavior and Stage/Prop atomicity. STL-477 inherits behavior and only changes implementation layout. |
| PR context | PR #360 | Already Done / Reference | Closed intentionally after review because the branch was too large; comment says follow-up PRs will carry smaller slices and STL-477 tracks the handler module split. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-477` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Split the authored Stage bridge handler into small responsibility-owned modules while preserving existing command routing and behavior. |
| Acceptance criteria | Stage handler modules are split by lifecycle/edit/boundary responsibility; wire shape unchanged; tests updated or preserved; legacy wrappers no longer live in the same file as authored implementation; Rust fmt/clippy/test gates pass. |
| Latest relevant comment | 2026-05-19 PR #360 close note: STL-477 is one of the smaller split issues; PR #360 remains the source/reference branch. |
| Blockers / dependencies | Parent STL-451; reference branch `feat/bridge-add-stage-authoring-contract`; companion split issues STL-478 through STL-481. |
| Related PRs | PR #360, closed with CHANGES_REQUESTED and intentionally retained as reference. |
| Current review state | PR #360 closed after repeated review requested split; this spec is for one smaller refactor slice. |
| Planning consequence | Implementation should be stacked on, or replay from, the authored Stage handler reference surface. Against current `origin/main` alone there is no mega-handler to split. |

## Problem

The authored Stage bridge implementation in PR #360 proved the command/event
contract but concentrated too much code in one handler file. Review repeatedly
called out the file growth and recommended splitting lifecycle/edit/boundary
responsibilities before continuing. A direct implementation against current
`origin/main` would either do nothing useful, because the mega-handler is not
there, or accidentally reintroduce the entire STL-451 feature set in one PR.

STL-477 therefore needs a precise refactor contract: use the PR #360 branch as
reference, split only the authored Stage handler surface, preserve behavior and
wire shape, and leave companion feature slices to their own issues.

## Requirements

1. Implement STL-477 only where the authored Stage handler surface exists:
   either on the reference branch `feat/bridge-add-stage-authoring-contract`, on
   a stacked branch derived from it, or after equivalent Stage authoring handler
   code lands via companion split PRs.
   - Trace: briefing P1, PR #360 close note, user instruction to use the prior
     large LOC reference.
   - Stage: S0, S1.
   - Verification: V0.
2. Convert `crates/shotloom-engine/src/bridge/handlers/stage.rs` into a
   directory-backed facade module, keeping dispatcher-facing function names
   stable unless a compiler error proves a narrower visibility change is needed.
   - Trace: Linear scope; local `characters/mod.rs` precedent.
   - Stage: S2.
   - Verification: V1, V2.
3. Put lifecycle handlers in `handlers/stage/lifecycle.rs`: create, duplicate,
   delete, and set-active behavior.
   - Trace: Linear proposed structure; parent STL-451 command set.
   - Stage: S3.
   - Verification: V2, V3.
4. Put edit handlers in `handlers/stage/edit.rs`: update stage,
   update element, replace renderable, transform/tag/renderable-option
   validation local to those handlers.
   - Trace: Linear proposed structure; PR #360 handler function inventory.
   - Stage: S3.
   - Verification: V2, V3.
5. Put Stage/Prop boundary handlers and derived-asset helpers in
   `handlers/stage/boundary.rs`: promote, demote, asset-kind conversion,
   `derived_from_asset_id` traversal/reuse, demoted-prop selection cleanup
   hooks that are boundary-specific.
   - Trace: Linear proposed structure; PR #360 review split recommendation.
   - Stage: S4.
   - Verification: V3, V4.
6. Keep shared edit transaction outcome and finish helpers in
   `handlers/stage/mod.rs` unless they become demonstrably private to one child
   module.
   - Trace: briefing P1 atomicity seed; Stage/Prop coupled mutation contract.
   - Stage: S2, S4.
   - Verification: V3, V4.
7. Preserve exact bridge command/event wire shape and rejection-code behavior.
   Do not edit `shotloom-core::bridge`, TypeScript bridge types, fixture JSON,
   or `docs/ipc/bridge-contract.md` for behavior in this refactor.
   - Trace: Linear scope says wire shape unchanged; bridge contract authority.
   - Stage: S0 through S5.
   - Verification: V1, V2, V3.
8. Preserve event ordering, dirty marking, model-sync requests, and rollback
   behavior for all authored Stage commands.
   - Trace: ADR-0026, ADR-0027, parent STL-451 atomicity and event-order tests.
   - Stage: S2 through S4.
   - Verification: V3, V4.
9. Preserve legacy Stage mood, clear-color, and `new_bundle` wrappers without
   mixing them into authored Stage child modules.
   - Trace: Linear AC says `handlers/stage.rs` should not mix these with
     authored Stage implementation; `origin/main` owns these wrappers.
   - Stage: S2.
   - Verification: V1, V5.
10. Update test module imports or private visibility only as needed for the file
    move. Do not weaken tests, delete rejection-path coverage, or collapse
    focused Stage tests into broad workspace-only gates.
    - Trace: Linear AC and PR #360 test inventory.
    - Stage: S5.
    - Verification: V2, V3, V4.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | STL-477 moves handler code and should not add parser/loader/validator error enums or wrap external errors. | Do not introduce new `thiserror` enums, `map_err`, or external-source conversions. Existing command rejections stay as-is. | N/A: refactor-only; focused tests assert same rejection codes/messages where already covered. |
| Schema / serialization compatibility | yes | `docs/ipc/bridge-contract.md`, `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts` own wire shape. | No bridge DTO, event, command, rejection-code, fixture, or TS type edits for behavior. Any unavoidable schema edit is out of scope and must stop. | `git diff -- crates/shotloom-core/src/bridge apps/editor/src/bridge docs/ipc` shows no behavioral wire edits; existing bridge fixture/type tests remain green when run in parent slice. |
| Ownership / API boundary | yes | `handlers/characters/mod.rs` facade pattern; ADR-0050 Stage/Prop boundary; PR #360 Stage handler function inventory. | Keep Stage handler internals in engine bridge handlers; do not move domain logic into core DTOs or editor types. Boundary asset helpers stay in Stage boundary module. | Compile proves dispatcher-facing functions remain reachable; focused Stage tests prove Stage/Prop behavior unchanged. |
| Partial mutation / rollback | yes | `commit_stage_edit`, `commit_stage_bundle_edit`, `finish_stage_edit`, and boundary derived-asset helpers mutate bundle, manifest, events, dirty state, and selection. | Keep transaction helpers centralized in `stage/mod.rs`; do not duplicate rollback logic across child modules. Boundary module calls shared helpers rather than hand-rolling commits. | Rollback tests from `bridge::tests::stage` still pass for update, replace-renderable, promote, and demote failure paths. |
| Diagnostic ownership | yes | `CommandRejectionCode` and `ctx.reject` calls are already owned by the parent Stage command implementation. | Move rejection branches without changing code variants or messages except import paths. | Existing Stage rejection tests continue to match expected `CommandRejectionCode`. |
| Local absolute path exposure | no | Spec and implementation touch repo source paths only. | Use repo-relative paths in docs and tests; do not commit machine-specific checkout paths. | Manual scan for home-directory, desktop/download, checkout-root, and drive-letter patterns returns no matches. |
| Test oracle strength | yes | PR #360 has targeted Stage tests for event order, rollback, boundary rejection, derived assets, and selection cleanup. | Run focused tests before broad gates; do not rely on compile-only proof. | `cargo test -p shotloom-engine bridge::tests::stage --lib` fails if split drops behavior, event order, or helper visibility. |
| Scope creep | yes | Companion split issues STL-478, STL-479, STL-480, and STL-481 own wire contract, lifecycle/edit handlers, boundary asset provenance, and boundary hardening. | STL-477 is layout-only. Feature or contract changes go to sibling issues or require user confirmation. | Diff review shows only handler module layout plus import/visibility updates unless explicitly scoped. |
| Reviewer objection | yes | PR #360 review called out `handlers/stage.rs` growth to more than 1300 LOC and asked for split. | Use the exact responsibility split requested by Linear and keep a small facade. | Final file list shows `handlers/stage/mod.rs`, `lifecycle.rs`, `edit.rs`, `boundary.rs`, and no large authored mega-file. |

## Locked Decisions

1. **Treat PR #360 as the source/reference surface, not as a merge target.**

   Rationale: current `origin/main` has no authored Stage handler to split, and
   PR #360 was intentionally closed as too large. The user explicitly allowed
   using the prior large LOC as reference material.

   Rejected alternatives: writing a no-op split against current `origin/main`;
   recreating the entire Stage authoring contract in STL-477; waiting forever
   for every sibling PR before writing a spec.

2. **Use a facade module at `handlers/stage/mod.rs`.**

   Rationale: `handlers/characters/mod.rs` is the closest local precedent:
   child modules own focused implementation while the dispatcher imports stable
   facade functions. This keeps `bridge/mod.rs` churn small.

   Rejected alternatives: many public sibling files imported directly by the
   bridge dispatcher; a single renamed mega-file; moving Stage handlers into
   `props.rs` or another domain module.

3. **Keep shared transaction helpers centralized.**

   Rationale: `commit_stage_edit`, `commit_stage_bundle_edit`,
   `finish_stage_edit`, and `StageEditOutcome` protect rollback, event order,
   dirty scope, asset registration, and model sync across multiple command
   families. Duplicating them in child modules would risk divergent atomicity.

   Rejected alternatives: copying commit helpers into lifecycle/edit/boundary;
   making every handler manually emit `BundleChanged`; moving helper logic into
   `shotloom-core`.

4. **Boundary asset conversion lives with Stage/Prop boundary commands.**

   Rationale: derived prop/stage-renderable assets and `derived_from_asset_id`
   traversal exist only because promote/demote cross the Stage-owned and
   shot-owned `PropModel` boundary.

   Rejected alternatives: putting derived asset helpers in lifecycle/edit;
   treating them as generic asset handlers; changing their behavior as part of
   the layout refactor.

5. **Legacy Stage wrappers stay separate from authored Stage modules.**

   Rationale: `set_stage_mood`, clear color, and `new_bundle` predate authored
   Stage commands and are compatibility/bootstrap operations. Linear explicitly
   wants them no longer mixed with authored Stage implementation.

   Rejected alternatives: leaving wrappers at the top of a giant authored file;
   moving legacy background-prop clear/spawn into Stage; deleting legacy paths.

6. **No bridge behavior changes in this PR.**

   Rationale: companion split issues and parent STL-451 own command/event
   semantics. STL-477 reduces review noise and should not reset the bridge
   contract review cycle.

   Rejected alternatives: fixing PR #360 review findings opportunistically;
   editing `docs/ipc/bridge-contract.md` for behavior; changing command
   payloads while moving files.

## Non-Goals

- Do not add, remove, or rename bridge commands, events, DTOs, rejection codes,
  fixtures, or TypeScript bridge types.
- Do not implement Stage runtime hydration or Bevy ECS materialization for
  authored Stage renderables.
- Do not add editor UI, outliner, inspector, edit mode, routes, CSS, or user
  copy.
- Do not remove or migrate legacy `spawn_background_props`,
  `clear_background_props`, `set_stage_mood`, clear-color, or `new_bundle`
  behavior.
- Do not change Stage/Prop promotion, demotion, derived-asset semantics,
  dirty marking, selection cleanup, or event order.
- Do not add dependencies, ADRs, CI changes, hooks, or workspace command
  changes.
- Do not broaden this PR to the full STL-451 wire contract or companion split
  issues.

## Implementation Spec

### S0 - Baseline and Reference Check

Requirements: R1, R7. Risk rows: Schema / serialization compatibility, Scope
creep.

- Confirm the implementation branch has authored Stage handlers before editing:
  ```bash
  rg -n "handle_create_stage|StageEditOutcome|commit_stage_edit|handle_promote_stage_content_to_prop" crates/shotloom-engine/src/bridge
  ```
- If the current branch is still based only on `origin/main`, import or stack
  onto the authored Stage handler source before implementation. Do not create a
  PR that bundles all Stage authoring contract work under STL-477.
- Capture the pre-split dispatcher-facing function list from the reference
  handler and preserve it after the split.

### S1 - Create the Stage Facade Directory

Requirements: R2, R6, R9. Risk rows: Ownership / API boundary, Partial mutation
/ rollback.

- Replace `crates/shotloom-engine/src/bridge/handlers/stage.rs` with
  `crates/shotloom-engine/src/bridge/handlers/stage/mod.rs`.
- Add private child modules:
  - `lifecycle.rs`
  - `edit.rs`
  - `boundary.rs`
- Keep facade exports callable as `stage::handle_*` from
  `crates/shotloom-engine/src/bridge/mod.rs`.
- Keep shared imports, `StageEditOutcome`, `StageEditResult`,
  `commit_stage_edit`, `commit_stage_bundle_edit`, `finish_stage_edit`,
  `finish_successful_stage_edit`, and common helpers in `mod.rs` unless a
  child module is the only user.

### S2 - Separate Legacy and Shared Wrapper Behavior

Requirements: R2, R6, R9. Risk rows: Schema / serialization compatibility,
Scope creep.

- Keep `handle_set_clear_color`, `handle_set_stage_mood`, and
  `handle_new_bundle_command` reachable through the `stage` facade.
- Keep `new_bundle` seed behavior exactly as it is: preview shot id,
  multicam track, empty Stage list, `active_stage_id: None`, `BundleChanged`,
  dirty flags, and broad model sync.
- Do not move `spawn_background_props` or `clear_background_props`; they remain
  in `props.rs`.

### S3 - Move Lifecycle and Edit Handlers

Requirements: R3, R4, R8, R10. Risk rows: Test oracle strength, Diagnostic
ownership.

- Move create/duplicate/delete/set-active Stage handlers into
  `lifecycle.rs`.
- Move update-stage, update-element, and replace-renderable handlers into
  `edit.rs`.
- Keep validation helpers local only when the helper is not shared outside the
  child module.
- Preserve every rejection branch, message, and event ordering from the source
  handler.

### S4 - Move Boundary Handlers and Derived Asset Helpers

Requirements: R5, R6, R8, R10. Risk rows: Partial mutation / rollback, Reviewer
objection.

- Move promote/demote handlers to `boundary.rs`.
- Move derived asset helpers with boundary behavior:
  - `promotable_prop_asset_id`
  - `demotable_stage_renderable_asset_id`
  - `original_or_derived_asset`
  - `original_derived_source_id`
  - `ensure_derived_asset`
- Keep boundary handlers calling shared commit/finish helpers from `mod.rs`.
- Preserve selection cleanup ordering for demotion:
  Stage success event, optional `SelectionChanged`, then `BundleChanged`.
- Preserve `AssetRegistered` emission before the Stage success event when a
  derived asset is newly registered.

### S5 - Update Tests and Compile Boundaries

Requirements: R7, R8, R10. Risk rows: Test oracle strength.

- Update imports, module visibility, and test paths only as needed for the file
  move.
- Do not delete focused Stage tests or replace them with broad workspace gates.
- If a focused test fails because a helper became private, prefer a public
  behavior test over exposing helper internals.

### S6 - Verification and Cleanup

Requirements: all. Risk rows: all applicable.

- Run focused checks first:
  ```bash
  cargo test -p shotloom-engine bridge::tests::stage --lib
  cargo test -p shotloom-core --test generate_bridge_fixtures
  ```
- Run required Rust gates:
  ```bash
  cargo fmt --check
  cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
  cargo test --workspace --exclude shotloom-desktop
  ```
- Use `git diff --stat` and `git diff --name-only` to verify the PR is a
  handler layout refactor, not a wire-contract or feature PR.

## Acceptance Criteria

- [ ] Authored Stage lifecycle handlers live in `handlers/stage/lifecycle.rs`.
- [ ] Authored Stage edit handlers live in `handlers/stage/edit.rs`.
- [ ] Stage/Prop boundary and derived asset helpers live in
      `handlers/stage/boundary.rs`.
- [ ] `handlers/stage/mod.rs` is a facade plus shared helpers; no large
      authored mega-file remains.
- [ ] `set_stage_mood`, clear-color, and `new_bundle` wrappers stay reachable
      without mixing into lifecycle/edit/boundary modules.
- [ ] `crates/shotloom-engine/src/bridge/mod.rs` command routing remains
      behaviorally unchanged.
- [ ] No bridge wire shape, DTO, TypeScript, fixture, or IPC behavior changes
      land under STL-477.
- [ ] Focused Stage bridge tests and required Rust gates pass.

## Verification

| ID | Proof | Command / review step |
|---|---|---|
| V0 | Baseline branch has authored Stage handlers before this refactor starts. | `rg -n "handle_create_stage|StageEditOutcome|commit_stage_edit|handle_promote_stage_content_to_prop" crates/shotloom-engine/src/bridge` |
| V1 | Dispatcher-facing Stage handler inventory stays stable after the split. | Compare pre/post `handle_*stage`, `StageEditOutcome`, and `commit_stage*` symbols under `crates/shotloom-engine/src/bridge/handlers/stage`. |
| V2 | Focused Stage bridge behavior still passes. | `cargo test -p shotloom-engine bridge::tests::stage --lib` |
| V3 | Event ordering, rollback, selection cleanup, and rejection behavior remain covered by behavior tests. | Inspect the focused Stage test names and assertions while running V2; do not replace them with compile-only proof. |
| V4 | Stage/Prop boundary and derived-asset behavior still passes. | Run V2 and specifically inspect promote/demote, derived asset reuse, asset registration order, and demotion selection cleanup coverage. |
| V5 | Legacy clear-color, mood, and `new_bundle` wrappers remain reachable through the Stage facade. | Run existing wrapper tests or add focused wrapper coverage if the move changes module boundaries. |
| V6 | Workspace gates pass after focused checks. | `cargo fmt --check`; `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`; `cargo test --workspace --exclude shotloom-desktop` |

Focused checks:

```bash
cargo test -p shotloom-engine bridge::tests::stage --lib
cargo test -p shotloom-core --test generate_bridge_fixtures
```

Broad gates:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo test --workspace --exclude shotloom-desktop
```

Manual / review proof:

- Compare function inventory before and after split:
  `rg -n "pub\\(in .*\\) fn handle_.*stage|StageEditOutcome|commit_stage" crates/shotloom-engine/src/bridge/handlers/stage`.
- Confirm event-order tests still prove Stage success event before
  `BundleChanged`.
- Confirm rollback tests still prove final model state, not only emitted
  rejection.
- Confirm demotion still emits selection cleanup before `BundleChanged`.
- Confirm `git diff -- crates/shotloom-core/src/bridge apps/editor/src/bridge docs/ipc`
  has no behavior wire changes for STL-477.
- Confirm no machine-specific absolute paths are introduced by scanning for
  local checkout roots, home-directory paths, desktop/download folders, and
  drive-letter paths in the spec and moved handler modules.

## Traps

- Do not implement STL-477 directly from current `origin/main` unless authored
  Stage handler code has already landed; there is no mega-handler to split on
  plain `main`.
- Do not copy shared rollback helpers into multiple child modules.
- Do not change event ordering while moving code; Stage success and
  `AssetRegistered` ordering were review-sensitive in PR #360.
- Do not move legacy background prop commands into Stage modules.
- Do not "fix" bridge schema or TypeScript fixture review comments inside this
  refactor unless the user explicitly changes scope.
- Do not expose helper internals to tests just to preserve old test imports;
  prefer behavior-level tests.

## Follow-Up Candidates

- STL-478: bridge wire contract slice.
- STL-479: Stage lifecycle/edit handler implementation slice.
- STL-480: Stage/Prop boundary asset provenance slice.
- STL-481: boundary review hardening slice.
- Editor Stage outliner/inspector/edit-mode UI.
- Bevy runtime hydration for authored Stage renderables.
