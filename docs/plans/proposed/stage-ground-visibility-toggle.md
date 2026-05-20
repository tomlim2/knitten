---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-488
repo: shotloom
linear: STL-488
briefing: ../../briefings/shotloom/stage-ground-visibility-toggle.md
branch: feat/stage-ground-visibility-toggle
---

# Stage Ground Visibility Toggle

## Spec Contract

- Briefing basis: `STL-488` is an independent Shotloom issue for hiding the
  engine-owned void floor during `/debug/stage-import` sample map loads and
  restoring it when the sample is cleared.
- Current truth: the void floor exists as a `StageGround` ECS entity; background
  sample props are ordinary `PropModel` entries tagged `background_map`; clear
  already deletes only those tagged props.
- Required change: add a runtime-only bridge command that toggles
  `StageGround` `Visibility`, remember that runtime state across void-stage
  rebuilds, make the void floor use the shared `PlaceholderMaterial`, and wire
  the stage import debug panel to hide/clear/load or show/clear.
- Locked boundary: no authored Stage visibility contract, no prop/character
  visibility feature, no bundle schema change, no new durable bridge event, no
  change to `clear_background_props` deletion semantics, and no new asset pack.
- Proof method: Rust bridge serde/kind/transaction tests, engine handler and
  void-stage material tests, editor dispatch-order tests, and focused bridge
  contract documentation.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Void ground marker | `crates/shotloom-engine/src/stage_setup.rs::StageGround` | Already Done | The startup void floor carries `StageGround`; `spawn_placement.rs` uses this marker for floor snaps. |
