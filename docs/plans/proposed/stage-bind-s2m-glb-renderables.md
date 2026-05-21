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

- Briefing basis: `STL-510` is the blocker slice for draft PR #390 /
  `STL-453`; it fixes `/debug/stage-import` Stage map imports rendering as
  placeholders instead of S2M GLB scene content.
- Current truth: core already has `AssetKind::StageRenderable`,
  `import_stage_map.asset_hint`, Stage model validation, and Stage runtime
  hydration scaffolding. The missing contract is deterministic S2M
  StageRenderable registration plus runtime `SceneRoot` hydration from
  `StageRenderable.asset_id`.
- Required change: bind the checked-in `assets/s2m_props` subset into the
  bundle manifest, send matching `asset_hint` values from the editor Stage
  import samples, persist those ids on Stage renderables, and load the GLB
  scene at runtime with placeholder fallback on failure.
- Locked boundary: no bridge command/event schema change, no new live S2M API,
  no general asset browser, no automatic promotion to `PropModel`, and no
  removal of the legacy `Props Map_*` / `prop_box` compatibility path.
- Proof method: focused Rust model-sync/stage-handler tests, focused editor
  sample/runtime-asset tests, docs path validation, WASM/web build proof, and a
  browser repro on `/debug/stage-import` showing `Stage Map_1004` loads S2M
  GLB content rather than checker placeholder content.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage asset kind | `crates/shotloom-core/src/model/asset.rs::AssetKind::StageRenderable` | Already Done | The manifest has a first-class `stage_renderable` kind. |
| Asset id validation | `crates/shotloom-core/src/model/asset.rs::is_path_safe_asset_id` | Already Done | Asset ids must be non-empty, path-safe, and free of `/`, `\`, `..`, and leading `.`. |
| Stage asset validation | `crates/shotloom-core/src/model/bundle.rs` Stage renderable validation tests | Already Done | Bundle validation accepts `stage_renderable` and rejects missing or wrong-kind Stage renderable asset refs. |
| Bridge command field | `crates/shotloom-core/src/bridge/mod.rs::StageMapImportAssetHintDto` | Already Done | `import_stage_map` placements already carry optional `asset_hint`. |
| IPC contract | `docs/ipc/bridge-contract.md` §13A.2 | Partial / dirty in-progress | Contract says `asset_hint.asset_id` must resolve to a manifest `stage_renderable`; dirty docs also mention runtime GLB hydration. |
| Stage import sample source | `apps/editor/src/components/debug/stageImportSamples.json` | Partial | Contains S2M `source_asset_id` and `manifest_path` metadata for background, props, and cubes. |
| Stage import sample mapper | `apps/editor/src/components/debug/stageImportSamples.ts` | Partial / dirty in-progress | Dirty mapper derives `asset_hint.asset_id` from S2M source ids; spec locks this as the intended direction. |
| Built-in S2M asset manifest | `assets/s2m_props/manifest.json`, `assets/s2m_props/README.md` | Already Done | Checked-in S2M validation subset exists and is documented as external StoryPreviz/S2M asset material. |
| Runtime asset copy list | `apps/editor/runtime-assets.ts` | Partial / dirty in-progress | Dirty copy list includes `s2m_props`; production build needs this proof, not only Vite dev serving. |
| Vite dev serving | `apps/editor/vite.config.ts` | Already Done | Dev server serves repo assets, so local browser testing can resolve `/assets/s2m_props/...`. |
| Import handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Partial | Handler validates `asset_hint` and stores accepted `asset_id`; dirty work also seeds built-in S2M assets on `new_bundle`. |
| Engine bootstrap asset seeding | `crates/shotloom-engine/src/app.rs::seed_debug_character_assets` | Partial / dirty in-progress | Existing seed path is the right lifecycle owner for built-in debug/runtime assets; dirty work adds S2M StageRenderable entries here. |
| Stage runtime hydration | `crates/shotloom-engine/src/stage_runtime.rs::hydrate_stage_runtime` | Partial / dirty in-progress | Runtime creates Stage wrapper entities; dirty work resolves `StageRenderable.asset_id` to a GLB `SceneRoot`. |
| Model sync | `crates/shotloom-engine/src/model_sync.rs` | Partial / dirty in-progress | Stage hydration must receive manifest context; dirty work threads that through. |
| Prop GLB precedent | `crates/shotloom-engine/src/entity.rs` prop SceneRoot path | Already Done / precedent | Prop hydration already attaches a GLB `SceneRoot`; Stage should reuse this rendering pattern without creating `PropModel`. |
| Legacy prop debug route | `spawn_background_props`, `clear_background_props`, `StageImportDebugPanel` Props buttons | Already Done / preserve | Existing `Props Map_*` compatibility path must remain available and keep `prop_box` fallback. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-510` |
| State | In Progress |
| Owner | deemo / current agent flow |
| Goal | Make S2M background/prop/cube GLBs render through Stage-owned `StageRenderable` assets in `/debug/stage-import`. |
| Acceptance criteria | S2M GLBs registered as Stage renderables; `import_stage_map` sends and stores `asset_hint`; runtime loads GLB `SceneRoot`; failures retain placeholder and diagnostic; `Stage Map_1004` renders S2M content; `Props Map_*` compatibility remains; Rust/TS/browser proof added. |
| Latest relevant comment | N/A beyond the blocker discussion in the active chat. |
| Blockers / dependencies | Blocks `STL-453`; depends on the draft PR #390 stack being present. |
| Related PRs | PR #390, draft, head `feat/import-promote-background-debug-stage`. Current CI checks on the last pushed draft head are green, but STL-510 dirty work is not pushed yet. |
| Current review state | Draft PR, no current review decision. |
| Planning consequence | Keep this as one blocker PR update on the existing stack; do not split into a fresh branch unless PR #390 is abandoned. |

