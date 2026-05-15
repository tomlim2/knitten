---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-437 - stage debug cube mesh/material asset reuse
repo: shotloom
linear: STL-437
---

# Reuse stage debug cube render assets

## Cold-Start Summary

`origin/main` already has the durable `spawn_background_props` bridge command,
background prop placement DTOs, ownership tags, diagnostics, event ordering,
and broad engine tests. STL-437 should not add or depend on
`clear_background_props`. The remaining gap is a performance guard for the
stage-import debug cube path: repeated debug cube batch spawns must reuse one
cube `Mesh` and one `StandardMaterial` per debug cube kind instead of adding a
fresh GPU asset per cube. This is a narrow engine/test PR on top of `main`;
clear-all behavior stays in STL-424.

## Current State

| Surface | Path | Classification | Evidence |
|---|---|---|---|
| Background spawn DTO | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | `SpawnBackgroundProps { map_id, document_id, source, placements }` uses `BackgroundPropPlacementDto`. |
| Background spawn handler | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Partial | `spawn_background_props_deferred` prevalidates placements, builds `PropModel`s, calls `crate::entity::spawn_prop`, then emits diagnostics, `PropAdded`, and one `BundleChanged`. |
| Existing debug cube cache | `feat/stage-import-bridge-poc` WIP | Reference only | WIP has `StageDebugCubeAssets`, `StageDebugCubeKind`, cached mesh/material handles, and a regression test, but it targets an older payload shape. |
| Clear command | `origin/main` | Missing / Out of scope | No `ClearBackgroundProps` exists on `main`; STL-424 owns clear-all. |
| Tests | `crates/shotloom-engine/src/bridge/tests/props.rs` | Partial | Background prop tests cover placement, tags, diagnostics, event order, rollback, and duplicate names; no debug cube asset reuse regression exists. |
| Render asset storage | `Assets<Mesh>`, `Assets<StandardMaterial>` in engine tests | Partial | Existing tests already initialize and count Bevy asset resources for prop rendering cases. |
| Material policy | `docs/adr/adr-0031-bevy-material-usage-rules.md` | Codified primitive | Proposed ADR allows shared `StandardMaterial` handles and keeps material ownership in `shotloom-engine`. |
| WASM build | `docs/adr/adr-0017-wasm-vite-integration.md` | Codified primitive | Rust engine changes require `pnpm build:wasm` before the editor consumes updated WASM output. |

## Problem

Map stress cases such as `Map_1038__Stage1` can include many visual debug cubes
for floor, wall, obstacle, and block cells. If every cube spawn adds a new
`Mesh` and `StandardMaterial`, repeated POC loads can grow Bevy's GPU asset
storage in proportion to cube count. The fix should make debug cube rendering
reuse stable handles while preserving the existing durable background prop
model mutation, diagnostics, event order, ownership tags, and non-debug prop
rendering path.

## Locked Decisions

1. **Use `origin/main` as the implementation base.**

   Rationale: STL-423 is Done and `main` now owns the current
   `spawn_background_props` DTO and handler. STL-437's leakage-prevention goal
   can be proven without waiting for the STL-424 clear command.

   Rejected alternatives: basing the plan on `feat/stage-import-bridge-poc`
   would inherit an older bridge payload shape; adding clear-all here would
   expand into STL-424.

2. **Treat the acceptance intent as leak prevention, not clear-command scope.**

   Rationale: Linear's concrete risk is unnecessary `Mesh` /
   `StandardMaterial` growth when debug cube batches are repeatedly loaded.
   Main lacks `clear_background_props`, so the direct regression should repeat
   debug cube spawns and assert render asset counts stay stable after the
   cache is warm.

   Rejected alternatives: a test-only clear helper would not prove the real
   clear command; weakening the test to one spawn would miss the leak class.

3. **Keep the cache debug-cube-only and engine-owned.**

   Rationale: ADR-0031 keeps Bevy materials in `shotloom-engine` and defaults
   to `StandardMaterial`. Debug cubes are a POC visualization path, not a new
   material system or product asset catalog.

   Rejected alternatives: changing `crate::entity::spawn_prop` globally would
   affect normal GLB prop rendering; adding a custom material would need a
   material whitelist decision outside STL-437.

