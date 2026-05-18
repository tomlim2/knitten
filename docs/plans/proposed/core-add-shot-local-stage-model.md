---
status: proposed
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-449
repo: shotloom
linear: STL-449
briefing: ../../briefings/shotloom/core-add-shot-local-stage-model.md
---

# Add Shot-Local StageModel Persistence

## Spec Contract

STL-449 adds the smallest durable Rust model surface for shot-local stages in
`shotloom-core`. The change must persist stage identity, elements,
renderables, roles, representation kinds, and lightweight provenance without
changing bridge commands, runtime spawning, shared asset catalogs, or the
legacy `StageEnvironment` compatibility path.

The reviewed implementation unit is suitable for one PR: it is a core-model
schema addition plus tests and durable documentation. Follow-up issues
STL-450 through STL-455 own authoring commands, viewport/runtime behavior,
editor UI, import integration, and export/diagnostics flows.

## Current-State Evidence

| Evidence | Current truth | Planning consequence |
| --- | --- | --- |
| `crates/shotloom-core/src/model/entity.rs` | `StageEnvironment` stores only `map`, optional `mood`, and optional `mood_filter`. | Keep this type intact as the legacy compatibility path. |
| `crates/shotloom-core/src/model/shot.rs` | `ShotModel` has `props`, `cine_cameras`, and `environment`, but no stage collection or active stage pointer. | Add stage fields with serde defaults so legacy shot JSON still loads. |
| `crates/shotloom-core/src/model/id.rs` | Authored IDs exist for character, prop, and cine camera. `ShotEntityRef` only covers character, prop, and cine camera. | Add stage-family authored IDs, but do not extend bridge/runtime entity refs in this PR. |
| `crates/shotloom-core/architecture.md` | Bundle-reachable collections must use `im::Vector` or `im::OrdMap`. | All new stage collections use persistent `im::Vector`. |
| `docs/specs/stage-entity-model.md` | Role and representation vocabulary is already defined: role is not mesh, and `shot_prop` is not a stage role. | Reuse that vocabulary exactly in persisted enums. |
| `docs/adr/adr-0049-stage-entity-model.md` | Stage is shot-local and separate from PropModel; `StageEnvironment`, `StageRequest`, and `spawn_background_props` stay as compatibility paths. | Do not replace props or wire runtime stage commands here. |
| `docs/specs/bundle-format.md` | `ShotModel` is the canonical owner for persisted shot schema. | Update bundle docs after adding fields. |

## Linear Briefing

Linear issue `STL-449` is the first implementation issue under the Stage docs
work. It asks for a shot-local Stage model in `shotloom-core` and blocks the
later command, runtime, editor, import, and export issues. The acceptance
criteria require serde round-trip coverage, legacy bundle compatibility, new
bundle save/load preservation, separation from `PropModel`, and the vocabulary
constraints that `shot_prop` is not a `StageRole` and `mesh` is a
representation kind rather than a role.

Current review state: no PR exists for this implementation yet. The branch is
`feat/core-add-shot-local-stage-model`, based on `origin/main` at
`376c2cf5 feat(persistence): add directory bundle conversion (#338)`.

Planning consequence: this PR should establish the persisted Rust data
contract and prove it locally. It should not pre-implement sibling issue
behavior because that would blur review ownership.

## Requirements

1. Add authored IDs for persisted stage data: `StageId`, `StageElementId`, and
   `StageRenderableId`.
   Authority: STL-449 identity preservation AC and existing authored-ID
   precedent.
2. Add `StageModel`, `StageElement`, `StageRenderable`, `StageRole`,
   `StageRepresentationKind`, and lightweight source/provenance/diagnostic
   structs under `shotloom-core::model`.
   Authority: STL-449 scope and ADR-0049.
3. Persist `ShotModel.stages: im::Vector<StageModel>` and
   `ShotModel.active_stage_id: Option<StageId>` with serde defaults.
   Authority: STL-449, bundle-format canonical owner rule, and legacy-load AC.
4. Keep `StageEnvironment` on `ShotModel` and do not remove, rename, or
   reinterpret its existing fields.
   Authority: ADR-0049 compatibility-path decision.
5. Keep stage-owned content separate from `PropModel`; no stage element should
   be modeled as a `PropModel`.
   Authority: STL-449 AC and ADR-0049.
