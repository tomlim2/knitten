---
status: accepted
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
---

# Local Report Inbox

## Rule

Use `.agent-local/reports/` for report-only cross-session handoff that must not
create a branch, worktree, commit, or PR.

## Path Contract

| Path | Status | Use |
|---|---|---|
| `.agent-local/` | gitignored | Local-only agent scratch and handoff tree. |
| `.agent-local/reports/` | gitignored | Report-only session handoff files. |

## Allowed Content

| Content | Example path |
|---|---|
| Session status | `.agent-local/reports/20260529-main-status.md` |
| Investigation summary | `.agent-local/reports/20260529-stage-flow-investigation.md` |
| Other-session handoff | `.agent-local/reports/20260529-continue-shotloom-docs.md` |

## Forbidden Content

| Content | Required action |
|---|---|
| Secret, token, credential, or private key | Do not write it. |
| Durable rule, standard, skill, spec, milestone, or decision | Write the tracked owner file in a worktree. |
| Accepted operational finding | Use the operational-findings workflow. |
| Source code change request | Create or resume a task worktree. |

## Branch Decision

| Situation | Action |
|---|---|
| User asks only to leave a local report for another session | Write `.agent-local/reports/<date>-<slug>.md` from the current checkout. |
| User asks to implement, fix, document durable policy, or commit | Use the normal worktree-first flow. |
| A local report contains a decision that must persist | Move the decision into the tracked owner path, then commit through PR flow. |

## Validation

| Check | Command |
|---|---|
| Confirm ignore behavior | `git check-ignore -q .agent-local/reports/example.md` |
| Confirm no accidental tracking | `git status --short --ignored .agent-local/` |
