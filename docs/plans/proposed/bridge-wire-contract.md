---
status: proposed
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-478
repo: shotloom
linear: STL-478
briefing: ../../briefings/shotloom/bridge-wire-contract.md
---

# Bridge Wire Contract

## Spec Contract

STL-478 splits the Stage authoring bridge wire contract out of the closed PR #360 / STL-451 mega-change. The implementation must define the Rust and TypeScript protocol surface, generated fixtures, editor snapshot coverage, and IPC documentation while leaving runtime Stage mutation behavior to sibling issues.

The reference implementation is `feat/bridge-add-stage-authoring-contract` at commit `99169a34`. Treat it as evidence for the intended vocabulary and fixture shape, not as code to copy wholesale. The large implementation included engine handlers, provenance behavior, and broad tests that now belong to STL-479, STL-480, STL-481, and STL-477.

## Current State

| Area | Evidence | Implication |
| --- | --- | --- |
| Bridge commands/events | `crates/shotloom-core/src/bridge/mod.rs` has no authored Stage command/event family on `origin/main`. | STL-478 owns the additive wire variants. |
| Stage persistence | ADR-0050 and the core Stage model already define Stage, element, renderable, role, representation, and source vocabulary. | Do not redesign persistence or Stage/Prop ownership. |
| Shot bridge DTO | `ShotDto` currently emits timeline groups, props, and cine cameras, but no authored stages or active stage id. | STL-478 must add the read-side Stage shape. |
| Engine dispatch | `crates/shotloom-engine/src/bridge/mod.rs` matches `BridgeCommand` exhaustively. | Adding command variants requires a minimal compile-safe dispatch policy, even if behavior stays out of scope. |
| Contract parity | `contracts/README.md` and `docs/ipc/bridge-contract.md` §35 require Rust fixture generation plus TypeScript validation. | Every new shape needs Rust fixtures and TS snapshots. |
| Previous implementation | PR #360 added `stage_dto.rs`, Stage command/event variants, rejection codes, TS mirrors, snapshots, IPC docs, and full engine handlers. | Reuse the wire vocabulary; exclude handler logic. |

## Linear Briefing

`STL-478` asks for “Stage authoring bridge wire contract 분리”: define Rust bridge command/event/rejection code, Stage DTOs, Shot DTO extensions, TypeScript mirrors, generated fixtures, editor snapshot tests, and IPC docs. Engine handler behavior, Stage/Prop provenance behavior, handler module split, and editor UI are explicitly out of scope.

Current Linear state on 2026-05-19: `In Progress`, assignee `deemo 디모`, project `Shotloom - bravo`, priority `Medium`, label `enhancement`, parent `STL-451`, no blockers or related issues recorded on the issue. The parent context is the split from closed PR #360. Planning consequence: this spec must be one reviewable PR that resolves STL-478 and leaves sibling runtime behavior to STL-479/STL-480/STL-481/STL-477.

## Problem

PR #360 tried to review the contract and its implementation in one large diff. That made review focus drift: reviewers had to reason about wire compatibility, transaction behavior, Stage/Prop atomicity, provenance, docs, and file structure at the same time. STL-478 should make the protocol shape durable first so the later handler PRs can be smaller and judged against a fixed contract.

## Requirements

1. Add authored Stage bridge DTOs in Rust and export them from `shotloom-core::bridge`.
2. Extend `ShotDto` with `stages` and `active_stage_id` using missing-key-tolerant serde defaults.
3. Add Stage authoring command variants to `BridgeCommand` with stable snake_case wire names.
4. Add matching success event variants to `BridgeEvent`.
5. Add Stage-specific rejection codes only where existing codes would hide a distinct caller action.
6. Mirror the new commands, events, DTOs, and rejection code literals in TypeScript bridge types.
7. Add generated Rust fixtures and editor snapshot tests for representative commands, success events, and each new rejection code.
8. Update `docs/ipc/bridge-contract.md` with command matrix rows, success events, rejection codes, `ShotDto` additions, and a clear wire-only note.
9. Update `contracts/README.md` only for contract-test responsibility or artifact wording that becomes stale.
10. Update `MAP.md` only if the implementation adds a new bridge DTO file such as `stage_dto.rs`.
11. Keep the PR body explicit: `Resolves STL-478` and note that this is split from STL-451 / closed PR #360.

