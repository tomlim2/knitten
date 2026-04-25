---
description: Stage-aware commit helper — run gates, draft conventional commit message, commit
argument-hint: "[--skip-gates] [extra message hint]"
allowed-tools: Read, Bash(git:*), Bash(cargo:*), Bash(node:*), Bash(pnpm:*)
---

# shotloom-commit

Commit helper for Shotloom repos. Ensures every commit passes gates and follows `docs/guidelines/commit-guideline.md` before hitting the branch.

## Arguments

- `[--skip-gates]` — skip pre-commit gate run (use only for docs-only commits when CI won't run anything meaningful). Default: run gates.
- `[extra message hint]` — free text the user wants included in the body (e.g., "STL-99" to ensure the footer has it).

Usage: `/shotloom-commit` or `/shotloom-commit STL-99 refactor viewer bootstrap`

## Workflow

### Step 1: Inspect state

```bash
git rev-parse --show-toplevel
git status --short
git diff --staged --stat
git log -1 --format="%an <%ae>"
```

- If nothing staged but working tree dirty → report "nothing staged" and list modified files. Ask user whether to `git add` which paths.
- If author identity ≠ `tomlim2 <deemo@vonvon.me>` → warn, offer `git commit --amend --reset-author` path (but don't auto-fix mid-flow).

### Step 2: Run gates

Unless `--skip-gates` provided, delegate to `/shotloom-check-gates` (default = full bundle: fmt + clippy + check + **test** + doc-paths). If any gate fails, stop — do not attempt the commit. Report which gate and where.

The earlier convention split "fast for commit / full for push" produced PRs where commit-time gates passed and CI-equivalent push-time gates surfaced test regressions. The Shotloom canonical bundle now runs the same set every time so CI parity is a build-time guarantee, not a per-skill flag. If the user wants to skip tests for a docs-only commit, pass `/shotloom-commit --skip-gates` and explain in the commit body.

### Step 3: Draft commit message

Read the staged diff, classify, and draft per `docs/guidelines/commit-guideline.md`:

```
<type>(<scope>): <subject ≤80 chars, imperative, no trailing period>

<body — why, not what; 80-char wraps; grouped by behavior>

Related to STL-NN   (commit footer only — never use "Resolves STL-NN" in commits per rules/shotloom-git.md; closing linkage belongs in the PR description)
```

Type rules:
- `feat` — new user-visible capability
- `fix` — bug fix
- `refactor` — no behavior change
- `docs` — docs only
- `test` — test only
- `chore` — tooling, deps, CI
- `perf` — performance
- `build`, `ops`, `style` — per guideline

Scope rules: crate name or subsystem slug (e.g., `retarget`, `vrm`, `ipc`, `docs`). Keep lowercase.

If current branch encodes an STL (`feat/stl-99-*`) or the user's hint contains `STL-NN`, include `Related to STL-NN` in the footer.

### Step 4: Show draft + confirm

Emit the drafted message exactly as it will be committed. Ask: "Commit as drafted, or edit?" Wait for approval.

If user edits, accept their edit and proceed. If approved as-is, proceed.

### Step 5: Commit

```bash
git commit -m "$(cat <<'EOF'
<message here>
EOF
)"
```

No `--no-verify`. No `-f`. No Co-Authored-By trailer.

### Step 6: Report

```
✅ Committed <sha-short> on <branch>
  <subject line>

Next: push with `git push` or continue local work.
```

If the pre-commit hook failed at Step 5 (possible if repo hook is stricter than `shotloom-check-gates` knows), report the hook output and stop — do NOT amend. Let the user fix and re-run.

## Notes

- This skill commits on the current branch/worktree. Does not push.
- Use `/shotloom-make-pr` to open PR after pushing.
- Follows `rules/shotloom-git.md`: never `--no-verify`, never force-push, author must be tomlim2.
