---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
milestone: agent-work-routing-system
---

# Implementation Routing System

**status:** completed on 2026-05-18.

## Purpose

Create one implementation entry point that selects personal, company, or
experiment implementation workflow before code changes.

## Problem

Implementation requests currently route by technology domain but not by work
environment. Personal projects need fast vertical slices. Company projects need
issue evidence, repo conventions, tests, PR readiness, and remaining-failure
tracking.

## Goals

| Goal | Result |
|------|--------|
| Add implementation router skill | User can ask for implementation without naming a domain skill. |
| Apply work-mode defaults | Personal, company, and experiment tasks get different gates. |
| Preserve domain skills | Router selects domain implementation skills and standards. |
| Require smallest proof | Every mode starts with a minimal verified change before expansion. |
| Track remaining failures | Company mode reports checks still failing after changes. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Replace code-writing rules | Existing code-write and repo rules remain binding. |
| Replace domain implementation skills | Domain skills own tool-specific steps. |
| Auto-commit or push | Git mutation remains explicitly requested or skill-owned. |

## Pre-Implementation State

| Implementation Area | Current Artifact |
|---------------------|------------------|
| Rust/Bevy | `rust-bevy` context profile |
| Web frontend | `web-frontend` context profile and `frontend-design` |
| Unreal | `unreal-engine` context profile and UE skills |
| Shotloom task | `shotloom-start-task`, `shotloom-check-gates`, `shotloom-commit` |
| Experiments | `dev-run-experiment`, `dev-log-experiment` |

## Proposed Design

Add:

```text
agent/skills/ah-route-implementation/SKILL.md
```

Implementation modes:

| Mode | Required Gate |
|------|---------------|
| `personal` | Inspect local conventions, implement smallest working slice, verify locally. |
| `company` | Read order/issue/spec, repo conventions, implement scoped change, run required checks, summarize remaining failures. |
| `experiment` | Record hypothesis, run bounded change, measure result, preserve cleanup path. |

Router output:

| Output | Meaning |
|--------|---------|
| `selected_context_profile` | Existing technical route profile. |
| `selected_work_mode` | Personal, company, or experiment. |
| `implementation_gate` | Required pre-edit evidence and post-edit verification. |
| `review_gate` | Review skill to run before handoff or PR. |

## Execution Plan

| Step | Action |
|------|--------|
| 1 | Define implementation mode gates. |
| 2 | Create `ah-route-implementation` as a thin classifier skill. |
| 3 | Map context profiles to implementation modes. |
| 4 | Add fixtures for personal web, company Shotloom, and experiment tasks. |
| 5 | Update routing inventory. |

## Validation

```bash
test -f agent/skills/ah-route-implementation/SKILL.md
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Control |
|------|---------|
| Router slows small personal edits | Personal mode allows direct implementation after light inspection. |
| Company mode misses a required gate | Company mode reads repo conventions before edits. |
| Experiment mode leaves durable changes unclear | Experiment mode records stop condition and cleanup path. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| One implementation entry point exists. | `ah-route-implementation/SKILL.md` exists. |
| Work-mode gates are explicit. | Router names pre-edit and post-edit gates per mode. |
| Existing domain profiles remain owners. | Router maps to current context profiles. |
| Fixtures cover implementation modes. | Routing fixtures include personal, company, and experiment implementation. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Company implementation review gate | Run routed review before PR or handoff. |
| Router name | `ah-route-implementation`. |
