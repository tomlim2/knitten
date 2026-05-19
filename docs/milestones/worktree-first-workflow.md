---
status: active
created: 2026-05-18
updated: 2026-05-19
owner: agent-hub
target-date:
---

# Worktree First Workflow

## Purpose

Make write-capable agent work isolated, reviewable, and cleanly removable after
the task is finished.

## Scope

| Area | In Scope |
|------|----------|
| Worktree-first policy | Opt-in repo config, starter, guard, status, hook install, and cleanup. |
| Lightweight branch lane | Allow small docs-only or CI/CD-only changes on a primary-checkout feature branch without using a task worktree. |
| Solo PR flow | Commit and push in worktrees, then suggest a PR with checks plus objective review evidence instead of self-approval. |
| Future PR review automation | Record the follow-up to let an LLM review PRs after creation. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [knitten-worktree-first.md](../plans/active/knitten-worktree-first.md) | active | Define and implement worktree-first repo isolation. |
| [solo-pr-review-flow.md](../plans/active/solo-pr-review-flow.md) | active | Define solo PR review evidence and check-based merge flow. |
| [auto-pr-review.md](../plans/proposed/auto-pr-review.md) | proposed | Define safe automatic LLM PR review evidence after PR creation or update. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| PR template | done | `.github/pull_request_template.md` has review evidence fields. |
| Validation workflow | done | `.github/workflows/validate.yml` runs repository validation. |
| Worktree-first implementation | done | PR #3 landed starter, guard, status, installer, cleanup, and policy validation. |
| Lightweight branch exception | done | `agent/rules/git-defaults.md` documents the allowed scope and `scripts/worktree-guard.mjs` allows primary-checkout feature branches when configured. |
| PR after push suggestion | done | `agent/rules/git-defaults.md` tells agents to suggest a PR after committing and pushing from a worktree-first repo. |
| Automatic LLM PR review | proposed | `docs/plans/proposed/auto-pr-review.md` defines report-only review automation before any PR-visible posting. |

## Acceptance Criteria

1. Enabled repos start write-capable work in task worktrees.
2. Main checkout `main` branch commit and push are locally guarded.
3. Worktree-first write tasks suggest a PR after commit and push, and create
   it only when the user asks for PR or merge publication.
4. Created PRs have objective review evidence when self-approval is impossible.
5. Completed task worktrees can be listed and removed explicitly after merge.
6. Automatic LLM PR review has a recorded follow-up spec slot.
7. Lightweight docs-only or CI/CD-only work can use a primary-checkout feature
   branch when the repo config explicitly enables that lane.

## Open Decisions

| Decision | Default |
|----------|---------|
| Automatic LLM reviewer implementation | Separate future spec after worktree-first is merged. |
| Lightweight branch lane | Allowed only for small docs-only or CI/CD-only changes; code, validator, routing, schema, migration, and multi-boundary work still uses a task worktree. |

## Blockers

None.

## External Mirrors

GitHub PRs are mirrors for implementation review. Markdown remains the milestone
canonical owner.
