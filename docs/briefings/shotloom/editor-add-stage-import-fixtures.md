---
status: ready
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-430
repo: shotloom
linear: STL-430
spec: ../../plans/proposed/editor-add-stage-import-fixtures.md
---

### Shotloom coding mode - mixed TypeScript + fixture data

**Issue:** STL-430 "feat(editor): stage import fixture JSON에 3개 샘플 맵 반영"
Problem: StoryPreviz SVG/map extraction output must be fixed into editor-owned
fixture JSON so the stage import POC can load the selected maps without a live
StoryPreviz dependency.
Parent: STL-420. Related: STL-422. Project: Shotloom - bravo.

**Acceptance:**
- Three map fixtures are importable by the editor.
- Each fixture includes prop placements and debug cube placements.
- Missing GLBs are explicitly excluded or fallback-handled for the current POC.
- Fixture changes do not break the panel test or web typecheck.

**Scope notes from Linear:**
- Add or manage `stageImportFixtures.json`.
- Include `Map_1004__Stage1`, `Map_1006__Stage1`, and `Map_1038__Stage1`.
- Include prop placement transforms.
- Include floor, wall, and obstacle cube placements.
- Apply explicit mapping to usable GLB asset ids.
- Current implementation reference branch: `feat/stage-import-bridge-poc`.

**Branch:** `feat/editor-add-stage-import-fixtures`
Worktree: `shotloom-github/.worktrees/editor-add-stage-import-fixtures`
Base: `origin/main` at `04f6fba8`.

