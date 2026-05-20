---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-479
repo: shotloom
linear: STL-479
briefing: ../../briefings/shotloom/bridge-stage-lifecycle-edit-handlers.md
---

# Bridge Stage Lifecycle Edit Handlers

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/bridge-stage-lifecycle-edit-handlers.md` defines STL-479 as the model-only Stage lifecycle/edit handler slice after the Stage authoring mega-PR was split.
- Current truth: current `origin/main` has shot-local Stage persistence and legacy Stage mood/background-prop paths, but no authored Stage command family. The live wire contract is in PR #370 on `feat/bridge-wire-contract`; it adds Stage commands/events/DTOs and a temporary runtime rejection shim.
- Required change: replace the STL-478 placeholder rejection for lifecycle/edit commands with real model mutation handlers for create, duplicate, delete, set-active, update-stage, update-element, and replace-renderable.
- Locked boundary: do not implement promote/demote, derived asset registration/reuse, Stage/Prop provenance, handler directory refactor, editor UI, or runtime Stage hydration in this slice.
- Proof method: focused engine bridge tests for success, rejection, rollback, event order, and post-state; bridge fixture tests to prove the wire contract remains stable; full Rust gates before implementation is declared ready.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage persistence model | `crates/shotloom-core/src/model/stage.rs` | Already Done | Defines `StageModel`, `StageElement`, `StageRenderable`, roles, representation kinds, source refs, provenance, and diagnostics. |
| Shot-local Stage validation | `crates/shotloom-core/src/model/shot.rs::validate_stage_refs_inner` | Already Done | Rejects duplicate Stage ids, dangling active Stage id, duplicate element/renderable ids, missing renderable refs, invalid tags, invalid renderable options, and invalid renderable asset bindings when an asset catalog is present. |
| Current main bridge | `crates/shotloom-core/src/bridge/mod.rs` on `origin/main` | Missing | `origin/main` has legacy `SetStageMood`, `SpawnBackgroundProps`, and `ClearBackgroundProps`, but no authored Stage lifecycle/edit commands. |
| Wire contract branch | `feat/bridge-wire-contract` / PR #370 | Partial / prerequisite | Adds `CreateStage`, `DuplicateStage`, `DeleteStage`, `SetActiveStage`, `UpdateStage`, `UpdateStageElement`, `ReplaceStageRenderable`, Stage success events, Stage rejection codes, TS mirrors, fixtures, and placeholder runtime rejection. |
| Placeholder dispatch | `crates/shotloom-engine/src/bridge/mod.rs` on PR #370 | Partial | Routes all Stage authoring commands to `stage::handle_stage_authoring_not_implemented`. STL-479 replaces this for lifecycle/edit commands only. |
| Placeholder handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs::handle_stage_authoring_not_implemented` on PR #370 | Partial | Emits `CommandRejected(InvalidStagePayload)` with a temporary message; this is the exact behavior STL-479 removes for lifecycle/edit commands. |
| Reference implementation | `feat/bridge-add-stage-authoring-contract:crates/shotloom-engine/src/bridge/handlers/stage.rs` | Reference only | Contains lifecycle/edit handlers, promote/demote boundary handlers, shared rollback helpers, and tests from closed PR #360. Use it for behavior evidence, not wholesale merge. |
| Reference tests | `feat/bridge-add-stage-authoring-contract:crates/shotloom-engine/src/bridge/tests/stage.rs` | Reference only | Covers lifecycle/edit successes, rejection paths, rollback, event order, and extra boundary/provenance paths. STL-479 should mine only lifecycle/edit coverage. |
| Handler module split | `docs/plans/proposed/bridge-split-stage-handlers.md` | Sibling-owned | STL-477 owns `handlers/stage/{mod,lifecycle,edit,boundary}.rs` layout. STL-479 may use that layout only if the base already has it or if stacking makes it trivial. |
| Stage/Prop provenance | closed PR #360 and sibling STL-480 | Sibling-owned | Derived asset ids, promote/demote, provenance-chain reuse, hidden promotion, demotion selection cleanup, and boundary hardening are outside STL-479. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-479` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Add model-only handlers for authored Stage lifecycle/edit commands without pulling in promote/demote provenance behavior. |
| Acceptance criteria | lifecycle/edit commands mutate `StageModel`; invalid inputs reject deterministically; rejection paths prove no partial mutation; accepted commands emit success echo then `bundle_changed`; wire shape matches the contract PR. |
| Latest relevant comment | PR #360 close note on 2026-05-19 says the large Stage authoring branch is retained only as source/reference for smaller split PRs. |
| Blockers / dependencies | Direct prerequisite: STL-478 / PR #370 wire contract. Related siblings: STL-477 module split, STL-480 Stage/Prop provenance, STL-481 boundary hardening. |
| Related PRs | PR #360 closed as reference; PR #370 open for wire contract. |
| Current review state | STL-478 / PR #370 is still the live prerequisite; STL-479 should not be implemented on plain `origin/main` until the contract is available. |
| Planning consequence | The implementation branch must either start after PR #370 merges into `main`, or be explicitly stacked on `feat/bridge-wire-contract` and later rebased. |

