---
status: completed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
spec: ../../active/artifact-inventory-classification.md
---

# Pilot Classification Review 2026-05-24

## Purpose

Review the five pilot skill inventory classifications without using chat
history.

## Inputs

| Input | Evidence |
|-------|----------|
| Inventory | `agent/config/artifact-inventory.json` |
| Generator | `scripts/generate-artifact-inventory.mjs` |
| Validator | `scripts/validate-llm-first.mjs --check artifact-inventory` |
| Pilot skills | `ah-manage-spec`, `ah-route-plan`, `shotloom-review-before-pr`, `obsidian-obsidian-markdown`, `hatch-pet` |

## Findings

| Finding | Severity | Result |
|---------|----------|--------|
| `shotloom-review-before-pr` pilot rows referenced old headings that no longer exist. | P1 | Fixed generator rows and added validator source-section coverage. |
| Pilot rows had no accepted/blocked state after review. | P2 | Fixed generator to emit reviewed pilot `review-state` values. |
| Several extraction target paths are planned but do not exist yet. | P2 | Marked those extraction rows and parent skill rows `blocked`. |

## Pilot Review Results

| Skill | Review state | Skill kind | Extraction count | Split readiness | Reason |
|-------|--------------|------------|------------------|-----------------|--------|
| `ah-manage-spec` | `blocked` | `workflow-with-notes` | 2 | `ready` | Source sections exist; standard target files do not exist yet. |
| `ah-route-plan` | `accepted` | `workflow-only` | 0 | `none` | Router body has no extraction candidates. |
| `shotloom-review-before-pr` | `accepted` | `workflow-with-notes` | 2 | `ready` | Source sections exist and target references exist. |
| `obsidian-obsidian-markdown` | `blocked` | `reference-heavy` | 3 | `ready` | Two rows target existing `OBSIDIAN-FORMAT.md`; `EMBEDS.md` target does not exist yet. |
| `hatch-pet` | `blocked` | `guide-heavy` | 4 | `ready` | Source sections exist; target reference files do not exist yet. |

## Inventory Delta

| Metric | Before | After |
|--------|--------|-------|
| Total rows | 675 | 674 |
| Extraction item rows | 12 | 11 |
| `review-state: accepted` | 0 | 6 |
| `review-state: blocked` | 0 | 10 |
| `review-state: pending` | 675 | 658 |

## Validator Coverage Added

`artifact-inventory` now fails when an extraction item `source-section` is not
present in the source skill file.

Regression case:

| Mutation | Expected failure |
|----------|------------------|
| Set a pilot row `source-section` to an old heading. | `source-section not found in <source-artifact-path>` |

## Next Action

Use `shotloom-review-before-pr` as the low-risk extraction pilot because it has
accepted extraction rows and existing target references.

Use `ah-route-plan` only as a workflow-only baseline. It has no extraction
items.

Blocked rows require target file creation before extraction work starts.
