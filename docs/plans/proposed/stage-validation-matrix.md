---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-492
repo: shotloom
linear: STL-492
briefing: ../../briefings/shotloom/stage-validation-matrix.md
---

# Stage Validation Matrix

## Spec Contract

- Briefing basis: `../../briefings/shotloom/stage-validation-matrix.md`
  defines STL-492 as the docs/test matrix that fixes Stage tag and renderable
  options compatibility before STL-479 wires lifecycle/edit handlers.
- Current truth: `StageModel.tags` and `StageRenderable.options` are persisted,
  but live `origin/main` has no concrete authored-Stage tag/options bounds or
  validator contract; `docs/ipc/bridge-contract.md` still says concrete
  `options` bounds land with the runtime handler PR.
- Required change: add a small core validation contract plus durable
  documentation so bundle format, IPC rejection semantics, and tests all name
  the same Stage tag and renderable options limits.
- Locked boundary: no lifecycle/edit handler implementation, no promote/demote
  behavior, no new bridge command/event/rejection-code variants, no migration
  writer, and no Stage import pipeline work.
- Proof method: focused `shotloom-core` validation tests, optional malformed
  persisted shot fixture coverage if needed for load attribution, docs path
  validation, and PR-body compatibility rationale.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage persisted model | `crates/shotloom-core/src/model/stage.rs::StageModel` | Partial | Persists `tags: im::Vector<String>` with no bounds helper or canonicalization function. |
| Stage renderable options | `crates/shotloom-core/src/model/stage.rs::StageRenderable::options` | Partial | Persists free-form `serde_json::Map<String, serde_json::Value>` with no byte-size or depth bound. |
| Stage reference validation | `crates/shotloom-core/src/model/shot.rs::validate_stage_refs_inner` | Already Done / Adjacent | Validates duplicate Stage ids, active-stage refs, element/renderable ids, renderable refs, and renderable asset kind when catalog context exists. Keep this reference validator separate from new tag/options content validation. |
| Stage content validation | `crates/shotloom-core/src/model/stage.rs` or `crates/shotloom-core/src/model/validate.rs` | Missing | No typed Stage content validator exists for tags, display names, or renderable options. |
| Bundle validation aggregation | `crates/shotloom-core/src/model/bundle.rs::BundleModel::validate` and `crates/shotloom-core/src/model/validate.rs` | Already Done / Extension target | Collects per-shot validation errors and projects validation failures into diagnostics. New Stage tag/options validation should attach to this path without bypassing existing attribution. |
| Bridge rejection docs | `docs/ipc/bridge-contract.md` §13A.2 | Partial | Maps invalid tags and oversized/deep renderable options to `INVALID_STAGE_PAYLOAD`, but still says concrete options bounds will land with the runtime handler PR. |
| Stage DTO docs | `docs/ipc/bridge-contract.md` §22A.2 | Partial | Describes bounded `options` maps but does not name the concrete 8192-byte / depth-8 limits. |
| Bundle format docs | `docs/specs/bundle-format.md` §11.1, §17, §18.3 | Partial | Documents additive `stages` compatibility and Stage reference validation, but not tag/options compatibility or load-failure behavior for bad persisted Stage bounds. |
| Stage entity spec | `docs/specs/stage-entity-model.md` | Partial | Defines Stage responsibilities, roles, representation kinds, and provenance, but not authored Stage tag canonicalization or options bounds. |
| Core display-name validation | `crates/shotloom-core/src/model/mod.rs::validate_display_name` | Already Done / Reuse | Existing display-name validation should remain the owner for Stage display-name failures and bridge `INVALID_DISPLAY_NAME`. |
| Bridge wire contract | `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts` | Already Done / Do not change | Stage command/event/rejection-code vocabulary landed before this task; STL-492 must reuse `INVALID_STAGE_PAYLOAD` rather than adding a new code unless the user expands scope. |
| Fixture load-gate pattern | `crates/shotloom-core/tests/fixtures/README.md` and `tests/bundle_fixtures.rs` | Already Done / Optional proof | Existing malformed bundle fixtures prove load-stage attribution. Use this only if direct validator tests do not prove persisted-shot attribution clearly enough. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-492` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Fix the Stage validation compatibility matrix so STL-479 can implement handlers against stable tag/options bounds, rejection semantics, and persisted-data compatibility. |
| Acceptance criteria | Stage tags max 32 plus display-name validation and normalization; StageRenderable options max 8192 bytes and depth 8; bundle-format compatibility decision; bridge rejection matrix cross-check; tests/fixtures if needed. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-479`; related `STL-480`. Work can run before or after STL-479 but must rebase if constants or rejection codes change. |
| Related PRs | PR #370 merged Stage wire contract into `origin/main`; it left concrete renderable options bounds for a follow-up. |
| Current review state | No PR for STL-492 yet. |
| Planning consequence | Keep this PR small and upstream of runtime handlers: core constants/validator proof plus durable docs, not command handler behavior. |

