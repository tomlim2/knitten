---
status: proposed
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-431
repo: shotloom
linear: STL-431
briefing: ../../briefings/shotloom/editor-wire-stage-import-commands.md
---

# Wire Stage Import Debug Commands

## Spec Contract

- Briefing basis: `STL-431` is the editor wiring slice under `STL-420`; `STL-423` and `STL-424` already own the bridge commands.
- Current truth: the debug panel renders fixed map actions but disables every button with stale blocker copy.
- Required change: enable ready/bundle-loaded actions, dispatch fixture-backed `spawn_background_props` and `clear_background_props`, and show correlated command status.
- Locked boundary: no bridge protocol, parser, resolver, engine handler, GLB asset, or map-document contract changes.
- Proof method: focused editor tests assert command payloads, disabled states, correlated failure rendering, and clear dispatch; existing bridge/core tests remain the contract proof for command semantics.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage import panel | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | Fixed buttons and map metadata exist, but `disabled` is unconditional and copy says commands are blocked. |
| Panel tests | `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` | Partial | Tests cover route, static IDs, and disabled states; no dispatch or event-status assertions yet. |
| Bridge command types | `apps/editor/src/bridge/types.ts` `SpawnBackgroundPropsCommand`, `ClearBackgroundPropsCommand` | Already Done | TS wire types exist for both commands. |
| Command wire snapshots | `apps/editor/src/bridge/__tests__/types.test.ts` and snapshots | Already Done | Existing tests verify `spawn_background_props` and `clear_background_props` envelope shapes. |
| Bridge context | `apps/editor/src/bridge/BridgeContext.tsx` | Already Done | `useBridge()` exposes `client`, `state`, `error`, and newest-first `recentEvents`. |
| Dispatch behavior | `apps/editor/src/bridge/client.ts` `BridgeClient.dispatch` | Already Done | Dispatch returns `command_id`; not-started dispatch publishes correlated `runtime_error`. |
| Bridge contract | `docs/ipc/bridge-contract.md` §14.2b / §14.2c | Already Done | Spawn consumes already-resolved placements; clear removes exact `background_map` props and no-op clear emits no acknowledgement. |
| Stage map contract | `docs/specs/stage-map-document.md` | Already Done | Defines selected maps, normalized map IDs, POC counts, and ownership tag semantics. |
| Minimal map example | `contracts/stage-map/examples/minimal-stage-map-document.json` | Already Done | Demonstrates two `Map_1004__Stage1` objects and fixture fallback metadata. |
| Built-in prop fixture | `crates/shotloom-engine/src/app.rs` `seed_debug_character_assets` | Already Done | Runtime seeds a registered `prop_box` `AssetKind::Prop` entry for debug prop smoke paths. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-431` |
| State | In Progress |
| Owner | deemo / current agent flow |
| Goal | Call the landed stage-import bridge commands from `/debug/stage-import` so the local POC can be verified end-to-end. |
| Acceptance criteria | Three map buttons send correct payloads; clear dispatches background-only clear; not-ready bridge/bundle states do not crash; command failures remain visible. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-420`; related `STL-423`, `STL-424`, `STL-437`. Commands from `STL-423`/`STL-424` are now present in live code. |
| Related PRs | Prior bridge/parser/doc PRs only; no active PR for this branch yet. |
| Current review state | None. |
| Planning consequence | Treat this as editor wiring only. Fixture placements may be minimal editor-local POC data, but parser/resolver/asset import work remains out of scope. |

## Problem

The stage import panel still behaves like a placeholder after the spawn and clear bridge primitives landed. A ready bridge with a loaded bundle should let the user send the three selected map commands and clear imported background props, while preserving safe disabled states and showing the last command outcome. The implementation must not pretend to parse real map documents in the editor or hard-code a machine-local GLB root.

## Requirements