## Problem

The Stage import route can author Stage content from the S2M sample maps, but
the renderables do not have reliable manifest-backed GLB asset bindings across
new bundle creation, editor sample dispatch, and Stage runtime hydration. This
breaks the intended Stage path: the user clicks `Stage Map_1004`, receives
Stage-owned environment entities, and sees checker placeholder content instead
of the checked-in S2M GLB assets.

The fix is not to route S2M content through `PropModel` or the legacy
`spawn_background_props` path. That path remains useful as a compatibility
debug route. The Stage path must stay Stage-owned and bind GLB assets through
`StageRenderable.asset_id`.

## Options Considered

1. **Keep placeholder Stage runtime and use only `Props Map_*` for visual GLB
   proof.**
   - Rejected because STL-510 explicitly requires `StageRenderable.asset_id`
     and Stage runtime GLB hydration. It would leave the Stage path visually
     unproven.

2. **Promote S2M map content into `PropModel` so existing prop GLB hydration can
   render it.**
   - Rejected because the Stage entity model and bridge contract keep
     Stage-owned environment content separate from shot-owned props. Automatic
     promotion is a non-goal.

3. **Register checked-in S2M GLBs as built-in `stage_renderable` manifest assets
   and hydrate Stage runtime wrappers with GLB `SceneRoot`.**
   - Selected. It reuses existing manifest validation, `asset_hint`, and the
     prop SceneRoot precedent while keeping Stage identity, reimport behavior,
     and debug compatibility paths separate.

4. **Add a live S2M/StoryPreviz asset resolver or general asset browser.**
   - Rejected as out of scope. The issue targets the checked-in
     `assets/s2m_props` subset and the debug route, not production asset
     ingestion.

## Requirements

1. Register every checked-in S2M background, prop, and cube GLB needed by the
   sample maps as `AssetKind::StageRenderable` built-in manifest entries.
   Trace: Linear AC1, `AssetKind::StageRenderable`, `assets/s2m_props`.
2. Seed those entries both during normal engine bootstrap and after
   `new_bundle`, because `new_bundle` resets the bundle manifest used by the
   debug route. Trace: Linear AC1, briefing P1.
