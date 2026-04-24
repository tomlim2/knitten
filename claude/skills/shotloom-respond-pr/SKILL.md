---
description: Read Shotloom PR review comments, fix issues, commit, and post inline replies
argument-hint: "<pr-number>"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-respond-pr

Read GitHub PR review comments on a Shotloom PR, resolve each item, commit fixes, and post inline replies.

## Arguments

- `<pr-number>` - GitHub PR number (e.g., 85)

**If no argument is provided, show usage and ask. NEVER auto-execute.**

Usage: `/shotloom-respond-pr <pr-number>`

## Workflow

### Step 1: Sanity check

1. Validate `$ARGUMENTS` is a PR number.
2. `gh auth status` — confirm `tomlim2` active.
3. `git log -1 --format="%an <%ae>"` — confirm `tomlim2 <deemo@vonvon.me>`.
4. Confirm repo is `CINEV/shotloom`.

Stop on any failure.

### Step 2: Read PR + comments (parallel)

1. `gh pr view $ARGUMENTS --json title,body,headRefName,baseRefName,state,number`
2. `gh api repos/CINEV/shotloom/pulls/$ARGUMENTS/comments` — inline (`id`, `path`, `line`, `body`, `diff_hunk`)
3. `gh api repos/CINEV/shotloom/pulls/$ARGUMENTS/reviews` — reviews (suppressed items in body)

Checkout PR branch if needed: `git checkout <headRefName> && git pull`.

### Step 2.5: Classify each item by scope

Apply [`~/.claude/standards/shotloom-pr-scope-policy.md`](../../standards/shotloom-pr-scope-policy.md):
- **in-scope** → resolve in this PR
- **out-of-scope** → surface as "needs new Linear issue"; do NOT fix, reply, or resolve thread
- **ambiguous (≥9/10)** → surface for user decision; do NOT fix, reply, or resolve

Ambiguity scoring: ≤8 = pick best interpretation and proceed; ≥9 = surface.

### Step 3: List feedback items