## Problem

The wire-only Stage authoring contract can compile only because every authored Stage command currently rejects through a placeholder handler. That is correct for STL-478 but not enough for editor/runtime work: lifecycle/edit commands need to mutate shot-local `StageModel` data, echo the canonical post-mutation Stage payload, and refresh the bundle summary.

The prior PR #360 already proved one broad implementation, but it mixed lifecycle/edit handlers with promote/demote asset provenance, derived catalog entries, review hardening, and handler layout questions. STL-479 must extract only the model-only lifecycle/edit behavior and leave every Stage/Prop boundary concern to sibling issues.

## Requirements

1. Base the implementation on a branch where the STL-478 wire contract exists: merged `main` after PR #370, or an explicitly chosen stacked branch on `feat/bridge-wire-contract`.
2. Replace the placeholder runtime rejection for these commands only: `create_stage`, `duplicate_stage`, `delete_stage`, `set_active_stage`, `update_stage`, `update_stage_element`, and `replace_stage_renderable`.
3. Keep `promote_stage_content_to_prop` and `demote_prop_to_stage_content` on the placeholder path or otherwise unimplemented in this PR; do not add derived asset or provenance behavior.
4. For accepted lifecycle/edit commands, mutate only the loaded bundle model's shot-local Stage fields and emit the command-specific success event before the correlated `bundle_changed`.
5. Preserve the STL-478 wire shape exactly: no command/event/DTO/rejection-code renames, no TS type edits except test fallout from removing placeholder behavior, and no IPC contract rewrite beyond replacing temporary runtime wording if it becomes stale.
6. Validate identifiers, display names, finite transforms, Stage tags, renderable options, and target existence before accepting a command.
7. Reject locked Stage elements when an update attempts to edit unlocked fields; allow lock-state changes that are explicitly part of `update_stage_element`.
8. Use clone-before-edit rollback around every Stage lifecycle/edit mutation so closure failure or post-mutation `bundle.validate()` failure restores the original `BundleModel`.
9. Mark dirty state and request model sync with the same semantics as adjacent bundle-model mutation handlers, without registering assets or touching ECS runtime Stage hydration.
10. Add focused tests for success, rejection, no-op, rollback, event order, and post-state for the lifecycle/edit command family.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | yes | Stage tag validation wraps `DisplayNameError`; options serialization can produce `serde_json::Error` if a validator is added here. | Reuse existing Stage validation error types if they land with STL-478. If STL-479 adds or changes validators, preserve external causes with `#[source]` instead of storing `to_string()` in a `String`. Engine handlers still map domain refusal to `CommandRejectedPayload`. | Unit coverage for `validate_stage_tags` and options-serialization source-bearing errors when validators change; otherwise N/A for engine handlers. |
| Schema / serialization compatibility | yes | PR #370 defines Stage command/event/DTO wire shape and TS mirrors. | Treat STL-478 as source of truth; STL-479 changes runtime behavior only. Any payload rename or DTO field change stops as out of scope. | `cargo test -p shotloom-core --test generate_bridge_fixtures` and editor bridge tests remain green; diff review shows no protocol shape churn. |
| Ownership / API boundary | yes | ADR-0050 separates Stage-owned data from shot-owned `PropModel`; engine bridge owns command handling. | Mutate `ShotModel.stages` and `active_stage_id` only; no editor state, no core persistence redesign, no ECS hydration. | Engine bridge tests assert bundle post-state through the command pipeline. |
| Partial mutation / rollback | yes | `commit_stage_edit` in the reference branch clones the bundle before mutating and restores it on closure or validation failure. | Centralize lifecycle/edit commits behind a clone-before-edit helper; reject after restore on any later failure. | Negative tests assert final bundle state after invalid tags/options and forced bundle-validation failure. |
| Diagnostic ownership | yes | STL-478 owns `CommandRejectionCode` additions and docs. | Reuse existing Stage-specific and broad codes; do not invent new rejection codes. Messages may name the invalid field but codes stay contract-owned. | One test per changed rejection class, plus command-rejected code assertions. |
| Local absolute path exposure | no | Implementation touches source, tests, and docs only; no manifest or local file path is introduced. | Keep paths repo-relative in docs and tests. | Manual scan of changed files for home-directory, desktop/download, and drive-letter absolute paths before commit. |
| Manifest path containment | no | No manifest path or file IO path is added by lifecycle/edit handlers. | N/A. Stage renderable `asset_id` checks use catalog ids, not filesystem paths. | N/A: no path input. |
| Command rejection matrix | yes | STL-479 changes seven command handlers plus shared commit helpers. | List target, shared, validation, no-op, and rollback rejections explicitly in tests and docs/spec. | Focused stage tests for missing shot, missing stage, missing element/renderable, duplicate Stage id, locked target, invalid display name, non-finite transform, invalid tags/options, and bundle validation rollback. |
| Cross-platform CLI entrypoint | no | No CLI entrypoint or Node script is added. | N/A. | N/A. |
| Asset/data pack lifecycle | no | No binary fixtures, LFS assets, or data packs are added. | N/A. | N/A. |
| Validation context downgrade | yes | Stage refs can be validated with or without an asset catalog. Lifecycle/edit should not silently skip tag/options validation. | Use the same validation path as `BundleModel::validate()` after mutation; prevalidate command inputs where the command can fail before mutation. | Tests cover invalid tags/options before success and forced bundle validation rollback after mutation. |
| Field-set drift | yes | Stage DTOs and event payloads mirror model fields through manual `From` impls on PR #370/reference branch. | Do not add DTO fields here. For handler tests, assert full success DTO payloads rather than only ids so missing fields surface. | Success-event snapshots or pattern assertions include display name, transform, tags, element visible/locked, renderable source/options where applicable. |
| Bridge docs parity | yes | PR #370 documents placeholder runtime behavior; STL-479 changes runtime behavior for lifecycle/edit commands. | Update only stale placeholder wording if needed; keep command matrix and payload schema unchanged. | Doc path validation plus targeted doc diff review. |
| Event-state visibility | yes | Accepted commands alter Stage state and active-stage selection. | Emit command-specific success events before `bundle_changed`; include post-mutation DTO or resulting active id where the contract expects it. | Event-order tests assert success event index before `bundle_changed` and post-state matches emitted payload. |
| Input constraint parity | yes | Stage commands expose free-form tags and renderable JSON options. | Reuse Stage tag and options validators from the core model; if absent on implementation base, add only those primitives needed for this scope. | Negative tests for bad tag, too many tags, too-deep options, and too-large options. |
| Test oracle strength | yes | Placeholder tests currently pass while no mutation happens. | Replace placeholder-only assertions with tests that fail before implementation because they expect model mutation and event ordering. | Each success test asserts persistent bundle post-state plus success event, not just no rejection. |
| Scope creep | yes | PR #360 grew into wire, lifecycle/edit, provenance, boundary hardening, docs, and module split. | Non-Goals explicitly exclude promote/demote, derived assets, provenance, module split, UI, and hydration. | Diff review excludes `promote_stage_content_to_prop`, `demote_prop_to_stage_content`, asset provenance helpers, editor UI, and runtime hydration. |
| Reviewer objection | yes | Prior review repeatedly objected to large `handlers/stage.rs` and mixed provenance behavior. | Keep this PR lifecycle/edit-only and state sibling ownership in PR body. If the base already has STL-477 module layout, use it; otherwise do not turn STL-479 into layout refactor. | PR file list and tests demonstrate only lifecycle/edit placeholder replacement. |

