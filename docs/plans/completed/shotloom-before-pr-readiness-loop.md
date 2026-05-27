---
status: completed
created: 2026-05-27
updated: 2026-05-28
completed: 2026-05-28
owner: agent-hub
milestone:
---

# Shotloom Before-PR Readiness Loop

## Completion

Implemented and merged in [PR #78](https://github.com/tomlim2/knitten/pull/78).
Merge commit: `99ac978`.

## Purpose

Define `shotloom-review-before-pr` as a readiness loop:

```text
implemented branch code -> review loop -> prReady true|false
```

`prReady=true` means no blocker findings remain and the branch can move to
`/shotloom-make-pr`.
`prReady=false` means blocker findings remain and the relevant phase must repeat
after fixes.

## Problem

The current before-PR review surface mixes several responsibilities:

| Responsibility | Current issue |
|---|---|
| Review routing | `shotloom-review-before-pr` routes single, triad, boundary, and docs review. |
| Mode decision | Single/triad selection lives inside before-PR references. |
| Code review | `shotloom-review-code/SKILL.md` contains a large embedded reviewer prompt. |
| Docs review | Docs review can run even when code review findings still exist. |
| PR readiness language | Some text reads like a PR gate, while the desired output is a `prReady` state. |

The missing contract is explicit I/O. Each skill boundary must state what it
consumes and produces.

## Goals

| Goal | Required outcome |
|---|---|
| Before-PR contract | `shotloom-review-before-pr` consumes implemented branch code and outputs `prReady: true | false`. |
| Sequential reviews | Code review completes before docs review starts. |
| Review-mode split | A mode decision step runs before code review and returns `needsTriad: true | false`. |
| Finding schema | Review findings are individual items with priority, evidence, status, and required action. |
| Fix ownership | `shotloom-implement-code` applies source changes from approved specs or findings JSON. |
| Loop semantics | Blocker findings produce `prReady=false`; after fixes, the relevant review phase repeats. |
| Ownership split | `/shotloom-make-pr` owns PR creation, PR body, approval, and CI-equivalent gates. |

## Non-Goals

- Do not make `shotloom-review-before-pr` create PRs.
- Do not move CI-equivalent broad gates out of `shotloom-make-pr`.
- Do not change Shotloom repo guideline authority.
- Do not make docs review run before code review passes.
- Do not require GitHub PR state; this loop runs before PR creation.

## Current State

| Artifact | Current role |
|---|---|
| `agent/skills/shotloom-review-before-pr/SKILL.md` | Umbrella review orchestrator. |
| `agent/skills/shotloom-decide-review-mode/SKILL.md` | Checklist owner for `needsTriad`. |
| `agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md` | Current single/triad decision logic. |
| `agent/skills/shotloom-review-code/SKILL.md` | Code review entrypoint plus large embedded subagent prompt. |
| `agent/skills/shotloom-review-docs/SKILL.md` | Docs/comment/markup review entrypoint. |
| `agent/skills/shotloom-implement-code/SKILL.md` | Implementation and review-finding fix entrypoint. |
| `agent/skills/shotloom-make-pr/SKILL.md` | PR creation, PR body, local gates, and approval owner. |
| `agent/rules/shotloom.md` | Shotloom harness-side operational rules. |

## Proposed Design

### System Flow

```text
implemented branch diff
  -> shotloom-review-before-pr
  -> shotloom-decide-review-mode
  -> shotloom-review-code OR shotloom-review-triad
  -> if code blockers: prReady=false
  -> shotloom-implement-code
  -> repeat code review until code blockers are zero
  -> shotloom-review-docs
  -> if docs blockers: prReady=false
  -> shotloom-implement-code
  -> repeat docs review until docs blockers are zero
  -> optional one-pass nit polish
  -> prReady=true
  -> /shotloom-make-pr
```

### Boundary Contracts

| Skill | Input | Output | Non-output |
|---|---|---|---|
| `shotloom-review-before-pr` | Shotloom worktree, branch, `origin/main...HEAD` | `prReady` result with phase results and next action | PR creation, CI gate verdict, GitHub mutation |
| `shotloom-decide-review-mode` | Diff stat, changed paths, changed status, checklist rows, optional override | `needsTriad: true|false`, `reason`, `triggers[]`, `signals` | Findings, code edits, docs review |
| `shotloom-review-code` | Branch diff, review brief, mode context, Shotloom code guidelines | Code finding list and phase status | Docs findings, PR readiness |
| `shotloom-review-triad` | Branch diff, review brief, triad role definitions | Merged triad finding list and disagreements | Docs findings, PR readiness |
| `shotloom-review-docs` | Code-passed branch diff, review brief, docs/comment/rustdoc surfaces | Docs finding list and phase status | Code findings, PR readiness |
| `shotloom-implement-code` | Approved spec or findings JSON, Shotloom worktree, repo guidelines | Source changes, tests, validation evidence | Review verdict, PR creation |
| `shotloom-make-pr` | `prReady=true` result, branch diff, repo guidelines | PR draft/create flow | Code/docs review discovery |

### `shotloom-review-before-pr` Output

```json
{
  "prReady": false,
  "phase": "code-review",
  "needsTriad": false,
  "blockersRemaining": 1,
  "findings": [
    {
      "id": "C1",
      "kind": "code",
      "priority": "P2",
      "blocker": true,
      "status": "unresolved",
      "source": "docs/guidelines/review-rust.md §3",
      "file": "crates/example/src/lib.rs",
      "line": 42,
      "summary": "Fallible IO error is dropped.",
      "requiredAction": "Preserve and return the error.",
      "acceptanceCheck": "Targeted test fails before the fix and passes after it."
    }
  ],
  "next": "/shotloom-implement-code <findings-json>, then rerun /shotloom-review-before-pr"
}
```

```json
{
  "prReady": true,
  "phase": "complete",
  "needsTriad": true,
  "blockersRemaining": 0,
  "findings": [],
  "next": "/shotloom-make-pr"
}
```

### Phase Rules

| Phase | Rule |
|---|---|
| Mode decision | Runs first and emits `needsTriad: true | false`. |
| Code review | Runs before docs review. |
| Code blocker present | Stop phase progression and output `prReady=false`. |
| Code blocker fixed | Repeat code review or triad verification before docs review. |
| Docs review | Runs only after code review has no blocker findings. |
| Docs blocker present | Output `prReady=false`. |
| Nit-only state | Allow one cheap nit polish pass; remaining nits do not block. |
| No blocker findings | Output `prReady=true`. |

### Review Mode Decision

`shotloom-decide-review-mode` owns triad selection.

Input:

- `git diff --shortstat origin/main...HEAD`
- `git diff --name-only origin/main...HEAD`
- `git diff --name-status origin/main...HEAD`
- optional mode override owned by `shotloom-decide-review-mode`: `force single`, `force standard`, `force triad`

Output:

```json
{
  "needsTriad": true,
  "reason": "Rust, TypeScript, fixtures, and IPC docs changed together.",
  "triggers": [
    "cross-surface contract",
    "runtime plus mirror",
    "fixture update"
  ]
}
```

Checklist:

| Check | `needsTriad=true` when |
|---|---|
| `large-file-count` | `files_changed >= 10`. |
| `large-line-count` | `lines_added + lines_deleted >= 1000`. |
| `bridge-api-contract` | DTO, event, command, rejection code, schema, IPC doc, or fixture snapshot changed. |
| `rust-ts-contract` | Rust contract surface and TypeScript mirror or consumer both changed. |
| `runtime-proof-artifacts` | Runtime code and fixtures, snapshots, golden files, or generated proof artifacts changed together. |
| `model-validation-persistence` | Model, validation, persistence, import/export, hydrate, migrate, or save/load behavior changed. |
| `asset-manifest-fixture` | Asset, manifest, catalog, fixture, snapshot, or data-pack contract changed. |
| `event-ordering` | Runtime/editor observation order, command echo, rejection order, or bridge event sequencing changed. |
| `cross-ownership` | Three or more ownership surfaces changed. |
| `boundary-lens-count` | Three or more large-boundary trigger rows match. |

### Finding Schema

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Stable within one before-PR run: `C1`, `T1`, `D1`. |
| `kind` | yes | `code`, `triad`, or `docs`. |
| `priority` | yes | `P0`, `P1`, `P2`, `P3`. |
| `blocker` | yes | `true` blocks PR readiness; `false` is nit or follow-up. |
| `status` | yes | `unresolved`, `fixed`, `accepted-follow-up`, `nit`. |
| `source` | yes | Guideline, pattern, ADR, spec, or contract evidence. |
| `file` | when available | Repo-relative path. |
| `line` | when available | Line number or nearest line. |
| `summary` | yes | One-sentence finding. |
| `requiredAction` | yes for unresolved | Fix, accept follow-up, or ask user. |
| `acceptanceCheck` | yes for blockers | Test, fixture, diff check, or command proving the fix. |

## Execution Plan

1. Add `shotloom-decide-review-mode` as a checklist skill over the current
   `REVIEW_MODE.md` surface map and decision rules.
2. Rewrite `shotloom-review-before-pr` as a readiness-loop router.
3. Normalize code/triad/docs outputs to the finding schema.
4. Enforce code-before-docs sequencing in `shotloom-review-before-pr`.
5. Route blocker fixes through `shotloom-implement-code` using findings JSON.
6. Update `shotloom-make-pr` to consume `prReady=true` as input and own PR gates.
7. Update references and related docs that call before-PR a gate.
8. Validate with LLM-first checks and a dry-run transcript.

## Design Plan

S0 - Baseline re-check

Input:
- Current branch `codex/shotloom-before-pr-findings`
- Current files under `agent/skills/shotloom-review-before-pr/`
- Current `agent/skills/shotloom-review-code/SKILL.md`
- Current `agent/skills/shotloom-review-docs/SKILL.md`
- Current `agent/skills/shotloom-make-pr/SKILL.md`

Output:
- Confirmed current responsibilities, current wording drift, and target files.

Non-output:
- No behavior edits beyond the implementation-readiness scope.

Failure:
- Stop if the branch contains unrelated user edits in target files.

Proof:
- `git status --short --branch`
- `rg -n "gate|prReady|review-mode|shotloom-review-before-pr" agent/skills agent/rules docs/plans`

S1 - Review-mode callable boundary

Input:
- Existing `agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md`
- Current diff evidence commands.

Output:
- `shotloom-decide-review-mode` callable surface or equivalent wrapper reference.
- Output contract: `needsTriad`, `reason`, `triggers[]`, `signals`.

Non-output:
- No code/docs findings.
- No PR readiness result.

Failure:
- If mode cannot be determined, output one question and stop before code review.

Proof:
- Example dry-run output for single and triad cases.
- `node scripts/validate-llm-first.mjs`

S2 - Before-PR readiness router

Input:
- `shotloom-decide-review-mode` output.
- Implemented branch diff.
- Current code/docs review skills.

Output:
- `shotloom-review-before-pr` emits `prReady: true | false`.
- Code review runs before docs review.
- Docs review runs only when code review has no blocker findings.

Non-output:
- No GitHub PR creation.
- No CI-equivalent gate verdict.
- No mergeability claim.

Failure:
- If code review returns blocker findings, output `prReady=false` and skip docs review.
- If docs review returns blocker findings, output `prReady=false`.

Proof:
- Dry-run transcript for:
  - code finding path;
  - docs finding path;
  - `prReady=true` path.

S3 - Finding schema normalization

Input:
- Current code review, triad review, and docs review outputs.

Output:
- Shared finding schema documented in before-PR references.
- Each review phase reports findings with `id`, `kind`, `priority`, `status`,
  `blocker`, `source`, `summary`, `requiredAction`, and `acceptanceCheck`.

Non-output:
- No forced JSON-only output unless selected by implementation.
- No loss of human-readable review sections.

Failure:
- If a reviewer cannot provide required fields, classify the item as
  `needs-normalization` and keep `prReady=false` when the item has blocker risk.

Proof:
- Sample normalized output checked into the spec or reference.
- Validator passes.

S4 - Fixer integration contract

Input:
- Findings JSON from `shotloom-review-before-pr`.
- `agent/skills/shotloom-implement-code/SKILL.md`.

Output:
- Blocker findings route to `shotloom-implement-code`.
- `shotloom-implement-code` applies source changes and targeted validation.
- Before-PR repeats the relevant review phase after fixes.

Non-output:
- No automatic PR creation.
- No infinite nit-fix loop.

Failure:
- If a blocker lacks an actionable `requiredAction` or `acceptanceCheck`, ask
  before editing.

Proof:
- Dry-run transcript for code blocker -> implementation -> code verification.

S5 - Make-PR consumption contract

Input:
- `prReady=true` output from before-PR.
- Current `shotloom-make-pr` PR creation flow.

Output:
- `shotloom-make-pr` treats before-PR result as readiness input.
- `shotloom-make-pr` remains owner of local CI-equivalent gates, PR body, and
  GitHub approval.

Non-output:
- No before-PR GitHub mutation.
- No moving broad gates into before-PR.

Failure:
- If no current before-PR result exists, `shotloom-make-pr` can request or record
  the absence according to its own policy.

Proof:
- `rg` confirms PR creation commands remain only in `shotloom-make-pr`.

S6 - Reference cleanup

Input:
- All references under `agent/skills/shotloom-review-before-pr/references/`.
- `agent/rules/shotloom.md`
- Related spec docs naming before-PR as a gate.

Output:
- Gate language replaced with readiness-loop language where current docs own
  operational behavior.
- Historical completed specs remain unchanged unless they are active instructions.

Non-output:
- No broad rename of old completed plan history.

Failure:
- Stop if wording change would alter PR approval or CI ownership.

Proof:
- `rg -n "before-pr.*gate|review-before-pr.*gate|prReady" agent docs/plans/proposed docs/plans/active`

S7 - Validation and practical dry run

Input:
- Updated skills and references.

Output:
- Validation results and one dry-run transcript showing `prReady=false` and
  `prReady=true`.

Non-output:
- No external PR creation.
- No branch push unless user asks.

Failure:
- Report validator failures with file/line evidence.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Manual dry-run transcript in final report.

## Validation

| Check | Expected result |
|---|---|
| `git diff --check` | Pass. |
| `node scripts/validate-llm-first.mjs` | Pass. |
| `rg -n "prReady|needsTriad" agent/skills/shotloom-review-before-pr agent/skills/shotloom-make-pr` | New contract visible. |
| Dry-run code finding path | Docs review skipped, `prReady=false`. |
| Dry-run docs finding path | Code review passed, docs finding returns `prReady=false`. |
| Dry-run clean path | `prReady=true`, next `/shotloom-make-pr`. |

## Risks

| Risk | Mitigation |
|---|---|
| `before-pr` becomes a hidden PR gate again | Use `prReady` language and keep PR creation in `shotloom-make-pr`. |
| Review findings remain prose-only and hard to loop | Normalize findings into a required schema. |
| Triad selection remains buried in before-PR | Add `shotloom-decide-review-mode` callable boundary. |
| Docs review runs on unstable code | Enforce code-before-docs sequencing. |
| Broad tests run too often during review loops | Keep broad gates in `shotloom-make-pr`; before-PR uses targeted proof. |
| Nit fixes become an infinite loop | Allow at most one cheap nit polish pass after blockers are zero. |

## Acceptance Criteria

- `shotloom-review-before-pr` has a documented I/O contract:
  `implemented branch code -> prReady true|false`.
- `shotloom-decide-review-mode` or equivalent callable boundary exists before
  code review.
- Code review runs before docs review.
- Docs review is skipped when code blocker findings exist.
- `prReady=false` output includes individual findings.
- `prReady=true` means no blocker findings remain.
- `shotloom-implement-code` is the implementation and blocker-fix owner.
- `prReady=true` output names `/shotloom-make-pr` as next action.
- `shotloom-make-pr` remains the PR creation and broad-gate owner.
- LLM-first validation passes.

## Open Decisions

| Decision | Options |
|---|---|
| Output format | Strict JSON; Markdown table plus JSON block; Markdown only with schema table. |
| Triad review implementation | `shotloom-review-triad` runs three expert-lens reviews. |
| Triad signal extraction | Skill checklist only; future script-backed signal extraction. |
