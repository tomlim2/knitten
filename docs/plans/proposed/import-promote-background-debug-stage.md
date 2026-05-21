---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-453
repo: shotloom
linear: STL-453
briefing: ../../briefings/shotloom/import-promote-background-debug-stage.md
---

# Promote Background Debug Import To StageModel

## Spec Contract

- Task: `STL-453 - feat(import): background prop debug path to Stage import`.
- Scope: define the implementation plan that turns the current debug-only background prop import path into a StageModel import path while preserving the old background prop compatibility commands.
- Input: current Shotloom `main` at `4c6843a`, the STL-453 Linear brief, Stage ADR/spec documents, current `spawn_background_props` behavior, and the existing Stage runtime topology.
- Output: one proposed implementation plan with locked decisions, non-goals, acceptance criteria, and verification commands.
- Stop line: this document prepares implementation. Do not edit Shotloom source until the implementation start is explicitly accepted and the remaining blocker state is rechecked.

## Current State

| Area | Evidence path | Current behavior | Implication for STL-453 |
| --- | --- | --- | --- |
| Background debug import | `crates/shotloom-engine/src/bridge/handlers/props.rs`, `crates/shotloom-engine/src/bridge/tests/props.rs` | `spawn_background_props` resolves map placements to `PropModel`s, tags them with background provenance, emits prop events, and writes into `shot.props`. | This path must remain compatible and must not silently change semantics. |
| Background cleanup | `docs/ipc/bridge-contract.md` section 14.2c, `crates/shotloom-engine/src/bridge/tests/props.rs` | `clear_background_props` removes only props tagged with `background_map`; no-op clear is eventless. | Cleanup remains prop-specific; Stage import should not rely on this command. |
| Stage wire contract | `docs/ipc/bridge-contract.md` section 13A.2, `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts` | Stage command DTOs and Stage success events exist; Stage commands are `DurableMutation` commands and use client-provided destination ids. | The import command must mirror Rust/TS/docs/snapshots and must not invent runtime-generated ids. |
| Stage authoring handlers | `crates/shotloom-engine/src/bridge/handlers/stage.rs`, `crates/shotloom-engine/src/bridge/tests/stage.rs` | Engine handlers currently reject authored Stage commands with `INVALID_STAGE_PAYLOAD` and the temporary not-implemented message. | STL-453 must either wait for the handler work or implement a narrow independent import handler. |
| Stage runtime topology | `docs/arch/stage-runtime-topology.md`, `crates/shotloom-engine/src/stage_runtime.rs`, `crates/shotloom-engine/src/bridge/tests/model_sync.rs` | Stage runtime hydration exists for `StageModel` and intentionally does not attach `Prop`, `ShotEntityIdComponent`, or `BridgeEntityId` to Stage runtime entities. | Imported content should become Stage-owned content, not hidden PropModel content. |
| Stage content validation | `docs/adr/adr-0054-stage-content-load-time-validation.md`, `crates/shotloom-core/src/model/stage.rs`, `crates/shotloom-core/src/model/shot.rs` | Invalid persisted Stage content is load-blocking. Tags and renderable options have explicit limits. | The import path must canonicalize tags/options before writing to the bundle. |
| Stage map parser | `docs/specs/stage-map-document.md`, `crates/shotloom-stage/src/map_document.rs` | `shotloom-stage` parses and resolves source map documents without depending on the persisted `StageModel`. | StageModel conversion belongs outside the parser crate. |
| Editor debug samples | `apps/editor/src/components/debug/stageImportSamples.ts`, `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Sample data preserves S2M-ish source provenance locally, but the current dispatch converts it to the background prop payload. | The Stage import proof path should consume source-aware sample data before it is reduced to prop placements. |

## Linear Briefing

| Item | Current reading | Planning consequence |
| --- | --- | --- |
| Issue state | `STL-453` is In Progress under parent `STL-457`. | Continue planning, but do not implement until this spec is accepted. |
| AC summary | map document import can create/update `StageModel`; import preserves source/provenance; background prop debug button/command is not immediately broken; docs mention migration/compatibility; existing prop tests and new Stage import tests pass. | The spec must protect both the new Stage import path and the old prop path. |
| Cleared blocker | `STL-452` is merged as PR `#385`; its blocking relation was removed from `STL-453`. | Stage runtime topology can be used as implementation proof. |
| Remaining blocker | `STL-495` remains a blocker. PR `#384` is open with green CI at the time of this spec, but not merged. | Recheck before implementation. If still unmerged, either stop for user approval to stack on that PR or keep this import handler independent of unfinished Stage authoring handlers. |
| Related work | `STL-489`, `STL-455`, `STL-496`, `STL-420`, and `STL-430` are related/downstream inputs. | Keep actual S2M asset ingestion, production connector scope, and full Stage UI out of this PR. |

