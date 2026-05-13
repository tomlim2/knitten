---
description: Pre-PR self-review umbrella — dispatches shotloom-review-code + shotloom-review-docs as parallel cold-start Explore subagents
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
domains: rust,typescript,docs
repo-keys: shotloom
---

# shotloom-review-before-pr

Umbrella self-review for a Shotloom branch before opening a PR. Dispatches `shotloom-review-code` and `shotloom-review-docs` in parallel — two independent cold-start Explore subagents, no shared context, each re-reads its own standards fresh. The umbrella is the single entry point that callers (`shotloom-make-pr` Step 3b, `shotloom.md` post-push auto-trigger) invoke; the leaf skills can also be run independently when only one side matters.

## Why this skill exists

Self-review's hard limit: the same model that wrote the code / prose silently re-rationalizes claims as "verified" on re-read. Pattern S inside the old single-skill flow addressed this for one narrow class (load-bearing prose). The two-subagent split makes the cold-start guarantee structural — **every invocation routes review through subagents that have never seen the author's session**.

## Arguments

None. Operates on `git diff origin/main..HEAD` from the current shotloom worktree.

## Workflow

### Step 1: cwd + branch sanity

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

Refuse if HEAD is `main`, branch has zero commits ahead of `origin/main`, or cwd is not a shotloom worktree.

### Step 2: parallel cold-start dispatch

In a single tool message, invoke the `Agent` tool TWICE in parallel. Both subagents are `Explore` type (read-only).

**Agent 1 — code review:**
- `subagent_type: Explore`
- `description: Code review (cold-start) — Patterns A–F + T`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-code/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1.

**Agent 2 — docs review:**
- `subagent_type: Explore`
- `description: Docs review (cold-start) — Patterns G + H + I + M + S`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-docs/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1.

Both run independently with zero shared session context. Each re-reads its own canonical standards (`review-rust.md` + `code-review-guideline.md` for code; `pr-guideline.md` + `commit-guideline.md` + `documentation-standard.md` + `adr-template.md` + `code-review-guideline.md` for docs) and its own `reference.md` pattern catalog.

### Step 3: merge + present findings

Concatenate both subagent reports in this order:

```markdown
## Pre-PR review — branch <branch>

<insert code-review subagent report verbatim>

---

<insert docs-review subagent report verbatim>

---

### Combined recommendation

- Code clean + docs clean → `Ready to /shotloom-make-pr`.
- Code findings → list code priorities (P0–P3 per `code-review-guideline.md`); ask which to fix.
- Docs findings → list docs priorities; ask which to fix.
- Mixed → present both sets; recommend code fixes first if any blocker (P0–P1).
```

Add at most one short Korean paragraph framing which subsystem the diff advances, only when there are non-clean findings.

### Step 4: loop

User fixes findings, re-invokes — restart from Step 1. Both subagents re-dispatch cold.

## Binding rules

- **Always parallel, always cold-start.** Both subagents fire on every invocation. Never inline either review into the main session.
- **Read-only by contract.** Both subagents use the Explore agent type.
- **Do NOT push, do NOT call `gh pr create`, do NOT post PR comments.**
- **The umbrella is the single entry point for "review before PR".** Callers (`shotloom-make-pr` Step 3b, `shotloom.md` post-push auto-trigger) should invoke this skill, not the two leaves directly. Direct invocation of `shotloom-review-code` or `shotloom-review-docs` is allowed for narrow rechecks (e.g. only docs changed since last review) but the umbrella is the default.

## Related

- `shotloom-review-code` — code-quality leaf (Patterns A–F + T).
- `shotloom-review-docs` — docs / wording / markup leaf (Patterns G + H + I + M + S).
- `shotloom-make-pr` — next step after a clean report.
- `~/.claude/rules/shotloom.md` — per-PR approval, pre-PR checklist, post-push auto-trigger.
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec (read by code leaf).
- `docs/guidelines/code-review-guideline.md` (in shotloom repo) — review priorities (read by both leaves).
