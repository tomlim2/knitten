---
status: active
created: 2026-05-18
updated: 2026-05-18
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
| Solo PR flow | Checks plus objective review evidence instead of self-approval. |
| Future PR review automation | Record the follow-up to let an LLM review PRs after creation. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [knitten-worktree-first.md](../plans/active/knitten-worktree-first.md) | active | Define and implement worktree-first repo isolation. |
| [solo-pr-review-flow.md](../plans/active/solo-pr-review-flow.md) | active | Define solo PR review evidence and check-based merge flow. |
| `auto-pr-review` | proposed | Future spec: automatically run an LLM review comment when a PR opens or updates. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| PR template | done | `.github/pull_request_template.md` has review evidence fields. |
| Validation workflow | done | `.github/workflows/validate.yml` runs repository validation. |
| Worktree-first implementation | in review | PR #3 contains starter, guard, status, installer, cleanup, and policy validation. |
| Automatic LLM PR review | future | Needs a separate spec after worktree-first lands. |

## Acceptance Criteria

1. Enabled repos start write-capable work in task worktrees.
2. Main checkout commit and push are locally guarded.
3. PRs have objective review evidence when self-approval is impossible.
4. Completed task worktrees can be listed and removed explicitly after merge.
5. Automatic LLM PR review has a recorded follow-up spec slot.

## Open Decisions

| Decision | Default |
|----------|---------|
| Automatic LLM reviewer implementation | Separate future spec after worktree-first is merged. |

## Blockers

None.

## External Mirrors

GitHub PRs are mirrors for implementation review. Markdown remains the milestone
source of truth.