## Problem

The debug import path currently proves background placement by spawning Shot-owned props. That was useful for quick visual feedback, but it bypasses the Stage entity model. As a result, imported environment content is not represented as Stage-owned `shell`, `structure`, `fixture`, `set_dressing`, `zone`, `proxy`, or `anchor` content, and it cannot exercise the Stage runtime topology or Stage validation rules.

STL-453 should promote the debug import path so source map content can create or update a shot-local `StageModel`. The legacy prop path must still exist because existing tests, debug workflows, and cleanup semantics depend on it.

## Options Considered

### Option A: Change `spawn_background_props` To Write StageModel

Rejected. The command name, events, tests, and cleanup behavior are prop-specific. Changing it to write StageModel would make the compatibility path misleading and would break the explicit separation between PropModel and Stage-owned content.

### Option B: Add Only A Pure Conversion Helper

Rejected as the only STL-453 deliverable. A pure helper is useful, but it does not prove the debug import path can create/update persisted Stage data or participate in bridge-side validation/event flow.

### Option C: Add A Narrow Stage Map Import Command

Selected. Add a new source-aware Stage import path named `import_stage_map_document` that writes StageModel content while keeping `spawn_background_props` and `clear_background_props` unchanged. The command should reuse existing Stage DTO/event vocabulary where possible and should not introduce a production StoryPreviz API.

### Option D: Stack Directly On PR #384

Not selected as the default. If `#384` merges before implementation, use its Stage authoring helpers. If it remains open, do not stack without explicit user approval unless the implementation can stay independent of that PR.

## Requirements

### R1. Preserve Legacy Background Prop Compatibility

- `spawn_background_props` must continue to create `PropModel`s.
- `clear_background_props` must continue to remove only props tagged with `background_map`.
- Existing prop tests should remain valid, with new regression coverage if Stage import touches adjacent bridge code.

### R2. Import Into Stage-Owned Content

- The new import path creates or updates `ShotModel.stages`.
- Imported content must not create `PropModel`s by default.
- The command must use client-provided `stage_id`, `element_id`, and `renderable_id` values for records it creates, following the authored Stage command contract.
- Stage runtime hydration should be able to consume the imported `StageModel` without attaching Prop components.
- If no active Stage exists for the target shot, the import may set `active_stage_id` to the created/imported Stage. Updating an existing active Stage should preserve the active selection.

### R3. Preserve Source Evidence And Role Decisions

Each imported element should preserve enough evidence to trace the source placement:

- `source_system`
- `source_document_id`
- `source_object_id`
- `source_category`
- `role_hint`
- selected Stage `role`
- selected representation kind

The source category is advisory. Stage owns the final semantic role. For example, a StoryPreviz/MiniCineV `fixture`-like source category may map to Stage `fixture`, while furniture or decorative objects should usually map to `set_dressing`.

### R4. Keep Stage Map Parsing Runtime-Agnostic

- Do not move persisted `StageModel` construction into `crates/shotloom-stage`.
- Keep `shotloom-stage` focused on parsing and resolving map documents.
- Put StageModel conversion in a Shotloom core/engine layer that already knows the persisted model and bridge DTOs.

### R5. Define Reimport Semantics

Use a stable source key for matching imported elements:

```text
(source_system, source_document_id, source_object_id)
```

On reimport:

- update source-owned renderable/provenance fields for matched elements;
- preserve author-facing fields such as element id, display name, visibility, lock state, user-adjusted base transform, and user-added tags where possible;
- add new source objects as new Stage elements using client-provided destination ids;
- do not delete missing source objects in the first implementation. Instead, record diagnostics or leave them untouched so user edits are not lost.
- if the source key matches an existing element but the incoming `element_id` differs, keep the existing element id and update source-owned fields only.

### R6. Treat Asset Binding Conservatively

