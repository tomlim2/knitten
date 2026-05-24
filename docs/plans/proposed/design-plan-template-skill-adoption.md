---
status: proposed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Design Plan Template Skill Adoption

## Purpose

Make `agent/document-templates/agent-hub/design-plan.md` the canonical Design
Plan body template for skills that create, route, or review implementation-order
planning sections.

## Problem

`agent/document-templates/agent-hub/design-plan.md` now defines the reusable
Design Plan stage contract. Existing skills still carry local Design Plan
wording:

| Skill | Current behavior | Drift risk |
|-------|------------------|------------|
| `shotloom-draft-task-plan` | Owns Shotloom spec schema and repeats Design Plan stage fields. | Template and skill can diverge. |
| `shotloom-draft-spec` | User-facing wrapper describes Design Plan vocabulary. | The wrapper can omit the canonical template path. |
| `shotloom-review-task-plan` | Reviews Design Plan stage structure directly. | Review floor can drift from the template. |
| `ah-manage-spec` | Creates agent-hub specs from `spec.md` only. | Agent-hub specs with implementation stages can miss the Design Plan template. |

## Goals

1. Keep `design-plan.md` as the canonical body-shape owner.
2. Keep Shotloom-specific constraints in Shotloom skills and references.
3. Make spec creation skills read the template when an implementation-order
   Design Plan is required.
4. Make review skills validate new or rewritten Design Plan stages against the
   template.
5. Keep existing specs with `## Implementation Spec` compatible unless they are
   being rewritten.

## Non-Goals

- Rewrite existing proposed, active, completed, or archived specs only to match
  the new template.
- Move the Design Plan template to another folder.
- Apply the template to Obsidian vault-assetization documents.
- Change Shotloom daily docs branch policy.
- Change Linear, GitHub, or review-output templates.

## Current State

| Artifact | Evidence | Status |
|----------|----------|--------|
| Design Plan template | `agent/document-templates/agent-hub/design-plan.md` | Exists. |
| Template inventory | `agent/standards/authoring/document-templates.md` | Lists Design plan as `internal-consumption`. |
| Template phase spec | `docs/plans/proposed/document-template-consumption-phases.md` | Classifies `design-plan` as internal-consumption. |
| Shotloom spec authoring | `agent/skills/shotloom-draft-task-plan/SKILL.md` | Describes Design Plan stage fields locally. |
| Shotloom spec reference | `agent/skills/shotloom-draft-task-plan/reference.md` | Repeats the Stage I/O Contract block locally. |
| Shotloom spec wrapper | `agent/skills/shotloom-draft-spec/SKILL.md` | Names Design Plan but does not name the template. |
| Shotloom spec review | `agent/skills/shotloom-review-task-plan/SKILL.md` | Checks Design Plan fields locally. |
| Agent-hub spec manager | `agent/skills/ah-manage-spec/SKILL.md` | Uses `spec.md` but not `design-plan.md`. |

## Proposed Design

### Canonical Ownership

| Concern | Owner |
|---------|-------|
| Generic Design Plan stage body | `agent/document-templates/agent-hub/design-plan.md` |
| Shotloom spec section order and domain clauses | `agent/skills/shotloom-draft-task-plan/reference.md` |
| Shotloom user-facing workflow name and stop points | `agent/skills/shotloom-draft-spec/SKILL.md` |
| Shotloom Design Plan review floor | `agent/skills/shotloom-review-task-plan/SKILL.md` |
| Agent-hub generic spec creation route | `agent/skills/ah-manage-spec/SKILL.md` |

### Skill Changes

| Skill | Required change |
|-------|-----------------|
| `shotloom-draft-task-plan` | Replace local generic Design Plan field wording with a requirement to read `agent/document-templates/agent-hub/design-plan.md`; keep Shotloom-specific section order, Risk Map, Linear Briefing, and compatibility rules. |
| `shotloom-draft-task-plan/reference.md` | Convert the generic Stage I/O block into a reference to the template; keep Shotloom-specific rules for baseline, risk mapping, one-PR suitability, and legacy `Implementation Spec` compatibility. |
| `shotloom-draft-spec` | Add one user-facing rule: Design Plan means the canonical `design-plan.md` template plus Shotloom-specific constraints from the compatibility workflow. |
| `shotloom-review-task-plan` | Treat the template as the floor for new or rewritten Design Plan stages; keep legacy `Implementation Spec` exception. |
| `ah-manage-spec` | When an agent-hub spec needs ordered implementation stages, use `design-plan.md` alongside `spec.md`. Add the template to Files/Related. |

