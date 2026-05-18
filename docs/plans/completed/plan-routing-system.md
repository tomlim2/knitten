---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
milestone: agent-work-routing-system
---

# Plan Routing System

**status:** completed on 2026-05-18.

## Purpose

Create one planning entry point that selects the right planning workflow for
personal projects, company projects, specs, milestones, and experiments.

## Problem

Planning currently depends on the user naming a specific skill or command.
Personal project planning, company issue planning, spec drafting, and milestone
management need different evidence and approval gates.

## Goals

| Goal | Result |
|------|--------|
| Add planning router skill | User can ask for a plan without naming a planning skill. |
| Separate work modes | Personal planning stays lightweight; company planning uses issue/spec evidence. |
| Route to existing spec tools | Agent-hub specs use `ah-manage-spec`; Shotloom specs use Shotloom skills. |
| Preserve milestone boundary | Milestones group specs; specs remain executable contracts. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Replace `ah-manage-spec` | Spec lifecycle remains a separate skill. |
| Replace `ah-manage-milestone` | Milestone CRUD remains a separate skill. |
| Force every personal task into a full spec | Personal mode can produce a short plan or todo. |

## Pre-Implementation State

| Planning Area | Current Artifact |
|---------------|------------------|
| Agent-hub spec | `agent/skills/ah-manage-spec/SKILL.md` |
| Agent-hub milestone | `agent/skills/ah-manage-milestone/SKILL.md` |
| Shotloom task start | `agent/skills/shotloom-start-task/SKILL.md` |
| Shotloom spec draft | `agent/skills/shotloom-draft-spec/SKILL.md` |
| Code-derived spec | `agent/skills/dev-generate-spec/SKILL.md` |
| Decision comparison | `agent/skills/dev-decision-start/SKILL.md` |

## Proposed Design

Add:

```text
agent/skills/ah-route-plan/SKILL.md
```

Planning modes:

| Mode | Output |
|------|--------|
| `personal-small` | Short checklist and first verification step. |
| `personal-spec` | Proposed spec when the work spans multiple files or sessions. |
| `company-issue` | Issue/order-backed plan with acceptance and tests. |
| `company-pr-response` | Review-comment or CI-backed fix plan. |
| `experiment` | Hypothesis, measurement, stop condition, cleanup. |
| `milestone` | Milestone create/update/attach route. |

## Execution Plan

| Step | Action |
|------|--------|
| 1 | Define planning modes and evidence requirements. |
| 2 | Create `ah-route-plan` as a thin classifier skill. |
| 3 | Map current planning skills to modes. |
| 4 | Add fixtures for personal, company, experiment, and milestone planning. |
| 5 | Update routing inventory. |

## Validation

```bash
test -f agent/skills/ah-route-plan/SKILL.md
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Control |
|------|---------|
| Planning router becomes another long planning doc | Keep router thin and delegate to existing skills. |
| Personal work gets slowed by company gates | Work mode selects the plan shape. |
| Company work misses repo-specific rules | Company mode requires repo conventions before execution. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| One planning entry point exists. | `ah-route-plan/SKILL.md` exists. |
| Planning modes are explicit. | Router table names mode, evidence, and output. |
| Existing planning skills remain owners. | Router maps to current skills instead of copying them. |
| Fixtures cover work modes. | Routing fixtures include personal, company, experiment, and milestone plans. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Personal spec threshold | Multi-session or multi-ownership work gets a spec. |
| Router name | `ah-route-plan`. |