## Problem

Stage authoring now has bridge wire shapes and persisted Stage data, but the
validation rules that make that data safe are split across future intent and
placeholder prose. `StageModel.tags` and `StageRenderable.options` are
persisted fields; once STL-479 validates them during command handling or bundle
validation, old saved shots and bridge callers need one stable answer for:

- which tag values are accepted,
- how tags are canonicalized,
- how large and deep renderable options can be,
- which bridge rejection code is returned for command payload violations,
- and whether over-limit persisted shot data is a load-blocking validation
  failure.

Leaving those answers inside STL-479 would make the handler PR re-decide bundle
compatibility while it is already implementing lifecycle/edit behavior. STL-492
locks that matrix first.

## Requirements

1. Add core constants for authored Stage validation:
   `MAX_STAGE_TAGS = 32`, `MAX_STAGE_TAG_BYTES = 128`,
   `MAX_STAGE_RENDERABLE_OPTIONS_BYTES = 8192`, and
   `MAX_STAGE_RENDERABLE_OPTIONS_DEPTH = 8`.
   - Trace: STL-492 tag/options AC; background-prop tag byte precedent in
     `docs/ipc/bridge-contract.md` §13A.4.
   - Stage: S1.
   - Verification: V1, V2.
2. Define a Stage tag canonicalization helper that trims leading/trailing
   whitespace, rejects empty results, preserves case, preserves first-seen
   order, and removes exact duplicates after trimming.
   - Trace: STL-492 normalization AC and existing safe tag vocabulary.
   - Stage: S1.
   - Verification: V1.
3. Validate authored Stage tags with the helper from R2, max 32 canonical tags,
   and max 128 UTF-8 bytes per canonical tag. Runtime command paths may use the
   helper to canonicalize before persistence; persisted bundle validation must
   reject non-canonical stored tags rather than silently rewriting them.
   - Trace: STL-492 tag AC and command rejection matrix.
   - Stage: S1, S2.
   - Verification: V1, V3.
4. Validate Stage display names through the existing
   `validate_display_name` helper; do not create a Stage-specific display-name
   grammar or rejection code. Persisted Stage display names must already equal
   the helper's normalized output; command handlers may normalize before
   writing.
   - Trace: STL-492 display-name AC and `docs/ipc/bridge-contract.md` §13A.2.
   - Stage: S2.
   - Verification: V4.
5. Validate `StageRenderable.options` by serialized JSON byte length and
   nesting depth, with empty maps accepted and arrays/objects counted toward
   depth deterministically.
   - Trace: STL-492 options AC.
   - Stage: S1, S2.
   - Verification: V2, V3.
6. Add a separate Stage content validation path, exposed as a named
   `ShotModel` helper and a `BundleModel` aggregation step, so bad persisted
   Stage tags/options are load-blocking validation failures rather than
   silently ignored, repaired, or hidden inside reference validation.
   - Trace: bundle-format compatibility AC and `docs/specs/bundle-format.md`
     §18.3 validation invariant.
   - Stage: S2.
   - Verification: V3, V5.
7. Keep bridge command payload violations for invalid Stage tags and oversized
   or deep renderable options mapped to `INVALID_STAGE_PAYLOAD`.
   - Trace: `docs/ipc/bridge-contract.md` §13A.2 and error-handling guideline
     bridge vocabulary.
   - Stage: S3.
   - Verification: V6.
8. Document the compatibility decision: additive `stages` fields remain
   default-compatible when absent, but once Stage data is present it must pass
   current Stage validation; no automatic migration or truncation is performed
   for invalid tags/options.
   - Trace: STL-492 migration/no-migration rationale.
   - Stage: S3.
   - Verification: V7.
