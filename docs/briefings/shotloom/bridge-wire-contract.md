---
status: ready
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-478
repo: shotloom
linear: STL-478
spec: ../../plans/proposed/bridge-wire-contract.md
---

### Shotloom coding mode — bridge

**Issue:** STL-478 "Stage authoring bridge wire contract 분리"
  Problem: Split the Stage authoring bridge wire contract out of the oversized STL-451 / PR #360 work so Rust, TypeScript, fixtures, and IPC docs can be reviewed without engine handler behavior.
  Acceptance:
  - Rust bridge command/event/rejection code, Stage DTOs, and Shot DTO extensions are defined.
  - TypeScript bridge mirrors and generated fixture/editor snapshot tests prove wire parity.
  - `docs/ipc/bridge-contract.md` documents command matrix, success events, and rejection codes.
  - Engine handler behavior, Stage/Prop provenance behavior, module split, and editor UI remain out of scope.
  - PR body names the STL-451 split-from-#360 context.
  Affected: `crates/shotloom-core/src/bridge/`, `crates/shotloom-core/tests/generate_bridge_fixtures.rs`, `apps/editor/src/bridge/types.ts`, `apps/editor/src/bridge/shot.ts`, `apps/editor/src/bridge/__tests__/`, `docs/ipc/bridge-contract.md`, `contracts/README.md`, `MAP.md`
  Linked: ADR-0003, ADR-0026, ADR-0027, ADR-0042, ADR-0050, ADR-0051, sibling STL-479/STL-480/STL-481/STL-477

