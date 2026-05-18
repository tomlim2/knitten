---
status: ready
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-449
repo: shotloom
linear: STL-449
spec: ../../plans/proposed/core-add-shot-local-stage-model.md
---

### Shotloom coding mode - mixed

**Issue:** STL-449 "feat(core): shot-local StageModel 영속 모델 추가"
  Problem: STL-446 / ADR-0049 define Stage as a shot-local authored
  environment entity, but `origin/main` still has only `StageEnvironment`
  map/mood config plus background-prop compatibility paths.
  Acceptance:
  - add serde round-trip capable Stage model types
  - preserve legacy bundle reads for existing `StageEnvironment` shots
  - preserve Stage identity, elements, renderables, role, representation, and
    provenance across save/load
  - keep Stage-owned content and `PropModel` in separate model identities
  - keep shot-owned props out of `StageRole`
  - model `mesh` as representation, not role
  - pass `cargo test -p shotloom-core --lib` plus relevant bundle round-trip
    tests
  Affected:
  - `crates/shotloom-core/src/model/`
  - `crates/shotloom-core/src/bridge/` only if entity id / DTO impact appears
  - `docs/specs/bundle-format.md`
  - `docs/specs/stage-entity-model.md`
  - `docs/adr/adr-0049-stage-entity-model.md`
  Linked:
  - ADR-0007, ADR-0041, ADR-0044, ADR-0049
  - `crates/shotloom-core/architecture.md`
  - `docs/specs/bundle-format.md`
  - `docs/specs/stage-entity-model.md`

**Branch:** `feat/core-add-shot-local-stage-model` (base: `origin/main`
`376c2cf5`) 0 commits ahead, clean

**Standards loaded:** AGENTS.md, CLAUDE.md, CONTRIBUTING.md,
docs/guidelines/error-handling.md, docs/guidelines/review-rust.md,
docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md,
docs/guidelines/documentation-standard.md, docs/guidelines/review-typescript.md,
crates/shotloom-core/architecture.md, ADR index.

**ADRs to honor:**
- ADR-0007: Shot remains the primary editing unit; first Stage persistence
  shape should stay shot-local, not an immediate shared catalog.
- ADR-0041: Bundle-side polymorphic refs use `ShotEntityRef`; `ShotEntityId`
  remains runtime/bridge flat-key debt. Stage refs need an explicit decision if
  they touch entity-reference surfaces.
- ADR-0044: Every collection reachable from `BundleModel` must use `im::Vector`
  or `im::OrdMap`; deterministic keyed collections default to `im::OrdMap`.
- ADR-0049: Stage entity model is Proposed; Stage is not a background asset and
  not a `PropModel` replacement. `StageElement` owns semantic role/lifecycle;
  `StageRenderable` owns representation kind/asset binding.

**Ask-first triggers for this task:**
- changing bridge protocol, TypeScript bridge types, or `docs/ipc/`
- removing or renaming `StageEnvironment`, `StageRequest`, or
  `spawn_background_props`
- adding bundle-level shared Stage catalog semantics
- changing Bevy ECS hydration or runtime scheduling
- introducing new dependencies
- changing VRM/asset-pipeline contracts outside Stage model persistence

**Intent lens:** introduce the smallest persisted core model surface that lets
future work distinguish Stage-owned environment content from shot-owned props.
The failure mode to prevent is importing environment content as ordinary props
forever because the core model has no Stage identity, element, renderable, role,
or provenance surface.

**AC primitive cross-check:**
- Stage serde round-trip: codified - existing model tests in
  `crates/shotloom-core/src/model/entity.rs` and `shot.rs` use serde
  round-trip tests; new Stage types should follow that pattern.
- Legacy bundle reads: codified - `ShotModel.duration_frames` uses
  `#[serde(default = ...)]`; review-rust §7 requires `#[serde(default)]` for
  new fields on existing forward-compatible types.
- Save/load preservation: codified - `docs/specs/bundle-format.md` states Rust
  `ShotModel` is the canonical owner for `shots/*.json`; directory bundle
  helpers read/write `ShotModel` through serde.
- Stage-owned content separate from `PropModel`: codified by ADR-0049 and
  `docs/specs/stage-entity-model.md`; implementation primitive is absent and
  must be introduced here.
- No `shot_prop` StageRole: codified by Stage spec role table and role
  selection rule; add negative test or enum-variant review check in the spec.
