---
description: Run Shotloom pre-PR cold review through code and docs Explore passes
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(pwd)
domains: rust,typescript,docs
repo-keys: shotloom
---

# shotloom-review-before-pr

Run pre-PR self-review on the current Shotloom branch. The skill uses
read-only Explore subagents so review context stays cold and independent
from the authoring session.

## Arguments

None. Operates on `git diff origin/main..HEAD` from the current Shotloom
worktree.

## Review Shape

| Phase | Required pass | Verification pass |
|---|---|---|
| Code | code pass A | code pass B only if code fixes changed `HEAD` |
| Docs | docs pass A | docs pass B only if docs fixes changed `HEAD` |

Run phases sequentially: code first, docs second. Docs review includes
comments and docstrings, so it must read the post-code-fix tree.

## Workflow

### Step 1: Worktree Sanity

```bash
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "ERROR: not in git repo"; exit 1; }
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *) echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"; exit 1 ;;
esac
cd "$toplevel"
pwd
branch=$(git rev-parse --abbrev-ref HEAD); echo "$branch"
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git log --oneline origin/main..HEAD
git status --short
```

Refuse if `HEAD` is `main`, the branch has zero commits ahead of
`origin/main`, or cwd is not a Shotloom worktree.

Record `head_step1=$(git rev-parse HEAD)`.

### Step 2: Code Pass A

Dispatch one read-only Explore subagent.

| Field | Value |
|---|---|
| `description` | `Code review pass A (cold-start) - Patterns A-F + T + U` |
| `prompt` | Read `~/.claude/skills/shotloom-review-code/SKILL.md` Step 3 and pass it verbatim with `<worktree>` and `<branch>` substituted. |

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - code pass A
```

If findings exist, ask which findings to fix. After the user finishes or
declines fixes, compute:

```bash
code_fixes_applied=$(test "$(git rev-parse HEAD)" != "$head_step1" && echo true || echo false)
```

### Step 3: Code Pass B If Needed

If `code_fixes_applied=false`, set
`head_after_code=$(git rev-parse HEAD)` and continue to Step 4.

If `code_fixes_applied=true`, dispatch one read-only Explore subagent
with the same code brief plus this preamble:

```text
This is a verification pass. The author just applied fixes to address
pass-A findings. Re-run the full pattern catalog on the current HEAD.
Report any defect - pre-existing or newly introduced by the fix commit(s).
Do not assume pass-A findings are resolved; check directly.
```

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - code pass B (verify)
```

If pass B finds issues, ask whether to fix now. If fixes change `HEAD`,
do not run code pass C. Either stop and re-invoke this skill, or accept
the residual risk and continue to docs.

Record `head_after_code=$(git rev-parse HEAD)`.

### Step 4: Docs Pass A

Dispatch one read-only Explore subagent.

| Field | Value |
|---|---|
| `description` | `Docs review pass A (cold-start) - Patterns G + H + I + M + S` |
| `prompt` | Read `~/.claude/skills/shotloom-review-docs/SKILL.md` Step 3 and pass it verbatim with `<worktree>` and `<branch>` substituted. |

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - docs pass A
```

If findings exist, ask which findings to fix. After the user finishes or
declines fixes, compute:

```bash
docs_fixes_applied=$(test "$(git rev-parse HEAD)" != "$head_after_code" && echo true || echo false)
```

### Step 5: Docs Pass B If Needed

If `docs_fixes_applied=false`, continue to Step 6.

If `docs_fixes_applied=true`, dispatch one read-only Explore subagent
with the same docs brief plus this preamble:

```text
This is a verification pass. The author just applied fixes to address
pass-A docs findings. Re-run the full pattern catalog on the current HEAD.
Report any defect - pre-existing or newly introduced. Do not assume
pass-A findings are resolved; check directly.
```

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - docs pass B (verify)
```

If pass B finds issues, ask whether to fix now. If fixes change `HEAD`,
do not run docs pass C. Either stop and re-invoke this skill, or accept
the residual risk and continue.

### Step 6: Recommendation

Report one of:

| Result | Recommendation |
|---|---|
| All fired passes clean | `Ready to /shotloom-make-pr` |
| Findings fixed or accepted | `Ready to /shotloom-make-pr`; note accepted residual risk |
| Pass B found unresolved issues | Fix and re-invoke, or document accepted risk in PR body |

Add one short Korean paragraph only if findings were non-clean.

## Binding Rules

- Always run code before docs.
- Always use read-only Explore subagents.
- Never run pass B unless the matching pass A fix gate changed `HEAD`.
- Never run pass C; re-invoke this skill for another cold round.
- Do not push, create PRs, or post PR comments.
- Use this umbrella for default pre-PR review. Use leaf skills only for
  narrow rechecks.

## Related

- `shotloom-review-code` - code-quality leaf.
- `shotloom-review-docs` - docs and wording leaf.
- `shotloom-make-pr` - next step after a clean report.
- `docs/guidelines/review-rust.md` - Rust review spec.
- `docs/guidelines/code-review-guideline.md` - review priorities.
