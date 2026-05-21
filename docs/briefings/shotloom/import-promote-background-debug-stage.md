---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-453
repo: shotloom
linear: STL-453
spec: ../../plans/proposed/import-promote-background-debug-stage.md
---

### Shotloom coding mode - mixed

**Issue:** STL-453 "feat(import): background prop debug 경로를 Stage import로 승격"
  Problem: current map-document stage-import debug path creates shot-owned `PropModel` entries through `spawn_background_props`; imported/generated environment content should instead have a Stage-owned import path, while explicit promotion to `PropModel` remains a separate authoring operation.
  Acceptance:
  - map document import can create or update `StageModel`.
  - source document id, source object id, source category, and mapping decision are preserved as Stage provenance.
  - existing background prop debug button/command is not immediately broken.
  - Stage-imported `set_dressing` does not automatically become `PropModel`.
  - reimport preserves user-authored Stage edits by stable source id as much as possible.
  - existing `spawn_background_props` tests and new Stage import tests both pass.
  Affected: `crates/shotloom-stage/src/map_document.rs`, `crates/shotloom-engine/src/bridge/handlers/props.rs`, `crates/shotloom-engine/src/bridge/handlers/stage.rs` or a new stage import handler, `crates/shotloom-core/src/model/`, `contracts/stage-map/`, `docs/specs/stage-map-document.md`, `docs/specs/stage-entity-model.md`
  Linked: ADR-0050, ADR-0054, `docs/specs/stage-entity-model.md`, `docs/specs/stage-map-document.md`, `docs/arch/stage-runtime-topology.md`