## Locked Decisions

1. **STL-479 is blocked on, or stacked above, the STL-478 wire contract.**

   Rationale: current `origin/main` has no authored Stage commands/events/DTOs, so implementing STL-479 directly on plain main would either recreate STL-478 or produce unusable code. PR #370 already supplies the contract and placeholder dispatch STL-479 needs to replace.

   Rejected alternatives: re-adding the wire contract in STL-479; using the closed PR #360 as a merge base; implementing against absent command variants.

2. **Only lifecycle/edit commands become real handlers in this PR.**

   Rationale: Linear's scope names create/duplicate/delete/set-active/update/update-element/replace-renderable and explicitly excludes promote/demote, derived asset registration/reuse, and handler module split.

   Rejected alternatives: carrying the full PR #360 handler; implementing promote/demote as "nearby" work; deleting the placeholder for boundary commands before STL-480.

3. **Model mutation is clone-before-edit plus validation rollback.**

   Rationale: Stage lifecycle/edit operations update nested shot-local collections and active-stage state. A later validation failure must not leave half-mutated bundle state or emit success events for rejected commands.

   Rejected alternatives: mutating in place and trying to undo individual fields; validating only preconditions without post-mutation `bundle.validate()`; relying on event absence while state is already dirty.

4. **Stage success event precedes `bundle_changed`.**

   Rationale: bridge consumers need the specific operation result before the broad bundle summary. This matches the Stage authoring contract direction and existing command/event bridge pattern.

   Rejected alternatives: only emitting `bundle_changed`; emitting a full shot reload instead of operation-specific success; sending success after the broad summary.

