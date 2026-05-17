---
status: completed
created: 2026-05-15
updated: 2026-05-17
load: triggered
trigger: working STL-423 - background prop batch spawn bridge command
repo: shotloom
linear: STL-423
---

# Add Background Prop Batch Spawn Bridge Command

## Cold-Start Summary

Shotloom already has a single-prop `spawn_prop_from_asset` bridge command, prop
model persistence, prop rendering, selection/gizmo behavior, and Stage Import
debug UI placeholders. The remaining STL-423 gap is a bridge-level durable
mutation that accepts pre-resolved map-document prop placements, spawns all
valid background props with authored transforms and ownership tags, reports
per-placement diagnostics for invalid entries, and preserves the existing
viewport-center single-spawn path. This plan does not implement the STL-422
parser/resolver, the STL-424 clear command, or editor button wiring.
As of the current `origin/main`, the stage-map contract and spec have landed;
this command must preserve their `background_owner` identity fields while still
keeping the bridge boundary narrow.
This is suitable for one reviewable PR because it adds one bridge command, its
engine handler, bridge DTO mirrors, contract docs, and focused tests while
leaving parser, clear-all, and editor dispatch integration to sibling issues.

## Current State

| Surface | Path | State | Evidence |
|---|---|---|---|
| Single prop command | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | `BridgeCommand::SpawnPropFromAsset { asset_id, placement }` exists and is durable. |
| Single prop wire contract | `docs/ipc/bridge-contract.md` | Already Done | Section 14.2a documents `spawn_prop_from_asset` with `viewport_center` placement. |
| Single prop TS type | `apps/editor/src/bridge/types.ts` | Already Done | `SpawnPropFromAssetCommand` only accepts `{ mode: "viewport_center" }`. |
| Single prop handler | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | `handle_spawn_prop_from_asset_command` computes viewport placement, then queues `spawn_prop_from_asset_deferred`. |
| Prop persistence | `crates/shotloom-core/src/model/entity.rs` | Partial | `PropModel` has `base_transform` and `tags`; no typed ownership metadata exists. |
| Prop rendering | `crates/shotloom-engine/src/entity.rs` | Already Done | `spawn_prop` consumes a `PropModel` and materializes the GLB scene root. |
| Existing tests | `crates/shotloom-engine/src/bridge/tests/props.rs` | Already Done | Tests cover placement, duplicate ids, rejection preservation, gizmo behavior, and asset-not-found paths. |
| Shared bridge fixtures | `crates/shotloom-core/tests/generate_bridge_fixtures.rs` | Already Done | Generates `SpawnPropFromAsset` and `PropAdded` fixtures; new command/event surfaces need fixture coverage. |
| Stage Import debug UI | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | UI exposes three map buttons but keeps them disabled while waiting for STL-423/STL-424 commands and STL-431 dispatch wiring. |
| Map document contract | `contracts/stage-map/`, `docs/specs/stage-map-document.md` | Already Done | Current `origin/main` includes the schema, minimal example, and spec. The spec defines normalized `map_id` values like `Map_1004:Stage1`, document ids like `Map_1004__Stage1`, and `background_owner` semantics. |
| Roadmap doc | `docs/roadmap/single-stage-import.md` | Missing | Linear cites it, but the file is absent on current `origin/main`. |
| STL-422 parser/resolver | `crates/shotloom-stage`, sibling plan | Missing / In Progress | No landed parser output type or resolver API is available on current `origin/main`; the sibling parser plan owns map-document parsing and GLB resolution, preserves source-space transforms, and defers final viewport conversion. |
| STL-431 dispatch wiring | Linear STL-431 | Backlog | Expects the editor panel to dispatch a `spawn_background_props` bridge command after STL-423 lands. |

## Problem

The current bridge can only spawn one registered prop at the computed viewport
center. Stage Import needs to dispatch a pre-resolved list of background prop
placements with document transforms and continue past entries whose assets are
missing or invalid. Without a dedicated batch command, editor code would need
to fire many single-spawn commands, lose atomic batch reporting, and either
select/gizmo every background prop or invent ownership semantics outside the
engine.

## Locked Decisions

