---
status: proposed
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-450
repo: shotloom
linear: STL-450
briefing: ../../briefings/shotloom/core-stage-renderable-provenance.md
---

# Core Stage Renderable Provenance

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/core-stage-renderable-provenance.md`
  seeds the STL-450 scope as a mixed Shotloom core-model, stage-map evidence,
  and durable-doc alignment task.
- Current truth: `StageRenderable` persists representation kind and asset id,
  while source provenance currently lives only on `StageElement.source` and
  `StageModel.provenance`.
- Required change: add a typed, round-trippable provenance and hint boundary
  for Stage renderables and asset metadata without promoting metadata hints to
  final Stage semantics.
- Locked boundary: this PR defines the core persistence and validation surface
  only; full stage-map import, runtime hydration, bridge commands, editor UI,
  and background prop replacement remain follow-up work.
- Proof method: focused `shotloom-core` serde/validation tests, helper tests for
  metadata hint extraction and unknown source categories, plus doc updates that
  keep ADR-0050 and the bundle format aligned.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage core model | `crates/shotloom-core/src/model/stage.rs::StageModel` | Partial | Stage persists `elements`, `renderables`, `tags`, `provenance`, and diagnostics. |
| Element source provenance | `crates/shotloom-core/src/model/stage.rs::StageElement::source` and `StageSourceRef` | Partial | Element provenance stores `source_system`, `source_document_id`, `source_object_id`, `source_category`, and `role_hint`; it has no `representation_hint`. |
| Renderable asset binding | `crates/shotloom-core/src/model/stage.rs::StageRenderable` | Partial | Renderable persists `kind`, `asset_id`, `local_transform`, and `options`; it has no provenance field. |
| Asset kind vocabulary | `crates/shotloom-core/src/model/asset.rs::AssetKind` | Missing | `StageTemplate` exists, but there is no `StageRenderable` / `stage_renderable` asset kind for concrete renderable asset bindings. |
| Asset catalog metadata | `crates/shotloom-core/src/model/asset.rs::AssetRecord::metadata` and `AssetCatalogEntry::metadata` | Partial | Metadata is a free-form `serde_json::Map`; no typed Stage hint extraction exists. |
| Stage reference validation | `crates/shotloom-core/src/model/validate.rs::StageReferenceError` and `ShotModel::validate_stage_refs` | Partial | Validation catches duplicate Stage ids, duplicate element/renderable ids, and missing renderable refs, but does not validate renderable asset references or hint semantics. |
| Stage entity spec | `docs/specs/stage-entity-model.md` | Already Done | States asset metadata can carry role/representation/source hints, but Stage owns final semantics. |
| Bundle format spec | `docs/specs/bundle-format.md` §`stages` and §14.2 | Partial | Documents Stage fields by reference and states metadata must not replace first-class behavior. It does not yet name the new renderable provenance/hint fields. |
| Stage-map source contract | `contracts/stage-map/stage-map-document.schema.json` and `crates/shotloom-stage/src/map_document.rs` | Already Done for evidence, Missing for conversion | Stage-map parser exposes source system, document id, object id, object type, candidates, and diagnostics. It does not create StageModel provenance. |
| Related upstream decision | `docs/adr/adr-0050-stage-entity-model.md` | Already Done | Locks Stage as semantic owner; source categories remain provenance, not product-facing role names. |
| Contract authority | `docs/adr/adr-0051-contract-authority-tiers.md` and `contracts/stage-map/README.md` | Already Done | StageModel shape is repository-internal code/test-owned; stage-map schema is a local POC input contract. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-450` |
| State | In Progress |
| Owner | deemo |
| Goal | Connect Stage renderable asset/provenance shape and typed asset metadata hints to the core model without making source metadata authoritative. |
| Acceptance criteria | Renderable round-trips asset id, representation kind, and source provenance; asset metadata hints stay hints; source category/document/object id are preserved; unknown category remains provenance/diagnostic; `cargo test -p shotloom-core --lib` passes. |
| Latest relevant comment | N/A |
| Blockers / dependencies | `STL-449` is Done; `STL-450` blocks `STL-452`, `STL-453`, and `STL-455`. |
| Related PRs | `STL-449` landed through PR #358. |
| Current review state | No active PR for STL-450. |
| Planning consequence | Keep this PR to core persistence, typed hint extraction, validation, and docs so later import/runtime/UI issues can build on a stable model. |

## Problem

