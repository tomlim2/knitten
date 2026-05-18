---
status: open
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: working STL-451 - Stage authoring bridge command and DTO contract
repo: shotloom
linear: STL-451
briefing: ../briefings/shotloom/bridge-add-stage-authoring-contract.md
---

# Add Stage Authoring Bridge Contract

## Spec Contract

- Briefing basis: `../briefings/shotloom/bridge-add-stage-authoring-contract.md`
  defines STL-451 as a bridge-contract task after shot-local `StageModel`
  landed.
- Current truth: `StageModel`, `StageElement`, `StageRenderable`, roles,
  representation kinds, `ShotModel.stages`, and `active_stage_id` exist in
  `shotloom-core`; bridge and TypeScript surfaces expose only `set_stage_mood`
  plus legacy background-prop compatibility commands.
- Required change: add explicit Rust bridge commands/events/DTOs and matching
  TypeScript wire types for Stage create, duplicate, delete, active-stage
  selection, Stage metadata/transform update, element visibility/lock update,
  renderable replacement, and explicit promotion/demotion across the
  Stage-owned and shot-owned prop boundary.
- Locked boundary: no editor UI, no Bevy runtime hydration, no legacy
  `spawn_background_props` removal, no Stage persistence schema redesign, no
  new dependency, and no ADR unless implementation exposes an uncodified
  architecture decision.
- Proof method: Rust serde tests, bridge fixture generation, TypeScript
  fixture/snapshot/type tests, contract docs, and focused engine bridge tests
  that prove rejection surfaces and coupled mutation atomicity.

## Current State

