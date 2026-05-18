---
status: proposed
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-448
repo: shotloom
linear: STL-448
briefing: ../../briefings/shotloom/adr-record-stage-entity-model.md
---

# Record Stage Entity Model ADR

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/adr-record-stage-entity-model.md`
  records the ready state for STL-448.
- Current truth: `origin/main` has `StageEnvironment`, `StageRequest`,
  background map prop import, Stage map parser docs, and ADRs for shot,
  stage, terminology, and entity reference boundaries.
- Required change: add one Shotloom ADR, add one README-like Stage entity
  model reference doc for examples/details, and update discovery indexes.
- Locked boundary: docs-only decision record; no Rust, TypeScript, bridge,
  bundle schema, or Linear follow-up creation.
- Proof method: doc path validation, durable Linear reference validation,
  markdown lint, ADR readback, and pre-PR review.
- One-PR suitability: yes; the Shotloom PR changes one ADR, one supporting
  Stage entity model spec, and discovery indexes only.

## Current State

| Surface | Path | Symbol / section | Classification | Evidence |
|---|---|---|---|---|
| Ready briefing | `docs/briefings/shotloom/adr-record-stage-entity-model.md` | STL-448 briefing | Already Done | Defines issue intent, AC primitive check, P1/P2 handoff, and sibling scan. |
| ADR index | `docs/adr/README.md` | Records / Proposed | Partial | Highest ADR file is ADR-0048; ADR-0046 remains Proposed; new ADR needs an index row. |
| ADR template | `docs/guidelines/adr-template.md` | Naming, template, Linear identifiers | Already Done | Defines filename/status/section rules and forbids concrete Linear ids in ADR body. |
| Primary editing unit | `docs/adr/adr-0007-shot-as-primary-editing-unit.md` | Decision | Already Done | A Shot owns environment and remains the biggest editable unit. |
| Stage crate boundary | `docs/adr/adr-0009-void-stage-and-coordinate-system.md` | Decision 3 | Already Done | Stage/environment logic belongs to `shotloom-stage`; non-void stage forms are deferred. |
| Stage mediation | `docs/adr/adr-0012-generated-stage-contract.md` | StageRequest DTO | Already Done | Engine mediates persisted stage data into `shotloom-stage` DTOs. |
| Scene terminology | `docs/adr/adr-0020-shotloom-scene-terminology.md` | Scene entity terms | Already Done | `Character`, `Prop`, and `CineCamera` are product-owned shot entities. |
| Entity refs | `docs/adr/adr-0041-bundle-entity-ref-wire-form.md` | `ShotEntityRef`, `ShotEntityId` | Already Done | Bundle polymorphic refs use tagged form; `ShotEntityId` remains runtime/bridge debt. |
| Current environment model | `crates/shotloom-core/src/model/entity.rs` | `StageEnvironment`, `PropModel` | Partial | `StageEnvironment` is map/mood config; no Stage entity model exists. |
| Current shot model | `crates/shotloom-core/src/model/shot.rs` | `ShotModel` | Partial | Shot owns characters, props, cine cameras, environment, timeline, and metadata; no stages collection exists. |
| Current asset model | `crates/shotloom-core/src/model/asset.rs` | `AssetCatalogEntry`, `AssetKind::StageTemplate` | Partial | Assets own bytes/URI/metadata; no authoritative Stage semantics exist in asset entries. |
| Current background import | `docs/ipc/bridge-contract.md` | `spawn_background_props` | Partial | Background map objects persist as `PropModel` entries with `background_map` ownership tags. |
| Current stage map docs | `docs/specs/stage-map-document.md` | Background ownership | Already Done | Map document ownership becomes prop tags for current background batch spawn. |
| Product spec index | `docs/specs/README.md` | Documents | Partial | New Stage entity model reference doc needs one row if added. |
| Navigation index | `MAP.md` | Product specs / ADRs | Partial | New Stage entity model doc and ADR need navigation rows if added. |
| Candidate draft source | parent worktree only | `stage-concept-candidate-6-1.md` | Out of branch | Useful local draft exists outside this worktree; the ADR must not link to absent branch-local docs. |

## Sibling Specs

| Spec | Status | Stance | Use in this spec |
|---|---|---|---|
| `completed/stage-define-map-document-bundle-layout.md` | completed | Defines local stage map document contract, ownership tags, diagnostics, and selected POC maps. | Adopt compatibility wording for current background-map ownership; reject parser/bridge/UI implementation as out of scope. |
| `completed/stage-add-map-document-parser.md` | completed | Keeps stage map parser/resolver in `shotloom-stage` without bundle, bridge, or UI mutation. | Adopt stage crate independence and runtime-agnostic boundary. |
| `drafts/stage-add-map-document-parser-conflict.md` | draft-conflict | Older blocker before map-document contract existed on base. | No disagreement; current branch has the contract. |
| `completed/adr-0030-clarify-extension-boundary.md` | completed | Keeps ADR edits decision-level and avoids function inventories and Linear ids. | Adopt ADR writing constraints. |
| `completed/shotloom-plan-skills-risk-map.md` | completed | Process spec for Risk Map and Linear Briefing. | This spec follows the required sections. |
| `completed/shotloom-debug-router-pr-split.md` | completed | Debug router PR split plan. | No domain overlap. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-448` |
| State | In Progress |
| Owner | deemo |
| Goal | Record the preferred Stage entity model as an ADR before implementation starts. |
| Acceptance criteria | Add ADR; follow ADR conventions; include Stage definition, ownership scope, `StageElement`/`StageRenderable`, `dressing`, consequences, alternatives, non-goals, and ADR index update. |
| Latest relevant comment | User approved proceeding through PR and clarified that examples/details belong in a README-like doc rather than the ADR. |
| Blockers / dependencies | Parent `STL-446`; no implementation subissues created in this task. |
| Related PRs | N/A |
| Current review state | No PR yet. |
| Planning consequence | The PR is docs-only. ADR records the decision; `docs/specs/stage-entity-model.md` carries definitions, examples, role tables, and terminology details. |