- Do not bind prop fallback assets as `StageRenderable.asset_id` unless the asset kind is valid for Stage renderables.
- Assetless Stage renderables are allowed by current validation and can carry source evidence in `StageSourceRef`/renderable options.
- Actual S2M GLB/Gaussian/StageRenderable asset loading remains a follow-up, not part of STL-453.

### R7. Reuse Existing Stage Events Where Possible

- Prefer existing Stage success events such as `stage_created` and `stage_updated` over adding new event types.
- Emit `bundle_changed` after mutating the shot bundle, consistent with existing bridge behavior.
- Rejections should use existing stage/shot/payload rejection codes where possible.
- Mark the command as a `DurableMutation`, matching other Stage authoring and background prop mutation commands.

### R8. Update The Debug Surface Without Making It Production UI

- The debug panel may expose a Stage import action or mode for the existing sample data.
- The old background prop spawn/clear buttons should remain available unless a later issue removes them.
- The debug panel should make it possible to prove both compatibility paths: legacy PropModel spawn and StageModel import.

### R9. Keep Bridge Mirrors In Sync

- A new bridge-visible command must update Rust `BridgeCommand`, TypeScript command unions, JSON shape tests/snapshots, IPC command/event docs, JSON examples, transaction-class tests, rejection-code docs, and related ADR/spec links in the same PR.
- Optional fields must have the same omitted-field/default meaning in Rust serde, TypeScript, docs, and fixtures.
- Free-form import fields such as tags, options, source metadata, and transforms must be bounded by existing Stage validators or explicitly rejected.

## Requirement Trace

| Requirement | Authority | Design plan stages | Verification |
| --- | --- | --- | --- |
| R1 | Linear AC3, `docs/ipc/bridge-contract.md` sections 14.2b/14.2c, existing props tests | S0, S5 | existing `spawn_background_props` / `clear_background_props` tests |
| R2 | Linear AC1, ADR-0050, Stage runtime topology doc | S1, S2, S3 | Stage import create test, Stage runtime hydration/model sync assertion |
| R3 | Linear AC2, `docs/specs/stage-entity-model.md`, `stageImportSamples.ts` | S1, S2 | source-ref/role mapping assertions |
| R4 | `docs/specs/stage-map-document.md`, crate boundary precedent | S2 | compile boundary plus no `shotloom-stage` dependency on persisted StageModel |
| R5 | user clarification about source-friendly import and later reuse | S2, S3 | reimport update test with preserved authored fields |
| R6 | ADR-0054, `validate_stage_refs_with_assets` behavior | S2, S3 | assetless renderable validation and wrong-kind asset rejection test |
| R7 | existing bridge mutation/event contract | S1, S3 | event ordering, transaction class, and model sync tests |
| R8 | Linear AC3, existing debug panel tests | S4, S5 | editor dispatch tests for both old and new debug actions |
| R9 | Shotloom bridge contract standards | S1, S5 | Rust/TS/docs/snapshot drift tests |

## Risk Map

