---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Knitten Refactor Closure Review

## Purpose

Define the closing review for the `knitten-refactor` milestone.

This spec decides whether the milestone can move to `completed`, or whether
remaining work belongs in a follow-up milestone.

## Problem

The milestone now has child specs for operating model, output registry,
location, lifecycle, adoption, and validator strategy. Completion still needs a
single review that checks the milestone acceptance criteria against durable
evidence.

| Failure mode | Effect |
|--------------|--------|
| Child specs exist but ACs are not checked. | The milestone can close with hidden gaps. |
| Follow-up migration work stays inside this milestone. | The milestone never gets a clear stop condition. |
| Proposed specs are mistaken for implemented migration. | Future agents overclaim current system behavior. |
| Evidence rows are scattered. | A cold-start session cannot tell why the milestone is complete or still active. |

## Goals

| Goal | Requirement |
|------|-------------|
| Completion review | Evaluate every milestone acceptance criterion against concrete evidence. |
| Scope split | Separate milestone blockers from follow-up work. |
| Review output | Produce the compact milestone review block from `docs/guidelines/milestone-review.md`. |
| Status recommendation | Recommend `completed`, `active`, `parked`, or `superseded` with evidence. |
| Follow-up routing | Name the next milestone or spec for work that is real but not blocking. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Rewrite child specs. | This review checks evidence and records gaps. |
| Implement broad skill migration. | Migration is trigger-based per `skill-output-contract-adoption.md`. |
| Add validator code. | Validator implementation follows separate specs when repeated drift justifies it. |
| Change milestone status in this spec PR. | The status change belongs to the review-result PR. |
| Close `output-contract-system` automatically. | That milestone needs its own closure check. |

## Current State

| Surface | Evidence |
|---------|----------|
| Parent architecture | `docs/plans/completed/skill-operating-system.md`. |
| Output contract implementation | `docs/plans/completed/output-contract-registry.md`, `agent/config/outputs.json`, `agent/lib/resolve-output.mjs`. |
| Location boundary | `docs/plans/completed/skill-output-location-architecture.md`. |
| Lifecycle boundary | `docs/plans/completed/skill-output-lifecycle.md`. |
| Skill adoption boundary | `docs/plans/completed/skill-output-contract-adoption.md`. |
| Validator strategy | `docs/plans/completed/skill-output-validator-strategy.md`. |
| Review guideline | `docs/guidelines/milestone-review.md`. |
| CI validator | `.github/workflows/validate.yml` runs repository validation. |

## Proposed Design

### Review Lenses

| Lens | Question | Blocking condition |
|------|----------|--------------------|
| Direction | Does the milestone still express the LLM skill operating system frame? | Direction collapses into document cleanup, path cleanup, or template cleanup only. |
| Scope | Are broad migration and full taxonomy redesign still out of scope? | Closure requires work explicitly marked out of scope. |
| Naming | Do specs use current terms: skill operating system, output contract, location, lifecycle, validator, handoff? | Terms conflict enough to misroute future work. |
| Traceability | Does every AC map to one or more evidence files? | Any AC lacks durable evidence. |
| Executability | Is the next work clear after closure? | Follow-up work has no owning milestone or spec. |
| Expansion control | Does closure avoid swallowing artifact-pack or broad migration work? | Non-blocking follow-up is treated as closure blocker. |

### Acceptance Evidence Matrix

| AC | Required evidence | Completion rule |
|----|-------------------|-----------------|
| AC1 | `skill-operating-system.md` plus child specs. | Pass if one architecture and child boundaries exist. |
| AC1a | Milestone formula plus `output-contract-registry.md`, lifecycle, adoption, validator strategy. | Pass if purpose/path/template/lifecycle/owner/validator are all covered by spec or implementation evidence. |
| AC1b | `skill-operating-system.md` output taxonomy and `skill-output-lifecycle.md` output class lifecycle. | Pass if markdown/json, media/export, logs/runtime, and durable docs are all classified. |
| AC1c | Milestone purpose and `skill-operating-system.md` purpose. | Pass if wording frames skill operation, not only artifact cleanup. |
| AC1d | `agent/document-templates/agent-hub/skill.md`, `agent/document-templates/agent-hub/skill-html-like.md`, and template validator. | Pass if both template assets exist and validator passes. |
| AC2 | `outputs.json`, `resolve-output.mjs`, `ah-manage-spec`, and adoption spec. | Pass if first output-writing skill uses output ids and future adoption rule is defined. |
| AC3 | `local-session-handoff`, `docs/reference/local-report-inbox.md`, and location/lifecycle specs. | Pass if LLM handoff remains JSON and `.agent-local` local-only. |
| AC4 | `skill-output-lifecycle.md` promotion gate and adoption/validator strategy. | Pass if durable promotion paths are defined for rules, standards, skills, templates, specs, milestones, references, and decisions. |
| AC5 | `outputs`, `document-templates`, `spec-lifecycle`, and validator strategy. | Pass if broken path/template bindings have mechanical checks or a named trigger for adding one. |