3. Use one deterministic path-safe asset-id derivation for S2M source asset ids
   in both the TS sample dispatch path and the Rust seeded manifest path. Trace:
   `AssetCatalog::insert` path-safety invariant.
4. Preserve S2M source metadata on built-in StageRenderable manifest entries,
   including at least source asset id and manifest path, without committing
   machine-local absolute paths. Trace: asset provenance sibling specs and
   local path privacy rule.
5. Add `asset_hint` to `toStageMapImportPlacements()` for the background shell,
   prop, and cube placements when the sample has an S2M source asset id. Trace:
   Linear AC2 and bridge contract §13A.2.
6. Keep `toStageImportBackgroundPlacements()` and the `Props Map_*` buttons on
   the legacy `prop_box` / `spawn_background_props` path. Trace: Linear AC6.
7. Hydrate Stage renderables with `SceneRoot` when
   `StageRenderable.asset_id` resolves to a manifest asset whose kind is
   `stage_renderable` and whose URI can be loaded by the Bevy asset server.
   Trace: Linear AC3 and prop GLB precedent.
8. Keep the Stage wrapper entity and `StageRuntimeRenderable` identity as the
   durable runtime boundary; do not replace it with GLB-internal nodes or
   `PropModel` identity. Trace: Stage runtime topology sibling specs.
9. If GLB asset resolution fails, keep placeholder preview for eligible
   non-shell renderables and emit a structured runtime diagnostic through the
   existing logging/tracing path. Do not add a bridge event in this PR. Trace:
   Linear AC4 and ask-first trigger for bridge protocol changes.
10. Avoid shell/background checker placeholder fallback when an S2M shell GLB is
    unavailable, so the imported map does not reintroduce the default checker
    floor occlusion problem. Trace: briefing P1 shell/background behavior.
11. Add `assets/s2m_props` to the editor runtime asset production copy list and
    test that the manifest exists from the editor package context. Trace:
    Linear AC5 and runtime-assets contract.
12. Update focused Rust, TypeScript, and docs tests so failures prove the exact
    missing binding before implementation and pass after implementation. Trace:
    Linear AC7.
13. Update only the bridge/topology/spec docs that become stale due to
    StageRenderable GLB hydration. Do not reopen the Stage entity model ADR.
    Trace: docs policy and briefing P3.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new parser/loader error enum is introduced; Bevy asset server loading remains handle-based. | Use runtime diagnostics/tracing for skipped GLB hydration and do not flatten external errors into a new public error type. | `N/A: no new Rust error wrapper`. |