9. Update durable docs at the correct altitude:
   - `docs/specs/stage-entity-model.md` owns domain meaning and normalization.
   - `docs/specs/bundle-format.md` owns persisted compatibility/load policy.
   - `docs/ipc/bridge-contract.md` owns command rejection and DTO bound prose.
   - Trace: AFDS responsibility split and STL-492 durable docs AC.
   - Stage: S3.
   - Verification: V7.
10. Add focused tests that fail before implementation and pass after it:
    canonical tags, too many tags, oversized tag bytes, options byte bound,
    options depth bound, display-name reuse, bundle validation attribution,
    and bridge rejection-matrix documentation parity.
    - Trace: STL-492 test/fixture AC.
    - Stage: S4.
    - Verification: V1 through V7.

## Validator Contract Matrix

| Contract claim | Negative fixture | Boundary rule | Error order | Enforcement surface | Regression proof |
|---|---|---|---|---|---|
| Stage tags canonicalize by trim, de-duplicate by exact canonical value, preserve case and first-seen order. | `[" main ", "main", "Main"]` canonicalizes to `["main", "Main"]`; persisted `[" main "]` fails because it is not canonical. | String-only persisted values; no path or IO boundary. | Empty canonical tag fails before canonical-form mismatch; canonical-form mismatch fails before count overflow. | Core helper and bundle validation. | Unit test for helper plus bundle validation test. |
| Stage tags are capped at 32 canonical tags and 128 UTF-8 bytes per tag. | 33 unique canonical tags; one 129-byte tag. | Byte count uses UTF-8 length, not character count. | Per-tag byte failure beats total-count failure when the offending tag appears before count overflow; otherwise count failure is deterministic after canonicalization. | Core validation and IPC docs. | Focused validation tests with exact error variant. |
| Stage display names reuse `validate_display_name`. | Empty, overlong, or non-canonical persisted Stage display name. | Existing display-name grammar is the only owner; persisted values must equal the helper's normalized output. | Display-name failure is reported as display-name validation, not `InvalidStagePayload`, at the core layer. Bridge command mapping remains `INVALID_DISPLAY_NAME`. | Core validation plus bridge docs. | Test asserts display-name error variant or conversion path. |
| StageRenderable options are capped at 8192 serialized JSON bytes. | Options map whose serialized JSON exceeds 8192 bytes. | Serialized byte length is computed from deterministic JSON value serialization; no filesystem root involved. | Byte-size failure is reported independently from depth when the depth is within bound. | Core validation and IPC docs. | Focused options-size test. |
| StageRenderable options depth is capped at 8. | Nested object/array value depth 9. | Objects and arrays both increase depth; scalar leaves do not. | Depth failure is reported independently from byte-size when the payload stays under 8192 bytes. | Core validation and IPC docs. | Focused options-depth test. |
| Bad persisted Stage data blocks bundle load. | Shot JSON containing present Stage data with over-limit tags/options. | Missing `stages` and `active_stage_id` remain default-compatible; present invalid data is not truncated. | Schema/version failures still precede model validation; Stage reference validation runs before Stage content validation so dangling refs are reported before tag/options details. | `BundleModel::validate_stage_content` / load-check path. | Direct bundle validation attribution test; add malformed fixture only if direct test cannot prove attribution. |
| Bridge command payload violations keep `INVALID_STAGE_PAYLOAD`. | Future STL-479 `update_stage` with invalid tags; `replace_stage_renderable` with oversized options. | Bridge rejection code vocabulary stays unchanged. | Specific generic failures still win where applicable: bad display name -> `INVALID_DISPLAY_NAME`, bad transform -> `NON_FINITE_TRANSFORM`, missing asset -> `ASSET_NOT_FOUND`. | IPC docs and later handler tests. | Docs parity plus STL-479 handler tests as follow-up. |

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | New failures are internal model validation errors over already-deserialized JSON values; no `io::Error` or `serde_json::Error` is wrapped in the planned validator. | Use typed internal validation variants with no `#[source]`; if a fixture parse test is added, keep parse errors in existing load error types. | Assert representative validation error `source()` is `None`, or N/A for helper-only tests. |
| Schema / serialization compatibility | yes | `ShotModel.stages` is persisted and defaulted; `StageRenderable.options` is persisted free-form today. | Missing `stages` remains compatible; present invalid Stage data becomes load-blocking by current validation policy; no schema version bump or automatic truncation. | Legacy omitted-field test remains green; invalid present-data test fails validation. |
| Ownership / API boundary | yes | Stage model validation belongs in `shotloom-core`; bridge command handlers belong to STL-479. | Add core validation and docs only; do not implement engine command handlers. | Diff has no lifecycle/edit handler implementation. |
| Partial mutation / rollback | no for STL-492, yes for sibling consumption | This PR validates static model state and docs; no command mutates Stage plus event state. | Name STL-479 as the mutation consumer; keep rollback tests out of this PR except documenting rejection mapping. | N/A for this PR; STL-479 must assert rollback/event order. |
| Diagnostic ownership | yes | `CommandRejectionCode::InvalidStagePayload` is the existing bridge owner for invalid tags/options. | Do not add new bridge code; core validation owns typed details, bridge maps payload violations to existing code. | Core tests assert validation detail; docs assert bridge code mapping. |
| Local absolute path exposure | no | Planned edits are repo docs and Rust tests with no local asset manifests. | Do not add `/Users`, `/home`, `Desktop`, `Downloads`, or machine checkout paths. | `rg` scan before PR if fixture/doc examples are added. |
| Manifest path containment | no | No manifest/catalog path field or asset URI resolver changes. | Keep path containment out of scope. | N/A. |
| Command rejection matrix | yes | `docs/ipc/bridge-contract.md` §13A.2 lists Stage rejection codes. | Keep invalid tags/options under `INVALID_STAGE_PAYLOAD`; document precedence for display names, transforms, assets, and bundle validation. | Docs diff plus future STL-479 handler tests; no new rejection code fixtures in STL-492. |
| Asset/data pack lifecycle | no | No binary asset, LFS pointer, or data pack is planned. | Do not add asset fixtures. | N/A. |
| Validation context downgrade | yes | `ShotModel::validate_stage_refs` currently validates refs only and has catalog/no-catalog variants. | Add `ShotModel::validate_stage_content` and `BundleModel::validate_stage_content` instead of expanding `validate_stage_refs`; docs must state refs and content are separate validation axes. | Consumer grep plus tests proving `BundleModel::validate` invokes both refs and content checks. |
| Field-set drift | yes | Tag/options constants will be referenced in docs and tests. | Define constants in code and cite them in docs by name; avoid repeating hidden alternative numbers. | Tests assert constants and docs mention the same values. |
| Bridge docs parity | yes | IPC docs currently say concrete options bounds are deferred. | Replace deferral prose with concrete bounds and rejection mapping. | `node scripts/validate-doc-paths.mjs`; manual doc diff review. |
| Event-state visibility | no | No accepted command or event behavior changes in STL-492. | Leave event-order proof to STL-479. | N/A. |
| Input constraint parity | yes | Stage tags and options are free-form inputs adjacent to display names, ids, and transforms. | Give them explicit bounds and canonicalization, with deterministic error ordering. | Negative input tests. |
| Test oracle strength | yes | Direct docs changes alone would not fail before implementation. | Add core tests that fail before constants/validation exist. | V1-V5. |
| Scope creep | yes | STL-479 and STL-480 own handlers and Stage/Prop boundary behavior. | Non-goals exclude handler implementation and promotion/demotion. | PR diff limited to core validation/tests/docs. |
| Reviewer objection | yes | Likely objection: load-blocking old Stage data without migration. | State rationale: Stage fields are new, absent fields are compatible, but present invalid authored Stage data is corrupt under bundle validation; no silent truncation. | Bundle-format docs plus invalid persisted-data test. |