## Problem

Shotloom has several stage-adjacent primitives but no durable decision record
for Stage as an authored entity. Without an ADR, later implementation can
collapse Stage into one of three weaker shapes:

- a background asset with no authoring lifecycle,
- a batch of normal `PropModel` objects,
- a bundle-level shared catalog introduced before shot-local semantics are
  proven.

The ADR must lock the preferred entity boundary while keeping examples and
operational detail in a README-like reference document.

## Requirements

1. Add one ADR under `docs/adr/` that records Stage as a shot-local authored
   environment entity.
   - Trace: STL-448 AC; ADR-0007.
2. Add `docs/specs/stage-entity-model.md` as the Stage entity model reference
   doc for definitions, role tables, representation examples, terminology,
   authoring operations, and migration notes.
   - Trace: user clarification to move examples/details to a README-like doc;
     AFDS `docs/specs/` responsibility for domain behavior.
3. In the ADR, state Stage's role and non-role:
   - owns environment identity, composition, semantic roles, representation
     bindings, authoring lifecycle, provenance, and runtime hydration boundary;
   - does not own characters, dialogue, cine-camera timing, shot-owned props,
     raw asset bytes, or Bevy-only ECS state.
   - Trace: STL-448 AC; ADR-0020; ADR-0012.
4. State that `StageElement` owns semantic role and authoring lifecycle, while
   `StageRenderable` owns representation kind and asset binding.
   - Trace: user-approved preferred direction; STL-448 AC.
5. State that `mesh` is a representation, not a role, and that representation
   kinds must leave room for Gaussian splat, panorama, cubemap, void,
   collision proxy, and navigation hint forms.
   - Trace: STL-448 AC; ADR-0009 deferred stage forms.
6. State that `PropModel` remains the shot-owned editable prop model and Stage
   dressing is stage-owned until explicit promotion.
   - Trace: STL-448 AC; ADR-0020; current `PropModel`.
7. Use `dressing` for stage-owned environment objects that are not shell,
   structure, fixture, proxy, or anchor.
   - Trace: user clarification recorded in STL-448; Ready briefing.
8. Record compatibility with `StageEnvironment`, `StageRequest`, and
   `spawn_background_props` without changing those contracts.
   - Trace: STL-448 AC; ADR-0012; `docs/ipc/bridge-contract.md`.
9. Compare these rejected alternatives:
   - Stage as a simple background asset,
   - all background objects as `PropModel`,
   - immediate bundle-level shared stage catalog,
   - merged role/representation enum.
   - Trace: STL-448 AC.
