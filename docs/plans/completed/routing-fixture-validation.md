---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
milestone: agent-work-routing-system
---

# Routing Fixture Validation

**status:** completed on 2026-05-18.

## Purpose

Add validation fixtures that prove review, planning, implementation, and
work-mode routing choose the expected router and exclude unrelated skill bodies.

## Problem

Existing route fixtures prove technical context profiles. They do not prove
that high-level requests such as "review this", "make a plan", or "implement
this" select the correct router or work-mode gate.

## Goals

| Goal | Result |
|------|--------|
| Add high-level router fixtures | Review, plan, and implementation requests have expected router outputs. |
| Add work-mode fixtures | Personal, company, and experiment cases are covered. |
| Preserve exclusion checks | Unrelated domain profiles remain excluded. |
| Validate generated inventory | Router skills appear in compact routing output. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Build an LLM classifier benchmark | Fixtures stay deterministic and synthetic. |
| Validate every phrase variation | Cover representative canonical examples first. |
| Replace manual review | Fixtures catch routing regressions, not review quality. |

## Pre-Implementation State

| File | State |
|------|-------|
| `tests/routing-fixtures.json` | Covers technical profiles. |
| `scripts/validate-llm-first.mjs` | Validates profile metadata and generated routing blocks. |
| `AGENT-HUB.md` | Shows profiles and pilot files, no work-mode routing table. |

## Proposed Design

Extend route fixtures with router expectations:

```json
{
  "task": "Review my personal Astro app before I ship it",
  "mustLoad": ["ah-route-review", "web-review"],
  "mustNotLoad": ["shotloom-review", "unreal-engine"],
  "workMode": "personal",
  "maxBytes": 25000
}
```

Fixture categories:

| Category | Example |
|----------|---------|
| Review router | Personal web review, company Shotloom PR review, spec review. |
| Planning router | Personal feature plan, company issue plan, experiment plan. |
| Implementation router | Personal web implementation, company Shotloom implementation, experiment. |
| Work-mode ambiguity | Conflicting evidence requires clarification before mutation. |

Router IDs:

| Request Class | Router ID |
|---------------|-----------|
| Review | `ah-route-review` |
| Plan | `ah-route-plan` |
| Implementation | `ah-route-implementation` |

## Execution Plan

| Step | Action |
|------|--------|
| 1 | Extend fixture schema with router and work-mode fields. |
| 2 | Add validation for known router IDs and work modes. |
| 3 | Add fixtures for review, plan, implementation, and ambiguity. |
| 4 | Update generated routing inventory if fixture summaries are displayed. |

## Validation

```bash
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Control |
|------|---------|
| Fixtures encode unimplemented routers too early | Add fixtures with specs and implement after router skills land. |
| Fixture format diverges from validator | Update validator and fixtures in the same spec implementation. |
| Ambiguity fixture becomes subjective | Use explicit conflicting evidence in the fixture body. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| Fixture schema includes router expectations. | Validator parses router and work-mode fields. |
| High-level requests are covered. | Fixtures include review, plan, and implementation tasks. |
| Work modes are covered. | Fixtures include personal, company, experiment, and ambiguous cases. |
| Exclusion still works. | Fixtures include `mustNotLoad` for unrelated profiles. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Ambiguous fixture result | Mark as `requiresClarification: true`. |
| Router ID namespace | Use skill slugs such as `ah-route-review`, `ah-route-plan`, and `ah-route-implementation`. |
