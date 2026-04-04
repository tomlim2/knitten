---
description: Pull all local git repos registered in repo-paths.json
allowed-tools: Read, Bash(git -C:*), Bash(test:*), Bash(ls:*)
---

# Git Pull Repos

Pull all git repositories registered in `~/.claude/private/repo-paths.json` that exist on this machine.

## Execution

1. Read `~/.claude/private/repo-paths.json`
2. For each entry, resolve the path (handle both `{ "path": "..." }` and plain string formats)
3. Filter: path exists on disk AND has a `.git/` directory
4. Run `git -C <path> pull` in parallel for all matching repos
5. Show results table:

```
## Pull Results

| Repo           | Status   | Details          |
|----------------|----------|------------------|
| anju           | ok       | Already up to date |
| caol-ila       | ok       | 3 files changed  |
| mmd-anju       | skipped  | path not found   |
| obsidian       | skipped  | not a git repo   |
```

Statuses: `ok` (pull succeeded), `error` (pull failed — show error), `skipped` (path missing or no `.git/`)