10. Add explicit non-goals for Rust/TypeScript implementation, bridge schema,
   bundle schema, and follow-up issue creation.
   - Trace: STL-448 AC and user instruction not to create subissues beyond ADR.
11. Update `docs/adr/README.md` with the new ADR row.
    - Trace: STL-448 AC; ADR index convention.
12. Update `docs/specs/README.md` and `MAP.md` so the new reference doc is
    discoverable.
    - Trace: documentation standard; user requested README-like placement for
      examples/details.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | Docs-only ADR; no Rust error enum or `map_err` path changes. | State N/A and avoid implementation edits. | N/A: no Rust source changes. |
| Schema / serialization compatibility | yes | `ShotModel`, `StageEnvironment`, bridge command docs, and ADR-0041 own current persistence/wire claims. | ADR records decision direction only and states no bundle or bridge schema change in this PR; reference doc labels sketches as conceptual and non-wire. | `git diff` confirms no Rust/TS/contract/bundle-format files changed; doc validation passes. |
| Ownership / API boundary | yes | ADR-0007, ADR-0012, ADR-0020, `shotloom-stage/README.md`. | State Stage, Prop, AssetCatalog, stage crate, and engine mediation boundaries explicitly. | Readback confirms each owner is named in Decision/Consequences without code changes. |
| Partial mutation / rollback | yes | ADR, Stage entity model spec, `docs/adr/README.md`, `docs/specs/README.md`, and `MAP.md` are one documentation unit. | Edit decision, reference doc, and indexes together before validation. | `node scripts/validate-doc-paths.mjs` catches broken links; final diff contains all required docs. |
| Diagnostic ownership | no | No diagnostic code, severity, or event is introduced. | Non-goal bridge/diagnostic changes. | N/A: no diagnostic surface changed. |
| Test oracle strength | yes | Docs-only PR can pass lint while saying the wrong durable thing. | Verification includes ADR readback against requirements and pre-PR docs review. | Manual readback plus markdown/doc validators. |
| Scope creep | yes | Candidate draft contains implementation sketches, bridge operations, and model fields. | ADR keeps decision-level wording; reference doc carries examples/details and marks implementation as deferred. | Review verifies no Rust/TS/schema files changed and ADR uses decision altitude. |
| Reviewer objection | yes | ADR template forbids Linear ids and concrete type inventories in ADR bodies. | Use durable names only where they are the decision subject; omit Linear ids and absent candidate doc links. | `node scripts/validate-durable-doc-linear-refs.mjs`; targeted `rg` for `STL-`/Linear URLs in ADR. |

## Locked Decisions

1. **Write a new ADR instead of a spec-only note.**
   Rationale: Stage entity modeling affects domain ownership, runtime
   hydration, bridge compatibility, editor authoring, asset/import semantics,
   and migration. The decision outlives the current Linear task.
   Rejected alternatives: putting the decision only in `docs/specs/` loses the
   rationale record; putting it only in Linear makes it execution-state.

2. **Use the next available ADR number after verifying the tree immediately
   before edit.**
   Rationale: ADR numbers are assigned at draft time and the current tree
   already contains gaps in Proposed/Superseded lists.
   Rejected alternatives: hard-coding ADR-0049 without a final check risks
   collision if another ADR lands first.

3. **Frame Stage as shot-local in the decision.**
   Rationale: ADR-0007 makes Shot the primary editing unit and current
   `ShotModel` keeps authored scene entities inside each shot.
   Rejected alternatives: an immediate bundle-level shared Stage catalog adds
   reuse semantics before there is implementation evidence for copy/reference
   behavior.

4. **State the role/representation split without turning the ADR into a type
   inventory.**
   Rationale: `StageElement` and `StageRenderable` are the subject of this
   decision, but exact Rust field membership belongs to a later spec or owning
   module documentation.
   Rejected alternatives: copying the full candidate model sketch into the ADR
   violates the ADR template's concrete type-list warning.

5. **Move examples and model sketches into a README-like spec document.**
   Rationale: the user clarified that examples belong outside the ADR. AFDS
   assigns product/domain behavior and terminology to `docs/specs/`, while
   ADRs own rationale.
   Rejected alternatives: placing examples in the ADR makes the decision record
   too implementation-shaped; placing them only in local candidate drafts leaves
   them outside branch-local repo truth.

