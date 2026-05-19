---
status: proposed
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-420 closure
repo: shotloom
linear: STL-420
briefing: ../../briefings/shotloom/stage-import-local-map-debug.md
---

# Close Stage Import Local Map Debug

## Spec Contract

- Briefing basis: `STL-420` is the closure issue for the local map-document
  stage import POC; `STL-429` and `STL-432` were absorbed into this closure
  scope after Linear cleanup.
- Current truth: parser/resolver, background batch spawn, clear-all, S2M asset
  subset, sample data, panel dispatch, and most panel tests already exist on
  `origin/main`.
- Required change: make the remaining editor closure proof reviewable by
  tightening button/action assertions, surfacing correlated validation
  diagnostics, and locking sample/source-asset fallback invariants in tests.
- Locked boundary: no bridge protocol change, no Rust parser/resolver change,
  no engine handler change, no new binary assets, and no dynamic local-file
  picker or Story Previz live API in this PR.
- Proof method: focused editor tests cover route/actions, dispatch payloads,
  fallback sample invariants, correlated diagnostics, correlated failures, and
  clear no-op; existing Rust and asset validators remain the proof for parser,
  resolver, bridge, clear, and hydrated S2M assets.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage import panel | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | Renders `/debug/stage-import`, four actions, sample-backed `spawn_background_props`, `clear_background_props`, readiness states, command accepted/completed/failure status. It does not surface correlated `validation_diagnostics`. |