| Runtime ground visibility state | N/A | Missing | No resource records whether rebuilt `StageGround` entities should spawn visible or hidden. |
| Void ground material | `spawn_void_stage` | Partial | The floor currently receives a freshly created mood-colored `StandardMaterial`, not the shared placeholder handle. |
| Placeholder material | `crates/shotloom-engine/src/materials/placeholder.rs::PlaceholderMaterial` | Already Done | ADR-0031-backed shared checker `Handle<StandardMaterial>` resource exists with repeat/nearest sampler tests. |
| Stage handler module | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Partial | Owns clear color, stage mood, and new bundle handlers; no ground visibility handler exists. |
| Bridge command enum | `crates/shotloom-core/src/bridge/mod.rs::BridgeCommand` | Missing | No `SetStageGroundVisible` variant, kind string, serde roundtrip, or transaction classification. |
| Transaction classification | `BridgeCommand::transaction_class` | Partial | `RuntimeOnly` exists and is used for preview/runtime commands; the new command must join this class. |
| TypeScript bridge mirror | `apps/editor/src/bridge/types.ts` | Missing | No `SetStageGroundVisibleCommand` in the union. |
| Stage import panel | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | Load buttons dispatch `spawn_background_props`; clear dispatches `clear_background_props`; no ground visibility command is dispatched. |
| Clear background props | `docs/ipc/bridge-contract.md` §14.2c, `props.rs` | Already Done | Removes current-shot props with exact `background_map` tag; no-op is accepted and eventless. |
| Bridge docs | `docs/ipc/bridge-contract.md` | Partial | Documents spawn/clear; does not document the new runtime-only ground visibility command. |
| Stage import tests | `StageImportDebugPanel.test.tsx` | Partial | Cover route, actions, spawn payloads, clear payload, and command status; no dispatch order proof for ground hide/show exists. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-488` |
| State | In Progress |
| Project | Shotloom - bravo |
| Related issues | `STL-425` is related; this issue is not a child issue. |
| AC summary | Hide default void floor on `Map_1004`, `Map_1006`, `Map_1038` loads; restore on clear; preserve background prop clear semantics; use existing placeholder material on the void floor; keep new command runtime-only; add Rust, engine, editor, and contract proof. |
| Blockers | None identified after Linear cleanup. |
| Related PRs | No active PR for `feat/stage-ground-visibility-toggle` yet. |
| Current review state | Spec review before implementation. |
| Planning consequence | This is suitable for one small PR because it adds one command, one handler, one stage setup material change, one panel dispatch change, and tests/docs for those surfaces. |

## Problem

Stage import sample maps spawn background props into the active shot, but the
default engine-owned void floor remains visible at Y=0. That floor is useful
for normal empty-scene placement, yet it visually conflicts with imported
background map floors. Existing clear semantics already remove sample props
without deleting user props, but they do not control the void floor because the
floor is not an authored `PropModel`.

The fix is not to delete the floor or broaden `clear_background_props`. The fix
is to add a runtime presentation command that hides the `StageGround` entity
while the stage import sample is loaded and shows it again when the panel clears
the sample.

## Requirements

1. Add a bridge command named `set_stage_ground_visible` with payload
   `{ visible: boolean }`. This traces to `STL-488` and the existing bridge
   command pattern in `BridgeCommand`.
2. Classify `set_stage_ground_visible` as `TransactionClass::RuntimeOnly`.
   It must not require transaction ids, open an auto-wrap frame, mark bundle
   dirty, enter undo/redo history, or emit `bundle_changed`. This traces to
   `docs/arch/transaction-bridge-lifecycle.md`.
3. Document `set_stage_ground_visible` in `docs/ipc/bridge-contract.md` as a
   runtime-only presentation command. Success is eventless; failure uses the
   existing `command_rejected` event.
4. Add an engine handler that queries entities with `StageGround` and mutates
   only their `Visibility` component to `Visibility::Visible` or
   `Visibility::Hidden`.
5. If no `StageGround` entity exists when the command is handled, reject the
   command with `CommandRejectionCode::EntityNotFound` and a message naming
   the missing `StageGround`.
6. Add a runtime-only engine resource that stores the desired
   `StageGround` visibility. The bridge handler must update this resource, and
   void-stage setup/rebuild must apply it when spawning a new `StageGround`.
   The resource defaults to visible and is not serialized.
7. The handler must not mutate `BundleModel`, `BridgeDirtyFlags`,
   `SelectedEntities`, prop ECS entities, character ECS entities, lights,
   cameras, transforms, mesh handles, or material handles.
8. Change void-stage setup so the default `StageGround` uses the existing
   shared `PlaceholderMaterial` handle. It must retain the `StageGround` marker,
   explicit `Visibility`, mesh, transform, and stage lifecycle markers used by
   click-spawn and rebuild flows.
9. The placeholder material change must apply only to the engine-owned
   `StageGround`. Imported background props, user props, characters, and future
   authored Stage elements must keep their existing material paths.
10. Wire `StageImportDebugPanel` load buttons to dispatch
    `set_stage_ground_visible { visible: false }`,
    `clear_background_props`, and the sample-backed `spawn_background_props`
    command in a stable order. The clear step removes stale background props
    before the new selected map sample is spawned.
11. Wire `StageImportDebugPanel` clear action to dispatch
    `set_stage_ground_visible { visible: true }` and the existing
    `clear_background_props` command in a stable order.
12. Keep command status UX tied to the final user-meaningful background command
    id: the spawn command for load actions and the clear command for clear
    actions. Do not use the auxiliary ground visibility command id or the
    load-action stale-clear command id for the visible status line.
13. Preserve existing `clear_background_props` behavior: exact
    `background_map` prop deletion, user prop preservation, selection cleanup,
    camera-binding cleanup, and eventless no-op.

## Locked Decisions

1. **Use a runtime-only bridge command, not authored Stage visibility.**

   Rationale: the user intent is to keep imported sample maps inspectable, not
   to introduce a durable visibility model. `StageGround` is engine-owned
   runtime presentation state. A runtime resource may remember the current
   visible/hidden choice across engine-side stage rebuilds, but that resource
   must not serialize into the bundle.

   Rejected alternatives: adding prop/character visibility, adding Stage model
   visibility fields, storing the floor state in the bundle, or treating the
   command as a durable mutation.

2. **Make successful ground visibility changes eventless.**

   Rationale: the panel does not need a new success acknowledgement to update
   authored UI state, and emitting `bundle_changed` or a new durable event would
   imply an authored state change. Existing command rejection events are enough
   for abnormal missing-ground cases.

   Rejected alternatives: adding `stage_ground_visibility_changed`, reusing
   `StageMoodChanged`, emitting `bundle_changed`, or adding editor-only local
   success events.

3. **Target `StageGround`, not names, tags, materials, or prop ids.**

   Rationale: `StageGround` is already the semantic marker used by engine
   placement logic. Names, prop tags, and material handles are not authoritative
   identity for the default void floor.

   Rejected alternatives: matching `Name("void_stage_ground")`, matching the
   placeholder material handle, matching `background_map`, or querying every
   mesh on Y=0.

4. **Use the existing `PlaceholderMaterial` shared handle for the void floor.**

   Rationale: ADR-0031 already defines a shared checker fallback resource and
   the user explicitly wants the ground to use placeholder material. Reusing
   the existing resource avoids a second floor-only material convention.

   Rejected alternatives: adding a new custom ground material, keeping the
   mood-colored ground material, adding a second checker resource, or changing
   imported prop materials to placeholder.

5. **Keep `clear_background_props` independent from floor visibility.**

   Rationale: clear is a durable model mutation over `PropModel.tags`, while
   floor visibility is runtime ECS presentation state. Combining them would make
   a safe prop cleanup command mutate unrelated engine-owned presentation state.

   Rejected alternatives: making clear delete `StageGround`, making clear toggle
   visibility inside the engine handler, or reinterpreting `background_map` as a
   floor/Stage discriminator.

## Non-Goals

- Do not add authored visibility for props, characters, cameras, or Stage
  entities.
- Do not add or change `StageModel`, bundle schema, save/load format, or
  active-stage selection.
- Do not change S2M asset import, `assets/s2m_props`, sample map fixture data,
  or Story Previz API behavior.
- Do not change `spawn_background_props` payload shape, diagnostics, partial
  success, or rollback behavior.
- Do not broaden `clear_background_props` beyond exact `background_map` props.
- Do not add a new custom Bevy `Material` implementation or amend the custom
  material whitelist.
- Do not change viewport click-spawn floor semantics beyond keeping the
  `StageGround` marker intact while the mesh is hidden.
- Do not create a dynamic local map-document picker or production Stage import
  UX.

## Implementation Spec

### Stage 0: Baseline Re-Check

Before editing Shotloom source, re-run:

```sh
git status --short
rg -n "StageGround|PlaceholderMaterial|clear_background_props|spawn_background_props|transaction_class|StageImportDebugPanel" crates apps docs contracts
```

Confirm the branch is `feat/stage-ground-visibility-toggle`, the worktree is
clean, and no unrelated user edits are present.

### Stage 1: Bridge Contract and Types

Add `SetStageGroundVisible { visible: bool }` to
`crates/shotloom-core/src/bridge/mod.rs`.

Implementation details:

- `#[serde(tag = "type", content = "payload", rename_all = "snake_case")]`
  should serialize it as:

  ```json
  {
    "type": "set_stage_ground_visible",
    "payload": { "visible": false }
  }
  ```

