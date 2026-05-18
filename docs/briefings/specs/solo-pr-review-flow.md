---
status: intake
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
spec: docs/plans/active/solo-pr-review-flow.md
---

# Spec Intake: solo-pr-review-flow

## User Request

Create a spec, review it, implement the flow, review the implementation, and
open a PR for a solo repository PR review process where approval is replaced by
checks plus an objective review comment.

## Goal

Document and automate a solo PR workflow that keeps PRs reviewable without
requiring impossible self-approval.

## Route

- selected route: agent-hub policy and workflow documentation via
  `ah-manage-spec`
- candidate routes: direct `.github` workflow edit; PR template-only update
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `.github/pull_request_template.md` | Existing PR author prompt |
| directory | `.github/` | GitHub workflow and template location |
| file | `scripts/validate-llm-first.mjs` | Existing repo validator for CI |
| file | `agent/rules/pr-create.md` | Existing PR creation rule expectations |
| file | `agent/rules/git-defaults.md` | Push and identity conventions |
| user | current chat | Decision that self-approval is not available and checks should carry the gate |

## Known Decisions

- Do not depend on self-approval for solo PRs.
- Keep PR review evidence as a review comment or PR comment when GitHub blocks
  self-approval.
- Add GitHub Actions checks for existing repo validation commands.
- In CI, run whitespace validation against committed changes because a plain
  `git diff --check` on a clean checkout is not meaningful.
- Keep the PR template lightweight and usable for non-CI changes.

## Open Questions

- None. Branch protection setup remains outside repository files.

## Exclusions

- Do not change GitHub repository settings or branch protection remotely.
- Do not add third-party review services or paid GitHub integrations.
- Do not replace human approvals for repositories that explicitly require them.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- GitHub Actions workflow syntax is static YAML and uses existing commands.