| Panel tests | `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` | Partial | Covers route/nav, selected actions, disabled states, spawn payloads, clear payload, sample load failure, no-op clear, correlated rejection/runtime error, and `bundle_changed` completion. It does not assert exact primary action set or diagnostic visibility. |
| Sample module | `apps/editor/src/components/debug/stageImportSamples.ts` | Partial | Parses checked-in sample JSON and converts every prop/cube placement to bridge placements using explicit `prop_box` fallback. It preserves S2M source metadata but does not validate source asset references against the asset subset at runtime. |
| Sample fixture | `apps/editor/src/components/debug/stageImportSamples.json` | Already Done | Contains the three selected maps, source background refs, prop/cube transforms, and explicit fallback bindings. It records source S2M asset IDs separately from `dispatch_asset_id`. |
| Sample tests | `apps/editor/src/components/debug/__tests__/stageImportSamples.test.ts` | Partial | Covers selected map IDs/counts, fallback separation, dispatchability, provenance, no local paths, tuple copying, max-sample shape, and count text. Needs exact source asset/path expectations for closure review. |
| Debug route registry | `apps/editor/src/components/debug/debugPanels.tsx`, `debugNavConfig.ts`, `DebugRoute.tsx` | Already Done | Registers `stage-import` and exposes the `Stage Import` sidebar entry under `/debug/*`. |
| Bridge context | `apps/editor/src/bridge/BridgeContext.tsx` | Partial | Exposes `recentEvents`, but keeps only 50 events. Diagnostics emitted before a large `prop_added` batch can fall out of the buffer unless the panel subscribes or stores command-local diagnostics. |
| Bridge TS types | `apps/editor/src/bridge/types.ts` | Already Done | `SpawnBackgroundPropsCommand`, `ClearBackgroundPropsCommand`, `ValidationDiagnosticsEvent`, and `Diagnostic` types exist and match the Rust wire shape. |
| Bridge contract | `docs/ipc/bridge-contract.md` §14.2b / §14.2c | Already Done | `spawn_background_props` consumes already-resolved placements and does not parse raw map JSON; `clear_background_props` removes only props tagged exactly `background_map` and has eventless no-op behavior. |
| Core bridge serde | `crates/shotloom-core/src/bridge/mod.rs` | Already Done | Rust command serde round trips exist for `spawn_background_props`, omitted optional placement fields, and `clear_background_props`. |
| Engine spawn/clear handlers | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | Validates batch identity, placement caps, prop asset kind, transforms, tags, display names; emits diagnostics; rolls back ECS render failures; clear removes exact `background_map` props. |
| Engine spawn/clear tests | `crates/shotloom-engine/src/bridge/tests/props.rs` | Already Done | Covers authored transforms/tags, partial success diagnostics, empty/oversized/all-invalid rejection, rollback, clear preserving user props, no-op eventless clear, and rejection branches. |
| Stage parser/resolver | `crates/shotloom-stage/src/map_document.rs` | Already Done | Provides selected document paths, `load_stage_map_document`, strict parse, GLB resolver, path containment, source-chain errors, and `stage_map_document` diagnostics. |
| Stage map spec | `docs/specs/stage-map-document.md` | Already Done | Defines selected map IDs, expected prop counts, GLB lookup, ownership tags, and map-document diagnostic codes. |
| S2M asset subset | `assets/s2m_props/README.md`, `assets/s2m_props/manifest.json` | Already Done | Documents source, rules, selected maps, GLB file list, SHA-256s, no-local-path policy, and `pnpm validate:s2m-assets`. |
| Dynamic local document UI | N/A | Missing / Out of scope | No editor path loads arbitrary local map-document JSON into `shotloom-stage`; adding one would require native/local file and asset-pipeline design beyond this closure PR. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-420` |
| State | In Progress |
| Owner | deemo |
| Goal | Close the stage import debug POC by proving the selected map-document-derived sample and bridge flow can be exercised through `/debug/stage-import` without Story Previz live runtime coupling. |
| Acceptance criteria | Four debug buttons; clear background imports; selected map read path; prop transforms; resolve-able GLB provenance; existing character/prop spawn unchanged; diagnostics visible; live API/full registry/batch import/export/quality correction out of scope. |
| Latest relevant comment | 2026-05-19: `STL-429` and `STL-432` are absorbed into the `STL-420` closure scope. |
| Blockers / dependencies | Done: `STL-421`, `STL-422`, `STL-423`, `STL-424`, `STL-430`, `STL-431`, `STL-437`. In progress: `STL-425`. Absorbed/canceled: `STL-429`, `STL-432`. |
| Related PRs | Prior stage-import debug and sample PRs are already represented in `origin/main`; no active PR for this branch yet. |
| Current review state | None for this branch. |
| Planning consequence | Treat this as a closure PR over existing primitives, with tests and UI diagnostic visibility closing the remaining review risk. |

## Problem

The stage import POC primitives have landed, but the closure surface still has a
review gap. The panel can dispatch sample-backed background props and clear
them, yet correlated `validation_diagnostics` from partial success, missing
assets, invalid transforms, or empty batches are invisible in the debug panel.
The remaining Linear cleanup issues were also absorbed into `STL-420`, so this
PR must make the final `/debug/stage-import` route, button set, fixture
invariants, and command diagnostics strong enough for a reviewer to close the
umbrella without mistaking the current `prop_box` fallback for production S2M
GLB asset registration.

## Requirements

1. `/debug/stage-import` must present exactly the four primary actions from
   `STL-420`: clear, easiest, prop-heavy, and max-prop-count. This traces to
   `STL-425`, absorbed `STL-429`, and the current debug route registry.
2. The three load actions must continue dispatching `spawn_background_props`
   with `source: "stage_import_debug"`, normalized `map_id`, document
   `document_id`, and checked-in sample placements. This traces to
   `docs/ipc/bridge-contract.md` §14.2b and `STL-431`.
3. The sample conversion must keep `source_asset_id` / `manifest_path`
   provenance separate from `dispatch_asset_id: "prop_box"`. This traces to
   `STL-430`, `assets/s2m_props/manifest.json`, and the closure need to be
   honest about fallback rendering.
4. Sample tests must lock the selected map counts and source asset
   expectations for `Map_1004__Stage1`, `Map_1006__Stage1`, and
   `Map_1038__Stage1`, while continuing to reject machine-local paths and path
   traversal strings. This traces to `STL-420`, `docs/specs/stage-map-document.md`,
   and the local path privacy rule.
5. The panel must surface correlated `validation_diagnostics` for the latest
   stage import command. It must show at least severity, code, and message for
   diagnostics emitted by background prop spawn or future parser/resolver
   integration. The implementation must not rely solely on the 50-entry
   `recentEvents` buffer for diagnostics; it must subscribe to bridge events or
   otherwise persist command-local diagnostics before a large batch can evict
   them. This traces to `STL-420` diagnostics AC and
   `docs/guidelines/error-handling.md`.
6. Rejection and runtime-error status must remain higher priority than success
   status, but diagnostics must not be hidden behind a later correlated
   `bundle_changed` completion. This traces to the bridge event order in
   `docs/ipc/bridge-contract.md` §14.2b.
7. Clear must continue dispatching exactly `{ type: "clear_background_props" }`
   and preserve no-op behavior without waiting for a bridge acknowledgement.
   This traces to `docs/ipc/bridge-contract.md` §14.2c and absorbed `STL-432`.
8. A new stage import command must clear stale diagnostics and status from the
   previous command unless a later correlated event belongs to the new command.
   This traces to existing consecutive-dispatch panel tests and the bridge
   command-id correlation model.
9. The implementation must not change Rust bridge schemas, engine handler
   semantics, parser/resolver APIs, S2M asset files, or dynamic local-file
   loading behavior. Any true local-root picker, native/Tauri parser command,
   or S2M GLB auto-registration belongs to a follow-up.

## UI Event Outcome Matrix

| Input / event | Required panel outcome | Test proof |
|---|---|---|
| Dispatch returns a command id and no correlated event exists | Show the latest command as accepted/in progress. | Existing accepted-command assertions remain. |
| Correlated `validation_diagnostics` | Store diagnostics for the latest command outside the bounded `recentEvents` scan and show severity, code, and message. | New diagnostics-only test. |
| Correlated `validation_diagnostics`, then many item events | Keep the diagnostic summary visible after more than 50 later correlated item events. | New buffer-overflow diagnostics test delivers the diagnostic through `client.subscribe`, then rerenders with `recentEvents` that no longer contains that diagnostic event. |
| Correlated `validation_diagnostics`, then `bundle_changed` | Show completion without clearing the diagnostic summary. | New diagnostics-plus-completion test. |
| Correlated `validation_diagnostics`, then `command_rejected` | Show the rejection as failure and keep the diagnostic summary visible. | New diagnostics-plus-rejection test. |
| Correlated `runtime_error` | Show runtime failure ahead of success or in-progress text. | Existing runtime-error test remains. |
| Correlated `prop_added` / `prop_removed` without completion | Keep the command in accepted/in-progress state. | Existing item-event tests remain. |
| Unrelated events for another command id | Do not affect latest stage import status or diagnostics. | Existing unrelated-event tests plus new unrelated diagnostics test. |
| Clear command with no correlated event after timeout | Treat as eventless clear no-op success. | Existing clear no-op test remains. |
| New stage import command | Clear stale status and diagnostics before accepting events for the new command id. | Consecutive-dispatch diagnostics test. |

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This closure PR changes TypeScript component/tests only; Rust parser errors in `crates/shotloom-stage/src/map_document.rs` already preserve `#[source]`. | Do not touch Rust error enums or `map_err` branches. | N/A: no wrapped external error is introduced. |
| Schema / serialization compatibility | yes | `apps/editor/src/bridge/types.ts` and `crates/shotloom-core/src/bridge/mod.rs` define existing command/event shapes. | Preserve `spawn_background_props`, `clear_background_props`, and `validation_diagnostics` wire shapes; consume existing fields only. | Existing bridge contract tests plus panel tests that dispatch exact command objects and mock typed diagnostics. |
| Ownership / API boundary | yes | Bridge contract says spawn consumes already-resolved placements and does not parse raw map JSON. | Keep parser/resolver and asset registration out of React; panel dispatches the existing sample/fallback DTOs. | Tests assert command payloads and sample provenance without adding parser calls. |
| Partial mutation / rollback | yes | `spawn_background_props` mutates bundle/scene engine-side; `clear_background_props` can no-op eventlessly. | UI does not optimistically mutate bundle state; it reports correlated diagnostics/events from the engine. | Panel tests with diagnostics plus existing engine tests for partial success, rollback, and clear no-op final state. |
| Diagnostic ownership | yes | `validation_diagnostics` carries `Diagnostic[]`; background prop diagnostics are owned by engine, parser diagnostics by `shotloom-stage`. | Display diagnostic severity/code/message without inventing new codes or changing source values. | Mock correlated `validation_diagnostics` for warnings and errors; assert visible status text. |
| Local absolute path exposure | yes | `stageImportSamples.json`, `assets/s2m_props/manifest.json`, and stage-map docs must not commit machine paths. | Preserve no-local-path tests and add source asset/path invariant assertions around selected samples. | Existing no-local-path test plus strengthened sample-source tests; `pnpm test:s2m-assets-validator` for manifest policy. |
| Manifest path containment | yes | `scripts/validate-s2m-assets.mjs` owns manifest containment and file validation for `assets/s2m_props`. | Do not add new manifest fields or binary files; rely on the validator for hydrated asset proof. | `pnpm test:s2m-assets-validator`; optional `pnpm validate:s2m-assets` when LFS files are hydrated. |
| Command rejection matrix | yes | Panel already displays `command_rejected` and `runtime_error`; diagnostics currently have no UI path. | Keep rejection/runtime precedence and add diagnostics visibility for correlated events. | Tests cover rejection, runtime error, diagnostics-only, and diagnostics-plus-completion ordering. |
| Asset/data pack lifecycle | yes | `assets/s2m_props/README.md` and manifest already define source/license status, LFS hydration, validator placement, and the selected subset size. | Do not add or replace GLBs in this PR; asset size impact must stay zero and `assets/s2m_props/**` stays unchanged. | `pnpm test:s2m-assets-validator`; optional `pnpm validate:s2m-assets` when hydrated; no diff under `assets/s2m_props/` expected. |
| Bridge docs parity | no | No bridge command, event, rejection code, or payload field changes are in scope. | Leave IPC docs unchanged unless implementation discovers an existing doc mismatch. | N/A: no wire diff. |
| Event-state visibility | yes | A partial-success spawn can emit `validation_diagnostics`, many `prop_added` events, and `bundle_changed`; `BridgeContext` retains only 50 recent events. | Subscribe or store command-local diagnostics so early diagnostics are not lost, and do not treat `bundle_changed` as fully clean when correlated diagnostics exist. | Diagnostics-plus-bundle-changed and recent-buffer-overflow tests assert visible diagnostics remain. |
| Input constraint parity | no | No new free-form user input is introduced. | Preserve existing buttons and fixture data only. | N/A: no new inputs. |
| Test oracle strength | yes | Existing panel status ignores `validation_diagnostics`. | Add tests that fail before implementation because diagnostics are not rendered. | Focused `StageImportDebugPanel` diagnostics tests fail before the UI patch and pass after. |
| Scope creep | yes | Dynamic local-file parser UI, S2M GLB registration, Stage entity import path, and production import UX are adjacent. | Put each in Non-Goals or Follow-Up Candidates. | N/A: changed file set excludes Rust bridge/engine/parser and binary assets. |
| Reviewer objection | yes | Reviewers may object that `prop_box` fallback is not actual S2M GLB viewport placement. | Preserve and test explicit fallback provenance, and state the boundary in PR/spec. | Sample tests prove source asset refs and fallback dispatch are separate rather than hidden. |