6. **Do not link the ADR to absent candidate draft docs.**
   Rationale: `stage-concept-candidate-*` files exist only in a separate local
   worktree and are not branch-local repo truth for this PR.
   Rejected alternatives: linking to missing files breaks doc validation and
   makes the ADR depend on uncommitted draft artifacts.

7. **Keep `spawn_background_props` compatibility as a migration note, not an
   implementation step.**
   Rationale: the current bridge path persists imported background objects as
   tagged `PropModel` entries. This ADR records how that relates to Stage
   direction without changing bridge behavior.
   Rejected alternatives: changing the bridge command or bundle schema in this
   PR exceeds STL-448 non-goals.

8. **Use `dressing` and avoid `stage prop`, `background mesh`, and
   `set piece` as canonical terms.**
   Rationale: `PropModel` already owns shot props, `mesh` is a representation,
   and `set piece` has cinematic ambiguity.
   Rejected alternatives: keeping those terms reopens the exact Prop/Stage and
   role/representation confusion the ADR prevents.

## Non-Goals

- No Rust model types.
- No TypeScript bridge types.
- No bridge command or event schema changes.
- No bundle schema migration.
- No `ShotModel` field additions.
- No stage import UI.
- No parser/resolver changes.
- No new Linear subissues.
- No edits to the local candidate draft docs.
- No code examples that compile as promised API.
- No authoritative JSON wire schema for Stage.

## Implementation Spec

### S0 - Baseline Re-check

Requirement trace: 1, 8, 11, 12.
Verification trace: ADR number check, banned tracker reference search, and
diff file list check.

1. Fetch `origin/main` and verify the branch is still based on current main.
2. Re-run:
   - `ls docs/adr | sort | tail`
   - `rg -n "StageModel|StageElement|StageRenderable|StageRole|StageRepresentationKind" crates apps docs contracts MAP.md`
   - `rg -n "STL-[0-9]+|linear.app" docs/adr docs/adr/README.md`
3. Confirm no new Stage entity ADR landed since this spec was written.
4. Confirm no branch-local `docs/specs/stage-concept-candidate-*.md` files
   exist before deciding whether to link them.

### S1 - Add Stage Entity ADR

Requirement trace: 1, 3 through 10.
Verification trace: manual ADR readback against each requirement and targeted
markdown lint.

1. Add `docs/adr/adr-00XX-stage-entity-model.md`.
2. Use ADR sections:
   - `Status`
   - `Context`
   - `Decision`
   - `Consequences`
   - `Alternatives considered`
   - `Related`
3. Set `Status` to `Proposed`.
4. In `Context`, describe existing stage-related primitives and the decision
   pressure without naming Linear ids.
5. In `Decision`, record:
   - Stage is a shot-local authored environment entity.
   - Stage is not a background asset and not a replacement for `PropModel`.
   - `StageElement` owns semantic role and authoring lifecycle.
   - `StageRenderable` owns representation kind and asset binding.
   - `mesh` is a representation, not a role.
   - Stage-owned environment objects use `dressing`; shot-owned editable
     objects remain `PropModel`.
6. In `Consequences`, split by:
   - core model,
   - bridge and TypeScript contracts,
   - runtime hydration,
   - editor authoring,
   - asset/import model,
   - migration.
7. In `Alternatives considered`, cover the four STL-448 alternatives.
8. In `Related`, link only existing branch-local docs and ADRs, including
   `docs/specs/stage-entity-model.md`.

### S2 - Add Stage Entity Model Reference Doc

Requirement trace: 2 through 8, 12.
Verification trace: manual doc readback, doc path validation, and targeted
markdown lint.

1. Add `docs/specs/stage-entity-model.md`.
2. Put definitions, examples, role tables, representation kinds, terminology,
   conceptual persisted sketches, authoring operations, and migration notes in
   this doc.
3. Mark sketches as conceptual and not the current persisted bundle schema.
4. Keep the doc free of concrete Linear ids and Linear URLs.
5. Link the new ADR as the rationale source.

### S3 - Update Indexes