Parse all comments into a numbered table (# | Source | File | Line | Summary). Inline = has `id` (directly repliable); suppressed = review body items.

Ask user which to address. Default: all. Proceed without further approval — invoking this skill authorizes the full workflow.

### Step 4: Resolve each item

1. Read target file at indicated line with context.
2. Evaluate:
   - **Direct suggestion** (code block) → apply via Edit if correct
   - **Valid concern** → implement the fix
   - **Design concern / large scope** → acknowledge, defer to STL-NN
   - **Disagree** → prepare explanation for reply
3. Apply the fix (also PR description + docs if implied).
4. Briefly report each change.

### Step 4.5: Capture defect as a reusable pattern (CRITICAL)

After a fix lands, decide if it represents a new pattern class. Prevents the same finding resurfacing on future PRs.

For each resolved finding:
1. Re-read Pattern A–G taxonomy in `~/.claude/standards/review-code-rust.md`.
2. **Match existing patterns first.** If a clearer instance of A1/B2/C3 etc., add one-line "Real defect" reference citing this PR + comment id.
3. **If nothing matches, draft a new pattern entry** with title, short description, `**Self-check:**` one-liner, `**Real defect:**` line.
4. Add to the Self-review checklist block at the bottom.
5. Append one-line to Provenance (date, PR, pattern).

Filters:
- **Add** → fix is "replace this construct with that", rule is greppable, senior reviewer would catch mechanically.
- **Skip** → ad-hoc rename, typo, local semantic bug without recurring shape.

Report: "Added Pattern X" or "No new pattern — {reason}".

### Step 5: Validate + commit

1. **Always update PR description** after resolving feedback:
   - Read current body, update Summary (new fixes, deleted files, deps), refresh Validation (test counts, doc-path counts), correct stale statements.
   - `gh pr edit $ARGUMENTS --body "..."`

2. Run CI-equivalent gates (parallel):
   ```
   cargo fmt --check
   cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
   cargo check --workspace --exclude shotloom-desktop
   cargo test -p shotloom-gltf --lib
   cargo test -p shotloom-retarget --lib
   node scripts/validate-doc-paths.mjs
   ```
   (`shotloom-desktop` excluded per `rules/shotloom-git.md`.)

3. Fix failing tests before proceeding. Broken tests block the PR.

4. On green:
   - `git add <files>` (by name, not `-A`)
   - Commit per `docs/guidelines/commit-guideline.md` (conventional, imperative, ≤80 char subject)
   - `git push`

### Step 6: Post inline replies (MUST get approval)

Draft a reply per resolved item:
- **Fixed:** "Fixed in <sha-short>. <brief description>"
- **Deferred (with issue):** "Follow-up tracked as STL-NN. <rationale>"
- **Deferred (no issue yet):** "Acknowledged — will file a follow-up before resolving."
- **Disagreed:** "<technical rationale>"

For suppressed items, draft one review-level summary reply.

**Show ALL drafts in one batch, wait for explicit user approval. NEVER auto-post.**

Post via `/replies` endpoint:
```
gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<comment_id>/replies -f body="<reply>"
```

### Step 7: Resolve review threads

Fetch thread IDs via graphql, apply policy:

| Status | Action |
|--------|--------|
| Fixed in pushed commit | **Resolve** |
| Deferred with Linear STL-NN filed and link posted | **Resolve** (tracked externally) |
| Deferred, no Linear issue yet | Leave open until filed (then file via `/shotloom-linear-create-issue`, post reply, resolve) |
| Disagreed | Leave open until reviewer acks. **Never resolve your own disagreement.** |
| Ambiguous | Leave open; no reply, no resolve |

See [reference.md](reference.md) for the graphql queries.

### Step 8: Re-request review

Only when PR was `CHANGES_REQUESTED` AND every originally-requested thread is resolved or deliberately left open with stated reason.

1. Identify original reviewers: `jq -r '.[] | select(.state=="CHANGES_REQUESTED") | .user.login' /tmp/pr<N>-reviews.json | sort -u`
2. Re-request (single or batch):
   ```
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/requested_reviewers -f 'reviewers[]=<login>'
   ```
3. Do **not** post a top-level "ready for re-review" comment — re-request is the signal.

**Skip Step 8 when:** PR not `CHANGES_REQUESTED`, unresolved fixed threads remain (resolve first), or user said `--no-rerequest`.

### Step 9: Report final summary

Table: # | File | Status | Linear | Thread | Reply. Plus line "Re-requested review from: @reviewer".

## Autonomy

Invoking this skill is blanket authorization for the workflow. **Do NOT pause for per-step approval.** Code edits, commits, pushes all automatic. Only stop on CI failure or genuinely unexpected event. The user reviews the final summary, not each step.

**EXCEPTION:** Step 6 (posting replies) STILL requires explicit batch approval per `rules/git.md`.

## Subagent Usage

- **Step 2** — parallel agents for PR metadata, comments, reviews.
- **Step 4** — dispatch subagents (`model: "sonnet"`) for independent files.
- **Step 5** — parallel `cargo fmt`, `clippy`, `validate-doc-paths` via background Bash.

Main thread orchestrates: gather results, stage, commit, post replies.

## Binding Rules

- **Reply inline on each individual review comment**, NOT top-level PR comment (per `rules/git.md`).
- **Suppressed items** — evaluate honestly; OK to defer scope-exceeding work.
- **Commit message** — conventional, imperative, ≤80 char subject.
- **No Co-Authored-By line.**

## Common Failures

| Symptom | Fix |
|---------|-----|
| Wrong `gh` account | `gh auth switch --user tomlim2` |
| Comment ID 404 | PR force-pushed; re-fetch comments |
| Reply posts as top-level | Use `/comments/<id>/replies`, not `/issues/<N>/comments` |
| Clippy fails after fix | Fix warnings before commit |
| Inline reply rejected on rename-detected diff | Read comment's `diff_hunk` first; reply at a line that appears there. Failed attempts leave "superseded" artifacts — include brief apology in next successful reply |

## Related

- `~/.claude/skills/shotloom-make-pr/SKILL.md`
- `~/.claude/skills/shotloom-review-before-pr/SKILL.md`
- `~/.claude/skills/shotloom-linear-create-issue/SKILL.md`
- `~/.claude/rules/git.md`, `shotloom-git.md`
- `~/.claude/standards/review-code-rust.md` — 22-pattern Rust checklist

## Additional Resources

For the graphql thread-resolution queries, detailed reply templates, and the Pattern-capture filter rationale, see [reference.md](reference.md).
