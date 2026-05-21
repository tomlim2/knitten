---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-505
repo: shotloom
linear: STL-505
briefing: ../../briefings/shotloom/bridge-bound-stage-mood-echo.md
---

# Bound SetStageMood Mood Echo

## Spec Contract

- Briefing basis: `../../briefings/shotloom/bridge-bound-stage-mood-echo.md`
  defines STL-505 as a narrow follow-up from PR #388 review.
- Current truth: `handle_set_stage_mood` rejects unknown mood strings with
  `UNKNOWN_MOOD`, but its rejection message and `tracing::warn!` field still
  render caller-supplied `mood` raw.
- Required change: render the unknown mood value through `BoundedDisplay` in
  both the rejection text and the warning field.
- Locked boundary: no command schema change, no mood parsing behavior change,
  no rejection-code change, no TypeScript bridge mirror change, and no generic
  diagnostic abstraction.
- Proof method: focused engine bridge test for a control-character/overlong
  unknown mood payload, plus a small IPC contract correction that matches the
  already-live `UNKNOWN_MOOD` behavior.

## Current State

| Surface | Path / Symbol | Classification | Evidence |
|---|---|---|---|
| Unknown mood handler | `crates/shotloom-engine/src/bridge/handlers/stage.rs::handle_set_stage_mood` | Partial | Success normalizes and emits `StageMoodChanged`; failure logs `mood = %mood` and rejects with `format!("Unknown mood preset '{mood}'")`. |
| Bounded diagnostic helper | `crates/shotloom-core/src/model/id.rs::BoundedDisplay` | Already Done | Caps attacker-controlled diagnostic text to 256 Unicode scalars and `escape_debug` renders control characters. |
| Unknown mood test | `crates/shotloom-engine/src/bridge/tests/lifecycle.rs::set_stage_mood_rejects_unknown_preset` | Partial | Asserts `UNKNOWN_MOOD` and preserved prior mood, but only checks a normal ASCII payload. |
| Bridge wire shape | `crates/shotloom-core/src/bridge/mod.rs::BridgeCommand::SetStageMood` and `CommandRejectionCode::UnknownMood` | Already Done | Command payload is `mood: String`; the rejection code already exists and must stay unchanged. |
| TypeScript mirror | `apps/editor/src/bridge/types.ts::SetStageMoodCommand` | Already Done / Do not change | Mirrors the existing command payload shape; STL-505 does not change the schema. |
| IPC docs | `docs/ipc/bridge-contract.md` §13A.1 | Conflict | Says unknown mood strings fall back to `"neutral"`, while live handler/tests reject bridge commands with `UNKNOWN_MOOD`. |
| Fixture snapshot | `apps/editor/src/bridge/__tests__/__snapshots__/command_rejected_unknown_mood.expected.json` | Already Done | Documents `UNKNOWN_MOOD` as bridge-visible fixture behavior. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-505` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Bound caller-supplied unknown mood text in rejection diagnostics and logs. |
| Acceptance criteria | Bound rejection message; bound `tracing::warn!` mood field; add control-character regression test. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-479`; related `STL-502`. |
| Related PRs | Follow-up from PR #388 review body. |
| Current review state | No PR yet. |
| Planning consequence | One small PR is suitable; include the IPC doc correction because it is a discovered current-state conflict for the same command behavior. |

## Problem

The engine already rejects unknown `SetStageMood` values with
`CommandRejectionCode::UnknownMood`, preserving the previous mood state. The
remaining defect is only how the rejected value is displayed: a caller can send
a mood string containing control characters or excessive length, and that raw
text can appear in both command rejection diagnostics and structured logs.

A live-code audit also found a documentation conflict: IPC §13A.1 says unknown
bridge mood strings fall back to `"neutral"`, but the actual bridge handler and
fixture behavior reject with `UNKNOWN_MOOD`. `stage_setup.rs` still has a
separate startup/bundle fallback path; the bridge command path should be
documented as rejection-only.

## Options Considered

| Option | Decision | Rationale |
|---|---|---|
| Use `BoundedDisplay` directly in the unknown-mood branch | Selected | Reuses the existing diagnostic display primitive and keeps the PR small. |
| Add a generic diagnostic sanitizer helper | Rejected | Broader than STL-505 and would force a cross-handler policy review. |
| Change `MoodPreset` parsing or fallback behavior | Rejected | Linear excludes parsing behavior changes; live tests already encode `UNKNOWN_MOOD`. |
| Leave IPC docs unchanged | Rejected | The doc currently contradicts the code path touched by this task; correcting it prevents review confusion without changing runtime behavior. |

## Requirements

1. `handle_set_stage_mood` must render an unknown mood value through
   `BoundedDisplay` in the `CommandRejectedPayload.message`.
   Trace: STL-505 scope and `BoundedDisplay` precedent.
2. `handle_set_stage_mood` must render the same bounded value in the
   `tracing::warn!` `mood` field.
   Trace: STL-505 scope and ADR-0018 telemetry discipline.
