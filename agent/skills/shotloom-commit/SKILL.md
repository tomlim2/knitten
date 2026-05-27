---
description: Stage-aware Shotloom commit guideline helper — inspect staged changes, deliver commit/push checklist, draft conventional commit message, commit
argument-hint: "[extra message hint]"
allowed-tools: Read, Bash(git:*), Bash(cargo:*), Bash(node:*), Bash(pnpm:*)
---

# shotloom-commit

Commit guideline helper for Shotloom repos. Delivers the Shotloom commit and push checklist, drafts a commit message from staged changes, and commits after user approval.

This skill does not own Shotloom gate policy. Treat it as a delivery wrapper for current Shotloom commit guidance. `reference.md` records commit-local guideline leak fixes.

| Need | Action |
|------|--------|
| Draft and create a commit | Use this skill. |
| Run local gates | Follow Shotloom repo guidance. Use `/shotloom-check-gates` only when the repo guidance or user asks for local helper evidence. |
| Need push/PR evidence | Run `/shotloom-check-gates --full` before push or PR creation. |

## Arguments

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

### Step 2: Deliver gate checklist

Print the current gate checklist before drafting:

| Moment | Required local evidence |
|--------|-------------------------|
| Before commit | Follow Shotloom repo guidance. If it requires local evidence, run the requested helper. |
| Before push | Run `/shotloom-check-gates --full`. |
| Before PR | Run `/shotloom-check-gates --full` or report why local gates were skipped. |

### Step 3: Draft commit message

Read the staged diff, classify, and draft per `docs/guidelines/commit-guideline.md`:

```
<type>(<scope>): <subject ≤80 chars, imperative, no trailing period>

<body — why, not what; 80-char wraps; grouped by behavior>

Related to STL-NN   (commit footer only — never use "Resolves STL-NN" in commits per ~/.claude/rules/shotloom.md; closing linkage belongs in the PR description)
```

Before asking for approval, count the first line exactly as Git will receive
it. If the subject is over 80 characters, rewrite it before showing the draft.

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
- Extra gate rationale lives in [reference.md](reference.md).
- Follows `~/.claude/rules/shotloom.md`: never `--no-verify`, never force-push, author must be tomlim2.