STL-449 added the shot-local Stage model, but STL-450 still has a narrow core
gap: `StageRenderable` can bind an asset and representation kind, yet it cannot
record the source evidence or representation hint that led to that binding.
At the same time, the asset catalog can store arbitrary metadata, but no typed
helper says which keys are only hints and how those hints flow into Stage
provenance.

Without this boundary, a future stage-map import path can accidentally treat a
StoryPreviz / MiniCineV source category or asset metadata field as the final
Stage role. That would violate ADR-0050: Stage owns final semantic meaning;
asset metadata and source categories are provenance and hints.

## Requirements

1. Extend the core Stage provenance model so a renderable can persist source
   provenance independently from its owning element.
   - Trace: STL-450 AC1 and AC3.
   - Implementation stage: S1.
   - Verification: V1, V2.
2. Add `representation_hint` to the shared source/provenance hint shape so
   role hints and representation hints are distinct.
   - Trace: STL-450 AC2 and briefing P2 seed.
   - Implementation stage: S1.
   - Verification: V1, V3.
3. Add typed asset metadata hint extraction for the Stage import/model boundary.
   The helper must read known Stage hint keys from the existing free-form
   `AssetRecord.metadata` / `AssetCatalogEntry.metadata` map without changing
   the persisted asset catalog shape.
   - Trace: STL-450 AC2, ADR-0050, `docs/specs/bundle-format.md` §14.2.
   - Implementation stage: S2.
   - Verification: V3.
4. Add a dedicated `AssetKind::StageRenderable` serialized as
   `stage_renderable` for concrete assets that Stage renderables can bind.
   `StageTemplate` remains reserved for reusable Stage source/defaults, not
   direct renderable bindings.
   - Trace: STL-450 current-state note that `StageTemplate` exists but no
     stage-renderable asset kind exists.
   - Implementation stage: S2.
   - Verification: V3, V5.
5. Preserve source category, source document id, source object id, source
   system, role hint, and representation hint as provenance/hint fields when
   constructing Stage model values in tests and future conversion helpers.
   - Trace: STL-450 AC3, `docs/specs/stage-entity-model.md` import rule.
   - Implementation stage: S2.
   - Verification: V2, V3.
6. Unknown source categories must not deserialize or map into a new `StageRole`
   variant. They remain string provenance and must be paired with a persisted
   Stage diagnostic when a conversion cannot confidently choose a final role.
   - Trace: STL-450 AC4, `docs/specs/stage-entity-model.md` source alignment
     row for `unknown`.
   - Implementation stage: S3.
   - Verification: V4.
7. Stage validation must prove renderable asset references are structurally
   safe enough for the core model layer: if a renderable names an asset id and
   the caller has a bundle-level asset catalog, validation rejects references
   that cannot be found or that point at an asset kind other than
   `stage_renderable`.
   - Trace: STL-450 AC1, ADR-0005 product-owned bundle schema.
   - Implementation stage: S3.
   - Verification: V5.
8. Docs must explain the new model fields without turning the stage-map POC
   schema into the canonical owner for StageModel.
   - Trace: ADR-0051 and `contracts/stage-map/README.md`.
   - Implementation stage: S4.
   - Verification: V6.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | Planned new failures are internal validation enum variants; no external `io::Error` / `serde_json::Error` is wrapped in the core changes. | Do not introduce `String`-flattened wrappers for external errors; if asset metadata parsing later wraps serde errors, that belongs to the importing crate and must preserve `#[source]`. | V5 validates internal no-source errors through equality/diagnostics; source-chain proof is N/A for this PR. |
