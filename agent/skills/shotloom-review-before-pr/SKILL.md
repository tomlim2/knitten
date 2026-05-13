---
description: Pre-PR self-review umbrella — code review (cold), apply fixes, code re-review (cold verify), then docs review (cold), apply fixes, docs re-review (cold verify), all via sequential Explore subagents
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
domains: rust,typescript,docs
repo-keys: shotloom
---

# shotloom-review-before-pr

Umbrella self-review for a Shotloom branch before opening a PR. Two phases (code, then docs); each phase runs **two cold-start Explore subagents** — pass A (initial findings) and pass B (verification after user-applied fixes). No shared context between any pass; each re-reads its own standards fresh. Sequential between phases is mandatory: docs review includes comment/docstring prose, and code-side fixes routinely touch those. The umbrella is the single entry point that callers (`shotloom-make-pr` Step 3b, `shotloom.md` post-push auto-trigger) invoke; the leaf skills can also be run independently when only one side matters.

## Why this skill exists

Self-review's hard limit: the same model that wrote the code / prose silently re-rationalizes claims as "verified" on re-read. Pattern S inside the old single-skill flow addressed this for one narrow class (load-bearing prose). The two-subagent split makes the cold-start guarantee structural — **every invocation routes review through subagents that have never seen the author's session**.

## Why sequential, not parallel

Docs review covers code comments, docstrings, top-of-file module headers, and any prose the code review would touch when fixing a finding. If code and docs run in parallel:

- Code subagent finds `// outdated comment about removed enum variant` → user rewrites the comment as part of fixing the code-side defect.
- Docs subagent, run in parallel, reads the *pre-fix* comment and files a finding on the same line.
- Output contains two findings for one defect, and the docs finding is stale before it is read.

Running docs **after** code fixes land means the docs subagent reads the post-fix tree — the comment it sees is the one that will ship. Stale-by-construction findings disappear.

## Why verify after fixing

A fix is itself a change, and a change can introduce new defects (a renamed identifier whose docstring is now wrong, a deleted branch whose test is now orphaned, a moved file whose path reference broke). The author who applied the fix is the worst position to detect the new defect — they just rationalized the change as correct. The verification pass is another cold-start subagent that has never seen the fix, reads the post-fix tree, and reports anything the fix introduced.

Verification fires **only when the author applied at least one fix** in the corresponding apply-fix gate — if the first pass was clean, or the user declined every finding, the verification pass is skipped (nothing changed, so re-reading the same tree adds zero signal). When verification does run and finds new issues, it does not loop further; the user decides whether to fix and re-invoke the umbrella, which restarts from Step 1.

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

Record `head_step1=$(git rev-parse HEAD)` at the end of Step 1. Subsequent steps compare against this SHA to detect whether fixes landed.

### Step 2: code review — pass A (cold-start, initial)

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Code review pass A (cold-start) — Patterns A–F + T + U`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-code/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1.

The subagent re-reads its canonical standards (`review-rust.md` + `code-review-guideline.md`) and its `reference.md` pattern catalog (`A–F`, `T`, `U`) cold. Zero shared context with the author's session.

### Step 3: present pass-A findings + apply-fix gate

Render the pass-A report verbatim, prefixed:

```markdown
## Pre-PR review — branch <branch> — code pass A
```

Then route:

| Pass A | Next |
|---|---|
| Clean (no findings) | record `code_fixes_applied=false`, skip Step 4, proceed to Step 5 |
| Findings present | list priorities (P0–P3 per `code-review-guideline.md`), ask which to fix, wait for user. When user is done, compute `code_fixes_applied = (git rev-parse HEAD != head_step1)`. Proceed to Step 4 if `true`, otherwise skip Step 4 and proceed to Step 5. |

A user who declines every finding still advances; the verification pass is only useful when something actually changed.

### Step 4: code review — pass B (cold-start verification)

Fires only when `code_fixes_applied == true`.

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Code review pass B (cold-start verify) — Patterns A–F + T + U`
- `prompt`: same brief as Step 2, but include a one-paragraph preamble: "This is a verification pass. The author just applied fixes to address pass-A findings. Re-run the full pattern catalog on the current HEAD. Report any defect — pre-existing or newly introduced by the fix commit(s). Do not assume pass-A findings are resolved; check directly."

Subagent runs the catalog cold against the new HEAD. Render its report verbatim:

```markdown
## Pre-PR review — branch <branch> — code pass B (verify)
```

If pass B has findings, list priorities and ask whether to fix. If the user fixes (HEAD advances again), **do not** dispatch a third code pass — the verification budget is one. Surface the choice: either accept and proceed to docs, or stop here and re-invoke the umbrella from Step 1 for a fresh round (cold-start guarantee preserved).

