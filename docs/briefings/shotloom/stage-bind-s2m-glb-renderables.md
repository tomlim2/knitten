---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-510
repo: shotloom
linear: STL-510
spec: ../../plans/proposed/stage-bind-s2m-glb-renderables.md
branch: feat/import-promote-background-debug-stage
---

# Bind S2M GLB Assets To StageRenderable

## Task

`STL-510` covers the blocker discovered while testing the `STL-453` stage
import flow: `/debug/stage-import` can create Stage map content, but the S2M
background/prop/cube GLBs are not bound to `StageRenderable.asset_id`, so the
runtime falls back to checker placeholders instead of loading the actual GLB
scene.

This work stays on `feat/import-promote-background-debug-stage` because it is a
blocker slice for draft PR #390 / `STL-453`. A fresh worktree from the canonical
derived branch would lose the parent stack context needed to debug and verify
the same import route.

## Standards Loaded

- Knitten `SYSTEM.md`
- Shotloom `AGENTS.md`
- `~/.claude/rules/shotloom.md`
- Knitten docs lane: `agent/rules/shotloom-docs-lane.md`
- Knitten LLM-first docs policy:
  `agent/standards/policy/llm-first-docs.md`
- Shotloom `CONTRIBUTING.md`
- `docs/adr/README.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/review-rust.md`
- `docs/guidelines/review-typescript.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/pr-guideline.md`
- `docs/ipc/bridge-contract.md`

## Preflight State

