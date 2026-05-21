---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-454
repo: shotloom
linear: STL-454
briefing: ../../briefings/shotloom/editor-stage-outliner-inspector-edit-mode-ui.md
---

# Editor Stage Outliner Inspector Edit Mode UI

## Spec Contract

- Briefing basis: `../../briefings/shotloom/editor-stage-outliner-inspector-edit-mode-ui.md`
  captures STL-454 after Stage persistence, bridge wire, lifecycle/edit
  handlers, and runtime hydration landed.
- Current truth: the editor bridge can read and mutate authored Stage data, but
  the editor state store, scene outliner, and inspector still expose only
  characters and shot-owned props.
- Required change: add editor-owned Stage state, outliner rows, Stage edit-mode
  inspection, active-stage controls, lock/visibility/edit command wiring, and
  provenance/role/representation display without treating Stage-owned content
  as `PropModel`.
- Locked boundary: no bridge protocol redesign, no persisted schema change, no
  engine runtime selection-id work, no import pipeline work, and no successful
  promote/demote behavior while Stage/Prop boundary handlers still reject.
- Proof method: focused RTL/store tests prove Stage state hydration, local Stage
  selection, active-stage updates, edit-mode gated inspection, command dispatch,
  and provenance rendering; broader editor checks verify TypeScript/React
  integration.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage read model | `apps/editor/src/bridge/shot.ts::Shot`, `Stage`, `StageElement`, `StageRenderable` | Already Done | `shot_loaded` payloads can carry `stages` and optional `active_stage_id`; DTOs expose role, representation kind, source, visibility, and lock. |
