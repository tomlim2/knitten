---
load: triggered
trigger: committing or pushing from the primary main checkout in a worktree-first repo
---

# Main Chore Lane

Use the primary `main` checkout only for a narrow safe chore lane.

Knitten lane requirements:

| Field | Rule |
|-------|------|
| file count | `<= 8` changed files |
| path scope | `.gitignore`, `.github/**`, `agent/rules/**`, `docs/briefings/specs/knitten-worktree-first.md`, `docs/milestones/worktree-first-workflow.md`, `docs/plans/completed/knitten-worktree-first.md`, `scripts/git-hooks/**`, `scripts/worktree-guard.mjs` |
| commit subject | starts with `chore:` |
| push history | every commit in `origin/main..HEAD` starts with `chore:` |

Do not use the lane for code implementation, validators, schema changes,
routing changes, migrations, or multi-boundary work.
