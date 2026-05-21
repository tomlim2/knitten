---
status: proposed
created: 2026-05-21
updated: 2026-05-21
load: triggered
trigger: STL-502
repo: shotloom
linear: STL-502
briefing: ../../briefings/shotloom/bridge-bound-stage-rejection-ids.md
---

# Bound Stage Authoring Rejection IDs

## Spec Contract

- Briefing basis: `../../briefings/shotloom/bridge-bound-stage-rejection-ids.md`
  defines STL-502 as a narrow follow-up from PR #384 review.
- Current truth: Stage authoring handlers already implement lifecycle/edit
  command rejection semantics in `crates/shotloom-engine/src/bridge/handlers/stage.rs`,
  but several rejection messages interpolate raw command-supplied ids.
- Required change: render untrusted identifier values in Stage authoring
  rejection messages through `BoundedDisplay`.
- Locked boundary: no rejection code changes, no bridge command/event schema
  changes, no Stage mutation behavior changes, no broad diagnostic-policy
  redesign, and no dependency or ADR work.
- Proof method: focused Stage bridge tests that prove bounded/escaped rejection
  messages for representative long/control-character ids, plus the normal Rust
  formatting/lint/test gates.

## Current State

| Surface | Path / Symbol | Classification | Evidence |
|---|---|---|---|
| Stage rejection construction | `crates/shotloom-engine/src/bridge/handlers/stage.rs` | Partial | Stage handlers return stable `CommandRejectionCode`s, but messages such as invalid/duplicate/missing Stage ids, locked element/renderable ids, and missing/wrong-kind asset ids interpolate raw command strings. |
| Shared bounded display helper | `crates/shotloom-core/src/model/id.rs::BoundedDisplay` | Already Done | Caps diagnostic text to `MAX_LEN`, adds a Unicode elision marker for overlong input, and escapes control characters through `Display`. |
| Prop/background-map precedent | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Already Done | Existing bridge handlers use `BoundedDisplay::new(...)` for untrusted `prop_id`, `map_id`, `asset_id`, object id, and tag echoes. |
| Stage bridge tests | `crates/shotloom-engine/src/bridge/tests/stage.rs` | Partial | Tests cover rejection codes and rollback/no-mutation behavior, but do not yet prove that rejection messages avoid raw overlong/control-character id echo. |
| Rejection assertion helper | `crates/shotloom-engine/src/bridge/tests/helpers/assertions.rs::expect_rejection` | Already Done | Asserts a single correlated `CommandRejected` and returns the payload, so Stage tests can add focused message assertions without weakening code checks. |
| Bridge error policy | `docs/guidelines/error-handling.md` | Already Done | `CommandRejectedPayload` is the bridge vocabulary for identified command/domain refusal; changing codes would require Rust enum, fixture, and TypeScript mirror work. |
| Bridge contract | `docs/ipc/bridge-contract.md` | Already Done | Stage authoring rejection codes are already documented after PR #384; this task does not change wire shape or rejection-code semantics. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-502` |
| State | In Progress |
| Owner | deemo 디모 |
| Goal | Apply `BoundedDisplay` consistently to Stage authoring rejection id echoes. |
| Acceptance criteria | Inspect Stage rejection detail messages; bound untrusted/user-supplied identifiers; adjust brittle message tests only as needed. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-479`; follows PR #384 review nit after Stage authoring handlers landed. |
| Related PRs | PR #384 review approved with STL-502 / STL-503 deferred as follow-ups. |
| Current review state | No PR yet. |
| Planning consequence | One small PR is suitable because the work is display hardening in one handler module plus focused tests. |

## Problem

Stage authoring rejection messages are currently correct by code, but several
messages echo command-supplied ids directly. A caller can provide an extremely
long id or an id containing control characters, and the rejection message can
carry that raw value into logs, CI output, or editor diagnostics.

The issue is not command behavior. `StageId::new`, `ShotId::new`,
`StageElementId::new`, `StageRenderableId::new`, and asset lookups still own
validation. The gap is only the display representation of values that failed or
were not found.

## Options Considered

| Option | Decision | Rationale |
|---|---|---|
| Wrap each Stage rejection id echo directly with `BoundedDisplay::new(...)` | Selected | Matches the prop handler precedent and keeps each message's field ownership visible. |
| Add a small local `bounded_id(...)` helper in `stage.rs` | Allowed if it stays local | Reduces repetition, but the helper must not hide validation or change the command input type. |
| Change id constructors or rejection-code variants | Rejected | STL-502 excludes behavior/schema/code changes; constructors already use `BoundedDisplay` in their own errors. |
| Centralize all bridge rejection formatting | Rejected for this PR | Broader policy work would touch other handlers and review surfaces; this follow-up is intentionally Stage authoring only. |

## Requirements

1. Stage authoring rejection messages that include caller-supplied identifier
   values must render those values with `BoundedDisplay`.
   Trace: STL-502 scope and PR #384 nit.
2. The implementation must cover Stage authoring ids in
   `crates/shotloom-engine/src/bridge/handlers/stage.rs`: `shot_id`,
   `stage_id`, `source_stage_id`, `active_stage_id`, `element_id`,
   `renderable_id`, nested `renderable.renderable_id`, and `asset_id` when
   they appear in rejection text.
   Trace: live `stage.rs` raw-format audit.
3. Static field labels such as `stage_id`, `renderable_id`, and command names
   must remain literal text; only the untrusted value is bounded/escaped.
   Trace: `BoundedDisplay` display-purpose contract.
4. Existing `CommandRejectionCode` variants and rejection precedence must not
   change.
   Trace: STL-502 exclusions and `error-handling.md` bridge-code checklist.
5. Existing bridge command/event JSON shapes and TypeScript mirrors must not
   change.
   Trace: STL-502 exclusions.
6. Tests must prove at least one representative Stage authoring rejection
   bounds and escapes an attacker-shaped id. The test should assert the safety
   property, not a brittle full message string.
   Trace: STL-502 test adjustment scope.
7. If the implementation touches repeated formatting patterns, it may use a
   local helper, but that helper must be private to the Stage handler and must
   not validate, normalize, or parse ids.
   Trace: one-PR suitability and prop-handler precedent.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new typed error or external source is introduced. | Keep command rejections inline; no `thiserror` or `#[source]` work. | N/A: display-only command rejection hardening. |