- `mesh` as representation, not role: codified by ADR-0049 and Stage spec
  Representation Kinds table.
- `cargo test -p shotloom-core --lib`: verification example - necessary but
  not sufficient if directory bundle helpers or docs changed; add targeted
  tests for the changed surfaces.
- Possible `crates/shotloom-core/src/bridge/` impact: sibling-owned unless
  Stage ids are added to bridge DTOs in this issue. Bridge authoring commands
  are STL-451 and should stay out of this PR.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Decide the exact first persisted shape before implementation:
  `ShotModel.stages: im::Vector<StageModel>` plus
  `active_stage_id: Option<StageId>` vs an alternate shape. Evidence:
  `ShotModel` currently has `props`, `cine_cameras`, and `environment` but no
  stage fields. AC-trace: scope asks for `stages` and `active_stage_id`
  strategy.
- P1: Lock serde/backcompat semantics for legacy shot JSON that lacks Stage
  fields. Evidence: review-rust §7 and existing `duration_frames` default.
  AC-trace: legacy bundle read acceptance.
- P1: Lock persistent collection choices for every new Stage-reachable
  collection. Evidence: `crates/shotloom-core/architecture.md` and ADR-0044.
  AC-trace: Stage elements/renderables/layers/provenance collections.
- P1: Decide whether `StageId` should use `define_authored_id!` constraints or
  another id validator. Evidence: `CharacterId`, `PropId`, and
  `CineCameraId` are authored ids rejecting `:`; `ShotEntityId` uses flat
  namespace strings for runtime/bridge only. AC-trace: stable Stage identity.
- P1: Decide whether Stage appears in any polymorphic entity-reference type in
  this PR. Evidence: ADR-0041 owns `ShotEntityRef` and `ShotEntityId`
  disposition. AC-trace: `ShotEntityId::stage:<id>` is mentioned in STL-446
  but STL-449 scope only says bridge impact if needed.
- P2: Decide initial validation strength for `active_stage_id`: allow dangling
  IDs until a later validator, or add model-level validation now. Evidence:
  `ShotModel::validate_camera_entries` and bundle validation patterns.
  AC-trace: save/load preserves active Stage identity.
- P2: Decide whether Stage renderable/provenance details land now or only a
  minimal placeholder, because STL-450 owns asset/provenance modeling.
  Evidence: STL-450 is blocked by STL-449 and owns renderable asset/provenance
  connection. AC-trace: STL-449 acceptance names provenance preservation.
- P2: Decide bundle-format doc altitude: update current `StageEnvironment`
  section to mention new fields, but avoid duplicating every Rust field.
  Evidence: bundle-format says Rust `ShotModel` is canonical owner.
  AC-trace: docs made stale by change.
- P2: Decide how new Stage fields interact with directory bundle native-only
  helpers. Evidence: directory bundle reads/writes full `ShotModel`; no custom
  stage-specific IO exists. AC-trace: save/load preservation.
- P3: Add test names that make role/representation separation obvious, e.g.
  `stage_role_does_not_include_shot_prop` and
  `mesh_is_stage_representation_not_role`. Evidence: review feedback patterns
  on Stage docs stressed rename/ownership clarity. AC-trace: negative role and
  mesh representation ACs.

**Sibling specs (agent-hub/docs/plans/):**
- `proposed/adr-record-stage-entity-model.md` - HEAD/working tree - stance:
  completed the docs-only ADR/spec decision and explicitly lists Rust model
  implementation as a follow-up candidate - agrees; this task is that follow-up
  and must not reopen the ADR altitude.
- `briefings/shotloom/adr-record-stage-entity-model.md` - HEAD/working tree -
  stance: ready briefing for STL-448, with P1 seeds about Stage/Prop/asset
  boundaries - agrees; reuse its intent lens, but implementation now happens in
  core model instead of docs-only ADR.
- Deleted sibling specs: none found by git history scan for StageModel/stage
  entity slugs.

**Pre-write checklist passed:**
- [x] gh auth: `tomlim2` active; inactive `deemotl` token reports failure but
      is not active.
- [x] commit identity: worktree local config is `tomlim2 <deemo@vonvon.me>`;
      inherited HEAD author is from the existing `origin/main` commit.
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index.
- [x] category: mixed (`rust` + docs; bridge only if entity id impact appears).
- [x] targeted sections loaded.
- [x] AC primitive cross-check recorded.
- [x] spec-risk handoff seeded.
- [x] sibling-spec scan run.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
