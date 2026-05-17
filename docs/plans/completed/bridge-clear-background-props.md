---
status: completed
created: 2026-05-15
updated: 2026-05-17
load: triggered
trigger: working STL-424 - background prop clear bridge command
repo: shotloom
linear: STL-424
briefing: ../../briefings/shotloom/bridge-clear-background-props.md
---

# Clear Background Props Bridge Command

## Spec Contract

- Briefing basis: `../briefings/shotloom/bridge-clear-background-props.md` defines STL-424 as the bridge-owned clear primitive that unblocks later editor wiring.
- Current truth: `spawn_background_props` already persists `PropModel.tags` with exact `background_map` ownership tags; no `clear_background_props` command exists on `origin/main`.
- Required change: add one durable bridge command that clears only current-shot props tagged `background_map`, despawns their ECS entities, prunes selection, emits deterministic bridge events, and updates the coalesced shot mirror.
- Locked boundary: no editor button wiring, parser/resolver work, debug cube cache, asset manifest deletion, typed `background_owner` model field, or new dependency.
- Proof method: serde/TypeScript wire tests, focused engine bridge tests for selective removal/no-op/selection/camera-target/event order, bridge contract docs, and targeted Rust tests.
- One-PR suitability: this is one reviewable PR because it adds one unit command and reuses existing prop removal, selection, dirty-shot, and bridge event primitives.

## Current State

| Surface | Path | Classification | Evidence |
|---|---|---|---|
| Background spawn command | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | `BridgeCommand::SpawnBackgroundProps` serializes as `spawn_background_props` and is a durable mutation. |
| Background ownership tags | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | Spawned background props receive `background_map`, `owner:map_document`, `map:<map_id>`, `document:<document_id>`, `source:<source>`, and optional `object:<object_id>`. |
| Ownership contract | `docs/ipc/bridge-contract.md` | Already Done | §14.2b states the exact `background_map` tag is the authoritative discriminator for background-map props. |
| Stage map ownership spec | `docs/specs/stage-map-document.md` | Already Done | Background clear-all must filter by ownership and must not clear by display name or shared asset id. |
| Prop model | `crates/shotloom-core/src/model/entity.rs` | Already Done | `PropModel.tags` persists string tags; no schema change is needed. |
| Prop removal primitive | `crates/shotloom-core/src/model/shot.rs` | Already Done | `ShotModel::remove_prop` removes `shot.props`, drops `initial_state.props`, and clears cine-camera target bindings to the removed prop. |
| Single prop engine removal | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Partial | `despawn_prop_deferred`, `despawn_prop_entity`, and `cleanup_selection_after_prop_removed` exist for one prop. Batch clear can reuse their semantics, but needs multi-prop target collection and one selection event. |
| Single prop removal tests | `crates/shotloom-engine/src/bridge/tests/props.rs` | Already Done | Tests cover model/entity removal, selection pruning, no selection event when unchanged, unknown-id rejection, and bounded rejection text. |
| Coalesced shot mirror | `crates/shotloom-engine/src/bridge/resource.rs`, `crates/shotloom-engine/src/bridge/emission.rs` | Already Done | `BridgeDirtyFlags::shot_loaded_for` causes a later spontaneous `shot_loaded` for the changed authoring shot. |
| Core clear command | `crates/shotloom-core/src/bridge/mod.rs` | Missing | No `ClearBackgroundProps` variant or serde test exists. |
| TS clear command | `apps/editor/src/bridge/types.ts` | Missing | No `ClearBackgroundPropsCommand` type or union entry exists. |
| Engine dispatch | `crates/shotloom-engine/src/bridge/mod.rs` | Missing | No `BridgeCommand::ClearBackgroundProps` match arm exists. |
| Bridge contract clear docs | `docs/ipc/bridge-contract.md` | Missing | §14.2 currently documents `spawn_background_props` then `despawn_prop`; no clear-background command section exists. |
| Local POC | `.worktrees/stage-import-bridge-poc` | Conflict / Reference Only | Contains dirty `clear_background_props` sketches, but also mixes debug cube cache, UI, fixture assets, and old background-spawn shapes. Reuse only audited clear-command ideas. |
| Editor stage wiring | `docs/briefings/shotloom/editor-wire-stage-import-commands.md` | Sibling | STL-431 expects this command to exist before the clear button can dispatch safely. |

## Problem

Stage-import cleanup currently has no bridge primitive. The editor cannot call
`despawn_prop` repeatedly because it does not know which authored prop IDs came
from map-document background import, and clearing by asset id or display name
would delete user-spawned props that share the same GLB. The engine must own
the deletion because it already owns authoritative bundle mutation, ECS entity
despawn, selection cleanup, bundle summaries, and coalesced `shot_loaded`.