**Branch:** `feat/import-promote-background-debug-stage`  (base: `origin/main` `4c6843a3`, PR #385 merged)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/ipc/bridge-contract.md, docs/guidelines/documentation-standard.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md
**ADRs to honor:** ADR-0050 Stage Entity Model, ADR-0054 Stage Content Load-Time Validation, ADR-0007 Shot as Primary Editing Unit, ADR-0009 Void Stage and Coordinate System, ADR-0012 Generated Stage Contract, ADR-0026 Bridge Ordering Contract, ADR-0027 Engine Bridge Schedule
**Ask-first triggers for this task:** bridge protocol/contract changes; core domain-model or validation-rule changes; changes under `contracts/`; Stage role or provenance vocabulary changes; promotion/demotion semantics; new dependencies; removing or reclassifying existing background prop compatibility behavior; production asset-pipeline or local filesystem import scope.
**Intent lens:** Prevent map-document/S2M environment imports from flooding normal shot-owned prop workflows or losing source provenance. The Stage import path should create Stage-owned shell/structure/fixture/set_dressing/proxy/anchor content with source evidence preserved, while legacy `spawn_background_props` remains a compatibility/debug `PropModel` path until an explicit migration or coexistence step replaces it.

**AC primitive cross-check:**
- AC1 "map document import can create/update StageModel": wrong-shape until the spec defines the mutation surface. `StageModel`, `StageElement`, `StageRenderable`, `StageSourceRef`, `StageProvenance`, and runtime hydration are codified, but no map-document-to-StageModel conversion helper or import command exists.
- AC2 "source ids/category/mapping decision preserved": partly codified. `StageSourceRef` carries `source_system`, `source_document_id`, `source_object_id`, `source_category`, `role_hint`, and `representation_hint`; `StageProvenance` carries document/bundle-level provenance. "mapping decision" is not a distinct field today, so the spec must choose whether final role/representation on `StageElement`/`StageRenderable` plus hints is sufficient, or whether a diagnostic/options field is needed.
- AC3 "existing background prop debug button/command not broken": codified compatibility path. `docs/ipc/bridge-contract.md` says `spawn_background_props` / `clear_background_props` remain separate debug surfaces and do not author `StageModel`; `props.rs` and `bridge::tests::props` cover existing behavior.
- AC4 "`set_dressing` does not auto become PropModel": codified as a domain rule in ADR-0050 and `stage-entity-model.md`; promotion/demotion wire commands exist, but runtime handlers still reject through `handle_stage_authoring_not_implemented` on current `main`.
- AC5 "reimport preserves user-authored Stage edits by stable source id": wrong-shape unless the spec locks merge keys and conflict policy. `stage-entity-model.md` says reimport merges by stable source ids and role, but no implementation primitive defines replacement vs preservation, deleted-source handling, manual edits, or duplicate source ids.
- AC6 "existing spawn tests and new Stage import tests pass": verification-example. Use existing `crates/shotloom-engine/src/bridge/tests/props.rs` for compatibility proof, plus new tests around Stage conversion/import state.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Decide the Stage import mutation surface before implementation. Evidence: `crates/shotloom-engine/src/bridge/handlers/stage.rs` currently routes Stage authoring commands to placeholder rejection on `origin/main`; PR #384 for `STL-495` is open with green CI but not merged. Spec question: does STL-453 add a pure conversion helper in `shotloom-stage`/core tests first, add a new engine import command, wait for #384, or explicitly stack on the Stage authoring handler PR? AC-trace: AC1, AC3, Linear blocker `STL-495`.
- P1: Define reimport merge semantics by stable source identity. Evidence: `StageSourceRef` exists, but no helper indexes by `(source_system, source_document_id, source_object_id, role)`; `stage-entity-model.md` only states the policy at a high level. Spec question: when source ids match, which fields are overwritten, which user-authored fields survive, and how are removed or duplicated upstream objects represented? AC-trace: AC5.
- P1: Preserve provenance without inventing hidden Stage roles. Evidence: `StageSourceRef` has role/representation hints; `StageRole` is closed to `shell`, `structure`, `fixture`, `set_dressing`, `zone`, `proxy`, `anchor`. Spec question: exact StoryPreviz/MiniCineV category-to-role mapping and fallback diagnostic policy for unknown categories. AC-trace: AC2, ADR-0050.
- P1: Keep `StageRenderable.asset_id` validation compatible with staged/imported assets. Evidence: core validation requires referenced assets to exist and have kind `stage_renderable`; background prop debug currently uses `AssetKind::Prop`. Spec question: does STL-453 register/copy Stage renderable assets, create Stage content without asset ids, or use fixture/debug renderables first? AC-trace: AC1, AC6.
- P2: Define coexistence/migration from legacy `background_map` props. Evidence: legacy background props persist tags `background_map`, `owner:map_document`, `map:<id>`, `document:<id>`, `source:<source>`, optional `object:<id>`. Spec question: is conversion read-only from tags, side-by-side import, or a command that also clears legacy props after successful Stage import? AC-trace: AC3.
- P2: Define test oracle split. Evidence: existing tests prove `PropModel` spawn/clear; Stage runtime hydration now exists from #385. Spec question: new tests should assert persisted `StageModel` content, runtime Stage topology, and legacy prop compatibility separately rather than only checking event success. AC-trace: AC1, AC3, AC6.
- P2: Confirm docs and contract scope. Evidence: issue lists `contracts/stage-map/`, `stage-map-document.md`, and `stage-entity-model.md`, but `contracts/stage-map` is a local POC input contract, not StageModel authority. Spec question: what docs update is required without making the POC schema own StageModel shape? AC-trace: affected modules, ADR-0051 precedent.

**Sibling specs (Knitten docs):**
- `completed/stage-define-map-document-bundle-layout.md` - completed - stance: owns local POC schema, selected map ids, background ownership, and diagnostics; agrees, but keeps parser/import behavior out of scope.
- `completed/stage-add-map-document-parser.md` - completed - stance: `shotloom-stage` parses/resolves map documents into runtime-agnostic placements and diagnostics; agrees, but deliberately avoids `StageModel` conversion.
- `completed/bridge-add-background-prop-batch-spawn.md` - completed - stance: `spawn_background_props` consumes pre-resolved placements and creates shot-owned props with ownership tags; agrees as legacy compatibility path.
- `completed/bridge-clear-background-props.md` - completed - stance: `clear_background_props` removes exact `background_map` tagged props only; agrees as legacy clear behavior that STL-453 must not break.
- `proposed/core-stage-renderable-provenance.md` - proposed / landed in repo - stance: Stage renderables own asset/provenance hints and `stage_renderable` asset kind; agrees and supplies the provenance primitive STL-453 needs.
- `proposed/stage-model-runtime-hydration.md` - proposed / merged as PR #385 - stance: Stage runtime topology exists separately from shot-owned props; agrees and unblocks viewport/runtime proof for STL-453.
- `proposed/editor-add-stage-import-fixtures.md` - proposed / related - stance: editor sample data preserves S2M provenance without creating `StageModel`; agrees and is a source-data input, not the import path itself.
- `proposed/stage-import-local-map-debug.md` - proposed / related closure - stance: debug panel remains sample/background-prop based and honest about fallback assets; agrees with keeping legacy debug path separate.
- `proposed/bridge-add-stage-authoring-contract.md` - proposed / partially landed as current bridge contract - stance: authored Stage wire contract exists and keeps background prop paths separate; agrees, but runtime handlers are not all implemented on current `main`.
- `proposed/bridge-stage-lifecycle-edit-handlers.md` and `proposed/bridge-split-stage-handlers.md` - proposed / sibling-owned - stance: lifecycle/edit handler behavior and handler layout are split PR work; caution that STL-453 must not silently depend on #384 / `STL-495` until it merges or this task explicitly stacks on it.
- Deleted sibling specs: none found for overlapping slug terms.

**Pre-write checklist passed:**
- [x] gh auth: `tomlim2`
- [x] Shotloom repo commit identity: `tomlim2 <deemo@vonvon.me>`
- [x] conventions re-read: AGENTS, CONTRIBUTING, ADR index
- [x] category: mixed
- [x] targeted sections loaded
- [x] #385 rechecked: PR merged at 2026-05-21T03:00:39Z, merge commit `4c6843a3a2c689a8bd5d19fb657ccf584a08a9a6`
- [x] Linear blocker cleanup: `STL-452` relation removed after Done; remaining blockedBy is `STL-495`
- [x] #384 rechecked: PR open, CI green, not merged; treat as implementation blocker unless spec chooses an explicit stack
- [x] worktree fast-forwarded to `origin/main` `4c6843a3`
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans/ + docs/briefings/shotloom/, overlapping current and deleted paths)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
