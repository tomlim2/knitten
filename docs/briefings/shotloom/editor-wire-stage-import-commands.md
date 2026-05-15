---
status: ready
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: STL-431
repo: shotloom
linear: STL-431
spec: ../../plans/editor-wire-stage-import-commands.md
---

### Shotloom coding mode - bridge

**Issue:** STL-431 "feat(editor): stage import panel에서 spawn/clear bridge command 연결"  
  Problem: `/debug/stage-import` must stop being a disabled placeholder and dispatch stage-import bridge commands for the local POC.  
  Acceptance:
  - three map buttons send the correct map-id payload
  - clear button calls the background-imported-props clear command
  - bridge or bundle-not-ready states do not crash
  - command failure leaves a visible error state in the panel
  Affected: `apps/editor/src/components/debug/StageImportDebugPanel.tsx`, `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx`, `apps/editor/src/bridge/types.ts`, `crates/shotloom-stage/src/map_document.rs`, `docs/ipc/bridge-contract.md`  
  Linked: STL-423, STL-424, STL-425, STL-437; ADR-0003, ADR-0018, ADR-0021, ADR-0047

**Branch:** `feat/editor-wire-stage-import-commands`  (base: `origin/main` `03eb9aa9`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md  
**ADRs to honor:** ADR-0003 wasm-bindgen bridge, ADR-0018 runtime telemetry and error boundaries, ADR-0021 cross-crate diagnostic type, ADR-0047 Tailwind as editor styling default  
**Ask-first triggers for this task:** bridge protocol or contract changes; new bridge command/event; parser output shape changes; clear-all bridge implementation; Bevy ECS ordering/plugin-registration changes; new dependencies; CI/hook changes  
**Intent lens:** Wire the existing local stage-import debug panel to the already-landed spawn background prop path without leaking ownership boundaries. User clarification: treat this as the stage wiring issue; STL-437 should stay a small engine regression/safety proof rather than production wiring.

**AC primitive cross-check:**
- AC1 "three map buttons send correct map id payload": codified - `StageImportDebugPanel.tsx` already defines `Map_1004__Stage1`, `Map_1006__Stage1`, `Map_1038__Stage1`; `docs/specs/stage-map-document.md` maps these document IDs to normalized `Map_1004:Stage1`, `Map_1006:Stage1`, `Map_1038:Stage1`; `apps/editor/src/bridge/types.ts` has `SpawnBackgroundPropsCommand`.
- AC2 "clear button calls background-imported props clear command": sibling-owned - `rg` finds no `clear_background_props` command in core, TS, engine, or bridge contract; STL-424 owns the clear command and is Backlog. Do not implement it inside STL-431 unless the user explicitly broadens scope or STL-424 lands first.
- AC3 "bridge or bundle not ready does not crash": codified - `StageImportDebugPanel.tsx` already reads `useBridge().state` and `useBundleStore().bundleLoaded` and disables placeholder actions; sibling panel tests cover not-ready and no-bundle states.
- AC4 "command failure leaves visible error state": codified for bridge events, missing for panel - `BridgeContext` exposes `recentEvents` and bridge `error`; bridge contract/error guideline define `command_rejected` and `runtime_error`. The spec must choose the panel status source and correlation policy before implementation.

**Spec-risk handoff for `/shotloom-draft-task-plan`:**
- P1: Scope split for clear button - should STL-431 leave clear disabled/marked unavailable until STL-424 lands, or may this PR stack on/implement STL-424? - evidence: `rg "clear_background"` returns no command; Linear STL-424 owns background clear-all and blocks STL-420 - AC-trace: STL-431 AC2.
- P1: Payload source of truth - should the panel dispatch hard-coded fixture placements, parse local map documents in the editor, or call a Rust/native resolver path before `spawn_background_props`? - evidence: `spawn_background_props` accepts resolved placements; `shotloom-stage` parser is Rust-side and `load_stage_map_document` is `not(target_arch = "wasm32")`; current editor has only map IDs/count labels - AC-trace: STL-431 scope "fixture 기반 command dispatch" and STL-423 command boundary.
- P1: Map ID normalization - button `data-map-id` currently uses document IDs, while bridge payload requires normalized `map_id` plus `document_id`; the spec must lock the exact mapping table and test all three buttons - evidence: `StageImportDebugPanel.tsx`; `docs/specs/stage-map-document.md`; `apps/editor/src/bridge/__tests__/__snapshots__/spawn_background_props_batch.expected.json` - AC-trace: AC1.
- P2: Readiness semantics - define whether action disabled requires both `bridgeState === "ready"` and `bundleLoaded`, or whether `client.dispatch` runtime errors are allowed to surface for unstarted bridge cases - evidence: `BridgeClient.dispatch` emits `BRIDGE_NOT_STARTED`; current panel disables on bridge/bundle not ready - AC-trace: AC3.
- P2: Command status model - define pending/success/error strings and whether status is per action, per command id, or latest panel event; include `command_rejected` and `runtime_error` filtering by `caused_by_command_id` - evidence: `BridgeContext.recentEvents`, `CommandRejectedPayload`, `RuntimeErrorPayload` - AC-trace: AC4.
- P2: Loaded prop/cube counts - define count source: optimistic dispatch payload count, `PropAdded` events, or bundle store/outliner state. Avoid counting fixture `Cube.glb` by display name only because STL-437 is about safe reuse, not UI counting policy - evidence: `PropAdded` events and `StageImportDebugPanel` current static prop counts - AC-trace: Linear scope "loaded prop/cube count state".
- P2: Coupled UI state atomicity - dispatch, pending status, command id, and later event/error state are coupled; spec should prevent stuck pending state on dispatch failure, component unmount, or bridge state change - evidence: `BridgeClient.dispatch` returns command id even when not started and emits a local runtime error event - AC-trace: AC3/AC4.
- P3: Preserve debug panel compact styling and route registration - keep existing `DebugButton`, route registry, and test harness patterns rather than introducing a new UI surface - evidence: `debugPanels.tsx`, `debugNavConfig.ts`, `StageImportDebugPanel.test.tsx` - AC-trace: STL-425 parent scope.

**Sibling specs (caol-ila/docs/plans/):**
- `bridge-add-background-prop-batch-spawn.md` - HEAD - stance: STL-423 added `spawn_background_props` and explicitly left parser, clear-all, and editor dispatch wiring to siblings - agrees.
- `stage-add-map-document-parser.md` - HEAD - stance: STL-422 owns Rust parser/resolver output and keeps bridge/editor wiring out of scope - agrees.
- `stage-add-map-document-parser-conflict.md` - HEAD historical conflict note - stance: parser was blocked before the contract landed; superseded by current parser/spec state - no active disagreement.
- `stage-define-map-document-bundle-layout.md` - HEAD - stance: STL-421 contract defined selected map docs, ownership, diagnostics, and left parser/spawn/clear/editor to follow-ups - agrees.
- `import-add-prop-gltf.md` - HEAD - stance: prop GLB import/preflight owns generic GLB acceptance and not stage map wiring - related only.
- `docs/import-add-prop-gltf-codex.md` - HEAD - stance: same STL-406 GLB prop import preflight scope - related only.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; stale inactive `deemotl` credential warning ignored
- [x] commit identity set for worktree: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (caol-ila/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-task-plan`.