1. **Add a new batch command instead of extending `spawn_prop_from_asset`.**

   Rationale: `spawn_prop_from_asset` is user-facing click-spawn behavior with
   selection and active-tool side effects documented in `bridge-contract.md`
   section 14.2a. Stage Import needs background batch semantics, document transforms,
   per-placement diagnostics, and no per-prop interactive selection churn.

   Rejected alternatives: adding transform modes to `SpawnAssetPlacement` would
   overload a viewport command with map-import semantics; firing many
   `spawn_prop_from_asset` commands would make partial failure reporting and
   final selection deterministic behavior harder to prove.

2. **The command consumes pre-resolved placement DTOs, not raw map documents.**

   Rationale: STL-422 owns parsing and GLB resolution and is not landed on
   current `origin/main`. Its reviewed sibling plan preserves source-space
   transforms rather than producing a bridge DTO directly. STL-423 can still
   define the engine bridge boundary by accepting a list of already-resolved
   prop asset ids plus bridge-ready Shotloom-space authored transforms and
   contract identity fields: normalized `map_id`, `document_id`, and
   per-placement `object_id`. That keeps this PR reviewable and lets STL-422
   and STL-431 connect later without duplicating parser logic inside the bridge
   handler.

   Rejected alternatives: parsing map JSON inside the bridge handler would
   cross issue boundaries; waiting for a concrete STL-422 Rust type would block
   all bridge contract work even though the command DTO can express the narrow
   required input.

3. **Use Shotloom-space `ModelTransform` for document placement on the wire.**

   Rationale: `PropModel.base_transform` already persists `ModelTransform`, and
   `entity::transform_from_model` already converts that model transform into a
   Bevy transform. Sending the same shape avoids a second transform DTO and
   makes tests assert the final persisted prop transform directly. The command
   docs must state that payload transforms are already in Shotloom meters,
   Y-up/right-handed, and `rotation_euler_xyz_deg` convention. STL-423 does not
   parse or convert `story_previz_unreal` source transforms in the handler; a
   later integration layer must convert parser output before dispatching
   `spawn_background_props`.

   Rejected alternatives: sending only translation would fail the rotation and
   scale acceptance criteria; sending a matrix would invent a new transform
   convention without an in-repo primitive; accepting raw stage-map
   `story_previz_unreal` transforms would pull parser/integration conversion
   scope into this bridge command PR.

4. **Store ownership as `PropModel.tags` in this PR.**

   Rationale: `PropModel.tags` is already persisted through `BundleModel` and
   avoids a domain-model schema expansion while still preserving the landed
   stage-map ownership semantics. The command must add deterministic tags such
   as `background_map`, `owner:map_document`, `map:<normalized_map_id>`,
   `document:<document_id>`, and `source:stage_import_debug` so STL-424 can
   filter by ownership without deleting user-spawned props.

   Rejected alternatives: adding a typed `background_owner` field now would be
   a core domain-model change outside STL-423's bridge scope; using display
   names or asset ids for ownership would also match user-spawned props using
   the same GLB.

5. **Partial success is explicit and deterministic.**

   Rationale: The acceptance criteria require unresolved assets to become
   diagnostics without aborting the whole batch. The handler should preflight
   every placement for asset kind, shot availability, transform finiteness, and
   duplicate id derivation before mutating the model. Valid placements spawn;
   invalid placements emit diagnostics. The command rejects only when no
   placement can be applied or no shot/bundle exists.

   Rejected alternatives: all-or-nothing failure would violate partial asset
   handling; mutating one prop at a time before validating later placements can
   persist a half-planned batch if a later non-asset error appears.

6. **Batch mutation preserves one final selection/event sequence.**

   Rationale: Background imports are not interactive prop placement. Existing
   user selection and active tool should remain stable unless the product later
   asks the Stage Import panel to select imported props. The batch should emit
   `PropAdded` for each spawned prop, one `ValidationDiagnostics` event when
   diagnostics exist, and one `BundleChanged` after all model mutations.

   Rejected alternatives: selecting the last imported background prop would
   hijack user context; emitting `BundleChanged` after each prop makes batch
   verification noisy and weakens atomicity.

## Non-Goals

