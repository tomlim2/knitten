---
description: Pull latest from anju and caol-ila repos
allowed-tools: Bash(git pull:*), Bash(git -C:*)
---

# Git Pull Repos

Pull both anju and caol-ila repositories.
## Execution

Read `~/.claude/private/repo-paths.json` for paths, then pull both repos in parallel:

```bash
git -C "<anju-path>" pull
git -C "<caol-ila-path>" pull
```

Show results for each repo.
