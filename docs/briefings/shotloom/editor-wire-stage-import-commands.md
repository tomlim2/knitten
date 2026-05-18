---
status: ready
created: 2026-05-15
updated: 2026-05-18
load: triggered
trigger: STL-431
repo: shotloom
linear: STL-431
spec: ../../plans/proposed/editor-wire-stage-import-commands.md
---

### Shotloom coding mode - mixed bridge + TypeScript

**Issue:** STL-431 "feat(editor): stage import panel에서 spawn/clear bridge command 연결"
Problem: `/debug/stage-import` must move from disabled placeholder controls to local POC command dispatch for fixture-backed stage map import.
Parent: STL-420. Related: STL-423, STL-424, STL-437.

**Acceptance:**
- Three map buttons send the correct map id payload.
- Clear button calls the background-imported-only clear command.
- Bridge or bundle-not-ready states do not crash.
- Command failures leave a visible panel error state.

**Scope notes from Linear:**
- Map button click dispatches fixture-based `spawn_background_props`.
- Clear button dispatches `clear_background_props`.
- Panel disables safely for bridge readiness and bundle state.
- Panel shows command success/failure status.
- Panel displays loaded prop/cube count state.

**Branch:** `feat/editor-wire-stage-import-commands`
Worktree: `shotloom-github/.worktrees/editor-wire-stage-import-commands`
Base: `origin/main` at `9a319cd2`; branch is clean and 0 commits ahead.

**Pre-write checklist passed:**
- gh auth: active account is `tomlim2`; stale inactive `deemotl` credential warning is non-blocking.
- Worktree identity set to `tomlim2 <deemo@vonvon.me>`.
- Worktree fast-forwarded to `origin/main` before starting.
- Conventions re-read: AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md.
- Category selected: mixed bridge + TypeScript.
- Targeted standards loaded.
- AC primitive cross-check recorded.
- Sibling-spec scan completed.

**Standards loaded:**
- `AGENTS.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/review-rust.md`
- `docs/guidelines/review-typescript.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/pr-guideline.md`
- `docs/ipc/bridge-contract.md`

**ADRs to honor / watch:**
- ADR-0002 React + TypeScript editor shell.
- ADR-0003 wasm-bindgen bridge.
- ADR-0005 bundle schema.
- ADR-0009 void stage and coordinate convention.
- ADR-0010 UI-independent functionality.
- ADR-0018 runtime telemetry and error boundaries.
- ADR-0021 cross-crate diagnostic type.
- ADR-0042 canonical timeline shape across bridge.
- ADR-0045 bundle editor mutation facade.
- Proposed ADR-0026 / ADR-0027 / ADR-0046 only as context if touched.

**Ask-first triggers for this task:**
- Bridge protocol or contract shape changes.
- New bridge command/event, or changed `spawn_background_props` / `clear_background_props` payloads.
- Core domain model, validation-rule, parser output, or asset-pipeline contract changes.
- New dependencies, file moves, CI/hook behavior changes.
- Adding large/ignored asset files. Do not use `git add -f`.

**Intent lens:**
Wire the editor debug panel to already-landed bridge primitives. Avoid changing the bridge contract, parser, or engine handler unless the spec explicitly finds an unavoidable gap and the user approves it.

**Current implementation evidence:**
- `apps/editor/src/components/debug/StageImportDebugPanel.tsx` renders fixed map buttons but currently keeps actions disabled with stale "waiting for STL-423/STL-424" copy.
- `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` already mocks `useBridge().client.dispatch`, route rendering, no-bundle, and not-ready states.
- `apps/editor/src/bridge/types.ts` defines `SpawnBackgroundPropsCommand`, `ClearBackgroundPropsCommand`, and background prop DTOs.
- `apps/editor/src/bridge/__tests__/types.test.ts` covers wire shape for both commands.
- `docs/ipc/bridge-contract.md` documents `spawn_background_props` and `clear_background_props`.
- `docs/specs/stage-map-document.md` defines selected local map documents and exact `background_map` ownership tag semantics.
- `crates/shotloom-core/src/bridge/mod.rs` and `crates/shotloom-engine/src/bridge/handlers/props.rs` contain command DTOs/handlers/tests.

**AC primitive cross-check:**
- AC1 "three map buttons send correct map id payload": partially codified. Panel currently uses document-style IDs such as `Map_1004__Stage1`; bridge payload requires normalized `map_id` such as `Map_1004:Stage1`, plus `document_id`, `source`, and resolved `placements`.
- AC2 "clear button calls background-imported-only clear command": codified. `clear_background_props` exists and removes props tagged exactly `background_map`; no-op clear may be accepted without an event.
- AC3 "bridge/bundle not ready no crash": codified by existing panel readiness state and tests, but implementation must keep dispatch gated or surface local dispatch errors cleanly.
- AC4 "command failure visible panel error": bridge vocab exists (`command_rejected`, `runtime_error`, `validation_diagnostics`), but the panel status source and command correlation policy still need to be specified.
- Scope line "loaded prop/cube count state": not fully codified. Spawn events count props; cube count source is unclear and may belong to fixture/STL-430 or STL-437 semantics.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1 fixture/source-of-placements boundary: `spawn_background_props` consumes already-resolved placements and explicitly does not parse raw map JSON or resolve local GLBs. STL-430 appears to own fixture JSON. Decide whether STL-431 includes minimal fixture payloads itself, stacks on STL-430, or waits for STL-430.
- P1 acknowledgement/error state: `clear_background_props` no-op can be eventless, while spawn may emit diagnostics and then reject if zero valid placements remain. Decide whether panel success/failure follows `dispatch` result, bridge events, command ids, or a hybrid.
- P1 command id correlation: `useBridge().recentEvents` exposes bridge events with command correlation data. Decide whether the panel generates command IDs and filters by `caused_by_command_id`, so repeated clicks do not race stale status.
- P2 map id conversion: lock the exact table from document id (`Map_1004__Stage1`) to normalized map id (`Map_1004:Stage1`) and test all three buttons.
- P2 loaded prop/cube counts: define whether counts come from fixture payload, `prop_added` events, bundle store, or current shot state. Avoid display-name-only counting for cube assets.
- P3 UI copy cleanup: remove stale issue-ID/blocker copy from the panel now that STL-423/STL-424 commands have landed.

**Sibling specs scanned:**
- `bridge-add-background-prop-batch-spawn.md` - completed STL-423. Stance: spawn command consumes pre-resolved DTOs and leaves parser, clear-all, and editor dispatch to siblings. Agrees.
- `bridge-clear-background-props.md` - completed STL-424. Stance: clear command exists; editor wiring is still sibling scope. Agrees.
- `stage-add-map-document-parser.md` - completed STL-422. Stance: parser/resolver is runtime-agnostic Rust-side work; no bridge/editor wiring. Agrees.
- `stage-define-map-document-bundle-layout.md` - completed STL-421. Stance: contract/doc only; parser/bridge/editor work belongs to follow-ups. Agrees.
- `stage-add-map-document-parser-conflict.md` - stale draft conflict note before parser/contract landed. Superseded by completed plans.
- `routing-fixture-validation.md` - unrelated despite fixture keyword. Ignore.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
