---
status: ready
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-448
repo: shotloom
linear: STL-448
spec: ../../plans/proposed/adr-record-stage-entity-model.md
---

### Shotloom coding mode - docs

**Issue:** STL-448 "docs(adr): Stage entity model decision record"
  Problem: Stage needs a durable decision record before implementation so the
  Stage/Prop/asset/runtime boundaries do not drift during later bridge, core,
  editor, and import work.
  Acceptance:
  - add one new ADR under `docs/adr/`
  - use Shotloom ADR naming, status, and index conventions
  - record the Stage entity definition, role, owned/not-owned scope,
    `StageElement`/`StageRenderable` split, and `dressing` terminology
  - record consequences for core model, bridge/TS, runtime hydration,
    editor UI, asset/import model, and migration
  - compare background asset, all-PropModel, immediate bundle-level catalog,
    and merged role/representation alternatives
  - state non-goals: no Rust/TypeScript implementation, bridge schema change,
    bundle schema change, or follow-up issue creation
  Affected:
  - `docs/adr/`
  - `docs/adr/README.md`
  - related context only: `docs/specs/`, `crates/shotloom-core`,
    `crates/shotloom-engine`, `crates/shotloom-stage`, `apps/editor`,
    `contracts/`
  Linked:
  - ADR-0007, ADR-0009, ADR-0012, ADR-0020, ADR-0041
  - `docs/specs/stage-map-document.md`
  - `docs/specs/bundle-format.md`
  - `docs/arch/bevy-entity-modeling.md`

