---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-452
repo: shotloom
linear: STL-452
briefing: ../../briefings/shotloom/stage-model-runtime-hydration.md
---

# Hydrate StageModel Runtime Entities

## Spec Contract

- Briefing basis: `../../briefings/shotloom/stage-model-runtime-hydration.md`
  captures the current `STL-452` scope after `STL-449` and `STL-450` landed.
- Current truth: Shotloom persists Stage data and bridge read models expose it,
  but engine model sync only materializes characters, props, cine cameras, and
  legacy void-stage ground/light.
- Required change: hydrate each current-shot `StageModel` into Stage-owned Bevy
  runtime entities with root, element, renderable, role, representation,
  visibility, lock, and identity components.
- Locked boundary: no editor UI, no bridge authoring handler implementation, no
  background-prop migration/removal, no Stage persistence schema change, and no
  production StageRenderable asset loading.
- Proof method: focused engine tests assert ECS topology and legacy fallback
  behavior, and docs update `docs/arch/stage-runtime-topology.md` to the
  implemented marker/component contract.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Void stage setup | `crates/shotloom-engine/src/stage_setup.rs::StageEntity`, `setup_void_stage`, `rebuild_stage_on_change` | Partial / compatibility | Spawns ground and key light for the fallback void stage. Mood rebuild despawns every `StageEntity`. |
