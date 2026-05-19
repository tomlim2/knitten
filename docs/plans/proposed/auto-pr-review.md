---
status: proposed
created: 2026-05-19
updated: 2026-05-19
owner: agent-hub
milestone: worktree-first-workflow
---

# Auto PR Review

## Spec Contract

- Milestone basis: `docs/milestones/worktree-first-workflow.md` names automatic
  LLM PR review as the follow-up after worktree-first lands.
- Current truth: Knitten has PR validation, a review-evidence template, and
  explicit approval gates for PR creation, PR comments, and PR merge.
- Required change: define a safe automation contract that runs an objective LLM
  review after PR creation or branch update without approving, merging, or
  mutating PR state.
- Locked boundary: no self-approval, no automatic merge, no automatic PR-visible
  comment unless a later accepted spec and the approval gate allow it.
- Proof method: add a deterministic local reviewer command first, then gate any
  GitHub-visible output behind explicit approval or a later workflow spec.

## Current State

| Surface | Path | State | Evidence |
|---|---|---|---|
| PR validation | `.github/workflows/validate.yml` | Done | Runs whitespace diff and `node scripts/validate-llm-first.mjs` on PRs and `main`. |
| PR template | `.github/pull_request_template.md` | Done | Captures validation, review evidence, and cleanup prompts. |
| PR creation gate | `agent/rules/pr-create.md` | Done | Requires local gates, pushed branch, `--body-file`, and body read-back verification. |
| PR mutation gate | `agent/rules/pr-mutate.md` | Done | Requires explicit per-PR approval for open, close, merge, reopen, and force-push. |
| PR comment gate | `agent/rules/pr-comment.md` | Done | Requires full draft plus explicit approval before posting comments or reviews. |
| Solo PR flow | `docs/plans/active/solo-pr-review-flow.md` | Partial | Defines manual objective review evidence, not automatic review execution. |
| Milestone slot | `docs/milestones/worktree-first-workflow.md` | Partial | Lists `auto-pr-review` as proposed/future with no executable spec. |

## Problem

Knitten PRs have validation and a place to record review evidence, but the
review itself depends on the author remembering to run and paste a review. That
creates inconsistent PR evidence in a solo-maintainer workflow. The repo needs a
repeatable LLM review step that can be triggered after a PR opens or updates,
while preserving the rule that PR-visible comments and state changes require
explicit approval.

## Requirements

1. Add an `auto-pr-review` workflow contract that runs after PR creation or PR
   branch updates.
2. The first implementation must be local and deterministic: a script or skill
   reads the PR diff, PR body, and validation status, then writes a review
   report artifact.
3. The local report must classify findings by severity and distinguish
   `no requested changes`, `changes requested`, and `blocked`.
4. The local report must not call `gh pr review`, `gh pr comment`, or equivalent
   GitHub-visible APIs without the `pr-comment.md` approval gate.
5. The local report must not call `gh pr merge`, approve a PR, request changes,
   close a PR, reopen a PR, or update PR state.
6. The review must use the current PR diff and record the observed head SHA.
7. The review must include validation status and treat failing or pending
   required checks as `blocked`.
8. The PR template or PR creation flow must point authors to the generated
   review report path or approved review comment.
9. A later GitHub Actions implementation must use read-only repository
   permissions unless a later accepted spec explicitly allows comment posting.
10. The implementation must be reusable by worktree-first repos beyond Knitten
    without embedding user-specific paths.

## Risk Map

| Risk | Applies | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Unauthorized PR mutation | yes | Existing rules require explicit approval for PR comments and state changes. | Make the first implementation report-only and forbid PR-visible posting by default. | Dry-run test shows no `gh pr comment`, `gh pr review`, or mutation command is executed. |
| Stale review input | yes | PR branches can change after local validation or after review starts. | Fetch PR metadata and diff at review start and record observed `headRefOid`. | Fixture or live run proves rerun updates the recorded SHA. |
| Weak review evidence | yes | Current template accepts freeform notes. | Require severity, result, observed checks, changed files, and finding list. | Snapshot report contains all required sections. |
| CI/comment permission leak | yes | GitHub Actions write tokens can post comments. | Keep initial automation local; future Actions writer requires a separate accepted spec and minimal permissions. | Workflow has `contents: read` only unless a later spec changes it. |
| Scope creep into merge bot | yes | Milestone says automatic review, not automatic merge. | Lock non-goals against merge, approval, branch deletion, and thread resolution. | Search confirms no merge or approve commands in implementation. |

## Locked Decisions

