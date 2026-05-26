# Shotloom Review Finding Pattern Inbox

Purpose: accumulate generalized pattern candidates from Shotloom PR review findings before they are consolidated into permanent rules, standards, or skill edits.

This file is intentionally an inbox. Keep entries concrete enough to trace back to the review, but generalized enough to reuse across future implementation and review work.

## Entry Rules

- Add entries from `shotloom-wrapup-task` only when a PR had real review, CI, or rule findings.
- Use `PR NNN` text only. Do not include private Shotloom PR URLs or markdown links.
- Do not add Branch / Worktree / Commit-list metadata.
- Do not summarize the feature.
- Prefer 1-3 high-signal patterns per PR; merge repetitive nits into one pattern.
- If a finding is too PR-specific to generalize, keep it in the devlog only.

## Entry Template

```md
## PR NNN

### Pattern: <portable lesson>

- Finding: <what the reviewer/CI/rule pointed out>
- Why It Was Right: <the underlying principle>
- General Rule: <future-facing rule>
- Trigger: <signals that should make an agent check this next time>
- Fix Shape: <smallest typical fix or regression-test shape>
- Source Evidence: PR NNN; <reviewer/check>; `<file:line>` or check name.
```

## PR 384

### Pattern: Shared bridge helpers do not reduce public command contract coverage

Status: promoted to `agent/skills/shotloom-review-code/reference-promoted.md` on 2026-05-21.

- Finding: The reviewer pointed out that a missing-shot regression covered only
  lifecycle commands even though edit commands used the same shared commit helper
  and exposed their own bridge-visible rejection codes.
- Why It Was Right: A shared helper reduces implementation duplication, but each
  public bridge command still owns a contract surface. If parse, lookup, or
  commit order changes later, one command can regress while helper-level coverage
  still looks green.
- General Rule: For bridge-visible commands, rejection codes and event ordering
  need per-command coverage unless the command is explicitly documented as
  sharing a contract surface.
- Trigger: A diff adds or changes a shared helper used by multiple bridge
  handlers, especially for validation, lookup, commit, rollback, or event
  emission.
- Fix Shape: Add a table-driven or parameterized regression that exercises each
  public command's rejection/event surface, or document and test the shared
  contract boundary explicitly.
- Source Evidence: PR 384; reviewer; `crates/shotloom-engine/src/bridge/tests/stage.rs`.

### Pattern: Architecture-gate bypasses need explicit owning-doc exceptions

Status: promoted to `agent/skills/shotloom-review-code/reference-promoted.md` on 2026-05-21.

- Finding: The reviewer noted that a bridge handler implemented clone, mutate,
  validate, rollback, and dirty-marking directly instead of going through the
  documented BundleEditor mutation facade rule.
- Why It Was Right: Architecture gates are audit points, not style preferences.
  A temporary bypass without an exception in the owning architecture doc makes
  the gate unenforceable and teaches future diffs to route around it silently.
- General Rule: If code intentionally bypasses a documented architecture gate,
  either move the code behind the gate or add a narrow exception with preserved
  invariants and migration commitment in the gate's owning document.
- Trigger: A diff repeats an existing facade lifecycle by hand, touches
  mutation, rollback, validation, persistence, dirty marking, bridge contract,
  or ECS scheduling boundaries, or cites "temporary" implementation pressure.
- Fix Shape: Prefer using the facade. If not possible inside the PR, document
  the exception, the invariants preserved by the bypass, and the follow-up path
  back to the facade.
- Source Evidence: PR 384; reviewer; `docs/arch/bundle-editor-mutation-facade.md`.

### Pattern: Combined Linear scope must be reflected in PR title, body, and related issues

Status: promoted to `agent/skills/shotloom-review-before-pr/references/PROCESS_POLICY.md` and `agent/skills/shotloom-review-before-pr/references/PRE_PR_PROMPTS.md` on 2026-05-21.

- Finding: The reviewer found that the PR title/body described only lifecycle
  scope while the diff also included edit handler work from a second Linear
  issue.
- Why It Was Right: Reviewers use the PR surface as the truth source for scope.
  If the implementation combines issues but the title/body say otherwise, every
  finding has to rediscover the real boundary from the diff and Linear state can
  be closed incorrectly.
- General Rule: When a PR intentionally combines multiple Linear scopes, update
  the PR title, body, and related issue list before review so the combined
  boundary is explicit.
- Trigger: A diff includes commits, files, or acceptance criteria from more than
  one Linear issue; split failed; or a follow-up issue becomes necessary to land
  the current PR safely.
- Fix Shape: Either split the PR, or make the combined scope explicit in the PR
  title/body and include every resolved or related issue with the reason for
  bundling.
- Source Evidence: PR 384; reviewer; PR scope review against Shotloom AGENTS.md scope rule.

## PR 388

### Pattern: Helper wrappers should preserve the wrapped API's ownership shape

Status: promoted to `agent/skills/shotloom-review-code/reference-promoted.md` on 2026-05-21.

- Finding: The reviewer pointed out that a small bounded-display helper accepted
  `impl AsRef<str>` while the wrapped `BoundedDisplay::new` API accepted
  `impl Into<String>`, forcing owned strings through a borrowed path before
  re-owning them.
- Why It Was Right: Shared diagnostic helpers are part of the allocation and
  ownership contract. A wrapper that narrows the underlying API hides cost and
  makes future callers reason about the helper rather than the actual boundary.
- General Rule: When a helper exists only to standardize a lower-level API call,
  keep its ownership shape aligned with that lower-level API unless the helper
  intentionally enforces a narrower contract.
