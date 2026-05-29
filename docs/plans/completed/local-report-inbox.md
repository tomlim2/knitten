---
status: completed
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
repo: agent-hub
briefing: ../../briefings/specs/local-report-inbox.md
---

# Local Report Inbox

## Purpose

Define a gitignored local inbox for report-only cross-session handoff.

## Problem

| Problem | Consequence |
|---|---|
| Report-only handoff can trigger branch/worktree creation | The operator gets extra branches for non-source state. |
| Gitignored local report path is not named | Sessions choose ad hoc paths and lose handoff discoverability. |
| Worktree-first policy lacks a report-only exception | A cold-start session can over-apply worktree-first to local notes. |

## Contract

| Rule | Behavior |
|---|---|
| Local inbox path | Use `.agent-local/reports/` for report-only handoff files. |
| Git behavior | `.agent-local/` is ignored; files under it are never committed. |
| Branch behavior | Do not create a branch or worktree solely to write a local report. |
| Main checkout behavior | Writing `.agent-local/reports/*` from the main checkout is allowed because the path is ignored. |
| Durable escalation | If a report becomes policy, spec, decision, rule, standard, milestone, or accepted finding, move the content into the tracked owner path and use the normal worktree/PR flow. |

## Allowed Files

| File type | Path |
|---|---|
| Session report | `.agent-local/reports/<YYYYMMDD>-<slug>.md` |
| Status handoff | `.agent-local/reports/<YYYYMMDD>-<slug>-status.md` |
| Investigation note | `.agent-local/reports/<YYYYMMDD>-<slug>-investigation.md` |

## Forbidden Files

| Content | Required destination |
|---|---|
| Secrets or credentials | Do not write. |
| Durable shared policy | `SYSTEM.md`, `agent/rules/`, or `agent/standards/` through normal worktree flow. |
| Specs or accepted implementation plans | `docs/plans/` and `docs/briefings/` through normal worktree flow. |
| Operational findings intended for durable tracking | `docs/briefings/operational-findings*` or the owning findings workflow. |

## Implementation

| Step | Edit |
|---|---|
| 1 | `.gitignore` ignores `.agent-local/`. |
| 2 | `docs/reference/local-report-inbox.md` defines `.agent-local/reports/` semantics. |
| 3 | `agent/rules/git-defaults.md` defines the report-only exception. |

## Acceptance Evidence

| AC | Evidence |
|---|---|
| AC1 | `git check-ignore -q .agent-local/reports/example.md` passed. |
| AC2 | `agent/rules/git-defaults.md` includes the local report inbox exception. |
| AC3 | `docs/reference/local-report-inbox.md` names allowed and forbidden use. |
| AC4 | `git diff --check` and `node scripts/validate-llm-first.mjs` passed. |