| Schema / serialization compatibility | yes | `StageSourceRef` and `StageRenderable` are serde types under `ShotModel.stages`; `AssetKind` is a persisted enum. | New optional fields must use `#[serde(default, skip_serializing_if = "Option::is_none")]`; `AssetKind::StageRenderable` is an additive enum value documented as a new writer capability. | V1 round-trips populated values and deserializes an older Stage JSON without them; V3 covers `stage_renderable` enum serde. |
| Ownership / API boundary | yes | ADR-0050 makes Stage semantic owner; ADR-0051 makes core model code/tests the canonical owner for repository-internal StageModel shape. | Keep final role as `StageElement.role`; keep metadata extraction as hint-only helper; do not add bridge/runtime/UI behavior. | V3 asserts metadata hints do not mutate `StageRole`; V6 validates docs state authority correctly. |
| Partial mutation / rollback | yes | `StageRenderable.asset_id` references `AssetCatalog`; `AssetCatalog::insert` can fail on invalid or duplicate ids, and validation can fail on unsupported asset kind. | Any helper that builds Stage values from candidate assets must prevalidate asset ids and kinds before returning a mutated Stage, or return a complete value without mutating existing state. | V5 failure-path tests prove missing or wrong-kind asset rejection leaves the existing model unchanged or uses immutable candidate construction. |
| Diagnostic ownership | yes | `StageModelDiagnostic` persists code/message; stage-map parser also emits `Diagnostic` with `stage_map_document` source. | Core StageModel diagnostics own persisted Stage provenance warnings only; stage-map parser diagnostics remain parser-owned. | V4 asserts unknown source category emits/persists a Stage diagnostic code distinct from stage-map parser codes. |
| Test oracle strength | yes | Existing `stage_model_round_trips` covers only element source and renderable asset id, not renderable provenance or metadata hint extraction. | Add tests that fail before the new fields/helpers exist. | V1-V5 each names a before/after assertion. |
| Scope creep | yes | STL-450 affected paths mention stage-map and docs, while follow-up issues own import, hydration, and UI. | Non-Goals exclude bridge commands, editor UI, runtime hydration, and full stage-map-to-StageModel import. | V6 doc review and PR scope check; no files under bridge/editor/engine should change except docs if needed. |
| Reviewer objection | yes | Likely objection: "Why add renderable provenance when element already has source?" | Locked Decision 1 defines split ownership: element source explains semantic object origin; renderable source explains asset/representation binding origin. | V2 constructs one element with two renderables from distinct asset/source evidence. |

## Locked Decisions

1. Renderable provenance is a separate optional field on `StageRenderable`.
   Rationale: an element can represent a semantic object while individual
   renderables can come from different assets, fallback candidates, or
   representation choices. Element source answers "what source object is this";
   renderable source answers "what source evidence produced this binding."
   Rejected alternatives: storing all provenance only on `StageElement.source`
   loses per-renderable asset/candidate evidence; storing all provenance only on
   `StageModel.provenance` loses object-level traceability.

2. `StageSourceRef` remains a string-based provenance shape, with
   `representation_hint` added as an optional hint.
   Rationale: source-system categories are upstream vocabulary and must survive
   unknown values. A closed enum would reject valid future upstream categories
   or encourage forced role mapping.
   Rejected alternatives: adding a closed `SourceCategory` enum, or adding
   `Unknown` to `StageRole`.

3. Asset metadata hint extraction is typed at the helper boundary, not by
   replacing `AssetRecord.metadata`.
   Rationale: `metadata` remains the bundle's future-compatible extension map,
   while typed helpers provide a reviewable set of Stage hint keys.
   Rejected alternatives: changing the persisted asset catalog schema for this
   PR, or continuing to parse metadata ad hoc at future import call sites.

4. Known metadata keys for this PR are:
   `source_system`, `source_document_id`, `source_object_id`,
   `source_category`, `role_hint`, and `representation_hint`.
   Rationale: these names match the Stage source/provenance vocabulary and keep
   role and representation hints distinct.
   Rejected alternatives: `asset_role`, `asset_representation`, `stage_prop`,
   or source-specific key names that make the core model depend on one upstream
   producer.

5. `AssetKind::StageRenderable` is the only direct asset kind for
   `StageRenderable.asset_id`.
   Rationale: `StageTemplate` represents reusable Stage sources/defaults,
   while `StageRenderable` binds a concrete mesh/splat/panorama/cubemap-like
   asset into one shot-local Stage. Keeping those asset kinds separate prevents
   template provenance from being confused with runtime representation binding.
   Rejected alternatives: reusing `StageTemplate` for direct renderable assets,
   reusing `Prop` for stage-owned environment assets, or leaving the kind
   unconstrained until runtime hydration.

6. Unknown source categories remain provenance plus a Stage diagnostic; they do
   not imply a final role.
   Rationale: ADR-0050 says source categories remain provenance, and the Stage
   model owns final semantics.
   Rejected alternatives: mapping unknown to `set_dressing`, mapping unknown to
   `proxy`, or adding a catch-all role variant.