5. **No Stage/Prop asset handling belongs in lifecycle/edit.**

   Rationale: `replace_stage_renderable` may validate an existing `stage_renderable` asset id, but deriving or reusing cross-kind assets belongs to the promote/demote provenance slice. This keeps STL-479 reviewable and prevents archaeology from hiding provenance policy inside basic CRUD.

   Rejected alternatives: copying `ensure_derived_asset`, `original_or_derived_asset`, or demotion selection cleanup from PR #360; silently dropping invalid asset bindings; treating `Prop` assets as valid Stage renderables.

6. **Module layout follows the base instead of forcing STL-477.**

   Rationale: STL-477 owns the Stage handler directory split. If STL-477 has landed or the chosen stack already has `handlers/stage/`, STL-479 should place lifecycle/edit code in the existing modules. If not, STL-479 should keep file movement minimal and avoid turning this PR into a refactor.

   Rejected alternatives: always creating the directory layout in STL-479; ignoring an already-landed facade; editing module paths just to match the old PR #360 file.

7. **This is one PR only if it stays lifecycle/edit plus required validation.**

   Rationale: the slice replaces one placeholder behavior family with model-only lifecycle/edit handlers and their focused tests. It remains reviewable because wire shape, promote/demote provenance, handler layout, UI, and runtime hydration are excluded.

   Rejected alternatives: merging STL-479 with STL-480 provenance, STL-477 layout, or STL-481 hardening; creating separate PRs for every lifecycle command when the shared rollback/event helper is the main invariant.

## Non-Goals

- No bridge command, event, DTO, rejection-code, fixture schema, or TypeScript mirror redesign.
- No `promote_stage_content_to_prop` or `demote_prop_to_stage_content` behavior.
- No derived `AssetCatalog` entries, `derived_from_asset_id` traversal, asset provenance docs, or asset registration events.
- No hidden-stage promotion behavior, shared-renderable preservation, or demoted-prop selection cleanup.
- No editor UI, outliner, inspector, toolbar, route, CSS, or user-facing copy.
- No Bevy ECS runtime hydration, renderable spawning, asset loading, or material setup for authored Stages.
- No legacy background-prop migration or removal.
- No dependency, ADR, CI, hook, or workspace script changes.
- No broad handler directory split unless the base already provides the split.