| Surface | Path | Classification | Evidence |
|---|---|---|---|
| Stage persistence model | `crates/shotloom-core/src/model/stage.rs` | Already Done | Defines `StageModel`, `StageElement`, `StageRenderable`, `StageRole`, `StageRepresentationKind`, provenance, source refs, diagnostics, and serde wire names. |
| Shot-local Stage ownership | `crates/shotloom-core/src/model/shot.rs` | Already Done | `ShotModel` stores `stages: im::Vector<StageModel>` and `active_stage_id: Option<StageId>` separately from `props`. |
| Stage reference validation | `crates/shotloom-core/src/model/shot.rs` | Already Done | `validate_stage_refs` rejects duplicate stage ids, dangling active stage ids, duplicate element/renderable ids, and missing renderable refs. |
| Legacy Stage environment | `crates/shotloom-core/src/model/entity.rs` | Already Done / Compatibility | `StageEnvironment` remains a map/mood compatibility path and is not the authored Stage command target. |
| Bridge command enum | `crates/shotloom-core/src/bridge/mod.rs` | Partial | Has `SetStageMood`, `SpawnBackgroundProps`, and `ClearBackgroundProps`; no authored Stage lifecycle, active-stage, element, renderable, promotion, or demotion commands exist. |
| Bridge event enum | `crates/shotloom-core/src/bridge/mod.rs` | Partial | Has `StageMoodChanged`, `PropAdded`, `PropRemoved`, `BundleChanged`, and `CommandRejected`; no Stage-specific authoring success echo exists. |
| Bridge transaction classes | `crates/shotloom-core/src/bridge/mod.rs` | Partial | Durable mutation classification exists for model-changing commands; new Stage authoring commands must be classified there. |
| Rejection code enum | `crates/shotloom-core/src/bridge/mod.rs` | Partial | `CommandRejectionCode` has only `UNKNOWN_MOOD` for Stage; no missing stage, missing element/renderable, boundary, not-editable, duplicate-stage, or invalid Stage payload codes exist. |
| Engine command dispatch | `crates/shotloom-engine/src/bridge/mod.rs` | Partial | Dispatches legacy Stage mood and background prop commands; no authored Stage handler branch exists. |
| Existing Stage handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Partial | Handles `set_stage_mood` runtime resource changes only, not `BundleModel` Stage authoring. |
| TypeScript bridge commands | `apps/editor/src/bridge/types.ts` | Partial | Mirrors `set_stage_mood`, `spawn_background_props`, and `clear_background_props`; no authored Stage command union members exist. |
| TypeScript shot read model | `apps/editor/src/bridge/shot.ts` | Missing | `Shot` exposes props and cine cameras but not Stage read-model fields, so Stage authoring events cannot be typed end-to-end yet. |
| Bridge fixture generator | `crates/shotloom-core/tests/generate_bridge_fixtures.rs` | Partial | Scenario table and rejection ratchets exist; Stage authoring commands/events/rejections need representative fixtures. |
| TS contract meta-test | `apps/editor/src/bridge/__tests__/contract.meta.test.ts` | Already Done | Enforces every observed `command_rejected` code is known and every known code has fixture coverage unless allow-listed. |
| Bridge contract docs | `docs/ipc/bridge-contract.md` | Partial | Lists stage command family and documents `set_stage_mood`; authored Stage command matrix is absent. |
| Stage concept spec | `docs/specs/stage-entity-model.md` | Already Done | Defines concept boundary, roles, authoring operations, promotion/demotion semantics, and terminology. |
| Bundle format docs | `docs/specs/bundle-format.md` | Already Done | Documents `stages` and `active_stage_id`; no new persistence shape is required for this bridge contract. |
| Contract registry | `contracts/README.md` | Already Done | Names bridge fixtures as repository-internal verification artifacts generated by `shotloom-core` and consumed by editor vitest. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-451` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Add explicit Stage authoring bridge command/event DTOs so Stage can be authored from editor/runtime as a first-class entity. |
| Acceptance criteria | Rust/TS wire shape parity; documented success/rejection/unauthorized/missing-stage cases; Stage-owned content stays separate from `PropModel`; promotion/demotion are explicit commands; fixtures and editor bridge tests pass. |
| Latest relevant comment | N/A |
| Blockers / dependencies | `STL-449` is Done and present on current `origin/main`; parent `STL-457`; related `STL-446`; blocks `STL-453`, `STL-454`, `STL-455`. |
| Related PRs | `STL-449` landed via PR #358 and commits `e488585d`, `a9a7896`. |
| Current review state | No PR for STL-451 yet. |
| Planning consequence | This PR can build on the landed Stage persistence model but must not implement editor UI, runtime hydration, or background-prop compatibility removal. |

## Problem

Shotloom now persists shot-local Stage data, but the bridge still exposes only
runtime mood and legacy background-prop compatibility paths. The editor cannot
create, duplicate, delete, activate, update, replace renderables, or explicitly
promote/demote Stage-owned content without inventing UI-side mutations or
misusing `PropModel` commands. That would violate ADR-0050's boundary between
Stage-owned environment content and shot-owned editable props.

## Requirements

1. Add Rust `BridgeCommand` variants and TypeScript `BridgeCommand` union
   members for the Stage authoring command set: create, duplicate, delete, set
   active, update stage metadata/transform, update element visibility/lock,
   replace renderable, promote stage-owned content to `PropModel`, and demote
   eligible `PropModel` to Stage-owned `set_dressing`. Every authored Stage
   command targets an explicit `shot_id`; it must not silently target whichever
   shot happens to be current in UI state. Trace: STL-451 scope, shot-local
   Stage ownership, and AC1.
2. Add bridge DTOs for Stage command payloads and success echoes using
   bridge-owned `*Dto` types where read-model data crosses the command/event
   boundary. Trace: bridge-contract §7A and AC1.
3. Add Stage-specific success events for accepted Stage authoring commands
   rather than relying only on broad `bundle_changed`. Trace: STL-451 AC2 and
   bridge-contract command/event model.
4. Classify every Stage authoring command that mutates `BundleModel` as
   `TransactionClass::DurableMutation`; keep runtime-only mood behavior
   unchanged. Trace: transaction bridge lifecycle and undo/redo contract.
5. Add explicit Stage rejection codes for missing stage, missing element,
   missing renderable, duplicate stage id, invalid Stage payload, target not
   editable, and stage/prop boundary violation. Trace: STL-451 AC2 and
   error-handling.md command rejection policy.
6. Reuse existing broad rejection codes only when they already own the defect
   class: `SHOT_NOT_FOUND` for missing authoring shot, `ASSET_NOT_FOUND` for a
   renderable replacement asset id absent from the manifest, `INVALID_DISPLAY_NAME`
   for Stage display-name validation, `NON_FINITE_TRANSFORM` for transform
   components, and `BUNDLE_VALIDATION_FAILED` for post-mutation rollback.
   Trace: current `CommandRejectionCode` semantics and AC2.
7. Keep Stage-owned content and shot-owned props in separate model collections.
   Promotion removes the Stage-owned source element/renderable before adding a
   shot-owned `PropModel`; demotion removes or converts the eligible
   `PropModel` before adding Stage-owned `set_dressing`. Trace: ADR-0050 and
   AC3/AC4.
8. Prevalidate coupled Stage/prop mutations before the first persistent write,
   or restore the pre-command model on any later failure. Trace: briefing P1
   atomicity seed and AC3/AC4.
9. Update `docs/ipc/bridge-contract.md` with a Stage authoring command matrix,
   payload examples, success events, rejection cases, boundary notes, and the
   unchanged legacy background-prop compatibility scope. Trace: AC2 and PR
   co-location checklist.
10. Update cross-language fixture generation and editor bridge tests so Rust
    and TypeScript share the same wire shape and rejection-code coverage.
    Trace: AC1/AC5 and `contracts/README.md`.
11. Do not require editor UI wiring or Bevy runtime hydration for this PR, but
    add engine bridge handler tests proving model mutation, event order, and
    rejection behavior through the command pipeline. Trace: STL-451 non-scope
    plus AC5.
12. Keep command/event names in snake_case and avoid the terms "stage prop" or
    "dressing" in DTO names; use `set_dressing` where the Stage role is meant.
    Trace: `docs/specs/stage-entity-model.md` terminology.
13. Lock active-stage selection semantics: creating the first Stage in a shot
    sets `active_stage_id` to the new Stage; duplicating a Stage does not change
    the active Stage; deleting the active Stage sets `active_stage_id` to the
    next remaining Stage in shot order, or `null` when none remain; deleting a
    non-active Stage preserves `active_stage_id`. Trace: `ShotModel.active_stage_id`
    optionality, Stage delete AC, and deterministic editor reconciliation.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This slice adds bridge DTOs, command handlers, and validator-style rejections; no new file/parser/loader external error source is planned. | Use `CommandRejectedPayload` for deterministic command/domain refusal and existing typed validator errors where available. | N/A: no wrapped external error; rejection tests assert codes and unchanged state. |
| Schema / serialization compatibility | yes | `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts`, `docs/ipc/bridge-contract.md` | Add additive command/event variants with adjacently tagged serde shape; no protocol version bump. | Rust serde round trips, generated fixtures, editor contract snapshots/meta-tests. |
| Ownership / API boundary | yes | ADR-0050, `docs/specs/stage-entity-model.md`, `ShotModel.stages`, `ShotModel.props` | Keep Stage commands on Stage collections; promotion/demotion are explicit boundary-crossing commands. | Engine tests assert Stage-owned content and `PropModel` membership before/after commands. |
| Partial mutation / rollback | yes | Promotion/demotion mutate coupled Stage and prop collections; renderable replacement can touch Stage refs plus asset validation. | Prevalidate every target and derived state before mutation; restore pre-command `BundleModel` on bundle validation failure. | Failure-path tests assert no half-promoted/half-demoted state and no success events after rejection. |
| Diagnostic ownership | yes | `CommandRejectionCode` Rust enum and TS mirror arrays | Rust owns rejection codes; TS mirrors exact strings; no ad hoc lowercase reason field. | Fixture ratchets prove every new code is observed and mirrored. |
| Test oracle strength | yes | Existing fixture generator and engine bridge tests | Tests assert persisted model, event order, and TypeScript parsing rather than only compile success. | New tests fail before variants/handlers/docs exist and pass after implementation. |
| Scope creep | yes | Linear non-scope and sibling background-prop specs | UI, hydration, import conversion, background-prop removal, and new dependencies are Non-Goals. | N/A: PR diff limited to bridge/core/engine tests/editor bridge docs. |
| Reviewer objection | yes | Likely objection: too many commands or over-specific rejection codes. | Keep command set to Linear minimum and Stage spec operations; reuse existing broad codes where they already own the defect class. | Contract docs map every command to success/rejection proof. |

## Locked Decisions

1. **Add a compact Stage authoring command family now.**

   Rationale: Linear names the minimum operation set and the Stage concept spec
   already defines matching authoring operations. One bridge family is
   reviewable because it is DTO/contract/test work over an existing persistence
   model.

   Rejected alternatives: adding only create/delete would leave active-stage,
   renderable replacement, and promotion/demotion untyped; deferring commands
   to UI work would force UI authors to invent protocol names.

2. **Use Stage-specific success events, then `bundle_changed` for mirror refresh.**

   Rationale: `bundle_changed` is a broad summary and does not identify which
   Stage operation succeeded. Stage authoring needs command-level success
   echoes so editor code can reconcile targeted UI state without inferring from
   a broad bundle summary.

   Rejected alternatives: `bundle_changed` only would satisfy persistence but
   fail the "success case clearly documented" AC; a single generic
   `stage_changed` event would make delete, active-stage switch, renderable
   replacement, and promotion/demotion too ambiguous for reducers.

3. **Add new Stage rejection codes only for Stage-owned defect classes.**

   Rationale: Missing Stage, element, renderable, not-editable target, duplicate
   Stage id, and Stage/prop boundary violation are stable product-level
   failures that existing codes do not name. Existing codes still cover generic
   display-name, transform, asset, shot, and bundle-validation failures.

   Rejected alternatives: mapping every Stage refusal to `INVALID_PAYLOAD`
   would hide actionable user-facing cases; adding one new code per command
   would overfit the enum and increase fixture churn.

4. **Keep bridge DTOs separate from persistence types when the event is a read model.**

   Rationale: `bridge-contract.md` §7A says nested DTOs crossing bridge events
   should be explicit. Persistence models can inspire fields, but bridge DTOs
   should preserve forward compatibility and avoid exposing repair-only or
   storage-only concerns unintentionally.

   Rejected alternatives: serializing `StageModel` directly in every event
   couples editor wire expectations to persistence evolution; defining DTOs in
   TypeScript first violates Rust-side bridge authority.

5. **Promotion/demotion are atomic model-boundary commands.**

   Rationale: ADR-0050 treats promotion from Stage-owned content to `PropModel`
   as an explicit authoring action. The command must not leave both sides owning
   the same logical object, and must not delete the source before all target
   validation succeeds.

   Rejected alternatives: automatic promotion during import recreates the
   background-prop compatibility path; two separate "delete Stage element" and
   "spawn prop" commands would expose a partial-persistence window to callers.

6. **Do not change legacy background prop commands in this PR.**

   Rationale: `spawn_background_props` and `clear_background_props` are already
   documented compatibility/debug paths with their own sibling specs and tests.
   Stage authoring should coexist until a later migration issue removes or
   converts that path.

   Rejected alternatives: folding background props into Stage commands here
   would merge import/debug compatibility with authored Stage lifecycle and
   expand STL-451 beyond its bridge contract scope.

7. **Engine handlers may mutate the bundle model but must not hydrate runtime Stage geometry here.**

   Rationale: STL-451's non-scope excludes Bevy runtime hydration. Engine bridge
   tests can prove model mutation and events without spawning Stage renderables.

   Rejected alternatives: implementing runtime entities would pull Bevy ECS
   ordering and asset loading into the command-contract PR.

8. **Every Stage authoring command carries `shot_id`.**

   Rationale: Stage is shot-local, and several bridge families already use
   explicit shot ids for timeline mutations. Making `shot_id` part of every
   Stage command prevents UI-only current-shot state from becoming an implicit
   protocol parameter and gives missing-shot rejection a stable test target.

   Rejected alternatives: using only the current authoring shot would mirror
   prop spawn behavior but make cross-shot editor flows ambiguous; embedding
   shot identity only in event payloads would be too late to validate command
   intent.

9. **Deleting the active Stage chooses the next remaining Stage, then `null`.**

   Rationale: `active_stage_id` is optional, so an empty Stage list can be
   represented without a sentinel. When other stages remain, choosing the next
   Stage in shot order keeps editor state deterministic without requiring a
   second command.

   Rejected alternatives: always setting `active_stage_id` to `null` would
   leave a shot with usable Stages but no active Stage; preserving a dangling
   deleted id would violate `validate_stage_refs`; asking the UI to send a
   follow-up `set_active_stage` would create a partial-state window.

## Non-Goals

- No Stage outliner, inspector, edit-mode, toolbar, or button implementation.
- No Bevy runtime hydration for authored Stage geometry or Stage renderables.
- No removal, rename, or migration of `spawn_background_props` or
  `clear_background_props`.
- No parser/resolver or Story Previz map-document integration.
- No new `StageModel` persistence fields unless live code proves an existing
  field cannot express the command contract.
- No new dependency, ADR, route, CSS, or user-facing UI copy.
- No direct manipulation of ECS entities as the public bridge protocol.
- No cross-shot Stage catalog or shared Stage source design.

## Implementation Spec

### S0 - Baseline Re-Check

1. Confirm the worktree is clean and based on current `origin/main`.
2. Re-run:
   ```bash
   rg -n "StageModel|StageElement|StageRenderable|active_stage_id|StageRole|StageRepresentationKind" crates/shotloom-core docs/specs docs/adr
   rg -n "SetStageMood|StageMoodChanged|CommandRejectionCode|TransactionClass|BridgeCommand|BridgeEvent" crates/shotloom-core crates/shotloom-engine apps/editor/src/bridge docs/ipc
   rg -n "spawn_background_props|clear_background_props|set_dressing|Promote set dressing|Demote prop" crates apps docs contracts
   ```
3. Confirm no Stage authoring commands/events already exist before adding them.
4. Confirm `STL-449` is still present on base through `StageModel` and
   `active_stage_id` source evidence.

### S1 - Add Core Bridge DTOs and Commands

Requirements: R1, R2, R4, R12, R13. Risk rows: Schema / serialization
compatibility, Ownership / API boundary.

1. Add Stage bridge DTOs under `crates/shotloom-core/src/bridge/` or the
   existing bridge module layout:
   - `StageDto`
   - `StageElementDto`
   - `StageRenderableDto`
   - focused command payload DTOs if field groups repeat.
2. Add commands to `BridgeCommand`:
   - `CreateStage`
   - `DuplicateStage`
   - `DeleteStage`
   - `SetActiveStage`
   - `UpdateStage`
   - `UpdateStageElement`
   - `ReplaceStageRenderable`
   - `PromoteStageContentToProp`
   - `DemotePropToStageContent`
3. Use exact snake_case wire names:
   - `create_stage`
   - `duplicate_stage`
   - `delete_stage`
   - `set_active_stage`
   - `update_stage`
   - `update_stage_element`
   - `replace_stage_renderable`
   - `promote_stage_content_to_prop`
   - `demote_prop_to_stage_content`
4. Mark all nine commands as `TransactionClass::DurableMutation`.
5. Add Rust serde tests for command payload round trips, optional additive
   fields, and transaction classification.
6. Assert every command payload carries `shot_id`, plus the command-specific
   Stage, element, renderable, or prop target ids.

### S2 - Add Rejection Codes and Success Events

Requirements: R3, R5, R6, R10. Risk rows: Diagnostic ownership, Schema /
serialization compatibility.

1. Add Stage-specific `CommandRejectionCode` variants:
   - `StageNotFound`
   - `StageElementNotFound`
   - `StageRenderableNotFound`
   - `DuplicateStageId`
   - `StageTargetNotEditable`
   - `StageBoundaryViolation`
   - `InvalidStagePayload`
2. Reuse existing codes according to R6.
3. Add Stage success events to `BridgeEvent`:
   - `StageCreated { shot_id, stage }`
   - `StageDuplicated { shot_id, source_stage_id, stage }`
   - `StageDeleted { shot_id, stage_id, active_stage_id }`
   - `ActiveStageChanged { shot_id, active_stage_id }`
   - `StageUpdated { shot_id, stage }`
   - `StageElementUpdated { shot_id, stage_id, element }`
   - `StageRenderableReplaced { shot_id, stage_id, renderable }`
   - `StageContentPromotedToProp { shot_id, stage_id, element_id, prop }`
   - `PropDemotedToStageContent { shot_id, prop_id, stage_id, element }`
4. Emit `BundleChanged` after accepted durable mutations, following existing
   bridge model-mutation precedent.
5. Add Rust event serde tests and fixture scenarios for new events and
   rejection codes.

### S3 - Add Engine Bridge Handlers

Requirements: R3, R4, R7, R8, R11, R13. Risk rows: Ownership / API boundary,
Partial mutation / rollback, Reviewer objection.

1. Add a focused Stage authoring handler module under
   `crates/shotloom-engine/src/bridge/handlers/`.
2. Route the new `BridgeCommand` variants from
   `crates/shotloom-engine/src/bridge/mod.rs`.
3. Keep handlers model-focused:
   - locate the requested `shot_id` inside the loaded bundle,
   - validate Stage/element/renderable/prop/asset ids,
   - mutate `ShotModel.stages`, `active_stage_id`, and `props` only through
     prevalidated or rollback-safe steps,
   - emit Stage success event plus final `BundleChanged`,
   - mark dirty state for coalesced shot mirror when current-shot model changes.
4. Implement promotion/demotion as all-or-nothing:
   - prevalidate source ownership, target eligibility, derived ids, display
     name, transform finite-ness, and bundle validation,
   - mutate both sides only after validation succeeds,
   - on post-mutation validation failure, restore pre-command model and reject
     with `BUNDLE_VALIDATION_FAILED`.
5. Do not spawn, despawn, or hydrate Bevy Stage renderable entities in these
   handlers.
6. For `delete_stage`, update `active_stage_id` according to R13 before bundle
   validation and event emission.

### S4 - Add TypeScript Bridge Mirrors

Requirements: R1, R2, R10, R12. Risk rows: Schema / serialization
compatibility, Test oracle strength.

1. Add Stage DTO/read-model types to `apps/editor/src/bridge/shot.ts` or
   `apps/editor/src/bridge/types.ts`, following existing bridge organization.
   The `Shot` read model must gain optional `stages` and `active_stage_id`
   fields so event payloads and `shot_loaded`-style mirrors can be typed.
2. Add the nine command types and union entries to
   `apps/editor/src/bridge/types.ts`.
3. Add Stage event types and union entries.
4. Add new rejection-code strings to `COMMAND_REJECTION_CODES`.
5. Add or update TypeScript contract tests and snapshots so generated Rust
   fixtures narrow to the expected discriminated unions.

### S5 - Update Contract Docs and Registry Notes

Requirements: R9, R12. Risk rows: Scope creep, Reviewer objection.

1. Update `docs/ipc/bridge-contract.md`:
   - command summary table,
   - `## 13A. Stage commands` command matrix,
   - payload examples,
   - success event descriptions,
   - rejection code mapping,
   - promotion/demotion boundary notes,
   - legacy background-prop compatibility note.
