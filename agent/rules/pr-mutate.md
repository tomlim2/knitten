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

Repo-specific skills may relax commit or push approval after repo guidance and skill-local gates pass. Generic PR mutation rules win unless a loaded skill explicitly carves out the operation.
