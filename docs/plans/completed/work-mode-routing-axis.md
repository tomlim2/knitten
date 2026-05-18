---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
milestone: agent-work-routing-system
---

# Work Mode Routing Axis

**status:** completed on 2026-05-18.

## Purpose

Add a routing axis that separates personal, company, and experimental work
defaults before review, planning, or implementation skills run.

## Problem

`agent/config/context-routing.json` routes by domain, repo key, language,
framework, and task type. It does not encode whether a task is personal work,
company work, or an experiment. Agents therefore reuse the same planning,
implementation, and review posture across different risk environments.

## Goals

| Goal | Result |
|------|--------|
| Add work-mode vocabulary | Routing can distinguish personal, company, and experiment defaults. |
| Define evidence | Agents can infer work mode from repo key, cwd, issue source, and user wording. |
| Define fallback | Ambiguous work mode asks one question before state-changing work. |
| Keep domain routing intact | Existing context profiles continue to route by technical domain. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Replace `task-types` | Work mode is orthogonal to review, authoring, implementation, and ops. |
| Encode every company policy | Repo-local rules remain the source for company-specific implementation details. |
| Force personal work into heavy gates | Personal mode keeps lightweight defaults unless the repo marks a task high risk. |

## Pre-Implementation State

| File | State |
|------|-------|
| `agent/config/context-routing.json` | Has `taskTypes`, no work-mode axis. |
| `agent/rules/task-context-routing.md` | Classifies domain and profile, no work-mode branch. |
| `tests/routing-fixtures.json` | Covers profile routing, no personal/company cases. |

## Proposed Design

| Work Mode | Evidence | Default Gate |
|-----------|----------|--------------|
| `personal` | User says personal project; repo is private/local-only; no company issue source exists. | Build smallest working slice, then verify manually or with focused tests. |
| `company` | Repo key maps to a company repo; Linear/GitHub PR workflow is present; user names company work. | Read issue/order/spec, repo rules, tests, and PR readiness gates. |
| `experiment` | User asks for prototype, spike, throwaway test, benchmark, or comparison. | Preserve hypothesis, measurement, and cleanup path. |

Add `workModes` to `context-routing.json`:

```json
"workModes": ["personal", "company", "experiment"]
```

Add optional `work-modes:` frontmatter to high-level router skills only. Do not
add it to every leaf skill unless a leaf skill is unsafe outside one mode.

## Execution Plan

| Step | Action |
|------|--------|
| 1 | Add `workModes` axis and validation for known values. |
| 2 | Add work-mode evidence rules to `task-context-routing.md` or a new router rule. |
| 3 | Add minimal route fixtures for personal, company, and experiment requests, or implement them through `routing-fixture-validation.md`. |
| 4 | Update generated routing inventory if it displays the new axis. |

## Validation

```bash
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Control |
|------|---------|
| Work mode duplicates repo rules | Store only generic defaults in this axis. |
| Work mode is guessed incorrectly | Ask one question before state-changing work when evidence conflicts. |
| Existing profiles grow too large | Keep work mode on router skills, not every leaf skill. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| Routing config has work modes. | `context-routing.json` includes `workModes`. |
| Unknown work modes fail validation. | Validator rejects an invalid work-mode value. |
| Ambiguous mode has a fallback. | Routing rule says when to ask. |
| Fixtures cover each mode. | This spec or `routing-fixture-validation.md` adds personal, company, and experiment examples. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Axis name | `workModes` in JSON, `work-modes` in frontmatter. |
| Company evidence source | Repo key plus explicit issue/PR/order evidence. |