2. Update event summary and `command_rejected` rejection-code section.
3. Update `MAP.md` only if a new Stage bridge handler file or bridge DTO file
   needs a navigation entry.
4. Update `contracts/README.md` only if fixture authority or validation path
   changes; otherwise leave it unchanged.

### S6 - Verification and Gates

Requirements: R10, R11. Risk rows: Test oracle strength, Partial mutation /
rollback.

1. Run focused Rust tests:
   ```bash
   cargo test -p shotloom-core --test generate_bridge_fixtures
   cargo test -p shotloom-core --lib bridge
   cargo test -p shotloom-engine bridge::tests::stage
   ```
2. Run focused editor bridge tests:
   ```bash
   pnpm --filter @shotloom/editor test -- src/bridge/__tests__/contract.test.ts src/bridge/__tests__/contract.meta.test.ts src/bridge/__tests__/types.test.ts
   ```
3. Run docs validation:
   ```bash
   pnpm validate:docs
   ```
4. Before implementation commit, run the Shotloom gate set required by the
   active Shotloom rule, excluding `shotloom-desktop` for Rust workspace gates.

## Acceptance Criteria

- [ ] Rust `BridgeCommand`, `BridgeEvent`, `CommandRejectionCode`, and
      TypeScript bridge types expose matching Stage authoring wire shapes.
