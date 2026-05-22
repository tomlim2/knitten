---
status: ready
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: STL-475
repo: shotloom
linear: STL-475
spec: ../../plans/proposed/core-migrate-stage-renderable-kind.md
---

### Shotloom coding mode - docs

**Issue:** STL-475 "docs(core): Stage renderable asset kind 기준 정리"
  Problem: STL-457 needs a thin closure pass for the Stage renderable
  asset-kind boundary. `StageRenderable.asset_id` now uses manifest assets with
  `stage_renderable` as the canonical boundary, and STL-475 documents that rule
  against existing import behavior rather than creating a new import system.
  Acceptance:
  - Stage renderable asset kind 기준이 문서화된다.
  - 기존 import asset 처리 흐름과 충돌하지 않는다는 점이 정리된다.
  - A2M/S2M/map document provenance가 `AssetKind`를 직접 결정하지 않는다는
    점이 정리된다.
  - wrong-kind reference 처리 방향이 정리된다.
  - character / prop / StageRenderable consumer별 기대 kind가 비교된다.
  - 후속 구현이 필요하면 별도 작업으로 분리할 수 있게 범위가 정리된다.
  Non-goals: new normalizer/helper, bundle migration tool, editor repair UI,
  bridge DTO changes, runtime hydration normal-path changes, automatic
  PropModel promotion, external S2M API integration, import path/URI validation.
  Linked: STL-450, STL-457, ADR-0050, ADR-0054.

**Branch:** feat/core-migrate-stage-renderable-kind  (base: origin/main)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/adr/README.md,
docs/guidelines/error-handling.md, docs/guidelines/review-rust.md,
docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md,
docs/guidelines/documentation-standard.md.
**ADRs to honor:** ADR-0050 Stage entity model, ADR-0054 Stage content
load-time validation, ADR-0005 product-owned bundle schema, ADR-0051 contract
authority tiers.
**Ask-first triggers for this task:** changing the canonical
`StageRenderable.asset_id` kind away from `stage_renderable`; changing core
validation behavior; adding bridge command/event/DTO fields; changing runtime
hydration behavior; implementing migration or repair instead of documenting the
policy basis; adding a new ADR.
**Intent lens:** close the STL-457 asset-kind criteria gap without deepening
the implementation scope. Preserve Stage as the semantic owner and
`stage_renderable` as the current canonical renderable-asset boundary. Keep the
first pass narrow: Stage renderable plus `AssetKind`, not path/URI validation
or a new normalization helper.

**AC primitive cross-check:**
- AC1 Stage renderable asset kind 기준 문서화: codified-partial -
  `docs/specs/bundle-format.md` §17 rule 4 and
  `ShotModel::validate_stage_refs_with_assets` already require
  `stage_renderable`, but no criteria doc compares how import/provenance should
  choose the kind.
- AC2 import flow consistency: codified-current - `ImportAsset(kind: Prop)`
  registers `AssetKind::Prop`, and tests pin that the user-chosen/import kind
  is canonical even when GLB bytes contain VRM extensions.
- AC3 A2M/S2M/map provenance vs `AssetKind`: codified-partial -
  `docs/specs/stage-entity-model.md` says `source_category`, `role_hint`, and
  `representation_hint` are hints/provenance, not final Stage semantics; it
  does not yet spell out that these hints do not directly determine manifest
  `AssetKind`.
- AC4 wrong-kind reference 처리 방향: codified-current -
  `StageReferenceError::UnsupportedRenderableAssetKind` currently makes
  wrong-kind `StageRenderable.asset_id` a validation failure. Any warning/skip
  alternative is a follow-up policy decision, not current behavior.
- AC5 consumer별 기대 kind 비교: codified-partial - `AssetKind` and Stage
  validators encode current expectations, but there is no cross-consumer table
  for character / prop / StageRenderable.
- AC6 STL-457 closure: process - the issue is a thin criteria pass for the
  parent Stage implementation umbrella, not a new implementation slice.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: State that the spec records current behavior and closes the STL-457
  criteria gap. Evidence: latest Linear wording frames STL-475 as a thin
  closure pass. AC-trace: AC1-AC6.
- P1: Do not weaken the canonical `StageRenderable -> stage_renderable`
  boundary without explicit approval. Evidence: bundle-format §17 rule 4,
  `ShotModel::validate_stage_refs_with_assets`, and bundle tests enforce it.
  AC-trace: AC1, AC3.
- P2: Define how A2M/S2M/map document provenance relates to `AssetKind` without
  equating `source_category` with kind. Evidence: Stage Entity Model Asset
  Catalog Policy treats metadata keys as hints/provenance only. AC-trace: AC3.
- P2: Compare character, prop, and StageRenderable consumers at the policy
  level; avoid bridge/runtime implementation work in this task. Evidence:
  Linear non-goals exclude DTO and runtime hydration changes. AC-trace: AC5.
- P2: If wrong-kind handling should move from validation failure to
  diagnostic/skip, file or defer a separate implementation task. Evidence:
  ADR-0054 rejects silent repair of persisted Stage content; current validation
  rejects wrong-kind references. AC-trace: AC4, AC6.
- P3: Keep wording request-like and criteria-focused; avoid resurrecting
  automatic migration/manual repair language unless the spec explicitly frames
  it as a follow-up option. Evidence: user asked to avoid overcommitting
  Linear text. AC-trace: AC5.

**Sibling specs (Knitten docs):**
- `core-stage-renderable-provenance.md` - ready/proposed - stance: STL-450
  added `StageRenderable` provenance, `AssetKind::StageRenderable`, and
  validation that renderable assets use `stage_renderable`; agrees and is the
  direct predecessor. Its old "missing StageRenderable asset kind" note is
  superseded by main.
- `adr-record-stage-entity-model.md` - ready/proposed - stance: Stage is a
  shot-local authored environment; Stage/Prop/asset boundaries stay distinct;
  agrees with keeping `prop` out of canonical Stage renderable bindings.
- Deleted sibling specs: none found.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; inactive `deemotl` token warning ignored
- [x] Shotloom repo commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, ADR index
- [x] category: docs
- [x] targeted standards loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans/ + docs/briefings/shotloom/)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