**Pre-write checklist passed:**
- gh auth active account is `tomlim2`; stale inactive `deemotl` credential warning is non-blocking.
- Shotloom worktree identity set to `tomlim2 <deemo@vonvon.me>`.
- Linear `STL-430` is assigned to me and moved to In Progress.
- Worktree is clean and fast-forwarded to latest fetched `origin/main`.
- Conventions re-read: `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `docs/adr/README.md`.
- Category selected: mixed TypeScript + fixture data.
- Targeted standards loaded.
- AC primitive cross-check recorded.
- Sibling-spec scan completed.
- `~/.codex/order/` checked; stale STL-89 order exists, but direct user instruction selects STL-430.

**Standards loaded:**
- `AGENTS.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/review-typescript.md`
- `docs/guidelines/documentation-standard.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/pr-guideline.md`
- `docs/ipc/bridge-contract.md`
- `docs/specs/stage-map-document.md`

**ADRs / docs to honor:**
- ADR-0002 React + TypeScript editor shell.
- ADR-0003 wasm-bindgen bridge if dispatch code is touched.
- ADR-0009 void stage and coordinate convention.
- ADR-0018 runtime telemetry and error boundaries.
- ADR-0021 diagnostics are observations, not errors.
- ADR-0042 bridge event coalescing if status follows events.
- `docs/specs/stage-map-document.md` for selected maps, local POC path policy, ownership tags, and diagnostic semantics.

**Ask-first triggers for this task:**
- Changing bridge command/event shapes or `spawn_background_props` payload fields.
- Moving the fixture into `contracts/` or changing `contracts/stage-map/` schema authority.
- Adding generated local map documents or machine-local GLB paths to the repo.
- Adding large or ignored asset files. Do not use `git add -f`.
- New dependencies, file moves, CI or hook behavior changes.

**Intent lens:**
Create a deterministic editor fixture source for the three selected stage-import
cases while keeping raw local map documents, machine-local GLB paths, and bridge
protocol changes out of scope. The fixture should now use the committed
`assets/s2m_props/manifest.json` asset subset and preserve Stage-provenance
source metadata added by STL-450, rather than falling back to built-in debug
assets.

**Current implementation evidence:**
- `apps/editor/src/components/debug/StageImportDebugPanel.tsx` now has `STL-431` command dispatch/status wiring on `origin/main`, but it generates `prop_box` placements in component code rather than reading an external fixture source.
- `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` asserts the three map ids plus current dispatch/status behavior.
- `apps/editor/src/bridge/types.ts` already defines the current `spawn_background_props` payload shape: normalized `map_id`, `document_id`, `source`, and `placements`.
- `docs/ipc/bridge-contract.md` states `spawn_background_props` consumes already-resolved Shotloom-space placements and does not parse raw map document JSON or resolve GLBs.
- `docs/specs/stage-map-document.md` names the selected map documents and says repo code must not hard-code machine-local POC roots.
- `origin/main` now has `assets/s2m_props/manifest.json` from STL-437 / PR #361, with selected-map background GLBs, prop GLBs, `Cube.glb`, and manifest SHA/source metadata.
- `origin/main` now has Stage provenance primitives from STL-450 / PR #359: `StageSourceRef`, `StageProvenance`, and `StageRenderable` asset/source fields.
- The reference POC branch has `apps/editor/src/components/debug/stageImportFixtures.json` with 3 cases and placement counts matching the selected maps: 2, 32, and 72 prop placements.
- The reference POC fixture also includes cube data and counts, but its panel dispatch uses an older wire shape (`props`, document-style `map_id`) and must not be copied directly.

**AC primitive cross-check:**
- AC1 "three map fixtures importable by editor": partially codified. The editor route and fixed buttons exist; the missing primitive is a reusable fixture source that can feed current `spawn_background_props` payloads.
- AC2 "prop placements and debug cube placements": partially codified by the POC fixture. The spec must define whether cube placements are merged into bridge `placements`, kept in separate fixture arrays, or both. The current bridge has one placement list, not a separate cube wire field.
- AC3 "missing GLBs excluded or fallback handled": codified by the stage-map spec and superseded by STL-437 asset subset policy. For this editor POC, use `assets/s2m_props/manifest.json` as the source mapping; do not silently map S2M sources to `prop_box` or internal debug assets.
- AC4 "panel test/typecheck do not fail": codified. Add focused fixture shape/count tests and run the panel test plus `pnpm typecheck:web`.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1 branch/base coordination: STL-431 dispatch wiring is now on `origin/main`. Keep STL-430 main-base and limited to replacing/generated fixture data and tests, without changing the bridge command/status contract.
- P1 wire-shape normalization: POC JSON uses document ids like `Map_1004__Stage1` as `mapId`; bridge payload needs normalized `map_id` values like `Map_1004:Stage1` plus `document_id`. Lock a table and test all three.
- P1 POC salvage boundary: reuse the reference POC data values only after adapting to current bridge types. Do not copy the old panel dispatch shape or stale local asset assumptions.
- P1 asset id policy: use `assets/s2m_props/manifest.json` as source-of-truth. If an entry is not dispatchable yet, keep it as `pending_asset` / `excluded` / explicit fallback metadata instead of silently substituting `prop_box`.
- P1 provenance policy: preserve `source_system`, `source_document_id`, `source_object_id`, `source_category`, `role_hint`, and `representation_hint` where known so STL-453 can promote the debug path into Stage import without losing STL-450 provenance.
- P2 cube placement model: represent floor/wall/obstacle cubes so tests can assert counts and categories without relying only on display-name string parsing.
- P2 fixture typing: prefer a typed TS fixture module or JSON import wrapped by narrow TypeScript interfaces; avoid `any` in production code.
- P2 status/count ownership: if the panel displays prop/cube counts, derive counts from fixture metadata or successful dispatch/event handling consistently with STL-431. Avoid double-counting cube placements as both props and cubes unless the UI copy makes that explicit.
- P3 docs: update only local module docs or existing stage import spec references if the fixture becomes durable enough to need documentation. Do not promote the fixture into `contracts/` unless the user approves a contract scope change.

**Sibling specs scanned:**
- `editor-wire-stage-import-commands.md` - working STL-431. Stance: panel dispatch needs fixture-backed placements and calls out STL-430 as the likely owner. Agrees; coordinate to avoid PR conflict.
- `stage-define-map-document-bundle-layout.md` - completed STL-421. Stance: local map document schema and selected map ids are durable, but real local documents/GLBs remain outside repo. Agrees.
- `stage-add-map-document-parser.md` - completed STL-422. Stance: parser/resolver stays Rust-side and runtime-agnostic; no editor or bridge dispatch. Agrees.
- `bridge-add-background-prop-batch-spawn.md` - completed STL-423. Stance: bridge consumes pre-resolved placement DTOs and owns ownership tags. Agrees.
- `bridge-clear-background-props.md` - completed STL-424. Stance: clear only exact `background_map` props. Agrees.
- `engine-reuse-stage-debug-cube-assets.md` / STL-437 - current stance: S2M stage-import asset subset under `assets/s2m_props/` is the shared input; do not use built-in debug assets as S2M source.
- STL-450 / PR #359 - current stance: Stage renderable/source provenance exists in core; preserve compatible source metadata in fixture data even though STL-430 does not create `StageModel` values.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
