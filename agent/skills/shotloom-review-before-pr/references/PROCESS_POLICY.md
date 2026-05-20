---
status: accepted
---

# Pre-PR Process Policy

Operational policy for `shotloom-review-before-pr`.

## Phase Boundary

| Phase | Owns | Does not own |
|---|---|---|
| Single code | Small, low-risk code review with the `shotloom-review-code` checklist. | Triad roles, exhaustive boundary mirror checks. |
| Triad | Broad defect discovery for large or risky diffs across runtime/contract, QA, and maintainer/product roles. | Sequential boundary batch execution or final prose polish. |
| Large boundary | Cross-surface contract, state, runtime, fixture, and contract-doc consistency when multiple boundary surfaces changed. | General code review, broad docs review, PR merge readiness. |
| Docs | Final changed prose/comment/rustdoc and handoff evidence after code and boundary fixes settle. | Re-reviewing code behavior already owned by Single/Triad/Large boundary. |
| Make-PR | Local gates, PR title/body, and explicit PR creation approval. | Pre-PR defect discovery. |

## Phase Order

Run phases in this order:

1. Selected main review: Single code or Triad.
2. Large-boundary batches only when triggered.
3. Targeted docs pass.
4. `shotloom-make-pr`, unless `review only` / `no make-pr` is active.

Each phase starts with pass A. Run verification passes B, C, ... only when fixes
changed `HEAD` and P0-P2 findings remain. Do not loop only for P3/nit findings.

## Finding Handling

| Finding | Action |
|---|---|
| P0-P2, in scope | Fix without asking, then verify if `HEAD` changed. |
| P0-P2, ambiguous | Ask one focused question before editing. |
| P0-P2, out of scope | Ask whether to accept risk or split follow-up. |
| P0-P2, product/design decision | Ask before editing. |
| P3/nit | Fix or accept once; do not cycle only for nits. |

## Handoff

If any P0-P2 finding remains unaccepted, stop and report blockers. Do not invoke
`shotloom-make-pr`.

If all fired phases are clean or nit-only:

- If `review only` / `no make-pr` is active, stop after the final review report.
- Else invoke `shotloom-make-pr` in the same worktree.

`shotloom-make-pr` owns local CI-equivalent gates, PR title/body drafting, and
explicit approval before `gh pr create`.

## Binding Rules

- Always print the Review Mode Decision before launching review agents.
- Always run one selected main review before docs.
- In Single mode, run code pass A only.
- In Triad mode, run triad pass A only; never run code pass A in the same chain.
- Always use read-only Explore subagents.
- Never run verification unless the matching phase changed `HEAD`.
- Label every follow-up pass as independent verification.
- Do not push, create PRs, or post PR comments inside this review skill.
