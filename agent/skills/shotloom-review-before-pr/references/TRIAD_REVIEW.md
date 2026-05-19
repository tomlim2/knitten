---
status: accepted
---

# Triad Review

Use this reference from `shotloom-review-before-pr` when Step 2 selects Triad
mode. All three roles use the same Shared Checklist and the same priority
taxonomy. Role lenses change the failure modes to inspect; they do not change
the checklist.

## Shared Checklist

| Check | Required question |
|---|---|
| Correctness | Does the changed behavior satisfy the issue and reject invalid state intentionally? |
| Regression risk | Can existing projects, fixtures, saved data, or runtime/editor flows break? |
| Test coverage | Does a test fail for the real bug and cover success, failure, and fallback paths? |
| Data/state consistency | Can partial mutation, stale mirrors, duplicate references, or missing cleanup remain? |
| Error handling | Are diagnostics, rejection codes, messages, and related IDs accurate and actionable? |
| API/contract consistency | Do Rust, TypeScript, fixtures, docs, and schemas agree on shape and optionality? |
| Security/safety | Can input validation, filesystem access, races, panics, or unsafe state access fail open? |
| Performance | Does the diff add hot-path allocation, serialization, IO, locks, or frame-budget risk? |
| Maintainability | Does the diff add speculative public surface, drift-prone duplication, or unclear ownership? |
| Scope control | Does the PR stay inside the issue boundary and leave unrelated refactors out? |
| Docs/handoff | Can the PR body, comments, and durable docs explain the changed contract and tests? |

## Role Lenses

| Role | Inspect harder |
|---|---|
| Runtime/Contract Engineer | Bridge DTOs, commands, events, serde/default semantics, saved-data compatibility, event order, runtime/editor observation order, rollback paths |
| QA/Test Automation Engineer | Missing negative tests, weak assertions, fixture rationale, no-mutation checks, fallback branches, flake risk, command rejection matrix |
| Maintainer/Product Engineer | Reviewable scope, debug UX, operational support cost, naming, helper ownership, docs and PR evidence, follow-up boundaries |

## Role Subagent Prompt

```text
Read `<skill-dir>/references/TRIAD_REVIEW.md`.
Review current `HEAD` as Role: <role>.
Use the Shared Checklist exactly; do not add private checklist categories.
Use `git diff origin/main...HEAD` as the reviewed diff.
Report only P0-P3 findings grounded in changed or directly adjacent surfaces.
Render the Role Report Template from the reference.
Do not edit files, stage, commit, push, post comments, or change Linear.
```

## Role Report Template

```markdown
## Triad role review - <role> - branch <branch>

### Applicability
- Shared checklist: correctness, regression risk, test coverage, data/state consistency, error handling, API/contract consistency, security/safety, performance, maintainability, scope control, docs/handoff
- Role lens: <role lens>
- Files checked: <list>
- Context checked: <directly related specs/docs/contracts/issues or N/A>

### Checklist Verdicts
| Check | Verdict | Evidence |
|---|---|---|
| Correctness | clean/P0/P1/P2/P3 | <path:line or reason> |
| Regression risk | clean/P0/P1/P2/P3 | <path:line or reason> |
| Test coverage | clean/P0/P1/P2/P3 | <path:line or reason> |
| Data/state consistency | clean/P0/P1/P2/P3 | <path:line or reason> |
| Error handling | clean/P0/P1/P2/P3 | <path:line or reason> |
| API/contract consistency | clean/P0/P1/P2/P3 | <path:line or reason> |
| Security/safety | clean/P0/P1/P2/P3 | <path:line or reason> |
| Performance | clean/P0/P1/P2/P3 | <path:line or reason> |
| Maintainability | clean/P0/P1/P2/P3 | <path:line or reason> |
| Scope control | clean/P0/P1/P2/P3 | <path:line or reason> |
| Docs/handoff | clean/P0/P1/P2/P3 | <path:line or reason> |

### Findings
- clean
- OR `<priority>` `<path>:<line>` - <defect> - <source rule/guideline/check>

### Role-specific Notes
- <important clean evidence, false-positive, or needs-design-judgment item>

### Recommendation
- clean / nit-only / P0-P2 remains
```

## Merge Rules

- Merge duplicate findings by the same behavior and evidence location.
- Preserve every distinct root cause even when the same file appears twice.
- Keep the highest priority across role reports.
- If roles disagree about whether a behavior is a defect, mark
  `needs-design-judgment` and list both role names.
- Treat P0-P2 as blocking until fixed or explicitly accepted for the PR body.
- Treat P3/nit as optional once; do not loop only for nits.

## Verification Pass

Use this preamble for triad pass B or later:

```text
This is an independent Triad verification pass after fixes changed HEAD.
Use the Shared Checklist for current HEAD. Confirm prior P0-P2 findings are
fixed, inspect regressions introduced by fixes, and report unresolved defects
visible in the current diff. Review from a different angle than the previous
role report. Do not rely on earlier conclusions; check direct evidence.
```