| Risk row | Evidence | Plan response | Test proof |
| --- | --- | --- | --- |
| Error source chain | `shotloom-stage` parser errors already preserve typed parse/read/schema causes; this spec should not add raw file parsing. | Keep STL-453 on resolved/debug payloads and StageModel validation. If a new error type is added, preserve typed `#[source]` for wrapped parser/serde errors. | No new parser error expected. If one is added, assert `Error::source()` for wrapped external errors. |
| Schema compatibility | Bridge DTOs are mirrored in Rust, TS, docs, and JSON tests; omitted field drift is easy. | Define default/omitted semantics in the spec and update all mirrors in one PR. | Rust serialization test, TS wire-shape test, IPC example, transaction class test. |
| Ownership/API boundary | `spawn_background_props` writes `PropModel`; Stage import must write `StageModel`. | Add a distinct command and keep old command/clear behavior unchanged. | Tests assert imported Stage elements do not append `shot.props`, and legacy prop tests still pass. |
| Partial mutation/rollback | Stage content validation is load-blocking; a half-written invalid Stage would corrupt persisted bundle state. | Build the new/updated StageModel in memory, validate, then commit. Roll back/reject on validation failure. | Invalid payload/bundle validation tests assert no stage or prop mutation after rejection. |
| Diagnostic ownership | Existing prop diagnostics belong to background prop spawn; Stage diagnostics belong to Stage import. | Do not reuse prop diagnostic labels for Stage import. Put source/import diagnostics on Stage import output or StageModel diagnostics. | Tests assert wrong-kind/skipped placement diagnostics are Stage import diagnostics, not prop spawn diagnostics. |
| Test oracle strength | Event-only success can pass while persisted model is wrong. | Require post-state assertions on `ShotModel.stages`, `active_stage_id`, events, model sync, and `shot.props`. | Stage import create/update/reimport tests inspect model state and event order. |
| Scope creep | Related issues cover real S2M assets, production connectors, shared stages, and full UI. | Keep production import, GLB/Gaussian loading, shared catalog, and full CRUD UI as non-goals. | PR checklist links non-goals; no files outside bridge/debug/docs/model tests unless required by this spec. |
| Reviewer objection | A new command is a bridge contract change and normally ask-first. | This spec makes the bridge change explicit and reviewable before implementation. S0 rechecks blocker/stacking before source edits. | Review includes command matrix, rejection matrix, docs/snapshot updates, and explicit implementation gate. |
| Drift surface | Stage role/source mappings and command fields can drift across Rust, TS, docs, and tests. | Add shared constants or exhaustive mirror tests; update contract examples and related ADR/spec links in the same PR. | Rust/TS wire-shape tests plus docs examples covering every required field and mapping row. |
| Asset-kind mismatch | Current debug prop assets are `Prop`, while Stage validation requires `stage_renderable` asset kind for referenced assets. | Keep first import assetless or bind only valid StageRenderable assets. | Wrong-kind asset hint rejects; assetless renderable validates. |
| User-authored data loss | Reimport can overwrite edits if it treats source as authoritative for all fields. | Match by source key, update source-owned fields, preserve authored fields, and do not delete missing source objects in first implementation. | Reimport test changes display name/visibility/base transform/tags before reimport and asserts preservation. |

## Locked Decisions

1. Keep `spawn_background_props` as the legacy prop compatibility command.
   Rationale: it already has prop-specific events, diagnostics, cleanup behavior, and tests.
   Rejected alternatives: changing the command to write StageModel or silently migrating its output.
2. Add a separate Stage import path instead of overloading the prop command.
   Rationale: import-to-Stage is a different ownership boundary and needs source-aware DTOs.
   Rejected alternatives: adding optional Stage fields to `spawn_background_props`, or relying on an editor-only helper with no bridge proof.
3. Stage import writes Stage-owned content only; it does not auto-create `PropModel`s.
   Rationale: ADR-0050 separates Stage-owned environment content from Shot-owned props, with promotion as an explicit later operation.
   Rejected alternatives: creating both Stage elements and props in one import, or using props as the runtime representation for Stage content.
4. StageModel conversion does not live in `shotloom-stage`; that crate stays parser/resolver focused.
   Rationale: `shotloom-stage` is the runtime-agnostic map document layer and should not depend on persisted bundle model types.
   Rejected alternatives: making the parser produce `StageModel` directly or moving bridge DTO decisions into the parser crate.
5. Reimport is additive/upsert-first and does not delete source-missing elements in the first implementation.
   Rationale: imported Stage content may be edited by users after import, and deletion policy needs an explicit diff/preview story.
   Rejected alternatives: destructive source mirroring, clear-and-recreate import, or automatic deletion of missing source objects.
6. Stage import does not require real StageRenderable asset loading in STL-453.
   Rationale: current debug assets are prop-oriented and actual S2M GLB/Gaussian ingestion is tracked separately.
   Rejected alternatives: blocking STL-453 on asset ingestion or binding prop assets as Stage renderables.
7. Destination Stage, element, and renderable ids are client-provided in the import payload.
   Rationale: the existing Stage authoring contract already requires client-supplied ids for created records.
   Rejected alternatives: runtime-generated ids, deriving ids only from display names, or accepting missing source object ids.

## Non-Goals

- Remove or rename `spawn_background_props` / `clear_background_props`.
- Build the full production StoryPreviz or S2M connector API.
- Implement GLB, Gaussian splat, or external StageRenderable asset ingestion.
- Implement shared bundle-level Stage catalogs or cross-shot shared Stage ownership.
- Promote Stage content into Shot-owned `PropModel`s.
- Build full editor Stage CRUD UI.
- Change the Stage role vocabulary from ADR-0050 / the Stage entity model spec.
- Change bundle load-time validation policy.

