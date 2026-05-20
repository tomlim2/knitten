---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-452
repo: shotloom
linear: STL-452
spec: ../../plans/proposed/stage-model-runtime-hydration.md
---

# StageModel Runtime Hydration Ready Briefing

## Task

`STL-452` asks the engine to materialize persisted `StageModel` data into
Bevy runtime topology. The issue is now `In Progress`; blockers `STL-449` and
`STL-450` are landed on current `origin/main`.

Implementation branch: `feat/stage-model-runtime-hydration`.

## Standards Loaded

- `AGENTS.md`, `SYSTEM.md`, `rules/index.md`, and the Shotloom auto rules.
- `CONTRIBUTING.md`, `WORKFLOW.md`, and
  `docs/guidelines/code-review-guideline.md`.
- `docs/guidelines/spec-procedure-guideline.md`,
  `docs/guidelines/documentation-standard.md`, and
  `docs/guidelines/error-handling.md`.
- `agent/skills/shotloom-start-task/SKILL.md`,
  `agent/skills/shotloom-draft-spec/SKILL.md`, and
  `agent/skills/shotloom-review-task-plan/SKILL.md`.

## Current Truth

| Surface | Evidence | Meaning for `STL-452` |
|---|---|---|
| Void stage runtime | `crates/shotloom-engine/src/stage_setup.rs` | `StageEntity` currently means void-stage ground/light only, and `rebuild_stage_on_change` despawns all `StageEntity` on mood changes. |
| Model sync | `crates/shotloom-engine/src/model_sync.rs` | The live bundle sync only materializes characters, props, and cine cameras through `ShotEntityMap`; no Stage ids are tracked. |
| Stage core model | `crates/shotloom-core/src/model/stage.rs` | `StageModel`, `StageElement`, `StageRenderable`, roles, representations, visibility, lock, and provenance exist. |
| Shot ownership | `crates/shotloom-core/src/model/shot.rs` | `ShotModel.stages` and `active_stage_id` are separate from `props`, so runtime Stage entities must not be keyed as `ShotEntityId`. |
| Asset kind | `crates/shotloom-core/src/model/asset.rs` | `AssetKind::StageRenderable` exists for future concrete Stage renderable assets. |
| Runtime topology doc | `docs/arch/stage-runtime-topology.md` | The doc is a proposed note, not an implemented API. |
| Stage concept spec | `docs/specs/stage-entity-model.md` | Stage is shot-local authored environment content and is not a `PropModel` replacement. |
| Bundle format | `docs/specs/bundle-format.md` | Missing `stages` / `active_stage_id` default safely for legacy bundles; valid present Stage content is load-blocking. |
| Background prop path | `crates/shotloom-engine/src/bridge/handlers/props.rs` | `spawn_background_props` remains a debug/compatibility path that creates shot-owned `PropModel` and prop ECS entities. |
| Stage command handlers | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Stage authoring wire commands currently reject with the placeholder runtime-handler-not-implemented message. This task does not implement those handlers. |

## Linear Acceptance Cross-Check

- Stage root and role/representation child entities: target is codified by
  `docs/arch/stage-runtime-topology.md`, but live engine code is missing it.
- Legacy no-Stage shot keeps void stage: live `stage_setup.rs` already provides
  this fallback; the new runtime path must preserve it.
- Stage-owned runtime entities versus shot-owned prop entities: codified by
  ADR-0050 / `docs/specs/stage-entity-model.md` and by separate `ShotModel`
  collections.
- Rehydrate preserves persisted Stage id: codified by topology ownership rules.
- Stage deletion/reload does not delete shot-owned `PropModel` entity: requires
  a separate Stage runtime map instead of reusing `ShotEntityMap`.
- Engine regression: add focused `cargo test -p shotloom-engine --lib` coverage.

## Related Context

- `docs/plans/proposed/core-add-shot-local-stage-model.md` (`STL-449`) landed
  the persisted Stage model and explicitly left runtime hydration as follow-up.
- `docs/plans/proposed/core-stage-renderable-provenance.md` (`STL-450`) landed
  renderable provenance and `AssetKind::StageRenderable`; it also scoped out
  runtime hydration.
- `docs/plans/proposed/bridge-add-stage-authoring-contract.md` (`STL-451`)
  defines bridge authoring behavior but scopes out Bevy runtime hydration.
- `docs/plans/proposed/bridge-split-stage-handlers.md` records that the large
  Stage authoring handler PR was split; current `origin/main` still rejects
  authored Stage commands at runtime.
- `STL-453` is blocked by this work because import promotion needs a Stage
  runtime target distinct from background props.

## Review Risks To Lock In The Spec

- P1: Do not reuse `ShotEntityMap` or `ShotEntityIdComponent` for Stage runtime
  entities. Stage ids are `StageId` / `StageElementId` / `StageRenderableId`,
  and the runtime map must not collide with prop/character/camera selection ids.
- P1: Do not let `StageRequestRes` mood changes despawn authored Stage runtime
  entities. The current `StageEntity` marker belongs to void-stage fallback;
  authored Stage runtime needs its own marker/map or a safer teardown query.
- P1: Keep the first implementation unit reviewable. This PR should hydrate the
  authored topology and components; full GLB/mesh render loading, editor UI,
  and import migration belong to `STL-453`/later work.
- P2: Tests must assert final ECS state: Stage root exists, role/representation
  children exist, Stage ids are preserved across rehydrate, legacy void remains
  when no Stage exists, and shot-owned props survive Stage removal/reload.
- P2: The topology doc must be updated from proposed-only language to the
  implemented API/marker contract.
- P3: Keep `shotloom-stage` runtime-agnostic; it can remain the owner of
  `StageRequest`/map parsing but should not depend on the core persisted
  Stage model for this issue.

## Ask-First Triggers

Ask before introducing bridge protocol changes, changing Stage persistence
schema, moving Stage authoring handlers, replacing background prop behavior,
adding new dependencies, or changing Bevy plugin ordering beyond registering
the new sync helpers in the existing model-sync phase.
