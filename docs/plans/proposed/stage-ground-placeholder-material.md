---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-488
repo: shotloom
linear: STL-488
briefing: ../../briefings/shotloom/stage-ground-placeholder-material.md
branch: feat/stage-ground-placeholder-material
---

<!-- markdownlint-disable MD013 -->

# Stage Ground Placeholder Material

## Spec Contract

| Field | Contract |
|---|---|
| Briefing basis | `STL-488` asks for the engine-owned default ground plane to use the existing checker placeholder material. |
| Current truth | `StageGround` currently receives a fresh mood-colored `StandardMaterial` in both void-stage spawn paths. |
| Required change | Make the default `StageGround` use the shared `PlaceholderMaterial` handle on initial setup, rebuild, and direct world ensure paths. |
| Locked boundary | No bridge command, no editor UI, no visibility toggle, no authored Stage field, no bundle schema, no save/load change. |
| Proof method | Engine setup/rebuild tests asserting `StageGround` material handle identity with `PlaceholderMaterial::handle()`, plus focused diff review. |
| Reviewability | One small PR is suitable if the diff stays in stage setup, material startup ordering, and tests. |

## Current State

| Surface | Path / symbol | State | Consequence |
|---|---|---|---|
| Default ground marker | `crates/shotloom-engine/src/stage_setup.rs::StageGround` | Present | Use as the only target identity. |
| Initial spawn | `spawn_void_stage` | Allocates a new `StandardMaterial` from mood ground color. | Must use the shared placeholder handle instead. |
| Direct world spawn | `spawn_void_stage_world` via `ensure_void_stage_entities` | Mirrors initial spawn and allocates a new material. | Must use the same placeholder handle. |
| Placeholder resource | `crates/shotloom-engine/src/materials/placeholder.rs::PlaceholderMaterial` | Existing shared checker material handle. | Reuse; do not create a second checker material. |
| Material plugin | `crates/shotloom-engine/src/materials/mod.rs::MaterialsPlugin` | Adds `PlaceholderMaterialPlugin`. | Startup order must be deterministic before stage spawn depends on it. |
| Startup phase | `crates/shotloom-engine/src/app.rs::StartupPhase` | Stage setup runs in `StartupPhase::Init`; placeholder init currently only registers on `Startup`. | Spec must require explicit ordering or equivalent proof. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-488` |
| Title | `feat(stage): 기본 ground plane checker material 적용` |
| Priority | `1` |
| State | `In Progress` |
| Project | `Shotloom - bravo` |
| AC summary | Default `StageGround` uses existing `PlaceholderMaterial`; rebuild keeps it; non-ground material paths and bridge/editor surfaces stay unchanged. |
| Blockers | None known. |
| Related PRs | None for this narrowed scope. |
| Planning consequence | This is an engine visual fallback-plane PR, not a bridge/editor PR. |

## Problem

The void-stage ground is a runtime fallback plane. It should read as a
placeholder floor, not as a mood-colored stage surface. Shotloom already has a
shared checker `PlaceholderMaterial` resource for this visual role, so the
default `StageGround` should use that existing handle.

## Options Considered

| Option | Decision | Reason |
|---|---|---|
| A. Use existing `PlaceholderMaterial` for `StageGround`. | Chosen | Minimal change, reuses ADR-backed material primitive, avoids a second checker material. |
| B. Add a new dedicated floor material. | Rejected | Adds another material lifecycle without need. |
| C. Add a ground visibility command or debug UI toggle. | Rejected | Different product behavior and larger bridge/editor scope. |
| D. Change imported/background prop materials. | Rejected | Outside default engine-owned ground plane. |

## Requirements

1. `spawn_void_stage` assigns `MeshMaterial3d` from `PlaceholderMaterial::handle()`.
   - Trace: default ground visual clarity.
   - Proof: stage setup test checks the `StageGround` material handle.
2. `spawn_void_stage_world` assigns the same placeholder handle.
   - Trace: direct world ensure path must match normal setup.
   - Proof: ensure-path or model-sync-adjacent test checks restored fallback ground material.
3. `rebuild_stage_on_change` preserves the placeholder material after mood changes.
   - Trace: rebuild can recreate the ground entity.
   - Proof: mood-change rebuild test checks the new `StageGround` material handle.
4. Placeholder material initialization is ordered before any stage spawn path that requires it.
   - Trace: both material initialization and stage setup use startup systems.
   - Proof: startup/order test or full app startup test would fail if the resource is absent.
5. Mood preset behavior remains limited to clear color, ambient light, and key light.
   - Trace: ground material no longer derives from `params.ground_color`.
   - Proof: existing mood tests plus focused diff review.
6. Do not change bridge commands, TypeScript bridge types, debug panel UI, undo/redo, bundle schema, save/load, prop spawn, character spawn, imported background prop, or authored Stage material behavior.
   - Trace: narrowed Linear scope.
   - Proof: changed-file review.

## Design Plan

### S0. Baseline Re-Check

| Field | Content |
|---|---|
| Input | Clean Shotloom worktree from `origin/main`, current STL-488 Linear body, current stage/material code. |
| Output | Confirm branch and dirty state before editing. |
| Failure handling | If an old visibility-toggle WIP is present, do not reuse it; create or switch to a clean narrowed-scope worktree. |
| Proof | `git status --short`, `git diff --name-only origin/main`. |

### S1. Stage Setup Wiring

| Field | Content |
|---|---|
| Input | `stage_setup.rs`, `PlaceholderMaterial`. |
| Output | Normal `Commands` spawn path uses shared placeholder handle for `StageGround`. |
| Non-output | No visibility state, bridge command, UI, prop, character, or authored Stage change. |
| Failure handling | If borrowing resources through the system signature exceeds practical complexity, factor a small shared spawn argument struct local to stage setup. |
| Proof | Initial void-stage setup test checks handle equality. |

### S2. World Ensure Path

| Field | Content |
|---|---|
| Input | `ensure_void_stage_entities`, `spawn_void_stage_world`. |
| Output | Direct world fallback restoration uses shared placeholder handle. |
| Non-output | No model-sync semantic change beyond the fallback ground material. |
| Failure handling | If `PlaceholderMaterial` is absent in a minimal test harness, initialize or insert it explicitly in that harness; production app must rely on deterministic material startup. |
| Proof | Direct ensure-path or model-sync fallback test checks handle equality. |

### S3. Startup Ordering

| Field | Content |
|---|---|
| Input | `MaterialsPlugin`, `PlaceholderMaterialPlugin`, `StartupPhase`, `setup_void_stage`. |
| Output | Placeholder material resource exists before stage setup needs it. |
| Non-output | No unrelated startup phase refactor. |
| Failure handling | Prefer putting placeholder init into the existing startup phase model over adding a fallback material allocation. |
| Proof | Startup/order test or existing app startup test with `StageGround` material assertion. |

### S4. Tests And Comments

| Field | Content |
|---|---|
| Input | Existing stage setup tests and comments describing fresh material allocation. |
| Output | Tests assert placeholder handle identity on setup and rebuild; stale comments are updated. |
| Non-output | No broad docs rewrite. |
| Failure handling | If a test cannot observe handle identity cleanly, add a small test-only helper rather than weakening the assertion to “material exists”. |
| Proof | Focused `shotloom-engine` tests below. |

Focused verification:

```sh
cargo test -p shotloom-engine stage_setup
cargo test -p shotloom-engine placeholder
cargo test -p shotloom-engine broad_sync_removing_stage_preserves_shot_owned_prop_and_restores_void_fallback
```

Before PR:

```sh
pnpm validate:rust
```

## Acceptance Criteria

| AC | Proof |
|---|---|
| Initial default `StageGround` uses `PlaceholderMaterial`. | Stage setup test. |
| Rebuilt default `StageGround` uses `PlaceholderMaterial`. | Mood rebuild test. |
| Direct world fallback restoration uses `PlaceholderMaterial`. | Ensure-path or model-sync fallback test. |
| Placeholder initialization is deterministic before stage setup. | Startup/order test or full app startup assertion. |
| Mood lighting and clear color continue to work. | Existing mood tests plus focused diff review. |
| Non-ground material paths stay unchanged. | Changed-file review. |
| No bridge/editor/bundle/schema changes. | Changed-file review. |

## Risk Map

| Risk | Applies | Evidence | Plan response | Proof |
|---|---|---|---|---|
| Error source chain | No | No fallible external error path is introduced. | Do not add new errors. | N/A. |
| Schema compatibility | No | Runtime material assignment only. | No bundle/schema/save/load changes. | Changed-file review. |
| Ownership/API boundary | Medium | `StageGround` is engine-owned; props and authored Stage have separate material paths. | Target only `StageGround` spawn paths. | Changed-file review and tests. |
| Partial mutation/rollback | Low | Startup/rebuild spawn either creates stage entities or test fails. | Do not add multi-step authored mutation. | Existing stage setup lifecycle tests. |
| Diagnostic ownership | No | No new rejection or diagnostic. | N/A. | N/A. |
| Test oracle strength | Medium | A weak test could pass with any material. | Assert exact handle equality with `PlaceholderMaterial::handle()`. | Stage setup tests. |
| Scope creep | Medium | Ground visibility and debug UI are adjacent requests. | Non-goals explicitly exclude bridge/editor behavior. | Changed-file review. |
| Reviewer objection | Medium | Startup ordering can be subtle in Bevy. | Make ordering explicit or prove resource availability. | Startup/order test. |

## Non-Goals

- Do not add a ground visibility toggle.
- Do not add a bridge command.
- Do not change TypeScript bridge types or editor UI.
- Do not change undo/redo, bundle schema, save/load, or persistence.
- Do not change `clear_background_props`, `spawn_background_props`, or
  `despawn_prop`.
- Do not change prop, character, imported background prop, or authored Stage
  material assignment.
- Do not add a new checker material resource.

## One-PR Suitability

Suitable for one small PR. The expected production diff is limited to stage
setup material assignment, material startup ordering if required, and focused
engine tests.

## Manual Repro

1. Open a void-stage editor/runtime view.
2. Confirm the default ground plane uses the checker placeholder pattern.
3. Change stage mood.
4. Confirm clear color and lighting change while the ground remains checker.