## Locked Decisions

1. **STL-492 adds core validation constants and focused tests, not docs only.**

   Rationale: docs alone would not give STL-479 a compiler-visible source of
   truth, and the current code has no bounds for `StageRenderable.options`.
   Constants plus tests make the matrix executable without implementing
   lifecycle/edit handlers.

   Rejected alternatives: document numbers only; wait for STL-479 to invent
   constants inside engine handlers; add a full handler implementation here.

2. **Invalid or non-canonical present Stage data is load-blocking; missing Stage data remains compatible.**

   Rationale: `stages` and `active_stage_id` are additive/defaulted fields, so
   old shots that omit them remain loadable. Once a shot persists Stage data,
   that data is authored bundle content and must satisfy the current validation
   gate in canonical form. Silent normalization or truncation would mutate
   user-authored data without an explicit migration writer.

   Rejected alternatives: auto-normalize or auto-truncate tags/options on load;
   warn and keep invalid data; bump schema version; add a migration writer in
   this PR.

3. **Stage tags canonicalize by trim plus exact duplicate removal only.**

   Rationale: command/input paths can trim accidental UI whitespace before
   persistence while preserving user-authored case and source vocabulary. Load
   validation then checks the persisted value is already canonical. Case folding
   would be a product semantics decision and could collapse distinct upstream
   labels.

   Rejected alternatives: lowercase all tags; slugify tags; preserve duplicate
   tags; reject any tag that changes under trimming.