## Locked Decisions

1. **Close `STL-420` through the selected-map debug sample flow, not a new dynamic local-file flow.**

   Rationale: live code already has the parser/resolver, bridge commands,
   clear command, asset subset, and selected-map sample dispatch. The browser
   editor cannot read a machine-local POC root without a new native/Tauri or
   file-picker design, and the bridge contract explicitly says
   `spawn_background_props` does not parse raw map JSON.

   Rejected alternatives: adding a native local-root command in this PR,
   parsing local map JSON directly in React, hard-coding a local POC root,
   connecting the Story Previz live API, or bundling the full S2M GLB set into
   the web app.

2. **Keep `prop_box` as an explicit debug render fallback while preserving S2M source provenance.**

   Rationale: the current sample data separates `source_asset_id` and
   `manifest_path` from the dispatch asset. That lets the panel prove transform
   density and clear semantics now, while avoiding a hidden claim that S2M GLBs
   are registered as prop assets.

   Rejected alternatives: dispatching unregistered S2M source asset IDs,
   silently replacing source GLB refs with `prop_box`, importing every S2M GLB
   before each button click, or removing source provenance from the sample.

3. **Treat correlated `validation_diagnostics` as first-class command output.**

   Rationale: `STL-420` explicitly requires parse/missing/invalid/empty prop
   diagnostics not to be silently ignored, and the bridge already has the
   `validation_diagnostics` event. Partial success can still end with
   `bundle_changed`; the diagnostic warning remains meaningful.

   Rejected alternatives: showing only `command_rejected` / `runtime_error`,
   relying on console logs, inventing editor-only diagnostic codes, or hiding
   diagnostics once `bundle_changed` arrives.

