---
description: Run Shotloom pre-PR review with auto Single/Triad mode, then hand off to shotloom-make-pr when clean
argument-hint: "[force single|force standard|force triad] [review only|no make-pr]"
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(pwd)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/shotloom.md,rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-review-before-pr

Run pre-PR self-review on the current Shotloom branch. This skill is an
orchestrator: it reads references, dispatches read-only review agents, applies
in-scope fixes, verifies changed `HEAD`, and hands off to `shotloom-make-pr`
when clean.

Read first:

| Reference | Owns |
|---|---|
| `references/PROCESS_POLICY.md` | Phase boundary, finding handling, handoff, binding rules. |
| `references/REVIEW_MODE.md` | Single/Triad selection. |
| `references/TRIAD_REVIEW.md` | Triad roles and merge rules. |
| `references/LARGE_BOUNDARY_PR_LENSES.md` | Boundary trigger and batch lenses. |
| `references/PRE_PR_PROMPTS.md` | Verification and docs prompts. |

## Delegation Authorization

Invoking this skill authorizes read-only review subagents. Subagents may inspect
the worktree and report findings. They must not edit, stage, commit, push, post
GitHub comments, change Linear, or run destructive commands. If subagents are
unavailable, report that the pre-PR review gate is blocked.

## Arguments

Optional natural-language overrides:

| User phrase | Effect |
|---|---|
| `force single` or `force standard` | Use Single mode after Step 1 evidence. |
| `force triad` | Use Triad mode after Step 1 evidence. |
| `review only` or `no make-pr` | Stop after the final review report; do not hand off to `shotloom-make-pr`. |

By default, review `git diff origin/main...HEAD` from the current Shotloom
worktree. Use the three-dot diff because branches can be behind `origin/main`.

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
git fetch origin main
branch=$(git rev-parse --abbrev-ref HEAD); echo "$branch"
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git log --oneline origin/main..HEAD
git status --short
```

Refuse if `HEAD` is `main`, the branch has zero commits ahead of
`origin/main`, or cwd is not a Shotloom worktree. Record
`head_step1=$(git rev-parse HEAD)`.

### Step 2: Review Mode Decision

Read `references/REVIEW_MODE.md`, gather its required evidence, and choose
`review_mode=single` or `review_mode=triad`.

```bash
git diff --shortstat origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Render the Review Mode Decision template from `REVIEW_MODE.md` before launching
review agents.

### Step 3: Selected Main Review Pass A

If `review_mode=single`:

1. Dispatch one read-only Explore subagent.
2. Prompt: read installed `shotloom-review-code/SKILL.md`; if unavailable, read
   `agent/skills/shotloom-review-code/SKILL.md`. Extract only the fenced
   `Subagent brief (copy verbatim)` block under Step 3; substitute
   `<worktree>`, `<pwd>`, and `<branch>`. Do not pass wrapper instructions that
   tell the caller to invoke another Agent.
3. Render under `## Pre-PR review - branch <branch> - code pass A`.
4. Apply `PROCESS_POLICY.md` → `Finding Handling`.
5. Set `main_review_mode=single`.
6. Compute `code_fixes_applied` by comparing `HEAD` to `head_step1`.

If `review_mode=triad`:

1. Dispatch the three role subagents from `references/TRIAD_REVIEW.md`.
2. Render each under `## Pre-PR review - branch <branch> - triad pass A - <role>`.
3. Apply `TRIAD_REVIEW.md` → `Merge Rules`.
4. Apply `PROCESS_POLICY.md` → `Finding Handling`.
5. Set `main_review_mode=triad`.
6. Compute `triad_fixes_applied` by comparing `HEAD` to `head_step1`.

### Step 4: Main Review Verification

If no main-review fixes changed `HEAD`, set
`head_after_main=$(git rev-parse HEAD)` and continue to Step 5.

If Single fixes changed `HEAD`, run code verification with
`PRE_PR_PROMPTS.md` → `Single Code Verification Preamble`. Render under
`## Pre-PR review - branch <branch> - code pass <letter> (verify)`.

If Triad fixes changed `HEAD`, run Triad verification for roles that reported
P0-P2 or whose owned surface changed. Use `TRIAD_REVIEW.md` → `Verification
Pass`. Render under
`## Pre-PR review - branch <branch> - triad pass <letter> (verify) - <role>`.

After each verification pass, apply `PROCESS_POLICY.md` → `Finding Handling`.
If fixes changed `HEAD`, run the next verification pass letter. Stop when the
latest pass is clean or nit-only, then set `head_after_main=$(git rev-parse HEAD)`.

### Step 5: Large Boundary Lens Batches

If `references/LARGE_BOUNDARY_PR_LENSES.md` does not trigger, skip to Step 6.

If it triggers:

1. Select matching batches from the Trigger-To-Batch Map.
2. Dispatch one read-only Explore subagent per selected batch.
3. Prompt: read the same reference, review current `HEAD` for Batch `<batch>`
   only, use `git diff origin/main...HEAD`, render the Result Template, and do
   not mutate files or external systems.
4. Stop between batches when P0-P2 findings exist.
5. Apply `PROCESS_POLICY.md` → `Finding Handling`.
6. Run targeted checks for the changed surface: choose the smallest relevant
   local package/test command or `shotloom-check-gates`; report commands run.
7. Resume with the next matching batch from current `HEAD`.

If boundary fixes changed `HEAD`, run the selected main-review verification
path before docs.

### Step 6: Targeted Docs Pass A

Record `head_before_docs=$(git rev-parse HEAD)`.

Dispatch one read-only Explore subagent with `PRE_PR_PROMPTS.md` →
`Targeted Docs Brief`, substituting `<worktree>` and `<branch>`. Render under
`## Pre-PR review - branch <branch> - docs pass A (targeted)`.

Apply `PROCESS_POLICY.md` → `Finding Handling`. Compute `docs_fixes_applied` by
comparing `HEAD` to `head_before_docs`.

### Step 7: Docs Verification

If docs fixes did not change `HEAD`, continue to Step 8.

If docs fixes changed `HEAD`, dispatch one read-only Explore subagent with the
same targeted docs brief plus `PRE_PR_PROMPTS.md` → `Docs Verification
Preamble`. Render under
`## Pre-PR review - branch <branch> - docs pass <letter> (verify)`.

Apply `PROCESS_POLICY.md` → `Finding Handling`. If fixes changed `HEAD`, run
the next docs verification pass letter. Stop when the latest pass is clean or
nit-only.

### Step 8: Make-PR Handoff

Apply `PROCESS_POLICY.md` → `Handoff`. If the current harness cannot invoke
another local skill directly, report:
`Ready to /shotloom-make-pr — run it next in this same worktree`.

Add one short Korean paragraph only if findings were non-clean.

## Related

- `shotloom-review-code` - code-quality leaf.
- `shotloom-review-docs` - standalone docs review catalog; Step 6 uses its
  reference through `PRE_PR_PROMPTS.md`.
- `shotloom-make-pr` - next step after a clean report.
- `docs/guidelines/review-rust.md` - Rust review spec.
- `docs/guidelines/code-review-guideline.md` - review priorities.