## Validator Contract Matrix

This matrix applies only if the implementation base does not already contain the Stage tag and renderable-options validators needed by STL-479.

| Contract claim | Negative fixture | Boundary rule | Error order | Enforcement surface | Regression proof |
|---|---|---|---|---|---|
| Stage tags are display-name-like labels: trim/normalize through the existing display-name validator, preserve order, and reject more than the Stage tag cap. | `create_stage` with one control-character tag; `update_stage` with one more than the max tag count. | Tags are strings only; no path, asset, or external IO interpretation. | Length/count guard first when count exceeds the cap; otherwise first invalid tag by input order. | Core model validator plus engine command prevalidation and post-mutation `BundleModel::validate()`. | Unit test for validator source error; engine rejection test for bad tag proving no Stage mutation. |
| Stage renderable options are schema-free JSON objects but bounded by serialized byte size and nesting depth. | `replace_stage_renderable` with deeply nested JSON; another case with a large string value exceeding the byte cap. | Options stay JSON-only; no path resolution, no asset lookup, no script execution. | Serialize-size failure before depth failure when encoded bytes exceed the cap; depth failure for small but deeply nested input. | Core model validator plus engine command prevalidation and post-mutation `BundleModel::validate()`. | Unit tests for too-large and too-deep options; engine rejection test proving the previous renderable remains unchanged. |
| Validator errors preserve external causes when an external error can exist. | A validator branch that wraps `DisplayNameError`; an options serialization branch if it is represented in the enum. | External causes are diagnostic context only and never become bridge wire payload structs. | The domain validator reports its typed error first; engine maps it to the owning `CommandRejectionCode`. | Rust error enum with `#[source]`; engine command rejection mapping. | `std::error::Error::source()` assertion for source-bearing variants when the validator is added or changed. |

## Implementation Spec

### S0 - Baseline and Base Selection

Requirements: R1, R5. Risk rows: Schema / serialization compatibility, Scope creep, Reviewer objection.

- Confirm the implementation base has Stage authoring wire variants:
  ```bash
  rg -n "CreateStage|StageCreated|InvalidStagePayload|handle_stage_authoring_not_implemented" crates/shotloom-core crates/shotloom-engine apps/editor/src/bridge docs/ipc
  ```
- If the search only finds legacy Stage mood/background-prop commands, stop and rebase after PR #370 merges or explicitly switch to a stacked branch on `feat/bridge-wire-contract`.
- Capture the placeholder dispatch and tests so the implementation can prove which commands changed from placeholder rejection to real behavior.
- Confirm the branch is clean before source edits.

### S1 - Add or Reuse Stage Validation Primitives

Requirements: R6, R8. Risk rows: Error source chain, Input constraint parity, Validation context downgrade.

- Reuse `validate_stage_tags` and `validate_stage_renderable_options` if they are present from the contract base.
- If they are absent, add only the Stage tag and renderable-options validators needed for lifecycle/edit behavior.
- Preserve source-chain behavior if adding validators here: `StageTagsError::Invalid` should carry `DisplayNameError` as `#[source]`, and any options serialization failure should carry `serde_json::Error` as `#[source]`.
- Keep options validation bounded by serialized byte size and JSON nesting depth; do not add schema-specific option validation.

### S2 - Install Shared Lifecycle/Edit Commit Helper

Requirements: R4, R8, R9. Risk rows: Partial mutation / rollback, Event-state visibility.

- Add a private helper equivalent to `commit_stage_edit` that:
  - parses `shot_id`,
  - finds the target shot,
  - clones the bundle before mutation,
  - runs a closure against the mutable shot,
  - restores the clone on closure rejection,
  - runs `bundle.validate()` after mutation,
  - restores the clone and rejects with `BundleValidationFailed` on validation failure.