4. **Keep clear-all scoped to exact `background_map` props.**

   Rationale: `clear_background_props` is already defined and tested as a
   current-shot prop deletion command keyed by exact tag membership. The button
   label may say background assets, but the safe implementation surface is
   background map props, not manifest asset deletion.

   Rejected alternatives: clearing all props, clearing by display name, clearing
   by source asset ID, deleting manifest assets, or requiring companion
   ownership tags for matching.

5. **Fold absorbed `STL-429` and `STL-432` into one closure PR.**

   Rationale: Linear now marks those standalone child issues canceled as
   absorbed. Their remaining value is route/button cleanup and regression
   coverage, both naturally reviewed with the `STL-420` closure patch.

   Rejected alternatives: opening separate PRs for small UI cleanup and tests,
   reviving the canceled issues, or leaving their acceptance criteria
   unmentioned in the closure PR.

6. **Do not add local optimistic state for background prop counts.**

   Rationale: spawn/clear success is engine-owned and event-driven. The panel
   can show fixture counts and latest command status, but it must not pretend to
   know the persisted shot state before engine events arrive.

   Rejected alternatives: incrementing local loaded-prop counters on click,
   inferring clear success from local fixture counts, or using unrelated bridge
   events as acknowledgements.

7. **Persist latest command diagnostics outside the bounded recent-event scan.**

   Rationale: `BridgeContext` intentionally keeps only 50 recent events. A
   partial-success stage import can emit diagnostics first, then many
   `prop_added` events and a final `bundle_changed`; the diagnostic event can
   disappear from `recentEvents` before the panel rerenders.

   Rejected alternatives: scanning only `recentEvents`, increasing the global
   recent-event cap for one panel, or relying on `bundle_changed` as proof that
   no warnings happened.

