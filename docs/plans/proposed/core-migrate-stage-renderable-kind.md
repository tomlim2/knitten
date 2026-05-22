---
status: proposed
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: STL-475
repo: shotloom
linear: STL-475
briefing: ../../briefings/shotloom/core-migrate-stage-renderable-kind.md
---

# Stage Renderable Asset Kind Criteria

## Spec Contract

- Briefing basis: `../../briefings/shotloom/core-migrate-stage-renderable-kind.md`
  defines STL-475 as a docs/core criteria task, not a migration or runtime
  implementation task.
- Current truth: `StageRenderable.asset_id` is already validated against
  manifest assets of kind `stage_renderable`; asset metadata and Stage source
  fields are provenance/hints, not final semantics.
- Required change: document how S2M/map provenance should inform manifest
  `AssetKind` decisions, compare character/prop/StageRenderable expectations,
  and record the current wrong-kind handling direction.
- Locked boundary: do not change bridge DTOs, runtime hydration, import API
  wiring, bundle migration, repair UI, or automatic PropModel promotion in this
  task.
- Proof method: source-backed documentation update plus a focused regression
  test candidate table; implementation PR should prove no code behavior changed
  unless a follow-up issue explicitly expands scope.
- One-PR suitability: yes; this is a single docs criteria PR with optional
  minimal test-candidate documentation, not a behavior change.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Asset kind vocabulary | `crates/shotloom-core/src/model/asset.rs::AssetKind` | Already Done | Includes `Character`, `Prop`, `StageTemplate`, and `StageRenderable`; `StageRenderable::as_str()` returns `stage_renderable`. |
| Stage renderable binding | `crates/shotloom-core/src/model/stage.rs::StageRenderable::asset_id` | Already Done | Optional string binding from a renderable to a manifest asset. |
| Bundle-level Stage asset check | `crates/shotloom-core/src/model/shot.rs::validate_stage_refs_with_assets` | Already Done | When catalog context exists, missing assets reject as `MissingRenderableAsset`; non-`StageRenderable` assets reject as `UnsupportedRenderableAssetKind`. |
| Validation diagnostics | `crates/shotloom-core/src/model/validate.rs::StageReferenceError` | Already Done | Wrong-kind message states expected `stage_renderable`; related IDs include stage/renderable/asset attribution. |
| Bundle validation tests | `crates/shotloom-core/src/model/bundle.rs` tests | Already Done | Tests accept `AssetKind::StageRenderable` and reject missing/wrong-kind Stage renderable assets. |
| Character asset usage | `crates/shotloom-core/src/model/entity.rs::CharacterModel::asset_id` | Partial | Character instances reference an asset id; bundle directory IO checks referenced asset records/files, and character asset removal requires `AssetKind::Character`. |
| Prop asset usage | `crates/shotloom-core/src/model/entity.rs::PropModel::asset_id` | Partial | Prop instances reference an asset id; directory bundle IO includes prop asset ids in referenced asset checks, but there is no equivalent Stage-style kind expectation table in docs. |
| Asset catalog policy | `docs/specs/stage-entity-model.md` Asset Catalog Policy | Partial | Metadata keys such as `source_category`, `role_hint`, and `representation_hint` are hints/provenance only. |
| Stage import rule | `docs/specs/stage-entity-model.md` Import rule / Example Mapping | Partial | Source evidence maps to Stage role/representation examples and says Stage chooses the final role. It does not state the manifest `AssetKind` decision rule. |
| Bundle format Stage refs | `docs/specs/bundle-format.md` §17 rule 4 | Already Done | Stage renderable `asset_id` points at a manifest asset with kind `stage_renderable`; `BundleModel::validate_stage_refs` is source of truth. |
| Parent umbrella | Linear `STL-457` | Already Done / Context | Stage implementation umbrella separates core, asset/provenance, bridge, runtime/import/editor, and regression closure phases. |
| Direct predecessor | `docs/plans/proposed/core-stage-renderable-provenance.md` | Already Done / Sibling | STL-450 introduced `StageRenderable` provenance and `AssetKind::StageRenderable`; this task documents criteria on top of that state. |

## Sibling Specs