6. Encode `mesh` only as `StageRepresentationKind::Mesh`, never as a
   `StageRole`.
   Authority: docs/specs/stage-entity-model.md.
7. Do not add `shot_prop` or equivalent to `StageRole`.
   Authority: STL-449 AC.
8. Add validation for internal stage references: duplicate stage IDs, dangling
   `active_stage_id`, duplicate element/renderable IDs inside a stage, and
   dangling element-to-renderable references.
   Authority: identity preservation AC and reviewability.
9. Add focused tests that fail before the implementation and pass after it:
   stage serde round-trip, legacy shot JSON deserialization, shot serde
   preservation, invalid vocabulary rejection, and stage-reference validation.
10. Update durable docs that describe bundle shape or Stage implementation
    status.
    Authority: Shotloom documentation policy.

## Locked Decisions

1. New stage structs live in `crates/shotloom-core/src/model/stage.rs`.
   Rationale: stage data is expected to grow across STL-450 through STL-455,
   and putting it in `entity.rs` would mix stage composition with character and
   prop leaf entities.
   Rejected alternatives: extend `entity.rs`; encode stages only in
   `StageEnvironment`.

2. Stage-family IDs use the existing authored-ID validator.
   Rationale: stage IDs are authored bundle identifiers like character, prop,
   and cine camera IDs, so the same empty-string and colon rejection is the
   least surprising contract.
   Rejected alternatives: opaque UUID-only IDs; free strings with no
   validation.

3. Do not extend `ShotEntityRef` or `ShotEntityId` in this PR.
   Rationale: ADR-0041 positions those as polymorphic bundle references and
   runtime/bridge interchange. STL-449 only needs persisted shot-local stage
   data; commands and bridge references belong to STL-450 and later.
   Rejected alternatives: add a `stage:` namespace now; replace all stage refs
   with `ShotEntityRef`.

4. `ShotModel` gains `stages` and `active_stage_id` immediately before the
   existing `environment` field.
   Rationale: this keeps all stage-related shot data adjacent while preserving
   the legacy environment path.
   Rejected alternatives: replace `environment`; put stages in bundle-level
   catalogs.

5. Provenance stays lightweight and string-based in this PR.
   Rationale: STL-449 AC requires provenance preservation, but source adapters
   and catalog-level asset provenance belong to later issues.
   Rejected alternatives: implement full import provenance graph; omit
   provenance entirely.

6. Stage reference validation is explicit and not run automatically during
   serde deserialization.
   Rationale: Shotloom already separates load compatibility from model
   validators in nearby APIs, and legacy compatibility should not become a
   hard deserialization failure.
   Rejected alternatives: reject invalid stage refs during deserialize; skip
   validation entirely.

## Non-Goals

- No React editor UI or TypeScript bridge command changes.
- No Bevy runtime spawning, ECS ordering, or viewport rendering changes.
- No `StageRequest` or `spawn_background_props` deletion.
- No shared stage catalog or asset pipeline redesign.
- No `PropModel` migration or prop-to-stage conversion.
- No export, review-video, or diagnostic UI integration.
- No broad bundle schema migration beyond serde-defaulted new fields.

## Risk Map

| Risk | Evidence | Plan response | Test proof |
| --- | --- | --- | --- |
| Error source chain | Stage reference validation is internal model validation, not IO/parser wrapping. | Use a typed `StageReferenceError` with no `#[source]`; document that there is intentionally no external source. | Assert `Error::source()` is `None` for a representative validation error. |
| Schema compatibility | `ShotModel` is persisted directly and many legacy shots lack new fields. | Add serde defaults and keep `StageEnvironment`. | Legacy shot JSON without stage fields deserializes with empty `stages` and `None` active stage. |
| Ownership/API boundary | ADR-0049 separates stage model from commands/runtime. | Keep this PR in `shotloom-core::model` plus docs/tests only. | No bridge or engine behavior is required for core tests to pass. |
| Partial mutation/rollback | Directory bundle persistence writes whole shot JSON through existing serde. | Avoid new partial-write paths; rely on existing bundle read/write. | Bundle/shot round-trip preserves stage fields. |
| Diagnostic ownership | Stage diagnostics are persisted annotations, not UI or bridge diagnostics. | Add minimal `StageModelDiagnostic { code, message }`; no severity pipeline. | Serde round-trip preserves diagnostics as data. |
| Test oracle strength | Vocabulary mistakes are easy to miss by visual inspection. | Test enum wire strings and rejection of invalid `shot_prop` role. | serde tests fail if role/representation semantics drift. |
| Scope creep | Later STL issues own commands, runtime, editor, and import behavior. | Explicit non-goals and module boundaries. | Diff remains core model/docs focused. |
| Reviewer objection | Adding element/renderable IDs is not named in the Linear title. | Treat them as necessary primitives for identity preservation. | Round-trip tests assert element/renderable IDs survive. |