- Trigger: A diff adds a helper around `BoundedDisplay`, diagnostic formatting,
  serialization, path conversion, or other APIs that accept owned-or-borrowed
  input.
- Fix Shape: Match the helper signature to the wrapped API, or document the
  intentional narrowing at the helper site.
- Source Evidence: PR 388; reviewer; `crates/shotloom-engine/src/bridge/handlers/stage.rs`.

### Pattern: Escaped diagnostic display tests need separate source and render bounds

Status: promoted to `agent/skills/shotloom-review-code/reference-promoted.md` on 2026-05-21.

- Finding: The reviewer called out a magic `BoundedDisplay::MAX_LEN + 32` test
  bound because `escape_debug` expansion can make rendered output far longer
  than the original source string, especially for control-heavy input.
- Why It Was Right: A single mixed length assertion can accidentally prove only
  the easy ASCII case while pretending to cover escaped rendering. Diagnostic
  hardening must distinguish source-side truncation from rendered escape
  expansion.
- General Rule: Bounded diagnostic tests should split ASCII-overlong input from
  escape-heavy input and assert the right property for each class.
- Trigger: A diff adds or changes tests for truncated IDs, escaped display
  strings, rejection messages, logs, tracing fields, or user-controlled
  diagnostic payloads.
- Fix Shape: Add one ASCII-overlong case with a tight rendered-length ceiling,
  and one control-heavy or escape-heavy case that verifies truncation/escaping
  without pretending the same length ceiling applies.
- Source Evidence: PR 388; reviewer; `crates/shotloom-engine/src/bridge/tests/stage.rs`.

### Pattern: Representative shared-helper tests must state the coverage assumption

Status: promoted to `agent/skills/shotloom-review-code/reference-promoted.md` on 2026-05-21.

- Finding: The reviewer noted that only one rejection path exercised a helper
  used by many rejection sites, making it unclear whether the test was meant as
  per-code coverage or a shared-helper smoke test.
- Why It Was Right: A shared-helper test can be enough for formatting behavior,
  but only if the test name or comment makes that scope explicit. Otherwise the
  next reviewer has to infer whether untested rejection codes are accidental
  gaps.
- General Rule: When one test represents many call sites through a shared helper,
  name or comment the representative scope and cover the meaningful input
  classes that every call site inherits.
- Trigger: A diff adds a helper that is called from multiple bridge rejection,
  event, validation, or logging paths, but only one path has a direct regression
  test.
- Fix Shape: Either parameterize across public rejection/event codes, or make
  the shared-helper smoke-test assumption explicit and test representative input
  classes.
- Source Evidence: PR 388; reviewer; `crates/shotloom-engine/src/bridge/tests/stage.rs`.

## PR 391

### Pattern: Store reducer APIs should only expose live contract surface

- Finding: The reviewer pointed out that Stage mirror store actions and
  parameters were added without live callers, including a bulk-write action that
  could bypass provider-level shot guards.
- Why It Was Right: Store actions are an API surface. Dead actions and dead
  parameters invite future writes through the wrong layer and make readers
  believe there is a supported control flow that does not exist.
- General Rule: Add reducer/store actions only when the same diff wires a live
  caller or test-documented contract; otherwise delete the action until the
  caller exists.
- Trigger: A diff adds Zustand/Redux/store reducer actions, optional parameters,
  bulk setters, or bypass paths while most writes are supposed to flow through a
  scoped provider or bridge event reducer.
- Fix Shape: Remove unused actions/parameters, or add a targeted comment and
  direct unit test proving the intended external contract.
- Source Evidence: PR 391; reviewer; `apps/editor/src/state/bundleStore.ts`.

### Pattern: Event-family guards need family-shaped regression tests

- Finding: The reviewer noted that only one Stage success event branch had a
  foreign-shot no-op test even though every new Stage lifecycle/edit event
  branch carried the same `shot_id` short-circuit.
- Why It Was Right: Shared-looking guards can drift independently when each
  event branch is hand-coded. Testing only the first branch proves the idea, not
  the public event-family contract.
- General Rule: When a family of bridge/editor events shares an identity guard,
  terminal-state rule, or nullable contract semantic, test every public branch
  through a table or explicit case.
- Trigger: A diff adds multiple event branches with repeated `shot_id`,
  `command_id`, active-id, or terminal-state guards.
- Fix Shape: Parameterize one regression across the whole event family, or add
  one explicit no-op/clear/preserve test per branch.
- Source Evidence: PR 391; reviewer; `apps/editor/src/state/__tests__/BundleStateProvider.test.tsx`.

### Pattern: Optional collection and nullable mirror semantics need sparse fixtures

- Finding: The reviewer called out that `stage_deleted.active_stage_id: null`
  and optional `elements` / `renderables` collections were permitted by the
  contract but only populated or non-null fixtures were tested.
- Why It Was Right: TypeScript mirror code often distinguishes `null`,
  `undefined`, and populated arrays. Happy-path fixtures do not prove preserve,
  clear, or absent-field semantics.
- General Rule: When bridge/editor mirror code uses `null`, `undefined`, or
  `?? []` guards to preserve contract semantics, include sparse fixtures that
  exercise those exact values.
- Trigger: A diff adds mirror reducers around optional arrays, nullable ids,
  fallback ids, or `undefined` sentinels.
- Fix Shape: Add tests for non-null fallback and null clear, plus absent-field
  collection cases that assert no throw and the expected unchanged or cleared
  state.
- Source Evidence: PR 391; reviewer; `apps/editor/src/state/__tests__/BundleStateProvider.test.tsx`.