1. Map actions must dispatch `spawn_background_props` with `source: "stage_import_debug"`, normalized `map_id`, document `document_id`, and a non-empty fixture placement array that uses registered built-in prop asset `prop_box`. Traces to Linear AC1, `docs/ipc/bridge-contract.md` §14.2b, and `crates/shotloom-engine/src/app.rs`.
2. The three selected maps must use this exact ID table: `Map_1004__Stage1` -> `Map_1004:Stage1`, `Map_1006__Stage1` -> `Map_1006:Stage1`, `Map_1038__Stage1` -> `Map_1038:Stage1`. Traces to `docs/specs/stage-map-document.md`.
3. Clear action must dispatch exactly `{ type: "clear_background_props" }`. Traces to Linear AC2 and bridge contract §14.2c.
4. Actions must remain disabled unless `bridgeState === "ready"` and `bundleLoaded === true`; disabled copy must explain the current blocker without stale issue IDs. Traces to Linear AC3 and existing panel tests.
5. Each dispatch must store the returned `command_id` and render a "command sent/accepted" status for that command. Traces to `BridgeClient.dispatch` and bridge dataflow correlation docs.
6. The panel must render a visible error when a correlated `command_rejected` or `runtime_error` appears in `recentEvents`. Traces to Linear AC4 and `docs/guidelines/error-handling.md`.
7. A correlated `prop_added`, `prop_removed`, or `bundle_changed` may refine the sent status to completed, but the initial accepted status must not wait on an event; no-op clear must not require a bridge event acknowledgement. Traces to clear no-op behavior in bridge contract §14.2c.
8. The panel must display fixture prop/cube count state from the selected fixture payload: 2 for `Map_1004__Stage1`, 32 for `Map_1006__Stage1`, and 72 for `Map_1038__Stage1`. Counts must not come from display names, asset ids, or real bundle introspection. Traces to Linear scope and keeps STL-437 out of scope.
9. Tests must cover happy dispatch, disabled no-dispatch, failure rendering, and status/count display using mocked bridge state/events. Traces to repo TypeScript review requirements.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No Rust parser/loader/error type changes are in scope. | Keep all changes in TS component/tests. | N/A: no wrapped external error is introduced. |
| Schema / serialization compatibility | yes | `apps/editor/src/bridge/types.ts` command types and `docs/ipc/bridge-contract.md` §14.2b/§14.2c. | Preserve existing command shapes exactly. | Test `client.dispatch` receives typed command payloads for map and clear actions. |
| Ownership / API boundary | yes | Bridge contract says spawn consumes resolved placements and does not parse raw map JSON. | Use editor-local fixture DTOs only; do not add parser/resolver calls. | Tests assert command payload, not parser behavior. |
| Partial mutation / rollback | yes | Spawn mutates bundle and emits events engine-side; clear no-op can emit nothing. | UI only dispatches commands and observes correlated events; it does not mutate bundle state directly. | Failure-event test proves visible error without local state pretending success. |
| Diagnostic ownership | yes | `command_rejected`, `runtime_error`, and `validation_diagnostics` are bridge-owned vocabularies. | Panel displays bridge-provided code/message for correlated error events; no new diagnostic codes. | Mock correlated rejection/runtime error and assert visible error status. |
| Test oracle strength | yes | Current tests only prove static placeholder behavior. | Add assertions on `dispatch` calls and rendered status. | Tests fail before implementation because buttons are disabled and dispatch is unused. |
| Scope creep | yes | Adjacent STL-430 fixture files, parser resolver, GLB import, and STL-437 asset reuse. | Put those in Non-Goals; keep this PR to editor wiring and minimal DTO fixtures. | N/A: review boundary proof through changed file set and tests. |
| Reviewer objection | yes | Stale issue-ID copy and ambiguous success on clear no-op are likely review comments. | Remove stale blocker copy; success copy says command accepted when dispatch returns and no correlated error is present. | Tests cover copy and no-op-safe accepted status. |

## Locked Decisions

1. Keep fixture payloads editor-local and generated from compact map metadata for this PR.
   Rationale: Linear asks for fixture-based command dispatch, while the bridge contract says spawn receives resolved placements and does not parse documents or resolve GLBs. Generating 2/32/72 `prop_box` placements from metadata keeps the command valid without committing local GLBs or generated map documents.
   Rejected alternatives: wait for STL-430 before enabling the panel; parse real map JSON in React; call Rust parser/resolver from this panel; reference unknown sample assets such as `asset_chair`.
2. Use command-id correlation for error status.
   Rationale: `dispatch()` returns a `command_id`, and bridge events carry `caused_by_command_id`; repeated clicks must not let stale events overwrite the latest command status.
   Rejected alternatives: show the newest bridge error globally; infer failure from bridge state; add a new acknowledgement event.
3. Treat no immediate correlated error after dispatch as command accepted for clear no-op.
   Rationale: `clear_background_props` no-op is successful and eventless by contract.
   Rejected alternatives: require `bundle_changed`; require `prop_removed`; add a clear-specific acknowledgement event.
4. Count fixture props/cubes from fixture metadata only.
   Rationale: the panel needs POC status, but bundle introspection and asset reuse semantics belong to other issues.
   Rejected alternatives: count bundle props by `asset_id`; count display names containing `Cube`; inspect engine ECS state.