- [ ] `docs/ipc/bridge-contract.md` documents success, rejection,
      not-editable target, and missing stage/element/renderable cases.
- [ ] Promotion/demotion commands prove Stage-owned content and shot-owned
      `PropModel` do not both own the same logical object after success or
      failure.
- [ ] No automatic import side effect promotes or demotes Stage content.
- [ ] Bridge fixture generation and editor bridge contract/meta tests pass.
- [ ] Legacy `spawn_background_props` and `clear_background_props` remain
      compatible and unchanged except for docs clarifying their legacy scope.

## Verification

Focused checks:

```bash
cargo test -p shotloom-core --test generate_bridge_fixtures
cargo test -p shotloom-core --lib bridge
cargo test -p shotloom-engine bridge::tests::stage
pnpm --filter @shotloom/editor test -- src/bridge/__tests__/contract.test.ts src/bridge/__tests__/contract.meta.test.ts src/bridge/__tests__/types.test.ts
pnpm validate:docs
```

Manual / failure-path repro targets:

- Dispatch `create_stage`; observe `stage_created` then `bundle_changed`, with
  `ShotModel.stages` containing the new Stage.
- Dispatch `set_active_stage` for an unknown stage id; observe
  `command_rejected` with `STAGE_NOT_FOUND` and unchanged `active_stage_id`.