| Model sync runtime | `crates/shotloom-engine/src/model_sync.rs::ModelSyncRuntime` | Partial | Tracks `ShotEntityMap` for `ShotEntityId` only and requests broad sync after durable mutations. |
| Desired entity collection | `crates/shotloom-engine/src/model_sync.rs::DesiredEntity` | Missing for Stage | Collects characters, props, and cine cameras; no Stage data is read from `ShotModel.stages`. |
| Authored entity components | `crates/shotloom-engine/src/entity.rs` | Already Done for shot entities | Defines `ShotEntityIdComponent`, `Character`, `Prop`, and `CineCamera`. These must remain shot-owned, not Stage-owned. |
| Stage core model | `crates/shotloom-core/src/model/stage.rs` | Already Done | Defines `StageModel`, `StageElement`, `StageRenderable`, `StageRole`, `StageRepresentationKind`, `visible`, and `locked`. |
| Shot model | `crates/shotloom-core/src/model/shot.rs` | Already Done | Stores `stages` and `active_stage_id` separately from `props`; legacy no-stage shots default to no authored Stage content. |
| Stage asset kind | `crates/shotloom-core/src/model/asset.rs::AssetKind::StageRenderable` | Already Done / future visual hook | A concrete Stage renderable asset kind exists, but this issue does not need to make GLB loading production-complete. |
| Stage command handlers | `crates/shotloom-engine/src/bridge/handlers/stage.rs::handle_stage_authoring_not_implemented` | Out of scope | Authored Stage bridge commands intentionally reject until handler slices land. Runtime hydration should work from existing bundle state, not new commands. |
| Background prop debug path | `crates/shotloom-engine/src/bridge/handlers/props.rs::spawn_background_props_deferred` | Compatibility | Creates shot-owned `PropModel` and prop ECS entities. `STL-452` must not remove or reinterpret this path. |
| Runtime topology doc | `docs/arch/stage-runtime-topology.md` | Partial | Describes expected Stage root and child topology but says it is not an implemented Rust API. |
| Stage entity spec | `docs/specs/stage-entity-model.md` | Already Done | Locks Stage as shot-local authored environment content separate from `PropModel`; runtime handoff points at the topology doc. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-452` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Hydrate persisted `StageModel` into engine runtime topology so Stage-owned content is distinct from shot-owned props. |
| Acceptance criteria | StageModel shots create Stage root plus role/representation child entities; no-Stage legacy shots keep void stage; Stage and prop runtime entities have distinct markers; rehydrate preserves persisted Stage id; Stage deletion/reload does not delete shot-owned prop entities; `cargo test -p shotloom-engine --lib` includes runtime hydration regression. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Linear still lists `STL-449` and `STL-450`; both are landed on current `origin/main`. |
| Related PRs | `STL-449` PR #358, `STL-450` PR #359, Stage wire contract PR #370, Stage validation PR #377. |
| Current review state | No PR for `STL-452` yet. |
| Planning consequence | This is suitable for one PR only if it stays to engine runtime materialization plus topology docs and leaves import/UI/command-handler work to sibling issues. |

## Problem

Shotloom can now persist shot-local Stage data, but the Bevy world cannot see
that data as Stage-owned runtime topology. The only existing Stage runtime path
is the legacy void-stage ground/light, and the only current visual import
debug path creates `PropModel` entities through `spawn_background_props`.

That leaves future import and editor work without a safe runtime target:
Stage-owned shell, structure, fixture, set dressing, proxy, and anchor content
would either be invisible or be mistaken for shot-owned props. `STL-452` must
add the engine-only topology and sync rules that keep those ownership domains
separate.

## Requirements

1. Add engine-only Stage runtime components for authored Stage topology:
   Stage root identity, element identity, renderable identity, semantic role,
   representation kind, visibility, lock, and active-stage marker.
   - Trace: `STL-452` component scope and `docs/arch/stage-runtime-topology.md`.
   - Stage: S1.
   - Verification: V1, V2.
2. Add a Stage runtime entity map keyed by `StageId`, `StageElementId`, and
   `StageRenderableId`, separate from `ShotEntityMap` and
   `ShotEntityIdComponent`.
   - Trace: Stage/Prop ownership AC and `ShotModel.stages` vs `ShotModel.props`.
   - Stage: S1, S2.
   - Verification: V2, V4.
3. Extend model sync to collect and hydrate every `StageModel` in the current
   authoring shot. If `active_stage_id` is set, exactly the matching Stage root
   carries the active marker; if it is `None`, no Stage root is marked active.
   - Trace: `STL-452` StageModel load AC and `ShotModel.active_stage_id`.
   - Stage: S2.
   - Verification: V2, V3.
4. Hydration creates one Stage root entity per Stage, one element child entity
   per `StageElement`, and one renderable child entity per `StageRenderable`
   referenced by an element. Referenced renderables should be children of the
   element that references them; unreferenced renderables may be children of the
   Stage root but must still carry renderable identity and representation.
   - Trace: topology doc and Stage reference validation precedent.
   - Stage: S2.
   - Verification: V2.
5. Rehydration may replace Bevy entity ids, but the persisted Stage id,
   element id, and renderable id components must remain stable and queryable
   after rebuild.
   - Trace: `STL-452` rehydrate identity AC.
   - Stage: S2, S3.
   - Verification: V3.
6. Preserve legacy void-stage behavior when the current shot has no
   `StageModel`. When the current shot has at least one Stage, authored Stage
   runtime topology becomes the Stage runtime surface and automatic void-stage
   mood rebuilds must not despawn authored Stage runtime entities.
   - Trace: legacy no-Stage AC and current `stage_setup.rs` behavior.
   - Stage: S3.
   - Verification: V1, V5.
7. Stage removal, shot reload, and no-current-shot sync must despawn only
   Stage-owned runtime entities from the Stage runtime map and must not despawn
   shot-owned prop, character, or cine-camera entities through the Stage path.
   - Trace: prop preservation AC and Stage/Prop ownership boundary.
   - Stage: S2, S3.
   - Verification: V4.
8. Keep `shotloom-stage` runtime-agnostic. The hydration path may read
   `shotloom-core::model::StageModel` from `BundleModel`, but must not add a
   dependency from `shotloom-stage` to the persisted Stage model.
   - Trace: `docs/arch/stage-runtime-topology.md` boundary.
   - Stage: S1 through S5.
   - Verification: V6.
9. Update `docs/arch/stage-runtime-topology.md` from proposed-only language to
   the implemented engine marker/component contract, including the void-stage
   fallback boundary and prop separation rule.
   - Trace: `STL-452` docs AC.
   - Stage: S5.
   - Verification: V6.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This issue adds ECS components/sync logic and no parser, loader, IO, or new external-error wrapper. | Reuse existing `model_sync_failed` diagnostics only if sync validation introduces an internal error; otherwise no new error type is needed. | V7 includes `cargo test -p shotloom-engine --lib`; source-chain proof is N/A because no wrapped external error is introduced. |
| Schema / serialization compatibility | no | `StageModel` and `ShotModel.stages` already exist in `shotloom-core`; runtime components are not serialized. | Do not modify persisted structs, bridge DTOs, or JSON fixtures for this PR. | V6 diff review and `cargo test -p shotloom-engine --lib` prove no new schema path is required. |
| Ownership / API boundary | yes | `ShotEntityMap` is keyed by `ShotEntityId`; Stage ids are separate types under `shotloom-core::model`. | Add a separate Stage runtime map/components and keep Stage runtime out of `PropModel` / `ShotEntityIdComponent`. | V2 and V4 assert Stage entities lack prop markers and props survive Stage rebuild/removal. |
| Partial mutation / rollback | yes | `model_sync.rs` can despawn/spawn entities during one broad sync; a failure mid-sync could leave half-updated runtime topology. | For Stage runtime hydration, either precompute the desired topology before despawn/spawn or stage mutations so failure-free marker-only spawning happens after validation. Do not touch shot-owned maps from the Stage path. | V3 and V4 assert failed or repeated sync does not lose prop entities and preserves Stage ids; if a new sync error branch is added, add an unchanged-state test. |
| Diagnostic ownership | yes | Existing model sync diagnostics use `model_sync_failed` from `shotloom_engine_model_sync`. | Do not introduce bridge rejection codes. Runtime hydration failures, if any, are model-sync diagnostics owned by engine sync. Marker-only hydration should avoid user-facing diagnostics. | V7 checks no unexpected diagnostics for valid Stage hydration; failure-path diagnostics only if the implementation adds a sync precheck. |
| Local absolute path exposure | no | Planned docs/tests use repo-relative module paths and in-memory models. | Do not commit checkout-root paths, local asset roots, or machine-specific examples. | V6 includes `rg` proof for local absolute paths in changed docs if docs mention paths. |
| Manifest path containment | no | Full StageRenderable asset loading is out of scope; no new manifest path resolution is needed. | Defer concrete GLB/asset loading to follow-up Stage import/asset issues. If a tiny mesh proof is attempted, reuse existing manifest resolution helpers and containment tests. | N/A for marker-only hydration; asset-load tests become required only if implementation loads asset paths. |
| Command rejection matrix | no | Stage authoring command handlers still reject as placeholder; this issue does not alter bridge commands. | Do not edit command handlers except to request model sync from existing durable mutations if live code requires it. | Existing Stage command placeholder tests remain unchanged. |
| Asset/data pack lifecycle | no | No binary fixtures, packs, or LFS assets are added. | Use in-memory Stage models in tests. | N/A: no asset file diff. |
| Bridge docs parity | no | No bridge DTO/command/event change is in scope. | Leave `docs/ipc/bridge-contract.md` unchanged unless implementation discovers a stale doc reference to topology path only. | N/A: no wire diff. |
| Event-state visibility | no | Runtime hydration is triggered by model sync, not a new accepted bridge command. | Existing durable mutation and load paths already request broad sync; this PR only changes what sync materializes. | V2/V4 post-state assertions on ECS topology, not event snapshots. |
| Input constraint parity | no | No new user-facing input is exposed. | Reuse validated `StageModel` values from loaded bundle state. | N/A: no new input. |
| Test oracle strength | yes | Without implementation, current model sync never creates Stage runtime entities. | Add tests that query actual components and entity separation, not just successful update calls. | V1-V5 fail before hydration exists and pass after implementation. |
| Scope creep | yes | `STL-453`, `STL-454`, and later GLB import/UI work are adjacent. | Non-goals exclude import promotion, UI, bridge handler implementation, and full renderable asset loading. | V6 PR scope review; changed files stay engine runtime/tests plus topology docs unless a required export changes. |
| Reviewer objection | yes | Likely objections: reusing `StageEntity` may let mood rebuild delete authored Stage entities, or marker-only renderables may not visually prove GLB import. | Locked decisions separate void `StageEntity` from authored Stage runtime and explicitly defer production renderable asset loading. | V1/V4 prove fallback and prop separation; Follow-Up Candidates name asset-backed rendering/import. |

## Locked Decisions

1. **Stage runtime entities get a separate identity path from shot entities.**

   Rationale: Stage ids are not `ShotEntityId`, and `ShotEntityMap` is already
   the owner for character, prop, and cine-camera runtime mapping. A separate
   Stage runtime map prevents Stage deletion/reload from touching shot-owned
   prop entities.

   Rejected alternatives: encode Stage roots as `ShotEntityIdComponent`; reuse
   `Prop` / `PropModel`; key Stage roots by display name.

2. **Keep void-stage `StageEntity` as the legacy fallback marker and add
   authored Stage runtime markers/components separately.**

   Rationale: `stage_setup.rs` currently despawns all `StageEntity` on
   `StageRequestRes` changes. Reusing that marker for authored Stage topology
   would make a mood change capable of deleting persisted Stage runtime
   entities.

   Rejected alternatives: retcon `StageEntity` to mean every Stage-related
   entity without first changing all teardown queries; disable `SetStageMood`
   entirely for authored Stage shots.

3. **Hydrate all current-shot stages, not only `active_stage_id`.**

   Rationale: `ShotModel.stages` is the authored collection and `active_stage_id`
   is selection state. Hydrating all stages preserves runtime identity and lets
   follow-up editor/import work query non-active Stage topology without
   requiring another sync contract. The active id only controls an active marker.

   Rejected alternatives: hydrate only active stage; synthesize an active Stage
   when `active_stage_id` is `None`; treat `active_stage_id` as a render filter.

4. **This PR hydrates topology and representation metadata, not production GLB
   render loading.**

   Rationale: Linear requires Stage root and role/representation child entities,
   and sibling issues own import promotion and actual GLB load. Marker-first
   topology is the smallest reviewable unit that unblocks those layers without
   merging asset-pipeline policy into runtime sync.

   Rejected alternatives: make `STL-452` import S2M GLBs; reuse prop scene
   loading and therefore prop asset semantics; leave renderable entities absent
   until GLB loading is ready.

5. **Unreferenced renderables still hydrate as Stage-owned renderable entities.**

   Rationale: core validation can permit renderables that are not currently
   referenced by an element, and retaining them in runtime topology preserves
   identity for future editor repair/inspection. They are parented to the Stage
   root rather than dropped.

   Rejected alternatives: reject unreferenced renderables at runtime; silently
   skip them; attach them to an arbitrary first element.

6. **Stage sync integrates with the existing `SyncFromModel` phase.**

   Rationale: `SyncFromModel` already runs after durable mutations and before
   bridge consumers. Adding Stage topology there keeps runtime hydration tied
   to the live `BundleModel` instead of bridge command handlers.

   Rejected alternatives: hydrate in Stage bridge handlers; hydrate in
   `shotloom-stage`; add an independent schedule phase before the bridge
   transaction boundary.

7. **Void fallback is present only for no-Stage current shots.**

   Rationale: `STL-452` says void stage remains the fallback when no
   `StageModel` exists. Once authored Stage data exists, the authored topology
   is the runtime Stage surface; otherwise the world can contain both a void
   floor and authored Stage roots and confuse picking/ownership.

   Rejected alternatives: always keep the void floor under authored stages;
   remove void fallback globally; make fallback depend on `active_stage_id`
   rather than whether `shot.stages` is empty.

## Non-Goals

- Do not implement editor Stage outliner, inspector, edit mode, or selection UI.
- Do not implement Stage authoring bridge command handlers beyond existing
  placeholder behavior.
- Do not remove or migrate `spawn_background_props` / `clear_background_props`.
- Do not convert background prop debug samples into `StageModel` content.
- Do not add production GLB, splat, panorama, or cubemap asset loading for
  Stage renderables in this PR.
- Do not change persisted `StageModel`, `ShotModel`, bridge DTO, or TypeScript
  wire schema.
- Do not add dependencies or change bundle/load validator policy.
- Do not make `shotloom-stage` depend on `shotloom-core` Stage model types.

## Implementation Spec

### S0: Baseline Re-Check

- Re-read `STL-452`, this spec, `stage_setup.rs`, `model_sync.rs`, `entity.rs`,
  `stage-runtime-topology.md`, and `stage-entity-model.md`.
- Confirm `cargo test -p shotloom-engine --lib` currently lacks Stage runtime
  hydration assertions.
- Requirement coverage: all.
- Risk rows: scope creep, reviewer objection.

### S1: Add Engine Stage Runtime Components

- Add a small engine-internal module, preferably
  `crates/shotloom-engine/src/stage_runtime.rs`, for authored Stage runtime
  components and helpers.
- Components should include:
  - `StageRuntimeRoot { stage_id: StageId }`
  - `StageRuntimeElement { stage_id: StageId, element_id: StageElementId }`
  - `StageRuntimeRenderable { stage_id: StageId, renderable_id: StageRenderableId }`
  - `StageRuntimeRole(StageRole)`
  - `StageRuntimeRepresentation(StageRepresentationKind)`
  - `StageRuntimeVisibility { visible: bool }`
  - `StageRuntimeLock { locked: bool }`
  - `ActiveStageRuntime`
- Keep these components engine-owned and avoid bridge DTO exposure.
- Requirement coverage: R1, R2, R8.
- Verification: V2, V6.
- Risk rows: ownership/API boundary.

### S2: Add Stage Runtime Mapping And Hydration Helpers

- Extend `ModelSyncRuntime` with a separate `StageRuntimeMap`, or store that
  map in the new module and resource it through `ModelSyncRuntime` if keeping
  all sync bookkeeping together is cleaner.
- Collect current-shot Stage data from `ShotModel.stages`.
- Build a desired topology from the full Stage list before despawn/spawn.
- Spawn:
  - root entity named from `StageModel.display_name` with Stage root identity
    and transform from `StageModel.base_transform`;
  - element child entities with role, visibility, lock, authored display name
    via `Name`, and transform from `StageElement.base_transform`;
  - renderable child entities with representation and transform from
    `StageRenderable.local_transform`.
- Parent referenced renderables under their referencing element. Parent
  unreferenced renderables under the Stage root.
- Do not attach `Prop`, `ShotEntityIdComponent`, or `BridgeEntityId` to Stage
  runtime entities.
- Requirement coverage: R1-R5, R7, R8.
- Verification: V2, V3, V4.
- Risk rows: ownership/API boundary, partial mutation/rollback.

### S3: Integrate With Void Fallback And Rebuild Rules

- Ensure no-Stage current shots keep existing void-stage startup and mood
  rebuild behavior.
- Factor the current void-stage spawn/despawn logic into a helper that can be
  reused safely from both `stage_setup.rs` and model-sync-owned Stage runtime
  reconciliation, instead of duplicating ground/light setup.
- When the current shot has authored Stage data, remove fallback void entities
  if present and prevent `StageRequestRes` changes from deleting authored Stage
  runtime entities.
- Restore void fallback when sync moves from a Stage-bearing shot to a no-Stage
  shot.
- Keep `StageStatusRes` semantics compatible: valid no-Stage fallback remains
  `Ready`, and valid authored Stage hydration should also leave the stage
  runtime ready.
- Requirement coverage: R5-R7.
- Verification: V1, V3, V5.
- Risk rows: reviewer objection, partial mutation/rollback.

### S4: Regression Tests

- Add focused tests under `crates/shotloom-engine/src/bridge/tests/model_sync.rs`
  or a dedicated engine test module that uses the existing model-sync test
  harness.
- Required tests:
  - no-Stage shot still has one void ground and key light after sync;
  - StageModel shot creates a Stage root, element child, and renderable child
    with expected role/representation/visibility/lock components;
  - repeated sync or rehydrate preserves persisted Stage id components even if
    Bevy entity ids are replaced;
  - removing a Stage despawns only Stage runtime entities and preserves a
    shot-owned prop entity;
  - mood change on an authored Stage shot does not despawn Stage runtime
    entities.
- Requirement coverage: all.
- Verification: V1-V5, V7.
- Risk rows: test oracle strength, partial mutation/rollback.

### S5: Documentation

- Update `docs/arch/stage-runtime-topology.md` to describe implemented
  components, ownership, fallback boundary, and the fact that StageRenderable
  asset loading remains follow-up.
- Update `MAP.md` only if adding a new source module requires navigation.
- Requirement coverage: R9.
- Verification: V6.
- Risk rows: docs parity, scope creep.

## Acceptance Criteria

- [ ] A current shot with one `StageModel` hydrates one Stage root, at least one
  role-bearing element child, and at least one representation-bearing
  renderable child.
- [ ] A legacy shot with empty `stages` keeps the existing void-stage behavior.
- [ ] Stage runtime entities do not carry shot-owned `Prop` or
  `ShotEntityIdComponent` markers.
- [ ] Rehydrate/rebuild preserves persisted Stage ids in runtime components.
- [ ] Stage removal/reload does not despawn a shot-owned prop entity.
- [ ] Runtime topology docs describe the implemented marker/component contract.
- [ ] `cargo test -p shotloom-engine --lib` passes with the new regression
  coverage.

## Verification

V1. Legacy fallback:

```bash
cargo test -p shotloom-engine stage_setup --lib
```

V2. Stage topology:

```bash
cargo test -p shotloom-engine model_sync --lib
```

The new tests must query actual ECS components and assert root/element/renderable
counts, component ids, role, representation, visibility, lock, and absence of
prop/shot-owned markers.

V3. Rehydrate identity:

- Mutate or reload the current shot so Stage runtime entities rebuild.
- Assert `StageRuntimeRoot.stage_id`, `StageRuntimeElement.element_id`, and
  `StageRuntimeRenderable.renderable_id` still match the persisted model.

V4. Prop preservation:

- Seed a shot with one `PropModel` and one `StageModel`.
- Sync, remove the Stage from the live model, sync again.
- Assert the prop ECS entity still exists and still maps through
  `ShotEntityMap`.

V5. Mood-change safety:

- Seed an authored Stage shot.
- Change `StageRequestRes.mood` or dispatch the existing mood command in the
  harness.
- Assert authored Stage runtime components still exist after update.

V6. Docs and scope review:

```bash
rg -n "local absolute path|machine-specific checkout" docs/arch/stage-runtime-topology.md MAP.md
git diff -- crates/shotloom-core apps/editor contracts docs/ipc
```

The docs review should confirm changed docs contain only repo-relative paths,
not local absolute paths or machine-specific checkout roots. The wire/schema
diff should be empty unless implementation discovers a documented navigation
update that is not a contract change.

V7. Final gate:

```bash
cargo test -p shotloom-engine --lib
```

## Spec Review Log

- Round 1, cold-start context: live code confirmed `stage_setup.rs` only owns
  void fallback and `model_sync.rs` only owns shot entities. The spec narrowed
  implementation to model-sync-driven Stage runtime topology and kept bridge
  command handlers out of scope.
- Round 2, paranoid implementer: the void fallback handoff was too implicit, so
  S3 now requires factoring reusable void spawn/despawn helpers instead of
  duplicating setup or letting mood rebuilds touch authored Stage runtime
  entities.
- Round 3, minimal PR reviewer: production GLB/asset loading stayed a follow-up
  because Linear's acceptance criteria only require root and role/representation
  child topology for this slice.
- Result: no open `P1`/`P2` findings remain; remaining possible nits are naming
  choices for the exact component structs during implementation.

## Traps

- Do not put `StageRuntimeRoot` on entities that also carry `Prop` or
  `ShotEntityIdComponent`; that would collapse the Stage/Prop boundary the task
  exists to protect.
- Do not reuse the current `StageEntity` marker for authored Stage topology
  without first changing every void-stage teardown query; `StageRequestRes`
  rebuilds would otherwise erase authored Stage runtime entities.
- Do not make `shotloom-stage` depend on `shotloom-core` Stage model types just
  because both names contain "stage"; the topology doc says
  `shotloom-stage` remains runtime-agnostic.
- Do not hide this task inside Stage authoring command handlers. Hydration must
  work from loaded bundle state and model sync, even before command handlers
  are implemented.
- Do not claim StageRenderable GLB rendering is complete if the implementation
  only creates marker/representation entities.

## Follow-Up Candidates

- `STL-453`: promote background prop debug import into a Stage import path.
- StageRenderable asset-backed mesh/GLB scene loading once import provides a
  concrete registered Stage asset.
- Editor Stage outliner/inspector/edit-mode UI and picking behavior over the
  new runtime components.
- Production collision, anchor, nav-hint, panorama, cubemap, and splat runtime
  systems over the marker topology.
