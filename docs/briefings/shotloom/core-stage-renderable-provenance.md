---
status: ready
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-450
repo: shotloom
linear: STL-450
spec: ../../plans/proposed/core-stage-renderable-provenance.md
---

### Shotloom coding mode — mixed

**Issue:** STL-450 "feat(core): Stage renderable asset/provenance 모델 연결"
  Problem: Stage has persisted role/representation primitives, but asset catalog metadata remains an untyped hint map and stage-map source evidence is not yet connected to Stage renderable/provenance semantics.
  Acceptance:
  - Stage renderable round-trips asset id, representation kind, and source provenance.
  - Asset metadata hint is treated only as hint/provenance, not final Stage role.
  - Source category, source document id, and source object id are preserved on Stage element or renderable provenance.
  - Unknown source category remains diagnostic/provenance instead of forced role conversion.
  - `cargo test -p shotloom-core --lib` passes.
  Affected: `crates/shotloom-core/src/model/asset.rs`, `crates/shotloom-core/src/model/`, `contracts/stage-map/`, `crates/shotloom-stage/src/map_document.rs`, `docs/specs/stage-entity-model.md`, `docs/specs/bundle-format.md`.
  Linked: ADR-0050, ADR-0051, ADR-0005, ADR-0012, STL-446, STL-449.

**Branch:** feat/core-stage-renderable-provenance  (base: origin/main)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, WORKFLOW.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/guidelines/documentation-standard.md, docs/guidelines/spec-procedure-guideline.md, docs/ipc/bridge-contract.md.
**ADRs to honor:** ADR-0050 Stage entity model, ADR-0051 contract authority tiers, ADR-0005 product-owned bundle schema, ADR-0012 generated stage contract, ADR-0044 via `crates/shotloom-core/architecture.md` persistent collection rule.
**Ask-first triggers for this task:** core domain-model changes in `shotloom-core`; contract shape changes under `contracts/`; durable spec changes; any bridge command/DTO change; any scope that edits runtime hydration, editor UI, or background prop command behavior.
**Intent lens:** Preserve upstream/source evidence as typed provenance while keeping Shotloom Stage as final semantic owner. Prevent metadata maps or StoryPreviz/MiniCineV categories from silently becoming authoritative roles.

**AC primitive cross-check:**
- AC1 renderable round-trip of asset id, representation kind, and source provenance: codified-partial - `StageRenderable` already has `kind`, `asset_id`, `local_transform`, and `options` in `crates/shotloom-core/src/model/stage.rs`, but source provenance currently lives on `StageElement.source` and `StageModel.provenance`; the spec must decide whether renderable-level provenance is required or whether element-level source is the owning primitive.
- AC2 asset metadata hint is not final role: codified - ADR-0050 says asset metadata can carry role/representation hints and Stage remains semantic owner; `docs/specs/stage-entity-model.md` Asset Catalog Policy repeats that metadata may carry hints but does not own final semantics; `docs/specs/bundle-format.md` §14.2 says metadata must not replace first-class stable behavior.
- AC3 source category/document/object id preserved on Stage element or renderable: codified-partial - `StageSourceRef` has `source_system`, `source_document_id`, `source_object_id`, `source_category`, and `role_hint`; no `representation_hint` exists yet. `crates/shotloom-stage/src/map_document.rs` exposes document/object/source-system data but currently resolves placements, not StageModel provenance.
- AC4 unknown source category diagnostic/provenance instead of forced role conversion: codified - `docs/specs/stage-entity-model.md` maps `unknown` to "diagnostic plus provenance" and says not to force a Stage role. Current `StageRole` is closed and excludes unknown/shot_prop; `StageModelDiagnostic` is generic enough to carry a persisted warning.
- AC5 `cargo test -p shotloom-core --lib`: verification-example - this is the minimum core validation gate, not a design primitive. It should be supplemented by round-trip and validation tests that prove the provenance/role-hint contract.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements must lock the owning location for source provenance: Stage-level, element-level, renderable-level, or a split. Evidence: `crates/shotloom-core/src/model/stage.rs` has `StageSourceRef` only on `StageElement`, while STL-450 asks for Stage renderable provenance. AC-trace: AC1 and AC3.
- P1: Requirements must define typed asset metadata hint extraction without letting `AssetCatalogEntry.metadata` become authoritative Stage semantics. Evidence: `crates/shotloom-core/src/model/asset.rs` stores free-form metadata; ADR-0050 and `docs/specs/stage-entity-model.md` say hints only. AC-trace: AC2.
- P1: Coupled artifact atomicity seed: if an import/model conversion creates or updates both `AssetCatalog` entries and `StageModel` references, the spec must say whether every referenced asset is prevalidated before mutating the Stage, or how partial catalog/stage persistence is prevented. Evidence: `StageRenderable.asset_id` references catalog IDs; `AssetCatalog::insert` can fail on duplicate/invalid IDs. AC-trace: AC1, AC3, ADR-0005 product-owned bundle schema.
- P2: Verification must include unknown source category behavior: preserve `source_category`, avoid forced `StageRole`, and persist a diagnostic or provenance marker. Evidence: `docs/specs/stage-entity-model.md` source alignment table and `StageModelDiagnostic`. AC-trace: AC4.
- P2: Verification must cover representation hints separately from role hints. Evidence: STL-450 names role hint and representation hint, but current `StageSourceRef` has only `role_hint`; current `StageRenderable` has `kind` but no hint/provenance origin. AC-trace: AC2 and AC3.
- P2: Contract authority must be explicit if `contracts/stage-map` changes: schema is a local POC input contract and source-code/tests own repository-internal StageModel shape. Evidence: ADR-0051 and `contracts/stage-map/README.md`. AC-trace: affected module list includes `contracts/stage-map/`.
- P3: Naming should avoid `stage_prop`, `asset_role`, and `dressing`; use `set_dressing`, `role_hint`, and `source_category` consistently. Evidence: `docs/specs/stage-entity-model.md` Terminology. AC-trace: Stage semantic ownership rule from STL-446/STL-450.

**Sibling specs (agent-hub/docs/plans/):**
- none found. Resolver key `agent-hub` is absent in this environment; scanned `/Users/younsoolim/Desktop/www/knitten/docs/plans`, `/Users/younsoolim/Desktop/www/knitten/docs`, and recently deleted plan paths for core/stage/renderable/asset/provenance/STL-450 overlaps.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: mixed
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (agent-hub/docs/plans/ equivalent scan, full body not needed because no matches)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
