---
status: ready
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: STL-437
repo: shotloom
linear: STL-437
spec: ../../plans/engine-reuse-debug-cube-assets.md
---

# Shotloom coding mode - rust

**Issue:** STL-437 "perf(engine): stage debug cube mesh/material asset 재사용"
  Problem: repeated stage debug cube loading can grow Bevy render asset storage when cube meshes/materials are synthesized per cube.
  Acceptance:
  - stage debug cube batch spawn does not create a new mesh per cube.
  - floor/wall/obstacle/block debug cube placements keep mesh/material counts stable across repeated spawns.
  - `cargo test -p shotloom-engine repeated_debug_cube_spawn_reuses_mesh_and_material_assets` passes.
  - `cargo check -p shotloom-engine` passes.
  - WASM build is required only if production Rust changes.
  Affected: `crates/shotloom-engine/src/bridge/tests/props.rs`, `crates/shotloom-engine/src/bridge/handlers/props.rs`, `crates/shotloom-engine/src/entity.rs`.
  Linked: Parent STL-423; related STL-420, STL-431, STL-432.

**Branch:** `fix/engine-reuse-debug-cube-assets`  (base: `origin/main` at `03eb9aa9`)  dirty file: `crates/shotloom-engine/src/bridge/tests/props.rs`

**Standards loaded:** `AGENTS.md`, `CONTRIBUTING.md`, `docs/guidelines/error-handling.md`, `docs/guidelines/review-rust.md`, `docs/guidelines/commit-guideline.md`, `docs/guidelines/pr-guideline.md`
**ADRs to honor:** `docs/adr/adr-0031-bevy-material-usage-rules.md`, `docs/adr/adr-0017-wasm-vite-integration.md`
**Ask-first triggers for this task:** bridge protocol changes, `clear_background_props`, parser/resolver changes, dependencies, ADR changes, production Bevy ECS ordering changes.
**Intent lens:** prevent repeated stage debug cube spawns from growing Bevy `Assets<Mesh>` / `Assets<StandardMaterial>`. User clarified that the prop import location already has `Cube.glb`; use `Cube.glb` through the normal GLB prop path instead of adding a debug-only cube renderer.

**AC primitive cross-check:**
- Mesh reuse: codified by current `crate::entity::spawn_prop` GLB path and `SceneRoot` attachment; proof can assert no direct `Assets<Mesh>` growth.
- Material reuse: verification-example when using `Cube.glb`; proof can assert no direct `Assets<StandardMaterial>` growth instead of adding kind-specific material caches.
- `spawn -> clear -> spawn`: sibling-owned primitive; `clear_background_props` is absent on `origin/main` and belongs to STL-424. Use repeated spawn batches with distinct object IDs as the equivalent stronger leak proof.
- WASM build: verification-example; run `pnpm build:wasm` only if production Rust changes, because test-only changes do not alter WASM output.

**Spec-risk handoff for `/shotloom-draft-task-plan`:**
- P1: Requirements must reject synthetic `StageDebugCubeAssets` on `main` and require the existing GLB prop path with `Cube.glb`. Evidence: `crates/shotloom-engine/src/entity.rs`, `contracts/stage-map/examples/minimal-stage-map-document.json`. AC-trace: mesh/material reuse intent plus user clarification.
- P1: Spec must keep `clear_background_props` out of scope. Evidence: no `ClearBackgroundProps` symbol on `origin/main`; Linear related issue STL-424 owns clear. AC-trace: repeated clear wording is sibling-owned primitive.
- P2: Verification must map all four debug labels floor/wall/obstacle/block to repeated `prop_debug` placements. Evidence: Linear scope and dirty test candidate in `crates/shotloom-engine/src/bridge/tests/props.rs`. AC-trace: Linear named all four kinds.
- P2: Test must assert render asset counts and shared `SceneRoot`, not only entity counts. Evidence: existing GLB spawn attaches `SceneRoot`. AC-trace: leak-prevention intent.
- P3: Spec should state that production handler changes are not required if tests already prove the existing path. Evidence: dirty worktree contains test-only diff.

**Sibling specs (caol-ila/docs/plans/):**
- `bridge-add-background-prop-batch-spawn.md` - HEAD - stance: current bridge command shape, diagnostics, ownership tags, event order - agrees with this briefing.
- `stage-add-map-document-parser.md` - HEAD - stance: parser/resolver work stays in `crates/shotloom-stage` - agrees with this briefing.
- `stage-define-map-document-bundle-layout.md` - HEAD - stance: stage-map document semantics remain separate from engine spawn proof - agrees with this briefing.

**Pre-write checklist passed:**
- [x] gh auth active account: `tomlim2` (`deemotl` secondary token invalid but inactive).
- [x] Shotloom commit identity: `tomlim2 <deemo@vonvon.me>`.
- [x] conventions re-read: `AGENTS.md`, `CONTRIBUTING.md`, Rust/error guidelines.
- [x] category: rust / test
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run

Ready. If this briefing is OK, next step is `/shotloom-draft-task-plan`.