| Stage command/event types | `apps/editor/src/bridge/types.ts` | Already Done | Lifecycle/edit commands and success events exist, including `set_active_stage`, `update_stage_element`, and `replace_stage_renderable`. |
| Stage runtime topology | `crates/shotloom-engine/src/stage_runtime.rs`, `docs/arch/stage-runtime-topology.md` | Already Done / boundary evidence | Runtime Stage roots/elements/renderables are separate from shot-owned props and intentionally do not carry `BridgeEntityId` or `ShotEntityIdComponent`. |
| Stage authoring command behavior | `docs/ipc/bridge-contract.md` §13A.2 / §22A.2 | Partial for STL-454 | Lifecycle/edit commands mutate state; `promote_stage_content_to_prop` and `demote_prop_to_stage_content` remain reserved placeholders that reject with `INVALID_STAGE_PAYLOAD`. |
| Bundle store | `apps/editor/src/state/bundleStore.ts` | Partial | Stores characters, props, assets, selection ids, and asset usage, but no Stage mirror, active Stage id, or editor-owned Stage selection. |
| Bundle event reducer | `apps/editor/src/state/BundleStateProvider.tsx` | Partial | Hydrates characters/props from `shot_loaded`; ignores Stage success events. |
| Scene outliner | `apps/editor/src/components/SceneOutlinerPanel.tsx`, `apps/editor/src/components/outliner/*` | Partial | Renders `CharactersSection` and `PropsSection`; existing rows dispatch `select_entities` with runtime bridge ids. |
| Inspector overlay | `apps/editor/src/App.tsx`, `apps/editor/src/components/Sidebar.tsx` | Missing for Stage | The top bar opens an inspector shell, but no Stage-aware inspector component or selected Stage target exists. |
| Transaction helpers | `apps/editor/src/commands/sceneObjectDeleteTransaction.ts`, `editorTransactionActions.ts` | Partial | Character/prop deletion helpers exist; no Stage action labels or helpers exist for Stage commands. |
| Existing RTL patterns | `apps/editor/src/components/__tests__/SceneOutlinerPanel.test.tsx`, `apps/editor/src/state/__tests__/BundleStateProvider.test.tsx` | Already Done / reusable proof pattern | Tests already cover store seeding, outliner row rendering, command dispatch, and event reduction for adjacent character/prop flows. |
| Shared UI foundation | `apps/editor/src/components/ui/Button.tsx` if present on final base | Conditional | STL-490 is adjacent; use shared primitives if present, but do not turn STL-454 into a component-foundation PR. |
| Stage entity spec | `docs/specs/stage-entity-model.md` | Already Done | Defines Stage/Prop concept boundary, role defaults, representation rules, edit mode intent, and provenance/hint vocabulary. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-454` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Connect authored Stage data to editor outliner/inspector/edit-mode UI so Stage-owned content is visible and distinct from shot-owned props. |
| Acceptance criteria | Stage/prop UI distinction; normal prop mode cannot edit locked Stage content; Stage edit mode can inspect roles; explicit promotion affordance; provenance/role/representation visible; editor interaction tests. |
| Latest relevant comment | N/A |
| Blockers / dependencies | `STL-495`, `STL-496`, and `STL-452` are effectively satisfied on current `origin/main`; #384 and #385 provide Stage handlers/hydration. |
| Related PRs | #384 Stage lifecycle/edit handlers; #385 Stage runtime hydration; earlier #370/#377 bridge/validation slices. |
| Current review state | No PR for STL-454 yet. |
| Planning consequence | This should be one editor-focused PR only if it uses the existing Stage wire/read model and avoids engine selection-id or promote/demote runtime work. |

## Problem

Authored Stage data now exists in the bundle, travels through `shot_loaded`, can
be mutated through Stage lifecycle/edit commands, and hydrates into a distinct
engine runtime topology. The editor still mirrors only characters and shot-owned
props. That makes Stage-owned shell, structure, fixture, set dressing, proxy,
and anchor content invisible to normal authoring UI and risks future code
reusing prop workflows for Stage-owned data.

The first Stage UI slice must make Stage content inspectable and editable from
the editor while preserving the ownership boundary: Stage rows are not props,
Stage runtime wrappers are not bridge-selectable shot entities today, and
promotion/demotion remains a reserved bridge boundary until the runtime handler
slice lands.

## Options Considered

| Option | Summary | Result |
|---|---|---|
| Reuse `select_entities` and engine bridge entity ids for Stage rows | Treat Stage roots/elements/renderables like characters and props in outliner selection. | Rejected. `stage-runtime-topology.md` and engine tests state Stage runtime entities do not carry `BridgeEntityId` or `ShotEntityIdComponent`, so this would require engine/runtime scope outside STL-454. |
| Add editor-owned Stage selection and inspector state | Mirror Stage DTOs in `bundleStore`, store a selected Stage target locally, and dispatch Stage authoring commands for actual mutations. | Selected. It matches current editor architecture and keeps Stage/Prop ownership separate without new bridge protocol. |
| Build a full Stage editor including successful promotion/demotion and renderable asset picking | Implement all UI controls implied by Linear in one PR. | Rejected for this slice. Promote/demote still reject in the current runtime, and broad asset picking/import behavior belongs to later Stage/Prop boundary or import work. |

Selected direction: editor-owned Stage authoring UI. Outliner Stage rows select
local inspector targets and active Stage state through Stage commands; they do
not pretend Stage runtime entities are selectable bridge entities.

## Requirements

1. Add a Stage mirror to editor state: current-shot `stages`, `activeStageId`,
   and a local selected Stage target that can represent a Stage root, element,
   or renderable.
2. Hydrate Stage state from `shot_loaded` and reduce Stage success events:
   `stage_created`, `stage_duplicated`, `stage_deleted`,
   `active_stage_changed`, `stage_updated`, `stage_element_updated`, and
   `stage_renderable_replaced`.
3. Clear Stage state, selected Stage target, and active Stage id on fresh
   bundle reset and remove stale selected Stage targets when their owning Stage,
   element, or renderable disappears.
4. Add a Stage section to the Scene outliner that visually distinguishes Stage
   roots from shot-owned props and marks the active Stage.
5. Stage outliner rows must not dispatch `select_entities`; they update
   editor-owned Stage selection. Active-stage commands use `set_active_stage`.
6. Add Stage edit mode gating so normal mode shows Stage roots and safe summary
   data, while edit mode reveals inspectable Stage elements/renderables for
   shell, structure, fixture, set_dressing, proxy, and anchor roles.
7. Add a Stage inspector surface that displays Stage display name, active state,
   tags, selected element role, visible/locked state, renderable representation
   kind, asset id, options summary, and `StageSourceRef` provenance/hints.
8. Wire lifecycle/edit UI commands that are implemented today:
   `set_active_stage`, `update_stage`, `update_stage_element`, and
   `replace_stage_renderable` only where the UI can provide valid payloads.
9. Lock and visibility controls must dispatch `update_stage_element`; locked
   Stage element restrictions must be represented in UI affordances and tested.
10. Provide an explicit Stage-owned set-dressing promotion affordance, but keep
    it disabled or rejection-surfacing while the bridge contract says boundary
    commands are placeholders. Do not claim successful promotion in STL-454.
11. Use existing shared UI primitives if available on the implementation base;
    otherwise keep styling scoped to touched outliner/inspector components and
    avoid creating a broad design-system change.
12. Add focused tests that fail before implementation: store event reduction,
    Stage outliner rendering, local Stage selection, active-stage dispatch,
    edit-mode reveal, inspector provenance display, and lock/visibility command
    dispatch.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | Editor UI/state code introduces no Rust parser, loader, validator, or wrapped external error type. | Keep failures as bridge events or UI disabled states. | N/A: no Rust error type is added. |
| Schema / serialization compatibility | yes | `apps/editor/src/bridge/shot.ts`, `apps/editor/src/bridge/types.ts`, `docs/ipc/bridge-contract.md` §13A.2. | Consume existing DTOs and command shapes only; no field rename or TS mirror redesign. | Existing bridge contract tests remain unchanged; new UI tests assert command payloads use current types. |
| Ownership / API boundary | yes | `docs/arch/stage-runtime-topology.md` says Stage runtime entities do not carry `BridgeEntityId`; ADR-0050 separates Stage-owned content from `PropModel`. | Use editor-owned Stage target selection, not `select_entities`; keep prop helpers separate from Stage commands. | Outliner tests assert Stage row click does not dispatch `select_entities`; prop row tests remain unchanged. |
| Partial mutation / rollback | yes | Stage commands mutate runtime bundle state; UI mirrors command results through events. | UI does not optimistically mutate Stage model before bridge success events; local selected target may update only as view state. | Store tests assert Stage model changes only after success events; rejection tests keep previous mirror. |
| Diagnostic ownership | yes | `command_rejected` carries runtime rejection codes; promote/demote placeholder rejects with `INVALID_STAGE_PAYLOAD`. | Surface bridge-provided rejection/status where a command is dispatched; disabled promotion copy explains unavailable boundary without inventing new codes. | Mocked bridge event/status tests for rejected update or promotion path. |
| Local absolute path exposure | no | No file paths, manifests, or local asset roots are needed for Stage UI. | Do not include local checkout paths in source/docs beyond this Knitten planning artifact. | N/A for implementation; normal doc/code review. |
| Manifest path containment | no | No manifest/catalog path field or file IO path is introduced. | Do not implement asset import or file picker behavior for replacement in this slice. | N/A. |
| Command rejection matrix | yes | `update_stage_element`, `replace_stage_renderable`, and placeholder promote commands can reject. | UI tests cover disabled locked controls and at least one surfaced `command_rejected`; full rejection semantics stay engine-owned. | RTL test with mocked `command_rejected` verifies visible error state without local mutation. |
| Cross-platform CLI entrypoint | no | No scripts or CLI entrypoints are added. | N/A. | N/A. |
| Asset/data pack lifecycle | no | No assets, fixture packs, or LFS data are added. | Keep replacement UI to existing catalog entries or a non-picking placeholder if no safe source exists. | N/A. |
| Validation context downgrade | no | No validator API is added or weakened. | Use existing bridge command validation. | N/A. |
| Field-set drift | yes | Stage inspector will manually display role, representation, source, visible, locked, tags, and options. | Centralize selected Stage target derivation helpers and test representative field rendering. | Inspector tests assert role, representation, provenance, active state, and lock/visibility fields render. |
| Bridge docs parity | no | No IPC command or event shape changes are planned. | Do not edit `docs/ipc/bridge-contract.md` unless implementation discovers stale UI-facing prose. | N/A: no wire diff. |
| Event-state visibility | yes | Stage success events are the only UI-visible confirmation for runtime mutations. | Reduce every implemented Stage success event used by UI; do not rely only on `bundle_changed`. | BundleStateProvider tests for `stage_updated`, `stage_element_updated`, `active_stage_changed`, and delete fallback. |
| Input constraint parity | yes | UI may expose display name, tags, visibility, lock, active state, and renderable replacement. | Constrain inputs through existing component patterns and dispatch only non-empty edit payloads where bridge requires a field. | Tests assert empty/no-op stage edits do not dispatch invalid commands. |
| Test oracle strength | yes | Current tests only cover characters/props. | Add assertions that fail today because no Stage store/outliner/inspector exists. | Focused RTL/store tests listed in Verification. |
| Scope creep | yes | Adjacent work includes engine selection ids, successful promote/demote, stage import, shared UI foundation, and renderable asset picking. | Put adjacent behavior in Non-Goals/Follow-Up Candidates and keep changed files in editor state/components/tests plus optional spec doc. | Diff review: no Rust engine/core/bridge edits and no import/assets changes. |
| Reviewer objection | yes | Likely objection: "Why not use `select_entities` like props?" or "Why show promotion if runtime rejects?" | Spec locks local Stage selection and disabled/rejection-surfacing promotion behavior with evidence from runtime topology and bridge contract. | Tests prove no Stage `select_entities` dispatch and promotion cannot silently appear successful. |

## Locked Decisions

1. **Stage UI selection is editor-owned in this PR.**

   Rationale: authored Stage runtime entities intentionally do not carry
   `BridgeEntityId` or `ShotEntityIdComponent`, and `select_entities` is
   documented around runtime-owned bridge entity IDs. Local Stage selection lets
   the inspector work now without widening STL-454 into engine selection work.

   Rejected alternatives: adding `BridgeEntityId` to Stage runtime wrappers;
   encoding guessed ids such as `stage:<id>`; reusing prop ids or
   `ShotEntityIdComponent`.

2. **Active Stage is a command-backed state, not the same as local selection.**

   Rationale: `active_stage_id` is authored shot state and has a dedicated
   `set_active_stage` command and `active_stage_changed` event. A user can
   inspect a non-active Stage in the outliner while choosing whether to make it
   active.

   Rejected alternatives: automatically call `set_active_stage` on every Stage
   row click; hide inactive Stages; store active Stage only as UI state.

3. **Normal mode and Stage edit mode have different reveal levels.**

   Rationale: the Stage entity spec says locked or advanced Stage-owned roles
   are revealed for inspection in Stage edit mode. Normal prop editing must not
   accidentally expose Stage-owned locked content as normal props.

   Rejected alternatives: always render every Stage child in the outliner;
   hide Stage elements entirely; put Stage elements under the Props section.

4. **Implemented bridge commands get real UI wiring; boundary placeholders do
   not pretend to succeed.**

   Rationale: lifecycle/edit handlers are landed, but promote/demote remain
   reserved Stage/Prop boundary placeholders in the bridge contract. STL-454 can
   show the intended action explicitly, but it must not claim successful
   promotion before the runtime supports it.

   Rejected alternatives: dispatch promote and ignore rejection; implement
   promote/demote runtime behavior; remove promotion affordance entirely from
   the first Stage inspector.

5. **Stage and Prop helpers stay separate.**

   Rationale: prop deletion and prop selection helpers target `PropModel`
   workflows. Stage delete/update/lock/visibility target `StageModel` and must
   not reuse prop helpers or labels that imply shot-owned props.

   Rejected alternatives: route Stage deletes through
   `dispatchPropDeleteTransaction`; convert set dressing to props implicitly;
   use prop row styling without Stage ownership labels.

6. **This is one PR only if it stays inside editor UI/state/test scope.**

   Rationale: the useful first slice is the bridge-to-editor UI surface.
   Engine picking, import conversion, successful promotion, and broader shared
   UI primitives would make the review too wide.

   Rejected alternatives: combine with Stage import, runtime selection ids,
   successful promotion/demotion, or STL-490 design-system migration.

## Non-Goals

- No bridge command, event, DTO, rejection-code, or fixture schema changes.
- No Rust core, engine, runtime hydration, selection, or picking changes.
- No successful `promote_stage_content_to_prop` or
  `demote_prop_to_stage_content` runtime behavior.
- No automatic conversion of Stage-owned set dressing into `PropModel`.
- No stage-map import conversion, asset registration, GLB loading, or local file
  picker path work.
- No broad route migration, design-system foundation, or unrelated panel
  redesign.
- No durable ADR changes unless implementation discovers stale Stage UI policy
  that is not already covered by the Stage entity spec.

## Design Plan

### S0 - Baseline Re-check

Input:
- Ready briefing, current `origin/main`, `apps/editor/src/bridge/shot.ts`,
  `apps/editor/src/bridge/types.ts`, `stage-runtime-topology.md`, and
  `SceneOutlinerPanel` tests.

Output:
- Confirmed implementation base still has Stage DTOs/events/commands and no
  existing Stage editor state.

Non-output:
- No source edits before the baseline is confirmed.

Failure:
- If Stage wire types or lifecycle/edit handlers are absent, stop and rebase or
  ask for a stacked-base decision.

Proof:
- `rg` for Stage commands/events and current outliner/store symbols.

### S1 - Add Editor Stage State Mirror

Input:
- `Shot.stages`, `Shot.active_stage_id`, Stage success events, and existing
  `bundleStore` patterns.

Output:
- `bundleStore` stores `stages`, `activeStageId`, and local selected Stage
  target; store helpers update/clear stale Stage targets.

Non-output:
- No bridge dispatch, no optimistic persisted Stage mutation, no prop store
  mutation for Stage-owned content.

Failure:
- Unknown Stage event target ids are ignored or clear stale local selection
  conservatively; command rejection does not mutate Stage mirror.

Proof:
- Store tests for initial state, `shot_loaded`, fresh bundle reset, stage delete
  fallback, element/renderable update, and stale selected-target cleanup.

### S2 - Reduce Stage Bridge Events

Input:
- `BundleStateProvider`, `EventEnvelope`, and Stage success event payloads.

Output:
- `BundleStateProvider` hydrates Stage state from `shot_loaded` and reduces
  `stage_created`, `stage_duplicated`, `stage_deleted`,
  `active_stage_changed`, `stage_updated`, `stage_element_updated`, and
  `stage_renderable_replaced`.

Non-output:
- No local handling for successful promote/demote while runtime boundary
  commands are placeholders.

Failure:
- Malformed or unknown target events leave existing state unchanged rather than
  throwing during render.

Proof:
- Focused `BundleStateProvider` tests for each event class used by the UI.

### S3 - Add Stage Outliner Section And Edit Mode

Input:
- Stage mirror, selected Stage target, current `SceneOutlinerPanel`,
  `OutlinerItem`, and existing character/prop row tests.

Output:
- Scene outliner shows Stage roots separately from Props, marks active Stage,
  supports local Stage target selection, and reveals elements/renderables only
  when Stage edit mode is enabled.

Non-output:
- No `select_entities` dispatch from Stage rows; no prop delete action for Stage
  rows.

Failure:
- Empty Stage state renders a clear empty state; missing element/renderable refs
  do not crash the panel.

Proof:
- RTL tests assert Stage section rendering, active marker, no
  `select_entities` on Stage row click, edit-mode reveal, and prop row behavior
  remains unchanged.

### S4 - Add Stage Inspector Surface

Input:
- Selected Stage target, Stage DTOs, source/provenance fields, and inspector
  overlay slot.

Output:
- Inspector renders Stage root/element/renderable details: active status, role,
  representation kind, source system/document/object/category, role hint,
  representation hint, visibility, lock, tags, and asset id where present.

Non-output:
- No new route, no broad `Sidebar` redesign, no hidden mutation on render.

Failure:
- Missing optional source or renderable fields render as absent/unknown without
  throwing.

Proof:
- RTL tests render representative Stage root, element, and renderable selections
  and assert provenance/role/representation text.

### S5 - Wire Implemented Stage Commands

Input:
- Bridge client, Stage mirror, command types, transaction patterns, and current
  bridge contract rules for non-empty update payloads.

Output:
- UI controls dispatch valid `set_active_stage`, `update_stage`,
  `update_stage_element`, and `replace_stage_renderable` payloads where a safe
  current model value exists.

Non-output:
- No successful promote/demote behavior; no bridge protocol changes; no
  `set_transform` for Stage runtime wrappers.

Failure:
- Disabled controls when bridge is not ready, no valid target exists, the target
  is locked, or the command payload would be empty/invalid; bridge rejections
  surface without local model mutation.

Proof:
- RTL tests assert command payloads, disabled locked controls, bridge-not-ready
  disabled state, and visible rejection status for at least one Stage command.

### S6 - Promotion Affordance Boundary

Input:
- Selected `set_dressing` element, bridge placeholder status for
  `promote_stage_content_to_prop`, and Stage entity spec promotion language.

Output:
- Inspector shows an explicit "promote to prop" affordance for eligible
  set-dressing content while making current runtime unavailability clear.

Non-output:
- No successful promotion, no generated prop id dispatch that can appear to
  succeed silently, no demotion UI.

Failure:
- If implementation chooses rejection-surfacing instead of disabled state, a
  correlated `INVALID_STAGE_PAYLOAD` is visible and does not mutate local Stage
  or prop mirrors.

Proof:
- Test asserts eligible set dressing shows the affordance and that the action
  cannot silently create a prop in current runtime.

### S7 - Verification And Docs Touch-up

Input:
- Changed editor files, tests, and `docs/specs/stage-entity-model.md`.

Output:
- Focused editor tests pass; optional Stage UI doc note only if implementation
  introduces a durable behavior not already covered by the spec's role/default
  behavior tables.

Non-output:
- No IPC docs, ADRs, or engine docs unless a stale reference is directly caused
  by this UI implementation.

Failure:
- If tests reveal missing runtime support for a promised UI action, narrow the
  UI to disabled/rejection-surfacing and add follow-up rather than widening PR
  scope.

Proof:
- `pnpm --filter @shotloom/editor test -- SceneOutlinerPanel`
- `pnpm --filter @shotloom/editor test -- BundleStateProvider`
- Additional focused inspector test target if split into a new file
- `pnpm test:web` or repository-preferred editor gate before PR
- `node scripts/validate-doc-paths.mjs` if docs change

## Acceptance Criteria

- [ ] Editor state mirrors current-shot Stages and active Stage id from
  `shot_loaded`.
- [ ] Stage lifecycle/edit success events update editor Stage state without
  optimistic local model mutation.
- [ ] Scene outliner displays Stage roots separately from shot-owned props and
  marks the active Stage.
- [ ] Stage row clicks update local Stage inspector selection and do not dispatch
  `select_entities`.
- [ ] Stage edit mode reveals Stage elements/renderables for all current role
  vocabulary items.
- [ ] Inspector displays role, representation, lock/visibility, source
  provenance, role hint, and representation hint.
- [ ] Active-stage, lock, visibility, and safe edit controls dispatch valid
  existing Stage commands.
- [ ] Promotion affordance is explicit but cannot silently appear successful
  before boundary handlers land.
- [ ] Focused RTL/store tests prove the major interactions.

## Verification

- Focused store/event tests:
  `pnpm --filter @shotloom/editor test -- BundleStateProvider`
- Focused outliner tests:
  `pnpm --filter @shotloom/editor test -- SceneOutlinerPanel`
- Focused inspector tests once the component exists:
  `pnpm --filter @shotloom/editor test -- StageInspector`
- Broader editor gate if available and reasonably scoped:
  `pnpm test:web`
- Docs gate if any doc changes:
  `node scripts/validate-doc-paths.mjs`
- Manual repro:
  - load a shot with two Stages and verify the outliner shows both and marks the
    active one;
  - click an inactive Stage row and verify the inspector changes without a
    `select_entities` command;
  - enable Stage edit mode and verify locked/advanced elements become
    inspectable;
  - toggle visibility/lock and verify a valid `update_stage_element` command is
    dispatched;
  - inspect a sourced renderable and verify source/provenance fields are
    visible;
  - verify the promotion affordance is explicit but unavailable or rejection
    surfaced under current runtime behavior.

## Traps

- Do not invent Stage bridge entity ids such as `stage:<id>` or
  `stage_element:<id>`; current runtime Stage wrappers intentionally lack
  `BridgeEntityId`.
- Do not put Stage-owned set dressing under the Props section or call prop
  deletion helpers for Stage rows.
- Do not optimistically mutate `stages` in `bundleStore` before a Stage success
  event.
- Do not dispatch `update_stage` or `update_stage_element` with an empty payload;
  the bridge contract rejects empty edit commands.
- Do not claim promotion works while `promote_stage_content_to_prop` is still a
  placeholder rejection in the current runtime slice.
- Do not turn this PR into STL-490 shared UI migration or Stage import asset
  picking.

## Follow-Up Candidates

- Add engine bridge entity ids and viewport picking for Stage roots/elements if
  product wants Stage viewport selection to share the normal selection channel.
- Implement Stage/Prop boundary handlers so promotion/demotion can succeed.
- Add production Stage renderable asset picking and replacement UX once asset
  library policy for `stage_renderable` entries is settled.
- Add stage-map import conversion that creates authored Stage content directly
  instead of legacy background props.
- Broaden shared editor UI primitives through STL-490 follow-up work.
