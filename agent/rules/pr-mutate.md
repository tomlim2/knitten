---
load: triggered
trigger: about to mutate PR state via gh (open, close, reopen, merge, force-push to PR branch)
---

PR mutating actions require explicit per-PR user approval. Each action is its own decision; prior approval does not carry over.

| Action | Requires approval | Notes |
|--------|-------------------|-------|
| Open PR (draft or ready) | Yes | Draft status does not exempt creation |
| Close PR | Yes | "Close and reopen later" still needs per-close approval |
| Reopen PR | Yes | Prior intent to reopen ≠ current approval to reopen |
| Merge PR | Yes | Squash, rebase, merge — all need per-merge approval |
| Force-push to branch with open PR | Yes | Invalidates review threads; may trigger reopen |
| `gh pr view` / `gh pr list` / web URL | No | Reading is not acting |

Repo-specific overrides may relax these (e.g. shotloom worktrees auto-allow `git push` after gates pass — see `~/.claude/rules/shotloom.md`). Generic rule wins unless the repo-specific rule explicitly carves out the operation.