## Execution Plan

### S0 - Baseline Re-check

Input:
- Current branch, uncommitted doc-template changes, and the target skills.

Output:
- Confirmed changed-file list and current template path.

Non-output:
- No skill edits before confirming the exact files.

Failure:
- Stop if unrelated user changes touch the target skill sections.

Proof:
- `git status --short --branch`
- `rg -n "Design Plan|design-plan|Implementation Spec" agent/skills`

### S1 - Patch Authoring Skills

Input:
- `agent/document-templates/agent-hub/design-plan.md`
- `agent/skills/shotloom-draft-task-plan/SKILL.md`
- `agent/skills/shotloom-draft-task-plan/reference.md`
- `agent/skills/shotloom-draft-spec/SKILL.md`
- `agent/skills/ah-manage-spec/SKILL.md`

Output:
- Spec creation flows route generic Design Plan structure to the template.

Non-output:
- No Shotloom branch policy changes.
- No rewrite of Shotloom-specific risk, Linear, or validator clauses.

Failure:
- Stop and ask if a skill has two plausible canonical owners for the same rule.

Proof:
- `rg -n "design-plan.md|Design Plan" agent/skills/shotloom-draft-task-plan agent/skills/shotloom-draft-spec agent/skills/ah-manage-spec`

### S2 - Patch Review Skill

Input:
- `agent/skills/shotloom-review-task-plan/SKILL.md`
- `agent/document-templates/agent-hub/design-plan.md`

Output:
- Review floor names the template for new or rewritten Design Plan stages.

Non-output:
- No broad Shotloom review rubric rewrite.

Failure:
- Stop if the review skill requires a stricter Shotloom-only field not present
  in the generic template; keep that stricter field in the Shotloom review
  skill.

Proof:
- `rg -n "design-plan.md|Implementation Spec|Design Plan" agent/skills/shotloom-review-task-plan`

### S3 - Validate

Input:
- Patched skills, document template inventory, and proposed specs.

Output:
- Validator and diff checks pass.

Non-output:
- No commit or push unless the user asks.

Failure:
- Fix validator failures caused by this change. Report unrelated failures with
  exact blocker paths.

Proof:
- `node scripts/validate-llm-first.mjs --check document-templates`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs --check document-templates
node scripts/validate-llm-first.mjs
git diff --check
```

Review checks:

- no skill duplicates the full generic Design Plan stage body;
- every skill that creates or reviews Design Plan stages names the canonical
  template or a direct skill that loads it;
- Shotloom-specific review constraints remain in Shotloom skills;
- legacy `## Implementation Spec` compatibility remains explicit.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Generic template weakens Shotloom review | Shotloom specs lose domain safeguards. | Keep Shotloom-specific constraints in Shotloom skills and references. |
| Duplicate rules remain | Agents follow stale local wording. | Replace generic field blocks with template references. |
| Agent-hub specs overuse Design Plan | Small specs become heavier than needed. | Use the template only when ordered implementation stages are required. |
| Existing legacy specs are treated as invalid | Review churn unrelated to active work. | Keep the `Implementation Spec` compatibility exception. |

## Acceptance Criteria

1. `shotloom-draft-task-plan` names `design-plan.md` as the generic Design Plan
   template.
2. `shotloom-draft-task-plan/reference.md` does not own a second full generic
   Stage I/O body.
3. `shotloom-draft-spec` explains that Design Plan uses the template plus
   Shotloom-specific constraints.
4. `shotloom-review-task-plan` validates new or rewritten Design Plan stages
   against the template.
5. `ah-manage-spec` names `design-plan.md` for specs with ordered
   implementation stages.
6. Validation commands pass or report unrelated blockers.

## Open Decisions

1. Should `review-audit-web-spec` read `design-plan.md` when reviewing generic
   implementation specs outside Shotloom?
2. Should a validator check that Design Plan stage blocks contain all five
   fields?
