---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-488
repo: shotloom
linear: STL-488
worktree: .worktrees/stage-ground-visibility-toggle
branch: feat/stage-ground-visibility-toggle
spec: ../../plans/proposed/stage-ground-visibility-toggle.md
---

# Stage Ground Visibility Toggle

## Shotloom Coding Mode

Mixed: bridge protocol, engine runtime presentation state, void-stage setup,
editor debug UI, and bridge contract documentation.

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-488` |
| Title | `feat(stage): stage import map load 시 기본 void floor 숨김 지원` |
| State | In Progress |
| Priority | P4 / Low |
| Project | Shotloom - bravo |
| Related | `STL-425` stage import debug panel cleanup |
| Branch | `feat/stage-ground-visibility-toggle` from `origin/main` |
| Base head | `3a62b1b1 feat(editor): add stage import samples (#364)` |

The issue is now independent rather than a child of the broader stage-import
parent. Its purpose is narrow: when `/debug/stage-import` loads one of the
three selected sample maps, the engine-owned void floor should stop visually
covering the imported background props; when the panel clears the sample, that
void floor should come back.

This is not an authored visibility contract for Stage, props, characters, or
future Stage elements. It is a runtime-only presentation control for the
engine-owned `StageGround`.

## Loaded Conventions

- Repo entry: `AGENTS.md`
- Contribution flow: `CONTRIBUTING.md`, `WORKFLOW.md`
- Review and PR: `docs/guidelines/code-review-guideline.md`,
  `docs/guidelines/review-rust.md`,
  `docs/guidelines/review-typescript.md`,
  `docs/guidelines/commit-guideline.md`,
  `docs/guidelines/pr-guideline.md`
- Error discipline: `docs/guidelines/error-handling.md`
- Spec/procedure docs: `docs/guidelines/spec-procedure-guideline.md`,
  `docs/guidelines/documentation-standard.md`
- Bridge contract: `docs/ipc/bridge-contract.md`
- Transaction lifecycle: `docs/arch/transaction-bridge-lifecycle.md`

ADRs to keep in view: ADR-0009, ADR-0027, ADR-0031, ADR-0044, ADR-0048,
and ADR-0050.

Ask before changing: authored Stage visibility contracts, prop/character
visibility, core domain model, asset-pipeline contracts, dependencies, file
moves, CI or hook behavior, new roadmap items or ADRs, Bevy ECS ordering
beyond the local handler, and WASM/native runtime split.

## Current Implementation Facts

| Surface | State |
|---|---|
| `StageGround` marker | Present in `crates/shotloom-engine/src/stage_setup.rs`; the startup void floor carries `StageEntity`, `StageGround`, mesh, material, and `Transform::IDENTITY`. |
| Runtime ground visibility state | Missing; current setup has no resource that remembers whether the default ground should be visible after a stage rebuild. |
| Void floor material | Present as fresh mood-colored `StandardMaterial`; it does not use `PlaceholderMaterial`. |
| Placeholder material resource | Present in `crates/shotloom-engine/src/materials/placeholder.rs`; ADR-0031 pins one shared checker `Handle<StandardMaterial>` resource. |
| Bridge command surface | No `set_stage_ground_visible` Rust or TypeScript command exists. |
| Bridge transaction classes | `TransactionClass::RuntimeOnly` already covers ping, playback, selection, active tool, stage mood, and preview-only state. |
| Stage handlers | `crates/shotloom-engine/src/bridge/handlers/stage.rs` owns clear color, stage mood, and new bundle handlers; this is the natural place for the new command handler. |
| Stage import panel | `StageImportDebugPanel.tsx` dispatches `spawn_background_props` for load buttons and `clear_background_props` for clear; it does not dispatch any ground visibility command. |
| Clear background semantics | `clear_background_props` removes only current-shot props tagged exactly `background_map`; no-op clear is accepted and eventless. |
| Bridge contract docs | `docs/ipc/bridge-contract.md` documents background spawn/clear and says `clear_background_props` does not touch user props, characters, cameras, tracks, or assets. |

## Acceptance Primitive Cross-Check

| Linear AC | Existing primitive | Status for spec |
|---|---|---|
| Map load hides default void floor | Missing `set_stage_ground_visible` command and editor dispatch | Add command, runtime visibility resource, handler, TS type, bridge docs, and panel dispatch ordering tests. |
| Clear all shows default void floor again | Missing command and clear dispatch pairing | Add clear path dispatch to show ground and preserve existing clear command behavior. |
| `clear_background_props` does not delete `StageGround` | `StageGround` is an ECS marker, not a `PropModel`; clear filters `shot.props` by `background_map` tag | Codified by existing architecture; add regression proof that clear semantics remain separate. |
| Default `StageGround` uses placeholder material | `PlaceholderMaterial` exists; `StageGround` currently uses fresh mood material | Change void-stage setup to use the shared placeholder handle for the ground only. |
| Placeholder material affects only engine-owned void floor | Prop/character spawn paths have separate material logic | Keep implementation in `stage_setup.rs`; test the ground handle without touching prop/character paths. |
| Character/user prop/click-spawn still work | Existing tests and `spawn_placement.rs` use `StageGround` for floor snaps | Preserve the marker and mesh; only mutate `Visibility`, not collider/picking metadata. |
| New command is runtime-only | `TransactionClass::RuntimeOnly` exists | Add kind/serde/transaction-class tests. |

## Spec-Risk Seeds

1. **Runtime-only classification.** The command must be
   `TransactionClass::RuntimeOnly`; otherwise it can enter auto-wrap durable
   history and make undo/redo restore a non-authored presentation state.
2. **Event surface creep.** The issue needs a display toggle, not a new authored
   event stream. Success should not emit `bundle_changed` or any durable
   authored event; failure can use existing `command_rejected`.
3. **StageGround targeting.** The handler must query `With<StageGround>` and
   mutate only `Visibility`. It must not filter by name, prop tag, or material,
   and must not touch imported background props, user props, characters, lights,
   cameras, or Stage future model entries.
4. **Stage rebuild persistence.** A mood/stage rebuild can recreate
   `StageGround`. The spec must preserve the current runtime ground visibility
   across rebuilds without writing it into the bundle.
5. **Placeholder material startup ordering.** `PlaceholderMaterial` is inserted
   by `MaterialsPlugin`. The stage setup path must use the shared handle without
   making source tests depend on undefined startup ordering.
6. **Clear command independence.** `clear_background_props` is a durable model
   mutation over `PropModel.tags`; it should not be extended to delete or toggle
   the void floor.
7. **Editor ordering.** The panel must send ground-hide, clear stale background
   props, then load the selected map. Clear must send ground-show then clear.
   The tests should lock the dispatch order so future refactors cannot show
   stale ground over loaded maps.

## Sibling Specs

- `docs/plans/proposed/stage-import-local-map-debug.md`: current closure spec
  for the selected-map debug flow. It treats `clear_background_props` and
  `spawn_background_props` as existing primitives and keeps dynamic local-file
  parsing out of scope.
- `docs/plans/proposed/editor-wire-stage-import-commands.md`: records that the
  debug panel already dispatches static fixture-backed spawn/clear commands.
- `docs/plans/completed/bridge-clear-background-props.md`: owns the durable
  clear semantics. Keep this issue separate from prop deletion scope.
- `docs/plans/completed/placeholder-material-checker-sampler.md`: records the
  checker material work that made the shared placeholder handle available.
- `docs/plans/proposed/bridge-add-stage-authoring-contract.md`: future authored
  Stage bridge work. This issue must not pre-empt that contract.

## Handoff

Start `/shotloom-draft-spec` from this briefing. The spec should lock a narrow
one-PR implementation:

- add `set_stage_ground_visible { visible: boolean }`;
- classify it as runtime-only;
- remember the runtime visibility state across stage rebuilds;
- toggle only `StageGround` entity visibility;
- use the existing shared `PlaceholderMaterial` for the void floor;
- wire the stage import debug buttons to hide/clear/load and show/clear;
- document the bridge command as runtime-only and eventless on success;
- prove the behavior with focused Rust and TypeScript tests.

Do not edit Shotloom source before the spec review gate passes and the user
explicitly starts implementation.