4. **Stage tag byte limit follows the background-prop safe-tag precedent.**

   Rationale: background-prop placement tags already use max 32 tags and 128
   bytes per tag. Reusing that adjacent boundary avoids introducing a second
   tag-size vocabulary unless product needs diverge later.

   Rejected alternatives: unlimited tag bytes; character-count limits; a new
   authored-Stage-only tag length.

5. **StageRenderable options are bounded by serialized JSON bytes and structural depth.**

   Rationale: options are a schema-free extension map, so bytes and depth bound
   memory/recursion risk without freezing backend-specific keys. The Linear
   issue names 8192 bytes and depth 8, so the spec adopts those numbers.

   Rejected alternatives: key whitelist in STL-492; per-kind options schemas;
   count only object entries; leave options unbounded until hydration.

6. **Bridge payload violations keep `INVALID_STAGE_PAYLOAD`.**

   Rationale: invalid tags and oversized/deep options are malformed Stage
   payload details, already documented under `INVALID_STAGE_PAYLOAD`. Adding
   new bridge rejection codes would require Rust enum, TypeScript mirror,
   fixtures, and frontend handling without giving the caller a distinct action.

   Rejected alternatives: `INVALID_STAGE_TAG`, `STAGE_OPTIONS_TOO_LARGE`, or
   overloading `BUNDLE_VALIDATION_FAILED` for prevalidation payload mistakes.

7. **Core validation detail and bridge rejection code are separate layers.**

   Rationale: core validation should name precise typed reasons for tests and
   diagnostics. Bridge handlers can map those reasons to the existing caller
   code according to context.

   Rejected alternatives: make core validation return bridge rejection codes;
   make bridge docs enumerate every internal validation variant.

8. **No automatic migration or writer cleanup lands in this PR.**

   Rationale: STL-492 is a compatibility decision and validator matrix. A
   writer that rewrites persisted Stage tags/options would be a separate data
   migration/change-management issue.

   Rejected alternatives: repair on read; repair on save without user action;
   add schema-version migration while Stage handlers are still being split.

## Non-Goals

- No implementation of Stage lifecycle/edit bridge handlers from STL-479.
- No promote/demote Stage/Prop boundary behavior from STL-480.
- No new bridge command, event, or rejection-code variants.
- No editor UI, reducer, toast, or TypeScript action implementation.
- No Stage import pipeline, map-document conversion, asset API wiring, or
  runtime hydration.
- No schema-version bump or automatic migration writer.
- No binary asset, LFS fixture, or performance data pack.
- No change to `StageRole` or `StageRepresentationKind` vocabulary.
- No replacement of the existing display-name validator.

## Implementation Spec

### S0 - Baseline Re-Check

Requirements: all. Risk rows: Scope creep, Validation context downgrade.

- Confirm the branch is still based on current `origin/main`.
- Re-run:
  ```bash
  rg -n "StageModel|StageRenderable|StageReferenceError|validate_stage_refs|INVALID_STAGE_PAYLOAD|options bounds|Stage tags" crates docs apps contracts
  ```
- Confirm no sibling PR already added Stage tag/options constants or validators.
- Confirm `docs/ipc/bridge-contract.md` still maps invalid tags/options to
  `INVALID_STAGE_PAYLOAD`.

