---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-510
repo: shotloom
linear: STL-510
briefing: ../../briefings/shotloom/stage-bind-s2m-glb-renderables.md
---

# Bind S2M GLB Assets To StageRenderable

## Spec Contract

- Briefing basis: `STL-510` asks for a self-contained `main`-based PR that makes `/debug/stage-import` import S2M map samples as Stage-owned content and request the matching S2M GLB scene from `StageRenderable.asset_id`.
- Current truth: `main` already has Stage model/runtime markers, `StageRenderable.asset_id`, `AssetKind::StageRenderable`, selected S2M sample data, and the existing shot-owned `spawn_background_props` compatibility path. It does not have `import_stage_map`, Stage sample `asset_hint`, seeded S2M StageRenderable assets, Stage GLB scene child hydration, placeholder cleanup, or an explicit reset bit on `bundle_changed.summary`.
- Required change: add the missing bridge/editor/import/runtime/reset/docs pieces in one reviewable PR, without depending on draft PR #390 and without converting Stage content into `PropModel`.
- Locked boundary: `Stage Map_*` is the Stage-owned path; `Props Map_*` stays as the shot-owned fallback path. Stage runtime wrapper entities own Stage identity only; visual GLB content and placeholder preview are child entities.
- Proof method: focused Rust bridge/model-sync tests, focused TS bridge/panel/sample tests, IPC/topology docs, docs path validation, and a manual `/debug/stage-import` smoke after WASM build.
- One-PR suitability: suitable as one blocker PR because the missing pieces are coupled by one user-visible failure: Stage import buttons cannot produce visible S2M GLB Stage content on `main`. The PR must stay narrow by excluding async loader failure telemetry, external S2M API work, general asset browser work, and production import UX.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage renderable asset kind | `crates/shotloom-core/src/model/asset.rs::AssetKind::StageRenderable` | Already Done | Stage renderable assets serialize as `stage_renderable`. |
| Stage renderable asset ref | `crates/shotloom-core/src/model/stage.rs::StageRenderable.asset_id` | Already Done | Optional persisted asset id exists on Stage renderables. |
| Stage asset validation | `crates/shotloom-core/src/model/shot.rs::validate_stage_references` | Already Done | Validation rejects missing or non-`StageRenderable` asset refs when an asset catalog is provided. |
| Stage runtime topology | `crates/shotloom-engine/src/stage_runtime.rs` | Partial | Spawns Stage roots/elements/renderable wrappers, but renderables are marker-only and do not request GLB scenes. |
| Model sync Stage tests | `crates/shotloom-engine/src/bridge/tests/model_sync.rs` | Partial | Current tests explicitly expect Stage renderable wrappers without `SceneRoot`. |
| Stage import bridge command | `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts` | Missing | `rg import_stage_map` finds no command or TS mirror on `main`. |
| Stage import handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Missing for import | Stage lifecycle/edit commands exist; no accepted map import command converts sample placements into StageModel content. |
| S2M sample source ids | `apps/editor/src/components/debug/stageImportSamples.json` | Partial | Samples include `source_asset_id` and manifest metadata but no Stage command `asset_hint` mapping. |
| Stage import panel | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | Current panel dispatches `spawn_background_props`; no separate Stage-owned `import_stage_map` action exists. |
| Compatibility props path | `spawn_background_props`, `clear_background_props` | Already Done | Existing path creates shot-owned `PropModel` fallback content and must remain available. |
| Built-in S2M manifest | `assets/s2m_props/manifest.json`, `assets/s2m_props/README.md` | Already Done / input | Curated S2M asset subset exists and has validator docs. |
| Runtime asset copy | `apps/editor/runtime-assets.ts`, `apps/editor/vite.config.ts` | Partial | Vite serves repo assets in dev; production/runtime copy must include selected S2M GLBs. |
| New bundle replacement | `crates/shotloom-engine/src/bridge/handlers/replacement.rs`, `crates/shotloom-engine/src/bundle_state.rs` | Partial | Shared replacement boundary exists; summary only exposes character/asset counts. |
| Bundle changed TS mirror | `apps/editor/src/bridge/types.ts::BundleChangedEvent` | Partial | Summary lacks a reset/full replacement flag. |
| IPC docs | `docs/ipc/bridge-contract.md` | Partial | Documents Stage DTOs and props fallback; lacks `import_stage_map` command and Stage GLB diagnostic contract. |
| Topology docs | `docs/arch/stage-runtime-topology.md` | Partial | Says GLB SceneRoot loading stays outside current runtime topology pass. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-510` |
| State | In Progress |
| Project | Shotloom - bravo |
| Parent | `STL-453` |
| Blocks | `STL-453` |
| Priority | High |
| Goal | Main-based Stage import to StageRenderable GLB render path. |
| Acceptance summary | Add Stage import command/path, seed S2M GLBs as StageRenderable assets, request GLB SceneRoot under Stage wrapper, remove placeholder after loaded, keep props fallback, add reset summary field, add diagnostics/docs/tests. |
| Related PRs | #390 is historical draft context only and must not be a PR dependency. |
| Planning consequence | This spec replaces stale stacked/draft assumptions. The implementation branch is `feat/stage-bind-s2m-glb-renderables` from `origin/main`. |

## Problem

The debug Stage import route has S2M sample data and a Stage model concept, but `main` does not have a closed path from button click to Stage-owned GLB scene content. The current fallback path proves placement density by spawning shot-owned props, but that is not the Stage import behavior needed for `STL-453`.

The main risk is semantic drift: using prop entities or attaching placeholder and scene content to the same entity would make later picking, selection, bounds, visibility, and gizmo behavior ambiguous. This PR must establish a clean runtime topology before more authoring UI lands.

## Requirements

1. Add an `import_stage_map` bridge command to Rust and TypeScript with payload fields for `document_id`, normalized `map_id`, `source`, and resolved Stage import placements that can carry an `asset_hint.asset_id`.
   - Trace: STL-510 implementation scope 1.
   - Design: S1, S2.
   - Verification: V1, V2.
2. Keep `spawn_background_props` and `clear_background_props` unchanged as the Props compatibility/debug path.
   - Trace: STL-510 non-goals and prior debug flow.
   - Design: S2, S8.
   - Verification: V2, V8.
3. Extend `stageImportSamples.ts` so every dispatchable S2M background/prop/cube source id maps to a deterministic, path-safe local StageRenderable asset id, exposed as `asset_hint.asset_id` for the Stage import command.
   - Trace: STL-510 implementation scope 1/2.
   - Design: S2, S3.
   - Verification: V2, V3.
4. Seed the same deterministic S2M StageRenderable asset ids into boot bundles and runtime `new_bundle` bundles as `AssetKind::StageRenderable`.
   - Trace: STL-510 implementation scope 2.
   - Design: S3, S4.
   - Verification: V3, V4.
5. Include the curated S2M GLB subset in the editor runtime asset copy path so production/dev runtime lookup can resolve the seeded URIs.
   - Trace: STL-510 implementation scope 2 and `assets/s2m_props` docs.
   - Design: S3.
   - Verification: V3, V9.
6. Implement `import_stage_map` as a Stage-owned bundle mutation that creates or replaces one imported Stage for the sample map, with Stage elements/renderables carrying accepted asset ids and source provenance.
   - Trace: ADR-0050 and STL-510 Stage-owned path.
   - Design: S4.
   - Verification: V1, V4, V7.
7. Reject or diagnose missing/wrong-kind/unrequestable StageRenderable assets through the existing bridge vocabulary: invalid command identity/shape uses `command_rejected`; placement-level asset resolution problems emit `validation_diagnostics` and skip only that placement; if no valid Stage renderables remain, reject without mutating.
   - Trace: ADR-0021, error-handling guideline, STL-510 diagnostics scope.
   - Design: S4, S7.
   - Verification: V5.
8. Extend Stage runtime hydration so a `StageRuntimeRenderable` wrapper with a valid `asset_id` spawns a child `SceneRoot` for the GLB scene and a separate placeholder preview child while the scene is not loaded.
   - Trace: STL-510 runtime loading scope.
   - Design: S5.
   - Verification: V6.
9. Remove the placeholder preview child once the scene asset reaches loaded state; do not attach the GLB `SceneRoot` and placeholder mesh to the same entity.
   - Trace: STL-510 acceptance criteria and prior review feedback.
   - Design: S5.
   - Verification: V6.
10. Stage runtime entities and their scene/placeholder children must not receive `Prop`, `ShotEntityIdComponent`, or `BridgeEntityId`.
   - Trace: ADR-0050 Stage/Prop boundary.
   - Design: S5.
   - Verification: V6.
11. Add an explicit reset/full-replacement field to `bundle_changed.summary` or an equivalent backward-compatible field, and wire Rust/TS/docs/tests so `new_bundle` resets editor mirrors even when seeded built-ins make `asset_count > 0`.
   - Trace: STL-510 reset/event consistency.
   - Design: S6.
   - Verification: V7.
12. Update IPC and runtime topology docs for `import_stage_map`, Stage renderable asset diagnostics, wrapper/scene/placeholder topology, and async loader failure non-goal.
   - Trace: STL-510 docs scope.
   - Design: S7.
   - Verification: V9.

## Options Considered

| Option | Summary | Decision | Rationale |
|---|---|---|---|
| A. Extend props fallback | Keep using `spawn_background_props` and render S2M GLBs as props. | Rejected | Violates ADR-0050 and keeps Stage import semantics hidden behind shot-owned props. |
| B. Stage import command plus Stage runtime GLB child topology | Add `import_stage_map`, seed StageRenderable assets, hydrate GLB `SceneRoot` children under Stage wrappers. | Selected | Matches STL-510, preserves Stage/Prop boundary, and gives future selection/picking a clean identity hierarchy. |
| C. Only seed assets and manually edit Stage renderables | Avoid command work and rely on existing Stage edit commands. | Rejected | Does not close `/debug/stage-import` user workflow or sample asset hint mapping. |
| D. Implement async loader failure status now | Add full loaded/failed/error event surface for Bevy loader failures. | Rejected for this PR | Linear explicitly marks async Bevy loader failure diagnostics as follow-up; request/resolution failure is enough here. |

## Locked Decisions

1. Stage import uses a new `import_stage_map` command.
   Rationale: `spawn_background_props` is semantically shot-owned and already has compatibility behavior. Stage import needs a distinct bridge surface and event/diagnostic contract.
   Rejected alternatives: overload `spawn_background_props`; use only existing Stage edit commands; add a hidden editor-only mutation path.

2. S2M source ids are converted to path-safe local asset ids by a shared documented derivation.
   Rationale: source ids like `s2m_props:background/Map_1004.glb` are not valid manifest asset ids because `AssetCatalog` forbids path separators. Editor hints and runtime seed entries must converge on one deterministic id.
   Rejected alternatives: use source ids directly; generate random ids; maintain separate editor/runtime id tables.

3. Built-in S2M StageRenderable entries are seeded in both demo/boot and `new_bundle` paths.
   Rationale: `new_bundle` should not erase built-in Stage import capability, and editor reset cannot rely on `asset_count === 0` after seeded assets exist.
   Rejected alternatives: seed only at boot; require user import before Stage debug can work; use the props built-in asset kind.

4. Stage renderable wrapper entities remain identity boundaries; visual representations are child entities.
   Rationale: selection, bounds, visibility, gizmos, and future picking need one canonical Stage wrapper identity while concrete render representations can change.
   Rejected alternatives: attach `SceneRoot` and placeholder mesh to the wrapper; create prop entities; hide placeholder with visibility only after load.

5. Placeholder child is despawned after scene load.
   Rationale: deletion keeps runtime queries unambiguous and avoids carrying stale fallback representation into selection/bounds logic. A new placeholder can be respawned on full rehydration if needed.
   Rejected alternatives: leave placeholder hidden; attach placeholder and GLB to the same entity; keep fallback forever for debugging.

6. Request/resolution failures are handled now; async loader failure is follow-up.
   Rationale: current code can validate manifest kind/id/URI and request the asset. Detecting later Bevy loader failure requires a separate runtime status surface not required by STL-510.
   Rejected alternatives: block this PR on complete async failure telemetry; ignore request/resolution failures.

7. `bundle_changed.summary` gets an additive reset/full-replacement flag.
   Rationale: seeded built-ins break count-based reset inference. Additive optional semantics keep older TS/fixtures compatible.
   Rejected alternatives: infer reset from `asset_count`; emit unrelated events; make the editor special-case `new_bundle` command ids only.

## Non-Goals

- Do not integrate an external/live S2M API.
- Do not add a general user-facing asset browser or import wizard.
- Do not automatically promote Stage content to `PropModel`.
- Do not model async Bevy asset-loader failure as a user-facing status in this PR.
- Do not depend on draft PR #390 or stack on it.
- Do not add new binary GLB assets beyond the checked-in curated `assets/s2m_props` subset.
- Do not change Stage terminology or the persisted Stage schema beyond command/runtime/reset needs.
- Do not replace the debug panel with production import UX.

## Invariants

- `StageRenderable.asset_id` may only resolve to manifest entries with `AssetKind::StageRenderable`.
- `import_stage_map` must not create `PropModel` entries.
- `Props Map_*` must keep using the existing props fallback path.
- Wrapper, scene child, and placeholder child must be distinct entities.
- No Stage runtime entity or Stage visual child may carry prop/shot-entity bridge identity components.
- Reset semantics must not depend on asset count being zero.
- `import_stage_map` may partially import valid placements only after all command-level identity/shape checks pass; placement-level asset failures are diagnostics and skips, not persisted invalid renderables.

## Validator Contract Matrix

| Contract claim | Negative fixture | Boundary rule | Error order | Enforcement surface | Regression proof |
|---|---|---|---|---|---|
| S2M source id derivation produces path-safe asset ids shared by TS and Rust. | `s2m_props:../bad.glb`, empty id, id containing `/` after derivation. | Do not use source id directly as asset id; sanitized id must pass `is_path_safe_asset_id`. | Reject invalid source/derived id before dispatch or seeding. | TS sample tests and Rust seeding tests. | TS tests assert derived ids; Rust tests assert seeded ids match expected fixtures. |
| Stage import only accepts manifest `stage_renderable` assets for Stage renderables. | Valid asset id with `AssetKind::Prop`; missing asset id. | Resolve against current `BundleManifest.assets`; no filesystem probing in command handler. | Missing asset before wrong-kind branch when id absent; wrong-kind when id exists with unsupported kind. | Rust bridge handler tests. | Diagnostic tests assert invalid placements are skipped and all-invalid commands leave the bundle unchanged. |
| S2M asset URIs stay inside `assets/s2m_props`. | Manifest entry with `../` or absolute local path. | Reuse existing `assets/s2m_props` validator/documented containment; do not introduce string-prefix-only path checks. | Manifest validator owns asset path containment before runtime PR proof. | `pnpm test:s2m-assets-validator`; runtime seed tests only trust curated manifest constants. | Validator remains green; seed tests assert repo-relative URIs. |
| Runtime scene child request is representation-only and cannot create prop identity. | Stage renderable asset id matching a prop helper path. | Stage runtime path must not call prop entity spawn helpers that insert prop/shot identity markers. | Runtime request failure emits diagnostic only at request/resolution layer; no prop fallback. | Rust model_sync/stage_runtime tests. | Queries prove no `Prop`, `ShotEntityIdComponent`, `BridgeEntityId` on Stage runtime subtree. |

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | yes | New command/asset resolution errors are internal validation/resolution failures; no external parser IO is required. | Use typed rejection/diagnostic construction; no `String`-flattened external wrappers. If asset request API yields external errors, preserve source. | Handler tests assert rejection/diagnostic code; no `Error::source()` required unless a wrapped external error is introduced. |
| Schema / serialization compatibility | yes | New bridge command and summary field affect Rust serde, TS unions, fixtures, IPC docs. | Add Rust command variant, TS mirror, transaction coverage, examples, optional/default summary field semantics. | Rust serde tests, TS contract/transaction tests, docs examples. |
| Ownership / API boundary | yes | ADR-0050 separates Stage content from props. | Stage import writes `ShotModel.stages`; props fallback remains separate. Runtime Stage subtree avoids prop markers. | Rust post-state tests assert stages changed and props unchanged. |
| Partial mutation / rollback | yes | Command resolves many placements and writes a Stage plus renderables. | Pre-validate command identity, map ids, and transform shape before mutation. Then collect valid renderables, emit diagnostics for invalid asset hints, reject if the valid set is empty, and commit one Stage mutation only after that collection succeeds. | Tests cover all-invalid no mutation and mixed valid/invalid diagnostics with valid-only persistence. |
| Diagnostic ownership | yes | ADR-0021 and IPC `validation_diagnostics` own non-fatal observations. | Document Stage import diagnostic codes and source. Hard malformed commands use `command_rejected`; request/resolution observations use diagnostics. | Rust bridge tests and TS UI diagnostics tests. |
| Test oracle strength | yes | Current tests expect marker-only Stage renderables and no Stage import command. | Add tests that fail on main before implementation: command serde/dispatch, seeded assets, scene child request, placeholder removal. | Focused Rust/TS test list V1-V8. |
| Scope creep | yes | Adjacent work includes #390, `STL-453`, production import UX, async loader status. | Explicit non-goals and one-PR suitability; keep file set to command/sample/seeding/runtime/docs/tests. | Changed-file review and pre-PR review. |
| Reviewer objection | yes | Main likely objections: hidden #390 dependency, bridge schema drift, prop/Stage confusion, placeholder ambiguity. | Spec locks main base, docs all wire changes, keeps Props path, and uses child topology with placeholder despawn. | Review-before-PR plus focused tests. |
| Asset lifecycle | yes | Built-in S2M assets must be available in browser/dev/prod. | Use curated `assets/s2m_props`; include runtime asset copy; do not add untracked local paths. | `pnpm test:s2m-assets-validator`, runtime asset copy test, manual browser smoke. |
| State visibility | yes | Accepted `import_stage_map` must be visible to editor and model sync. | Emit Stage import success event or documented trailing `bundle_changed`; ensure reset flag tells editor full replacement. | Event order tests and TS mirror reset tests. |

## Rejection And Diagnostic Matrix

| Case | Surface | Code / behavior | Mutation | Proof |
|---|---|---|---|---|
| Invalid `map_id` / `document_id` format | `command_rejected` | Stage import identity rejection code | None | Rust handler test |
| Empty placement list | `command_rejected` | No import | None | Rust handler test |
| Placement transform has non-finite values | `command_rejected` | None | Rust handler test |
| `asset_hint.asset_id` missing from manifest | `validation_diagnostics`, skip placement | No invalid renderable persisted | Rust handler test |
| `asset_hint.asset_id` wrong kind | `validation_diagnostics`, skip placement | No wrong-kind renderable persisted | Rust handler test |
| All placements skipped by asset diagnostics | emit `validation_diagnostics`, then `command_rejected` with no mutation | No Stage persisted | Rust handler test |
| GLB URI cannot be requested at runtime resolution time for an already-valid asset id | `validation_diagnostics` | Stage persists; renderable keeps placeholder-only child until a later valid hydration | Rust runtime test |
| Async Bevy loader later fails | Follow-up | No required diagnostic in this PR | Not tested in this PR |

## Design Plan

### S0. Baseline re-check

- Input: `origin/main`, STL-510 briefing, current Linear issue, current branch status.
- Output: confirmed main-based worktree and stale stacked assumptions removed from docs/spec.
- Non-output: no source edits.
- Failure: if branch is not from `origin/main`, stop and recreate worktree.
- Proof: `git log --oneline origin/main..HEAD`, `git status --short`, and briefing/spec current-state evidence.

### S1. Bridge command contract

- Input: existing `BridgeCommand`, TS `Command`, IPC command tables, transaction coverage.
- Output: Rust/TS `import_stage_map` command DTOs, serde/TS tests, IPC command section and matrix updates.
- Non-output: no runtime implementation hidden behind old props command.
- Failure: unsupported payload rejects before mutation with existing bridge rejection vocabulary.
- Proof: Rust bridge serde test, TS contract/transaction tests, IPC docs.
- Requirements: 1, 7, 12. Risk rows: schema compatibility, diagnostic ownership.

### S2. Editor Stage and Props action split

- Input: `StageImportDebugPanel.tsx`, `stageImportSamples.ts/json`, existing props fallback dispatch.
- Output: `Stage Map_*` dispatches `import_stage_map`; `Props Map_*` dispatches `spawn_background_props`; sample adapter emits `asset_hint.asset_id`.
- Non-output: no production import UI; no local file picker.
- Failure: missing sample module disables Stage actions with existing debug-panel failure state.
- Proof: focused Vitest for Stage command payload, Props command payload, disabled states, and sample asset hint derivation.
- Requirements: 1, 2, 3. Risk rows: test oracle strength, ownership/API boundary.

### S3. S2M asset id derivation and asset seeding

- Input: `assets/s2m_props/manifest.json`, `AssetCatalog`, boot bundle, `new_bundle` path, runtime asset copy config.
- Output: shared deterministic id derivation documented in tests; built-in StageRenderable manifest entries seeded at boot and `new_bundle`; runtime copy includes curated S2M GLBs.
- Non-output: no new GLB files; no direct source id as manifest id.
- Failure: invalid derived id or duplicate seed id fails tests and blocks seeding.
- Proof: Rust asset seed tests, TS sample tests, runtime asset copy test, `pnpm test:s2m-assets-validator`.
- Requirements: 3, 4, 5. Risk rows: asset lifecycle, schema compatibility.

### S4. Stage import handler

- Input: accepted `import_stage_map` payload, current bundle manifest, active/current shot state, Stage model constructors.
- Output: imported StageModel content with Stage elements/renderables, accepted asset ids, source provenance, success event or documented trailing `bundle_changed`.
- Non-output: no `PropModel`, no prop spawn helper, no external S2M parser/API.
- Failure: pre-validation rejects command-level invalid input before mutation; asset-resolution diagnostics skip invalid placements; all-invalid asset results reject without mutation.
- Proof: Rust bridge handler tests for success, missing asset, wrong kind, invalid map ids, no prop mutation, event order.
- Requirements: 6, 7. Risk rows: partial mutation/rollback, diagnostic ownership, state visibility.

### S5. Stage runtime GLB child hydration

- Input: current `StageModel`, active stage id, bundle manifest, `AssetServer`, existing Stage runtime map.
- Output: wrapper entity with `StageRuntimeRenderable`, scene child with `SceneRoot`, placeholder child while loading, placeholder despawn after loaded.
- Non-output: no `Prop`, `ShotEntityIdComponent`, `BridgeEntityId` on Stage subtree; no async loader failure diagnostic surface.
- Failure: unresolved or unrequestable asset keeps placeholder and emits/retains the request-resolution diagnostic path documented in S4/S7.
- Proof: model_sync/stage_runtime tests for scene child spawn, placeholder separation, placeholder removal on loaded state, no prop markers, rehydrate cleanup.
- Requirements: 8, 9, 10. Risk rows: ownership/API boundary, test oracle strength.

### S6. Bundle reset summary

- Input: `BundleChangedSummary`, `compute_summary`, replacement boundary, TS bundle mirror/store reset logic.
- Output: additive reset/full-replacement flag on bundle changed summary, Rust/TS docs/tests, editor mirror reset behavior not based on `asset_count === 0`.
- Non-output: no breaking bridge protocol version bump unless current policy requires it.
- Failure: older events without the optional field retain existing behavior; `new_bundle` emits explicit reset.
- Proof: Rust serde/default tests, lifecycle tests, TS store/bridge tests.
- Requirements: 11. Risk rows: schema compatibility, state visibility.

### S7. Diagnostics and docs

- Input: error-handling guideline, ADR-0021, IPC docs, topology docs, runtime architecture docs.
- Output: documented `import_stage_map` event/diagnostic contract, Stage runtime topology with wrapper/scene/placeholder, async loader failure follow-up note.
- Non-output: no stale mention that GLB SceneRoot loading is outside the runtime pass after implementation.
- Failure: docs validation catches path/link issues.
- Proof: `node scripts/validate-doc-paths.mjs`, targeted markdownlint or existing docs validation, review-before-PR docs pass.
- Requirements: 7, 12. Risk rows: diagnostic ownership, reviewer objection.

### S8. Verification and manual smoke

- Input: implemented code and docs.
- Output: focused gates green and browser repro notes.
- Non-output: no PR creation before `shotloom-review-before-pr`.
- Failure: failed focused gate becomes the next fix queue before review.
- Proof: V1-V9 and manual `/debug/stage-import` smoke.
- Requirements: all. Risk rows: test oracle strength, scope creep.

## Acceptance Criteria

- [ ] `import_stage_map` exists in Rust bridge command types, TS bridge types, IPC docs, and transaction/serde coverage.
- [ ] `/debug/stage-import` exposes separate Stage and Props map actions.
- [ ] Stage map actions dispatch Stage import payloads with deterministic `asset_hint.asset_id` values derived from S2M source ids.
- [ ] Props map actions continue dispatching the existing `spawn_background_props` fallback path.
- [ ] Boot and `new_bundle` bundles seed matching S2M assets as `AssetKind::StageRenderable`.
- [ ] `StageRenderable.asset_id` imports persist only valid `stage_renderable` manifest ids.
- [ ] Stage runtime renderable wrapper spawns a GLB `SceneRoot` child and a separate placeholder child while loading.
- [ ] Placeholder child is despawned once the scene asset is loaded.
- [ ] Stage runtime subtree lacks prop/shot bridge identity markers.
- [ ] `new_bundle` emits an explicit reset/full-replacement summary signal that TS consumes.
- [ ] Request/resolution failure diagnostics match IPC docs.
- [ ] Async Bevy loader failure diagnostics remain documented follow-up, not hidden scope.

## Verification

- V1 Rust bridge command/serde: `cargo test -p shotloom-core import_stage_map bundle_changed_event_serde --lib`.
- V2 Editor bridge/panel: `pnpm --filter @shotloom/editor test -- StageImport`.
- V3 S2M assets and id mapping: `pnpm test:s2m-assets-validator`; focused TS sample tests; Rust seed tests.
- V4 Stage import handler: `cargo test -p shotloom-engine import_stage_map --lib`.
- V5 Diagnostics/rejection matrix: focused Rust bridge tests for missing/wrong-kind/unrequestable assets and invalid payloads.
- V6 Stage runtime hydration: `cargo test -p shotloom-engine stage_renderable --lib`.
- V7 Reset behavior: existing lifecycle new-bundle tests plus new reset summary Rust/TS tests.
- V8 Compatibility path: existing `spawn_background_props`/`clear_background_props` tests remain green.
- V9 Docs and browser: `node scripts/validate-doc-paths.mjs`; targeted markdownlint/validate docs; manual `/debug/stage-import` smoke after WASM build.

## Manual Repro

1. Start the web editor and open `/debug/stage-import`.
2. Create or load a bundle.
3. Click `Stage Map_1004`.
4. Verify the Stage import command is accepted and `bundle_changed` follows.
5. Verify the Stage runtime renderable requests the S2M GLB `SceneRoot`.
6. Verify placeholder preview is not on the same entity as the GLB scene.
7. After the scene reaches loaded state, verify placeholder child is gone.
8. Click `Props Map_1004` and verify the existing shot-owned fallback path still works separately.
9. Click `new_bundle` or equivalent runtime reset path and verify editor mirrors clear even though seeded S2M assets remain.

## Traps

- Do not treat source ids like `s2m_props:background/Map_1004.glb` as manifest asset ids directly.
- Do not use `spawn_background_props` as the Stage import implementation.
- Do not put `SceneRoot` and placeholder `Mesh3d` on the same entity.
- Do not keep a hidden placeholder forever after scene load.
- Do not infer editor reset from `asset_count === 0`.
- Do not describe #390 as a dependency in docs or PR body.

## Follow-Up Candidates

- Add a dedicated runtime status/diagnostic path for asynchronous Bevy GLB loader failures after `AssetServer::load` accepts the request.
- Promote debug Stage import UX into a production authoring flow.
- Add selection/picking/bounds behavior for Stage wrapper vs child visual representations.
- Expand S2M asset coverage beyond the curated subset after source/license/size review.
