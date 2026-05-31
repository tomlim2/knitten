---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/completed/skill-output-contract-adoption.md
---

# Spec Intake: skill-output-contract-adoption

## User Request

Continue the Knitten refactor milestone with the next task, using the same
spec, review, fix, PR, CI, and merge round.

## Goal

Define how Knitten skills adopt output contract ids instead of repeating
path/template pairs in skill prose.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create skill-output-contract-adoption` |
| candidate routes | `ah-manage-milestone update knitten-refactor` |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/knitten-refactor.md` | Owns next todo and acceptance criteria. |
| parent spec | `docs/plans/completed/skill-operating-system.md` | Defines operating loop, output taxonomy, and migration order. |
| child spec | `docs/plans/completed/output-contract-registry.md` | Defines current output registry, resolver, and first consumer docs. |
| child spec | `docs/plans/completed/skill-output-location-architecture.md` | Defines resolver boundaries and direct path rules. |
| child spec | `docs/plans/completed/skill-output-lifecycle.md` | Defines output lifecycle and owner responsibilities. |
| registry | `agent/config/outputs.json` | Current output ids and row shape. |
| resolver | `agent/lib/resolve-output.mjs` | Current command contract for output ids. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Skills use the narrowest available output contract. | `skill-operating-system.md`. |
| Output contracts bind destination plus template; they do not replace path owners. | `skill-output-location-architecture.md`. |
| Lifecycle state fields are not added to `outputs.json` in this round. | `skill-output-lifecycle.md`. |
| Existing skill migration is staged, not broad. | `output-contract-registry.md` and parent milestone. |

## Open Questions

| Question | Default |
|----------|---------|
| Should this spec migrate every skill now? | No. It defines adoption order and gates. |
| Should every direct repo path get an output row? | No. Add rows only for repeated path/template pairs or machine-readable handoff contracts. |
| Should output ids be mandatory for unique one-off repo paths? | No. Use direct owner path when no reusable pair exists. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No broad skill rewrite. | Adoption happens when a skill writes or changes an output surface. |
| No `outputs.json` schema change. | Registry lifecycle fields belong to a later validator/adoption implementation slice. |
| No resolver code change. | Current resolver already supports the initial adoption surfaces. |
| No validator strategy implementation. | Milestone keeps validator strategy as a separate todo. |

## Validation Expected

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Output resolver smoke | `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=skill-output-contract-adoption` |