**Branch:** `chore/adr-record-stage-entity-model`  (base: `origin/main`
`9f0d49d6`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CLAUDE.md, CONTRIBUTING.md,
docs/guidelines/error-handling.md, docs/guidelines/review-rust.md,
docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md,
docs/guidelines/documentation-standard.md, docs/guidelines/adr-template.md,
agent-hub LLM-first docs standard.

**ADRs to honor:**
- ADR-0007: Shot is the primary editing unit; each shot owns its
  environment.
- ADR-0009: Alpha has Void Stage; deferred stage growth includes map assets,
  Gaussian splats, procedural stages, coordinate systems, and spawn points.
- ADR-0012: `shotloom-engine` mediates `StageEnvironment` into
  `shotloom-stage` DTOs; `shotloom-stage` stays independent of
  `shotloom-core`.
- ADR-0020: Shotloom schema terms stay product-owned and distinct from Bevy
  ECS terms; Characters, Props, and CineCameras live directly inside shots.
- ADR-0041: `ShotEntityRef` owns bundle-side polymorphic refs; `ShotEntityId`
  remains a runtime/bridge key.

**Ask-first triggers for this task:**
- the ADR proposes concrete Rust/TypeScript type additions or bridge schema
  fields instead of a decision record
- the ADR requires bundle schema migration
- the ADR creates follow-up issues or subissues
- the ADR body includes concrete Linear issue ids or Linear URLs
- the ADR changes existing Accepted ADR conclusions instead of linking to them

**Intent lens:** prevent implementation after this ADR from collapsing Stage into
either a background asset or a normal `PropModel` batch. Preserve the preferred
direction: Stage starts as a shot-local authored environment entity; semantic
role and runtime representation remain separate; user-editable shot props stay
outside Stage-owned environment content.

**AC primitive cross-check:**
- New ADR under `docs/adr/`: codified - `docs/adr/README.md` and
  `docs/guidelines/adr-template.md` define ADR location and filename style.
- ADR title/status convention: codified - `docs/guidelines/adr-template.md`
  defines `ADR-<id>: <Title>` and `Proposed | Accepted | Superseded`.
- Context includes the parent issue definition: wrong-shape literally -
  `docs/guidelines/adr-template.md` forbids concrete Linear ids in ADR bodies.
  Preserve the Stage definition and problem background without tracker ids.
- Decision names `StageElement`, `StageRenderable`, roles, representations,
  and `dressing`: proposed-content - these symbols do not exist on
  `origin/main`; the ADR must frame them as the selected model direction, not
  as current implementation.
- Consequences section split by subsystem: codified - ADR template requires
  consequences; AFDS assigns durable behavior to specs, architecture to
  `docs/arch/`, and decisions to `docs/adr/`.
- Alternatives section: codified - ADR template requires alternatives.
- Non-goals section: task-owned constraint - no repo primitive requires this
  section, but adding it preserves issue scope and avoids implementation work.
- ADR index update: codified - `docs/adr/README.md` is the current ADR index.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Decide source of truth for the preferred Stage draft before ADR text is
  written. Evidence: the Linear issue references
  `docs/specs/stage-concept-candidate-6-1.md`, `stage-concept-candidate-6.md`,
  and `stage-concept-candidate-5.md`, but those files are absent from this
  `origin/main` worktree. AC-trace: issue reference docs and user direction.
- P1: Remove all concrete Linear ids from durable ADR body while preserving the
  parent issue's Stage definition. Evidence:
  `docs/guidelines/adr-template.md` Linear identifiers section. AC-trace:
  "Context includes parent issue definition" AC.
- P1: Lock shot-local scope and avoid deciding an immediate bundle-level shared
  stage catalog. Evidence: ADR-0007 says each shot owns environment; ADR-0020
  says scene entities live inside each shot. AC-trace: alternatives include
  immediate bundle-level catalog.
- P1: Keep role and representation separate without over-enumerating deferred
  type membership in the ADR body. Evidence: no `StageModel`,
  `StageElement`, `StageRenderable`, `StageRole`, or
  `StageRepresentationKind` exists on `origin/main`; ADR template warns
  against concrete type-name inventories. AC-trace: Decision content AC.
- P2: State compatibility with the current `spawn_background_props` path
  without changing the bridge contract. Evidence:
  `docs/ipc/bridge-contract.md` section 14.2b persists background map objects
  as `PropModel` with `background_map` and ownership tags. AC-trace:
  compatibility/migration goal.
- P2: Preserve `shotloom-stage` independence from core and route later runtime
  hydration through engine mediation. Evidence: ADR-0012 and
  `crates/shotloom-stage/src/lib.rs` define `StageRequest` as a flat runtime
  DTO. AC-trace: runtime hydration consequence.
- P2: Clarify that `AssetCatalogEntry` owns asset bytes, URI, and metadata,
  not authoritative Stage semantics. Evidence:
  `crates/shotloom-core/src/model/asset.rs` lists `AssetKind::StageTemplate`
  but no Stage entity semantics. AC-trace: owned/not-owned scope.
- P2: Keep ADR file and `docs/adr/README.md` index update atomic in the spec.
  Evidence: acceptance requires both new ADR and index update. AC-trace: ADR
  index AC.
- P3: Verify the ADR number immediately before writing; current highest file
  is ADR-0048 and ADR-0046 remains Proposed. Evidence: `docs/adr/README.md`
  and `ls docs/adr`. AC-trace: naming convention AC.

**Sibling specs (agent-hub/docs/plans/):**
- `completed/stage-define-map-document-bundle-layout.md` - completed - stance:
  defines the local stage map document contract, ownership tags, diagnostics,
  and selected POC maps - agrees; it is a background import contract, not the
  Stage entity model.
- `completed/stage-add-map-document-parser.md` - completed - stance:
  implements parser/resolver boundaries in `shotloom-stage` without bridge,
  bundle, or UI mutation - agrees; it reinforces stage crate independence.
- `drafts/stage-add-map-document-parser-conflict.md` - draft-conflict -
  stance: older blocker note before the map-document contract existed on base
  - no current disagreement; contract exists on `origin/main`.
- `completed/adr-0030-clarify-extension-boundary.md` - completed - stance:
  ADR boundary edits must stay decision-level, avoid function inventories, and
  avoid Linear ids - agrees with ADR writing constraints.
- `completed/shotloom-plan-skills-risk-map.md` - completed - stance: process
  improvement for Shotloom plans, Risk Maps, and Linear briefings - process
  context only; no domain disagreement.
- `completed/shotloom-debug-router-pr-split.md` - completed - stance: debug
  router PR split plan - unrelated; no disagreement.
- Deleted sibling specs: none found by git history scan.

**Pre-write checklist passed:**
- [x] gh auth: `tomlim2` active; inactive `deemotl` token reports failure but
      is not active.
- [x] commit identity: worktree config is `tomlim2 <deemo@vonvon.me>`;
      inherited HEAD author belongs to the existing main commit.
- [x] base freshness: fetched `origin/main`; HEAD equals `origin/main`
      `9f0d49d6`.
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index.
- [x] category: docs.
- [x] targeted sections loaded.
- [x] AC primitive cross-check recorded.
- [x] spec-risk handoff seeded.
- [x] sibling-spec scan run.

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
