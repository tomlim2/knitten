---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-422 - stage map document parser and GLB resolver
repo: shotloom
linear: STL-422
---

# Add stage map document parser and GLB resolver

## Cold-Start Summary

Shotloom now has the STL-421 stage map document contract on `origin/main`:
`contracts/stage-map/stage-map-document.schema.json`,
`contracts/stage-map/examples/minimal-stage-map-document.json`, and
`docs/specs/stage-map-document.md`. The remaining STL-422 gap is a small Rust
parser and GLB resolver in `crates/shotloom-stage` that consumes that local POC
contract, returns placeable prop data plus diagnostics, and stays below bridge
spawn, editor debug UI, clear-all, and production asset catalog decisions.

## Current State

| Surface | Path | Classification | Finding |
|---|---|---|---|
| Stage crate boundary | `crates/shotloom-stage/src/lib.rs` | Partial | `StageRequest` and `StageStatus` exist; no map document module, parser, resolver, or placement output exists. |
| Stage crate docs | `crates/shotloom-stage/README.md` | Partial | The crate explicitly depends on `shotloom-common` and not `shotloom-core`; parser output must preserve that boundary. |
| Stage crate deps | `crates/shotloom-stage/Cargo.toml` | Partial | Only `shotloom-common` is present. Parser work needs existing workspace `serde` and likely dev-only `serde_json`; `thiserror` is acceptable if typed public errors are added. |
| Map contract schema | `contracts/stage-map/stage-map-document.schema.json` | Already Done | Defines v1 document, object, candidate, transform, ownership, and diagnostic shapes with closed objects. |
| Minimal example | `contracts/stage-map/examples/minimal-stage-map-document.json` | Already Done | Gives one resolved relative candidate object and one fixture candidate object for parser tests. |
| Stage map spec | `docs/specs/stage-map-document.md` | Already Done | Defines selected filenames, local root layout, GLB lookup order, path safety, transform expectations, ownership, and diagnostic codes. |
| Diagnostic primitive | `crates/shotloom-common/src/diagnostic.rs` | Already Done | `Diagnostic` is the shared observation type; diagnostics are not parser exceptions. |
| Diagnostic ADR | `docs/adr/adr-0021-cross-crate-diagnostic-type.md` | Already Done | Diagnostic codes stay crate-local and scoped by `source`. |
| Stage ADRs | `docs/adr/adr-0009-void-stage-and-coordinate-system.md`, `docs/adr/adr-0012-generated-stage-contract.md` | Already Done | Stage stays runtime-agnostic; engine mediates between core model and stage crate. |
| Prior sibling draft | `caol-ila/docs/plans/stage-add-map-document-parser.draft.md` | Stale | Correctly blocked before STL-421 landed; now superseded by the contract being present on `origin/main`. |
| Contract sibling plan | `caol-ila/docs/plans/stage-define-map-document-bundle-layout.md` | Consumed | Agrees that parser/resolver belongs to STL-422 and bridge/editor/clear-all stay follow-ups. |

## Problem

The stage import POC needs a deterministic, locally testable Rust surface that
turns a checked-in map document shape into a normalized prop placement list. The
parser must read the v1 JSON, preserve document/object ownership metadata, try
ordered GLB candidates against a caller-provided local POC root, and emit
`stage_map_document` diagnostics for missing, fixture, unsupported, parse, and
transform issues. It must not silently hard-code a machine-local path or decide
bridge command shape before STL-423.

## Locked Decisions

1. **Implement the parser and resolver under `crates/shotloom-stage`.**

   Rationale: ADR-0009 assigns stage/environment concerns to
   `shotloom-stage`, and the contract README lists that crate as a consumer.
   This keeps stage map parsing next to the stage POC boundary while avoiding a
   dependency from `shotloom-core` into stage code.

   Rejected alternatives: putting this in `shotloom-core` would pull local POC
   asset resolution toward the persisted domain model; putting it in
   `shotloom-engine` would couple parsing to Bevy and make parser unit tests
   heavier.