## Design Plan

### S0. Baseline And Blocker Recheck

Input:

- current `main`
- `STL-453`
- `STL-495`
- PR `#384`

Output:

- confirmed implementation base branch;
- explicit decision to wait for, use, or stack on `#384`;
- list of unchanged legacy background prop tests to protect.

Non-output:

- no source edits;
- no new branch stacking decision without explicit user approval if `#384` is still unmerged and required.

Failure:

- base branch is stale, `#384` changed the Stage command contract, or Linear blockers changed.

Proof:

- record `git rev-parse HEAD`, `git status --short`, current PR `#384` state, and selected implementation base in the PR body.

Implementation gate:

- If `STL-495`/`#384` is still unmerged and the implementation needs its helpers, stop and ask before code changes.

### S1. Wire Contract And DTO Shape

Input:

- current bridge command matrix;
- existing Stage DTO/event types;
- debug sample placement shape.

Output:

- a narrow Stage import command contract named `import_stage_map_document`;
- TypeScript bridge types and Rust DTOs;
- documented rejection cases;
- no change to existing background prop command contracts.

Non-output:

- no production StoryPreviz connector;
- no new event type unless existing Stage events cannot express the mutation.

Failure:

- Rust, TypeScript, IPC docs, transaction class tests, or JSON snapshots disagree on the wire shape.

Proof:

- Rust command serialization test;
- TypeScript command union test;
- IPC contract update;
- `transaction_class()` test proving `DurableMutation`.

Expected command shape:

```text
import_stage_map_document {
  shot_id,
  stage_id,
  display_name,
  source_system,
  source_document_id,
  source_title?,
  placements: [
    {
      element_id,
      renderable_id,
      source_object_id,
      source_category,
      display_name?,
      role_hint?,
      representation_hint?,
      transform,
      asset_hint?
    }
  ]
}
```

DTO/default semantics:

| Field | Required | Omitted meaning |
| --- | --- | --- |
| `shot_id` | yes | reject as malformed command payload before handler or `SHOT_NOT_FOUND` after id parsing. |
| `stage_id` | yes | no runtime-generated Stage id. |
| `display_name` | yes | used for create; existing Stage display name is preserved on reimport unless implementation explicitly documents otherwise. |
| `source_system` | yes | part of stable source identity. |
| `source_document_id` | yes | part of stable source identity. |
| `source_title` | no | no fallback semantics beyond diagnostics/display metadata. |
| `placements` | yes, non-empty | empty list rejects as `INVALID_STAGE_PAYLOAD`. |
| `element_id` | yes per new placement | used only when creating a new element; matched existing source key preserves existing id. |
| `renderable_id` | yes per new placement | used for the created/updated primary renderable. |
| `source_object_id` | yes per placement | part of stable source identity. |
| `source_category` | yes per placement | stored as source evidence, not final Stage role. |
| `display_name` per placement | no | importer derives a stable display label from source object id/category only for new elements; existing element display names are preserved. |
| `role_hint` | no | absence uses mapping defaults. |
| `representation_hint` | no | absence uses mapping defaults. |
| `asset_hint` | no | absence creates an assetless Stage renderable. Present hints must resolve to valid StageRenderable assets or reject before mutation. |

Rejection matrix:

| Failure | Expected code | Proof |
| --- | --- | --- |
| unknown or malformed `shot_id` | `SHOT_NOT_FOUND` | engine handler test |
| malformed `stage_id`, `element_id`, or `renderable_id` | `INVALID_STAGE_PAYLOAD` | engine handler test |
| invalid Stage/display element name | `INVALID_DISPLAY_NAME` | engine handler test |
| empty placements, missing source identity, duplicate new element/renderable ids, invalid tags/options, or inconsistent ids | `INVALID_STAGE_PAYLOAD` | engine handler tests |
| NaN or Inf transform component | `NON_FINITE_TRANSFORM` | engine handler test |
| referenced asset id missing | `ASSET_NOT_FOUND` | engine handler test if asset binding is accepted |
| referenced asset has non-StageRenderable kind | `UNSUPPORTED_ASSET_KIND` | engine handler test |
| post-mutation bundle validation fails | `BUNDLE_VALIDATION_FAILED` and rollback | rollback test |

### S2. Source-To-Stage Mapping Helper

Input:

- Stage import payload or resolved map document placements;
- existing `ShotModel`;
- existing Stage role and representation enums.

Output:

- new or updated `StageModel`;
- import diagnostics for skipped or ambiguous placements;
- source refs and canonical tags/options within validation limits.

Non-output:

- no file IO or raw map document parsing;
- no `PropModel` creation;
- no dependency from `shotloom-stage` back to persisted StageModel types.

Failure:

- mapping creates invalid tags/options, invalid ids, non-finite transforms, or ambiguous duplicate source keys.

Proof:

- pure/helper tests for mapping defaults;
- post-mapping `validate_stage_refs` / Stage content validation;
- duplicate source-key and wrong-kind asset tests.

Mapping defaults:

| Source signal | Default Stage role | Notes |
| --- | --- | --- |
| shell/background envelope | `shell` | Environment envelope or large background shell. |
| wall/floor/doorframe/stair/rail | `structure` | Fixed spatial structure. |
| fixture-like source object | `fixture` | Attached or built-in object, not freely dressed. |
| furniture/decor/small background object | `set_dressing` | Stage-owned visual dressing, not a Shot prop. |
| spawn point/socket/attachment marker | `anchor` | Authoring or connector target. |
| area/volume | `zone` | Spatial metadata. |
| simplified blocker/collision helper | `proxy` | Proxy representation or occlusion/collision helper. |

### S3. Engine Import Handler

Input:

- validated command payload;
- current shot bundle state;
- mapping helper output.

Output:

- persisted `ShotModel.stages` mutation;
- `active_stage_id` update only when the import creates the first/target active Stage;
- `stage_created` or `stage_updated` event;
- `bundle_changed` event;
- model sync request.

Non-output:

- no call to `spawn_prop`;
- no mutation of `shot.props`;
- no cleanup of legacy background props.

Failure:

- validation rejection leaves `ShotModel.stages`, `active_stage_id`, and `shot.props` unchanged.

Proof:

- accepted create test asserts one Stage, expected elements/renderables/source refs, active stage behavior, event order, and trailing sync;
- accepted update/reimport test asserts preserved authored fields;
- rejection tests assert rollback and no PropModel creation.

The handler must not call `spawn_prop` and must not append imported elements to `shot.props`.

### S4. Debug Panel Proof Path

Input:

- existing Stage import debug samples;
- current debug panel buttons.

Output:

- a debug action that dispatches the Stage import path;
- retained legacy spawn/clear actions for background props;
- UI copy that keeps the feature clearly debug-scoped.

Non-output:

- no full Stage CRUD interface;
- no production connector controls;
- no automatic clear of legacy props after Stage import.

Failure:

- button dispatches the old prop payload when Stage import is selected, drops source provenance, or disables legacy prop actions.

Proof:

- React test asserts Stage import dispatch uses source-aware payload with client-provided ids;
- existing debug panel tests still assert `spawn_background_props` and `clear_background_props` paths.

### S5. Documentation And Regression Coverage

Input:

- changed command/DTO behavior;
- Stage import mapping decisions.

Output:

- updated IPC/bridge docs if a command is added;
- updated Stage map or Stage entity docs only where the implementation makes them stale;
- regression tests for Stage import create/update/reimport behavior;
- unchanged legacy background prop tests.

Non-output:

- no ADR rewrite unless implementation discovers a contradiction with ADR-0050/0054;
- no contract/stage-map schema ownership change unless the command consumes that schema directly.

Failure:

- docs describe a command/event shape that differs from Rust/TS types, or tests only prove event success without persisted state assertions.

Proof:

- doc diff includes command matrix and examples;
- Rust/TS snapshot tests match docs;
- PR body lists exact verification commands and any substituted test names.

## Drift Prevention

- The implementation PR must add one Rust serialization test for the command and one TypeScript wire-shape test using the same required/optional field set.
- The IPC contract command matrix, rejection table, and transaction-class docs must be updated with the same wire name.
- Event tests must assert observable state through `stage_created`/`stage_updated`, `bundle_changed`, and model sync or documented sync derivation.
- If Stage role/source mappings are encoded as strings in more than one place, use a shared constant table or exhaustive tests that cover every documented mapping row.

## Design Plan Trace

