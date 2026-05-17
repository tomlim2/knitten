---
status: ready
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: STL-424
repo: shotloom
linear: STL-424
spec: ../../plans/completed/bridge-clear-background-props.md
---

### Shotloom coding mode - bridge

**Issue:** STL-424 "feat(bridge): background asset clear-all command 추가"  
  Problem: Stage import needs a clear command that removes only map-document-spawned background props, without deleting user-spawned props, characters, cameras, or unrelated scene state.  
  Acceptance:
  - clear command removes only map-imported background props
  - normal props, characters, and cameras remain
  - outliner/store/viewport state is consistent after clear
  - no-op clear is safe
  - issue blocks STL-420
  Affected: `crates/shotloom-core/src/bridge/mod.rs`, `apps/editor/src/bridge/types.ts`, `apps/editor/src/bridge/__tests__/types.test.ts`, `crates/shotloom-engine/src/bridge/mod.rs`, `crates/shotloom-engine/src/bridge/handlers/props.rs`, `crates/shotloom-engine/src/bridge/tests/props.rs`, `docs/ipc/bridge-contract.md`, bridge fixtures if required  
  Linked: STL-420, STL-423, STL-431; ADR-0003, ADR-0018, ADR-0021, ADR-0042

**Branch:** `feat/bridge-clear-background-props`  (base: `origin/main` `03eb9aa9`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md  
**ADRs to honor:** ADR-0003 wasm-bindgen bridge, ADR-0018 runtime telemetry and error boundaries, ADR-0021 diagnostics are observations, ADR-0042 coalesced ShotLoaded after bundle mutations  
**Ask-first triggers for this task:** changing existing `spawn_background_props` wire shape; adding typed `background_owner` model fields; changing clear scope beyond current authoring shot; deleting assets from manifest or bundled storage; route/UI wiring; parser/resolver work; new dependencies; ADR or CI changes  
**Intent lens:** Prevent stage import cleanup from over-deleting. The authoritative discriminator is the `background_map` tag produced by STL-423; this command should clear authored background prop instances, their ECS entities, selection references, and model mirrors while preserving every non-background entity.

**AC primitive cross-check:**
- AC1 "clear command removes map-imported background props only": codified target discriminator - `docs/ipc/bridge-contract.md` §14.2b and `docs/specs/stage-map-document.md` state `background_map` is the authoritative discriminator; `PropModel.tags` persists the tags.
- AC2 "normal prop, character, camera remain": codified primitives - `ShotModel::remove_prop` removes only a named prop and clears camera target bindings that reference it; tests must prove untagged props, characters, and unrelated cameras remain.
- AC3 "outliner/store/viewport consistent": codified through existing events - `despawn_prop` emits `prop_removed`, optional `selection_changed`, and `bundle_changed`; `BridgeDirtyFlags::shot_loaded_for` emits a coalesced `shot_loaded` after model mutations. Batch clear must use the same event/update primitives.
- AC4 "no-op clear safe": codified command behavior to define - no-op must be accepted without rejection, and should emit no domain events because no authored state changed.
- AC5 "blocks STL-420": codified in Linear relation - STL-424 blocks STL-420 and STL-425; no repo code action needed beyond PR body `Resolves STL-424`.

**Spec-risk handoff for `/shotloom-draft-task-plan`:**
- P1: Wire shape and transaction class - add unit command `clear_background_props`, mark as `DurableMutation`, mirror it in TypeScript, and document it in `docs/ipc/bridge-contract.md` - evidence: no `ClearBackgroundProps` exists on `origin/main`; `spawn_background_props` is already durable - AC-trace: AC1.
- P1: Clear scope - clear only current authoring shot props whose `tags` contains exact `background_map`; do not clear by asset id, display name, `source:stage_import_debug`, or any partial prefix alone - evidence: §14.2b says exact `background_map` is authoritative; Linear says user-spawned props using same GLB must remain - AC-trace: AC1/AC2.
- P1: Mutation atomicity - collect target `PropId`s before mutation, then call `ShotModel::remove_prop` for each known id; if any internal removal fails, reject without partial mutation or prove failure impossible after pre-collection - evidence: `ShotModel::remove_prop` owns initial-state removal and camera target cleanup - AC-trace: AC3.
- P1: ECS/model consistency - despawn every matching `BridgeEntityId` `prop:<prop_id>` after model mutation; tests must assert the Bevy prop entity count drops for background props only - evidence: existing `despawn_prop_entity`; `despawn_prop_removes_model_entity_selection_and_emits_events` - AC-trace: AC3.
- P1: Selection cleanup - prune all removed `prop:<id>` values from `SelectedEntities`, preserve unrelated selected ids, and emit exactly one `selection_changed` only when selection actually changes - evidence: `cleanup_selection_after_prop_removed` handles one prop; batch clear needs a multi-id equivalent - AC-trace: AC3.
- P1: Event order - emit `prop_removed` for each removed prop, then optional `selection_changed`, then `bundle_changed`; set `BridgeDirtyFlags::shot_loaded_for` so the post-drain `shot_loaded` reflects the cleared shot - evidence: `despawn_prop` contract and ADR-0042 dirty flag pattern; POC did not emit `prop_removed`, so do not copy that omission - AC-trace: AC3.
- P2: No-op semantics - document accepted eventless no-op behavior; do not reject no-op and do not emit false domain-change events - evidence: Linear AC4 and bridge event ownership - AC-trace: AC4.
- P2: Contract fixture coverage - add serde round-trip and TS type test for `clear_background_props`; update shared bridge fixtures only if fixture policy requires every command snapshot - evidence: `apps/editor/src/bridge/__tests__/types.test.ts`, `crates/shotloom-core/tests/generate_bridge_fixtures.rs` - AC-trace: AC1.
- P2: POC salvage boundary - local `feat/stage-import-bridge-poc` contains useful `clear_background_props` sketches, but it also mixes debug cube cache, fixture UI, and old spawn-background shapes. Reuse only the clear-command idea and tests, not unrelated cube/cache/UI changes - evidence: dirty POC diff includes `StageDebugCubeAssets`, debug panel, asset files, and broad changes - AC-trace: user asked to make 424 cleanly.
- P3: Error wording - use bounded display for unexpected IDs if any rejection path names a prop id; no raw control characters in messages - evidence: existing `despawn_prop_rejection_bounds_and_escapes_unknown_prop_id` - AC-trace: review-rust/error-handling.

**Sibling specs (agent-hub/docs/plans/):**
- `bridge-add-background-prop-batch-spawn.md` - HEAD - stance: STL-423 adds `spawn_background_props`, writes deterministic ownership tags, and explicitly leaves clear-all to STL-424 - agrees.
- `stage-define-map-document-bundle-layout.md` - HEAD - stance: contract defines `background_owner` and says clear-all must filter by ownership, not asset/display name - agrees.
- `stage-add-map-document-parser.md` - HEAD - stance: parser/resolver owns stage-map input and keeps bridge/editor/clear out of scope - agrees.
- `editor-wire-stage-import-commands.md` briefing - working tree - stance: STL-431 should treat clear command as sibling-owned until STL-424 lands - agrees.
- `import-add-prop-gltf.md` - HEAD - stance: GLB prop preflight is unrelated to background clear scope - related only.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; stale inactive `deemotl` credential warning ignored
- [x] commit identity set for worktree: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (agent-hub/docs/plans/ and briefings, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-task-plan`.