## Requirements

1. Add `BridgeCommand::ClearBackgroundProps` with wire type
   `clear_background_props`, no payload, and `TransactionClass::DurableMutation`.
   Trace: STL-424 AC1, bridge command/event boundary.
2. Add `ClearBackgroundPropsCommand` to `apps/editor/src/bridge/types.ts` and a
   TypeScript wire-shape test. Trace: TypeScript bridge mirror rule.
3. Route the command in `crates/shotloom-engine/src/bridge/mod.rs` to a prop
   handler that operates on the current authoring shot. Trace: STL-424 scope.
4. Select clear targets by exact `PropModel.tags.contains("background_map")`
   only. Trace: `docs/ipc/bridge-contract.md` §14.2b and
   `docs/specs/stage-map-document.md` ownership rule.
5. Preserve all untagged props, characters, cameras, tracks, and assets. Trace:
   STL-424 AC2 and clear-by-ownership intent.
6. For each removed prop, use `ShotModel::remove_prop` so `shot.props`,
   `initial_state.props`, and camera `target_binding` cleanup remain owned by
   the model primitive. Trace: `ShotModel::remove_prop` precedent.
7. Despawn every matching ECS prop entity identified by `BridgeEntityId`
   `prop:<prop_id>`. Trace: existing `despawn_prop_entity` behavior.
8. Prune every removed `prop:<prop_id>` from `SelectedEntities`, preserve
   unrelated selected IDs, and emit exactly one `selection_changed` only when
   the selection changed. Trace: single-prop selection cleanup tests.
9. Emit success events in order: `prop_removed` once per removed prop, optional
   `selection_changed`, then `bundle_changed`. Set
   `BridgeDirtyFlags::shot_loaded_for` when the authored shot model changed.
   Trace: `despawn_prop` contract and ADR-0042.
10. Treat no-op clear as accepted and safe but eventless: no rejection, no
    `prop_removed`, no `selection_changed`, no `bundle_changed`, and no dirty
    `shot_loaded`. Trace: STL-424 AC4 and the bridge rule that domain events
    describe actual domain changes.
11. Reject only missing bundle/current-shot preconditions with
    `CommandRejectionCode::EntityNotFound`, matching `despawn_prop`'s current
    no-bundle/no-shot removal family. Trace: §14.2c rejection precedent.
12. Update `docs/ipc/bridge-contract.md` with the command purpose, payload,
    scope, no-op semantics, rejection code, and event order. Trace: PR
    co-location checklist for interface changes.
13. Add a shared bridge fixture/snapshot for `clear_background_props` through
    `crates/shotloom-core/tests/generate_bridge_fixtures.rs`, and keep the
    editor contract snapshot test green. Trace: bridge contract fixture
    precedent for command wire shapes.

## Locked Decisions

1. **Use a unit command named `clear_background_props`.**

   Rationale: The operation clears all current-shot background-map props by an
   engine-owned discriminator and needs no caller payload. This keeps STL-431's
   editor clear button simple and avoids passing stale prop IDs from UI state.

   Rejected alternatives: a payload of prop IDs would move ownership detection
   to the editor; a payload of map/document/source filters is useful later but
   not required for STL-420's "clear all background assets" button.

2. **Use exact `background_map` tag membership as the only discriminator.**

   Rationale: STL-423 already writes this tag and the bridge contract names it
   as authoritative. Companion tags scope diagnostics and future filters, but
   the clear-all command must not require every companion tag to be present or
   older spawned props could become undeletable.

   Rejected alternatives: clearing by asset id, display name, source prefix, or
   `owner:map_document` alone can delete user props or miss valid background
   props.

3. **Clear only the current authoring shot.**

   Rationale: The stage-import debug flow operates on the current authoring
   shot, and existing bridge prop removal commands are current-shot commands.
   Cross-shot clear would need a broader product decision and event contract.

   Rejected alternatives: clearing every shot in the bundle would surprise
   users and require cross-shot outliner/timeline proof that STL-424 does not
   ask for.

4. **Reuse `ShotModel::remove_prop` for model mutation.**

   Rationale: It already removes the prop, its `initial_state.props` entry, and
   camera target bindings atomically for one prop. Batch clear should compose
   that primitive rather than duplicating model cleanup rules in the engine.

   Rejected alternatives: directly retaining `shot.props` would skip
   `initial_state` and camera-target cleanup; duplicating the logic risks drift.