| Schema / serialization compatibility | no | `BridgeCommand`, `BridgeEvent`, and `CommandRejectionCode` stay unchanged. | Do not edit Rust/TS bridge enums or fixture schemas. | `git diff` and focused tests show handler/test-only change. |
| Ownership / API boundary | yes | Stage rejection messages are emitted by `shotloom-engine` bridge handlers; `BoundedDisplay` lives in `shotloom-core::model`. | Import and use the existing model display helper; do not create a competing sanitizer. | Compile check plus focused bridge test. |
| Partial mutation / rollback | no | The change occurs before/inside rejection-message construction only. | Do not touch Stage mutation branches except message formatting. | Existing rejection tests continue to assert no mutation. |
| Diagnostic ownership | yes | `CommandRejectedPayload.message` is the affected diagnostic surface. | Keep codes and related semantics stable; bound only the interpolated value. | New test inspects rejection payload message. |
| Local absolute path exposure | no | No docs, manifests, paths, or local files are emitted. | Do not add machine-local paths. | N/A: no path artifact in implementation. |
| Manifest path containment | no | No manifest/catalog/path resolution changes. | Leave asset lookup semantics unchanged. | N/A. |
| Command rejection matrix | yes | Stage authoring command handlers contain multiple rejection branches. | Only branches whose message echoes untrusted ids change; rejection code matrix remains stable. | Focused rejection-message test plus existing Stage rejection tests. |
| Cross-platform CLI entrypoint | no | No Node/CLI script changes. | None. | N/A. |
| Asset/data pack lifecycle | no | No assets or fixtures are added. | None. | N/A. |
| Validation context downgrade | no | No validator API changes. | `BoundedDisplay` is display-only and does not replace id parsing. | Test uses invalid id to prove rejection still occurs. |
| Field-set drift | no | No DTO fields or metadata lists are added. | None. | N/A. |
| Bridge docs parity | no | Wire contract and rejection codes do not change. | Avoid docs edits unless implementation uncovers a real contract mismatch. | N/A: no wire/doc semantic change. |
| Event-state visibility | no | Accepted command event behavior does not change. | Do not touch success branches beyond message helper imports if avoidable. | Existing tests continue to cover event order. |
| Input constraint parity | yes | IDs already parse through typed constructors; messages are less bounded than adjacent prop handler messages. | Match the prop handler's `BoundedDisplay` convention. | Long/control-character id test. |
| Test oracle strength | yes | Message hardening could be missed by code-only tests. | Assert message has escaped control characters and bounded length. | Fails before `BoundedDisplay`, passes after. |
| Scope creep | yes | Tempting adjacent cleanup includes code centralization and protocol docs. | Keep changes to Stage handler display and focused tests. | Diff review: no bridge enum/schema/doc behavior change. |
| Reviewer objection | yes | Original PR #384 nit named many Stage raw-format sites. | Cover the named defect class consistently rather than one branch. | `rg` proof for remaining raw Stage id interpolation candidates. |

