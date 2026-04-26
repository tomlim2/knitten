---
description: Pull all local git repos registered in repo-paths.json
allowed-tools: Read, Bash(git -C:*), Bash(test:*), Bash(ls:*), Bash(command:*), Bash(export:*)
---

# Git Pull Repos

Pull all git repositories registered in `~/.claude/private/caol-config/repo-paths.json` that exist on this machine.

## Execution

0. **Ensure ssh is reachable for SSH-remote pulls.** Some sandboxed environments (notably the bash sandbox Claude Code runs commands in) truncate `PATH` for git's forked children, so `git pull` against `git@host:...` or `ssh://...` remotes fails with `cannot run ssh: No such file or directory`. Auto-detect ssh and export `GIT_SSH_COMMAND` once at the top of the run so git uses the absolute path directly:

   ```bash
   if [ -z "$GIT_SSH_COMMAND" ]; then
     SSH_BIN=$(command -v ssh 2>/dev/null)
     [ -n "$SSH_BIN" ] && export GIT_SSH_COMMAND="$SSH_BIN"
   fi
   ```

   Cross-platform: `command -v ssh` resolves to `/usr/bin/ssh` on macOS/Linux and to git-bash's bundled ssh on Windows — no hardcoded path needed. If ssh isn't on PATH at all (rare), skip the export and let SSH-remote pulls fail with their natural error.

1. Read `~/.claude/private/caol-config/repo-paths.json`
2. For each entry, resolve the path (handle both `{ "path": "..." }` and plain string formats)
3. Filter: path exists on disk AND has a `.git/` directory
4. Run `git -C <path> pull` in parallel for all matching repos (combine with the export from step 0 so all pulls inherit `GIT_SSH_COMMAND`)
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
