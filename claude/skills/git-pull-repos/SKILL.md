---
description: Pull all local git repos registered in repo-paths.json
allowed-tools: Bash(bash:*)
---

# Git Pull Repos

Pull every git repository registered in `~/.claude/private/caol-config/repo-paths.json` that exists on this machine.

## Execution

Run the helper script. It handles ssh detection, JSON parsing, parallel pulls, and outputs one line per repo.

```bash
!bash ~/.claude/skills/git-pull-repos/pull.sh
```

Each output line is `name|status|details` where:
- `status = ok` → details = `up-to-date` or `updated`
- `status = error` → details = short reason (first error/fatal/conflict line)
- `status = skipped` → details = `path not found` or `no .git directory`

The script uses `git pull --rebase --autostash`, so local uncommitted changes are auto-stashed before the rebase and re-applied after. Plain "local changes would be overwritten" failures are handled silently; only real conflicts during rebase or stash-reapply surface as `error`.

## Output formatting

Render results as a markdown table. **Token-saving rule**: only `error` / `skipped` rows get explanatory detail; `ok` rows show one word, never diff stats or commit ranges.

```
## Pull Results

| Repo           | Status   | Details                                     |
|----------------|----------|---------------------------------------------|
| anju           | ok       | up-to-date                                  |
| caol-ila       | ok       | updated                                     |
| ta-portfolio   | error    | no tracking for branch `try/tegaki-hero`    |
| codex-base     | skipped  | path not found                              |
```

After the table, only if there are `error` rows, add a short **Next steps** block suggesting fixes (set upstream, delete stale branch, resolve conflict, stash local changes, etc.). Do not narrate successes.

## Why a script

The earlier inline-bash version of this command repeatedly failed in the harness's bash sandbox: `head` not found in backgrounded subshells, zsh `declare -A` quirks, `git` not found despite explicit `PATH`. The script (`pull.sh`) sidesteps all of that by calling coreutils via absolute paths (`/usr/bin/grep`, `/usr/bin/head`, `/usr/bin/git`) and auto-exporting `GIT_SSH_COMMAND` so git's forked children find ssh.

Override env vars if needed:
- `REPO_PATHS_JSON` — alternative path to repo-paths.json
- `GIT_BIN` — alternative git binary (default `/usr/bin/git`)