2. **Keep parser output runtime-agnostic and independent of `shotloom-core`.**

   Rationale: `crates/shotloom-stage/README.md` says the stage crate depends on
   `shotloom-common` but not `shotloom-core`; ADR-0012 keeps engine mediation
   responsible for translating domain/runtime types. STL-422 only needs
   normalized placement data, not `PropModel` mutation or bridge events.

   Rejected alternatives: returning `PropModel`, `AssetCatalogEntry`, or bridge
   DTOs would force downstream ownership and protocol choices that belong to
   STL-423 and later work.

3. **Use typed Rust structs that mirror schema v1 exactly enough for strict
   local parsing.**

   Rationale: the schema uses `additionalProperties: false` and required
   arrays for document, object, candidate, transform, and ownership shape.
   `serde` DTOs with `deny_unknown_fields` should catch unknown keys for this
   POC parser because v1 is intentionally closed.

   Rejected alternatives: parsing through generic `serde_json::Value` would
   defer shape errors too late; permissive structs would hide schema drift that
   downstream bridge work would inherit.

4. **Return a success result that carries both placements and diagnostics.**

   Rationale: ADR-0021 and `shotloom-common::Diagnostic` state that diagnostics
   are observations, not errors. The spec allows a usable document plus
   warnings when at least one object remains placeable.

   Rejected alternatives: failing the whole parse on each missing candidate or
   fixture candidate would violate the POC degradation rule; storing diagnostics
   in the bundle would violate the transient diagnostic model.

5. **Separate hard parse errors from degraded resolver diagnostics.**

   Rationale: invalid JSON, unreadable files, and closed-schema mismatches stop
   document parsing and should map to `map_document_parse_failed` or
   `map_document_schema_mismatch`. Missing GLBs, fixture candidates, and
   transform uncertainty are diagnostic observations when useful placements
   remain.

   Rejected alternatives: returning only `Result<Vec<Placement>, Error>` loses
   recoverable warning detail; returning only `Vec<Diagnostic>` makes callers
   parse success from side effects.

6. **Resolve candidate paths only from caller-provided roots.**

   Rationale: the spec says the local POC root is supplied at call time and
   repository code must not hard-code `/Users/...` paths. The resolver should
   accept a root path parameter and selected document path helpers should build
   `map-documents/Map_1004__Stage1.json`, `Map_1006__Stage1.json`, and
   `Map_1038__Stage1.json` under that root.

   Rejected alternatives: using `asset_root_hint` as an authoritative local
   path or embedding the current operator's download directory would make tests
   machine-specific and violate the contract boundary.

7. **Pre-validate path safety before returning any resolved placement.**

   Rationale: `relative_glb_path` must resolve under the canonical root, and
   `absolute_glb_path` values with `..` segments or null bytes are invalid.
   The plan has no coupled persistent mutation, but it does have a coupled
   logical result: a placement plus diagnostics. Validation must complete for
   each candidate before that candidate is selected.

   Rejected alternatives: selecting a path and later appending a diagnostic
   for the same unsafe candidate would let a caller spawn an unsafe asset;
   relying only on the JSON Schema would miss filesystem canonicalization.

8. **Treat `object_type` as semantic fallback, not filesystem inference.**

   Rationale: the contract says `object_type` is a semantic fallback keyed by
   normalized object type. STL-422 can accept a caller-provided lookup map from
   object type to GLB path or asset reference, but it must not invent directory
   names from object type strings.

   Rejected alternatives: deriving `object_type + ".glb"` would create hidden
   naming policy outside the STL-421 contract and make missing assets look
   resolved.

9. **Defer final Unreal-to-Shotloom viewport conversion.**

   Rationale: the stage map spec records `story_previz_unreal` source
   transforms and says parser or spawn code must convert before final viewport
   placement. STL-422 should parse source-space arrays and surface
   `map_transform_unverified`; STL-423 can decide the exact spawn-time
   conversion when it wires background prop batch spawn.

   Rejected alternatives: guessing full axis/origin conversion in the parser
   would expand scope into placement validation and visual review.

## Non-Goals

- No bridge command, event, or TypeScript bridge contract change.
- No editor debug/dev panel action, button, route, or UI diagnostic rendering.
- No batch prop spawn implementation and no Bevy ECS system changes.
- No clear-all command or background prop deletion behavior.
- No mutation of `BundleModel`, `AssetCatalog`, `PropModel`, or persisted
  project state.
- No production asset catalog or full Story Previz live API integration.
- No committed local GLB collection or real exported map JSON files.
- No broad transform/orientation correction for every prop asset.
- No new ADR.

