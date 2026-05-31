---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/completed/knitten-refactor-closure-review.md
---

# Spec Intake: knitten-refactor-closure-review

## User Request

Create a worktree spec for the Knitten refactor milestone closing review.

## Goal

Define the completion review that decides whether `knitten-refactor` can move
from `active` to `completed`, or whether follow-up work must move to another
milestone.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create knitten-refactor-closure-review` |
| candidate routes | `ah-manage-milestone review knitten-refactor` |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/knitten-refactor.md` | Parent milestone and acceptance criteria. |
| guideline | `docs/guidelines/milestone-review.md` | Review lens and required output block. |
| spec | `docs/plans/completed/skill-operating-system.md` | Parent architecture evidence. |
| spec | `docs/plans/completed/output-contract-registry.md` | Output registry and resolver evidence. |
| spec | `docs/plans/completed/skill-output-location-architecture.md` | Location boundary evidence. |
| spec | `docs/plans/completed/skill-output-lifecycle.md` | Lifecycle boundary evidence. |
| spec | `docs/plans/completed/skill-output-contract-adoption.md` | Skill adoption evidence. |
| spec | `docs/plans/completed/skill-output-validator-strategy.md` | Validator strategy evidence. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Knitten refactor frames the repo as an LLM skill-friendly operating system. | `skill-operating-system.md`. |
| Output contracts bind purpose, destination, template, format, lifecycle, ownerSkill, and validator. | `docs/milestones/knitten-refactor.md`. |
| Broad migration remains out of scope for this milestone. | `skill-output-contract-adoption.md`. |
| Completion requires evidence against milestone acceptance criteria, not only merged child specs. | `docs/guidelines/milestone-review.md`. |

## Open Questions

| Question | Default |
|----------|---------|
| Should this spec complete the milestone directly? | No. It defines the review; status change happens after review evidence is written. |
| Should follow-up skill migration block closure? | No. Move broad migration to the next milestone unless an acceptance criterion lacks evidence. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No child spec rewrite. | Review checks evidence and records blockers; it does not re-author every spec. |
| No broad skill migration. | Existing adoption spec makes migration trigger-based. |
| No milestone status change in this spec PR. | Status change belongs to the review-result PR after findings are known. |

## Validation Expected

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
