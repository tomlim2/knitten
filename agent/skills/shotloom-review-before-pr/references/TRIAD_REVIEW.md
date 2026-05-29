---
status: accepted
---

# Triad Review

Use this reference from `shotloom-review-before-pr` when Step 2 selects Triad
mode. All three roles use the same Shared Checklist and the same priority
taxonomy. Role lenses change the failure modes to inspect; they do not change
the checklist.

Triad is the main review pass for large or risky diffs. Do not run
`shotloom-review-code` code pass A before Triad in the same router chain.

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
| Evidence clarity | Are contract impact, tests, and accepted follow-ups source-cited? |

## Role Lenses

| Role | Inspect harder |
|---|---|
| Runtime/Contract Engineer | Bridge DTOs, commands, events, serde/default semantics, saved-data compatibility, event order, runtime/editor observation order, rollback paths |
| QA/Test Automation Engineer | Missing negative tests, weak assertions, fixture rationale, no-mutation checks, fallback branches, flake risk, command rejection matrix |
| Maintainer/Product Engineer | Reviewable scope, debug UX, operational support cost, naming, helper ownership, evidence clarity, follow-up boundaries |

## Role Subagent Prompt

```text
Read `<skill-dir>/references/TRIAD_REVIEW.md`.
Read the caller-provided Review Brief and matching role slice.
Review current `HEAD` as Role: <role>.
Use the Shared Checklist as the role lens.
Use `git diff origin/main...HEAD` as the reviewed diff.
Treat the Review Brief as a navigation index, not as finding evidence.
Report only P0-P3 findings grounded in changed or directly adjacent surfaces.
Mark P0-P2 as `blocker=true`; mark P3/nit as `blocker=false`.
Render the Role Report Template from the reference.
Review is read-only.
```

## Role Report Template

```markdown
## Triad role review - <role> - branch <branch>

### Applicability
- Shared checklist: correctness, regression risk, test coverage, data/state consistency, error handling, API/contract consistency, security/safety, performance, maintainability, scope control, evidence clarity
- Role lens: <role lens>
- Files checked: <list>
- Context checked: <directly related specs/docs/contracts/issues, or none>

### Findings
- <priority> <path>:<line> - <defect> - <source rule/guideline/check>
- OR none

### Role-specific Notes
- <false-positive, coverage note, or needs-design-judgment item>
```

## Merge Rules

- Merge duplicate findings by the same behavior and evidence location.
- Preserve every distinct root cause even when the same file appears twice.
- Keep the highest priority across role reports.
- If roles disagree about whether a behavior is a defect, mark
  `needs-design-judgment` and list both role names.
- Report P0/P1/P2 priorities as `blocker=true`; report P3 as
  `blocker=false`.