- `BridgeCommand::kind()` returns `"set_stage_ground_visible"`.
- `BridgeCommand::transaction_class()` returns
  `TransactionClass::RuntimeOnly`.
- Add Rust tests for serde roundtrip, JSON shape, kind, and transaction class.
- Add `SetStageGroundVisibleCommand` to
  `apps/editor/src/bridge/types.ts` and include it in `BridgeCommand`.
- Add TypeScript bridge type tests for the wire shape.
- Update `docs/ipc/bridge-contract.md` with a concise section near runtime
  stage commands or the stage import command section.

Verification:

```sh
cargo test -p shotloom-core stage_ground_visible
pnpm test:web -- apps/editor/src/bridge/__tests__/types.test.ts
```

### Stage 2: Engine Handler

Add a handler in `crates/shotloom-engine/src/bridge/handlers/stage.rs` and
route the command from `crates/shotloom-engine/src/bridge/mod.rs`.

Handler behavior:

- update a runtime-only `StageGroundVisibilityRes`-style resource, defaulting
  to visible;
- query `Entity`/`Visibility` for `With<StageGround>`;
- set every matching entity to `Visibility::Visible` or
  `Visibility::Hidden`;
- reject with `CommandRejectionCode::EntityNotFound` when the query is empty;
- emit no success event;
- leave bridge dirty flags, bundle model, selection, transforms, material
  handles, and spawned prop/character entities untouched.

