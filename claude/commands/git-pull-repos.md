---
description: Pull latest from anju, caol-ila, and ta-portfolio repos
allowed-tools: Bash(git pull:*), Bash(git -C:*)
---

# Git Pull Repos

Pull anju, caol-ila, and ta-portfolio repositories.
## Execution

Read `~/.claude/private/repo-paths.json` for paths, then pull all repos in parallel:

```bash
git -C "<anju-path>" pull
git -C "<caol-ila-path>" pull
git -C "<ta-portfolio-path>" pull
```

Show results for each repo.