| Stage | Requirements | Primary risk rows | Verification item |
| --- | --- | --- | --- |
| S0 | R1, R2, R7 | reviewer objection, scope creep | base/Linear/PR recheck recorded before implementation |
| S1 | R2, R7, R9 | schema compatibility, ownership/API boundary | Rust/TS wire shape and transaction-class tests |
| S2 | R2, R3, R4, R5, R6 | asset-kind mismatch, user-authored data loss, diagnostic ownership | mapping, validation, wrong-kind asset, and reimport tests |
| S3 | R1, R2, R5, R7 | partial mutation/rollback, test oracle strength | post-state, event order, rollback, and no-prop-mutation tests |
| S4 | R1, R3, R8 | scope creep, schema compatibility | debug panel dispatch tests for old and new paths |
| S5 | R1, R7, R9 | reviewer objection, drift surface | docs/snapshot parity plus full verification list |

## Import Boundary Matrix

| Boundary | Accepted source kind | Target kind | Wrong-kind handling |
| --- | --- | --- | --- |
| Source document identity | debug/sample map source with `source_system`, `source_document_id`, and per-placement `source_object_id` | Stage provenance/source refs | reject missing identity as `INVALID_STAGE_PAYLOAD`. |
| Semantic role | source category and role hint | explicit Stage role | keep source category as evidence; unknown categories map through defaults with a Stage import diagnostic rather than becoming final semantics. |
| Renderable asset | omitted asset or valid StageRenderable asset | `StageRenderable.asset_id` or assetless renderable | `ASSET_NOT_FOUND` for missing ids; wrong asset kind rejects with `UNSUPPORTED_ASSET_KIND`. |
| Ownership | Stage import command | `ShotModel.stages` | no `PropModel` creation; tests fail if `shot.props` changes. |
| Legacy compatibility | existing background prop command | `ShotModel.props` | no StageModel creation from `spawn_background_props`; existing tests protect this. |

## One-PR Suitability

This is suitable for one implementation PR only if the first PR stays limited to a debug-scoped Stage import command, source-to-Stage mapping, debug panel dispatch proof, tests, and matching docs. It stops being one reviewable PR if it also attempts production StoryPreviz ingestion, real GLB/Gaussian asset loading, shared Stage catalogs, full Stage CRUD UI, or automatic migration/deletion of legacy background props.

## Acceptance Criteria

- A Stage import path exists that can create a `StageModel` from debug/background map source data.
- Reimport updates matched Stage elements using the stable source key and preserves user-facing fields where possible.
- Imported Stage renderables validate under existing Stage content validation.
- Legacy `spawn_background_props` and `clear_background_props` behavior remains intact.
- Existing background prop tests still pass.
- New tests prove import create, import update, invalid payload rejection, and no accidental PropModel creation.
- Bridge/IPC docs match the final command/event behavior.

## Verification

Run the smallest useful checks first, then expand:

```sh
cargo test -p shotloom-core stage
cargo test -p shotloom-engine --lib stage_import
cargo test -p shotloom-engine --lib spawn_background_props
pnpm test:web -- StageImportDebugPanel
pnpm validate:docs
```

If test names differ after implementation, record the exact replacements in the PR body.

Manual repro after implementation:

- In the debug panel, trigger legacy background prop import and confirm prop behavior still works.
- Trigger Stage import for one sample and confirm Stage state is created/updated without new shot-owned props.
- Re-trigger the same Stage import after editing a Stage element display name or visibility and confirm reimport does not erase the authored field.
- Trigger an invalid payload path from tests or a dev-only harness and confirm the expected rejection code/status is visible.

## Traps

- Do not use the existing `background_map` tag as the only reimport identity. It is too broad; source object identity must participate.
- Do not silently convert source `fixture` into Stage `set_dressing` or vice versa. Store the source category and persist the selected Stage role.
- Do not bind existing prop assets as Stage renderables unless the asset kind is valid.
- Do not delete source-missing Stage elements on first implementation. That would make reimport destructive.
- Do not hide a bridge protocol change by treating it as internal-only. If a command/DTO is added, update the contract docs and tests.

## Follow-Up Candidates

- `STL-489`: S2M GLB or StageRenderable asset ingestion.
- Stage import preview and diff UI before applying reimport.
- Shared Stage grouping for multiple shots that reference the same environment.
- Source connector support for StoryPreviz/MiniCineV documents beyond debug samples.
- Stage element deletion/archive policy for source-missing objects.
