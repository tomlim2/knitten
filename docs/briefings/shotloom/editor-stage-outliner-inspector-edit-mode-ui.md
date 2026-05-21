---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-454
repo: shotloom
linear: STL-454
spec: ../../plans/proposed/editor-stage-outliner-inspector-edit-mode-ui.md
---

### Shotloom coding mode - TypeScript editor + bridge UI

**Issue:** STL-454 "feat(editor): Stage outliner/inspector/edit mode UI 연결"
Problem: Authored Stage data is now persisted, hydrated, and bridge-editable,
but the editor UI still treats scene rows as character/prop-only and has no
surface that distinguishes Stage-owned content from shot-owned `PropModel`
objects.

**Acceptance:**
- Stage and shot-owned props are visually and interaction-wise distinct in the
  editor UI.
- Normal prop editing mode does not accidentally edit locked Stage-owned
  content as props.
- Stage edit mode can inspect `shell`, `structure`, `fixture`,
  `set_dressing`, `proxy`, and `anchor` elements.
- Promotion from Stage-owned set dressing to `PropModel` is explicit and reads
  as reversible-looking user action.
- Source provenance plus role and representation are visible in the inspector.
- Editor tests or Playwright/RTL tests verify major interactions.

**Branch:** `feat/editor-stage-authoring-ui`\
Worktree:
`/Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/editor-stage-authoring-ui`\
Base: `origin/main` at `12bcb9d7` (`feat(bridge): handle stage lifecycle and
edit commands (#384)`). Branch is clean and configured as
`tomlim2 <deemo@vonvon.me>`.

**Linear state:** moved to `In Progress`.

**Standards loaded:** `AGENTS.md`, `CONTRIBUTING.md`,
`docs/guidelines/review-typescript.md`,
`docs/guidelines/error-handling.md`,
`docs/guidelines/documentation-standard.md`,
`docs/guidelines/commit-guideline.md`, `docs/guidelines/pr-guideline.md`,
ADR index, ADR-0002, ADR-0003, and ADR-0050.

**ADRs and specs to honor:** ADR-0002 React + TypeScript editor shell,
ADR-0003 wasm-bindgen bridge, ADR-0050 Stage entity model,
`docs/specs/stage-entity-model.md`, and `docs/ipc/bridge-contract.md` §13A.2
/ §22A.2.

**Ask-first triggers for this task:** bridge protocol or DTO shape changes,
Stage persistence/schema changes, changing runtime handler semantics, adding new
dependencies, broad design-system refactors, route/tree migrations, or changing
the Stage/Prop promotion contract beyond calling the existing bridge command.

**Intent lens:** This is the first production editor surface for authored
Stage. Keep it as UI/state wiring over the already landed Stage read model and
commands. Do not reopen the bridge contract, engine handler behavior, or import
pipeline unless live code proves a blocker.

## Current Implementation Evidence

| Surface | Evidence | Meaning for STL-454 |
|---|---|---|
| Stage bridge read model | `apps/editor/src/bridge/shot.ts` | `Shot` now exposes `stages` and optional `active_stage_id`; Stage element/renderable role, representation, source, visible, and lock fields are typed. |
| Stage command/event types | `apps/editor/src/bridge/types.ts` | `create_stage`, `duplicate_stage`, `delete_stage`, `set_active_stage`, `update_stage`, `update_stage_element`, `replace_stage_renderable`, `promote_stage_content_to_prop`, and matching success events exist. |
| Engine behavior | `docs/ipc/bridge-contract.md` §13A.2 | Lifecycle/edit commands mutate runtime bundle state; promote/demote remain reserved placeholders that reject in the current runtime slice. |
| Bundle store | `apps/editor/src/state/bundleStore.ts` | Mirrors characters, props, asset usage, selected ids, and selected clip, but not stages or active Stage yet. |
| Bundle event binding | `apps/editor/src/state/BundleStateProvider.tsx` | `shot_loaded` hydrates characters/props only; Stage success events are not reduced into editor state yet. |
| Outliner | `apps/editor/src/components/SceneOutlinerPanel.tsx` and `components/outliner/*` | Scene panel renders only Characters and Props sections. Row selection dispatches `select_entities` with runtime ids. |
| Inspector shell | `apps/editor/src/App.tsx` + `Sidebar` | Top bar can open an "Inspector overlay", but there is no Stage-aware inspector component yet. |
| Delete/transactions | `apps/editor/src/commands/sceneObjectDeleteTransaction.ts` | Existing delete helpers are character/prop-only and use transaction wrappers. Stage lifecycle/edit commands need their own action labels/helpers if user actions mutate bundle state. |
| Tests | `apps/editor/src/components/__tests__/SceneOutlinerPanel.test.tsx` and `state/__tests__/BundleStateProvider.test.tsx` | Good local pattern for RTL coverage; current assertions prove only character/prop rows and character/prop event hydration. |