5. **Pre-collect target IDs before mutation and treat later model failure as an internal rejection with no partial persistence.**

   Rationale: The target list is derived from the same shot before mutation, so
   `remove_prop` should not fail for any collected ID. The implementation must
   either prove that invariant locally or restore the pre-mutation shot before
   rejecting.

   Rejected alternatives: removing while iterating over mutable shot props can
   skip targets or leave half-cleared model state if a later operation fails.

6. **Emit `prop_removed` for each removed prop instead of inventing a batch event.**

   Rationale: `prop_removed` is already the editor-facing event for prop
   deletion. A new batch event would expand the bridge event surface and require
   reducer/UI decisions outside this command.

   Rejected alternatives: only emitting `bundle_changed` makes the outliner and
   listeners rely on broad summaries; adding `background_props_cleared` is a
   larger protocol feature.

7. **No-op clear is accepted and eventless.**

   Rationale: A clear button should be safe when the stage has no imported
   background props. Because no domain state changed, emitting
   `bundle_changed` or `shot_loaded` would make listeners process a false
   mutation. STL-431's UI command status must not depend on a no-op clear event.

   Rejected alternatives: rejecting no-op as `ENTITY_NOT_FOUND` would match
   single-id deletion but violate the clear-all interaction model; emitting
   `bundle_changed` as acknowledgement would overload a domain-change event.

8. **Do not copy unrelated POC code.**

   Rationale: The local `stage-import-bridge-poc` worktree mixes clear command
   sketches with debug cube cache, fixture assets, UI rewrites, and old batch
   spawn code. STL-424 should be the smallest command PR.

   Rejected alternatives: wholesale cherry-pick would reintroduce unrelated
   engine/cache/editor work and make the review about multiple issues.

## Non-Goals

- No `/debug/stage-import` button wiring or UI status work; STL-431 owns it.
- No parser/resolver integration or local map document loading; STL-422 owns it.
- No changes to `spawn_background_props` payload shape or tag writer semantics.
- No new `background_owner` field on `PropModel`.
- No asset catalog deletion, GLB file removal, cache cleanup, or manifest asset removal.
- No cross-shot or whole-bundle background clear.
- No new bridge event type.
- No debug cube mesh/material cache work; STL-437 owns the regression proof.
- No new dependencies or ADR.
- No route, navigation, or CSS changes.

## Implementation Spec

### S0 - Baseline Re-Check

1. Confirm the worktree is clean and based on `origin/main`.
2. Re-run:
   ```bash
   rg -n "ClearBackground|clear_background|background_map|SpawnBackgroundProps|DespawnProp|PropRemoved" crates apps docs contracts MAP.md
   rg -n "remove_prop|initial_state.props|target_binding|BridgeDirtyFlags|shot_loaded_for" crates/shotloom-core crates/shotloom-engine
   ```
3. Confirm `clear_background_props` is still absent before adding it.
4. Read current `despawn_prop` tests before writing batch-clear tests.

### S1 - Add Wire Command

1. Add `BridgeCommand::ClearBackgroundProps` as a unit variant in
   `crates/shotloom-core/src/bridge/mod.rs`.
2. Return `"clear_background_props"` from `BridgeCommand::type_name`.
3. Mark the command as `TransactionClass::DurableMutation`.
4. Add a serde round-trip test asserting exact JSON:
   `{"type":"clear_background_props"}`.
5. Add `ClearBackgroundPropsCommand` to `apps/editor/src/bridge/types.ts`,
   include it in `BridgeCommand`, and add a TypeScript wire-shape test.
6. Add `clear_background_props` to
   `crates/shotloom-core/tests/generate_bridge_fixtures.rs` and generate the
   matching editor snapshot under
   `apps/editor/src/bridge/__tests__/__snapshots__/`.

### S2 - Add Engine Handler

1. Add `handle_clear_background_props_command` in
   `crates/shotloom-engine/src/bridge/handlers/props.rs`.
2. Preflight current bundle and current authoring shot using the same
   no-bundle/no-shot rejection family as `despawn_prop`.
3. Collect `PropId`s whose `PropModel.tags` contains exact `background_map`.
4. If the target list is empty, accept the command without mutating model,
   ECS, selection, `BridgeDirtyFlags`, or bridge events.
5. For non-empty targets, remove each target with `ShotModel::remove_prop`.
   Preserve a pre-mutation shot clone or otherwise prove collected IDs cannot
   fail later.
6. After model mutation succeeds, despawn each matching ECS prop entity with
   the existing `BridgeEntityId` lookup pattern.
7. Remove all corresponding `prop:<id>` values from `SelectedEntities` and
   emit one `SelectionChanged` only when the selection changed.
