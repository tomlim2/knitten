---
status: proposed
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-430
repo: shotloom
linear: STL-430
briefing: ../../briefings/shotloom/editor-add-stage-import-fixtures.md
---

# Add Stage Import Editor Fixtures

## Spec Contract

- Briefing basis: `STL-430` is the editor fixture-data slice under `STL-420`; `STL-437`/PR #361 now provides the S2M asset subset and `STL-450`/PR #359 provides Stage renderable provenance.
- Current truth: the editor has stage-import map buttons and bridge command types, `origin/main` has `assets/s2m_props/manifest.json`, and Stage source/provenance models now preserve source document/object/category hints.
- Required change: add deterministic editor-local fixture data for the three selected maps, adapt it through typed helpers, and preserve S2M asset-manifest and Stage-provenance metadata for later `STL-431`/`STL-453` consumers.
- Locked boundary: no bridge protocol, Rust parser/resolver, engine handler, `contracts/stage-map/` schema, S2M asset-pack mutation, StageModel hydration, or production import UX changes.
- Proof method: fixture import/shape tests assert map ids, normalized bridge ids, prop/cube counts, S2M manifest asset mapping, provenance-compatible source metadata, and no machine-local paths; existing panel tests and web typecheck remain green.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Stage import panel | `apps/editor/src/components/debug/StageImportDebugPanel.tsx` | Partial | The panel now dispatches `spawn_background_props` / `clear_background_props` on `origin/main`, but still generates `prop_box` placements from hard-coded counts instead of consuming fixture data. |
| Panel tests | `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` | Partial | Tests assert route registration, fixed map ids, disabled bridge/bundle states, and command/status behavior; no fixture import tests exist. |
| Fixture JSON | `apps/editor/src/components/debug/stageImportFixtures.json` | Missing | The file exists only on the reference POC branch `feat/stage-import-bridge-poc`, not on the main-base STL-430 worktree. |
| Editor bridge DTOs | `apps/editor/src/bridge/types.ts` `BackgroundPropPlacement`, `SpawnBackgroundPropsCommand` | Already Done | Current command payload is `{ map_id, document_id, source, placements }`; there is no `props` field and no separate cube wire field. |
| Bridge contract | `docs/ipc/bridge-contract.md` §14.2b | Already Done | `spawn_background_props` consumes already-resolved Shotloom-space placements and explicitly does not parse raw map document JSON or resolve local GLB files. |
| Clear contract | `docs/ipc/bridge-contract.md` §14.2c | Already Done | `clear_background_props` removes props tagged exactly `background_map`; STL-430 does not need to change clear behavior. |
| Stage map spec | `docs/specs/stage-map-document.md` | Already Done | Names `Map_1004__Stage1`, `Map_1006__Stage1`, and `Map_1038__Stage1`, their normalized `map_id` values, prop-count expectations, local-root policy, and fixture fallback diagnostics. |
| S2M asset subset | `assets/s2m_props/manifest.json` | Already Done on `origin/main` | PR #361 adds external StoryPreviz/S2M background and prop GLBs for the selected maps; it forbids replacing them with internal fixtures or built-in debug props. |
| Stage provenance model | `crates/shotloom-core/src/model/stage.rs` `StageSourceRef`, `StageProvenance`, `StageRenderable` | Already Done on `origin/main` | PR #359 adds source-system, source-document, source-object, source-category, role-hint, and representation-hint fields that STL-430 fixture data should preserve for later Stage import promotion. |
| Built-in debug asset | `crates/shotloom-engine/src/app.rs` `seed_debug_character_assets` | Already Done / excluded | Runtime seeds `prop_box`, but `STL-437` explicitly says S2M/stage proof must not use Shotloom built-in debug props as the source asset set. |
| Reference POC fixture | `.worktrees/stage-import-bridge-poc/apps/editor/src/components/debug/stageImportFixtures.json` | Partial / reference only | Contains three cases with 2, 32, and 72 prop placements and 18, 14, and 90 cube placements, but uses non-main asset ids and an older dispatch shape. |
| STL-431 spec | `docs/plans/proposed/editor-wire-stage-import-commands.md` | Adjacent | Owns panel dispatch/status wiring and expects fixture-backed placements; it should consume the STL-430 fixture after merge or rebase. |
| STL-437 asset task | Linear `STL-437`, PR #361 | Adjacent / source input | Reframes the old debug-cube work as S2M stage-import asset subset preparation and names `assets/s2m_props/manifest.json` as the source for map-to-prop mapping. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-430` |
| State | In Progress |
| Owner | deemo / current agent flow |
| Goal | Commit editor-owned fixture data for the three local stage-import POC maps so later panel/import work can run from the S2M asset subset while preserving Stage provenance metadata. |
| Acceptance criteria | Three map fixtures are editor-importable; each includes prop placements and debug cube placements; S2M manifest mapping and Stage provenance-compatible metadata are preserved; panel tests/typecheck stay green. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-420`; related `STL-422`, `STL-437`, `STL-450`, `STL-453`; reference implementation branch `feat/stage-import-bridge-poc`. |
| Related PRs | `STL-431` command wiring is now on `origin/main`; STL-430 should replace the generated `prop_box` fixture stand-in with fixture-backed data without changing command/status behavior. |
| Current review state | None for STL-430. |
| Planning consequence | Treat this as fixture data and validation, not as another panel dispatch PR; use `assets/s2m_props/manifest.json` instead of `prop_box` fallback and preserve data that can later become Stage provenance. |

## Problem

The stage import POC has selected-map semantics in repo docs, a useful
reference fixture on the POC branch, a committed S2M asset subset on
`origin/main`, and a new Stage provenance model. The editor still lacks a
committed fixture source that ties those pieces together. Without it,
downstream panel wiring either invents payloads in component code, loses S2M
source metadata, or hard-codes a debug-prop fallback that no longer matches the
asset-pack boundary. STL-430 must land fixture data the editor can import and
validate while preserving S2M manifest and Stage-provenance metadata, avoiding
machine-local paths, and avoiding any bridge schema change.

## Requirements

1. Add `apps/editor/src/components/debug/stageImportFixtures.json` with exactly three cases: `Map_1004__Stage1`, `Map_1006__Stage1`, and `Map_1038__Stage1`. Traces to Linear scope and `docs/specs/stage-map-document.md`.
2. Each case must include both `documentId` and normalized `mapId`: `Map_1004__Stage1` -> `Map_1004:Stage1`, `Map_1006__Stage1` -> `Map_1006:Stage1`, and `Map_1038__Stage1` -> `Map_1038:Stage1`. Traces to bridge contract §14.2b and stage-map naming rules.
3. Each case must preserve POC prop-placement counts from the reference branch: 2, 32, and 72. Traces to Linear AC and reference POC fixture.
4. Each case must preserve POC debug cube counts and categories from the reference branch: `Map_1004__Stage1` has 18 cubes (`floor`: 1, `wall`: 2, `obstacle`: 15); `Map_1006__Stage1` has 14 cubes (`floor`: 1, `wall`: 11, `block`: 2); `Map_1038__Stage1` has 90 cubes (`floor`: 1, `wall`: 50, `obstacle`: 35, `block`: 4). Traces to Linear AC and reference POC fixture.
5. Fixture placements must be bridge-ready editor data: translation, intrinsic XYZ Euler degrees, and scale must match `ModelTransform` field names used by `BackgroundPropPlacement`. Traces to `apps/editor/src/bridge/types.ts` and bridge contract §14.2b.
6. Fixture asset mapping must use `assets/s2m_props/manifest.json` as the canonical owner for selected background, prop, and cube GLB paths. Traces to `STL-437` / PR #361.
7. The fixture must not contain absolute local paths, `/Users/...`, `..` path traversal, null-byte strings, or machine-local POC roots. Traces to `docs/specs/stage-map-document.md` path-safety and repo-locality rules.
8. Each fixture entry must preserve provenance-compatible source metadata: `source_system`, `source_document_id`, `source_object_id`, `source_category`, `role_hint`, and `representation_hint` where known. Asset metadata hints must not become final Stage roles in this PR. Traces to `STL-450` / PR #359.
9. Any missing or not-yet-dispatchable S2M asset must be represented as explicit `excluded`, `pending_asset`, or fallback metadata. It must not silently become `prop_box`, `assets/props/box.glb`, or another Shotloom internal fixture. Traces to `STL-437`.
10. Add a typed adapter near the fixture, for example `stageImportFixtures.ts`, that imports JSON once, exposes narrow TypeScript types, preserves provenance metadata, and provides current bridge-placement arrays without using `any` in production code. Traces to TypeScript review checks.
11. Add focused editor tests for fixture importability, selected-map id normalization, prop/cube counts, cube kind counts, S2M manifest mapping, provenance metadata, and unsafe-path absence. Traces to Linear AC and test oracle strength.
12. Keep `StageImportDebugPanel` behavior changes optional and minimal for this PR. If the panel imports the fixture, it may replace duplicated static metadata, but it must not implement STL-431 dispatch/status behavior. Traces to the sibling-spec boundary.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No Rust parser, loader, validator, or typed error enum changes are in scope. | Keep changes in editor JSON/TypeScript tests. | N/A: no wrapped external error exists. |
| Schema / serialization compatibility | yes | `apps/editor/src/bridge/types.ts` and `docs/ipc/bridge-contract.md` §14.2b define `placements`, not old POC `props`. | Adapt fixture through typed helpers that emit current `BackgroundPropPlacement` shape; do not edit bridge types. | Fixture helper test asserts bridge placements use `asset_id`, `transform`, `object_id`, and optional safe tags only. |
| Ownership / API boundary | yes | Bridge contract says spawn consumes resolved placements and does not parse map JSON; `docs/specs/stage-map-document.md` keeps local documents outside repo. | Store editor-local fixture data; do not move it into `contracts/` or call Rust parser/resolver. | Tests import editor fixture only; changed file set excludes `contracts/`, Rust crates, and bridge schema files. |
| Partial mutation / rollback | no | STL-430 writes static repo data and pure helper output; no runtime state mutation, bundle mutation, or bridge dispatch is introduced. | No mutation atomicity decision is needed beyond committing fixture and adapter together. | N/A: no persisted runtime state can be partially mutated by the feature. |
| Diagnostic ownership | yes | Stage-map diagnostics own missing/fixture asset semantics; bridge diagnostics own invalid spawn placements; Stage model diagnostics own Stage provenance warnings. | Represent pending/excluded assets as fixture metadata, not new diagnostic codes; do not emit bridge or Stage diagnostics in editor code. | Fixture test asserts missing assets are explicit metadata and never silently rewritten to internal debug asset ids. |
| Test oracle strength | yes | Existing panel tests pass without fixture data, so they cannot prove STL-430. | Add fixture-specific tests that fail when JSON is absent, counts drift, ids are wrong, or unsafe paths appear. | `StageImportDebugPanel` or same-folder fixture test target imports the new module and asserts exact counts/kinds. |
| Stage provenance compatibility | yes | `StageSourceRef` and `StageProvenance` now preserve source system/document/object/category and role/representation hints. | Carry compatible metadata in fixture entries without creating StageModel values in STL-430. | Fixture test asserts provenance keys are present for map/object entries and are not collapsed into bridge-only fields. |
| Scope creep | yes | STL-431 owns dispatch/status; STL-437 owns asset subset; STL-450 owns core model; STL-453 owns Stage import promotion; STL-422 owns parser/resolver. | Make those Non-Goals and keep implementation to editor fixture/adaptor/tests. | Review proof through file set and no bridge/Rust/core model changes. |
| Reviewer objection | yes | The POC branch uses stale asset ids (`stage_*`, `prop_debug`) and an old command payload shape; prior spec incorrectly chose `prop_box` fallback. | Preserve source metadata when useful, normalize through S2M manifest paths, and forbid internal debug fallback as a silent source. | Tests assert no emitted source mapping uses internal debug assets as S2M source and no old `props` payload exists. |

## Locked Decisions

1. **Land STL-430 as fixture data plus adapter/tests, not as another panel wiring PR.**

   Rationale: `STL-431` already owns dispatch/status wiring and has an active draft PR path. Keeping STL-430 focused lets it merge independently and gives STL-431 a fixture source to consume after rebase.

   Rejected alternatives: stack this branch on the STL-431 PR; duplicate dispatch logic in STL-430; wait for STL-431 to merge before adding any fixture source.

2. **Keep the fixture editor-local under `apps/editor/src/components/debug/`.**

   Rationale: Linear names `stageImportFixtures.json`, and the data is a debug-panel POC fixture, not a durable external contract. `contracts/stage-map/` already owns the map-document schema; this fixture is a current-editor consumption artifact.

   Rejected alternatives: commit generated map documents under `contracts/stage-map/examples/`; create a new contract schema; place fixture assets under `assets/`; store data in `docs/`.

3. **Use the reference POC values as source evidence, then adapt them to current main wire shape.**

   Rationale: The POC branch contains the selected-map extraction result, but it predates the landed `spawn_background_props` shape. The implementation must salvage counts, transforms, object identities, and cube categories without copying old dispatch fields.

   Rejected alternatives: copy the POC panel and JSON verbatim; rewrite fixture data from scratch without preserving POC counts; keep old `props` payload fields.

4. **Use `assets/s2m_props/manifest.json`, not `prop_box`, as the asset source.**

   Rationale: PR #361 committed the external S2M stage-import asset subset and explicitly says not to replace it with Shotloom internal fixtures or built-in debug props. STL-430 fixture data should preserve S2M source identity, even if a later bridge dispatch path needs an adapter.

   Rejected alternatives: silently map source assets to `prop_box`; use `assets/props/box.glb` as the S2M source; copy stale POC asset ids with no manifest link; change bundle asset registration as part of STL-430.

5. **Represent debug cubes as first-class fixture entries, but bridge conversion flattens them to background prop placements.**

   Rationale: The current bridge has one `placements` array and no cube-specific field. Separate fixture arrays preserve category/count intent for tests and future UI, while the adapter can flatten both props and cubes into current bridge placements when STL-431 consumes them.

   Rejected alternatives: add cube-specific bridge schema; encode cube kind only in display names; drop cube fixtures until STL-437.

6. **Fixture validation is local TypeScript test coverage, not runtime JSON schema validation.**

   Rationale: The file is static repository data imported by the editor. Focused tests can enforce exact keys, counts, categories, fallback mapping, and path safety without adding a runtime dependency.

   Rejected alternatives: add a new JSON schema library; validate only manually in PR review; rely on TypeScript assertions with no tests.

7. **Preserve Stage provenance-compatible metadata without creating StageModel values.**

   Rationale: PR #359 added `StageSourceRef`, `StageProvenance`, and Stage renderable asset binding. STL-430 is still editor fixture data, but it should not throw away source document/object/category and hint fields that `STL-453` will need when promoting the debug path to Stage import.

   Rejected alternatives: make the fixture bridge-only; infer final `StageRole` from asset metadata; generate or persist `StageModel` in this PR.

## Non-Goals

- Do not change `spawn_background_props`, `clear_background_props`, bridge events, bridge diagnostics, or TypeScript bridge unions.
- Do not parse real local map document JSON in React.
- Do not call `crates/shotloom-stage` parser/resolver from the editor.
- Do not commit machine-local POC roots or generated selected-map documents.
- Do not add or modify S2M GLB assets; PR #361 owns the asset subset.
- Do not add new dependencies or CI/hook behavior.
- Do not implement STL-431 panel dispatch/status behavior in this PR.
- Do not implement STL-437 asset-pack validation or engine mesh/material proof.
- Do not create, hydrate, or persist `StageModel`; STL-452/STL-453 own Stage runtime/import promotion.
- Do not promote the fixture into a production import UX or public contract.

## Implementation Spec

S0. Baseline re-check. Rebase or merge the STL-430 worktree onto current `origin/main` so PR #356, PR #359, and PR #361 are visible. Confirm `stageImportFixtures.json` is absent, `assets/s2m_props/manifest.json` exists, `StageImportDebugPanel` currently generates `prop_box` placements in component code, and `BackgroundPropPlacement` still uses the current bridge shape. Requirements: 1, 5, 6, 12. Risk rows: schema / serialization compatibility, scope creep.

S1. Add the fixture JSON. Create `apps/editor/src/components/debug/stageImportFixtures.json` by adapting the POC branch data for the three selected maps and linking it to `assets/s2m_props/manifest.json`. Preserve case ids, labels, document ids, normalized map ids, source metadata, prop placements, cube placements, cube kinds, S2M manifest paths, and provenance-compatible source fields. Strip machine-local paths and do not normalize S2M source assets to internal debug assets. Requirements: 1-9. Risk rows: ownership / API boundary, diagnostic ownership, Stage provenance compatibility, reviewer objection.

S2. Add the typed adapter. Create a same-folder TypeScript module that imports the JSON, defines narrow readonly types for cases, transforms, prop placements, cube placements, cube kinds, manifest mapping, pending/excluded asset metadata, and provenance fields, then exports selected fixtures and a helper that returns current `BackgroundPropPlacement[]` only for dispatchable entries. Requirements: 2, 5, 6, 8-10. Risk rows: schema / serialization compatibility, Stage provenance compatibility, test oracle strength.

S3. Optionally replace duplicated static panel metadata only if it stays small. If doing so, read map labels/counts from the adapter while preserving current STL-431-owned dispatch/status behavior. Do not add new click dispatch, command status, or bridge-event handling. Requirements: 11, 12. Risk rows: scope creep, reviewer objection.

S4. Add focused fixture tests. Add or extend same-folder editor tests to import the adapter and assert exact case ids, document ids, normalized map ids, prop counts, cube counts/kinds, safe path policy, S2M manifest path mapping, provenance fields, no internal debug source fallback, and current bridge placement shape for dispatchable entries. Requirements: 1-11. Risk rows: test oracle strength, diagnostic ownership, Stage provenance compatibility, reviewer objection.

S5. Run verification. Run the focused editor test target and TypeScript/web validation. If the panel was touched, keep existing panel route/disabled-state tests green. Requirements: 9, 10. Risk rows: test oracle strength, scope creep.

## Acceptance Criteria

- [ ] `stageImportFixtures.json` exists under the editor debug component area and contains exactly the three selected map cases.
- [ ] Each fixture case has `documentId`, normalized `mapId`, prop placements, cube placements, cube kind metadata, and source/fallback asset metadata.
- [ ] Prop placement counts are exactly 2, 32, and 72 for `Map_1004__Stage1`, `Map_1006__Stage1`, and `Map_1038__Stage1`.
- [ ] Debug cube counts are exactly 18, 14, and 90, with the expected floor/wall/obstacle/block distribution.
- [ ] Fixture source mapping uses `assets/s2m_props/manifest.json` and does not treat `prop_box`, `assets/props/box.glb`, or `assets/samples/box.glb` as S2M source assets.
- [ ] Fixture entries preserve Stage provenance-compatible source metadata without inferring final Stage roles.
- [ ] Bridge placement helpers emit only current `BackgroundPropPlacement` shape for dispatchable entries and keep non-dispatchable assets explicit as pending/excluded metadata.
- [ ] The fixture file and adapter contain no absolute local paths, path traversal, null-byte strings, or machine-local POC roots.
- [ ] Existing stage import panel tests and editor typecheck/web checks remain green.
- [ ] No bridge contract, Rust parser, Rust engine, `contracts/`, or asset-file changes land in this PR.

## Verification

- Focused fixture/panel tests: `pnpm --filter @shotloom/editor test -- StageImport`.
- TypeScript check: `pnpm typecheck:web`.
- Web lint/check if available after implementation: `pnpm check:web`.
- Manual data review: inspect `apps/editor/src/components/debug/stageImportFixtures.json` and confirm selected map ids, counts, cube categories, S2M manifest references, provenance fields, and absence of local paths.
- Manual consumer sanity if STL-431 has rebased: open `/debug/stage-import` and confirm the panel still renders with the three selected map actions.

## Traps

- Do not copy the POC branch dispatch shape; `spawn_background_props` now uses `placements`, `document_id`, and normalized `map_id`.
- Do not use document ids like `Map_1004__Stage1` as bridge `map_id` values.
- Do not dispatch or test unknown POC asset ids such as `stage_chair_*`, `stage_table_*`, `prop_debug`, or `asset_chair` unless they are mapped through the committed S2M manifest.
- Do not use `prop_box`, `assets/props/box.glb`, or `assets/samples/box.glb` as the S2M source asset fallback.
- Do not collapse `source_object_id`, `source_category`, `role_hint`, or `representation_hint` into display names only.
- Do not hide cube categories only in display names; tests need explicit `kind` values.
- Do not commit generated local map documents or GLB paths from a personal machine.
- Do not let this PR absorb STL-431 command dispatch/status work.

## Follow-Up Candidates

- Keep STL-431-derived panel wiring pointed at the shared adapter once STL-430 lands.
- Add a later parser-to-fixture generation script if the POC extraction process needs repeatability.
- Promote this data into Stage import conversion in STL-453, mapping fixture source metadata into `StageSourceRef` / `StageProvenance`.
- Extend diagnostics UI to show excluded or fallback-handled source objects per selected map.