### S1 - Add Stage Validation Constants and Helpers

Requirements: R1, R2, R3, R5. Risk rows: Input constraint parity, Field-set
drift, Test oracle strength.

- Add constants near the Stage model or a clearly named Stage validation module:
  - `MAX_STAGE_TAGS`
  - `MAX_STAGE_TAG_BYTES`
  - `MAX_STAGE_RENDERABLE_OPTIONS_BYTES`
  - `MAX_STAGE_RENDERABLE_OPTIONS_DEPTH`
- Add a typed validation error enum for Stage content validation, using
  structured fields and no source chain for internal value failures.
- Add helper(s) for:
  - canonical tag list construction,
  - tag count/byte checks,
  - options serialized-size check,
  - options depth check.
- Keep helpers independent of bridge command context so bundle validation and
  STL-479 handlers can both call them.

### S2 - Wire Validation into Core Bundle Validation

Requirements: R4, R6. Risk rows: Schema / serialization compatibility,
Validation context downgrade, Diagnostic ownership.

- Add `ShotModel::validate_stage_content` for Stage display names, canonical
  persisted tags, and renderable options. Keep it independent from
  `validate_stage_refs`.
- Add `BundleModel::validate_stage_content` and call it from
  `BundleModel::validate` after `validate_stage_refs`, preserving current
  higher-level error precedence before Stage content details.
- Preserve no-catalog versus catalog-context semantics for asset-reference
  validation by leaving `validate_stage_refs` focused on references only.
- Reuse `validate_display_name` for Stage display names and ensure its failure
  remains distinguishable from tag/options payload failures.
- Add `ShotValidationError::StageContent` or an equivalent typed variant so
  diagnostics can identify the containing shot and, where useful,
  stage/renderable ids without collapsing detail into `StageReferenceError`.

### S3 - Update Durable Documentation

Requirements: R7, R8, R9. Risk rows: Bridge docs parity, Command rejection
matrix, Reviewer objection.

- Update `docs/specs/stage-entity-model.md` with Stage tag canonicalization and
  renderable options bound semantics.
- Update `docs/specs/bundle-format.md` with the compatibility stance:
  omitted Stage fields stay compatible; present invalid Stage content fails
  validation; no automatic migration/truncation.
- Update `docs/ipc/bridge-contract.md` §13A.2 and §22A.2:
  - replace the "bounds will land later" prose,
  - name max 32 tags, 128 bytes per tag, 8192 options bytes, and depth 8,
  - keep invalid tags/options mapped to `INVALID_STAGE_PAYLOAD`,
  - preserve existing mappings for display name, transform, assets, and bundle
    validation.
- Update `MAP.md` only if a new major Stage validation module needs
  discoverability.

### S4 - Add Focused Tests and Optional Fixture

Requirements: R10. Risk rows: Test oracle strength, Aggregate error
attribution, Schema / serialization compatibility.

- Add focused unit tests for:
  - tag canonicalization, de-duplication, case preservation, and order
    preservation,
  - persisted non-canonical tag rejection,
  - empty canonical tag rejection,
  - 33 canonical tags rejection,
  - 129-byte canonical tag rejection,
  - accepted empty options,
  - options over 8192 bytes rejection,
  - options depth 9 rejection,
  - invalid or non-canonical Stage display name reuse,
  - validation error `source()` intentionally absent.
- Add bundle validation attribution coverage for invalid persisted Stage data.
- Add a malformed fixture only if direct bundle validation tests cannot prove
  load-stage attribution clearly.

### S5 - Validation and PR Readiness

Requirements: all. Risk rows: Local absolute path exposure, Bridge docs parity.

- Run focused checks:
  ```bash
  cargo test -p shotloom-core --lib stage
  cargo test -p shotloom-core --lib validate
  node scripts/validate-doc-paths.mjs
  ```
- Run broad pre-PR gates:
  ```bash
  cargo fmt --check
  cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
  cargo check --workspace --exclude shotloom-desktop
  cargo test --workspace --exclude shotloom-desktop
  node scripts/validate-doc-paths.mjs
  ```
- Before PR, scan for local absolute paths if any fixture or doc example was
  added:
  ```bash
  rg -n "/Users/|/home/|Desktop/|Downloads/|(^|[^A-Za-z])[A-Za-z]:[\\\\/ ]" docs crates contracts apps
  ```
