---
description: Pre-PR self-review umbrella — dispatches shotloom-review-code first, then shotloom-review-docs after code fixes land, as sequential cold-start Explore subagents
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
domains: rust,typescript,docs
repo-keys: shotloom
---

# shotloom-review-before-pr

Umbrella self-review for a Shotloom branch before opening a PR. Dispatches `shotloom-review-code` first, then `shotloom-review-docs` **after** any code fixes from the first pass land — two independent cold-start Explore subagents, no shared context, each re-reads its own standards fresh. Sequential is mandatory: docs review includes comment/docstring prose, and code review's fixes routinely touch those — running docs in parallel would review pre-fix comment state and miss the rewrite. The umbrella is the single entry point that callers (`shotloom-make-pr` Step 3b, `shotloom.md` post-push auto-trigger) invoke; the leaf skills can also be run independently when only one side matters.

## Why this skill exists

Self-review's hard limit: the same model that wrote the code / prose silently re-rationalizes claims as "verified" on re-read. Pattern S inside the old single-skill flow addressed this for one narrow class (load-bearing prose). The two-subagent split makes the cold-start guarantee structural — **every invocation routes review through subagents that have never seen the author's session**.

## Why sequential, not parallel

Docs review covers code comments, docstrings, top-of-file module headers, and any prose the code review would touch when fixing a finding. If code and docs run in parallel:

- Code subagent finds `// outdated comment about removed enum variant` → user rewrites the comment as part of fixing the code-side defect.
- Docs subagent, run in parallel, reads the *pre-fix* comment and files a finding on the same line.
- Output contains two findings for one defect, and the docs finding is stale before it is read.

Running docs **after** code fixes land means the docs subagent reads the post-fix tree — the comment it sees is the one that will ship. Stale-by-construction findings disappear. The cost is one extra round-trip when the author chooses to apply code fixes; when code review is clean, docs dispatches immediately.

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

### Step 2: code review (first pass, cold-start)

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Code review (cold-start) — Patterns A–F + T + U`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-code/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1.

The subagent re-reads its canonical standards (`review-rust.md` + `code-review-guideline.md`) and its `reference.md` pattern catalog (`A–F`, `T`, `U`) cold. Zero shared context with the author's session.

### Step 3: present code findings + apply-fix gate

Render the code subagent's report verbatim, prefixed:

```markdown
## Pre-PR review — branch <branch> — code (pass 1 of 2)

<code-review subagent report verbatim>
```

Then route based on findings:

| Code state | Next |
|---|---|
| Clean (no findings) | proceed directly to Step 4 |
| Findings present | list priorities (P0–P3 per `code-review-guideline.md`), ask which to fix, wait for user. After fixes land (any new commits since Step 2), proceed to Step 4. If user skips all fixes, still proceed to Step 4 — the gate is "user has decided what to fix", not "no findings remain". |

The gate exists so docs review reads the **post-fix** tree, not the pre-fix one. A user who declines to fix any code finding still moves to Step 4 immediately; the gate isn't a quality bar, it's a synchronization point so docs review doesn't file findings on prose the user is about to rewrite.

### Step 4: docs review (second pass, cold-start)

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Docs review (cold-start) — Patterns G + H + I + M + S`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-docs/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1. **If new commits landed between Step 2 and Step 4 (i.e. user applied code fixes), use the current HEAD as the diff endpoint** — `git diff origin/main..HEAD` already does this; no special handling needed beyond ensuring no stale `branch` variable from Step 1 is reused.

The subagent re-reads its canonical standards (`pr-guideline.md` + `commit-guideline.md` + `documentation-standard.md` + `adr-template.md` + `code-review-guideline.md`) and its `reference.md` pattern catalog (`G`, `H`, `I`, `M`, `S`) cold. Zero shared context with either the author's session or the Step 2 code subagent.

### Step 5: present docs findings + combined recommendation

Render the docs subagent's report verbatim, prefixed:

```markdown
## Pre-PR review — branch <branch> — docs (pass 2 of 2)

<docs-review subagent report verbatim>

---

### Combined recommendation

- Pass 1 clean + Pass 2 clean → `Ready to /shotloom-make-pr`.
- Pass 1 had findings (user fixed N of M) + Pass 2 clean → report N applied, M-N skipped; ready to PR.
- Pass 2 findings → list priorities, ask which to fix.
```

Add at most one short Korean paragraph framing which subsystem the diff advances, only when there are non-clean findings.

### Step 6: loop

User fixes Pass 2 findings, re-invokes — restart from Step 1. Both subagents re-dispatch cold. Each invocation runs Step 2 → Step 4 in order, never inlined or parallel.

## Binding rules

- **Always sequential, always cold-start.** Code subagent (Step 2) finishes before docs subagent (Step 4) is dispatched. Never inline either review into the main session, never parallel-dispatch the two.
- **Apply-fix gate between passes.** Step 3 must wait for user input on code findings before Step 4 fires. A user choosing to skip all fixes is still a valid gate-clear — the gate is the user's decision, not the absence of findings.
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