1. **Report-only first.**
   Rationale: PR comment and review posting require explicit approval, and a
   local report still improves consistency.
   Rejected alternatives: auto-post a top-level comment on every PR; auto-submit
   a `COMMENT` review; auto-request changes.

2. **Observed head SHA is part of the review contract.**
   Rationale: a review without the observed commit cannot prove which diff it
   examined.
   Rejected alternatives: rely on branch name only; rely on local `HEAD`.

3. **Failing or pending checks block the review result.**
   Rationale: the review should not report `no requested changes` while required
   validation is red or pending.
   Rejected alternatives: separate CI status from review result; let the PR
   template carry check status manually.

4. **GitHub-visible output is a second phase.**
   Rationale: posting comments needs draft approval and can create noise on
   small PRs.
   Rejected alternatives: require every review to become a PR comment; add a
   comment bot before local report quality is proven.

## Non-Goals

- No automatic PR approval.
- No automatic merge.
- No automatic branch deletion or worktree cleanup.
- No branch protection configuration.
- No paid external review service dependency.
- No Shotloom-specific review responder behavior.

## Implementation Spec

S0. Baseline check.

- Re-read `agent/rules/pr-create.md`, `agent/rules/pr-comment.md`, and
  `agent/rules/pr-mutate.md`.
- Inspect `.github/workflows/validate.yml`,
  `.github/pull_request_template.md`, and recent open PR metadata.
- Requirements: 4, 5, 9.
- Verification: PR body records the rule surfaces used.

S1. Add local review command.

- Add a script or skill entry that accepts a PR number or current branch.
- Fetch PR metadata with number, title, body, head ref, head SHA, base ref,
  mergeable state, and status checks.
- Fetch the PR diff from GitHub or compare `origin/<base>...<head>`.
- Requirements: 1, 2, 6, 10.
- Verification: run it against a real open PR and a dry-run fixture path.

S2. Produce report artifact.

- Write the review report under a deterministic path such as
  `docs/plans/reports/auto-pr-review/pr-<number>-<head-sha>.md`, or an ignored
  runtime path if reports should not be committed.
- Include observed SHA, changed files, validation status, result, findings, and
  suggested PR template text.
- Requirements: 2, 3, 7, 8.
- Verification: report contains all required sections and marks failing or
  pending checks as `blocked`.

S3. Wire PR-template guidance.

- Add a short note that review evidence can point to a local auto-review report
  or to an approved PR review/comment.
- Keep the template lightweight and avoid requiring a bot.
- Requirements: 8.
- Verification: PR template still passes LLM-first validation.

S4. Add guard tests.

- Add tests or deterministic shell checks that verify report-only mode does not
  execute PR comments, reviews, approvals, merges, or branch deletion.
- Requirements: 4, 5.
- Verification: command log or mocked runner contains only read operations plus
  local report write.

S5. Future Actions design, separate PR.

- If local report quality is accepted, define a second spec for GitHub Actions
  integration.
- That spec must choose between artifact upload, check summary, or approved
  comment posting and state exact permissions.
- Requirements: 9.
- Verification: no Actions writer token appears in the first implementation.

## Acceptance Criteria

- [ ] `auto-pr-review` has an accepted implementation spec.
- [ ] A local command or skill can review a PR by number or current branch.
- [ ] The review records PR number, title, base, head ref, head SHA, observed
      checks, changed files, result, and findings.
- [ ] Failing or pending required checks produce `blocked`.
- [ ] `no requested changes` is possible only when checks pass and findings are
      empty or non-blocking.
- [ ] The command does not post GitHub comments or reviews without explicit
      approval.
- [ ] The command does not approve, request changes, merge, close, reopen,
      update branch, or delete branches.
- [ ] PR template or workflow docs point to the review evidence report.
- [ ] `git diff --check` passes.
- [ ] `node scripts/validate-llm-first.mjs` passes.

## Verification

```bash
git diff --check
node scripts/validate-llm-first.mjs
rg -n "gh pr (merge|review|comment|close|reopen|update-branch)|--delete-branch" <implementation-files>
```

Manual proof:

1. Create or use an open PR.
2. Run the local auto-review command against the PR.
3. Confirm no GitHub-visible comment or review appears.
4. Confirm the report names the observed head SHA and check status.
5. Force-push or update the PR branch, rerun, and confirm a new observed SHA.

## Follow-Up Candidates

- GitHub Actions artifact upload for auto-review reports.
- Optional approved PR comment posting from a generated report.
- Cross-repo adapter for Shotloom-style review flows.
- Reviewer model/profile selection by artifact type or changed file domain.