- No raw map document JSON parser or GLB resolver implementation.
- No `contracts/stage-map/` schema or stage-map spec changes unless a tiny
  bridge-reference note is required; the stage-map contract already exists.
- No STL-424 clear-all command.
- No Stage Import button dispatch wiring or UI enablement.
- No `.gltf` or multi-file prop import support.
- No prop asset registration or preflight changes.
- No typed `background_owner` model field in this bridge command PR.
- No new dependency, ADR, or broad route/navigation change.

## Implementation Plan

### S0 - Baseline Re-Check

1. Confirm current branch is clean and based on `origin/main`.
2. Re-run:
   ```bash
   rg -n "SpawnPropFromAsset|SpawnAssetPlacement|PropAdded|ValidationDiagnostics" crates apps docs contracts MAP.md
   rg -n "StageImport|Map_1004|background_map|source:stage_import_debug|map:" crates apps docs contracts MAP.md
   ```
3. Confirm `contracts/stage-map/` and `docs/specs/stage-map-document.md` still
   match the ownership boundary, then confirm whether
   `docs/roadmap/single-stage-import.md` has landed.
4. Confirm existing `spawn_prop_from_asset` tests pass before changing the
   command surface:
   ```bash
   cargo test -p shotloom-engine bridge::tests::props::spawn_prop_from_asset
   ```

### S1 - Add Core Bridge DTOs

1. In `crates/shotloom-core/src/bridge/mod.rs`, add a new command:
   `SpawnBackgroundProps` with wire type `spawn_background_props`, matching
   STL-431's editor dispatch name.
2. Payload shape:
   - `map_id: String`
   - `document_id: String`
   - `source: String`
   - `placements: Vec<BackgroundPropPlacementDto>`
3. Validate batch identity before turning it into persistent tags:
   - `map_id` is the normalized stage-map id, e.g. `Map_1004:Stage1`
   - `document_id` is the file-stem id, e.g. `Map_1004__Stage1`
   - `source`, `object_id`, and incoming placement tags are non-empty
     slug-like strings before persistence
   Reject the whole command only for invalid batch-level `map_id`,
   `document_id`, or `source`; emit placement diagnostics for invalid
   per-placement object ids or tags.
4. `BackgroundPropPlacementDto` fields:
   - `asset_id: String`
   - `transform: ModelTransform` in Shotloom meters, Y-up/right-handed, and
     `rotation_euler_xyz_deg` convention
   - `object_id: Option<String>`
   - `display_name: Option<String>`
   - `tags: Vec<String>`
5. Convert DTO tags into `PropModel.tags` at the model boundary; bridge DTOs
   should stay plain `Vec<String>` unless existing bridge conventions require a
   different container.
6. Add serde round-trip tests for:
   - one placement with translation, rotation, and scale
   - an empty placement list, if the chosen command behavior rejects it
   - optional fields omitted
7. Mark the command as `TransactionClass::DurableMutation`.

### S2 - Add Engine Handler With Prevalidation

1. Add a handler in `crates/shotloom-engine/src/bridge/handlers/props.rs` or a
   focused sibling module if the file becomes too dense.
2. Preflight before the first mutation:
   - bundle loaded
   - current authoring shot exists
   - non-empty placements
   - each asset id exists and is `AssetKind::Prop`
   - each transform has finite translation, rotation, and scale values
   - deterministic prop ids/display names can be derived without collision
3. Build an in-memory list of valid `PropModel`s and diagnostics. Do not write
   to `BundleModel` until this list is complete.
4. For each valid placement:
   - derive prop id using the existing duplicate-suffix policy
   - use placement `display_name` when present, otherwise the asset display name
   - set `base_transform` from the DTO `ModelTransform`
   - set tags to include `background_map`, `owner:map_document`,
     `map:<map_id>`, `document:<document_id>`, `source:<source>`, and optional
     `object:<object_id>`
5. Spawn render entities for valid props and collect render warnings as
   diagnostics. `entity::spawn_prop` returns the spawned `Entity`; keep those
   ids until the batch commits. If a render spawn fails after model
   prevalidation, roll back any already spawned ECS entities and do not persist
   any prop models.
6. Once render spawning succeeds for all valid props, append all valid props to
   the current shot in one model mutation.