4. **Detect debug cubes from the current background prop model shape.**

   Rationale: `spawn_background_props_deferred` already converts DTOs into
   `PropModel`s with asset id, display name, source tags, and ownership tags.
   The implementation can branch only when the prop is the stage-import debug
   cube asset and the display name identifies `floor`, `wall`, `obstacle`, or
   `block`.

   Rejected alternatives: adding new bridge fields or parser metadata would
   change the protocol; matching every background prop would bypass normal GLB
   rendering.

5. **Preserve batch atomicity and event order.**

   Rationale: the current handler prevalidates, renders valid props, rolls back
   ECS entities on render failure, persists all valid `PropModel`s, then emits
   diagnostics, `PropAdded`, and one `BundleChanged`. The debug cube branch
   must fit inside the render-spawn phase without mutating the model earlier.

   Rejected alternatives: persisting models before debug render spawn would
   create a partial model/ECS state risk; emitting separate events for debug
   cubes would alter STL-423 behavior.

6. **Test all four debug cube kinds in one regression matrix.**

   Rationale: STL-437 names floor, wall, obstacle, and block. The test must
   warm the cache with all four kinds, repeat another batch, and assert exactly
   one mesh plus one material per kind is added by the debug cube path after
   accounting for baseline Bevy assets.

   Rejected alternatives: testing only floor/wall repeats the old WIP gap;
   asserting only entity count would not catch GPU asset growth.

## Non-Goals

- No `clear_background_props` command, TypeScript mirror, or contract section.
- No bridge DTO, wire schema, diagnostic code, or event-order change.
- No parser/resolver change in `crates/shotloom-stage`.
- No editor panel wiring or fixture JSON update.
- No general prop-rendering cache for normal GLB props.
- No custom material, new dependency, ADR amendment, or material whitelist
  change.
- No change to single `spawn_prop_from_asset` selection/gizmo behavior.
- No broad cleanup of the dirty `feat/stage-import-bridge-poc` worktree.

## Implementation Plan

### S0 - Baseline Re-Check

1. Confirm branch `fix/engine-reuse-debug-cube-assets` is clean and based on
   current `origin/main`.
2. Re-run targeted searches:
   ```bash
   rg -n "SpawnBackgroundProps|BackgroundPropPlacementDto|spawn_background_props" crates/shotloom-core crates/shotloom-engine apps/editor/src/bridge docs/ipc
   rg -n "Assets<Mesh>|Assets<StandardMaterial>|spawn_prop\\(|SceneRoot" crates/shotloom-engine/src
   rg -n "prop_debug|debug cube|floor|wall|obstacle|block" crates apps docs contracts
   ```
3. Confirm no `ClearBackgroundProps` symbol exists on the implementation base;
   keep clear behavior out of scope.
4. Set worktree commit identity to `tomlim2 <deemo@vonvon.me>` before the first
   Shotloom commit.

### S1 - Add Debug Cube Render Cache

1. In `crates/shotloom-engine/src/bridge/handlers/props.rs`, add a private
   `StageDebugCubeAssets` resource with:
   - one cached `Handle<Mesh>` for `Cuboid::from_size(Vec3::ONE)`
   - one cached `Handle<StandardMaterial>` per `StageDebugCubeKind`
2. Add a private `StageDebugCubeKind` enum for `Floor`, `Wall`, `Obstacle`, and
   `Block`.
3. Add `stage_debug_cube_kind(model: &PropModel) -> Option<StageDebugCubeKind>`
   that only matches the stage-import debug cube asset id and kind-bearing
   display names.
4. Use `world.init_resource::<StageDebugCubeAssets>()`,
   `world.init_resource::<Assets<Mesh>>()`, and
   `world.init_resource::<Assets<StandardMaterial>>()` in the cache accessor so
   minimal tests and runtime app setup both have the required resources.

### S2 - Route Debug Cubes Through Cached Handles

1. Add a private `spawn_stage_debug_cube(world, model)` helper that creates the
   same ECS identity components as normal prop rendering where relevant:
   `Prop`, `ShotEntityIdComponent`, `BridgeEntityId`, `Name`, transform, and
   pickability.