## Non-Goals

- No new bridge command, bridge event, rejection code, or TypeScript wire type.
- No Rust parser/resolver, engine handler, or core bridge schema changes.
- No dynamic local-root picker, Tauri command, OPFS staging command, or native
  filesystem read path from the editor.
- No Story Previz live API integration.
- No full 104-map registry or batch import workflow.
- No Unreal export automation or broad orientation/scale correction.
- No production Stage entity import migration; `STL-453` and `STL-457` remain
  separate.
- No new S2M GLB binaries, asset replacement, LFS policy change, or manifest
  widening.
- No production editor import UX replacing the debug panel.
- No deletion of manifest background assets as part of clear-all.

## Implementation Spec

S0. Baseline re-check. Confirm the branch is still clean and current
`origin/main` still contains `StageImportDebugPanel.tsx`,
`stageImportSamples.ts`, `stageImportSamples.json`, the stage-map parser,
`spawn_background_props`, `clear_background_props`, and `assets/s2m_props`.
Requirements: 1-9. Verification: targeted `rg` plus git status.

S1. Tighten final action-surface assertions. Extend
`StageImportDebugPanel.test.tsx` so the ready panel proves the primary buttons
are exactly clear, easiest, prop-heavy, and max-prop-count, and that the route
continues to expose the Stage Import nav entry. Requirements: 1, 7. Risk rows:
Test oracle strength, Reviewer objection. Verification: focused panel test
asserts exact primary button labels, `data-document-id` values, and route/nav
entry.