- Add a finish helper that marks the current-shot dirty scope, requests model sync, emits the specific success event, then emits `BundleChanged`.
- Keep helpers near the active Stage handler module shape: existing `stage/mod.rs` if STL-477 is present, otherwise `handlers/stage.rs`.

### S3 - Implement Lifecycle Handlers

Requirements: R2, R4, R6, R8, R10. Risk rows: Command rejection matrix, Event-state visibility, Test oracle strength.

- `create_stage`:
  - validate display name, finite transform, parse `stage_id`, and normalize tags;
  - reject duplicate `stage_id`;
  - insert an empty `StageModel`;
  - if this is the first Stage, set `active_stage_id` to the new Stage;
  - emit `StageCreated` with the canonical Stage DTO and resulting active id.
- `duplicate_stage`:
  - parse source and new Stage ids;
  - validate optional display name;
  - reject duplicate new id and missing source Stage;
  - deep-copy the source Stage, assign the new id, and override display name only when supplied;
  - do not change `active_stage_id`.
- `delete_stage`:
  - parse target Stage id and reject missing Stage;
  - remove the Stage;
  - if it was active, choose the next Stage at the same index, otherwise the previous/last remaining Stage, otherwise `None`;
  - emit `StageDeleted` with resulting active id.
- `set_active_stage`:
  - accept `None` as active-stage clear;
  - reject non-existent target Stage;
  - no-op without events when the requested active Stage already equals current state;
  - emit `ActiveStageChanged` otherwise.

### S4 - Implement Edit Handlers

Requirements: R2, R4, R6, R7, R8, R10. Risk rows: Command rejection matrix, Input constraint parity, Field-set drift.

- `update_stage`:
  - parse Stage id and reject missing Stage;
  - validate optional display name, finite transform, and optional tags;
  - apply only provided fields;
  - emit `StageUpdated` with the canonical Stage DTO.
- `update_stage_element`:
  - parse Stage and element ids and reject missing targets;
  - reject edits to unlocked fields when the element is locked;
  - allow `locked` itself to change according to the command payload;
  - validate optional display name and finite transform;
  - apply provided fields only;
  - emit `StageElementUpdated` with the canonical element DTO.
- `replace_stage_renderable`:
  - parse Stage and renderable ids and reject missing targets;
  - require the replacement DTO's `renderable_id` to match the target path id;
  - validate local transform, options, and optional asset binding;
  - when `asset_id` is present, require the bundle manifest asset kind to be `stage_renderable`;
  - preserve only the supplied replacement renderable fields;
  - emit `StageRenderableReplaced` with the canonical renderable DTO.

### S5 - Preserve Boundary Placeholder and Contract Parity

Requirements: R3, R5. Risk rows: Schema / serialization compatibility, Scope creep, Bridge docs parity.

- Keep `promote_stage_content_to_prop` and `demote_prop_to_stage_content` routed to the STL-478 placeholder unless a sibling branch already owns their behavior.
- Do not add Stage/Prop asset provenance helpers.
- Update docs only if they still say lifecycle/edit commands are unimplemented after this PR; keep payload examples and command matrices intact.
- Keep TypeScript type files unchanged unless tests require snapshot output generated by existing fixtures.

### S6 - Tests and Gates

Requirements: R10. Risk rows: Test oracle strength, Command rejection matrix, Event-state visibility.

- Replace the placeholder-only lifecycle/edit tests with focused behavior tests:
  - create first Stage sets active id and emits `StageCreated` then `BundleChanged`;
  - duplicate deep-copies without changing active id;
  - delete active Stage chooses deterministic fallback or `None`;
  - set-active no-op emits no events;
  - update-stage changes only provided fields;
  - update-element honors locked target rejection and lock toggling;
  - replace-renderable validates id, options, transform, and asset kind.
- Add shared rejection tests:
  - missing shot;
  - invalid Stage id;
  - missing Stage, element, and renderable;
  - duplicate Stage id;
  - invalid display name;
  - non-finite transform;
  - invalid tags;
  - invalid renderable options;
  - bundle-validation rollback.
