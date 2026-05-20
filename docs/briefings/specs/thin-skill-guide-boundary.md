---
status: intake
created: 2026-05-20
updated: 2026-05-20
owner: agent-hub
spec: docs/plans/proposed/thin-skill-guide-boundary.md
---

# Spec Intake: thin-skill-guide-boundary

## User Request

Define how Knitten reduces skill bodies and moves durable guidance into
guide, standard, reference, template, and validator layers.

Primary reason: LLM task quality drops when too many large skills compete during
route selection. Reduce wrong route selection, wrong instruction priority, and
stale guidance reuse. Exposed skill count and skill body size are secondary
controls for reducing those defects.

## Goal

Create a boundary spec that classifies what stays in a skill and what moves to
another artifact before artifact inventory and migration work begins.

## Route

- selected route: `ah-manage-spec`
- candidate routes: `ah-manage-spec`, `ah-manage-artifact`
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/agent-artifact-pack-system.md` | umbrella milestone and newly added work item |
| spec | `docs/plans/active/skill-oriented-context-loading.md` | skill context manifest and thin command direction |
| spec | `docs/plans/proposed/knitten-core-public-transition.md` | public core boundary and pack migration direction |
| milestone | `docs/milestones/agent-work-routing-system.md` | completed router pattern for plan, review, and implementation work |
| policy | `SYSTEM.md` | shared layer model for rules, standards, skills, and commands |
| standard | `agent/standards/policy/llm-first-docs.md` | LLM-first document shape and length discipline |
| user decision | chat on 2026-05-20 | reduce skills and increase guide documents where useful |

## Known Decisions

- Skills become thin executable workflow adapters when possible.
- Standards and guides own durable judgment, criteria, examples, and
  anti-patterns.
- Templates own reusable document bodies.
- Validators own machine-checkable contracts.
- Artifact-pack classification needs this boundary before large inventory work.
- Core-vs-pack retention is deferred to the future core boundary and artifact
  pack classification work.
- Inventory rows must separate skill rows from extraction item rows so validators
  can count and link extracted content without inferring from prose.
- LLM decision quality is the primary success criterion; token and file count
  reduction are useful only when they reduce misjudgment.
- Pilot work must record decision-quality metrics before and after extraction:
  candidate count, loaded skill bodies, loaded context bytes, must-not-load
  violations, canonical owner conflicts, and secondary route count.
- Router priority and route evidence gates must prevent domain, repo, pack,
  reference, template, and leaf skill bodies from loading before matching
  evidence exists.

## Open Questions

- Should the validator enforce skill body size, guide extraction markers, or
  both?

## Exclusions

- Do not move existing skills in this spec.
- Do not define the full artifact-pack manifest schema.
- Do not decide whether extracted artifacts stay in core or move to an artifact
  pack.
- Do not change public/private repository strategy.
- Do not rewrite Shotloom skill bodies as part of this spec.

## Validation Expected

- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`