Tests should live with the bridge tests rather than only the stage setup unit
tests, because the command routing and transaction behavior are part of the
contract.

Verification:

```sh
cargo test -p shotloom-engine stage_ground_visible
```

### Stage 3: Void Floor Placeholder Material

Change `crates/shotloom-engine/src/stage_setup.rs` so the default
`StageGround` uses the existing `PlaceholderMaterial` shared handle.

Implementation requirements:

- retain `StageEntity`, `StageGround`, `Name::new("void_stage_ground")`,
  mesh setup, explicit `Visibility`, and `Transform::IDENTITY`;
- read the runtime visibility resource when spawning the ground so a hidden
  floor stays hidden after `rebuild_stage_on_change`;
- use `MeshMaterial3d(placeholder_material.handle().clone())` or the local
  equivalent;
- do not change directional light, ambient light, clear color, mood resolution,
  or stage rebuild lifecycle;
- add tests proving the `StageGround` material handle is the placeholder handle
  and that the key light is not a mesh/material consumer;
- add a rebuild test proving hidden runtime ground visibility is applied to the
  rebuilt `StageGround`;
- preserve existing `void_stage_spawns_ground_and_light`,
  `mood_change_rebuilds_stage`, and click-spawn-relevant markers.

If startup ordering makes `PlaceholderMaterial` unavailable in the stage setup
test harness, seed the resource in the test app. Do not add a second fallback
material path for production runtime.

Verification:

```sh
cargo test -p shotloom-engine stage_setup
```

### Stage 4: Editor Debug Panel Wiring

Update `apps/editor/src/components/debug/StageImportDebugPanel.tsx`.

Load action sequence:

1. dispatch `{ type: "set_stage_ground_visible", payload: { visible: false } }`;
2. dispatch the existing `{ type: "clear_background_props" }` command to remove
   stale background-map props from a previous sample;
3. dispatch the existing `spawn_background_props` command;
4. store the spawn command id as the command id shown in status text.

Clear action sequence:

1. dispatch `{ type: "set_stage_ground_visible", payload: { visible: true } }`;
2. dispatch the existing `{ type: "clear_background_props" }`;
3. store the clear command id as the command id shown in status text.

This sequence keeps the status UI focused on the durable background command
that finishes the user action while treating the ground visibility command and
the load-action stale-clear command as auxiliary steps.

Tests:

- load buttons dispatch hide, stale-clear, and the matching spawn command for
  all three sample maps;
- clear dispatches the show command immediately before `clear_background_props`;
- disabled bridge/bundle states dispatch neither command;
- load command status uses the spawn command id, not the auxiliary visibility
  or stale-clear command ids;
- clear command status uses the clear command id, not the auxiliary visibility
  command id.

Verification:

```sh
pnpm test:web -- apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx
```

### Stage 5: Regression Gates

Run focused gates first, then broader checks if the patch remains small:

```sh
cargo test -p shotloom-core stage_ground_visible
cargo test -p shotloom-engine stage_ground_visible
cargo test -p shotloom-engine stage_setup
pnpm test:web -- apps/editor/src/bridge/__tests__/types.test.ts
pnpm test:web -- apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx
```

If touched code expands beyond the named files, escalate to:

```sh
pnpm validate:rust
pnpm test:web
pnpm validate:docs
```

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This command has no external IO, parser, or wrapped lower-level error. | Use `CommandRejectionCode::EntityNotFound` for missing `StageGround`; no new error enum needed. | N/A: no `Error::source()` chain is introduced. |
| Schema / serialization compatibility | yes | `BridgeCommand` and TS bridge union define command wire shape. | Additive command only; no protocol version bump because `PROTOCOL_VERSION` says additive commands are non-breaking. | Rust serde JSON shape test and TS command shape test. |
| Ownership / API boundary | yes | `StageGround` is engine-owned ECS state; props/characters are authored model entities. | Handler queries only `With<StageGround>` and does not touch `BundleModel`. | Engine handler test with other visible entities unchanged. |
| Partial mutation / rollback | yes | A missing ground can reject before any mutation; multiple grounds are unlikely but possible after a bug. | Query first, reject when empty, then set all matching grounds to the same visibility. No bundle mutation means no rollback frame. | Test empty query rejection and non-empty query visibility update. |
| Diagnostic ownership | no | No validation diagnostics are introduced. | Use existing `command_rejected` for missing runtime entity. | Rejection event assertion in engine test. |
| Test oracle strength | yes | UI behavior depends on command order and status id selection. | Assert exact dispatch sequence and status command id in React tests. | StageImportDebugPanel dispatch-order tests fail before implementation. |
| Scope creep | yes | Adjacent authored visibility and Stage authoring specs exist. | Non-goals exclude authored visibility, Stage model fields, prop/character visibility, and dynamic import UX. | Changed file set should stay within bridge/types, stage handler/setup, debug panel, docs/tests. |
| Reviewer objection | yes | Reviewers may object that hidden floor could break click-spawn floor picking or that load now clears stale samples. | Preserve `StageGround` marker and entity; toggle only `Visibility`. Clear only exact `background_map` props before a new load. Treat click-spawn behavior as unchanged outside the hidden debug-sample presentation state. | Existing click-spawn tests plus no transform/mesh/despawn mutation in handler test; panel dispatch-order test proves the stale-clear is intentional. |
| Stage rebuild drift | yes | `rebuild_stage_on_change` despawns and respawns stage entities when `StageRequestRes` changes. | Store desired ground visibility in runtime state and apply it when spawning/rebuilding `StageGround`. | Rebuild test: hide ground, trigger rebuild, assert rebuilt ground remains hidden. |
| Bevy startup ordering | yes | `PlaceholderMaterialPlugin` inserts the resource on startup; `setup_void_stage` also runs on startup. | Use the existing shared resource and keep tests explicit about resource availability. If production ordering fails, wire ordering locally rather than adding a second material. | Stage setup material test and full engine startup smoke if needed. |
| Bridge history pollution | yes | Durable commands are auto-wrapped; runtime commands are not. | Classify as `RuntimeOnly` and test classification. | `transaction_classes_are_stable_for_lifecycle_commands` or new dedicated test. |
| Contract/document drift | yes | New bridge command is a protocol surface. | Update `docs/ipc/bridge-contract.md` with eventless success and rejection semantics. | `pnpm validate:docs`; review confirms docs match tests. |

## Traps

- Do not implement this by deleting `StageGround`; click-spawn and empty-scene
  presentation depend on the entity remaining available.
- Do not fold the behavior into `clear_background_props`; that command is
  already a durable prop deletion primitive with eventless no-op semantics.
- Do not infer floor identity from `Name`, material handle, or a prop tag.
  `StageGround` is the authoritative marker.
- Do not add a new custom checker material; ADR-0031 already defines the shared
  placeholder resource.
- Do not let a mood/stage rebuild silently reset a hidden debug-import floor to
  visible; runtime state must be reapplied to rebuilt `StageGround` entities.

## One-PR Suitability

This is suitable for one PR. The PR touches one additive bridge command, one
runtime handler, one void-stage material assignment, one debug panel dispatch
path, and contract/tests for those surfaces. It deliberately excludes authored
visibility, Stage model persistence, dynamic import UX, and asset pack changes.

## Verification Checklist

- [ ] `set_stage_ground_visible` Rust serde/kind/transaction tests pass.
- [ ] TypeScript bridge command shape test passes.
- [ ] Engine handler hides/shows only `StageGround`.
- [ ] Engine handler rejects missing `StageGround` with `ENTITY_NOT_FOUND`.
- [ ] Runtime ground visibility survives a void-stage rebuild.
- [ ] Void-stage setup uses the existing `PlaceholderMaterial` handle for the
  ground.
- [ ] Imported background props, user props, and characters keep their existing
  material paths.
- [ ] Stage import load buttons dispatch hide, stale-clear, then spawn.
- [ ] Stage import clear dispatches show then clear.
- [ ] Stage import status continues tracking the spawn/clear command id.
- [ ] Existing `clear_background_props` tests still pass.
- [ ] Docs mention runtime-only/eventless success and rejection semantics.