2. Insert `Mesh3d(cached_mesh)` and
   `MeshMaterial3d(cached_material_for_kind)` instead of a `SceneRoot`.
3. In the existing render-spawn loop inside `spawn_background_props_deferred`,
   branch:
   - debug cube model -> `spawn_stage_debug_cube`
   - everything else -> existing `crate::entity::spawn_prop`
4. Keep the existing rollback behavior: if any later spawn fails, despawn all
   entities already spawned in this batch before returning a rejection.
5. Keep existing diagnostics and `PropAdded` / `BundleChanged` emission
   unchanged. Debug cube spawn should not emit a special event.

### S3 - Add Regression Test

1. In `crates/shotloom-engine/src/bridge/tests/props.rs`, add a helper bundle
   with a `prop_debug` `AssetKind::Prop`.
2. Add `repeated_debug_cube_spawn_reuses_mesh_and_material_assets`.
3. The test shape:
   - record baseline `Assets<Mesh>` and `Assets<StandardMaterial>` counts;
   - spawn one batch containing floor, wall, obstacle, and block debug cubes;
   - record warmed counts and assert the delta is one mesh plus four materials;
   - spawn a second batch with distinct object/display names to avoid model id
     collision with the first batch;
   - assert counts remain equal to the warmed counts.
4. Assert the spawned debug cube entities are present as `Prop` entities and do
   not carry `SceneRoot`, so the test proves the cached cube render path was
   used instead of the GLB prop path.
5. Keep failure messages local and explicit. Do not add unconditional
   `println!` / `eprintln!` output.

### S4 - WASM and Docs Touches

1. Run `pnpm build:wasm` after the Rust change.
2. Include generated WASM package changes only if tracked files change.
3. Avoid docs updates unless code review finds stale comments directly caused
   by the new debug cube path. The bridge contract remains accurate because the
   wire command and event behavior do not change.

## Acceptance Criteria

- [ ] Stage debug cube batch spawn does not create one mesh per cube.
- [ ] Floor, wall, obstacle, and block debug cube materials are cached per kind.
- [ ] Repeated debug cube spawn batches keep `Assets<Mesh>` and
      `Assets<StandardMaterial>` counts stable after cache warm-up.
- [ ] `cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets` passes.
- [ ] `cargo check -p shotloom-engine` passes.
- [ ] `pnpm build:wasm` is run and any tracked WASM output is included.
- [ ] Existing background prop spawn diagnostics, model mutation, event order,
      and non-debug GLB prop rendering remain unchanged.

## Verification

Focused checks:

```bash
cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets
cargo test -p shotloom-engine bridge::tests::props
cargo check -p shotloom-engine
pnpm build:wasm
```

Broader gates before commit/push:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Manual/inspection checks:

- Confirm debug cube entities use `Mesh3d` and `MeshMaterial3d`, not
  `SceneRoot`.
- Confirm normal non-debug background props still call `crate::entity::spawn_prop`.
- Confirm repeated debug cube spawn does not add more than one debug cube mesh
  and four debug cube materials after cache warm-up.
- Confirm no `clear_background_props` or TypeScript bridge change was added.

## Traps

- Do not add `ClearBackgroundProps` to satisfy the older wording of the AC;
  STL-424 owns clear-all.
- Do not copy the WIP implementation verbatim; it used the older
  `BackgroundPropPlacement` / `props` payload shape.
- Do not detect debug cubes by `background_map` alone; normal background GLB
  props also carry that tag.
- Do not let the test pass by only counting spawned entities; the leak risk is
  Bevy asset storage growth.
- Do not assert absolute global asset counts without a baseline delta; test app
  setup can add unrelated assets.
- Do not change existing event order or selection/tool behavior while adding
  the cached render path.

## Follow-Up Candidates

- STL-424 can add `clear_background_props` and later extend the regression to
  cover the real `spawn -> clear -> spawn` user path.
- STL-431 can wire the editor panel to dispatch the current
  `spawn_background_props` and future clear commands.
- STL-432 can add editor-side fixture/command tests for the stage import panel.
