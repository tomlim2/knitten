---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-510
repo: shotloom
linear: STL-510
spec: ../../plans/proposed/stage-bind-s2m-glb-renderables.md
---

### Shotloom coding mode — mixed

**Issue:** STL-510 "feat(stage): main 기준 S2M Stage import GLB renderable 경로 구현"
  Problem: `main` 기준 `/debug/stage-import`가 S2M sample을 Stage-owned content로 import하고 `StageRenderable.asset_id`를 실제 S2M GLB scene request까지 닫아야 한다.
  Acceptance:
  - main 기준 PR diff만으로 Stage import -> StageModel -> StageRenderable asset binding -> GLB scene request가 설명되어야 한다.
  - `Stage Map_*`는 Stage-owned import path, `Props Map_*`는 기존 shot-owned prop compatibility path로 남아야 한다.
  - `StageRuntimeRenderable` wrapper는 identity boundary이고, GLB `SceneRoot`와 placeholder preview는 wrapper child로 분리되어야 한다.
  - scene asset loaded 상태가 확인되면 placeholder child를 제거해야 한다.
  - `new_bundle`은 seeded S2M built-in assets를 유지하면서 editor reset을 명시적으로 전달해야 한다.
  - Stage renderable asset request/resolution failure diagnostics는 IPC docs와 일치해야 한다.
  Affected: `apps/editor/src/components/debug`, `apps/editor/src/bridge`, `crates/shotloom-core/src/bridge`, `crates/shotloom-core/src/model`, `crates/shotloom-engine/src/bundle_state.rs`, `crates/shotloom-engine/src/bridge`, `crates/shotloom-engine/src/stage_runtime.rs`, `docs/ipc`, `docs/arch`.
  Linked: ADR-0021, ADR-0050, ADR-0054, `docs/arch/stage-runtime-topology.md`, `docs/ipc/bridge-contract.md`, draft PR #390 as historical context only.

**Branch:** feat/stage-bind-s2m-glb-renderables  (base: origin/main @ 1211b6fd)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/guidelines/documentation-standard.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0021 diagnostics are parallel observations; ADR-0050 Stage is shot-local environment content and must not become PropModel implicitly; ADR-0054 invalid persisted Stage content is load-blocking.
**Ask-first triggers for this task:** bridge protocol field addition (`bundle_changed.summary` reset flag), bridge command addition (`import_stage_map`), Bevy ECS ordering/plugin-registration changes, core domain-model validation changes if asset seeding/validation contract changes beyond existing `StageRenderable.asset_id` rules.
**Intent lens:** Close the broken Stage import/render path on `main` without stacking on PR #390. Preserve Stage/Prop ownership separation, make S2M asset identity deterministic across editor and runtime, and avoid the previous placeholder/GLB ambiguity where fallback and real scene representation could live on the same entity.