7. Any future operation that updates asset catalog entries and Stage renderable
   references together must prevalidate all asset ids and asset kinds before
   mutating persistent model state.
   Rationale: Stage renderables and the catalog are coupled representations of
   one authored asset binding. Partial persistence could leave a Stage pointing
   at a missing asset or catalog entry that no Stage references.
   Rejected alternatives: best-effort insert-then-fixup, or relying on later
   runtime hydration to discover mismatches.

8. No bridge, editor, runtime, or full stage-map import behavior changes land in
   this PR.
   Rationale: `STL-451`, `STL-452`, `STL-453`, and `STL-454` own those layers.
   Rejected alternatives: wiring the new model directly into debug import,
   stage hydration, or editor UI in this PR.

## Non-Goals

- Do not add or modify bridge commands, bridge events, or TypeScript bridge
  DTOs.
- Do not implement `crates/shotloom-stage` map document to `StageModel`
  conversion; that belongs to `STL-453`.
- Do not hydrate Stage renderables into Bevy entities; that belongs to
  `STL-452`.
- Do not add editor outliner/inspector/edit-mode UI; that belongs to
  `STL-454`.
- Do not remove or rename `StageEnvironment`, `spawn_background_props`, or
  `clear_background_props`.
- Do not promote stage-owned content into `PropModel`.
- Do not add a new ADR; ADR-0050 already owns the decision.
- Do not make `contracts/stage-map` the authority for StageModel shape.

## Implementation Spec

### S0 — Baseline re-check

- Re-run `rg` for `StageRenderable`, `StageSourceRef`, `AssetRecord.metadata`,
  and `StageReferenceError` in the worktree before editing.
- Confirm no sibling PR has already added renderable provenance or asset hint
  helpers.
- Run or at least compile-target `cargo test -p shotloom-core --lib` if the
  local environment is already warm; otherwise run it after S1.
- Satisfies risk rows: Test oracle strength, Scope creep.

### S1 — Persist renderable provenance and representation hints

- Add `source: Option<StageSourceRef>` to `StageRenderable` with serde default
  and omission when `None`.
- Add `representation_hint: Option<String>` to `StageSourceRef` with serde
  default and omission when `None`.
- Update `stage_model_round_trips` or add a focused test that proves:
  - element source and renderable source can both be present,
  - `role_hint` and `representation_hint` round-trip independently,
  - older JSON without these fields still deserializes.
- Satisfies requirements: R1, R2.
- Satisfies risk rows: Schema / serialization compatibility, Reviewer objection.

### S2 — Add typed asset metadata hint extraction

- Add `AssetKind::StageRenderable` with `snake_case` serialization as
  `stage_renderable`.
- Add a small typed helper in `crates/shotloom-core/src/model/asset.rs` or a
  clearly named sibling module that reads known Stage hint keys from
  `AssetRecord.metadata` / `AssetCatalogEntry.metadata`.
- The helper returns a value that can be converted into `StageSourceRef` or used
  to populate its fields without changing `AssetRecord` serialization.
- Ignore absent or non-string known keys instead of panicking. If the helper
  needs to report malformed known keys, return structured internal validation
  data rather than flattening parse failures into strings.
- Add tests showing:
  - `AssetKind::StageRenderable` serializes as `stage_renderable`,
  - all six known keys are extracted when present as strings,
  - unrelated metadata is preserved in the original map,
  - role hints and representation hints remain distinct,
  - extracted hints do not assign a `StageRole`.
- Satisfies requirements: R3, R4, R5.
- Satisfies risk rows: Ownership / API boundary, Test oracle strength.

### S3 — Validate asset references and unknown category diagnostics

- Extend Stage reference validation at the bundle/shot validation layer so a
  renderable `asset_id` can be checked against the bundle asset catalog when
  catalog context is available.
- Add a `StageReferenceError` variant for missing renderable asset references
  and wrong-kind renderable asset references, or a narrowly named sibling
  validation error if that better fits existing validation layering.
- Ensure diagnostic projection uses the existing `stage_reference` diagnostic
  family unless a more specific code is already established in live code.
- Add a helper or test fixture for unknown source categories that:
  - preserves the raw `source_category`,
  - does not create a new `StageRole`,
  - records a `StageModelDiagnostic` with a stable snake_case code such as
    `unknown_stage_source_category`.
- Satisfies requirements: R6, R7.
- Satisfies risk rows: Partial mutation / rollback, Diagnostic ownership.

### S4 — Align durable docs

- Update `docs/specs/stage-entity-model.md` Asset Catalog Policy to name the
  known hint keys and the renderable provenance split.