| Schema / serialization compatibility | yes | `StageMapImportAssetHintDto`, `StageRenderable.asset_id`, and manifest `AssetRecord` already serialize. | Use existing optional fields and manifest entries; no bridge or bundle schema additions. | Existing bridge serde tests plus focused `import_stage_map` tests with `asset_hint`. |
| Ownership / API boundary | yes | Stage model and PropModel are separate; legacy background props are compatibility/debug. | Load StageRenderable GLBs inside Stage runtime hydration while preserving wrapper identity and leaving props path unchanged. | Runtime test asserts `SceneRoot` on Stage runtime renderable and no `Prop` component / `PropModel` promotion. |
| Partial mutation / rollback | yes | `new_bundle` and `import_stage_map` mutate bundle manifest and Stage content. | Seed built-in assets before imports that require them; rely on existing `import_stage_map` rollback for bad `asset_hint`. | Tests for `new_bundle` seeding and `import_stage_map_rejects_bad_asset_hints_without_mutating` remain green. |
| Diagnostic ownership | yes | Linear asks for diagnostic on load failure, but bridge-visible diagnostics would be a protocol expansion. | Use Stage runtime tracing diagnostics for GLB load skips; keep bridge `validation_diagnostics` only for existing import fallback hints. | Runtime missing/wrong-kind/unavailable asset path tests assert placeholder retention and no bridge schema change. |
| Local absolute path exposure | yes | `assets/s2m_props/manifest.json` carries repo asset metadata; docs must avoid local POC roots. | Store repo-relative URIs and source metadata only. | `rg` proof for `/Users/`, `/home/`, drive-letter, `Downloads`, and `Desktop` in touched durable files. |
| Manifest path containment | yes | Stage runtime resolves manifest URIs to Bevy asset paths / configured roots. | Reject or skip asset paths that escape the configured asset root; do not load absolute or traversal URIs. | Negative runtime tests for missing, wrong-kind, and root-escape-style URI behavior where feasible. |
| Command rejection matrix | yes | `import_stage_map` already rejects missing/wrong-kind asset hints. | Reuse existing rejection branches; add only tests needed for S2M happy path and preserve rejection tests. | `cargo test -p shotloom-engine bridge::tests::stage --lib`. |
| Asset/data pack lifecycle | yes | `assets/s2m_props` is a checked-in external validation subset. | Reuse existing asset subset; no new binary asset pack in this PR. Add editor production-copy proof. | Runtime asset test checks `RUNTIME_ASSET_SUBDIRS` contains `s2m_props` and manifest exists. |
| Field-set drift | yes | TS and Rust both derive asset ids from S2M source asset ids. | Keep derivation small, deterministic, and covered by tests on representative background/prop/cube ids. | TS test asserts emitted `asset_hint.asset_id`; Rust seed test resolves the same ids. |
| Bridge docs parity | yes | `docs/ipc/bridge-contract.md` describes `asset_hint` behavior. | Update docs to say runtime may load StageRenderable GLB SceneRoot without changing payload shape. | `node scripts/validate-doc-paths.mjs`. |
| Event-state visibility | no | Stage runtime GLB hydration is viewport state driven by model sync, not a new accepted command. | Preserve existing `stage_created` / `stage_updated` events from `import_stage_map`; no new success event. | Existing stage event-order tests remain green. |
| Test oracle strength | yes | Placeholder behavior currently lets tests pass without real GLB loading unless asserted. | Add assertions for `SceneRoot`, asset id persistence, and browser visible non-placeholder content. | Focused Rust tests fail before StageRenderable SceneRoot hydration. |
| Scope creep | yes | Adjacent live S2M API, asset browser, Stage promotion, and ground visibility issues exist. | Put them in Non-Goals / Follow-Up Candidates. | Diff review confirms no bridge schema, API connector, or prop-promotion implementation. |
| Reviewer objection | yes | Likely objection: S2M IDs hand-maintained in TS/Rust can drift. | Require shared derivation rule and paired TS/Rust tests over representative source ids. | Tests fail if `s2m_props:background/Map_1004.glb` resolves differently across TS/Rust. |

## Locked Decisions

1. **Use built-in manifest entries, not generated local imports.**

   Rationale: the assets are already checked into `assets/s2m_props`, and
   `AssetSource::BuiltIn` models shipped app assets. This avoids staging local
   files or inventing an asset browser.

   Rejected alternatives: live S2M API fetch, local absolute POC root resolver,
   or file-picker import.

2. **Seed S2M StageRenderable assets from the engine's existing built-in asset
   seed lifecycle.**

   Rationale: `new_bundle` resets manifest state, and the debug route often
   starts from a new bundle. Seeding only at app startup would make the first
   import work in one state but fail after reset.

   Rejected alternatives: editor-side manifest mutation, one-off seeding inside
   the UI, or relying on a preexisting user bundle manifest.

3. **Keep deterministic source-id-to-asset-id mapping in both TS and Rust,
   tested on both sides.**

   Rationale: `asset_hint` is sent from TypeScript while manifest entries are
   seeded in Rust. The mapping must be stable and path-safe because the bridge
   validates hints before mutating Stage content.

   Rejected alternatives: hard-code unrelated short ids in the editor, trust raw
   S2M ids with slashes/colons, or add a new bridge query only to ask Rust for
   ids.

