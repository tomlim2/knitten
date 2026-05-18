---
status: active
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
milestone: worktree-first-workflow
---

# Solo PR Review Flow

## Purpose

Define a lightweight solo-maintainer pull request workflow for Knitten where
objective review evidence and automated checks replace impossible self-approval.

## Problem

GitHub does not allow the PR author to approve their own pull request. For a
solo repository, requiring an approving review can block valid work even when
the author has already performed an objective review and all repo checks pass.

The repo now has a pull request template, but it does not yet explain the solo
review rule or run the validation commands automatically on pull requests.

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

## Current State

- `.github/pull_request_template.md` exists with summary, scope, validation, and
  risk cleanup prompts.
- No GitHub Actions workflows exist under `.github/workflows/`.
- The repo has `scripts/validate-llm-first.mjs` and no package manager manifest,
  so CI can use Node directly without dependency installation.
- PR creation rules already require local validation and clean branch state
  before `gh pr create`.

## Proposed Design

Add `docs/workflows/solo-pr-review-flow.md` as the durable workflow reference.
The workflow states:

1. Create a PR for non-trivial changes.
2. Run local validation before pushing.
3. Perform an objective review of the PR diff.
4. If GitHub blocks self-approval, leave a PR review-result comment instead.
5. Merge when required automated checks pass and the review result is
   `no requested changes`.

Update `.github/pull_request_template.md` with a short review evidence section.
The section should ask for the review result and link or describe the review
comment. It must not require impossible self-approval.

Add `.github/workflows/validate.yml` with PR and main-branch triggers:

- whitespace diff check against the PR base, or the pushed commit range on
  `main`
- `node scripts/validate-llm-first.mjs`

Use `actions/checkout` and `actions/setup-node` only. Do not install packages.

## Execution Plan

1. Create this spec and intake.
2. Review the spec for scope, validation, and cold-start clarity.
3. Add the workflow documentation.
4. Update the pull request template.
5. Add the GitHub Actions validation workflow.
6. Run local validation.
7. Review the implementation diff against this spec.
8. Commit, push, and open a PR.

## Validation

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Inspect `.github/workflows/validate.yml` for valid trigger and step syntax.
- Confirm the CI whitespace check compares committed changes rather than only a
  clean checkout working tree.
- Confirm PR template language distinguishes review evidence from GitHub
  approval.

## Risks

- If branch protection later requires approving reviews, this flow alone is not
  enough; repository settings must require status checks rather than
  self-approval.
- A too-heavy template could slow small doc updates, so the new section should
  stay short and allow `N/A`.
- GitHub Actions availability cannot be fully proven locally; local validation
  can only prove the commands themselves work.

## Acceptance Criteria

- A durable workflow document explains the solo PR review flow.
- The PR template includes a review evidence prompt that does not ask for
  self-approval.
- GitHub Actions runs repo validation commands on PRs and `main`.
- Local validation passes.
- An implementation review finds no required changes before PR creation.

## Open Decisions

- None.