### Review Output Contract

Write the review result in a follow-up patch using this shape:

```text
Milestone review:
- Direction: pass | Pn: <finding>
- Scope: pass | Pn: <finding>
- Naming: pass | Pn: <finding>
- Traceability: pass | Pn: <finding>
- Executability: pass | Pn: <finding>
- Expansion control: pass | Pn: <finding>

Verdict: ready | revise-before-spec | split | park
Status recommendation: completed | active | parked | superseded
Blocking follow-ups: none | <list>
Non-blocking next work: <milestone/spec>
```

### Status Rules

| Review result | Milestone action |
|---------------|------------------|
| All ACs pass and no blocking findings exist. | Change `docs/milestones/knitten-refactor.md` status to `completed` in the review-result PR. |
| One or more ACs lack evidence. | Keep status `active`; add blocker or progress row with required evidence. |
| Remaining work belongs to artifact packs or output-contract follow-up adoption. | Keep closure ready; route follow-up to `agent-artifact-pack-system` or `output-contract-system`. |
| Direction changed or milestone scope no longer matches current architecture. | Mark `superseded` only with explicit replacement milestone. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this closure review spec and intake. | Proposed review contract and evidence map. |
| 2 | Attach spec to `knitten-refactor`. | Milestone links the closure review spec. |
| 3 | Run spec validation. | Diff, LLM-first, and spec lifecycle checks pass. |
| 4 | In follow-up work, execute review. | Review block, AC evidence verdict, and status recommendation. |
| 5 | If verdict is ready, patch milestone status. | `knitten-refactor` becomes `completed`; follow-up work routes elsewhere. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/milestones/knitten-refactor.md`
- `docs/guidelines/milestone-review.md`
- child specs linked from the milestone
- current validator commands

Output:
- Confirmed milestone ACs, review lenses, and evidence files.

Non-output:
- No milestone status change.
- No child spec rewrite.

Failure:
- Stop if a linked child spec is missing or status mismatches its milestone row.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`

S1 - Closure review contract

Input:
- Baseline evidence.

Output:
- Review Lenses, Acceptance Evidence Matrix, Review Output Contract, and Status Rules.

Non-output:
- No implementation migration.
- No validator code changes.

Failure:
- Stop if any AC lacks an evidence target.

Proof:
- Manual review plus full validator.

S2 - Milestone alignment

Input:
- New spec path and `docs/milestones/knitten-refactor.md`.

Output:
- Milestone links the spec and records closure review progress as `proposed`.

Non-output:
- No acceptance criteria deletion.

Failure:
- Stop if spec frontmatter milestone does not match the milestone file.

Proof:
- `rg -n "knitten-refactor-closure-review|Closure review" docs/milestones/knitten-refactor.md docs/plans/completed/knitten-refactor-closure-review.md`

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Template validator | `node scripts/validate-llm-first.mjs --check document-templates` |
| Output registry | `node scripts/validate-llm-first.mjs --check outputs` |
| Spec route evidence | `rg -n "knitten-refactor-closure-review|Closure review" docs/milestones/knitten-refactor.md docs/plans/completed/knitten-refactor-closure-review.md docs/briefings/specs/knitten-refactor-closure-review.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Review spec becomes a status change by stealth. | Non-goals and execution plan keep status change in a separate review-result PR. |
| Follow-up migration blocks closure forever. | Status rules route non-blocking migration to follow-up milestones. |
| Proposed specs are overclaimed as implementation. | AC matrix distinguishes spec evidence from implementation evidence. |
| Output-contract and artifact-pack milestones overlap. | Closure review names follow-up milestone for non-blocking work. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec defines review lenses for closing `knitten-refactor`. |
| AC2 | Spec maps every milestone AC to required evidence. |
| AC3 | Spec defines the required review output block. |
| AC4 | Spec defines status rules for completed, active, parked, and superseded outcomes. |
| AC5 | Spec keeps status change out of this spec PR. |
| AC6 | Parent milestone links this closure review spec. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should closure review execute in the same PR as this spec? | No. Execute it after this review contract is merged or accepted. |
| Should `output-contract-system` close with this milestone? | No. Review it separately after `knitten-refactor` closure. |
| Should broad skill migration block completion? | No. Route it to follow-up adoption work unless an existing AC lacks evidence. |