8. Set `BridgeDirtyFlags::shot_loaded_for` to the changed shot id.
9. Emit events in this order:
   - `PropRemoved` once per removed prop, in current-shot order
   - optional `SelectionChanged`
   - `BundleChanged` once with post-mutation summary

### S3 - Dispatch and Contract Docs

1. Add the `BridgeCommand::ClearBackgroundProps` match arm in
   `crates/shotloom-engine/src/bridge/mod.rs`.
2. Add `docs/ipc/bridge-contract.md` section between
   `spawn_background_props` and `despawn_prop`:
   - purpose
   - unit payload
   - exact tag discriminator
   - current-shot scope
   - no-op accepted behavior
   - rejection code
   - event order
3. Update any command/event table entries that list bridge asset commands.

### S4 - Engine Tests

Add focused tests in `crates/shotloom-engine/src/bridge/tests/props.rs`:

1. Tagged background props are removed, untagged props remain, and Bevy prop
   entity count matches the remaining props.
2. Characters and cine cameras remain; camera target bindings to removed props
   are cleared, and bindings to remaining props/characters stay.
3. Mixed selection is pruned once: removed prop IDs disappear, unrelated
   selections remain, and exactly one `SelectionChanged` is emitted.
4. Unselected removal emits no `SelectionChanged`.
5. No-op clear is accepted and does not emit `PropRemoved`, does not dirty
   `shot_loaded_for`, and leaves model/ECS state unchanged.
6. Missing bundle or no current shot rejects with `EntityNotFound` and leaves
   state unchanged.
7. Event order is `PropRemoved* -> SelectionChanged? -> BundleChanged`, and
   the later coalesced `ShotLoaded` reflects the cleared shot when mutation
   occurred.

## Acceptance Criteria

- [ ] `clear_background_props` exists in Rust core and TypeScript bridge types.
- [ ] The command is a durable mutation and is routed by the engine bridge.
- [ ] Only props with exact `background_map` tags are removed.
- [ ] Untagged props, characters, cameras, tracks, and assets remain.
- [ ] Removed props disappear from `shot.props`, `initial_state.props`, ECS,
  and selection.
- [ ] Camera target bindings to removed props are cleared through
  `ShotModel::remove_prop`.
- [ ] No-op clear is safe, accepted, and eventless.
- [ ] Bridge contract docs describe the new command and event order.
- [ ] Tests cover selective clear, no-op, selection pruning, camera binding,
  rejection preconditions, and event order.

## Verification

Focused gates:

```bash
cargo test -p shotloom-core clear_background_props
cargo test -p shotloom-core --test generate_bridge_fixtures
cargo test -p shotloom-engine bridge::tests::props::clear_background_props
pnpm --filter @shotloom/editor test -- types contract
```

Broad gates before PR:

```bash
cargo fmt --check
cargo clippy --workspace -- -D warnings
pnpm test:web
pnpm validate:docs
```

Manual repro:

- `clear_background_props` after a background batch: imported background props
  disappear, user prop remains, outliner and viewport agree.
- `clear_background_props` on a clean shot: command completes without rejection
  and emits no domain events.
- `clear_background_props` with a removed selected prop and selected character:
  selected prop is pruned; selected character remains selected.
- Missing bundle/no current shot: one `command_rejected` with
  `ENTITY_NOT_FOUND`; model/ECS state remains unchanged.

Persisted artifact proof:

- Tests must assert final `ShotModel.props`, `ShotInitialState.props`, camera
  `target_binding`, ECS prop entities, `SelectedEntities`, and emitted event
  order. A test that checks only prop counts is insufficient.

## Traps

- Do not clear by `asset_id`, display name, or `source:stage_import_debug`;
  users can spawn normal props from the same assets or with the same names.
- Do not retain `shot.props` directly and forget `initial_state.props` or
  camera target binding cleanup.
- Do not emit one `SelectionChanged` per removed prop; batch pruning should be
  one state transition.
- Do not emit a new batch event type unless a separate bridge-contract issue
  asks for it.
- Do not copy `StageDebugCubeAssets` or fixture UI code from the dirty POC
  worktree.
- Do not dirty `shot_loaded_for` on no-op clear.

## Follow-Up Candidates

- STL-431 can wire the Stage Import clear button once this command lands.
- A future scoped clear command may accept `map_id`/`document_id` filters if
  users need per-map cleanup.
- A future typed `background_owner` field may replace tags if the domain model
  needs stronger ownership semantics.
- Editor status can later display the number of cleared props based on emitted
  `prop_removed` events.