## Locked Decisions

### DTO Shape

Add `crates/shotloom-core/src/bridge/stage_dto.rs` with:

- `StageDto { stage_id, display_name, base_transform, elements, renderables, tags }`
- `StageElementDto { element_id, display_name, role, base_transform, renderable_refs, source, visible, locked }`
- `StageRenderableDto { renderable_id, kind, asset_id, source, local_transform, options }`

The DTOs mirror the Stage model vocabulary from ADR-0050. `source` is exposed because it is already part of the model and consumers need provenance visibility, but STL-478 must not implement provenance mutation behavior.

Rationale: bridge consumers need the same authored Stage read shape that will later be mutated by handlers, and PR #360 already proved this vocabulary can serialize through the fixture path.

Rejected alternatives: exposing raw model structs would couple UI wire shape to persistence internals; hiding `source` would force a follow-up bridge breaking change once provenance review resumes.

### Shot DTO Extension

Extend `ShotDto` with:

- `stages: Vec<StageDto>` with `#[serde(default)]`
- `active_stage_id: Option<String>` with `#[serde(default, skip_serializing_if = "Option::is_none")]`

This keeps older fixtures and clients tolerant of missing fields while allowing new clients to read authored Stage state from `shot_loaded`.

Rationale: `shot_loaded` is the existing bridge snapshot boundary, so Stage state should travel with the rest of the authored shot read model.

Rejected alternatives: a separate stage-loaded event would introduce ordering and cache questions before handlers exist; omitting `active_stage_id` would make the first UI integration guess selection state.

### Command Variants

Add these `BridgeCommand` variants:

- `CreateStage { shot_id, stage_id, display_name, base_transform, tags }`
- `DuplicateStage { shot_id, source_stage_id, stage_id, display_name }`
- `DeleteStage { shot_id, stage_id }`
- `SetActiveStage { shot_id, active_stage_id }`
- `UpdateStage { shot_id, stage_id, display_name, base_transform, tags }`
- `UpdateStageElement { shot_id, stage_id, element_id, display_name, base_transform, visible, locked }`
- `ReplaceStageRenderable { shot_id, stage_id, renderable_id, renderable }`
- `PromoteStageContentToProp { shot_id, stage_id, element_id, prop_id, display_name }`
- `DemotePropToStageContent { shot_id, prop_id, stage_id, element_id, renderable_id, display_name }`

All optional payload fields must use serde defaults and skip serialization when absent. All nine commands are `TransactionClass::DurableMutation`.

Rationale: these are the smallest command names needed to cover Stage lifecycle, Stage edits, and the Stage/Prop boundary already described by ADR-0050 and the STL-451 parent.

Rejected alternatives: splitting promote/demote out of the wire contract would make STL-480 invent incompatible command names; adding broader batch commands would make STL-478 more than a protocol split.

### Success Events

Add these `BridgeEvent` variants:

- `StageCreated { shot_id, stage, active_stage_id }`
- `StageDuplicated { shot_id, source_stage_id, stage }`
- `StageDeleted { shot_id, stage_id, active_stage_id }`
- `ActiveStageChanged { shot_id, active_stage_id }`
- `StageUpdated { shot_id, stage }`
- `StageElementUpdated { shot_id, stage_id, element }`
- `StageRenderableReplaced { shot_id, stage_id, renderable }`
- `StageContentPromotedToProp { shot_id, stage_id, element_id, prop }`
- `PropDemotedToStageContent { shot_id, prop_id, stage_id, element }`

Use full DTO echoes when the caller needs the canonical post-mutation shape. Use ids only for delete-style events. This matches the direction from PR #360 while keeping handler implementation out of this issue.

Rationale: full DTO echoes give later editor code a canonical post-mutation payload without recomputing nested Stage shape from partial patches.

Rejected alternatives: ids-only events would require immediate refetch semantics that the bridge does not have; full-shot echoes on every Stage event would increase payload size and obscure the mutation boundary.

### Rejection Codes

Add these `CommandRejectionCode` variants:

- `StageNotFound`
- `StageElementNotFound`
- `StageRenderableNotFound`
- `DuplicateStageId`
- `StageTargetNotEditable`
- `StageBoundaryViolation`
- `InvalidStagePayload`

Reuse existing codes for non-Stage-specific failures:

- `ShotNotFound`
- `DuplicateEntityId`
- `ReservedEntityId`
- `AssetNotFound`
- `InvalidDisplayName`
- `DuplicateDisplayName`
- `NonFiniteTransform`
- `BundleValidationFailed`

Rationale: callers can only recover well if Stage-specific target failures are distinguishable from generic entity failures, while broad validation and asset failures should keep existing vocabulary.

Rejected alternatives: using only `EntityNotFound` would make Stage diagnostics vague; inventing new codes for shot, asset, or transform failures would duplicate established bridge semantics.

### Engine Dispatch Boundary

Because engine dispatch matches `BridgeCommand` exhaustively, the implementation may add minimal dispatch arms for the new Stage commands only to preserve compilation. Those arms must not implement real Stage mutation behavior in STL-478.

The preferred policy is to route all new Stage authoring commands to one narrow placeholder helper that emits `CommandRejected` with `InvalidStagePayload` and a message naming the sibling implementation issue. This is intentionally temporary and must be documented as “wire accepted, runtime behavior not implemented until STL-479/STL-480.” If reviewers object to placeholder runtime rejection in the same PR, stop and ask before broadening behavior.

Rationale: Rust exhaustive matching requires a compile-safe path after adding command variants, but STL-478 must not smuggle in the handler behavior that made PR #360 too large.

Rejected alternatives: implementing handlers here repeats the #360 scope problem; leaving engine dispatch uncompilable blocks all verification; adding a wildcard match weakens future exhaustiveness checks.

## Risk Map

| Risk | Evidence | Plan response | Test proof |
| --- | --- | --- | --- |
| Error source chain | This spec adds bridge rejection codes, not new Rust error wrappers around external libraries. | N/A for `std::error::Error::source`; keep rejection messages as user-facing bridge diagnostics and do not introduce new error enums. | Serde rejection-code fixture round trips and TS literal coverage. |
| Schema compatibility | `ShotDto` gains new fields and command/event enums gain new variants. | Use additive fields, serde defaults, no protocol version bump, fixture snapshots for drift. | Rust fixture generation and editor bridge snapshot tests. |
| Ownership/API boundary | ADR-0050 separates Stage-owned content from shot-owned Props. | DTOs expose Stage vocabulary; promote/demote commands exist at wire level only. | Contract docs list boundary commands and non-goals; no mutation tests in STL-478. |
| Partial mutation/rollback | Runtime mutation belongs to sibling handlers, but command variants may tempt implementation. | Compile shim must only reject, with no dirty-state, undo, ECS, selection, or model edits. | Engine compile plus focused test asserting placeholder rejection if a shim test is added. |
| Diagnostic ownership | New rejection codes affect caller behavior and docs. | Add only seven Stage-specific codes; reuse existing shot, asset, display, transform, and bundle validation codes. | Generated command_rejected fixtures for every new code. |
| Test oracle strength | TypeScript mirrors can drift from Rust enum payloads. | Rust-generated JSON fixtures remain the oracle; TS tests consume snapshots from those fixtures. | `cargo test -p shotloom-core --test generate_bridge_fixtures` and editor bridge tests. |
| Scope creep | PR #360 mixed wire, engine behavior, provenance, module split, and docs. | Non-goals exclude handler behavior, provenance behavior, UI, and module split. | PR diff should have no Stage mutation tests or large `handlers/stage.rs` implementation. |
| Reviewer objection | Placeholder runtime rejection may look like behavior. | Document it as compile shim only and name sibling issues; stop if reviewers prefer another strategy. | PR body and IPC docs include split context. |
| One-PR suitability | The wire contract touches Rust core, TS mirrors, fixtures, and docs. | This is one reviewable PR because all touched files prove one protocol surface and exclude runtime behavior. | PR review can validate fixture parity without handler semantics. |

## Non-Goals

- No lifecycle/edit handler implementation for create, duplicate, delete, set active, update, update element, or replace renderable.
- No Stage/Prop promote or demote behavior.
- No new Stage provenance mutation behavior.
- No editor UI state, commands, reducers, or controls outside bridge type and fixture validation code.
- No handler module split.
- No migration of existing background prop debug commands into Stage authoring.
- No protocol version bump; these are additive variants and fields.

## Implementation Spec