**Branch:** `feat/bridge-wire-contract`  (base: `origin/main`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, CLAUDE.md, docs/adr/README.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/guidelines/review-typescript.md, docs/guidelines/code-review-guideline.md, docs/ipc/bridge-contract.md, contracts/README.md
**ADRs to honor:** ADR-0003 wasm-bindgen command/event bridge, ADR-0026 bridge ordering contract (Proposed), ADR-0027 engine bridge schedule (Proposed), ADR-0042 canonical timeline shape across bridge, ADR-0050 Stage entity model, ADR-0051 contract authority tiers
**Ask-first triggers for this task:** bridge protocol / contract changes are normally ask-first per AGENTS.md; this briefing exists because the user explicitly requested the STL-478 split. Any payload shape that changes sibling scope, adds runtime handler behavior, or alters persistence schema still needs explicit confirmation in the spec.
**Intent lens:** Prevent the closed PR #360 from remaining one unreviewable Stage authoring mega-PR. This slice should create the smallest durable wire contract that later STL-479/STL-480/STL-481 PRs can implement against without continuing to grow `handlers/stage.rs`.

**AC primitive cross-check:**
- Rust/TS wire parity: codified - `contracts/README.md` names Bridge protocol as repository-internal verification artifact; `docs/ipc/bridge-contract.md` §35 defines Rust fixture generation plus TypeScript contract validation.
- Command/event/rejection code additions: codified - `docs/guidelines/error-handling.md` §3 says command/domain refusals use `CommandRejectedPayload` and new codes require Rust enum, contract test, TS mirror, and frontend handler update if applicable.
- Stage DTO / Shot DTO extension: codified - `docs/guidelines/review-rust.md` §7 and `docs/ipc/bridge-contract.md` §21.7 require serde-compatible bridge DTOs and explicit missing-key behavior.
- IPC command matrix / examples: codified - `docs/guidelines/code-review-guideline.md` §5 requires semantic docs review for IPC narrative changes; `docs/ipc/bridge-contract.md` is the owning document.
- Engine handler implementation: sibling-owned - STL-479 owns lifecycle/edit handlers; STL-480 owns promote/demote and asset provenance; STL-481 owns edge-case hardening; STL-477 owns module split.
- PR body split context: verification-example - not a repo primitive, but required by STL-478 to keep reviewer routing clear after PR #360 was closed.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Which exact Stage command/event variants belong in the wire-only slice, and which should be placeholders left to handler PRs? - evidence: `crates/shotloom-core/src/bridge/mod.rs` currently has `BridgeCommand`, `BridgeEvent`, and `CommandRejectionCode` but no authored Stage family; AC-trace: STL-478 scope + closed PR #360 split.
- P1: Should success events echo full DTO payloads, ids only, or a mix per command? Lock this before implementation because fixtures, docs, and TS reducers all depend on it. - evidence: `BridgeEvent::ShotLoaded` uses `ShotDto`, while many existing success events use compact payloads; AC-trace: STL-478 command/event DTO scope and bridge-contract §35.
- P1: How does `ShotDto` expose `stages` and `active_stage_id` without coupling the bridge read model to persistence-only fields? - evidence: `crates/shotloom-core/src/bridge/timeline_dto.rs::ShotDto` currently exposes character groups, props, and cine cameras but not stages; AC-trace: Stage DTO / Shot DTO extension.
- P1: New rejection-code names must be stable and not duplicate existing broad codes. Decide which Stage failures get new codes and which reuse `SHOT_NOT_FOUND`, `ASSET_NOT_FOUND`, `INVALID_DISPLAY_NAME`, `NON_FINITE_TRANSFORM`, or `BUNDLE_VALIDATION_FAILED`. - evidence: `CommandRejectionCode` enum and `error-handling.md` bridge vocabularies; AC-trace: rejection-code documentation.
- P2: Fixture coverage must include representative command, success event, and command_rejected examples for every new rejection code or an explicit ratchet exemption. - evidence: `generate_bridge_fixtures.rs` ratchets `CommandRejectionCode` coverage; AC-trace: bridge fixture/editor snapshot proof.
- P2: TypeScript mirrors should remain in bridge type files only; editor UI state/actions stay out of STL-478 unless needed for contract tests. - evidence: `apps/editor/src/bridge/types.ts`, `apps/editor/src/bridge/shot.ts`, and `review-typescript.md` §2; AC-trace: out-of-scope UI wiring.
- P2: Contract docs must say this is wire shape only and implementation behavior lands in sibling issues, otherwise reviewers may expect runtime mutations in the same PR. - evidence: closed #360 split and sibling issues STL-479/STL-480/STL-481/STL-477; AC-trace: STL-478 problem statement.
- P3: Update MAP.md only if new bridge DTO module/file names are added; otherwise avoid navigation churn. - evidence: MAP.md already points at bridge core, TS mirrors, and contract fixtures; AC-trace: co-location checklist.

**Sibling specs (agent-hub/docs/plans/):**
- `proposed/bridge-add-stage-authoring-contract.md` - HEAD - stance: original all-in-one STL-451 spec covering wire contract plus engine handlers, promotion/demotion, docs, and tests - agrees on command vocabulary but is too broad for STL-478; split it and keep only wire-contract parts.
- `proposed/core-stage-renderable-provenance.md` - HEAD - stance: core persistence/provenance model; explicitly non-goal bridge commands/events/TS DTOs - agrees by defining upstream model fields that STL-478 may expose, but bridge work starts only here.
- `proposed/editor-wire-stage-import-commands.md` - HEAD - stance: editor wiring for existing background prop debug commands; no protocol/schema changes - sibling boundary reminder, not part of authored Stage wire contract.
- `proposed/core-add-shot-local-stage-model.md` - HEAD - stance: core `StageModel` persistence and validation already created before bridge commands - agrees; STL-478 should consume this model and not redesign persistence.
- `proposed/adr-record-stage-entity-model.md` - HEAD - stance: records ADR-0050 and stage entity vocabulary - agrees; use Stage/element/renderable and set_dressing terminology exactly.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; stale inactive `deemotl` token still causes `gh auth status` exit 1 but active account is correct
- [x] commit identity: tomlim2 <tomandlim@gmail.com>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans; full body read for directly relevant matches)
- [x] worktree created: `shotloom/.worktrees/bridge-wire-contract`
- [x] Linear state moved to In Progress

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