Record `head_after_code = git rev-parse HEAD` at the end of this step (or at the end of Step 3 if Step 4 was skipped).

### Step 5: docs review — pass A (cold-start, initial)

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Docs review pass A (cold-start) — Patterns G + H + I + M + S`
- `prompt`: read the full subagent brief from `~/.claude/skills/shotloom-review-docs/SKILL.md` Step 3 and pass it verbatim, with `<worktree>` and `<branch>` substituted from Step 1. The brief always operates on `git diff origin/main..HEAD`, so post-fix commits are picked up automatically.

The subagent re-reads its canonical standards (`pr-guideline.md` + `commit-guideline.md` + `documentation-standard.md` + `adr-template.md` + `code-review-guideline.md`) and its `reference.md` pattern catalog (`G`, `H`, `I`, `M`, `S`) cold. Zero shared context with any earlier pass or the author's session.

### Step 6: present pass-A docs findings + apply-fix gate

Render the pass-A docs report verbatim, prefixed:

```markdown
## Pre-PR review — branch <branch> — docs pass A
```

Same routing as Step 3, against `head_after_code`:

| Docs pass A | Next |
|---|---|
| Clean | record `docs_fixes_applied=false`, skip Step 7, proceed to Step 8 |
| Findings present | list priorities, ask which to fix, wait. Compute `docs_fixes_applied = (git rev-parse HEAD != head_after_code)`. Proceed to Step 7 if `true`, otherwise skip to Step 8. |

### Step 7: docs review — pass B (cold-start verification)

Fires only when `docs_fixes_applied == true`.

Dispatch ONE `Agent` tool call. `Explore` type (read-only).

- `subagent_type: Explore`
- `description: Docs review pass B (cold-start verify) — Patterns G + H + I + M + S`
- `prompt`: same brief as Step 5, with a verification preamble: "This is a verification pass. The author just applied fixes to address pass-A docs findings. Re-run the full pattern catalog on the current HEAD. Report any defect — pre-existing or newly introduced. Do not assume pass-A findings are resolved; check directly."

Render verbatim:

```markdown
## Pre-PR review — branch <branch> — docs pass B (verify)
```

If pass B has findings, list and ask. No third pass — same one-verification-budget rule as Step 4. Either accept or re-invoke the umbrella for a fresh round.

### Step 8: combined recommendation

Summarize across all passes that fired:

```markdown
### Combined recommendation

- All passes clean → `Ready to /shotloom-make-pr`.
- Passes had findings + user resolved → report N applied / M skipped per phase; ready to PR.
- Pass B (either phase) surfaced new findings → either fix and re-invoke, or accept and PR with the trade-off documented in the PR body.
```

Add at most one short Korean paragraph framing which subsystem the diff advances, only when at least one pass had non-clean findings.

### Step 9: loop

Re-invocation restarts from Step 1. Every pass re-dispatches cold; there is no carry-over state between umbrella invocations.

## Binding rules

- **Always sequential, always cold-start.** Code phase (Step 2–4) finishes before docs phase (Step 5–7) is dispatched. Within each phase, pass A finishes before pass B. Never inline any pass into the main session, never parallel-dispatch any two passes.
- **Verification budget is one per phase.** Pass B fires at most once per phase (only when the corresponding apply-fix gate landed at least one commit). If pass B surfaces new findings, do not auto-dispatch pass C — surface the choice (fix and re-invoke vs. accept and PR). Re-invocation always restarts from Step 1.
- **Apply-fix gates do not require fixes.** Step 3 and Step 6 advance whether the user fixes everything, nothing, or partial — the gate is the user's decision, not "no findings remain". Pass B is gated on `HEAD actually moved`, not on the user's intent.
- **Read-only by contract.** Every subagent (4 in the maximal case: code A, code B, docs A, docs B) uses the Explore agent type.
- **Do NOT push, do NOT call `gh pr create`, do NOT post PR comments.**
- **The umbrella is the single entry point for "review before PR".** Callers (`shotloom-make-pr` Step 3b, `shotloom.md` post-push auto-trigger) should invoke this skill, not the two leaves directly. Direct invocation of `shotloom-review-code` or `shotloom-review-docs` is allowed for narrow rechecks (e.g. only docs changed since last review) but the umbrella is the default.

## Related

- `shotloom-review-code` — code-quality leaf (Patterns A–F + T).
- `shotloom-review-docs` — docs / wording / markup leaf (Patterns G + H + I + M + S).
- `shotloom-make-pr` — next step after a clean report.
- `~/.claude/rules/shotloom.md` — per-PR approval, pre-PR checklist, post-push auto-trigger.
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec (read by code leaf).
- `docs/guidelines/code-review-guideline.md` (in shotloom repo) — review priorities (read by both leaves).
