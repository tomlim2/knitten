---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/completed/skill-output-validator-strategy.md
---

# Spec Intake: skill-output-validator-strategy

## User Request

Select the next Knitten refactor milestone todo, then run the same spec, review,
fix, PR, CI, and merge round.

## Goal

Define the validator strategy for Knitten skill outputs so output contracts,
paths, templates, lifecycle, and adoption rules have mechanical anti-rot checks.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create skill-output-validator-strategy` |
| candidate routes | `ah-manage-milestone update knitten-refactor` |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/knitten-refactor.md` | Owns the remaining Validator strategy todo. |
| parent spec | `docs/plans/completed/skill-operating-system.md` | Defines validator boundary and output taxonomy. |
| child spec | `docs/plans/completed/output-contract-registry.md` | Defines `outputs` validator scope. |
| child spec | `docs/plans/completed/skill-output-location-architecture.md` | Defines path-owner boundaries. |
| child spec | `docs/plans/completed/skill-output-lifecycle.md` | Defines lifecycle owner gates. |
| child spec | `docs/plans/completed/skill-output-contract-adoption.md` | Defines adoption gates and skill wording contract. |
| validator | `scripts/validate-llm-first.mjs` | Current validator checks and check names. |
| manifest | `agent/config/agent-hub.json` | Current validator registry metadata. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Validators catch drift and broken contracts. | `skill-operating-system.md`. |
| Output contracts do not replace path owners. | `skill-output-location-architecture.md`. |
| Lifecycle state fields are not added to `outputs.json` in this round. | `skill-output-lifecycle.md`. |
| Skill adoption has staged gates and avoids broad churn. | `skill-output-contract-adoption.md`. |

## Open Questions

| Question | Default |
|----------|---------|
| Does this round add validator code? | No. This spec defines strategy and maps current checks to output surfaces. |
| Does every output class need a dedicated check? | No. Reuse existing checks until a repeated drift class requires a new check. |
| Does CI run all checks? | Yes. Repository validation runs `node scripts/validate-llm-first.mjs`. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No new validator check implementation. | The milestone todo asks for strategy, and current checks already cover first output-contract surfaces. |
| No `agent-hub.json` registry edit. | Current validator registry already lists the active checks used here. |
| No output registry schema migration. | Lifecycle and owner fields remain outside `outputs.json` in this round. |
| No skill migration. | Adoption remains a separate staged trigger. |

## Validation Expected

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Output registry | `node scripts/validate-llm-first.mjs --check outputs` |
| Template registry | `node scripts/validate-llm-first.mjs --check document-templates` |
