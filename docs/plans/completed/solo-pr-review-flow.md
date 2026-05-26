---
status: completed
created: 2026-05-18
updated: 2026-05-26
owner: agent-hub
milestone: worktree-first-workflow
---

# Solo PR Review Flow

## Purpose

Define a lightweight solo-maintainer pull request workflow for Knitten where
objective review evidence and automated checks replace impossible self-approval.

## Original Problem

GitHub does not allow the PR author to approve their own pull request. For a
solo repository, requiring an approving review can block valid work even when
the author has already performed an objective review and all repo checks pass.

Before this spec landed, the repo had a pull request template but did not
explain the solo review rule or run validation automatically on pull requests.

## Goals

- Record the solo PR review rule in repo documentation.
- Update the PR template so authors capture review evidence without implying
  that self-approval is possible.
- Add GitHub Actions checks for the repo's existing validation commands.
- Keep the process light enough for small documentation changes.

## Non-Goals

- Do not configure branch protection or required checks through GitHub settings.
- Do not require Copilot, external bots, or paid services.
- Do not change PR rules for repositories that require independent human review.
- Do not merge or archive unrelated active specs.

## Completion Evidence

| Requirement | Evidence |
|-------------|----------|
| Durable workflow reference | `docs/workflows/solo-pr-review-flow.md` explains the solo-maintainer review rule and comment fallback. |
| PR template review evidence | `.github/pull_request_template.md` has a `Review Evidence` section with result and notes fields. |
| Repository validation workflow | `.github/workflows/validate.yml` runs whitespace checks and `node scripts/validate-llm-first.mjs` on PRs and `main`. |
| Local validation | `node scripts/validate-llm-first.mjs` passes. |
| Implementation review | Completed implementation was reviewed against this spec before moving it to `completed/`. |

## Final Design

`docs/workflows/solo-pr-review-flow.md` is the durable workflow reference.
The workflow states:

1. Create a PR for non-trivial changes.
2. Run local validation before pushing.
3. Perform an objective review of the PR diff.
4. If GitHub blocks self-approval, leave a PR review-result comment instead.
5. Merge when required automated checks pass and the review result is
   `no requested changes`.

`.github/pull_request_template.md` includes a short review evidence section.
The section should ask for the review result and link or describe the review
comment. It must not require impossible self-approval.

`.github/workflows/validate.yml` has PR and main-branch triggers:

- whitespace diff check against the PR base, or the pushed commit range on
  `main`
- `node scripts/validate-llm-first.mjs`

Use `actions/checkout` and `actions/setup-node` only. Do not install packages.

## Completion Record

1. Created this spec and intake.
2. Added the workflow documentation.
3. Updated the pull request template.
4. Added the GitHub Actions validation workflow.
5. Ran local validation and implementation review.
6. Moved this spec from `docs/plans/active/` to `docs/plans/completed/`.

## Validation Commands

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Inspect `.github/workflows/validate.yml` for valid trigger and step syntax.
- Confirm the CI whitespace check compares committed changes rather than only a
  clean checkout working tree.
- Confirm PR template language distinguishes review evidence from GitHub
  approval.

## Residual Risks

- If branch protection later requires approving reviews, this flow alone is not
  enough; repository settings must require status checks rather than
  self-approval.
- A too-heavy template could slow small doc updates, so the new section should
  stay short and allow `N/A`.
- GitHub Actions availability cannot be fully proven locally; local validation
  can only prove the commands themselves work.

## Acceptance Criteria

- [x] A durable workflow document explains the solo PR review flow.
- [x] The PR template includes a review evidence prompt that does not ask for
  self-approval.
- [x] GitHub Actions runs repo validation commands on PRs and `main`.
- [x] Local validation passes.
- [x] An implementation review finds no required changes before PR creation.

## Open Decisions

- None.