S2. Surface correlated validation diagnostics in the panel. Update
`StageImportDebugPanel.tsx` status derivation to collect diagnostics from
events whose `caused_by_command_id` matches the latest command. Use
`client.subscribe` or equivalent command-local state so diagnostics are
preserved even if the bounded `recentEvents` buffer later overflows. Display a
bounded diagnostic summary with severity/code/message in the command status
area, for example the first three diagnostics plus a remaining count. Keep
`command_rejected` and `runtime_error` as failure states, but preserve visible
diagnostic text when a later correlated `bundle_changed` marks completion.
Reset command-local diagnostics when a new stage import command is dispatched.
Requirements: 5, 6, 8. Risk rows: Diagnostic ownership, Command rejection
matrix, Event-state visibility, Partial mutation / rollback. Verification:
focused panel tests cover each row in the UI Event Outcome Matrix and
`pnpm typecheck:web` proves hook/state typing. The test harness must mock
`client.subscribe` when this stage uses it.

S3. Strengthen diagnostic status tests. Add focused tests for:
correlated `validation_diagnostics` without completion, diagnostics followed by
`bundle_changed`, diagnostics followed by `command_rejected`, and unrelated
diagnostics that must not affect the latest command. Add a buffer-overflow case
where diagnostics are followed by more than 50 correlated item events and still
remain visible even when `recentEvents` no longer contains the original
diagnostic event. Add a consecutive-dispatch case proving a new command clears
stale diagnostics from the previous command. Requirements: 5, 6, 7, 8. Risk
rows: Diagnostic ownership, Event-state visibility, Test oracle strength.
Verification: the new tests fail before the panel renders diagnostics and pass
after the panel persists latest-command diagnostics.

S4. Strengthen sample/source invariant tests. Extend
`stageImportSamples.test.ts` to lock the exact selected source asset categories
and manifest paths expected from `assets/s2m_props/manifest.json`: three
background maps, the selected chair/table prop paths, and `Cube.glb` for debug
cubes. Keep the existing no-local-path and fallback-dispatch assertions.
Requirements: 3, 4, 9. Risk rows: Local absolute path exposure, Manifest path
containment, Asset/data pack lifecycle, Reviewer objection. Verification:
sample tests compare fixture source paths against the manifest-owned selected
paths and continue rejecting local absolute paths or traversal strings.

S5. Run focused verification. Run the panel tests and sample tests first, then
the editor test suite if cheap. Run the S2M validator helper test; run hydrated
asset validation only when the GLB files are present as real binaries.
Requirements: 1-9. Risk rows: Test oracle strength, Asset/data pack lifecycle.

## Acceptance Criteria

- [ ] `/debug/stage-import` exposes the Stage Import panel and exactly the four
  primary actions required by `STL-420`.