## Implementation Spec

### Stage 0: Baseline Re-Check

- Re-read `STL-449`, the briefing, `ShotModel`, authored ID definitions, and
  stage docs before editing.
- Confirm worktree branch is clean except intended changes.
- Requirement coverage: all.

### Stage 1: Add Stage Model Primitives

- Add `crates/shotloom-core/src/model/stage.rs`.
- Define `StageRole` with only `Shell`, `Structure`, `Fixture`,
  `SetDressing`, `Zone`, `Proxy`, and `Anchor`.
- Define `StageRepresentationKind` with `Mesh`, `GaussianSplat`, `Panorama`,
  `Cubemap`, `Void`, `CollisionProxy`, and `NavHint`.
- Define `StageModel`, `StageElement`, `StageRenderable`,
  `StageSourceRef`, `StageProvenance`, and `StageModelDiagnostic`.
- Use `ModelTransform` for stage and element/renderable transforms.
- Use `im::Vector` for persisted collections and serde defaults for optional
  or append-only collections.
- Requirement coverage: 1, 2, 5, 6, 7.

### Stage 2: Attach Stages to ShotModel

- Add `StageId`, `StageElementId`, and `StageRenderableId` to authored IDs.
- Export new IDs and stage structs from `model/mod.rs`.
- Add `stages` and `active_stage_id` to `ShotModel` with serde defaults.
- Update existing Rust struct literals with empty/default stage fields.
- Requirement coverage: 1, 3, 4.

### Stage 3: Add Reference Validation

- Add `StageReferenceError` and `ShotModel::validate_stage_refs()`.
- Validate duplicate stage IDs, dangling active stage, duplicate element IDs,
  duplicate renderable IDs, and missing renderable refs.
- Keep validation explicit.
- Requirement coverage: 8.

### Stage 4: Tests

- Add core model tests for stage enum wire strings, invalid role rejection,
  StageModel serde round-trip, legacy shot JSON compatibility, shot round-trip
  preservation, and stage-reference validation errors.
- Run `cargo test -p shotloom-core --lib`.
- Requirement coverage: 9.

### Stage 5: Docs

- Update `docs/specs/bundle-format.md` to describe `ShotModel.stages` and
  `active_stage_id` while preserving `StageEnvironment`.
- Update `docs/specs/stage-entity-model.md` implementation status to show
  core persistence is implemented while commands/runtime/editor remain
  follow-ups.
- Requirement coverage: 10.

## Verification

- `cargo test -p shotloom-core --lib`
- For schema compatibility, deserialize a shot JSON fixture that omits
  `duration_frames`, `stages`, and `active_stage_id`.
- For round-trip proof, serialize and deserialize a `ShotModel` containing one
  stage, one element, one renderable, provenance, and a diagnostic.
- For validation proof, call `validate_stage_refs()` on a dangling
  `active_stage_id` and assert the typed error plus `Error::source() == None`.

## Traps

- Do not model `mesh` as a role; it is a representation kind.
- Do not add `shot_prop` to stage roles to make prop reuse convenient.
- Do not delete `StageEnvironment`; existing bundles and runtime paths still
  depend on it.
- Do not turn this PR into a command/runtime/editor implementation.

## Follow-Up Candidates

- STL-450: Stage create/update/delete commands and bridge DTOs.
- STL-451: Runtime/viewport stage instantiation.
- STL-452: Editor UI for stage authoring.
- STL-453: Stage import/source integration.
- STL-454: Export/review handling for stage-owned content.
- STL-455: Deeper diagnostics and tooling once the full flow exists.