1. Add the new ADR row to `docs/adr/README.md`.
2. Put it under Proposed unless the ADR status is Accepted at edit time.
3. Keep row title aligned with the ADR H1.
4. Add the Stage entity model doc row to `docs/specs/README.md`.
5. Add `MAP.md` navigation entries for the Stage entity model doc and ADR.

### S4 - Validate and Read Back

Requirement trace: 1 through 12.
Verification trace: validator output, grep output, changed-file list, and
pre-PR review report.

1. Run documentation validators.
2. Run markdown lint for the changed files.
3. Search the changed ADR for banned tracker references.
4. Read the ADR once against every requirement in this spec.
5. Run `/shotloom-review-before-pr` before PR creation.

## Acceptance Criteria

- [ ] One new ADR file exists under `docs/adr/`.
- [ ] One new Stage entity model reference doc exists under `docs/specs/`.
- [ ] ADR status and title follow Shotloom ADR conventions.
- [ ] ADR body contains no concrete Linear id or Linear URL.
- [ ] ADR defines Stage as a shot-local authored environment entity.
- [ ] ADR states Stage is not a background asset.
- [ ] ADR states Stage is not a replacement for `PropModel`.
- [ ] ADR separates `StageElement` semantic role/lifecycle from
      `StageRenderable` representation/asset binding.
- [ ] ADR uses `dressing` for stage-owned environment objects.
- [ ] ADR states `mesh` is representation, not role, and leaves room for
      Gaussian splat, panorama, cubemap, void, collision proxy, and nav hint
      representations.
- [ ] ADR records compatibility with `StageEnvironment`, `StageRequest`, and
      `spawn_background_props`.
- [ ] ADR consequences cover core model, bridge/TS, runtime hydration,
      editor UI, asset/import, and migration.
- [ ] ADR alternatives include the four STL-448 alternatives.
- [ ] ADR non-goals exclude implementation, bridge schema, bundle schema, and
      follow-up issue creation.
- [ ] Stage entity model reference doc contains examples/details that are not
      embedded in the ADR.
- [ ] Conceptual sketches in the reference doc are labeled non-authoritative
      for current persisted schema.
- [ ] `docs/adr/README.md` links to the ADR.
- [ ] `docs/specs/README.md` links to the Stage entity model reference doc.
- [ ] `MAP.md` links to the Stage entity model reference doc and ADR.
- [ ] No Rust, TypeScript, contract schema, or bundle format files change.

## Verification

- `node scripts/validate-doc-paths.mjs`
- `node scripts/validate-durable-doc-linear-refs.mjs`
- Targeted markdown lint for `docs/adr/README.md` and the new ADR file.
- `rg -n "STL-[0-9]+|linear\\.app" docs/adr/adr-00XX-stage-entity-model.md`
  returns no matches.
- `git diff --name-only origin/main..HEAD` contains only:
  - `MAP.md`
  - `docs/adr/README.md`
  - `docs/adr/adr-00XX-stage-entity-model.md`
  - `docs/specs/README.md`
  - `docs/specs/stage-entity-model.md`
- Manual repro: N/A because the PR introduces no user-facing runtime behavior,
  diagnostic, rejection, command, or event.
- Manual readback:
  - Requirement 1 through 12 are each represented in the ADR, reference doc, or
    index.
  - Alternatives and non-goals match STL-448 scope.
  - No candidate draft file is linked unless it exists in this branch.
  - The ADR does not copy examples or a full Rust model sketch.
  - Examples/details live in `docs/specs/stage-entity-model.md`.

## Traps

- Do not include `STL-448`, `STL-446`, or Linear URLs in the ADR body.
- Do not link to `stage-concept-candidate-*` files unless the PR also adds
  them.
- Do not put example JSON, Rust sketches, role tables, or operation tables in
  the ADR body.
- Do not implement `StageModel`, `StageElement`, `StageRenderable`, or new ids.
- Do not turn the ADR into a full bundle schema proposal.
- Do not change `spawn_background_props`.
- Do not rename current `PropModel` or `StageEnvironment` in this PR.
- Do not create follow-up Linear issues from this task.

## Follow-Up Candidates

- Final Stage product/domain spec under `docs/specs/`.
- Rust model implementation for shot-local Stage data.
- Bridge and TypeScript contract design for Stage authoring operations.
- Migration path from background map prop tags into Stage provenance.
- Editor Stage inspector and stage edit mode design.
