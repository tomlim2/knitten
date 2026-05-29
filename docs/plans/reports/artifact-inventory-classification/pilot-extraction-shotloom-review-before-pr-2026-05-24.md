---
status: completed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
spec: ../../active/thin-skill-guide-boundary.md
---

# Pilot Extraction: shotloom-review-before-pr

## Purpose

Record the first accepted extraction pilot for `shotloom-review-before-pr`.

## Inputs

| Input | Evidence |
|-------|----------|
| Source skill | `agent/skills/shotloom-review-before-pr/SKILL.md` |
| Accepted extraction rows | `review-mode-decision`, `triad-review-rubric` |
| Review mode target | `agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md` |
| Triad target | `agent/skills/shotloom-review-before-pr/references/TRIAD_REVIEW.md` |
| Inventory review | `docs/plans/reports/artifact-inventory-classification/pilot-classification-review-2026-05-24.md` |

## Change

| Area | Before | After |
|------|--------|-------|
| Review mode decision | `SKILL.md` repeated override and trigger details. | `SKILL.md` reads `REVIEW_MODE.md` and renders its decision template. |
| Triad merge rules | `SKILL.md` named merge rules as local prose. | `SKILL.md` points to `TRIAD_REVIEW.md` → `Merge Rules`. |

## Metrics

| Metric | Before | After | Result |
|--------|--------|-------|--------|
| `SKILL.md` lines | 195 | 191 | reduced |
| `SKILL.md` bytes | 7701 | 7457 | reduced |
| accepted extraction rows | 2 | 2 | stable |
| stale source-section validator | absent before prior review | present | enforced |
| target references | 2 existing | 2 existing | stable |

## Guardrail Used

| Guardrail | Source | Result |
|-----------|--------|--------|
| stale `source-section` rejection | `pilot-classification-review-2026-05-24.md` follow-up | enforced by `artifact-inventory` validation |

## Decision-Quality Notes

| Gate | Result |
|------|--------|
| Pre-route skill body count | unchanged: one selected skill body |
| Runtime required references | explicit: `REVIEW_MODE.md`, `TRIAD_REVIEW.md` |
| Must-not-load violations | no new must-not-load surface added; runtime loading not separately exercised |
| Canonical owner conflict | reduced for review-mode and triad judgment |
| Secondary route count | unchanged |

## Validation

```bash
node scripts/generate-artifact-inventory.mjs
node scripts/validate-llm-first.mjs --check artifact-inventory
node scripts/validate-llm-first.mjs
git diff --check
```

## Next Rule Candidate

For a first extraction pass, do not move entire sections when accepted target
references already exist. Instead:

1. Keep `SKILL.md` headings and ordered workflow steps.
2. Replace duplicated judgment or rubric prose with direct references to the
   accepted target file and heading.
3. Regenerate inventory.
4. Verify `artifact-inventory` source-section checks still pass.
