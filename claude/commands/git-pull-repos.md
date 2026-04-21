---
description: Pull all local git repos registered in repo-paths.json
allowed-tools: Read, Bash(git -C:*), Bash(test:*), Bash(ls:*)
---

# Git Pull Repos

Pull all git repositories registered in `~/.claude/private/caol-config/repo-paths.json` that exist on this machine.

## Execution

1. Read `~/.claude/private/caol-config/repo-paths.json`
2. For each entry, resolve the path (handle both `{ "path": "..." }` and plain string formats)
3. Filter: path exists on disk AND has a `.git/` directory
4. Run `git -C <path> pull` in parallel for all matching repos
5. Show a compact results table — **token-saving rule**: only `error` / `skipped` rows get explanatory detail. `ok` rows show a one-word summary (`up-to-date` or `updated`), never diff stats, file lists, or commit ranges.

```
## Pull Results

| Repo           | Status   | Details                                     |
|----------------|----------|---------------------------------------------|
| anju           | ok       | up-to-date                                  |
| caol-ila       | ok       | updated                                     |
| ta-portfolio   | error    | no tracking for branch `try/tegaki-hero`    |
| shotloom       | error    | branch `refactor/x` gone on remote          |
| codex-base     | skipped  | path not found                              |
```

Statuses:
- `ok` — pull succeeded. Details = `up-to-date` (no changes) or `updated` (fast-forward/merge). Do NOT paste git's diff stat output.
- `error` — pull failed. Details = short human-readable reason (e.g. "no tracking for branch", "remote branch gone", "merge conflict"). Include the branch name when relevant.
- `skipped` — path missing or no `.git/`.

After the table, only if there are `error` rows, add a short "Next steps" block suggesting fixes per failing repo (set upstream, delete stale branch, resolve conflict, etc.). Do not narrate successes.