## Locked Decisions

1. **Use `BoundedDisplay` as display hardening, not validation.**

   Rationale: The existing id constructors and lookups already decide whether a
   value is valid or present. `BoundedDisplay` only makes the rejected value
   safe to render.

   Rejected alternatives: normalizing ids before parse would change behavior;
   changing constructors would broaden the PR beyond STL-502.

2. **Keep rejection codes and precedence stable.**

   Rationale: The issue is a review nit about message echo consistency.
   Changing codes would trigger Rust enum, TypeScript mirror, fixture, and docs
   work that STL-502 explicitly excludes.

   Rejected alternatives: introducing a new "unsafe id" rejection code would
   be semantically wrong because the existing invalid/missing/duplicate codes
   already own those failures.

3. **Prefer direct/local formatting over a broad diagnostic abstraction.**

   Rationale: The prop handler already demonstrates direct `BoundedDisplay`
   usage. A broad formatter would be more architecture than this small follow-up
   needs.

   Rejected alternatives: centralizing all command rejection messages would
   require auditing unrelated handlers and would make review larger.

4. **Test a safety property, not the whole sentence.**

   Rationale: Rejection-message copy can evolve. The important invariant is
   that attacker-controlled id text is bounded and escaped while the rejection
   code remains unchanged.

   Rejected alternatives: full-string snapshots would make harmless wording
   edits noisy and would not better prove the safety property.

## Non-Goals

- No `CommandRejectionCode` additions, removals, or remapping.
- No bridge command, event, DTO, fixture schema, or TypeScript mirror changes.
- No Stage mutation, rollback, event ordering, or dirty-state behavior changes.
- No ADR or bridge-contract documentation change unless live code reveals a
  real semantic mismatch.
- No cross-handler central diagnostic formatter.
- No changes to `BoundedDisplay` semantics in `shotloom-core`.
- No editor UI or user-facing copy work.

## Design Plan

### S0 - Baseline Re-Check

Input:
- `crates/shotloom-engine/src/bridge/handlers/stage.rs`
- `crates/shotloom-engine/src/bridge/tests/stage.rs`
- `crates/shotloom-core/src/model/id.rs::BoundedDisplay`

Output:
- Confirmed list of Stage rejection branches that echo command-supplied ids.

Non-output:
- No source edits before the raw-echo audit is complete.

Failure:
- Stop and revise the spec if the audit shows schema, code, or behavior changes
  are required.