7. Set bridge dirty state once for the final shot/bundle mutation, matching the
   existing single-prop handler's persistence behavior without repeating it per
   prop.
8. Emit events in deterministic order:
   - `ValidationDiagnostics` if diagnostics exist
   - `PropAdded` for each valid prop
   - `BundleChanged` once
9. Do not emit `SelectionChanged` or `ActiveToolChanged` for this background
   batch command.

### S3 - Wire Dispatch and Diagnostics

1. Wire the new command in `crates/shotloom-engine/src/bridge/mod.rs`.
2. Diagnostic source: use `stage_import_debug` for bridge-level diagnostics
   emitted by this command. Do not rename or collapse upstream
   `stage_map_document` parser diagnostics from STL-422 if a later wiring path
   passes them through.
3. Diagnostic codes:
   - `background_prop_batch_empty`
   - `background_prop_asset_missing`
   - `background_prop_asset_unsupported`
   - `background_prop_transform_invalid`
   - `background_prop_tag_invalid`
   - `background_prop_spawn_failed`
   - `background_prop_spawn_warning`
4. Use `CommandRejected` for whole-command failures only:
   - no bundle/current shot
   - empty placement list
   - zero valid placements after preflight
   - render spawn failure that prevents safe persistence
5. Keep diagnostic messages mapper-owned and stable. Do not build ad hoc
   user-facing strings at individual call sites.

### S4 - Update TS Types, Fixtures, and Contract Docs

1. Update `apps/editor/src/bridge/types.ts` with the new command type and
   placement DTO.
2. Update `apps/editor/src/bridge/__tests__/types.test.ts`.
3. Update `crates/shotloom-core/tests/generate_bridge_fixtures.rs` with at
   least one command fixture and correlated event fixtures under the same
   `command_id` for diagnostics plus successful props, staying within the
   generator's current command/event fixture shape.
4. Regenerate or update bridge snapshots under
   `apps/editor/src/bridge/__tests__/__snapshots__/`.
5. Update `docs/ipc/bridge-contract.md` with:
   - command purpose
   - wire name `spawn_background_props`
   - payload
   - transform coordinate convention
   - event order
   - partial success semantics
   - rejection/diagnostic codes
   - explicit note that it consumes pre-resolved placements, not raw map JSON
6. Update `MAP.md` only if the bridge command adds a new lookup target.

### S5 - Engine Test Coverage

Add or extend `crates/shotloom-engine/src/bridge/tests/props.rs` tests for:

1. Batch command spawns two valid props using authored transforms.
2. Spawned props carry `background_map`, `owner:map_document`, `map:<map_id>`,
   `document:<document_id>`, `source:stage_import_debug`, and
   `object:<object_id>` tags.
3. One missing asset produces a diagnostic while another valid asset spawns.
4. All-invalid placements emit diagnostics and `CommandRejected` without
   mutating the shot.
5. Invalid transform emits a diagnostic and does not mutate the shot.
6. Invalid placement tag/object id emits a diagnostic and does not mutate that
   placement.
7. Invalid normalized `map_id` or `document_id` rejects before mutation.
8. Existing `spawn_prop_from_asset_*` tests still pass and still select/promote
   tools for the single-spawn path.
9. Batch command does not emit `SelectionChanged` or `ActiveToolChanged`.
10. Render spawn failure leaves no partial persisted prop models and no leftover
   ECS props from earlier valid placements.

## Acceptance Criteria

- [ ] A new bridge command accepts a batch of pre-resolved prop placements.
- [ ] Each valid placement spawns a prop with its supplied `ModelTransform`.
- [ ] Spawned background props include stable ownership tags derived from
      stage-map `background_owner` identity for STL-424.
- [ ] Missing or unsupported assets emit diagnostics without blocking valid
      placements in the same batch.
- [ ] Whole-command failures reject without mutating the model.
- [ ] Existing `spawn_prop_from_asset` behavior and tests are unchanged.
- [ ] Rust bridge serde tests cover the new command DTO.
- [ ] TypeScript bridge types and tests mirror the Rust DTO.
- [ ] Shared bridge fixtures/snapshots cover the new command and diagnostics.
- [ ] `docs/ipc/bridge-contract.md` documents the command, event order,
      diagnostics, and non-parser boundary.
