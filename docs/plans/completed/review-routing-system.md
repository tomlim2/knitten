---
status: completed
created: 2026-05-18
updated: 2026-05-18
completed: 2026-05-18
owner: agent-hub
milestone: agent-work-routing-system
---

# Review Routing System

**status:** completed on 2026-05-18.

## Purpose

Create one review entry point that classifies a review request and selects the
correct review skill chain.

## Problem

Review skills exist by domain and workflow, but the user must know which one to
invoke. Generic review wording can route to Shotloom PR review, web UX review,
spec review, implementation review, or docs review. The current system has no
single review classifier with a normalized output contract.

## Goals

| Goal | Result |
|------|--------|
| Add review router skill | User can ask for review without naming a leaf skill. |
| Classify review type | Router identifies code, docs, UX, spec, PR, implementation, or artifact review. |
| Preserve leaf skills | Router invokes existing skills instead of merging their bodies. |
| Normalize output | Findings-first format is consistent across routed reviews. |
| Use work mode | Company reviews apply stricter PR and repo-rule gates than personal reviews. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Replace domain review skills | Leaf skills own domain checklists. |
| Auto-fix review findings | Review remains read-only unless the user asks for fixes. |
| Require a PR for every review | Personal and local reviews can run on a diff or file path. |

## Pre-Implementation State

| Review Area | Current Artifact |
|-------------|------------------|
| Agent-hub implementation | `agent/skills/ah-review-implementation/SKILL.md` |
| Shotloom PR/code/docs | `agent/skills/shotloom-review-before-pr/SKILL.md`, `agent/skills/shotloom-review-code/SKILL.md`, `agent/skills/shotloom-review-docs/SKILL.md` |
| Web code | `agent/skills/review-audit-web/SKILL.md` |
| Web UX | `agent/skills/review-audit-ux/SKILL.md` |
| Web/product spec | `agent/skills/review-audit-web-spec/SKILL.md` |
| 3D rendering | `agent/skills/review-audit-3d/SKILL.md` |
| Motion/retarget | `agent/skills/review-audit-ai-motion/SKILL.md`, `agent/skills/review-audit-retarget/SKILL.md` |

## Proposed Design

Add:

```text
agent/skills/ah-route-review/SKILL.md
```

Router inputs:

| Input | Use |
|-------|-----|
| User request | Detect review target and explicit constraints. |
| Cwd and repo key | Select repo-specific review gates. |
| Changed files or target path | Detect code, docs, UX, spec, or asset review. |
| Work mode | Select personal, company, or experiment strictness. |
| Existing PR or issue | Select PR readiness or comment-response flow. |

Router output:

| Output | Meaning |
|--------|---------|
| `selected_review_type` | `code`, `docs`, `ux`, `spec`, `implementation`, `pr`, `asset`, or `mixed`. |
| `selected_skill_chain` | Ordered list of existing skills to read or invoke. |
| `required_context` | Repo rules, standards, and files to load. |
| `verification_gate` | Commands or manual checks required before reporting. |

## Execution Plan

| Step | Action |
|------|--------|
| 1 | Inventory review skills and assign review-type metadata. |
| 2 | Create `ah-route-review` as a thin classifier skill. |
| 3 | Define normalized findings-first output. |
| 4 | Add review routing fixtures. |
| 5 | Add `ah-route-review` to routing inventory. |

## Validation

```bash
test -f agent/skills/ah-route-review/SKILL.md
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Control |
|------|---------|
| Router duplicates leaf skill logic | Router only classifies and delegates. |
| Mixed reviews over-load context | Router runs staged passes and reports loaded context. |
| Personal reviews become too heavy | Work mode selects a lighter verification gate. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| One review entry point exists. | `ah-route-review/SKILL.md` exists. |
| Existing review skills are mapped. | Router table covers current review skills. |
| Review output is normalized. | Router defines findings-first report contract. |
| Fixtures prove routing. | Review route fixtures cover Shotloom, web UX, spec, and agent-hub implementation. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Mixed review order | Code before docs, then UX/spec when relevant. |
| Router name | `ah-route-review`. |
