---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: STL-437
repo: shotloom
linear: STL-437
briefing: ../briefings/shotloom/engine-reuse-debug-cube-assets.md
---

# Reuse stage debug cube render assets

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/engine-reuse-debug-cube-assets.md` records STL-437, the `Cube.glb` user clarification, the `clear_background_props` sibling boundary, and the current dirty test candidate.
- Current truth: `origin/main` already has `spawn_background_props`, normal GLB prop spawning through `crate::entity::spawn_prop`, and `Cube.glb` stage-map fixture references.
- Required change: prove stage debug cubes use the normal `Cube.glb` prop path and do not grow direct Bevy mesh/material asset storage across repeated batches.
- Locked boundary: no `clear_background_props`, no bridge protocol change, no parser/resolver change, no synthetic `StageDebugCubeAssets` unless live code proves the GLB path cannot satisfy the leak proof.
- One-PR suitability: one focused engine test PR is sufficient when the existing GLB path passes; production code, bridge, editor, parser, clear-all, and WASM output stay out of scope unless the regression fails.
- Proof method: focused engine regression for floor/wall/obstacle/block debug placements, stable `Assets<Mesh>` / `Assets<StandardMaterial>` counts, shared `SceneRoot`, plus `cargo check -p shotloom-engine`.

## Current State

| Surface | Path | Classification | Evidence |
|---|---|---|---|
| Linear issue | STL-437 | Source intent | Scope asks for reusable debug cube render assets and a regression named `repeated_debug_cube_spawn_reuses_mesh_and_material_assets`. |
| User clarification | `docs/briefings/shotloom/engine-reuse-debug-cube-assets.md` | Source intent | Use `Cube.glb`; the prop import location already has that file. Treat the document as a spec, not a plan. |
| Worktree | `/Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/engine-reuse-debug-cube-assets` | Partial / dirty | `crates/shotloom-engine/src/bridge/tests/props.rs` already has an uncommitted test-only candidate. |
| Background prop DTO | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | `BackgroundPropPlacementDto` carries `asset_id`, `transform`, optional object/display fields, and tags. |
| Background prop command | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | `SpawnBackgroundProps` carries `map_id`, `document_id`, `source`, and resolved placements. |
| Background prop handler | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | `spawn_background_props_deferred` validates batch input, builds `PropModel`s, calls `crate::entity::spawn_prop`, rolls back ECS entities on render failure, persists valid props, emits diagnostics, `PropAdded`, then `BundleChanged`. |
| GLB prop spawn | `crates/shotloom-engine/src/entity.rs` | Already Done | `spawn_prop_with_asset_resolution` uses `AssetServer::load(GltfAssetLabel::Scene(0).from_asset(...))` and inserts `SceneRoot(handle)`. |
| Cube placeholder | `contracts/stage-map/examples/minimal-stage-map-document.json` | Already Done | Fixture candidate value is `Cube.glb`. |
| Local prop root | `/Users/deemooooooooo/Downloads/props/Cube.glb` | Available local input | User identified this as the prop import location for the debug cube placeholder. |
| Existing test area | `crates/shotloom-engine/src/bridge/tests/props.rs` | Partial | Existing tests cover background prop spawn, validation, diagnostics, rollback, duplicate names, and GLB `SceneRoot`; dirty candidate adds the debug cube regression. |
| Clear command | `origin/main` | Missing / out of scope | No `ClearBackgroundProps` symbol exists; STL-424 owns clear. |
| WASM policy | `docs/adr/adr-0017-wasm-vite-integration.md` | Applies conditionally | Production Rust changes require WASM build; test-only changes do not alter WASM output. |
| Material policy | `docs/adr/adr-0031-bevy-material-usage-rules.md` | Applies if production material code changes | Shared material handles are allowed, but this spec prefers the existing GLB material path. |

## Problem

Stage debug maps can include many floor, wall, obstacle, and block cubes.
The STL-437 risk is repeated debug loading creating avoidable Bevy render assets.
On current `main`, the better implementation target is not a new debug-only
mesh/material cache; it is a proof that debug cubes are normal background props
using `prop_debug -> assets/props/Cube.glb` and therefore do not directly add
one `Mesh` or `StandardMaterial` per cube in the engine handler.

## Requirements

1. The implementation must keep debug cube placements on the existing
   `spawn_background_props` command and `crate::entity::spawn_prop` GLB path.
   Source: STL-437 intent, user `Cube.glb` clarification, existing bridge command.
2. The implementation must register or fixture `prop_debug` as an `AssetKind::Prop`
   with URI `assets/props/Cube.glb` for the engine regression.
   Source: `Cube.glb` fixture/local prop root evidence.
3. The regression must cover floor, wall, obstacle, and block debug placements.
   Source: Linear scope.
4. The regression must repeat debug cube batches with distinct object/display
   identities and prove `Assets<Mesh>` and `Assets<StandardMaterial>` counts stay
   stable after the first batch.
   Source: leak-prevention intent.
5. The regression must assert spawned debug cube props carry the same `SceneRoot`
   handle for `Cube.glb`.
   Source: GLB prop spawn path.
6. The implementation must not add `clear_background_props`, TypeScript bridge
   mirrors, parser/resolver changes, bridge fields, or protocol docs.
   Source: sibling-owned primitive boundary and Shotloom ask-first matrix.
7. The implementation must keep existing background prop diagnostics, rollback,
   model mutation, and event order unchanged.
   Source: existing `spawn_background_props_deferred` behavior.

## Locked Decisions

1. **Use `Cube.glb` through the normal GLB prop path.**

   Rationale: live code already resolves prop assets into `SceneRoot` through
   `AssetServer`, and the user clarified that `Cube.glb` exists in the prop
   import location.

   Rejected alternatives: adding `StageDebugCubeAssets`, direct `Mesh3d`,
   direct `MeshMaterial3d`, or kind-specific production materials for STL-437.

2. **Treat kind-specific material caching as satisfied by the GLB path for this PR.**

   Rationale: Linear's material cache wording came from the dirty POC branch.
   On current `main`, using `Cube.glb` avoids direct `StandardMaterial` creation
   in the handler and proves the same leak-prevention intent with less surface.

   Rejected alternatives: adding four production material handles for
   floor/wall/obstacle/block, or weakening the test to entity counts only.

3. **Do not implement clear behavior in STL-437.**

   Rationale: `clear_background_props` is absent from `origin/main` and related
   work owns that primitive. A repeated spawn proof with stable render-asset
   counts covers the leak class without expanding protocol scope.

   Rejected alternatives: adding a temporary clear helper, adding the real clear
   command, or blocking STL-437 until STL-424 lands.

4. **Accept a test-only implementation when it proves the existing path.**

   Rationale: the current dirty worktree already appears to express STL-437 as
   a regression around existing behavior. Production code changes are required
   only if the test fails because live code cannot satisfy the requirements.

   Rejected alternatives: forcing a production cache even when the existing GLB
   path passes, or running `pnpm build:wasm` for a test-only diff.

5. **Keep persistence and event atomicity unchanged.**

   Rationale: `spawn_background_props_deferred` already prevalidates, rolls back
   ECS entities on render failure, persists valid props, emits diagnostics,
   emits `PropAdded`, then emits one `BundleChanged`.

   Rejected alternatives: persisting debug cube state before render spawn,
   emitting debug-specific events, or changing existing diagnostics.

## Non-Goals

- No `clear_background_props` command.
- No TypeScript bridge mirror or fixture snapshot update.
- No `shotloom-core` bridge DTO or event shape change.
- No `crates/shotloom-stage` parser/resolver change.
- No editor panel wiring.
- No new dependency.
- No ADR amendment.
- No production material whitelist change.
- No broad cleanup of `feat/stage-import-bridge-poc`.
- No generated WASM output for a test-only proof.

## Implementation Spec

### S0 - Baseline Re-Check

1. Confirm the implementation worktree is
   `/Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/engine-reuse-debug-cube-assets`
   on `fix/engine-reuse-debug-cube-assets`.
2. Confirm only `crates/shotloom-engine/src/bridge/tests/props.rs` is dirty
   before editing.
3. Re-run:
   ```bash
   rg -n "SpawnBackgroundProps|BackgroundPropPlacementDto|spawn_background_props" crates/shotloom-core crates/shotloom-engine apps/editor/src/bridge docs/ipc
   rg -n "prop_debug|Cube.glb|SceneRoot|Assets<Mesh>|Assets<StandardMaterial>" crates apps contracts docs
   rg -n "ClearBackgroundProps|clear_background_props" crates apps docs contracts
   ```
4. Confirm `clear_background_props` is still absent on the base.

### S1 - Keep Debug Cubes On The Existing GLB Path

1. In tests, fixture `prop_debug` as `AssetKind::Prop` with URI
   `assets/props/Cube.glb`.
2. Do not add a production debug cube renderer, resource, plugin, or material
   cache unless S3 fails against the existing path.
3. Keep `spawn_background_props_deferred` routing through
   `crate::entity::spawn_prop`.

### S2 - Preserve Existing Spawn Semantics

1. Preserve validation for map id, document id, source, placement count, asset
   lookup, transform, names, and tags.
2. Preserve rollback on render-spawn failure.
3. Preserve diagnostics, `PropAdded`, and single `BundleChanged` event order.
4. Preserve normal non-debug background prop behavior.

### S3 - Land The Regression

1. Add or keep `debug_cube_bundle()` in
   `crates/shotloom-engine/src/bridge/tests/props.rs`.
2. Add or keep helper functions for `Assets<Mesh>` and
   `Assets<StandardMaterial>` counts.
3. Add or keep `repeated_debug_cube_spawn_reuses_mesh_and_material_assets`.
4. First batch: spawn floor, wall, obstacle, and block placements through
   `prop_debug`.
5. Assert mesh/material counts stay equal to the baseline.
6. Second batch: spawn the same four labels with distinct object/display names.
7. Assert mesh/material counts stay stable.
8. Query `SceneRoot` on spawned `Prop` entities and assert all eight roots are
   the same handle.

### S4 - Verify

1. Run:
   ```bash
   cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets
   cargo check -p shotloom-engine
   ```
2. If production Rust changes, run:
   ```bash
   pnpm build:wasm
   ```
3. Before PR, run the normal Shotloom gates required by
   `/shotloom-review-before-pr`.

## Acceptance Criteria

- [ ] `prop_debug` debug cubes use `assets/props/Cube.glb` through the normal
      background prop GLB path.
- [ ] Floor, wall, obstacle, and block debug placements are covered.
- [ ] Repeated debug cube batches do not increase direct Bevy `Assets<Mesh>` or
      `Assets<StandardMaterial>` counts.
- [ ] Spawned debug cube props share the same `Cube.glb` `SceneRoot` handle.
- [ ] Existing background prop diagnostics, rollback, model mutation, and event
      order remain unchanged.
- [ ] `cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets` passes.
- [ ] `cargo check -p shotloom-engine` passes.
- [ ] `pnpm build:wasm` runs only if production Rust changes.

## Verification

Focused:

```bash
cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets
cargo check -p shotloom-engine
```

Before PR:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Manual/inspection:

- Confirm debug cube entities use `SceneRoot` and not direct `Mesh3d` /
  `MeshMaterial3d`.
- Confirm no `clear_background_props` symbol was added.
- Confirm no bridge command/event/schema file changed.
- Confirm no production material cache was added unless the existing GLB path
  failed S3 and the spec was updated first.

## Traps

- Do not satisfy old Linear wording by adding `clear_background_props`; that is
  sibling-owned.
- Do not copy the `feat/stage-import-bridge-poc` synthetic cache shape into
  `main` without first proving the GLB path fails.
- Do not use entity count as the leak proof; count render assets and assert
  shared `SceneRoot`.
- Do not assert absolute asset counts without a baseline from the same test app.
- Do not change `spawn_background_props` event order while adding the test.
- Do not run or commit WASM output for a test-only proof.

## Follow-Up Candidates

- STL-424 can add `clear_background_props` and later extend this proof to the
  real `spawn -> clear -> spawn` user path.
- STL-431 can wire the editor stage import panel to dispatch spawn/clear bridge
  commands.
- STL-432 can add editor-side fixture and command regressions for the stage
  import panel.