Proof:
- `rg -n "format!\\(|ctx.reject|return Err" crates/shotloom-engine/src/bridge/handlers/stage.rs`
- `rg -n "BoundedDisplay" crates/shotloom-engine/src/bridge/handlers`

### S1 - Apply Bounded Display to Stage Rejection Messages

Input:
- Raw command id values in Stage handler rejection branches.
- `BoundedDisplay::new(...)`.

Output:
- Rejection messages that still name the same failure but render untrusted ids
  through `BoundedDisplay`.

Non-output:
- No changed rejection code.
- No changed parse/lookup condition.
- No changed success event.

Failure:
- If a branch cannot borrow/move the original string without altering handler
  behavior, use a local display helper over a borrowed string instead of
  changing ownership flow.

Proof:
- `cargo fmt --check`
- `cargo check -p shotloom-engine`
- `rg` proof that obvious raw Stage id echo patterns no longer remain in
  Stage rejection messages.

### S2 - Add Focused Message Safety Coverage

Input:
- Existing `expect_rejection` helper.
- A Stage command with an invalid or missing attacker-shaped id containing a
  control character and enough characters to exceed `BoundedDisplay::MAX_LEN`.

Output:
- A test assertion that the rejection code is unchanged and the message is
  escaped/bounded.

Non-output:
- No full-message golden snapshot.
- No broad helper rewrite unless needed to keep the assertion readable.

Failure:
- If a test cannot legally construct the long value for the chosen typed branch,
  use another Stage command branch with a raw command string before parsing.

Proof:
- Targeted `cargo test -p shotloom-engine stage::<test-name>` or equivalent
  module filter.

### S3 - Verify No Behavior or Wire Drift

Input:
- Final diff from S1/S2.

Output:
- Clean implementation branch ready for pre-PR review.

Non-output:
- No PR creation in this stage.

Failure:
- If tests reveal a behavior or code change, revert that part and keep only
  display hardening.

Proof:
- `cargo fmt --check`
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
- `cargo check --workspace --exclude shotloom-desktop`
- `cargo test --workspace --exclude shotloom-desktop`
- `node scripts/validate-doc-paths.mjs`

## Acceptance Criteria

- [ ] Stage authoring rejection messages no longer echo raw unbounded
      command-supplied ids.
- [ ] `BoundedDisplay` is applied to relevant Stage authoring id values without
      changing validation or lookup semantics.
- [ ] Existing rejection codes remain unchanged.
- [ ] Bridge command/event schemas and TypeScript mirrors remain unchanged.
- [ ] Focused test coverage proves bounded/escaped rejection text for a
      representative attacker-shaped Stage authoring id.
- [ ] Existing Stage authoring rejection and rollback tests still pass.

## Verification

Focused checks:

```bash
cargo test -p shotloom-engine stage -- --nocapture
```

Broad gates:

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Manual/static repro targets:

- Dispatch or test a Stage command with an id containing `\n` and enough
  characters to exceed `BoundedDisplay::MAX_LEN`; observe the same rejection
  code and an escaped/bounded message.
- Compare `git diff origin/main...HEAD` to confirm no bridge enum, TypeScript
  mirror, or IPC contract shape changed.
- Run `rg` over `stage.rs` for remaining raw `format!` patterns that include
  `shot_id`, `stage_id`, `source_stage_id`, `element_id`, `renderable_id`, or
  `asset_id` inside rejection text.

## Traps

- Do not replace id parsing with `BoundedDisplay`; parsing still owns validity.
- Do not change `CommandRejectionCode` to make a display-hardening point.
- Do not add exact full-message snapshots when a property assertion is enough.
- Do not broaden this into a cross-repo diagnostic policy cleanup.

## Follow-Up Candidates

- Central bridge rejection-message formatting policy if more handlers show the
  same pattern in future reviews.
- A broader audit of non-Stage bridge handlers for unbounded user-supplied
  message values.