- Update `docs/specs/bundle-format.md` `stages` section to mention optional
  renderable source provenance and `representation_hint`, while keeping field
  definitions delegated to code.
- Update `contracts/stage-map/README.md` only if needed to clarify authority:
  stage-map remains local POC input, not the StageModel canonical owner.
- Do not duplicate complete Rust field lists in prose.
- Satisfies requirement: R8.
- Satisfies risk rows: Scope creep, Ownership / API boundary.

## Acceptance Criteria

- [ ] `StageRenderable` can round-trip `asset_id`, `kind`, and optional source
      provenance.
- [ ] `StageSourceRef` can round-trip distinct `role_hint` and
      `representation_hint`.
- [ ] Typed asset metadata hint extraction reads the known Stage hint keys from
      free-form metadata without changing the asset catalog wire shape.
- [ ] `AssetKind::StageRenderable` serializes as `stage_renderable` and is the
      allowed direct asset kind for Stage renderable bindings.
- [ ] Asset metadata hints do not assign or override `StageElement.role`.
- [ ] Source system, source document id, source object id, source category, role
      hint, and representation hint are preserved in Stage model tests.
- [ ] Unknown source category remains raw provenance and produces a persisted
      Stage diagnostic instead of a forced role conversion.
- [ ] Missing or wrong-kind renderable asset references are rejected when
      validating with a bundle asset catalog.
- [ ] Durable docs describe the new boundary and keep stage-map authority
      separate from StageModel authority.

## Verification

| ID | Gate | Purpose |
|---|---|---|
| V1 | `cargo test -p shotloom-core --lib stage_model_round_trips` or focused Stage serde test | Proves new optional fields serialize and deserialize without breaking older JSON. |
| V2 | Focused test with one element and multiple renderables | Proves element provenance and renderable provenance are independent. |
| V3 | Focused asset metadata hint extraction and asset-kind serde tests | Proves `stage_renderable` serde, known keys are extracted as hints, unrelated metadata stays untouched, and hints do not set final role. |
| V4 | Focused unknown source category test | Proves unknown category is preserved and diagnostic is recorded without adding a role variant. |
| V5 | Bundle/core validation test for missing and wrong-kind renderable asset id | Proves catalog-stage coupling rejects missing or unsupported-kind references and reports useful related ids/diagnostics. |
| V6 | `node scripts/validate-doc-paths.mjs` | Proves durable doc links remain valid after spec updates. |
| V7 | `cargo test -p shotloom-core --lib` | Required Linear gate for the core model changes. |

Manual repro:
- `unknown_stage_source_category`: create a Stage test fixture with
  `source_category: "unknown"` and no final role mapping; verify the raw
  category persists and the diagnostic remains attached to the Stage model.
- `stage_reference`: create a bundle/shot where a Stage renderable references a
  missing asset id or a non-`stage_renderable` asset; verify validation reports
  the bad reference rather than allowing runtime hydration to fail later.

Broad pre-PR gates after implementation:
- `cargo fmt --check`
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
- `cargo check --workspace --exclude shotloom-desktop`
- `cargo test --workspace --exclude shotloom-desktop`
- `node scripts/validate-doc-paths.mjs`

## Traps

- Do not add `Unknown` or `ShotProp` to `StageRole`; unknown source categories
  are provenance and diagnostics, not final roles.
- Do not parse `AssetRecord.metadata` ad hoc in later import code; this PR must
  leave a typed helper boundary.
- Do not treat `contracts/stage-map` schema fields as StageModel source of
  truth; source code and core tests own repository-internal StageModel shape.
- Do not serialize new optional fields as `null`; omit them when absent.
- Do not update `AssetCatalog` first and then fail while updating Stage
  renderables; prevalidate coupled catalog/stage changes before mutation.
- Do not sneak in bridge/editor/runtime changes to demonstrate the model. The
  proof is core serde/validation plus docs.

## Follow-Up Candidates

- `STL-453`: implement stage-map document to StageModel import conversion using
  the typed provenance and hint boundary.
- `STL-452`: hydrate StageModel renderables into runtime Stage entities.
- `STL-451`: expose Stage authoring command/DTO contract over the bridge.
- `STL-454`: display Stage provenance, role, and representation in editor
  outliner/inspector UI.
- `STL-455`: add vertical regression coverage across save/load, import,
  hydration, promotion, and reimport once implementation layers exist.