3. The implementation must keep `CommandRejectionCode::UnknownMood`, the
   `SetStageMood { mood: String }` wire shape, and `MoodPreset` parsing
   behavior unchanged.
   Trace: STL-505 exclusions.
4. Tests must cover an unknown mood payload with a control character and
   overlong suffix, and must assert preserved prior mood state.
   Trace: STL-505 regression-test AC.
5. The test should assert display safety properties rather than a brittle full
   rejection sentence: escaped control characters, absence of raw control
   characters, and elision/bounding evidence.
   Trace: PR #388 review precedent and `BoundedDisplay` semantics.
6. IPC §13A.1 must describe the bridge command path as `UNKNOWN_MOOD`
   rejection for unknown values, while preserving the distinction from
   startup/bundle fallback behavior outside the bridge command path.
   Trace: live docs conflict in current-state audit.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new typed error or wrapped source is introduced. | Keep inline command rejection payload construction. | N/A: no `Result<T, E>` or external source. |
| Schema / serialization compatibility | yes | `BridgeCommand::SetStageMood`, `CommandRejectionCode::UnknownMood`, TS mirror. | Preserve all wire types, fixture shape, and rejection code. | Existing bridge fixture/meta tests remain applicable; diff check shows no schema change. |
| Ownership / API boundary | yes | Engine owns command handler; core owns bridge DTOs and `BoundedDisplay`. | Keep behavior in `shotloom-engine`, reuse `shotloom-core::model::BoundedDisplay`. | `cargo check -p shotloom-engine`. |
| Partial mutation / rollback | yes | Unknown mood path rejects after parsing failure; prior mood must remain unchanged. | Only change display text in the failure branch. | Regression test asserts seeded mood remains unchanged. |
| Diagnostic ownership | yes | `CommandRejectedPayload.message` and `tracing::warn!` field. | Bound the caller value; do not add diagnostics or codes. | Regression test inspects rejection payload; code review verifies warn field uses bounded value. |
| Local absolute path exposure | no | No path, manifest, asset, or config output is added. | Avoid machine-local paths in docs/tests. | N/A: no path artifact. |
| Manifest path containment | no | No manifest/catalog path handling. | None. | N/A. |
| Command rejection matrix | yes | `SetStageMood` changed failure display only. | Keep success and rejection branches identical except display. | Existing success test plus updated unknown-mood rejection test. |
| Cross-platform CLI entrypoint | no | No Node/CLI script change. | None. | N/A. |
| Asset/data pack lifecycle | no | No assets or binary fixtures. | None. | N/A. |
| Validation context downgrade | no | No validator API change. | None. | N/A. |
| Field-set drift | no | No DTO fields or manual field list change. | None. | N/A. |
| Bridge docs parity | yes | IPC §13A.1 conflicts with live `UNKNOWN_MOOD` behavior. | Correct the doc to match code and fixture behavior. | `node scripts/validate-doc-paths.mjs`; doc diff review. |
| Event-state visibility | yes | Accepted `SetStageMood` emits `StageMoodChanged`; rejected command emits `command_rejected`. | Do not touch success event behavior. | Existing success test remains unchanged; rejection test asserts no state mutation. |
| Input constraint parity | yes | `mood` is a free-form string bridge input. | Keep schema-free parsing but bound diagnostic display for invalid values. | Control-character/overlong rejection test. |
| Test oracle strength | yes | Display hardening can compile without being proven. | Assert escaped control characters and elision evidence. | Test fails before `BoundedDisplay`, passes after. |
| Scope creep | yes | Adjacent cleanup could touch broader diagnostic policy or TS fixtures. | Non-goal broad sanitizer/schema/fixture changes. | Diff review. |
| Reviewer objection | yes | Likely objection: docs still claim fallback or logs remain raw. | Include both code sinks plus IPC correction in scope. | Test + doc diff + code review of warn field. |

## Locked Decisions

1. **Use `BoundedDisplay` for mood display, not validation.**

   Rationale: `MoodPreset::from_str` still owns accepted values. The display
   helper only makes rejected text safe for logs and diagnostics.

   Rejected alternatives: changing `MoodPreset` parsing or pre-normalizing
   unknown input would alter command behavior.

2. **Keep the rejection vocabulary stable.**

   Rationale: `UNKNOWN_MOOD` already exists in Rust, fixtures, and TypeScript
   snapshots. STL-505 is not a protocol change.

   Rejected alternatives: adding a new code would trigger bridge enum, fixture,
   TypeScript, and docs work unrelated to this defect.

3. **Correct IPC docs where they contradict live bridge behavior.**

   Rationale: A reviewer following §13A.1 would expect fallback instead of
   rejection. The correction is small and directly tied to the same command.

   Rejected alternatives: leaving the mismatch as follow-up would invite a
   predictable review comment on this PR.

4. **Test safety properties rather than exact copy.**

   Rationale: The stable contract is code/correlation/state plus safe rendering,
   not the full English sentence.

   Rejected alternatives: full snapshots or strict post-escape length math are
   brittle and weaker than targeted safety assertions.

## Non-Goals

