# Shotloom Promotion Ledger

This ledger records rules for promoting Shotloom operational findings into the
layer that consumes them. Use it with `/shotloom-promote-findings`.

## Destination Rules

| Layer | Destination | Use when |
|---|---|---|
| Executable validation | Shotloom repo test, fixture, validator, package script, or CI workflow | the lesson is deterministic enough for a command to fail before the fix and pass after it |
| Planning and task intake | `agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md` | the lesson affects issue intake, worktree setup, branch policy, or handoff |
| Implementation | `agent/skills/shotloom-implement-code/PROMOTED_FINDINGS.md` | the lesson affects coding, editing, or validation while implementing |
| Code review | `agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md` | the lesson belongs in Rust, TypeScript, frontend, or test-quality review |
| Docs and workflow review | `agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md` | the lesson belongs in docs, markup, workflow YAML, or prose-contract review |
| Obsidian | operational-finding completion policy | the reusable action is complete and only historical context remains |

## Promotion Shape

Each promoted entry names:

- Source report.
- Trigger in the consuming layer.
- Check the skill performs.
- Fix shape for future work.
- Status.

Promote by earliest prevention layer, not discovery layer. If a review finding
would have been prevented by spec proof obligations, implementation proof
execution, or executable validation, route it to that earlier layer.

Prefer one concrete trigger and one concrete check over narrative summary.

Prefer executable validation over a skill-ledger entry when the original finding
has a deterministic input, output, rejection branch, type constraint, or file
shape.

Do not create a promoted-finding ledger for `shotloom-check-gates`. A mechanical
validator idea stays in the owning review ledger until an actual helper or gate
implements it.

## Lossiness Check

A promoted entry is too vague when it keeps the theme but drops the mechanism
that made the original finding reusable. Before marking a report promoted,
compare the entry against the source evidence:

| Evidence pattern | Keep in ledger |
|---|---|
| exported type permits unsupported use | public TypeScript contract check |
| native prop inheritance leaks unsupported props | inherited-prop omission or support rule |
| invalid prop combinations are possible | `@ts-expect-error` or equivalent negative fixture |
| native input sanitizes intermediate state | draft / committed / native-safe value split |
| one handler in a family is tested but siblings are not | family matrix coverage |

Split the promoted finding when one umbrella entry cannot preserve all reusable
mechanisms cleanly.

## Promotion Loop

1. Capture the operational finding with `/ah-report-finding`.
2. Resolve or triage enough evidence to identify the earliest layer that should
   have prevented the issue.
3. Add the smallest reusable entry to that layer's `PROMOTED_FINDINGS.md`.
4. Update the finding report `promotion-target`.
5. Move completed historical context to Obsidian through the existing completion
   policy when the repo no longer needs the full report.

## Active Promotion-Loop Findings

### Promote deterministic findings to executable validation first

- Source: current Shotloom quality-loop design discussion, 2026-05-28.
- Trigger: a review, CI, or PR-response finding has a repeatable bad input,
  contract drift, command branch, fixture shape, or doc/schema mismatch.
- Check: classify whether Shotloom can catch the issue with a test, fixture,
  validator, package script, or CI workflow before adding only a skill-ledger
  checklist item.
- Fix Shape: record the executable validation target in the finding report; add
  a layer ledger entry only when future agents need to demand or design that
  proof.
- Status: active

### Keep promotion ledgers separate from reference material

- Source: current Shotloom quality-loop design discussion, 2026-05-28.
- Trigger: a user asks where promoted findings go after capture.
- Check: create or update a layer-local `PROMOTED_FINDINGS.md`, not a generic
  reference file, when the content is an active reusable checklist.
- Fix Shape: make consuming skills read the promoted ledger explicitly during
  their workflow.
- Status: active

### Keep operational findings capture end-to-end smokeable

- Source: `docs/briefings/operational-findings/reports/20260524-operational-findings-lifecycle-smoke-test.md`
- Trigger: operational-findings capture, prepare, inbox update, commit, or push logic changes.
- Check: verify a real end-to-end smoke path exists in addition to dry-run checks.
- Fix Shape: exercise prepare, capture, index update, allowed-file guard, commit, and push on the dedicated findings branch before declaring the pipeline healthy.
- Status: active

### Parse changed files from git porcelain without slicing paths

- Source: `docs/briefings/operational-findings/reports/20260524-status-porcelain-parsing-damaged-changed.md`
- Trigger: a capture script filters or validates changed files from `git status --porcelain` output.
- Check: verify status parsing preserves full paths, including the first path characters and rename forms.
- Fix Shape: use porcelain-v1 `-z` parsing or a structured helper and add a regression for modified docs paths.
- Status: active

### Pin the findings branch upstream explicitly

- Source: `docs/briefings/operational-findings/reports/20260524-findings-branch-inherited-origin-main.md`
- Trigger: preparing or repairing the long-lived `operational-findings` worktree.
- Check: verify the branch tracks `origin/operational-findings`, not the branch it was created from.
- Fix Shape: set the upstream during prepare and refuse unsafe pushes when the upstream is not the findings branch.
- Status: active

### Run findings capture with current checkout scripts

- Source: `docs/briefings/operational-findings/reports/20260524-long-lived-findings-branch-can.md`
- Trigger: running capture logic from a long-lived findings worktree that can lag the main Knitten checkout.
- Check: verify orchestration resolves scripts from the current Knitten checkout while writing reports from the dedicated findings worktree.
- Fix Shape: invoke the live checkout's capture scripts with the findings worktree as cwd, and keep branch preparation separate from script ownership.
- Status: active

### Make findings branch guard failures actionable

- Source: `docs/briefings/operational-findings/reports/20260526-operational-finding-capture-guard-message-is-unclear.md`
- Trigger: a findings capture guard refuses to write because cwd, branch, upstream, or dirty state is wrong.
- Check: verify the error names observed cwd, current branch, expected worktree or branch, and the next safe command.
- Fix Shape: replace terse guard strings with structured recovery messages that let the next agent continue without interpreting shell errors.
- Status: active