## Implementation Plan

### S0 - Baseline Re-Check

1. Confirm `feat/stage-add-map-document-parser` is rebased or fast-forwarded to
   current `origin/main` and clean.
2. Re-run targeted searches for `asset_candidates`, `stage_map_document`,
   `Map_1004`, `background_owner`, and existing stage crate files.
3. Re-read `contracts/stage-map/stage-map-document.schema.json`,
   `contracts/stage-map/examples/minimal-stage-map-document.json`, and
   `docs/specs/stage-map-document.md`.
4. Confirm no `crates/shotloom-stage/src/map_document.rs` or equivalent parser
   module already exists before adding one.

### S1 - Add Stage Map DTOs and Error Surface

1. Add `crates/shotloom-stage/src/map_document.rs`.
2. Define serde DTOs for the v1 schema:
   - document identity: `schema_version`, `document_id`, `map_id`, `title`
   - `source`, `asset_root_hint`, `objects`, optional `diagnostics`
   - object fields: `id`, `object_type`, `display_name`,
     `asset_candidates`, `transform`, `size`, `background_owner`,
     optional `diagnostics`
   - candidate fields: `kind`, `value`, `confidence`, `reason`
   - transform fields: `translation`, `rotation_euler_degrees`,
     `rotation_order`, `scale`, `source_coordinate_space`, `confidence`
3. Add public normalized output structs:
   - parsed document summary
   - placeable prop placement
   - selected asset reference with source candidate kind and path or semantic key
   - background owner metadata
   - diagnostics list
4. Add a typed public parser error enum with structured path/source context for
   file I/O and JSON parsing.
5. Re-export only the intended public parser/resolver types from
   `crates/shotloom-stage/src/lib.rs`.

### S2 - Implement Document Loading

1. Add `load_stage_map_document(path)` for reading and parsing one JSON file.
2. Add a pure `parse_stage_map_document_str(source, label)` helper for tests.
3. Enforce `schema_version == 1`, document/map ID naming, closed DTO parsing,
   candidate presence, and transform shape through serde plus explicit checks
   where serde cannot express the invariant cleanly.
4. Convert parse/read failures to a typed error that can also produce one
   `Diagnostic` with `source: "stage_map_document"` and the proper code.
5. Add selected-map path helpers for `Map_1004__Stage1.json`,
   `Map_1006__Stage1.json`, and `Map_1038__Stage1.json` under
   `<root>/map-documents/`.

### S3 - Implement GLB Candidate Resolution

1. Add resolver input options:
   - canonical local POC root
   - optional `object_type` lookup map
   - optional policy for accepting `absolute_glb_path` during POC tests
2. For each object, try `asset_candidates[]` in document order.
3. Resolve `relative_glb_path` under the canonical root only after rejecting
   leading separators, drive paths, URL schemes, `..` segments, and null bytes.
4. Resolve `absolute_glb_path` only when the policy allows it, and reject `..`
   segments and null bytes before filesystem checks.
5. Resolve `object_type` only through the provided semantic lookup map.
6. Treat `fixture` as non-fatal placeholder output only when no better GLB
   candidate resolved, and emit `map_asset_fixture`.
7. Emit `map_asset_missing` for absent candidate files and
   `map_asset_unsupported` for candidates that exist but are not usable as a
   supported GLB path.
8. Preserve original document diagnostics and object diagnostics in the output
   diagnostics list, scoped as `stage_map_document`.

### S4 - Normalize Placement Output

1. Include object ID, object type, display name, selected asset reference,
   source-space transform, transform confidence, and background owner in each
   placement.
2. Emit `map_transform_unverified` for source transforms that remain useful but
   have not been visually verified.
3. Emit an error diagnostic when all objects are unresolved, while still
   returning enough document summary and diagnostics for the caller to display.
4. Do not produce `PropModel`, `AssetCatalogEntry`, bridge events, or ECS
   commands in this stage.

### S5 - Tests and Local Fixtures

1. Add unit tests in `crates/shotloom-stage/src/map_document.rs`.
2. Parse the checked-in minimal example through `include_str!` or a path-based
   fixture test.