4. **Hydrate GLBs on the Stage runtime wrapper entity.**

   Rationale: the wrapper owns Shotloom Stage ids, selection/debug metadata,
   and rehydrate behavior. `SceneRoot` is a rendering component, not the source
   of Stage identity.

   Rejected alternatives: spawn GLB nodes as `Prop`, make GLB scene children
   authoritative Stage ids, or bypass Stage runtime topology.

5. **Use runtime logging/tracing for GLB load diagnostics in this PR.**

   Rationale: a bridge-visible `validation_diagnostics` event for runtime asset
   hydration would be a protocol behavior change and is explicitly ask-first.
   The issue can satisfy failure visibility with structured runtime warnings
   while keeping placeholder fallback.

   Rejected alternatives: add a new bridge event, reuse command-time validation
   diagnostics for runtime-only asset-server failures, or silently fail without
   diagnostic output.

6. **Do not spawn checker placeholder geometry for shell renderables when GLB
   loading fails.**

   Rationale: shell/background content can cover the scene with a large checker
   surface and obscure the reason the real map did not load. Non-shell prop or
   proxy renderables may still preview as placeholders.

   Rejected alternatives: placeholder fallback for every role, or no
   placeholder fallback for any role.

7. **Keep `Props Map_*` as a separate compatibility path.**

   Rationale: the debug panel uses both paths to compare legacy prop spawning
   and Stage-owned import. Removing or converting the Props path would expand
   the blocker fix into a migration.

   Rejected alternatives: delete Props buttons, rewrite them to Stage imports,
   or route Stage imports through `spawn_background_props`.

## Non-Goals

- No external S2M or StoryPreviz API integration.
- No map-document parser changes.
- No new bridge command, event, rejection code, or TypeScript bridge wire
  shape.
- No asset browser, manifest editor, file picker, or production import UX.
- No automatic promotion from Stage content to `PropModel`.
- No removal or semantic change to `spawn_background_props`,
  `clear_background_props`, `Props Map_*`, or `prop_box` fallback.
- No new binary assets beyond the existing `assets/s2m_props` subset.
- No new dependency, ADR, CI workflow, or Bevy schedule redesign.
- No broad Stage entity model rename or ADR rewrite.

## Design Plan

### S0 - Baseline Re-Check

Input:
- Current Shotloom worktree, PR #390 state, `STL-510` Linear issue, and this
  spec.

Output:
- Confirmed file list, dirty-state awareness, and exact implementation delta to
  finish.

Non-output:
- No source edits.

Failure:
- If another unrelated dirty edit conflicts with the listed target files, stop
  and ask before modifying that file.

Proof:
- `git status --short`
- `rg -n "StageRenderable|stage_renderable|asset_hint|s2m_props|SceneRoot" crates apps docs contracts assets`

### S1 - Seed Built-In S2M StageRenderable Assets

Input:
- `assets/s2m_props/manifest.json`
- `crates/shotloom-engine/src/app.rs::seed_debug_character_assets`
- `crates/shotloom-core/src/model/asset.rs::AssetRecord`

Output:
- Manifest entries for each sample S2M background, prop, and cube GLB with
  `kind: StageRenderable`, `source: BuiltIn`, repo-relative URI, display name,
  and source metadata.
- The same entries are present after `new_bundle`.

Non-output:
- No `Prop` asset entries for Stage import content.
- No local absolute paths or live API fetches.

Failure:
- Invalid derived asset id fails the seed test before runtime import uses it.
- Duplicate seed attempts are idempotent or explicitly skip existing entries.

Proof:
- Rust unit test resolving `s2m_props_background_map_1004_glb`.
- Engine test that `new_bundle` leaves S2M StageRenderable entries in the
  active bundle manifest.

### S2 - Emit Stage `asset_hint` Values From Editor Samples

Input:
- `apps/editor/src/components/debug/stageImportSamples.json`
- `apps/editor/src/components/debug/stageImportSamples.ts`
- `StageMapImportPlacement` TypeScript type.

Output:
- `toStageMapImportPlacements()` includes `asset_hint.asset_id` for shell,
  prop, and cube placements that have S2M source assets.