- Dispatch `update_stage_element` for a missing element id; observe
  `STAGE_ELEMENT_NOT_FOUND` and unchanged Stage data.
- Dispatch `replace_stage_renderable` for a missing renderable id; observe
  `STAGE_RENDERABLE_NOT_FOUND` and unchanged Stage data.
- Dispatch `create_stage` with a caller-supplied id that already exists in the
  target shot; observe `DUPLICATE_STAGE_ID` and unchanged Stage order.
- Dispatch `update_stage_element` against a locked or non-editable target;
  observe `STAGE_TARGET_NOT_EDITABLE` and unchanged element fields.
- Dispatch a Stage command with internally inconsistent ids, such as a
  renderable replacement payload whose nested renderable id disagrees with the
  URL target; observe `INVALID_STAGE_PAYLOAD` and unchanged Stage data.
- Dispatch `update_stage` with an empty or oversized display name; observe
  `INVALID_DISPLAY_NAME` and unchanged Stage metadata.
- Dispatch `update_stage` with NaN or Inf in `base_transform`; observe
  `NON_FINITE_TRANSFORM` and unchanged Stage transform.
- Dispatch `replace_stage_renderable` for a missing asset id; observe
  `ASSET_NOT_FOUND` and unchanged renderable refs.
- Dispatch `promote_stage_content_to_prop` for non-`set_dressing` content;
  observe `STAGE_BOUNDARY_VIOLATION` and unchanged Stage/prop collections.