3. Use temporary directories for resolver tests:
   - relative GLB resolves when the file exists under the root
   - missing relative GLB emits `map_asset_missing`
   - fixture candidate emits `map_asset_fixture`
   - object type lookup resolves only through the supplied map
   - unsafe relative path and absolute path variants are rejected
   - invalid JSON maps to `map_document_parse_failed`
   - unknown object field or malformed transform maps to
     `map_document_schema_mismatch`
4. Add tests for selected-map path helper output for the three selected files.
5. Verify all emitted diagnostics use `source: "stage_map_document"` and bare
   snake_case codes from the spec.

### S6 - Documentation Touches

1. Update `crates/shotloom-stage/README.md` to mention the local POC map
   parser/resolver and its boundary.
2. Update `MAP.md` only if a new "where is the parser" lookup is needed after
   adding the module.
3. Do not update bridge, editor, or roadmap docs unless implementation reveals
   stale links directly caused by this parser addition.

## Acceptance Criteria

- [ ] `crates/shotloom-stage` can read a selected map JSON file into a typed
      v1 document model.
- [ ] Parser output includes normalized placeable prop placements with object
      ID, object type, display name, transform, selected asset reference, and
      background owner.
- [ ] Relative GLB candidates resolve only under a caller-provided canonical
      local POC root.
- [ ] Object type fallback resolves only through an explicit caller-provided
      lookup map.
- [ ] Missing GLB, unsupported GLB, fixture fallback, parse failure, schema
      mismatch, and transform uncertainty produce user-visible
      `stage_map_document` diagnostics.
- [ ] Invalid JSON or malformed transform is surfaced as diagnostic-convertible
      data rather than a panic.
- [ ] Unit tests cover successful parse, selected map paths, resolver success,
      resolver degradation, path-safety failures, parse failure, and malformed
      transform/schema mismatch.
- [ ] No bridge command, editor UI, batch spawn, clear-all, bundle mutation, or
      committed local GLB files are added.

## Verification

- `cargo test -p shotloom-stage`
- `cargo test -p shotloom-stage map_document`
- `cargo fmt --check`
- `cargo clippy --workspace -- -D warnings`
- `pnpm validate:durable-doc-linear-refs`
- `node scripts/validate-doc-paths.mjs`
- Manual: parse `contracts/stage-map/examples/minimal-stage-map-document.json`
  and confirm one relative candidate can resolve under a temp root.
- Manual: remove the temp GLB and confirm `map_asset_missing` is emitted with
  `source: "stage_map_document"`.
- Manual: use a fixture-only object and confirm `map_asset_fixture` is warning
  severity, not a hard parser error.
- Manual: feed invalid JSON and confirm `map_document_parse_failed` is
  diagnostic-convertible with path or label context.
- Manual: add an unknown object key or malformed transform array and confirm
  `map_document_schema_mismatch` is diagnostic-convertible.
- Manual: feed `../escape.glb`, rooted backslash, and null-byte candidate
  strings and confirm no placement selects those paths.
- Manual: confirm the operation has no persisted artifact side effects: no
  bundle, asset catalog, cache, bridge event, or ECS state is mutated.

## Traps

- Do not use `asset_root_hint` as the actual filesystem root without a caller
  parameter; it is a hint, not authority.
- Do not hard-code `/Users/deemooooooooo/Downloads/props` or commit local GLBs
  or generated real map JSON files.
- Do not infer filesystem paths from `object_type`; it is a semantic fallback
  only.
- Do not treat every missing or fixture candidate as a hard parse failure when
  at least one object remains placeable.
- Do not return `PropModel` or mutate bundle state from `shotloom-stage`.
- Do not add bridge rejection codes for map-document diagnostics.
- Do not implement final Unreal-to-Shotloom visual transform conversion here;
  preserve source transform and emit transform diagnostics.
- Do not weaken path safety because the schema already has regex guards;
  filesystem canonicalization still belongs in resolver code.

## Follow-Up Candidates

- STL-423: bridge command for background prop batch spawn from parser output.
- STL-424: clear-all command filtered by map document background ownership.
- STL-425: editor debug/dev panel actions for selected map imports.
- Add ignored/manual integration tests against the operator's real local POC
  root when generated map documents become available.
- Promote the local POC map document contract into a production stage asset
  catalog contract after the debug workflow proves useful.
- Add visual transform conversion and screenshot review once spawn wiring
  exists.
