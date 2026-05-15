---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-421 — stage POC map document bundle layout
repo: shotloom
linear: STL-421
---

# Define local stage map document bundle layout

## Cold-Start Summary

Shotloom already has prop import, prop spawn, stage environment preservation,
and the cross-crate `Diagnostic` shape, but it has no committed local map
document contract for the stage import POC. STL-421 should land the smallest
durable contract that STL-422, STL-423, STL-424, and STL-425 can share: the
local bundle directory layout, the normalized JSON document schema/example, GLB
lookup fields, transform representation, background ownership semantics, and
diagnostic code conventions. This is a contract/documentation PR; parser,
bridge command, clear-all behavior, and editor buttons remain follow-ups.

## Current State

| Surface | Path | State |
|---|---|---|
| Stage POC roadmap | `docs/roadmap/single-stage-import.md` | Missing in `origin/main`; present only as a dirty main-checkout local file. Do not depend on it unless this PR also creates or updates it intentionally. |
| Roadmap index entry | `docs/roadmap/README.md` | Missing in `origin/main` for stage import; present only as dirty main-checkout local edit. |
| Story Previz survey docs | `docs/map-info-extraction.md`, `docs/exported-map-info-survey.md` | Missing in the Shotloom worktree. Treat STL-420 comment as the available shared source until those docs land. |
| Local POC root | `/Users/deemooooooooo/Downloads/props` | Exists locally and contains many `.glb` files; no `map-documents/*.json` files were found. |
| Stage environment persistence | `crates/shotloom-core/src/model/entity.rs` | Already Done: `StageEnvironment { map, mood, mood_filter }` preserves map token in bundle data. |
| Stage DTO | `crates/shotloom-stage/src/lib.rs` | Already Done: `StageRequest { mood, map_id }` is an internal engine DTO and is not serialized. |
| Stage mediation | `crates/shotloom-engine/src/stage_mediation.rs` | Partial: pure `StageEnvironment` to `StageRequest` mapping exists, but it is not wired into bundle-load path. |
| Imported prop asset path overlay | `crates/shotloom-engine/src/bundled_asset_source.rs` | Already Done for imported `assets/props/<asset_id>.glb`; no map document path resolution exists. |
| Prop asset spawn command | `crates/shotloom-core/src/bridge/mod.rs`, `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done for one registered prop asset and viewport-center placement; no document-transform batch spawn command exists. |
| Prop spawn tests | `crates/shotloom-engine/src/bridge/tests/props.rs` | Already Done for one prop asset spawn and SceneRoot attachment; no map-document batch fixture exists. |
| Asset catalog metadata | `crates/shotloom-core/src/model/asset.rs` | Partial: `AssetRecord.metadata` can hold arbitrary JSON, but no ownership tag convention exists for map-document-spawned background props. |
| Diagnostics shape | `crates/shotloom-common/src/diagnostic.rs`, `docs/ipc/bridge-contract.md` §23.1, `docs/specs/error-ux.md` | Already Done: `Diagnostic` uses `severity`, bare snake_case `code`, `source`, optional `suggestion`, `recoverable`, and `location`. |
| Prop import diagnostics precedent | `crates/shotloom-engine/src/bridge/handlers/assets.rs` | Already Done: prop import emits `ValidationDiagnostics` before `CommandRejected` with `source: "prop_import"`. |
| Editor debug route | `apps/editor/src/components/debug/*`, `apps/editor/src/App.tsx` | Already Done for `/debug/*` placeholder route; STL-418 may rename route namespace to `/dev/*`. STL-421 should avoid depending on route spelling. |
| STL-420 decomposition | Linear STL-420 body/comment | Already Done in Linear: STL-421 blocks STL-420 and STL-422; related STL-425 owns the debug panel. |

## Problem

The downstream stage import work has a shared contract gap. Without a committed
map document layout and schema, STL-422 cannot write a parser/resolver without
guessing field names, STL-423 cannot define the batch spawn command without
guessing transform and ownership semantics, STL-424 cannot safely clear only
document-spawned background props, and STL-425 cannot know which three fixed
load cases it should dispatch. The contract also needs to distinguish "missing
or fixture data that is acceptable for the POC" from hard parser failures that
make the POC invalid.

## Locked Decisions

1. **Add the normalized map document contract under `contracts/stage-map/`.**

   Rationale: STL-421 defines a parser input shared by Rust parser/resolver,
   bridge batch spawn, and editor debug UI. AFDS requires cross-module
   interfaces to be machine-readable and owned by `contracts/`. The contract is
   not an S2M schema change; it is an offline POC artifact consumed by Shotloom.

   Rejected alternatives: putting the schema only in `docs/roadmap/` would make
   it prose-owned and harder to validate; putting it under `contracts/s2m/`
   would imply the S2M v3 interface owns this offline normalized document.

2. **Include one checked-in minimal example document next to the schema.**

   Rationale: STL-421 AC allows "JSON schema or example document", but the
   downstream parser needs both a machine-readable field contract and a concrete
   shape to test against. The example should be tiny and synthetic, not one of
   the full local POC maps, because `/Users/deemooooooooo/Downloads/props` is
   machine-local and the real exported map documents are not present yet.

   Rejected alternatives: committing the three real map JSON files now is not
   possible because they are absent; committing a prose-only example would not
   protect field drift.

3. **Document the local POC layout without committing local GLB or map files.**

   Rationale: STL-420 and STL-421 explicitly point at
   `/Users/deemooooooooo/Downloads/props` as a temporary machine-local asset
   root. The repo should define the expected layout and naming convention, not
   vendor local GLBs or generated map documents.

   Rejected alternatives: copying GLBs into the repo risks large binary churn;
   ignoring the local root would leave STL-422 unable to locate the documents.

4. **Use `Map_<id>__Stage<stage>.json` as the file name and `Map_<id>:Stage<stage>` as the normalized `map_id`.**

   Rationale: `contracts/s2m/s2m-interface-v3.schema.json` says map-stage
   tokens normalize `__` to `:` before splitting map/stage. Keeping the file
   name filesystem-safe while storing the normalized token in JSON preserves
   compatibility with the existing S2M grammar.

   Rejected alternatives: using `Map_1004:Stage1.json` is less portable as a
   filename; storing only `Map_1004__Stage1` in JSON would push normalization
   into every consumer.

5. **Represent prop asset lookup as ordered `asset_candidates`, not as one final URI.**

   Rationale: STL-420 comments call out fixture, missing GLB, and unsupported
   prop cases. Ordered candidates allow STL-422 to try exact local paths,
   relative bundle paths, and semantic object-type fallbacks while retaining
   diagnostics for unresolved candidates.

   Rejected alternatives: a single `asset_uri` would make missing-vs-fallback
   diagnostics harder; deriving everything from `object_type` would hide which
   concrete GLB names came from extraction.

6. **Use a transform object with explicit arrays and declared coordinate convention.**

   Rationale: the highest-risk ambiguity is coordinate, origin, scale, and
   rotation. The schema should make transform fields explicit:
   `translation`, `rotation_euler_degrees`, `scale`, and
   `source_coordinate_space`. STL-422 can then parse without guessing the
   source convention, and STL-423 can decide the conversion point.

   Rejected alternatives: a 4x4 matrix is flexible but opaque for debugging;
   unlabeled arrays would invite axis/order mistakes.

7. **Put ownership on spawned prop metadata, with `background_owner` derived from the map document.**

   Rationale: STL-420 identifies background ownership as a blocker for safe
   clear-all. The map document contract should define an ownership tag that
   downstream spawned props copy into `PropModel` or asset/prop metadata:
   `background_owner: { kind: "map_document", map_id, document_id }`. STL-424
   can then clear document-spawned background props without deleting user-spawned
   props.

   Rejected alternatives: clearing by asset ID or display name would also
   remove user-spawned props using the same GLB; clearing all props is unsafe.

8. **Diagnostic codes are local map-document codes with `source: "stage_map_document"`.**

   Rationale: ADR-0021 and `docs/specs/error-ux.md` define bare snake_case
   codes scoped by `source`. STL-421 should define parser/resolver diagnostic
   code names such as `map_document_parse_failed`, `map_asset_missing`,
   `map_asset_unsupported`, `map_asset_fixture`, and
   `map_transform_unverified`, but not add new `CommandRejectionCode` variants.

   Rejected alternatives: prefixing every code with `stage_map_document_` is
   redundant when `source` already scopes it; adding bridge rejection codes is
   out of scope for a contract-only PR.

9. **Keep this PR to contract, docs, and small validation tests only.**

   Rationale: STL-421 is the blocker-definition issue. Parser/resolver code is
   STL-422, batch spawn is STL-423, clear-all is STL-424, and editor buttons are
   STL-425. A single contract PR is reviewable and gives every downstream issue
   a stable target.

   Rejected alternatives: implementing parser plus schema here would blur issue
   ownership and likely force bridge command decisions before the contract is
   reviewed.

## Non-Goals

- No parser, resolver, or runtime loading implementation.
- No new bridge command or bridge event.
- No `CommandRejectionCode` additions.
- No editor debug/dev route or button implementation.
- No clear-all command implementation.
- No real Story Previz live API integration.
- No committed GLB binaries or copied local map JSON exports.
- No full 104-stage registry or 85 pending-stage export automation.
- No production asset catalog for the local props folder.
- No global orientation/scale correction for every prop.

## Implementation Plan

### S0 — Baseline Re-Check

1. Re-run targeted searches for `stage-import`, `map document`,
   `Map_1004`, `asset_candidates`, `background_owner`, and
   `stage_map_document` across `crates`, `apps`, `contracts`, and `docs`.
2. Confirm the branch still lacks `docs/roadmap/single-stage-import.md` and the
   Story Previz survey docs unless another branch has landed them.
3. Confirm `/Users/deemooooooooo/Downloads/props/map-documents/` is still local
   input only and not a repo target.

### S1 — Add the Contract Schema and Example

1. Add `contracts/stage-map/README.md` explaining the POC contract boundary:
   offline normalized Story Previz/MiniCineV export input for Shotloom, not a
   live Story Previz API and not the S2M v3 schema.
2. Add `contracts/stage-map/stage-map-document.schema.json` with:
   - `schema_version`
   - `document_id`
   - `map_id`
   - `title`
   - `source`
   - `asset_root_hint`
   - `objects[]`
   - `diagnostics[]`
3. Define each `objects[]` entry with:
   - `id`
   - `object_type`
   - `display_name`
   - `asset_candidates[]`
   - `transform`
   - `size`
   - `background_owner`
   - `diagnostics[]`
4. Define each `asset_candidates[]` entry with:
   - `kind`: `relative_glb_path`, `absolute_glb_path`, `object_type`, or
     `fixture`
   - `value`
   - optional `confidence`
   - optional `reason`
5. Define `transform` with:
   - `translation`
   - `rotation_euler_degrees`
   - `rotation_order`
   - `scale`
   - `source_coordinate_space`
   - optional `confidence`
6. Add `contracts/stage-map/examples/minimal-stage-map-document.json` with one
   resolved chair-like object, one missing/fixture candidate case, and one
   document-level diagnostic.

### S2 — Document the Local POC Bundle Layout

1. Add or update `docs/specs/stage-map-document.md` as the human-readable
   companion to the contract.
2. Document the local layout:
   ```text
   /Users/deemooooooooo/Downloads/props/
     map-documents/
       Map_1004__Stage1.json
       Map_1006__Stage1.json
       Map_1038__Stage1.json
     <existing prop GLB folders and files>
   ```
3. Document selected-map expectations from STL-420:
   - `Map_1004__Stage1` / Rural Train Station / 2 useful chair props
   - `Map_1006__Stage1` / Classic School Classroom / 32 classroom desk-chair props
   - `Map_1038__Stage1` / Romanesque Cathedral / 72 cathedral chair-bench props
4. Document that expected counts are POC validation targets, not schema
   invariants. The parser should accept any object count.
5. Link the schema and example instead of duplicating every field definition.

### S3 — Lock Diagnostic and Ownership Semantics

1. In `docs/specs/stage-map-document.md`, define diagnostic code conventions:
   - `source: "stage_map_document"`
   - `map_document_parse_failed`
   - `map_document_schema_mismatch`
   - `map_asset_missing`
   - `map_asset_unsupported`
   - `map_asset_fixture`
   - `map_transform_unverified`
2. Define severity defaults:
   - parse/schema failure: `error`
   - all selected-map assets unresolved: `error`
   - individual missing/unsupported/fixture assets while at least one object
     remains placeable: `warning`
   - transform confidence or quality notes: `info` or `warning`, depending on
     whether placement remains usable.
3. Define `background_owner` as the future clear-all key:
   `kind = "map_document"`, `map_id`, `document_id`, and optional
   `object_id`.
4. State that STL-423/STL-424 must preserve user-spawned props by filtering on
   this ownership tag, not by deleting every prop or every prop asset.

### S4 — Wire Documentation Discovery and Validation

1. Update `contracts/README.md` to list `contracts/stage-map/`.
2. Update `MAP.md` if the new contract/spec introduces a new lookup answer.
3. Update `docs/roadmap/README.md` only if the stage import roadmap doc is
   created or already present in the branch; do not reference missing files.
4. Add a lightweight schema validation test if the repo already has a JSON
   schema validation helper available. If no local helper exists, add a focused
   Node script or package-free test only if it can run with existing
   dependencies. Otherwise, rely on `node scripts/validate-doc-paths.mjs` plus
   manual JSON parse validation for this PR.

## Acceptance Criteria

- [ ] `contracts/stage-map/stage-map-document.schema.json` defines the local
      normalized map document shape.
- [ ] `contracts/stage-map/examples/minimal-stage-map-document.json` validates
      against the schema or is at least JSON-parse checked by a focused command.
- [ ] The schema includes `map_id`, `title`, `objects[].id`,
      `objects[].object_type`, `objects[].asset_candidates`,
      `objects[].transform`, `objects[].size`, and diagnostics.
- [ ] The schema or spec defines the three selected local document names:
      `Map_1004__Stage1.json`, `Map_1006__Stage1.json`, and
      `Map_1038__Stage1.json`.
- [ ] The spec documents the local POC bundle layout under
      `/Users/deemooooooooo/Downloads/props` without committing local GLBs or
      exported map documents.
- [ ] GLB lookup rules define ordered candidates and relative path resolution
      from the local POC root.
- [ ] Diagnostic rules cover missing asset, fixture asset, unsupported asset,
      parse/schema failure, and transform uncertainty.
- [ ] Background ownership semantics are defined for future STL-423/STL-424
      batch spawn and clear-all behavior.
- [ ] Discovery docs link to the new contract/spec where applicable.
- [ ] No bridge command, bridge event, parser, resolver, editor route, or
      clear-all implementation is added in this PR.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('contracts/stage-map/stage-map-document.schema.json','utf8')); JSON.parse(require('fs').readFileSync('contracts/stage-map/examples/minimal-stage-map-document.json','utf8'))"` — focused JSON parse check.
- If a repo-local JSON schema validator is available, run it against
  `contracts/stage-map/examples/minimal-stage-map-document.json`.
- `node scripts/validate-doc-paths.mjs` — doc path validation after new links.
- `pnpm validate:durable-doc-linear-refs` — ensure durable docs do not embed
  concrete Shotloom Linear IDs.
- `pnpm lint:md` or targeted markdownlint for changed docs.
- Manual review: confirm the three local map document paths in the spec match
  the STL-420/STL-421 Linear comments.
- Manual review: confirm every diagnostic code is bare snake_case and scoped by
  `source: "stage_map_document"`.
- Manual review: confirm the plan did not add route/button/parser/bridge
  implementation work.

## Traps

- Do not place this schema under `contracts/s2m/`; this is not the S2M v3 wire
  format.
- Do not commit `/Users/deemooooooooo/Downloads/props` files or any local GLB
  binary.
- Do not create `/debug/stage-import` or `/dev/stage-import` UI here; STL-425
  owns the panel and STL-418 may rename the route namespace.
- Do not add a map-document bridge command here; STL-423 owns the batch spawn
  command after STL-422 defines parser output.
- Do not make clear-all delete every prop or every prop asset; STL-424 must
  filter by `background_owner`.
- Do not add new `CommandRejectionCode` variants for map-document diagnostics;
  use `Diagnostic.code` plus `source`.
- Do not make expected object counts schema invariants; they are POC validation
  expectations for the three selected maps.
- Do not treat fixture assets as hard failures when at least one object remains
  placeable; the POC quality bar is "it works at all."

## Follow-Up Candidates

- STL-422: implement local map document parser and GLB resolver against this
  contract.
- STL-423: add a background prop batch spawn command that consumes parsed map
  document output.
- STL-424: add a background asset clear-all command filtered by ownership tag.
- STL-425: add the stage import debug/dev panel with four fixed buttons.
- Commit or regenerate the real `Map_1004__Stage1.json`,
  `Map_1006__Stage1.json`, and `Map_1038__Stage1.json` local POC documents
  if a later decision allows fixtures in repo.
- Promote the POC contract into a production stage asset catalog contract after
  the debug workflow is proven.
- Add full Story Previz live API integration if the local POC succeeds and the
  product needs runtime refresh.
- Add orientation, scale, and asset-quality review tooling for all exported
  stage/prop assets.
