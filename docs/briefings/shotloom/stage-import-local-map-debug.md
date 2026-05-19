---
status: ready
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-420
repo: shotloom
linear: STL-420
worktree: .worktrees/stage-import-local-map-debug
branch: feat/stage-import-local-map-debug
---

# Stage Import Local Map Debug

## Shotloom Coding Mode

Mixed: editor debug UI, local stage-map parser/resolver integration, engine
background prop spawn/clear semantics, and asset/diagnostic review.

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-420` |
| Title | `feat(stage): 로컬 맵 문서 기반 stage import debug 버튼 검증` |
| State | In Progress |
| Priority | P3 / Normal |
| Project | Shotloom - bravo |
| Related | `STL-437` S2M stage import test background/prop GLB subset |
| Branch | `feat/stage-import-local-map-debug` from `origin/main` |
| Base head | `3a62b1b1 feat(editor): add stage import samples (#364)` |

The POC goal is to prove Shotloom can use offline normalized map documents and
available GLB assets to place selected background map props for three Story
Previz map cases, without depending on the Story Previz live runtime.

Linear cleanup on 2026-05-19: `STL-429` and `STL-432` are absorbed into the
`STL-420` closure scope and marked `Canceled` as standalone child issues. The
remaining implementation/review scope includes their route/button cleanup
and fixture/command regression coverage inside the `STL-420` spec instead of
opening separate PRs.

Selected debug actions:

- `Clear all background assets`
- `Load easiest prop transform map`: `Map_1004__Stage1` / Rural Train Station
- `Load prop-heavy transform map`: `Map_1006__Stage1` / Classic School Classroom
- `Load max-prop-count transform map`: `Map_1038__Stage1` / Romanesque Cathedral

Out of scope per Linear: Story Previz live API, full 104-map registry, batch
import, Unreal export automation, and full prop quality correction.

## Loaded Conventions

- Repo entry: `AGENTS.md`
- Contribution flow: `CONTRIBUTING.md`, `WORKFLOW.md`
- Review and PR: `docs/guidelines/code-review-guideline.md`,
  `docs/guidelines/review-rust.md`,
  `docs/guidelines/review-typescript.md`,
  `docs/guidelines/commit-guideline.md`,
  `docs/guidelines/pr-guideline.md`
- Error discipline: `docs/guidelines/error-handling.md`
- Bridge contract: `docs/ipc/bridge-contract.md` sections for
  `spawn_background_props` and `clear_background_props`
- Stage-map contract: `docs/specs/stage-map-document.md`,
  `contracts/stage-map/README.md`,
  `contracts/stage-map/stage-map-document.schema.json`

ADRs to keep in view: ADR-0008, ADR-0009, ADR-0012, ADR-0018, ADR-0021,
ADR-0050, and ADR-0051.

Ask before changing: bridge protocol, core domain model or validation, asset
pipeline contracts, dependencies, file moves, CI or hook behavior, new roadmap
items or ADRs, Bevy ECS ordering, and WASM/native runtime split.

## Current Implementation Facts

| Surface | State |
|---|---|
| `/debug/stage-import` route and four buttons | Present on `origin/main` through `StageImportDebugPanel.tsx` and tests. |
| Static selected map samples | Present in `apps/editor/src/components/debug/stageImportSamples.json`. |
| Stage-map parser/resolver | Present in `crates/shotloom-stage/src/map_document.rs`; native file read is `cfg(not(target_arch = "wasm32"))`. |
| Stage-map asset subset | Present under `assets/s2m_props/` with `Map_1004.glb`, `Map_1006.glb`, `Map_1038.glb`, and prop GLBs. |
| Bridge command types | Present in Rust and TypeScript for `spawn_background_props` and `clear_background_props`. |
| Engine spawn/clear handlers | Present; spawn requires registered prop asset IDs, clear removes exact `background_map` props. |
| Runtime local document integration | Not proven. The debug panel currently reads checked-in static sample JSON, not local map document JSON files. |
| Actual GLB-to-asset registration path | Not proven. Current samples dispatch fallback `prop_box` placements rather than resolved S2M GLB asset IDs. |

## Linear Child Issue State

| Issue | State | Meaning for STL-420 |
|---|---|---|
| `STL-421` | Done | Bundle layout and normalized stage-map document contract are available primitives. |
| `STL-422` | Done | Parser/resolver primitive is available. |
| `STL-423` | Done | Batch background prop spawn bridge command is available. |
| `STL-424` | Done | Background clear command is available. |
| `STL-425` | In Progress | Main editor debug panel closure surface. |
| `STL-430` | Done | Three selected map fixture data is available. |
| `STL-431` | Done | Static fixture-backed spawn/clear dispatch is available. |
| `STL-429` | Canceled | Absorbed into `STL-420`: route/button UI cleanup. |
| `STL-432` | Canceled | Absorbed into `STL-420`: fixture/command regression tests. |

## Acceptance Primitive Cross-Check

| Linear AC | Existing primitive | Status for spec |
|---|---|---|
| Four debug buttons exist | `StageImportDebugPanel.tsx`, panel tests, route/nav wiring | Codified. Preserve behavior. |
| Clear all removes imported background assets and document-spawned map props | `clear_background_props` removes current-shot props tagged exactly `background_map` | Partly codified. Clarify whether "background assets" means spawned background props only, or a future registered background mesh asset too. |
| Paths exist to read `Map_1004__Stage1`, `Map_1006__Stage1`, `Map_1038__Stage1` | `selected_map_document_paths`, stage-map spec selected filenames | Parser primitive exists, but editor debug path does not load these local files. |
| Can read prop placement transforms | Stage parser and static samples both carry transforms | Primitive exists; integration canonical owner must be locked. |
| Resolvable GLB referenced by document is placed in viewport | Resolver returns file paths; engine can spawn registered prop assets | Gap: no proven path from resolved local GLB file to registered `asset_id`; static panel uses `prop_box` fallback. |
| Existing character import/spawn and prop spawn not broken | Existing bridge/editor tests and engine handlers | Verification requirement. Keep changed surface narrow. |
| Parse/missing/invalid/empty prop diagnostics are not silent | Stage parser diagnostics and background prop diagnostics exist separately | Gap: parser diagnostics are not currently surfaced through the debug UI command path. |
| Story Previz live API and broad batch work out of scope | Stage-map docs and Linear scope | Codify as non-goals. |

## Spec-Risk Seeds

1. **Local document integration boundary.** `spawn_background_props` explicitly
   consumes already-resolved placements and does not parse raw map JSON.
   `shotloom-stage` can read files only outside WASM. The spec must choose
   whether STL-420 uses a native/Tauri command, a repo fixture path, a selected
   local root, or the already-checked-in static sample data.
2. **Resolved GLB to registered asset ID.** The resolver can find GLB paths, but
   the spawn command needs registered prop `asset_id`s. Decide whether the flow
   imports/registers each resolved GLB before spawn, reuses an existing asset
   import path, or accepts fallback `prop_box` as POC proof.
3. **Coupled mutation and rollback.** Reading documents, resolving assets,
   registering assets, spawning background props, and surfacing diagnostics are
   coupled enough that partial success rules must be explicit.
4. **Diagnostics ownership.** Parser diagnostics use `stage_map_document`;
   engine spawn diagnostics use background-prop sources. The UI must not
   collapse them into silent status text.
5. **Clear semantics.** Engine clear is exact-tag background prop removal.
   If STL-420 means clearing imported background mesh assets too, that is a new
   asset-lifecycle decision and likely ask-first.
6. **Review trap.** Current main already satisfies a weaker static-sample debug
   proof. A PR that only reshuffles the panel risks being rejected for not
   proving the Linear "local map document based" requirement.

## Objective Review Lens

Use these review questions before PR:

- Does the change prove the actual acceptance criteria, or only a convenient
  fixture approximation?
- Are source-of-truth boundaries explicit: local map document, resolver output,
  asset registry, bridge command, engine mutation, UI status?
- Can reviewers trace every persisted or spawned background prop back to
  ownership tags that make clear-all safe?
- Are parse/resolve/import/spawn failures represented as typed errors or
  diagnostics at the boundary where the user can act?
- Does the implementation avoid machine-local paths, live Story Previz
  dependencies, and broad production import UX?
- Are tests strong enough to fail on wrong map IDs, fallback asset misuse,
  missing diagnostics, or accidental user prop deletion?

## Sibling Specs

- `docs/plans/completed/stage-define-map-document-bundle-layout.md`: defines
  the offline map document contract and says parser, bridge, clear, and editor
  buttons are follow-ups.
- `docs/plans/completed/stage-add-map-document-parser.md`: implements the
  stage-map parser/resolver boundary while deferring bridge/editor/clear.
- `docs/plans/drafts/stage-add-map-document-parser-conflict.md`: stale conflict
  record from before the contract landed; useful only as historical caution.
- `docs/plans/proposed/editor-wire-stage-import-commands.md`: wires static
  fixture-backed `prop_box` commands and explicitly says real local map JSON
  parsing is out of scope.
- `docs/plans/completed/engine-reuse-debug-cube-assets.md`: relevant only if
  this task touches debug cube/fallback asset reuse.

## Handoff

Start `/shotloom-draft-spec` from this briefing. The spec must first decide
whether STL-420 is a verification-only PR over the existing static sample flow
or the missing integration PR that reads local map documents, resolves GLBs,
registers/imports usable assets, dispatches background prop placement, and
surfaces diagnostics.

Recommended default: treat STL-420 as the missing integration/verification spec
unless the user explicitly accepts the weaker static-sample proof. The Linear
title and ACs say "로컬 맵 문서 기반" and "resolve-able GLB referenced by document",
which are stronger than the current fixture fallback.

The implementation scope must explicitly include the absorbed `STL-429` and
`STL-432` work: final route/button cleanup, panel regression tests, route
exposure tests, fixture label/count assertions, `spawn_background_props`
payload coverage, `clear_background_props` payload coverage, and visible
diagnostics/status coverage.
