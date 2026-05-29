---
status: intake
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
spec: docs/plans/completed/local-report-inbox.md
---

# Spec Intake: local-report-inbox

## User Request

| Field | Value |
|---|---|
| Request | Other sessions can drop reports without creating branches. |
| Storage | Use a gitignored Knitten-local path that accumulates reports. |
| Branch behavior | Keep report-only handoff on the main checkout; create branches only for real source changes. |

## Route

| Surface | Decision |
|---|---|
| Repo | Knitten / agent-hub |
| Change class | Git policy and local runtime path documentation |
| Worktree | `docs/20260529-161608-local-report-inbox` |

## Evidence

| Path | Observation |
|---|---|
| `.gitignore` | Ignores runtime/cache paths but has no explicit local report inbox path. |
| `agent/rules/git-defaults.md` | Owns worktree-first behavior and exceptions. |
| `docs/plans/completed/knitten-worktree-first.md` | Defines worktree-first as default for write-capable work and allows narrow main-checkout lanes. |
| `SYSTEM.md` | Distinguishes durable shared artifacts from runtime/cache files. |

## Decisions

| Decision | Value |
|---|---|
| Local inbox path | `.agent-local/reports/` |
| Git tracking | Entire `.agent-local/` tree is ignored. |
| Allowed use | Session handoff reports, transient status, investigation notes, and draft summaries not intended as durable policy. |
| Forbidden use | Source changes, specs, accepted decisions, durable rules, committed reports, secrets, credentials. |
| Branch rule | Do not create a task branch solely to leave a local report. |

## Validation Expected

| Check | Command |
|---|---|
| Git ignore | `git check-ignore -q .agent-local/reports/example.md` |
| LLM-first docs | `node scripts/validate-llm-first.mjs` |
| Whitespace | `git diff --check` |