- [ ] Linear relation to STL-420 remains intact; no durable doc embeds concrete
      Linear IDs outside this plan artifact.

## Verification

Focused checks:

```bash
cargo fmt --check
cargo test -p shotloom-core spawn_background_props
cargo test -p shotloom-core --test generate_bridge_fixtures
cargo test -p shotloom-engine bridge::tests::props
pnpm test:web -- src/bridge/__tests__/types.test.ts
pnpm test:web -- src/bridge/__tests__/contract.test.ts
node scripts/validate-doc-paths.mjs
```

Broader gates after focused checks are green:

```bash
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
pnpm validate:rust
pnpm test:web
pnpm validate:docs
```

Manual repro before STL-431 can use direct bridge command injection; after
STL-431 wires the Stage Import debug panel, repeat the same cases through the
UI buttons:

1. Open the Stage Import debug panel.
2. Load a bundle.
3. Dispatch the two-prop map fixture.
4. Confirm the viewport shows two background props at non-viewport-center
   transforms.
5. Confirm existing user selection and active tool are unchanged.
6. Dispatch a mixed valid/missing batch and confirm valid props spawn while
   `background_prop_asset_missing` appears in diagnostics.
7. Dispatch a mixed valid/unsupported-asset batch and confirm valid props spawn
   while `background_prop_asset_unsupported` appears in diagnostics.
8. Dispatch an empty placement list and confirm the shot's prop count is
   unchanged, `background_prop_batch_empty` appears, and `CommandRejected` is
   emitted.
9. Dispatch an all-invalid batch and confirm the shot's prop count is unchanged
   and `CommandRejected` is emitted.
10. Dispatch an invalid transform batch and confirm
   `background_prop_transform_invalid` appears.
11. Dispatch a placement with an invalid object/tag value and confirm
    `background_prop_tag_invalid` appears without mutating that placement.
12. In a test harness or forced render-failure path, confirm
    `background_prop_spawn_failed` rejects without persisted props or leftover
    ECS entities.
13. In a test harness with a non-fatal render warning, confirm
    `background_prop_spawn_warning` is surfaced while valid props persist.
14. Use the existing World Assets prop click-spawn path and confirm it still
   selects the spawned prop and promotes Select to Translate.

## Traps

- Do not parse map document JSON in this PR; STL-422 owns parser/resolver work.
- Do not treat a document id like `Map_1004__Stage1` as the normalized
  `map_id`; preserve it separately as `document_id`.
- Do not convert `story_previz_unreal` source transforms in the bridge handler;
  STL-422 may preserve source transforms, and the STL-431/STL-420 integration
  path must convert before dispatching this command.
- Do not enable Stage Import UI buttons; STL-425 already landed the fixed
  disabled panel skeleton, STL-431 owns dispatch wiring, and STL-420 owns the
  end-to-end debug POC.
- Do not implement clear-all or delete props by asset id; STL-424 owns
  ownership-filtered removal.
- Do not add a typed `background_owner` field in this bridge command PR.
- Do not change single-prop selection/gizmo semantics while adding batch
  background semantics.
- Do not emit `BundleChanged` per prop; the batch command needs one final
  durable mutation signal.
- Do not persist valid props before proving later valid props can render or be
  rolled back.
- Do not use concrete Linear issue IDs in durable repo docs or code comments.

## Follow-Up Candidates

- STL-422 parser/resolver can map real map documents into the new command DTO
  with `background_owner` identity fields once an integration layer converts
  source transforms into bridge-ready `ModelTransform` values.
- STL-424 clear-all command can filter on `background_map`,
  `owner:map_document`, `map:<map_id>`, and `document:<document_id>` tags.
- STL-431 debug panel can enable buttons and dispatch fixed map payloads;
  STL-425 can then exercise the full debug POC flow. That wiring must include
  the source-transform conversion or call a dedicated conversion helper before
  dispatch.
- A future model PR can replace tags with typed `background_owner` metadata once
  the product wants a durable domain field instead of tag-backed ownership.
- A later UX pass can summarize batch results in the debug panel instead of
  relying only on diagnostic events.