- [ ] Each load action dispatches `spawn_background_props` with the expected
  `document_id`, normalized `map_id`, `source: "stage_import_debug"`, and
  sample-derived placements.
- [ ] The clear action dispatches exactly `clear_background_props` and still
  treats no-op clear as accepted without requiring an event acknowledgement.
- [ ] The panel visibly reports correlated `validation_diagnostics` severity,
  code, and message for the latest stage import command.
- [ ] Correlated diagnostics remain visible when later item events overflow the
  bounded recent-event buffer.
- [ ] Correlated rejection/runtime-error states remain visible and are not
  overwritten by unrelated events or stale commands.
- [ ] Consecutive commands clear stale diagnostics from prior commands.
- [ ] Sample tests prove selected map counts, S2M source provenance, explicit
  `prop_box` fallback dispatch, expected source manifest paths, and no
  machine-local paths.
- [ ] Existing character import/spawn, prop import/spawn, background spawn, and
  background clear contracts remain unchanged.
- [ ] No dynamic local-file loading, Story Previz live API, Stage entity
  migration, or new S2M binary asset work enters this PR.

## Verification

- Focused: `pnpm --filter @shotloom/editor test -- StageImportDebugPanel stageImportSamples`
- TypeScript: `pnpm typecheck:web`
- Broader editor: `pnpm test:web`
- Asset validator helper: `pnpm test:s2m-assets-validator`
- Hydrated asset check when LFS files are present: `pnpm validate:s2m-assets`
- Rust regression if touched unexpectedly: `pnpm test:rust -- props`
- Manual repro: open `/debug/stage-import` with no bundle loaded; all four
  actions are disabled and the bundle-required status is visible.
- Manual repro: set bridge state not ready; all four actions are disabled and
  the bridge readiness status is visible.
- Manual repro: ready bridge plus loaded bundle; click each load action and
  observe accepted/completed status for the correct map.
- Manual repro: inject a correlated `validation_diagnostics` event with
  `background_prop_asset_missing`; the status area shows the diagnostic code and
  message even when a correlated `bundle_changed` follows.
- Manual repro: inject correlated diagnostics, then more than 50 correlated
  item events; the status area still shows the diagnostic summary.
- Manual repro: inject correlated `command_rejected` after diagnostics; the
  rejection remains a failure state while diagnostics remain visible.
- Manual repro: clear when no background props exist; after the clear no-op
  timeout, the panel reports no background props to clear without requiring a
  bridge event.

## Traps

- Do not use document IDs such as `Map_1004__Stage1` as bridge `map_id`; the
  command requires normalized IDs such as `Map_1004:Stage1`.
- Do not hide `validation_diagnostics` behind a later `bundle_changed`; partial
  success diagnostics are still actionable.
- Do not dispatch `source_asset_id` values from the sample as `asset_id`; the
  current debug dispatch asset is explicitly `prop_box`.
- Do not clear user props or manifest assets when the button says background
  assets; the safe command clears only exact `background_map` props.
- Do not add machine-local paths, generated local map documents, or new GLB
  binaries to close this UI/test PR.
- Do not make the panel parse local files in React; that would skip the staged
  parser/resolver and asset-pipeline boundaries.

## Follow-Up Candidates

- Add a native or Tauri local-root stage import command that calls
  `shotloom-stage`, registers resolved GLBs as prop assets, and dispatches
  spawned placements.
- Promote background prop debug import into the Stage entity model path tracked
  by `STL-453` / `STL-457`.
- Add a production Stage import UX with user-selected roots, progress, grouped
  diagnostics, and save/reload behavior.
- Replace `prop_box` fallback with actual S2M prop GLB registration once the
  asset pipeline can stage the curated subset without web bundle bloat.
- Add broader visual regression or screenshot smoke coverage for the three
  selected maps after actual S2M GLB registration lands.