| Check | Result |
|---|---|
| Active GitHub account | `tomlim2`; stale inactive `deemotl` auth warning is non-blocking. |
| Shotloom worktree | `shotloom-github/.worktrees/import-promote-background-debug-stage` |
| Branch | `feat/import-promote-background-debug-stage` |
| Base relation | 2 commits ahead of `origin/main` before the STL-510 dirty work. |
| Git identity | `tomlim2 <deemo@vonvon.me>` in Shotloom. |
| Knitten docs lane | Primary Knitten checkout is dirty, so docs use `knitten-worktrees/20260521-shotloom-docs` on `codex/20260521-shotloom-docs`. |
| Knitten identity | `tomlim2 <tomandlim@gmail.com>`. |
| Running build processes | No leftover `build-wasm`, `wasm-pack`, `shotloom-web`, or `cargo` process found. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-510` |
| Title | `feat(stage): S2M GLB를 StageRenderable asset으로 바인딩` |
| State | In Progress |
| Priority | High |
| Relation | Blocks `STL-453`. |
| Goal | Register S2M GLB assets as Stage renderables, pass them through `import_stage_map.asset_hint`, persist them on `StageRenderable.asset_id`, and hydrate GLB `SceneRoot` entities at runtime. |
| Non-goals | External S2M API, general asset browser/UI, automatic promotion to `PropModel`, removal of PR #390 placeholder preview. |

## Current Truth

| Surface | Evidence | Meaning for `STL-510` |
|---|---|---|
| Stage asset kind | `crates/shotloom-core/src/model/asset.rs` | `AssetKind::StageRenderable` already exists and is the correct manifest kind. |
| Bundle validation | `crates/shotloom-core/src/model/validate.rs`, `crates/shotloom-core/src/model/bundle.rs` | Stage renderable asset references are already validated against the manifest and kind. |
| Bridge contract | `docs/ipc/bridge-contract.md` §13A.2 | `import_stage_map` already accepts optional `asset_hint`, and present hints must resolve to manifest assets with kind `stage_renderable`. |
| Stage import samples | `apps/editor/src/components/debug/stageImportSamples.ts` and `.json` | Sample metadata has S2M source asset/document data, but the command path needs deterministic `asset_hint` values. |
| Engine import handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | The handler can save `asset_hint.asset_id` onto `StageRenderable`; missing or unresolved hints leave placeholders. |
| Runtime topology | `crates/shotloom-engine/src/stage_runtime.rs`, `crates/shotloom-engine/src/model_sync.rs` | Authored Stage runtime hydration exists, but the GLB SceneRoot path for StageRenderable assets is the missing binding. |
| Prop GLB precedent | `crates/shotloom-engine/src/entity.rs` | Shot-owned props already have a GLB SceneRoot loading precedent; Stage should reuse the idea without promoting content to `PropModel`. |
| Asset serving | `apps/editor/vite.config.ts`, `apps/editor/runtime-assets.ts` | Dev serves repo `assets`; production copy list must include `assets/s2m_props` for the debug route to work after build. |

## AC Primitive Cross-Check

- AC1 S2M background/prop/cube GLBs registered as `stage_renderable`:
  partially codified. `AssetKind::StageRenderable` and validation exist; the
  concrete built-in S2M registration location/lifecycle must be locked.
- AC2 `import_stage_map` passes a registered asset through `asset_hint` and
  saves it to `StageRenderable.asset_id`: codified by bridge contract and
  handler shape. The editor sample path must now populate the hint.
- AC3 runtime hydrates GLB `SceneRoot` from `StageRenderable.asset_id`:
  sibling-owned precedent exists for props; Stage-specific behavior must be
  added to runtime hydration and documented in topology.
- AC4 load failure keeps placeholder preview plus diagnostic: placeholder
  fallback is codified by existing Stage runtime behavior, but the exact
  diagnostic channel needs a decision: tracing warning versus bridge-visible
  `validation_diagnostics`.
- AC5 `/debug/stage-import` `Stage Map_1004` shows S2M GLB content:
  verification example. Needs browser verification after the implementation
  and a production asset-copy check.
- AC6 existing `Props Map_*` compatibility and `prop_box` fallback remain:
  codified by existing background-prop debug path and panel tests. Do not move
  this compatibility path into StageRenderable.
- AC7 Rust/TS tests and browser verification: verification requirement.

## Related Sibling Scan

- `stage-model-runtime-hydration`: agrees. Stage runtime topology exists and is
  distinct from `PropModel`; STL-510 extends hydration to actual GLB assets.
- `core-stage-renderable-provenance`: agrees. StageRenderable asset/provenance
  primitives exist; STL-510 binds real S2M assets to them.
- `editor-add-stage-import-fixtures`: agrees. S2M sample metadata and fixture
  data are editor-owned inputs; STL-510 consumes them through `asset_hint`.
- `editor-wire-stage-import-commands`: agrees. The debug panel command path is
  already the user-facing verification route; STL-510 updates its Stage path,
  not the legacy prop path.
- `stage-import-local-map-debug`: agrees. Local S2M map debugging is the route;
  this issue replaces placeholder output with renderable asset binding.
- `import-add-prop-gltf`: precedent only. It proves GLB SceneRoot loading for
  props, but STL-510 must keep Stage content as Stage content.
- `bridge-add-stage-authoring-contract`, `bridge-stage-lifecycle-edit-handlers`,
  `bridge-split-stage-handlers`, `core-add-shot-local-stage-model`, and
  `adr-record-stage-entity-model`: no conflict. They define the Stage model and
  bridge boundaries that this slice must preserve.
- `stage-ground-visibility-toggle`: adjacent. The ground visibility fix can
  coexist with StageRenderable GLB hydration; this issue should not alter the
  runtime-only ground command.
- `stage-validation-matrix`: adjacent. Do not expand into new tag/options
  validation rules.
- `stage-add-map-document-parser` and
  `stage-define-map-document-bundle-layout`: adjacent parser/layout history.
  STL-510 should not add a parser or live Story Previz connector.
- Deleted `import-add-prop-gltf-preflight`: precedent only for careful GLB
  validation/diagnostic discipline, not a Stage import requirement.

## Spec-Risk Handoff

- P1: Built-in registration lifecycle. Register S2M StageRenderable assets both
  for initial bundles and after `new_bundle`, because `new_bundle` resets the
  manifest and is the path used by the debug route.
- P1: Runtime load-failure diagnostic channel. Decide whether "diagnostic"
  means structured tracing/logging from Stage runtime hydration or a
  bridge-visible `validation_diagnostics` event. A bridge event may require a
  larger contract change.
- P1: Shell/background behavior. Decide that real Shell GLBs may load as
  SceneRoot content, while placeholder fallback for shell backgrounds should
  avoid reintroducing the checker floor occlusion problem.
- P1: Asset ID derivation. Use one deterministic, path-safe derivation shared
  by TS sample hints and Rust seeded manifest entries. `AssetCatalog` already
  rejects unsafe IDs.
- P2: Production asset availability. Add `assets/s2m_props` to editor runtime
  asset copy coverage; Vite dev serving is not enough proof.
- P2: Preserve legacy Props Map compatibility. Keep `Props Map_*` and
  `prop_box` fallback tests green.
- P2: Keep Stage/Prop identity separate. Do not promote S2M Stage content to
  `PropModel` for this issue.
- P3: Docs altitude. Update bridge/topology/spec docs only where they describe
  this binding; do not reopen the Stage entity model ADR.

## Ask-First Triggers

Ask before changing bridge command/event wire shape, adding a new diagnostic
event contract, changing Stage persistence schema, replacing the legacy
background-prop path, introducing external S2M API calls, adding dependencies,
or changing Bevy schedule/plugin registration beyond the existing model-sync
hydration path.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
