---
status: draft-conflict
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-422 — stage map document parser and GLB resolver
repo: shotloom
linear: STL-422
---

# Add stage map document parser and GLB resolver

## Conflict Summary

| Stop condition | Briefing claim | Live evidence | Required decision |
|---|---|---|---|
| Missing cited primitive | STL-422 should parse the STL-421 stage map document contract: `asset_candidates`, `object_type`, `background_owner`, selected map IDs, and `stage_map_document` diagnostics. | `origin/main` worktree has no `contracts/stage-map/` and no `docs/specs/stage-map-document.md`; `rg "asset_candidates|stage_map_document|Map_1004" crates apps docs contracts MAP.md` only finds the STL-425 debug UI strings. | Choose whether STL-422 waits for PR #337 to merge, or stacks on `feat/stage-define-map-document-bundle-layout` before drafting the direct implementation plan. |
| Blocked Linear dependency still open | STL-422 is blocked by STL-421. | Linear STL-421 is `In Review`; PR #337 is open with head branch `feat/stage-define-map-document-bundle-layout`. | Decide if blocked-by relation is satisfied by an open PR for planning, or only by merge to `origin/main`. |
| Parser contract source is not in base | The parser output and diagnostic behavior should follow STL-421's schema/spec. | PR #337 adds `contracts/stage-map/stage-map-document.schema.json`, `contracts/stage-map/examples/minimal-stage-map-document.json`, and `docs/specs/stage-map-document.md`, but those files are absent from this branch base. | Direct plan can land only after the contract is available in the branch being planned. |

## Audited Evidence

| Surface | Path | Finding |
|---|---|---|
| Current branch | `feat/stage-add-map-document-parser` | Clean, 0 commits ahead of `origin/main`. |
| Linear issue | STL-422 | Scope requires local map document parser, selected map document path support, `objects[]` field parsing, `asset_candidates` / `object_type` GLB lookup, diagnostics, and parser unit tests. |
| Blocking issue | STL-421 | In Review, blocks STL-422 and STL-420. |
| Blocking PR | GitHub PR #337 `docs(stage): define map document contract` | Open, non-draft. Adds the missing contract/spec/example needed by STL-422. |
| Stage crate | `crates/shotloom-stage/src/lib.rs` | Already Done: `shotloom-stage` exists, depends on `shotloom-common`, and owns stage DTOs. Missing: map document parser/resolver types and functions. |
| Diagnostics primitive | `crates/shotloom-common/src/diagnostic.rs` | Already Done: cross-crate `Diagnostic` supports severity, code, message, source, suggestion, recoverable, and location. |
| Diagnostic ADR | `docs/adr/adr-0021-cross-crate-diagnostic-type.md` | Codifies diagnostics as observations, not errors, and says diagnostic code constants live in the producing crate. |
| Stage boundary ADR | `docs/adr/adr-0009-void-stage-and-coordinate-system.md` | Codifies `shotloom-stage` ownership, meters, Y-up right-handed convention, and that non-void map rendering is future work. |
| Stage DTO ADR | `docs/adr/adr-0012-generated-stage-contract.md` | Codifies engine-mediated stage data flow and keeps `shotloom-stage` runtime-agnostic. |
| Stage-map contract in base | `contracts/stage-map/stage-map-document.schema.json` | Missing in current branch base. |
| Stage-map spec in base | `docs/specs/stage-map-document.md` | Missing in current branch base. |
| Sibling plan | `agent-hub/docs/plans/completed/stage-define-map-document-bundle-layout.md` | Agrees: STL-422 should implement against the STL-421 contract and must not guess fields before the contract lands. |

## Proposed Narrow Scope

Valid direct plan after the contract is present in the target branch:

1. Add parser/resolver code under `crates/shotloom-stage` against the checked-in `contracts/stage-map/stage-map-document.schema.json`.
2. Parse the v1 map document into typed Rust structs without accepting unknown fields beyond the schema.
3. Return a result shape that carries:
   - parsed document identity: `document_id`, `map_id`, `title`
   - placeable prop placements with object ID, object type, selected asset reference, transform, and background ownership
   - `Vec<Diagnostic>` for non-fatal missing, fixture, unsupported, and transform-quality observations
4. Resolve GLB candidates using a caller-provided local POC root:
   - prefer safe `relative_glb_path`
   - reject escaped relative paths and null bytes
   - treat `absolute_glb_path` according to the contract decision
   - use `object_type` only as a semantic fallback, not as an implicit filesystem path
5. Add parser/resolver unit tests using checked-in synthetic fixtures, not machine-local `/Users/.../Downloads/props` files.
6. Keep bridge commands, batch spawn, editor dispatch, clear-all, and production asset catalog design out of scope.

## Blocked Scope

Do not implement or commit a direct STL-422 plan until one of these is true:

1. PR #337 merges to `main`, then rebase `feat/stage-add-map-document-parser` onto updated `origin/main` and draft a direct plan.
2. User explicitly chooses a stacked plan on top of `feat/stage-define-map-document-bundle-layout`.

Blocked implementation details that require the STL-421 contract:

- exact Rust struct field names and serde behavior
- whether `asset_candidates[]` may be empty or is always `minItems: 1`
- path-safety behavior for `absolute_glb_path`
- exact diagnostic code list and default severities
- exact transform field names and supported coordinate spaces
- whether parser tests should validate the minimal example directly or add crate-local test fixtures derived from it

## Recommended Decision

Wait for PR #337 to merge, then rerun `/shotloom-start-task STL-422` or
`/shotloom-draft-task-plan` from the rebased STL-422 worktree. This avoids
stacking implementation on an unmerged contract branch and keeps the STL-422 PR
review focused on parser/resolver behavior instead of contract review churn.