- Run focused checks, then full Rust gates.

## Acceptance Criteria

- [ ] The STL-478 placeholder rejection is removed for lifecycle/edit commands only.
- [ ] `create_stage`, `duplicate_stage`, `delete_stage`, and `set_active_stage` mutate shot-local Stage state correctly.
- [ ] `update_stage`, `update_stage_element`, and `replace_stage_renderable` mutate only authored Stage data.
- [ ] `promote_stage_content_to_prop` and `demote_prop_to_stage_content` remain outside this PR.
- [ ] Every accepted lifecycle/edit mutation emits its success event before correlated `bundle_changed`.
- [ ] Rejection paths emit `CommandRejected` without success events or partial persisted bundle state.
- [ ] The bridge wire shape, generated fixtures, and TypeScript mirrors remain aligned with STL-478.
- [ ] Focused Stage bridge tests and required Rust gates pass.

## Verification

Focused checks:

```bash
cargo test -p shotloom-engine bridge::tests::stage --lib
cargo test -p shotloom-core --test generate_bridge_fixtures
cargo test -p shotloom-core --lib validate_stage
```

Broad gates:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo test --workspace --exclude shotloom-desktop
pnpm validate:docs
```

Manual / review proof:

- Confirm `rg -n "handle_stage_authoring_not_implemented" crates/shotloom-engine/src/bridge` still applies only to promote/demote or is removed only after sibling behavior lands.
- Confirm event-order tests assert lifecycle/edit success event index before `BundleChanged`.
- Confirm rollback tests assert final `BundleModel` state, not just rejection event payloads.
- Confirm `git diff -- crates/shotloom-core/src/bridge apps/editor/src/bridge docs/ipc` contains no unplanned wire-shape changes.
- Confirm changed docs/source contain no local absolute paths, including home-directory, desktop/download, and drive-letter forms.

Rejection proof targets:

| Rejection | Proof |
|---|---|
| `ShotNotFound` | dispatch a lifecycle/edit command with a missing or invalid `shot_id`; assert no Stage state changes. |
| `StageNotFound` | update/delete/set-active a missing Stage; assert no success event or bundle mutation. |
| `StageElementNotFound` | update a missing element in an existing Stage. |
| `StageRenderableNotFound` | replace a missing renderable in an existing Stage. |
| `DuplicateStageId` | create or duplicate into an existing Stage id. |
| `StageTargetNotEditable` | edit display/transform/visible on a locked Stage element. |
| `InvalidDisplayName` | create/update/duplicate/update-element with invalid display name. |
| `NonFiniteTransform` | create/update/update-element/replace-renderable with NaN or Inf transform. |
| `InvalidStagePayload` | invalid Stage id, mismatched replacement renderable id, invalid tags, or invalid renderable options. |
| `AssetNotFound` / unsupported asset kind | replace renderable with missing or non-`stage_renderable` manifest asset id. |
| `BundleValidationFailed` | force a post-mutation validation failure and prove the pre-command bundle is restored. |

## Traps

- Do not implement this directly on plain `origin/main` before STL-478 lands; the command variants do not exist there.
- Do not copy the whole closed PR #360 handler; it includes STL-480/STL-481 scope.
- Do not implement promote/demote just because those commands exist in the wire contract.
- Do not add derived asset entries, asset registration events, or provenance-chain traversal in `replace_stage_renderable`.
- Do not use `BundleChanged` alone as proof of success; emit and test the specific Stage success event.
- Do not weaken placeholder tests by deleting them without replacing them with lifecycle/edit behavior tests.
- Do not force the STL-477 module split if the implementation base has not landed it.
- Do not edit TypeScript UI or bridge types unless fixture fallout proves the STL-478 contract is stale.

## Follow-Up Candidates

- STL-480: Stage/Prop promote/demote asset provenance and derived catalog entries.
- STL-481: boundary hardening and edge-case review fixes.
- STL-477: Stage handler module split.
- Editor Stage outliner/inspector/edit-mode UI.
- Bevy runtime hydration for authored Stage renderables.