- No `SetStageMood` payload or serde shape change.
- No TypeScript bridge type or snapshot change.
- No new `CommandRejectionCode`.
- No mood preset additions, aliases, or fallback behavior changes.
- No change to startup/bundle mood fallback in `stage_setup.rs`.
- No generic bridge diagnostic sanitizer.
- No ADR update.
- No editor UI change.

## Design Plan

### S0 - Baseline Re-Check

Input:
- `crates/shotloom-engine/src/bridge/handlers/stage.rs`
- `crates/shotloom-engine/src/bridge/tests/lifecycle.rs`
- `docs/ipc/bridge-contract.md`

Output:
- Confirmed live raw mood echo branch and doc conflict.

Non-output:
- No source edits before confirming the branch still matches this spec.

Failure:
- Stop and revise if `origin/main` already changed `SetStageMood` behavior or
  bridge docs.

Proof:
- `rg -n "handle_set_stage_mood|Unknown mood preset|set_stage_mood|UNKNOWN_MOOD" crates docs apps`

### S1 - Bound Unknown Mood Display

Input:
- Caller-supplied `mood: String`.
- `shotloom_core::model::BoundedDisplay`.

Output:
- Unknown-mood warning field and rejection message use a bounded escaped mood
  display value.

Non-output:
- No changed parser, rejection code, event, DTO, or TypeScript mirror.

Failure:
- If borrow/move flow becomes awkward, create one local bounded display value
  inside the `Err(_)` branch; do not change the function signature.

Proof:
- `cargo check -p shotloom-engine`.
- Diff review shows only display rendering changes in the handler.

### S2 - Add Regression Coverage

Input:
- Existing `set_stage_mood_rejects_unknown_preset` test and
  `expect_rejection` helper.

Output:
- Unknown-mood test covers a control-character and overlong payload, asserts
  `UNKNOWN_MOOD`, escaped control text, elision/bounding evidence, and preserved
  seeded mood.

Non-output:
- No full-message golden snapshot.
- No tracing subscriber harness unless existing tests already provide one.

Failure:
- If a single payload makes assertions unclear, keep the existing normal test
  and add a second focused malicious-payload test.

Proof:
- `cargo test -p shotloom-engine set_stage_mood_rejects_unknown_preset`.

### S3 - Correct IPC Command Description

Input:
- `docs/ipc/bridge-contract.md` §13A.1.
- Existing fixture snapshot for `UNKNOWN_MOOD`.

Output:
- IPC docs state that unknown bridge command mood strings are rejected with
  `UNKNOWN_MOOD`; startup/bundle fallback remains outside the command path.

Non-output:
- No docs claim that the runtime fallback path was removed.

Failure:
- If nearby docs also contradict the fixture, patch only the directly relevant
  `set_stage_mood` text and leave broader cleanup as follow-up.

Proof:
- `node scripts/validate-doc-paths.mjs`.

### S4 - Verify Scope

Input:
- Final diff.

Output:
- Branch ready for pre-PR review.

Non-output:
- No PR creation in this stage.

Failure:
- If tests or diff reveal schema/behavior drift, revert that part and keep only
  display hardening plus the doc correction.

Proof:
- `cargo fmt --check`
- `cargo test -p shotloom-engine set_stage_mood`
- `cargo check -p shotloom-engine`
- `node scripts/validate-doc-paths.mjs`

## Acceptance Criteria

- [ ] Unknown mood rejection text renders the invalid value through
      `BoundedDisplay`.
- [ ] Unknown mood `tracing::warn!` field renders the invalid value through
      `BoundedDisplay`.
- [ ] Unknown mood regression coverage includes a control-character payload and
      preserved prior mood state.
- [ ] `SetStageMood` wire shape, parsing behavior, success event, and
      `UNKNOWN_MOOD` code remain unchanged.
- [ ] IPC §13A.1 matches live rejection behavior for unknown bridge command
      mood strings.

## Verification

Focused checks:

```bash
cargo test -p shotloom-engine set_stage_mood
cargo check -p shotloom-engine
node scripts/validate-doc-paths.mjs
```

Broad gates before PR:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Manual/static repro:

- Send `SetStageMood { mood: "bad\n..." }` and confirm
  `command_rejected.code == UNKNOWN_MOOD`, the message contains escaped `\\n`
  rather than a literal newline, and the previous mood remains unchanged.
- Inspect the unknown-mood branch and confirm both `tracing::warn!` and
  `ctx.reject` use bounded display.
- Review IPC §13A.1 and confirm it names `UNKNOWN_MOOD` rejection, not fallback,
  for unknown bridge command inputs.

## Traps

- Do not change `stage_setup.rs` fallback behavior; it is a separate startup
  and bundle-load path.
- Do not make `BoundedDisplay` part of mood parsing or accepted value storage.
- Do not add snapshots for a one-off message-safety test.
- Do not broaden this into a cross-handler diagnostic audit.

## Follow-Up Candidates

- Broader audit of non-Stage bridge command rejection messages for raw
  free-form strings.
- Optional tracing capture helper for future log-field assertions if multiple
  PRs need log-output verification.