5. Preserve the existing debug route and styling surface.
   Rationale: STL-425 already established the panel shell; STL-431 is wiring, not a redesign.
   Rejected alternatives: move the panel, introduce new navigation, or add a production editor import flow.

## Non-Goals

- Do not change `spawn_background_props` or `clear_background_props` command schemas.
- Do not add bridge events, acknowledgement events, or diagnostic codes.
- Do not parse local map document JSON in React.
- Do not add or commit local GLB assets or generated map documents.
- Do not implement STL-430's fixture file layout as a durable contract.
- Do not change Rust parser/resolver/engine handler behavior.
- Do not implement STL-437's mesh/material reuse optimization.
- Do not replace the debug panel with a production import UX.

## Implementation Spec

S0. Baseline re-check. Confirm the branch is clean, `StageImportDebugPanel.tsx` still has placeholder disabled buttons, and bridge command types still match the current contract. Requirements: 1-9. Verification: focused status/search before editing.

S1. Define local fixture command data. Add typed in-component or same-folder constants for the three selected map actions, including `document_id`, normalized `map_id`, `source`, compact count metadata, and a helper that generates deterministic `prop_box` placement DTOs for 2/32/72 entries. Requirements: 1, 2, 8. Risk rows: schema compatibility, ownership/API boundary, scope creep.

S2. Wire dispatch handlers. Use `useBridge()` to get `client`, `state`, and `recentEvents`; enable buttons only when bridge and bundle are ready; call `client.dispatch()` with the selected command; store latest command id/action/status as accepted immediately after dispatch. Requirements: 3, 4, 5, 7. Risk rows: partial mutation/rollback, reviewer objection.

S3. Render status and error state. Replace stale blocker copy with current readiness, fixture count, last accepted/completed command, and correlated bridge error details. Requirements: 4, 6, 7, 8. Risk rows: diagnostic ownership, reviewer objection.

S4. Update focused tests. Extend the existing panel test file to mock a stable `dispatch`, bridge state, and `recentEvents`; assert map payloads for all three buttons, clear payload, disabled no-dispatch, correlated error rendering, and count/status copy. Requirements: 1-9. Risk rows: test oracle strength.

S5. Run focused verification. Run the StageImportDebugPanel test target and TypeScript checks available for the editor. Requirements: 9. Verification: focused tests, then broader web validation if cheap.

## Acceptance Criteria

- [ ] Clicking each map action while ready and bundle-loaded dispatches `spawn_background_props` with the expected `document_id`, normalized `map_id`, `source`, and 2/32/72 generated `prop_box` fixture placements.
- [ ] Clicking clear while ready and bundle-loaded dispatches `clear_background_props`.
- [ ] Bridge-not-ready and bundle-not-loaded states disable every action and do not call dispatch.
- [ ] A correlated `command_rejected` or `runtime_error` leaves a visible error state in the panel.
- [ ] The panel shows fixture count status without reading machine-local files or bundle internals.
- [ ] No bridge contract, Rust parser, Rust engine, or asset files change.

## Verification

- Focused: `pnpm --filter @shotloom/editor test -- StageImportDebugPanel`.
- TypeScript/web gate if available and reasonably scoped: `pnpm test:web`.
- Manual repro: open `/debug/stage-import`, no bundle loaded -> buttons disabled with "Load or create a bundle..." status.
- Manual repro: bridge not ready -> buttons disabled with bridge readiness status.
- Manual repro: ready + bundle loaded -> map and clear buttons are enabled and show 2/32/72 fixture counts.
- Manual repro: inject or mock a correlated `command_rejected` -> panel shows the bridge rejection code/message.
- Manual repro: clear when no background props exist -> command accepted status remains visible even if no bridge event arrives.

## Traps

- Do not use the document id (`Map_1004__Stage1`) as the bridge `map_id`; the command requires normalized `Map_1004:Stage1`.
- Do not wait for `bundle_changed` to mark clear success; no-op clear is accepted and eventless.
- Do not count real cubes by display name or asset id; use explicit fixture metadata.
- Do not reference unregistered sample asset IDs such as `asset_chair`; the debug runtime has a built-in `prop_box` prop fixture.
- Do not add local filesystem paths, ignored GLBs, or generated selected-map JSON to the repo.

## Follow-Up Candidates

- STL-430 can promote fixture data into a durable file/module layout shared by parser or harness work.
- STL-437 can validate and optimize debug cube mesh/material reuse engine-side.
- A later production import flow can select a local POC root, parse real documents, stage/register assets, and dispatch resolved placements.
- A later diagnostics UI can group `validation_diagnostics` by map object and show per-placement warnings.
