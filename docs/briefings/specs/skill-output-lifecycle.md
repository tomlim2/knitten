---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/proposed/skill-output-lifecycle.md
---

# Spec Intake: skill-output-lifecycle

## User Request

Create, review, fix, publish, validate, and merge the Skill Output Lifecycle
spec after the output location architecture spec.

## Goal

Define lifecycle states, allowed transitions, promotion gates, cleanup rules,
and owner responsibilities for Knitten skill outputs.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create skill-output-lifecycle` |
| candidate routes | `ah-manage-milestone update knitten-refactor` |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| spec | `docs/plans/proposed/skill-operating-system.md` | Parent output taxonomy and lifecycle boundary. |
| spec | `docs/plans/proposed/skill-output-location-architecture.md` | Path family and resolver ownership. |
| standard | `agent/standards/policy/temporary-runtime-files.md` | Runtime workDir and cleanup contract. |
| reference | `docs/reference/local-report-inbox.md` | JSON-only local handoff and promotion boundary. |
| reference | `agent/skills/ah-manage-spec/references/SPEC-LIFECYCLE.md` | Spec lifecycle states and delete/archive gates. |
| reference | `agent/skills/ah-manage-milestone/references/MILESTONE-LIFECYCLE.md` | Milestone lifecycle states and completion gate. |
| milestone | `docs/milestones/knitten-refactor.md` | Parent progress and acceptance criteria. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Lifecycle transitions belong in `skill-output-lifecycle.md`. | `docs/plans/proposed/skill-output-location-architecture.md`. |
| Runtime files stay local and include cleanup paths. | `agent/standards/policy/temporary-runtime-files.md`. |
| LLM handoff under `.agent-local` is JSON-only. | `docs/reference/local-report-inbox.md`. |
| Specs and milestones already have accepted lifecycle references. | `SPEC-LIFECYCLE.md`, `MILESTONE-LIFECYCLE.md`. |

## Open Questions

| Question | Default |
|----------|---------|
| Should lifecycle states be implemented in `outputs.json` now? | No. This spec defines the contract; implementation belongs to a later adoption or validator spec. |
| Should runtime logs be promoted directly to tracked docs? | No. Promote only durable facts, not raw runtime output. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No validator implementation change. | This is a spec PR. |
| No `outputs.json` schema migration. | Output registry adoption follows this lifecycle spec. |
| No rewrite of existing lifecycle references. | Existing spec and milestone lifecycle references remain canonical for their surfaces. |

## Validation Expected

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