- Representative asset ids match the Rust seed derivation.

Non-output:
- No change to `toStageImportBackgroundPlacements()` compatibility payload
  semantics.
- No raw local paths in sample dispatch payloads.

Failure:
- Unsupported sample header or missing cases still throw during fixture parse,
  as today.

Proof:
- Focused `StageImportDebugPanel` or sample mapper test asserting
  `asset_hint` for `Map_1004` background and at least one cube/prop placement.

### S3 - Hydrate StageRenderable GLB Scene Roots

Input:
- `crates/shotloom-engine/src/stage_runtime.rs::hydrate_stage_runtime`
- `crates/shotloom-engine/src/model_sync.rs`
- Bundle manifest context and Bevy `AssetServer`.

Output:
- Runtime Stage renderable wrapper entities attach `SceneRoot` for valid
  `stage_renderable` GLB assets.
- Wrapper components such as Stage id, element id, renderable id, role, and
  transform remain on the wrapper entity.

Non-output:
- No `Prop` component.
- No `PropModel` creation.
- No GLB-internal scene node treated as the authoritative Stage identity.

Failure:
- Missing asset id, wrong asset kind, missing asset root, root-escape path, or
  unavailable asset pipeline skips GLB loading, emits runtime diagnostic, and
  falls back only when placeholder preview is eligible.

Proof:
- `cargo test -p shotloom-engine stage_renderable_asset_id_loads_scene_root_without_prop_promotion --lib`
- Negative runtime tests for missing/wrong-kind or unavailable asset binding
  preserving placeholder behavior.

### S4 - Preserve Legacy Prop Compatibility

Input:
- `StageImportDebugPanel`
- `toStageImportBackgroundPlacements()`
- `spawn_background_props` / `clear_background_props` bridge paths.

Output:
- `Props Map_*` continues to dispatch legacy prop placements with `prop_box`
  fallback where appropriate.
- `Stage Map_*` dispatches `import_stage_map` with Stage asset hints.

Non-output:
- No migration from background props to Stage content.
- No deletion of props path tests.

Failure:
- If shared fixture changes break prop dispatch shape, restore compatibility or
  split the fixture change before continuing.

Proof:
- Existing panel tests for Props buttons plus new tests for Stage asset hints.
- `cargo test -p shotloom-engine bridge::tests::stage --lib` keeps existing
  `import_stage_map` rejection/rollback matrix green.

### S5 - Production Asset Availability And Docs

Input:
- `apps/editor/runtime-assets.ts`
- `docs/arch/stage-runtime-topology.md`
- `docs/ipc/bridge-contract.md`
- `docs/specs/stage-map-document.md`

Output:
- Production asset copy list includes `s2m_props`.
- Docs describe StageRenderable GLB hydration and the continued separation from
  legacy background props.

Non-output:
- No new docs claiming live S2M API support.
- No ADR rewrite.

Failure:
- If docs require a bridge schema claim not backed by code, stop and keep the
  claim out of this PR.

Proof:
- `pnpm --dir apps/editor exec vitest run src/__tests__/runtime-assets.test.ts`
- `node scripts/validate-doc-paths.mjs`

### S6 - Browser Verification

Input:
- Built WASM/editor dev server.
- `/debug/stage-import`.

Output:
- Manual or browser-automated evidence that `Stage Map_1004` renders S2M GLB
  content instead of only checker placeholder content.
- Evidence that `Props Map_*` still spawns the compatibility path.

Non-output:
- No production UX or route redesign.

Failure:
- If the scene remains placeholder-only, inspect manifest asset ids, asset URI
  resolution, browser asset requests, and runtime diagnostics before widening
  scope.

Proof:
- `pnpm build:wasm`
- `pnpm dev:web`
- Browser repro on `http://localhost:<port>/debug/stage-import`

## Acceptance Criteria

- [ ] S2M background, prop, and cube GLBs used by the sample maps are registered
      as built-in `stage_renderable` assets.
