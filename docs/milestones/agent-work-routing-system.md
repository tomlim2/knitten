---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
target-date:
---

# Agent Work Routing System

## Purpose

Create one routing layer for agent-hub review, planning, and implementation
workflows.

## Scope

| Area | In Scope |
|------|----------|
| Review routing | Select review skills from request, repo, artifact type, and risk. |
| Plan routing | Select planning workflow from repo ownership, work mode, and evidence source. |
| Implementation routing | Select implementation workflow from repo ownership, work mode, risk, and verification needs. |
| Work mode split | Separate personal-project defaults from company-project defaults. |
| Skill inventory | Map existing skills to router-selected execution paths. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [work-mode-routing-axis.md](../plans/completed/work-mode-routing-axis.md) | completed | Define personal, company, and experiment routing mode. |
| [review-routing-system.md](../plans/completed/review-routing-system.md) | completed | Define review request classifier and skill chain map. |
| [plan-routing-system.md](../plans/completed/plan-routing-system.md) | completed | Define planning modes and evidence gates. |
| [implementation-routing-system.md](../plans/completed/implementation-routing-system.md) | completed | Define implementation modes and verification gates. |
| [routing-fixture-validation.md](../plans/completed/routing-fixture-validation.md) | completed | Validate router and work-mode selection. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Milestone record | done | `docs/milestones/agent-work-routing-system.md` exists. |
| Work-mode axis spec | done | [work-mode-routing-axis.md](../plans/completed/work-mode-routing-axis.md) exists and `context-routing.json` has `workModes`. |
| Review router spec | done | [review-routing-system.md](../plans/completed/review-routing-system.md) exists and `agent/skills/ah-route-review/SKILL.md` exists. |
| Planning router spec | done | [plan-routing-system.md](../plans/completed/plan-routing-system.md) exists and `agent/skills/ah-route-plan/SKILL.md` exists. |
| Implementation router spec | done | [implementation-routing-system.md](../plans/completed/implementation-routing-system.md) exists and `agent/skills/ah-route-implementation/SKILL.md` exists. |
| Router validation spec | done | [routing-fixture-validation.md](../plans/completed/routing-fixture-validation.md) exists and `tests/routing-fixtures.json` covers router IDs and work modes. |
| Implementation order | done | `## Implementation Order` lists the spec sequence. |

## Implementation Order

| Order | Spec | Reason |
|-------|------|--------|
| 1 | [work-mode-routing-axis.md](../plans/completed/work-mode-routing-axis.md) | Review, plan, and implementation routers depend on one work-mode vocabulary. |
| 2 | [review-routing-system.md](../plans/completed/review-routing-system.md) | Review routing has the lowest mutation risk and proves the router pattern. |
| 3 | [routing-fixture-validation.md](../plans/completed/routing-fixture-validation.md) | Fixtures lock router and work-mode behavior before more routers land. |
| 4 | [plan-routing-system.md](../plans/completed/plan-routing-system.md) | Planning router reuses work-mode evidence and fixture schema. |
| 5 | [implementation-routing-system.md](../plans/completed/implementation-routing-system.md) | Implementation router depends on work-mode, fixtures, and review handoff. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| Review requests route through one entry point. | A spec defines classifier inputs and output skill chains. |
| Planning requests route through one entry point. | A spec defines personal and company planning defaults. |
| Implementation requests route through one entry point. | A spec defines personal and company implementation defaults. |
| Existing skills remain executable. | Router specs map to current skill paths instead of replacing them. |
| Routing behavior is testable. | `tests/routing-fixtures.json` or equivalent fixtures cover review, plan, and implementation examples. |

## Validation Evidence

| Command | Result |
|---------|--------|
| `node scripts/validate-llm-first.mjs --check context-routing` | passed |
| `node scripts/validate-llm-first.mjs --check generated-blocks` | passed |
| `node scripts/validate-llm-first.mjs --check taxonomy` | passed |
| `node scripts/validate-llm-first.mjs` | passed |
| `git diff --check` | passed |

## Open Decisions

| Decision | Default |
|----------|---------|
| Work-mode axis name | `workModes` in JSON and `work-modes` in frontmatter. |
| First executable router | Review router implemented before plan and implementation routers. |
| Router artifact type | Thin skills for user-facing router entry points. |

## Blockers

| Blocker | Impact |
|---------|--------|
| None | Completed validation has no milestone blocker. |

## External Mirrors

None.
