---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-488
repo: shotloom
linear: STL-488
spec: ../../plans/proposed/stage-ground-placeholder-material.md
---

<!-- markdownlint-disable MD013 -->

# Stage Ground Placeholder Material Briefing

## Issue

| Field | Value |
|---|---|
| Linear | `STL-488` |
| Title | `feat(stage): 기본 ground plane checker material 적용` |
| Priority | `1` |
| Project | `Shotloom - bravo` |
| Branch target | new clean Shotloom worktree from `origin/main` |

## Intent Lens

Use the existing shared `PlaceholderMaterial` checker pattern for the
engine-owned default `StageGround` plane. This is a runtime fallback-plane visual
clarity change, not an editor command, UI interaction, authored Stage field, or
bundle persistence change.

## Current Primitives

| Primitive | Evidence | State |
|---|---|---|
| Ground marker | `crates/shotloom-engine/src/stage_setup.rs::StageGround` | Present |
| Ground spawn paths | `spawn_void_stage`, `spawn_void_stage_world` | Both allocate fresh mood-colored `StandardMaterial` |
| Placeholder material | `crates/shotloom-engine/src/materials/placeholder.rs::PlaceholderMaterial` | Existing shared checker `Handle<StandardMaterial>` |
| Material plugin | `MaterialsPlugin` → `PlaceholderMaterialPlugin` | Existing startup resource initializer |
| Startup order | `setup_void_stage` and placeholder init both run during `Startup` | Needs explicit ordering before relying on the resource |

## Acceptance Summary

- Default void-stage `StageGround` uses the shared `PlaceholderMaterial`.
- Setup, rebuild, and ensure paths use the same placeholder handle.
- Mood clear color, ambient light, and key light behavior remain mood-driven.
- Props, characters, imported background props, authored Stage material
  assignment, bridge commands, debug UI, bundle schema, and save/load remain
  unchanged.
- Tests prove initial spawn and rebuild material identity.

## Spec-Risk Handoff

| Priority | Risk | Required response |
|---|---|---|
| P1 | Startup ordering can make `PlaceholderMaterial` unavailable to `setup_void_stage`. | Put placeholder init in a deterministic phase before stage spawn, or otherwise prove the resource exists before use. |
| P1 | `ensure_void_stage_entities` uses a direct `World` path separate from `Commands`. | Pass/read the same placeholder material handle in both spawn paths. |
| P2 | Existing comments say ground material handles are freshly allocated on every rebuild. | Update only comments made stale by the implementation. |
| P2 | Tests can accidentally check “some material exists” instead of the shared handle. | Assert `StageGround` material handle equality with `PlaceholderMaterial::handle()`. |

## Next Step

Write and review the implementation spec. Stop before Shotloom source edits.
