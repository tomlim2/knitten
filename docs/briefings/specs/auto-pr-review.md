---
status: intake
created: 2026-05-19
updated: 2026-05-19
owner: agent-hub
spec: docs/plans/proposed/auto-pr-review.md
---

# Spec Intake: auto-pr-review

## User Request

Start the next milestone task.

## Goal

Define the next `worktree-first-workflow` task: automatic LLM PR review evidence
after PR creation or PR branch update, without weakening existing approval
gates for PR comments, review state, or merges.

## Route

- selected route: agent-hub policy/spec authoring through `ah-manage-spec`
- candidate routes: PR workflow docs, GitHub Actions automation, review routing
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/milestones/worktree-first-workflow.md` | Owns the next task slot for automatic LLM PR review. |
| file | `docs/plans/active/solo-pr-review-flow.md` | Defines current manual objective review evidence. |
| file | `.github/workflows/validate.yml` | Current automated PR validation surface. |
| file | `.github/pull_request_template.md` | Current review evidence capture surface. |
| rule | `agent/rules/pr-create.md` | PR creation approval and body transport gate. |
| rule | `agent/rules/pr-comment.md` | PR-visible comment/review approval gate. |
| rule | `agent/rules/pr-mutate.md` | PR state mutation approval gate. |
| command | `gh pr list --state merged --limit 20` | Confirms worktree-first and solo PR flow PRs have landed. |

## Known Decisions

- First automation phase is report-only.
- GitHub-visible comments or reviews remain approval-gated.
- Automatic merge, approval, request-changes, branch deletion, and worktree
  cleanup are out of scope.
- Review reports must record the observed PR head SHA.

## Open Questions

- Should the first report artifact be committed under `docs/plans/reports/` or
  written to an ignored runtime path?
- Should a later GitHub Actions phase upload reports as artifacts, write check
  summaries, or request approval before comment posting?

## Exclusions

- No GitHub App or paid bot dependency.
- No branch protection settings.
- No Shotloom-specific review response loop.
- No PR-visible posting in the first implementation.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Search implementation files for forbidden PR mutation commands.
