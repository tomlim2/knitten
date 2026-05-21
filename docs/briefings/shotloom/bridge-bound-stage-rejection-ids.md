---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-502
repo: shotloom
linear: STL-502
spec: ../../plans/proposed/bridge-bound-stage-rejection-ids.md
---

### Shotloom coding mode — bridge

**Issue:** STL-502 "Stage authoring rejection ID echo BoundedDisplay 적용"
  Problem: PR #384 review found that Stage authoring rejection messages can echo raw `shot_id`, `stage_id`, `source_stage_id`, `element_id`, `renderable_id`, and `asset_id` values.
  Acceptance:
  - Inspect Stage authoring rejection details in `crates/shotloom-engine/src/bridge/handlers/stage.rs`.
  - Apply `BoundedDisplay` to untrusted/user-supplied identifier echoes.
  - Adjust tests only where they depend too tightly on full rejection-message strings.
  Affected: `crates/shotloom-engine/src/bridge/handlers/stage.rs`, `crates/shotloom-engine/src/bridge/tests/stage.rs`, possibly shared bridge test assertion helpers.
  Linked: Follow-up from PR #384 review nit; parent STL-479.

**Branch:** fix/bridge-bound-stage-rejection-ids  (base: origin/main 12bcb9d7)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/guidelines/code-review-guideline.md, docs/guidelines/spec-procedure-guideline.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0003 wasm-bindgen command/event bridge, ADR-0026 bridge ordering contract, ADR-0050 Stage entity model
**Ask-first triggers for this task:** rejection code changes, bridge command/event schema changes, Stage mutation behavior changes, broad non-Stage diagnostic policy changes, new dependencies, ADR edits.
**Intent lens:** Reduce diagnostic/log injection and overlong-message risk in Stage authoring command rejection text without changing command semantics. The work is defensive display hardening, not a behavior or protocol redesign.

**AC primitive cross-check:**
- Scope 1, inspect Stage authoring rejection details: codified - `docs/guidelines/error-handling.md` classifies command refusals as `CommandRejectedPayload`; `crates/shotloom-engine/src/bridge/handlers/stage.rs` owns the Stage authoring rejection message construction.
- Scope 2, apply `BoundedDisplay` to untrusted/user-supplied ids: codified - `crates/shotloom-core/src/model/id.rs` defines `BoundedDisplay` for attacker-controlled diagnostic rendering; `crates/shotloom-engine/src/bridge/handlers/props.rs` already uses it for prop/background-map id echoes.
- Scope 3, adjust message-sensitive tests only as needed: verification-example - `crates/shotloom-engine/src/bridge/tests/helpers/assertions.rs::expect_rejection` asserts code/correlation and returns the payload for focused message assertions; most Stage tests currently assert rejection code rather than full message.
- Exclusions, no rejection code/schema/behavior change: codified - `docs/guidelines/error-handling.md` says code changes require enum/fixture/TS mirror work; STL-502 explicitly excludes those surfaces.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements - define the exact identifier echo policy: every message containing untrusted command id values in Stage authoring handlers should render via `BoundedDisplay`, while static field names such as `stage_id` stay literal. Evidence: `BoundedDisplay` docs in `crates/shotloom-core/src/model/id.rs`; raw echoes in `stage.rs` at invalid, duplicate, missing, locked, and asset mismatch branches. AC-trace: STL-502 scope 1/2 and PR #384 nit.
- P1: Non-Goals - no rejection-code, command/event schema, or Stage mutation behavior changes. Evidence: STL-502 exclusion list; `error-handling.md` bridge code-change checklist. AC-trace: STL-502 exclusions.
- P2: Verification - add or update a focused test that sends a long/control-character Stage id through at least one Stage authoring rejection and asserts the message is bounded/escaped, not necessarily exact full text. Evidence: `expect_rejection` returns `CommandRejectedPayload`; `BoundedDisplay` has max-length and `escape_debug` tests in core. AC-trace: STL-502 scope 2/3.
- P2: Implementation Spec - prefer a small local formatting helper in the Stage handler if it reduces repeated `BoundedDisplay::new(...)` boilerplate without hiding which field is being displayed. Evidence: repeated raw `format!` call sites in `stage.rs`; existing prop handler uses direct `BoundedDisplay::new(...)` at each message. AC-trace: STL-502 scope 1/2.
- P3: Traps - do not over-normalize ids before parsing. `StageId::new`, `ShotId::new`, etc. still own validity; `BoundedDisplay` is only for rejection text. Evidence: id constructors already reject invalid ids and their `Display` impls use `BoundedDisplay`. AC-trace: STL-502 intent lens.

**Sibling specs (Knitten docs):**
- `bridge-add-stage-authoring-contract.md` - HEAD/proposed + briefing - stance: defines and implements the Stage authoring bridge command family later merged through PR #384; agrees because STL-502 is a narrow post-review diagnostic-display follow-up after that command family exists.
- Deleted sibling specs: none found for `STL-502`, `BoundedDisplay`, rejection ID echo, or the derived slug.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; inactive `deemotl` token warning observed but not used
- [x] Shotloom repo commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, ADR index
- [x] category: bridge
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans/ + docs/briefings/shotloom/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