Before editing, re-check `origin/main` for `BridgeCommand`, `BridgeEvent`, `CommandRejectionCode`, `ShotDto`, engine bridge dispatch, TS bridge unions, and `docs/ipc/bridge-contract.md`. If `main` already gained any Stage authoring wire variants, reconcile with the live shape instead of applying this spec mechanically.

### Rust Core

1. Add `stage_dto.rs` under `crates/shotloom-core/src/bridge/`.
2. Export `StageDto`, `StageElementDto`, and `StageRenderableDto` from `bridge/mod.rs`.
3. Convert Stage model values into DTOs with `From<&StageModel>`, `From<&StageElement>`, and `From<&StageRenderable>`.
4. Extend `ShotDto::from(&ShotModel)` to emit `stages` and `active_stage_id`.
5. Add command/event variants and `kind()` string mappings.
6. Add rejection code variants and keep the SCREAMING_SNAKE_CASE wire format stable.
7. Add transaction-class coverage asserting all new commands are `DurableMutation`.
8. Add serde round-trip tests for DTO defaults and new command/event payloads.

### Rust Engine Compile Shim

1. Update exhaustive dispatch only as much as needed for compilation.
2. Keep the helper private to bridge dispatch or an existing handler module.
3. Emit `CommandRejected` with `InvalidStagePayload` for the placeholder path.
4. Do not touch model mutation, ECS spawning/despawning, selection, dirty state, undo/redo history, or transaction helper behavior.

### Fixtures

1. Extend `crates/shotloom-core/tests/generate_bridge_fixtures.rs`.
2. Add command fixtures for all nine commands.
3. Add success event fixtures for all nine success events.
4. Add rejection fixtures for all seven new rejection codes.
5. Update ratchet exemptions only if there is a documented reason; the default is no new uncovered code.

### TypeScript

1. Mirror DTOs and payload unions in `apps/editor/src/bridge/types.ts`.
2. Extend `apps/editor/src/bridge/shot.ts` to accept `stages` and `activeStageId` or the local naming convention already used in that file.
3. Add snapshots in `apps/editor/src/bridge/__tests__/`.
4. Keep UI action creators, React components, and editor state changes out of scope.

### Documentation

1. Add a Stage authoring command matrix section to `docs/ipc/bridge-contract.md`.
2. Document success event payloads and rejection codes.
3. Update `shot_loaded` / `ShotDto` docs for `stages` and `active_stage_id`.
4. Add a note that STL-478 is wire-only and sibling issues implement runtime behavior.
5. Keep terms aligned with ADR-0050: Stage, element, renderable, Stage-owned, shot-owned Prop, promote, demote.

## Acceptance Criteria

- Rust bridge protocol exposes Stage DTOs, commands, events, rejection codes, and `ShotDto` additions.
- TypeScript bridge mirrors match generated fixtures.
- Generated bridge fixtures include commands, success events, and rejection examples for the new Stage surface.
- IPC docs cover command matrix, success events, rejection codes, and wire-only boundary.
- Engine runtime Stage mutation behavior is not implemented in this PR beyond the compile shim.
- PR description clearly says this resolves STL-478 and is split from STL-451 / PR #360.

## Verification

Run focused checks first:

```sh
cargo test -p shotloom-core --test generate_bridge_fixtures
pnpm --filter @shotloom/editor test -- bridge
```

Then run the expected Shotloom gates before PR:

```sh
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo test --workspace --exclude shotloom-desktop
pnpm validate:docs
```

If local time is tight, report exactly which full gates were not run and why. Do not claim review readiness without at least fixture generation, TS bridge tests, and formatting.

## Traps

- Do not paste the whole PR #360 implementation into STL-478. The old branch is a reference, not the target diff.
- Do not add real handler behavior while trying to satisfy Rust exhaustive matches.
- Do not hide Stage-specific caller actions behind broad `EntityNotFound` when a new code is required by this spec.
- Do not add Stage UI code just because TypeScript types now exist.
- Do not update `MAP.md` unless the file map actually changes.
- Do not describe the placeholder rejection as the final runtime behavior.

## Follow-Up Candidates

- STL-479: lifecycle/edit handler behavior.
- STL-480: Stage/Prop boundary, promote/demote, and asset provenance behavior.
- STL-481: review hardening and edge-case tests.
- STL-477: handler module split after the handler surface exists.
