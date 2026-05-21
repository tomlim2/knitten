---
status: ready
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-505
repo: shotloom
linear: STL-505
spec: ../../plans/proposed/bridge-bound-stage-mood-echo.md
---

### Shotloom coding mode — bridge

**Issue:** STL-505 "Bound SetStageMood rejection and log mood echo"
  Problem: PR #388 review noted that `handle_set_stage_mood` still renders the caller-supplied `mood` string raw in both rejection text and the `tracing::warn!` mood field.
  Acceptance:
  - Apply bounded diagnostic display to unknown mood rejection text.
  - Apply bounded diagnostic display to the `tracing::warn!` mood field.
  - Add an unknown-mood regression test with a control-character payload.
  Exclusions:
  - No `SetStageMood` command schema changes.
  - No mood preset parsing behavior changes.
  - No rejection code changes.
  Affected: `crates/shotloom-engine/src/bridge/handlers/stage.rs`, `crates/shotloom-engine/src/bridge/tests/lifecycle.rs`; no expected TypeScript/schema change.
  Linked: follow-up from CINEV/shotloom#388 review body; parent STL-479; related STL-502.

**Branch:** fix/bridge-bound-stage-mood-echo  (base: origin/main 65c5af10)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/ipc/bridge-contract.md
**ADRs to honor:** ADR-0003 wasm-bindgen command/event bridge; ADR-0018 runtime telemetry and error boundaries
**Ask-first triggers for this task:** bridge command/event schema changes, rejection code changes, mood parsing/fallback behavior changes, TypeScript bridge mirror changes, new logging/tracing infrastructure, broad diagnostic policy changes, new dependencies, ADR edits.
**Intent lens:** Prevent control-character or overlong caller-supplied mood strings from leaking raw into command rejection diagnostics or structured logs. The intended work is display hardening for an existing rejection path, not a behavior, schema, or code redesign.
**User clarification:** Include the small IPC documentation correction discovered during briefing: unknown `SetStageMood` bridge command values reject with `UNKNOWN_MOOD`, while startup/bundle fallback remains separate.

**AC primitive cross-check:**
- Rejection message uses bounded display: codified - `crates/shotloom-core/src/model/id.rs::BoundedDisplay` is the existing helper for attacker-controlled diagnostic rendering, and `docs/guidelines/error-handling.md` classifies identified command refusal as `CommandRejectedPayload`.
- `tracing::warn!` mood field uses bounded display: codified - ADR-0018 says telemetry fields should carry command correlation data and avoid unsafe user content; `BoundedDisplay`'s `Display` impl caps and `escape_debug`-renders the value.
- Unknown-mood regression test with control-character payload: verification-example - existing `crates/shotloom-engine/src/bridge/tests/lifecycle.rs::set_stage_mood_rejects_unknown_preset` already asserts `UNKNOWN_MOOD` and no state mutation; extend or add a focused safety assertion without changing command semantics.
- No schema, parsing behavior, or rejection-code changes: codified - `error-handling.md` says bridge code changes require Rust enum, fixture, TS mirror, and frontend handling; Linear explicitly excludes these surfaces.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Requirements - both sinks must be hardened from the same bounded display value: `tracing::warn!(mood = %...)` and `ctx.reject(..., format!(...))`. Evidence: `crates/shotloom-engine/src/bridge/handlers/stage.rs::handle_set_stage_mood` currently uses raw `%mood` and `format!("Unknown mood preset '{mood}'")`. AC-trace: STL-505 scope 1/2.
- P1: Non-Goals - keep `CommandRejectionCode::UnknownMood`, `BridgeCommand::SetStageMood { mood: String }`, `MoodPreset` parsing, and `StageMoodChanged` success behavior unchanged. Evidence: Linear exclusions; `crates/shotloom-core/src/bridge/mod.rs` owns these wire shapes and codes. AC-trace: STL-505 exclusions.
- P2: Verification - add a focused unknown-mood test using a payload with a newline/control character and an overlong suffix; assert rejection code/correlation, preserved prior mood, escaped control characters, and bounded/elided rendered value. Avoid full-message snapshots or strict post-escape length math. Evidence: `BoundedDisplay` bounds inner scalar length before `escape_debug`, and PR #388 review already pushed away from brittle exact length assertions. AC-trace: STL-505 scope 3.
- P2: Bridge docs parity - `docs/ipc/bridge-contract.md` §13A.1 says unknown mood strings fall back to `"neutral"`, while live code/tests reject with `UNKNOWN_MOOD` and `stage_setup.rs` comments name the bridge rejection path. Include the tiny docs correction in this task, preserving startup/bundle fallback as a separate path. Evidence: `docs/ipc/bridge-contract.md` §13A.1, `stage.rs::handle_set_stage_mood`, `lifecycle.rs::set_stage_mood_rejects_unknown_preset`. AC-trace: bridge category standards and user clarification.
- P3: Implementation shape - prefer direct `BoundedDisplay::new(&mood)` or a tiny local `bounded_display` helper over introducing a generic diagnostic sanitizer. Evidence: STL-502 used a local `bounded_id` helper in `stage.rs`, and prop handlers directly use `BoundedDisplay::new(...)`. AC-trace: scope containment.

**Sibling specs (Knitten docs):**
- `bridge-bound-stage-rejection-ids.md` - HEAD/proposed + briefing - stance: STL-502 bounds Stage authoring identifier rejection echoes with `BoundedDisplay`; agrees on helper choice and display-only scope, but excludes non-identifier mood strings, making STL-505 a proper follow-up rather than overlap.
- Recently deleted sibling specs: none found for STL-505, SetStageMood, stage mood, bounded display, diagnostic echo, or the derived slug.

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