- Dispatch `promote_stage_content_to_prop` for eligible set dressing; observe
  a shot-owned `PropModel`, removal of the Stage-owned element/renderable
  ownership, and no duplicate logical owner.
- Dispatch `demote_prop_to_stage_content` for an unknown prop id; observe
  `ENTITY_NOT_FOUND` and unchanged Stage/prop collections.
- Dispatch `delete_stage` for the active stage; observe documented
  next-stage or `null` behavior and no removal of shot-owned props.
- Dispatch a Stage command with an unknown `shot_id`; observe `SHOT_NOT_FOUND`
  and no Stage mutation in any shot.
- Force a post-mutation `BundleModel` validation failure in a test-only harness;
  observe `BUNDLE_VALIDATION_FAILED`, restored pre-command Stage/prop state, and
  no Stage success event.

Broad pre-commit gates:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
node scripts/validate-ci-rust-coverage.mjs
```

## Traps

- Do not serialize raw ECS entities or Bevy component ids as Stage command
  targets; bridge targets are domain ids.
- Do not use `spawn_background_props` as the implementation for Stage-owned
  content. It creates shot-owned `PropModel` background-map compatibility props.
- Do not collapse all Stage refusal into `INVALID_PAYLOAD`; missing Stage
  targets and boundary violations need stable, testable codes.
- Do not emit `bundle_changed` before the specific Stage success event; editor
  consumers need deterministic command-correlated ordering.
- Do not call Stage-owned set dressing a "stage prop" in DTO names or docs.
- Do not mutate Stage and prop collections in separate commands for
  promotion/demotion.

## Follow-Up Candidates

- Editor Stage outliner, inspector, and edit-mode UI wiring.
- Bevy runtime hydration of authored Stage renderables.
- Stage import path that converts map-document background ownership into
  Stage-owned content.
- Migration or removal of legacy background-prop debug compatibility commands.
- Shared or reusable Stage catalog after shot-local behavior is proven.