## AC Primitive Cross-Check

- Stage vs prop distinction: codified by ADR-0050 and
  `docs/specs/stage-entity-model.md` concept boundary. Editor store/UI is
  missing the Stage mirror and section.
- Active Stage display/set-active: codified by `Shot.active_stage_id`,
  `set_active_stage`, `active_stage_changed`, `stage_created`, and
  `stage_deleted`. Editor state is missing the reducer path.
- Normal prop editing must not edit locked Stage content: codified by Stage role
  defaults and `update_stage_element` lock semantics. UI must not reuse prop
  delete/edit helpers for Stage rows.
- Stage edit mode reveal/inspect: codified at the product/spec level by
  `Toggle stage edit mode` in `stage-entity-model.md`, but no editor UI state
  primitive exists yet.
- Role/representation/provenance display: Stage DTOs expose `role`, renderable
  `kind`, and `source`. Inspector UI and tests are missing.
- Renderable replacement/visibility/lock toggles: bridge commands exist for
  `replace_stage_renderable` and `update_stage_element`. Editor must define
  command helper/state/error behavior before wiring controls.
- Promotion UX: command type exists, but runtime currently preserves it as
  reserved placeholder rejection. The spec must decide whether STL-454 shows a
  disabled/coming-soon action, dispatches and surfaces rejection, or waits for
  boundary handlers.

## Spec-Risk Handoff For `/shotloom-draft-spec`

- P1: Define the editor Stage state mirror before UI controls. `BundleState`
  likely needs `stages`, `activeStageId`, and helper updates for `shot_loaded`,
  Stage success events, and bundle reset. AC-trace: active Stage display,
  stage rows, inspector data.
- P1: Lock Stage row bridge entity ids. Engine runtime hydration introduced
  Stage-owned runtime entities, but the editor must know the stable selection id
  form for stage roots/elements/renderables before outliner selection can be
  tested. If not documented in bridge contract, spec should inspect engine
  emitted `selection_changed` ids before implementing.
- P1: Do not route Stage deletes through prop deletion helpers. Stage deletion
  must dispatch `delete_stage`; element visibility/lock must dispatch
  `update_stage_element`; replacement must dispatch `replace_stage_renderable`.
- P1: Decide the Stage edit mode state owner. A local editor interaction flag is
  probably enough for reveal/inspect gating, but it must not pretend to change
  engine visibility or locking until a bridge command is sent.
- P1: Promotion UX is currently ahead of runtime behavior. Since
  `promote_stage_content_to_prop` still rejects with `INVALID_STAGE_PAYLOAD` in
  this runtime slice, the first spec should either render it disabled with clear
  copy or explicitly test visible rejection handling rather than promising
  successful promotion.
- P2: Inspector should derive labels from model semantics: Stage display name,
  active marker, element role, visible/locked status, renderable representation
  kind, asset id, and `StageSourceRef` provenance/hints.
- P2: Test oracle should be RTL-first: store hydration from `shot_loaded`,
  outliner Stage section rendering, active-stage click dispatch, edit-mode gated
  element reveal, lock/visibility command dispatch, and inspector provenance
  rendering. Playwright is optional unless layout/viewport interaction becomes
  material.
- P2: Docs likely need a small Stage UI behavior note in
  `docs/specs/stage-entity-model.md` only if the implementation defines a new
  durable editor behavior not already captured by the role/default-behavior
  table.
- P3: `docs/specs/stage-entity-model.md` Status is current enough for bridge
  lifecycle/edit, but ADR-0050 still says bridge commands/runtime hydration are
  out of scope for the ADR. Do not edit ADR-0050 unless the spec explicitly
  chooses a doc cleanup.

## Sibling Specs Scanned

- `stage-model-runtime-hydration.md` / briefing - completed premise for this
  work. It explicitly scoped out editor Stage outliner/inspector/edit mode, and
  now provides the distinct Stage runtime topology STL-454 can target.
- `bridge-wire-contract.md` / briefing - direct prerequisite. It added Stage
  read models, commands, events, fixtures, and TypeScript mirrors while leaving
  editor UI out of scope.
- `bridge-stage-lifecycle-edit-handlers.md` / briefing - direct prerequisite.
  It turns lifecycle/edit commands into real mutations and keeps promote/demote
  boundary behavior out of scope.
- `core-stage-renderable-provenance.md` - direct data source for inspector
  provenance and representation hints. It explicitly left editor UI to STL-454.
- `editor-wire-stage-import-commands.md` - adjacent debug path only. It wires
  legacy `spawn_background_props` / `clear_background_props`; do not confuse it
  with authored Stage UI.
- `editor-add-common-ui-components.md` - adjacent UI foundation. If shared
  `Button`/tokens exist on current main when implementing STL-454, use them;
  otherwise do not turn STL-454 into a broad component-foundation PR.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