- [ ] `new_bundle` preserves or re-seeds those StageRenderable entries before
      `/debug/stage-import` sends `import_stage_map`.
- [ ] `Stage Map_*` commands send `asset_hint.asset_id` values that resolve to
      those manifest entries.
- [ ] `import_stage_map` persists accepted hints on `StageRenderable.asset_id`.
- [ ] Stage runtime hydration attaches a GLB `SceneRoot` for valid
      StageRenderable assets.
- [ ] Load failures keep eligible placeholder previews and emit runtime
      diagnostics without adding bridge schema.
- [ ] Shell/background fallback does not spawn a checker placeholder that hides
      the map when GLB loading fails.
- [ ] `Props Map_*` compatibility and `prop_box` fallback remain working.
- [ ] `assets/s2m_props` is available in production editor runtime assets.
- [ ] Rust, TypeScript, docs, WASM, and browser verification cover the changed
      surfaces.

## Verification

- `cargo fmt --check`
- `cargo test -p shotloom-engine seed_debug_character_assets_seeds_s2m_stage_renderables --lib`
- `cargo test -p shotloom-engine new_bundle_emits_bundle_changed_correlated_with_cmd_id --lib`
- `cargo test -p shotloom-engine import_stage_map_creates_stage_content_and_preserves_source --lib`
- `cargo test -p shotloom-engine stage_renderable_asset_id_loads_scene_root_without_prop_promotion --lib`
- `cargo test -p shotloom-engine bridge::tests::stage --lib`
- `cargo test -p shotloom-engine bridge::tests::model_sync --lib`
- `cargo check -p shotloom-engine`
- `cargo clippy -p shotloom-engine -- -D warnings`
- `pnpm --dir apps/editor exec vitest run src/components/debug/__tests__/StageImportDebugPanel.test.tsx src/__tests__/runtime-assets.test.ts`
- `pnpm --dir apps/editor exec tsc --noEmit`
- `pnpm build:wasm`
- `node scripts/validate-doc-paths.mjs`
- Browser repro: open `/debug/stage-import`, create/load a bundle, click
  `Stage Map_1004`, and confirm S2M GLB content renders rather than only
  checker placeholder geometry.
- Browser regression: click a `Props Map_*` action and confirm the legacy prop
  compatibility path still spawns.
- Local path privacy proof:
  `rg -n "/Users/|/home/|Downloads|Desktop|[A-Za-z]:\\\\" apps/editor/src/components/debug apps/editor/runtime-assets.ts crates/shotloom-engine/src docs/arch/stage-runtime-topology.md docs/ipc/bridge-contract.md docs/specs/stage-map-document.md`

## Traps

- Do not use raw S2M ids such as `s2m_props:background/Map_1004.glb` directly
  as `asset_id`; colons and slashes violate the asset catalog path-safety
  rules.
- Do not seed S2M assets only at engine startup. `new_bundle` resets the
  manifest and is the route used during debug testing.
- Do not load Stage GLBs by promoting them to props. The visual result may look
  right while the domain model becomes wrong.
- Do not make the GLB-internal Scene entities the authoritative Stage identity;
  the wrapper entity remains the Stage runtime boundary.
- Do not add `validation_diagnostics` for runtime asset-server load skips
  without an explicit bridge-contract scope decision.
- Do not spawn checker placeholder geometry for shell backgrounds when the GLB
  fails; that can hide the useful failure state behind a large checker plane.
- Do not remove `Props Map_*` tests while fixing the Stage path.
- Do not rely on Vite dev serving as production proof; `runtime-assets.ts` must
  include `s2m_props`.

## Follow-Up Candidates

- Production Stage import UX with asset selection and diagnostics grouping.
- Live S2M / StoryPreviz connector that registers new assets beyond the
  checked-in validation subset.
- Bridge-visible runtime asset-load diagnostics if the editor needs structured
  per-renderable failure UI.
- General Stage asset browser or manifest editor.
- Automatic Stage-to-Prop promotion workflows after Stage import stabilizes.