- In the PR body, state the compatibility decision and use `Resolves STL-492`.

## Acceptance Criteria

- [ ] Stage validation constants exist for max 32 tags, max 128 bytes per tag,
      max 8192 options bytes, and max options depth 8.
- [ ] Stage tag canonicalization trims whitespace, removes exact duplicates,
      preserves case, and preserves first-seen order.
- [ ] Invalid Stage tags and oversized/deep StageRenderable options fail core
      validation with typed details.
- [ ] Stage display names reuse the existing display-name validator.
- [ ] Bundle validation rejects present invalid Stage data through a separate
      Stage content validation step and preserves compatibility for omitted
      Stage fields.
- [ ] `docs/specs/stage-entity-model.md`, `docs/specs/bundle-format.md`, and
      `docs/ipc/bridge-contract.md` state the same bounds and compatibility
      semantics.
- [ ] IPC docs keep invalid tags/options mapped to `INVALID_STAGE_PAYLOAD`.
- [ ] Focused tests prove tag canonicalization, tag bounds, options bounds,
      display-name reuse, and validation attribution.
- [ ] No lifecycle/edit handler, promote/demote, import, runtime hydration, or
      editor UI behavior lands under STL-492.

## Verification

| ID | Proof | Command / review step |
|---|---|---|
| V1 | Stage tags canonicalize and reject non-canonical/empty/too-many/oversized values. | Focused `shotloom-core` unit tests under Stage validation. |
| V2 | StageRenderable options accept empty maps and reject over-8192-byte or depth-9 values. | Focused options validator tests. |
| V3 | Bundle validation invokes separate Stage reference and Stage content validation steps for present Stage data. | `cargo test -p shotloom-core --lib validate_stage` or exact focused test name. |
| V4 | Stage display names reuse existing display-name validation. | Focused test proving invalid display name returns the display-name validation path. |
| V5 | Invalid persisted Stage data is attributed to the containing shot. | Bundle validation test or malformed persisted shot fixture test. |
| V6 | Bridge rejection matrix remains stable. | IPC doc review: invalid tags/options -> `INVALID_STAGE_PAYLOAD`; display name -> `INVALID_DISPLAY_NAME`; transform -> `NON_FINITE_TRANSFORM`; asset -> `ASSET_NOT_FOUND`; post-mutation validation -> `BUNDLE_VALIDATION_FAILED`. |
| V7 | Durable docs agree on bounds and compatibility. | `node scripts/validate-doc-paths.mjs` plus manual cross-check of the three docs. |

Focused commands:

```bash
cargo test -p shotloom-core --lib stage
cargo test -p shotloom-core --lib validate
node scripts/validate-doc-paths.mjs
```

Broad gates:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Manual review proof:

- Open `docs/ipc/bridge-contract.md` §13A.2 and confirm invalid tags and
  oversized/deep renderable options map to `INVALID_STAGE_PAYLOAD`.
- Open `docs/specs/bundle-format.md` §18.3 and confirm invalid present Stage
  data is load-blocking while omitted Stage fields remain compatible.
- Inspect the diff and confirm no engine Stage lifecycle/edit handlers were
  implemented.

## Traps

- Do not make the PR docs-only; without executable constants/tests, STL-479 can
  still drift.
- Do not add new bridge rejection codes for tag/options bounds unless the user
  explicitly expands scope.
- Do not silently truncate tags or options during load.
- Do not lowercase or slugify Stage tags as part of canonicalization.
- Do not implement STL-479 handlers while wiring validator calls.
- Do not weaken existing asset-reference validation by replacing catalog-aware
  paths with a no-context helper.
- Do not add machine-local absolute paths in any fixture or documentation.
- Do not let docs mention numbers that are not backed by code constants.

## Follow-Up Candidates

- STL-479: consume these validators in lifecycle/edit command handlers and add
  bridge command rejection tests.
- STL-480: apply the same compatibility matrix to Stage/Prop boundary
  promotion/demotion behavior.
- Stage import conversion: map upstream source tags into normalized Stage tags
  after the import path owns conversion.
- Editor UI: surface tag/options validation messages through authoring controls
  once controls exist.