**AC primitive cross-check:**
- AC main-based self-contained PR: codified - CONTRIBUTING/AGENTS prohibit hidden stacked dependency; Linear explicitly says base branch is `main` and #390 is historical context only.
- AC `import_stage_map` dispatch: wrong-shape - `rg import_stage_map` finds no Rust/TS bridge command on main; the spec must codify command DTO, handler, transaction coverage, docs, and tests before wiring the panel.
- AC Stage vs Props buttons: partially codified - `StageImportDebugPanel.tsx` currently dispatches only `spawn_background_props`; `spawn_background_props` is codified in Rust/TS/docs as the compatibility path, but Stage path is absent.
- AC S2M source id -> `asset_hint.asset_id`: wrong-shape - `stageImportSamples.json` has `source_asset_id`, but current bridge/core Stage DTO surface has no import command payload carrying `asset_hint`.
- AC `StageRenderable.asset_id` binds stage renderable assets: codified - `StageRenderable.asset_id` exists and `ShotModel` validation rejects missing/wrong-kind assets when an asset catalog is provided; `AssetKind::StageRenderable` exists.
- AC curated S2M GLBs seeded as built-ins: wrong-shape - `BundleModelResource::demo()` and `new_bundle` replacement paths currently seed no S2M StageRenderable assets; seeding must be explicit and match editor id derivation.
- AC runtime `SceneRoot` child under Stage wrapper: wrong-shape - `stage_runtime.rs` currently spawns marker-only `StageRuntimeRenderable` wrappers; model_sync tests explicitly state GLB `SceneRoot` loading is outside the runtime-topology pass.
- AC placeholder child removed after scene loaded: wrong-shape - no Stage renderable scene-load state or placeholder child lifecycle exists on main.
- AC no Prop/ShotEntity/BridgeEntity on Stage runtime entities: codified intent, needs new regression - stage runtime components are separate today; tests must assert the new scene/placeholder children do not attach shot-owned identity.
- AC `bundle_changed.summary.bundle_reset` or equivalent: wrong-shape - Rust `BundleChangedSummary` and TS `BundleChangedEvent` only expose `character_count` and `asset_count`; additive optional field must be codified in Rust/TS/docs/fixtures/tests.
- AC request/resolution diagnostics: codified channel, wrong-shape codes - ADR-0021 and `validation_diagnostics` exist; this task needs specific code/source/reason rows for Stage renderable request/resolution failure.
- AC async Bevy loader failure diagnostic: verification-example / non-goal - Linear says async loader failure status is follow-up, not required for this PR.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Should `import_stage_map` be a new bridge command in this PR, and what exact payload owns `asset_hint`? - evidence: no `import_stage_map` in `BridgeCommand` or TS `Command`; `StageImportDebugPanel.tsx` only uses `spawn_background_props` - AC-trace: Linear implementation scope 1.
- P1: How is deterministic S2M asset id derivation shared between editor sample conversion and runtime manifest seeding? - evidence: `stageImportSamples.json` stores `source_asset_id` values such as `s2m_props:background/Map_1004.glb`; `AssetCatalog` rejects path-like ids - AC-trace: Linear implementation scope 1/2.
- P1: Where does Stage built-in seeding plug into bundle replacement without breaking `new_bundle` event order and load replay? - evidence: `BundleModelResource::demo()` empty assets; `replacement_plan_for_bundle()` computes summary before commit and replays assets in order - AC-trace: reset/event consistency AC.
- P1: What exact additive reset field is used on `bundle_changed.summary`, and how is TS backward compatibility represented? - evidence: Rust/TS summary structs lack reset field - AC-trace: Linear implementation scope 4 and bridge ask-first rule.
- P1: What is the Stage runtime entity topology and state machine for wrapper, scene child, placeholder child, requested/loading/loaded states? - evidence: `stage_runtime.rs` marker-only wrappers; model_sync test says SceneRoot is outside topology - AC-trace: GLB scene/placeholder AC.
- P1: Can scene request failure after manifest resolution persist partial StageModel state? If yes, does the command reject before mutation or import Stage plus diagnostics? - evidence: `spawn_background_props` allows partial success; Stage import is new command with bundle mutation + asset resolution coupling - AC-trace: diagnostics and main-based self-contained AC.
- P2: How should `validation_diagnostics` classify missing StageRenderable asset, wrong asset kind, and unrequestable GLB URI? - evidence: ADR-0021, `docs/ipc/bridge-contract.md` §23.1, `ShotModel` validation already has missing/wrong-kind errors - AC-trace: diagnostics/docs AC.
- P2: How will tests prove Stage runtime entities remain separate from props after GLB scene load? - evidence: existing `StageRuntimeRenderable` does not use `Prop`, `ShotEntityIdComponent`, or `BridgeEntityId`; new child SceneRoot path could accidentally reuse prop loader - AC-trace: Stage runtime loading AC.
- P2: Should Stage runtime hydration receive a manifest/asset resolver or should scene request be a separate post-hydration system? - evidence: current `hydrate_stage_runtime(world, stages, active_stage_id, map)` has no manifest or `AssetServer` input - AC-trace: GLB scene request AC.
- P2: What exact docs change scopes are required: IPC command/event diagnostics, topology doc, and maybe MAP? - evidence: `docs/ipc/bridge-contract.md` lacks `import_stage_map`; `docs/arch/stage-runtime-topology.md` says asset loading is outside topology - AC-trace: docs acceptance.
- P3: Keep PR body clear that #390 is not a dependency; mention it only as historical draft context if at all - evidence: Linear implementation memo - AC-trace: main-based PR AC.

**Sibling specs (Knitten docs):**
- `stage-model-runtime-hydration.md` - HEAD/proposed - stance: adds marker-only Stage runtime topology and explicitly defers GLB SceneRoot loading - agrees on Stage/Prop separation, disagrees with STL-510 scope because STL-510 must extend beyond marker-only hydration.
- `core-stage-renderable-provenance.md` - HEAD/proposed - stance: adds `StageRenderable.source`, `representation_hint`, and `AssetKind::StageRenderable` validation - agrees; STL-510 should reuse this model rather than inventing asset semantics.
- `editor-add-stage-import-fixtures.md` - HEAD/proposed - stance: records S2M selected map samples/source ids and provenance-compatible metadata - agrees; STL-510 should consume current `stageImportSamples` shape and derive stable StageRenderable asset ids from it.
- `editor-wire-stage-import-commands.md` - HEAD/proposed - stance: wires panel to `spawn_background_props` with `prop_box` fallback - sibling-owned legacy compatibility path; STL-510 must split Stage-owned buttons from this fallback instead of replacing it silently.
- `stage-import-local-map-debug.md` - HEAD/proposed - stance: closes debug flow through existing selected-map sample + props fallback, preserves diagnostics and S2M provenance - agrees as fallback/history; STL-510 supersedes the Stage-owned GLB path.
- `bridge-add-stage-authoring-contract.md`, `bridge-stage-lifecycle-edit-handlers.md`, `bridge-split-stage-handlers.md`, `core-add-shot-local-stage-model.md`, `stage-validation-matrix.md`, `stage-ground-visibility-toggle.md`, `stage-define-map-document-bundle-layout.md`, `stage-add-map-document-parser.md` - HEAD/completed/proposed/draft - stance: earlier Stage model, parser, lifecycle, and validation foundations - agrees; no direct disagreement found.
- `import-add-prop-gltf.md` - deleted - stance: older GLTF prop import preflight - sibling only as historical import context; not owner for StageRenderable GLB runtime path.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] Shotloom repo commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, ADR index
- [x] category: mixed
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans/ + docs/briefings/shotloom/, every matching slug accounted for)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