| Spec | Status | Stance | Use in this spec |
|---|---|---|---|
| `core-stage-renderable-provenance.md` | proposed | Adds `StageRenderable` provenance, `AssetKind::StageRenderable`, and validation that renderable assets use `stage_renderable`. | Adopt as direct predecessor; STL-475 documents criteria now that the core primitive exists. |
| `adr-record-stage-entity-model.md` | proposed | Stage is a shot-local authored environment; Stage/Prop/Asset boundaries stay distinct. | Adopt the boundary: Stage-owned renderables are not shot-owned `PropModel` entries unless explicitly promoted. |
| `stage-validation-matrix.md` | proposed | Stage reference validation and Stage content validation are separate axes. | Adopt the distinction: wrong-kind renderable assets are reference validation, while tag/options policy stays out of this task. |
| Deleted sibling specs | none found | No deleted overlap found for STL-475 / renderable asset kind. | No disagreement to resolve. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-475` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Clarify Stage renderable asset-kind criteria and how S2M/map provenance should guide manifest `AssetKind` decisions. |
| Acceptance criteria | Document Stage renderable asset-kind criteria; describe S2M/map provenance vs `AssetKind`; document wrong-kind direction; compare character/prop/StageRenderable expectations; split follow-up implementation if needed. |
| Latest relevant comment | User clarified to avoid overcommitted "team lead must decide" language and write what this task will organize. |
| Blockers / dependencies | Parent `STL-457`; related predecessor `STL-450`. |
| Related PRs | N/A for STL-475. |
| Current review state | No PR yet. |
| Planning consequence | Keep the PR as a policy/doc criteria change unless review identifies a required minimal test-only proof. |

## Problem

Shotloom now has a canonical Stage renderable asset kind, but the durable docs
do not yet explain how import-adjacent evidence should choose that kind.
S2M/map inputs may say that an object is a fixture, prop-like furniture,
background shell, source category, or renderable candidate. File names alone
are not reliable, and source categories are not final Shotloom semantics.

Without a criteria doc, future import work can drift in two directions:

- use upstream source categories or local file names as if they were manifest
  `AssetKind`, or
- treat `prop`, `stage_template`, and `stage_renderable` as interchangeable
  because they may all point at GLB-like bytes.

STL-475 should make the current policy legible before the next import/runtime
work: `AssetKind` describes the Shotloom consumer/boundary, while provenance
describes where the evidence came from.

## Options Considered

| Option | Description | Result |
|---|---|---|
| Keep only current code/tests | Rely on `validate_stage_refs_with_assets` and existing tests to teach the rule. | Rejected. Reviewers and import implementers still need criteria for S2M/map provenance and consumer comparison. |
| Add migration/repair behavior now | Convert wrong-kind `stage_template`/`prop` references or warn-and-skip at load/runtime. | Rejected. Linear non-goals exclude migration, repair UI, and runtime changes; ADR-0054 rejects silent load repair. |
| Document consumer-based kind criteria | State that `AssetKind` follows the Shotloom consumer boundary, not file extension or source label; record wrong-kind handling and follow-up candidates. | Selected. This satisfies STL-475 without expanding implementation scope. |

## Requirements

1. Document that `stage_renderable` is the canonical manifest kind for assets
   directly referenced by `StageRenderable.asset_id`.
   - Trace: STL-475 AC1; `docs/specs/bundle-format.md` §17 rule 4.
   - Stage: S1.
   - Verification: V1, V2.
2. Document that S2M/map `source_category`, `role_hint`, and
   `representation_hint` are provenance/hints used to choose Stage role,
   representation, and asset binding, but they do not directly equal
   `AssetKind`.
   - Trace: STL-475 AC2; ADR-0050; Stage Entity Model Asset Catalog Policy.
   - Stage: S1.
   - Verification: V1.
3. Add a consumer expectation table for character, prop, and StageRenderable
   asset references.
   - Trace: STL-475 AC4; `CharacterModel`, `PropModel`, `StageRenderable`.
   - Stage: S2.
   - Verification: V1, V3.
4. Record the current wrong-kind handling: persisted Stage renderable asset
   refs fail bundle validation as `UnsupportedRenderableAssetKind`; runtime
   warning/skip behavior is not current policy.
   - Trace: STL-475 AC3; `StageReferenceError`; ADR-0054.
   - Stage: S2.
   - Verification: V2.
5. State that GLB-like bytes can still have different Shotloom consumer kinds.
   For Stage-owned environment renderables, the consumer kind is
   `stage_renderable`; for shot-owned editable props, it is `prop`; for
   reusable Stage defaults/templates, it is `stage_template`.
   - Trace: user clarification about background GLBs and external asset sets;
     ADR-0050 Stage/Prop/Asset boundary.
   - Stage: S1, S2.
   - Verification: V1, V3.
6. List minimal regression-test candidates without implementing them in this
   docs-only criteria task unless review requires a tiny existing-test update.
   - Trace: STL-475 AC5 and issue scope.
   - Stage: S3.
   - Verification: V3, V4.
7. Keep follow-up implementation candidates separate from the STL-475 PR.
   - Trace: STL-475 non-goals.
   - Stage: S3.
   - Verification: V4.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This task is documentation/policy criteria; no Rust error enum or external error wrapping is planned. | Do not add error types. If implementation expands, route through a follow-up spec. | N/A: no error source changes. |
| Schema / serialization compatibility | yes | `AssetKind` and `StageRenderable.asset_id` are persisted model surfaces. | Document existing behavior only; do not add enum variants or serde fields. | `git diff` should show docs/spec only unless review requires test candidate proof. |
| Ownership / API boundary | yes | ADR-0050 says Stage owns semantics; assets own bytes/URI/metadata; source categories remain provenance. | State consumer-based kind criteria and keep Stage/Prop boundaries distinct. | V1 docs readback against ADR-0050 and Stage Entity Model. |
| Partial mutation / rollback | no | No model mutation or command handler is planned. | Explicitly keep migration/repair/runtime mutation out of scope. | N/A: docs-only task. |
| Diagnostic ownership | yes | `StageReferenceError::UnsupportedRenderableAssetKind` currently owns wrong-kind Stage renderable refs. | Document current load-validation failure and avoid inventing runtime diagnostics in STL-475. | V2 confirms docs cite the existing error source. |
| Local absolute path exposure | no | Planned docs use repo paths and issue ids only; no asset manifest examples with local paths. | Do not add `/Users`, `Downloads`, `Desktop`, or machine checkout roots. | V4 `rg` proof before PR. |
| Manifest path containment | no | No URI resolver or manifest path field changes. | Keep path containment out of scope. | N/A. |
| Asset/data pack lifecycle | no | No binary assets or LFS pointers planned. | Keep external S2M asset preparation and GLB copy work out of scope. | N/A. |
| Validation context downgrade | yes | `ShotModel::validate_stage_refs` skips catalog kind checks; `validate_stage_refs_with_assets` performs them. | Document bundle/catalog context as required for kind validation and avoid implying shot-local validation can check manifest kind. | V2 readback names the context-aware validator. |
| Field-set drift | yes | Metadata hint keys are listed in docs and code docs. | Reuse the existing six keys and point to Asset Catalog Policy; avoid inventing a second key set. | V1 checks the doc list matches `stage-entity-model.md`. |
| Test oracle strength | yes | A docs-only PR can pass while failing to guide implementers. | Add a regression candidate table with exact candidate tests and expected failure/passing behavior. | V3 readback of candidate table. |
| Scope creep | yes | Adjacent work includes migration, repair UI, runtime hydration, bridge DTOs, S2M API, and PropModel promotion. | Non-goals and follow-up candidates fence those explicitly. | V4 diff/path check and Non-Goals readback. |
| Reviewer objection | yes | Likely objection: "Why not warn and skip wrong-kind Stage renderables?" | Pre-answer with current validation and ADR-0054; warning/skip is a separate policy change. | V2 wrong-kind handling section cites current code and follow-up boundary. |

## Locked Decisions

1. **`AssetKind` is a Shotloom consumer-boundary classification, not a file
   extension or upstream category.**

   Rationale: GLB-like bytes can feed characters, shot props, Stage renderables,
   or templates. The manifest kind tells Shotloom which consumer contract may
   use the asset.

   Rejected alternatives: infer kind from `.glb`, source folder, local file
   name, or upstream `source_category` alone.

2. **A direct `StageRenderable.asset_id` must point at `stage_renderable`.**

   Rationale: `docs/specs/bundle-format.md` and
   `ShotModel::validate_stage_refs_with_assets` already make this the bundle
   validation rule. STL-475 documents the criteria; it does not relax the
   validator.

   Rejected alternatives: permit `prop` or `stage_template` as equivalent
   direct renderable bindings, or defer kind checking to runtime hydration.

3. **S2M/map provenance informs the decision but does not own it.**

   Rationale: ADR-0050 and the Stage Entity Model make Stage the final semantic
   owner. Source evidence can suggest `set_dressing`, `shell`, `mesh`, or
   provenance fields, but the Shotloom importer chooses the final Stage role,
   representation, and manifest kind.

   Rejected alternatives: one-to-one mapping from S2M `source_category` to
   `AssetKind`, or treating unknown source categories as a new Stage role.

4. **Wrong-kind Stage renderable asset references remain validation failures
   for the current policy.**

   Rationale: the current core error is typed and tested. ADR-0054 rejects
   silent repair for persisted authored Stage content. Warning/skip behavior
   would be a runtime/import policy change, not a docs criteria update.

   Rejected alternatives: silently skip renderables, auto-convert prop/template
   assets on load, or emit only a non-blocking diagnostic without a separate
   policy issue.

5. **This task records regression-test candidates, not new runtime/import
   implementation.**

   Rationale: Linear asks to make follow-up implementation separable and names
   bridge/runtime/migration/API work as non-goals.

   Rejected alternatives: implement import classification, add bridge DTOs, or
   modify runtime hydration in the STL-475 PR.

## Non-Goals

- No bundle migration tool.
- No editor repair UI.
- No bridge command, event, or DTO change.
- No runtime hydration normal-path change.
- No automatic Stage content to `PropModel` promotion.
- No external S2M API integration.
- No asset pack, binary fixture, or LFS/data-pack change.
- No change to `AssetKind` enum values.
- No change to `StageReferenceError` behavior.
- No change to directory bundle asset path containment.

## Design Plan

### S0 - Baseline Re-check

Requirement trace: R1, R2, R4.
Verification trace: V1, V2.

Input:
- `docs/briefings/shotloom/core-migrate-stage-renderable-kind.md`
- `crates/shotloom-core/src/model/asset.rs::AssetKind`
- `crates/shotloom-core/src/model/shot.rs::validate_stage_refs_with_assets`
- `docs/specs/bundle-format.md` §17 rule 4

Output:
- Confirmed remaining gap is documentation criteria, not missing core
  validator implementation.

Non-output:
- No Shotloom source edits before the implementation gate.

Failure:
- If a new main commit changes `StageRenderable.asset_id` validation or
  `AssetKind` membership, stop and update this spec before implementation.

Proof:
- `rg` readback for `StageRenderable`, `AssetKind::StageRenderable`, and
  `UnsupportedRenderableAssetKind`.

### S1 - Document Provenance-to-Kind Criteria

Requirement trace: R1, R2, R5.
Verification trace: V1, V3.
Risk trace: Ownership / API boundary, Field-set drift, Scope creep.

Input:
- `docs/specs/stage-entity-model.md` Asset Catalog Policy, Import rule, and
  Example Mapping.
- ADR-0050 Stage/Prop/Asset boundary.

Output:
- A durable section, likely in `docs/specs/stage-entity-model.md`, stating:
  - provenance/hints guide importer decisions;
  - final Stage role/representation/kind decisions are Shotloom-owned;
  - `AssetKind` follows the consumer boundary.

Non-output:
- No source-category enum, no import conversion code, no bridge/event wording.

Failure:
- If documentation cannot state the rule without choosing a new product policy
  beyond Linear, stop and ask before implementation.

Proof:
- V1 docs readback shows the six provenance keys match existing policy and no
  new key vocabulary is introduced.

### S2 - Add Consumer Expectation and Wrong-Kind Handling Docs

Requirement trace: R3, R4, R5.
Verification trace: V2, V3.
Risk trace: Diagnostic ownership, Validation context downgrade, Reviewer objection.

Input:
- `CharacterModel::asset_id`, `PropModel::asset_id`,
  `StageRenderable::asset_id`.
- `BundleModel::remove_character_asset` kind check.
- `validate_stage_refs_with_assets` wrong-kind rejection.
- `docs/specs/bundle-format.md` Stage reference rule.

Output:
- A consumer expectation table comparing:
  - character instance asset refs and `character` assets;
  - shot-owned prop asset refs and `prop` assets;
  - Stage renderable asset refs and `stage_renderable` assets;
  - Stage templates/defaults and `stage_template` assets.
- A wrong-kind section stating current `StageRenderable.asset_id` behavior.

Non-output:
- No claim that every existing character/prop path has identical
  load-time kind validation to Stage renderables unless source evidence proves
  it.

Failure:
- If source review shows character/prop expectations are weaker or enforced at
  different layers, document the enforcement layer instead of forcing parity.

Proof:
- V2 and V3 readback cite exact code/docs for each table row.

### S3 - Record Regression Candidates and Follow-Ups

Requirement trace: R6, R7.
Verification trace: V3, V4.
Risk trace: Test oracle strength, Scope creep.

Input:
- Existing bundle tests for Stage renderable asset kind.
- STL-475 follow-up split AC.
- Non-goals from Linear.

Output:
- A minimal regression-candidate table naming:
  - current already-covered Stage renderable wrong-kind validation;
  - candidate doc/lint readback for provenance key drift;
  - possible future import classification test if an importer creates manifest
    assets from S2M/map evidence;
  - possible future runtime warning/skip test only if policy changes.
- Follow-up candidates only where implementation is outside STL-475.

Non-output:
- No new test file unless implementation review decides the docs need a tiny
  existing-test assertion update.

Failure:
- If a candidate is required to satisfy STL-475 rather than future work, move
  it into Acceptance Criteria before implementation.

Proof:
- V3 candidate table describes failing-before/passing-after behavior for each
  future test.

### S4 - Scope and Privacy Verification

Requirement trace: R7.
Verification trace: V4, V5.
Risk trace: Local absolute path exposure, Schema / serialization compatibility.

Input:
- Final docs diff.

Output:
- PR-ready docs criteria update with no local absolute paths and no accidental
  code/runtime scope.

Non-output:
- No changed binary assets, generated manifests, bridge fixtures, runtime
  handlers, or editor UI.

Failure:
- If docs introduce local absolute paths, remove or replace with repo-relative
  paths before review.

Proof:
- `rg -n "/Users/|/home/|Desktop|Downloads|[A-Za-z]:\\\\" docs/specs docs/adr`
  has no new matches from this task.
- `git diff --name-only` is limited to expected docs unless a reviewed minimal
  test is explicitly added.

## Acceptance Criteria

- [ ] Stage renderable asset-kind criteria are documented.
- [ ] S2M/map provenance and Shotloom manifest `AssetKind` relationship is
      documented without making source categories authoritative.
- [ ] Wrong-kind `StageRenderable.asset_id` handling states the current
      validation-failure behavior and separates warning/skip as follow-up.
- [ ] Character, prop, StageRenderable, and StageTemplate expectations are
      compared with enforcement-layer notes.
- [ ] Follow-up implementation and regression-test candidates are separated
      from the STL-475 docs criteria PR.

## Verification

| ID | Gate | Command / Check | Expected result |
|---|---|---|---|
| V1 | Provenance docs readback | Read changed `docs/specs/stage-entity-model.md` section. | Six provenance keys match existing Asset Catalog Policy; docs say hints/provenance do not own final semantics. |
| V2 | Wrong-kind readback | Compare docs against `validate_stage_refs_with_assets` and `StageReferenceError::UnsupportedRenderableAssetKind`. | Docs state current wrong-kind behavior as bundle validation failure under catalog context. |
| V3 | Consumer table readback | Compare docs table against `CharacterModel`, `PropModel`, `StageRenderable`, and `AssetKind`. | Table names consumer expectation and enforcement layer without overstating parity. |
| V4 | Scope/privacy check | `git diff --name-only`; `rg -n "/Users/|/home/|Desktop|Downloads|[A-Za-z]:\\\\" docs/specs docs/adr`. | Only expected docs/test paths changed; no local absolute path examples added. |
| V5 | Docs validation | `pnpm validate:docs` if available in the Shotloom worktree. | Documentation links and formatting pass. |

## Traps

- Do not say `.glb` implies `prop` or `stage_renderable`; file type is not the
  manifest consumer kind.
- Do not make `source_category` equal `AssetKind`; source category is upstream
  evidence.
- Do not claim shot-local `validate_stage_refs` checks asset kinds; the catalog
  context variant owns that check.
- Do not turn this docs criteria task into a migration, repair, runtime
  hydration, or bridge DTO PR.
- Do not describe `stage_template` as a valid direct
  `StageRenderable.asset_id` target under current policy.
- Do not introduce local machine paths when using external asset examples.

## Follow-Up Candidates

- Import classification implementation: when S2M/map import creates manifest
  assets, add tests proving source evidence produces the intended consumer
  `AssetKind`.
- Runtime wrong-kind degradation policy: if product wants warning/skip instead
  of load rejection for runtime materialization, create a separate policy and
  handler task.
- Character/prop manifest-kind parity audit: compare whether character/prop
  asset refs should gain Stage-style kind validation in a separate core task.
- Asset pack/source metadata hygiene: if examples require committed GLBs or
  manifests, track source/license/LFS/local-path validation separately.
