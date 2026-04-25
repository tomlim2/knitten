---
description: Read Shotloom PR review comments, fix issues, commit, and post inline replies
argument-hint: "<pr-number>"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-respond-pr

Read GitHub PR review comments on a Shotloom PR, fix each item, commit, post inline replies, and re-request review. Never auto-resolves threads — the reviewer owns resolution.

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

**Mandatory output — one line per resolved finding, before Step 5 begins:**

```
Pattern capture:
  finding 1 (<file>:<line>) → matched A7 (added Real defect line)
  finding 2 (<file>:<line>) → new D6 (added pattern + checklist + provenance)
  finding 3 (<file>:<line>) → skipped — ad-hoc rename, no recurring shape
```

Every resolved finding from Step 4 must appear in this block. **Step 5 (Validate + commit) is gated on this block being printed.** If the block is missing or has fewer entries than Step 4 had findings, return to Step 4.5 and complete it before staging files. The block is the proof that Step 4.5 actually ran — without it, the step gets silently skipped (this happened on PR #166).

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

### Step 7: Do NOT resolve threads — leave for the reviewer

**Policy:** After posting replies, the skill never clicks "Resolve conversation" on review threads. Resolution is the reviewer's acknowledgement that the reply is adequate — the author pre-resolving removes that signal and makes the review state ambiguous for the reviewer on next pass.

- **Fixed** → reply posted in Step 6, thread stays open for reviewer to resolve.
- **Deferred with Linear issue filed** → reply posted with STL-NN link, thread stays open.
- **Deferred with no issue yet** → file via `/shotloom-linear-create-issue` first, post reply, thread stays open.
- **Disagreed** → reply posted, thread stays open (never resolve your own disagreement).
- **Ambiguous** → no reply, no resolve.

The graphql thread-resolution queries in `reference.md` remain for historical context but are NOT invoked by this skill.

### Step 8: Re-request review (always, after replies posted)

Re-request is the signal that "I'm done with this round; please re-review." It runs whenever Step 6 posted at least one reply — independent of PR review state and independent of whether threads are resolved.

1. Identify reviewers to re-request:
   - If PR was `CHANGES_REQUESTED`: the reviewers who requested changes.
     `jq -r '.[] | select(.state=="CHANGES_REQUESTED") | .user.login' /tmp/pr<N>-reviews.json | sort -u`
   - Otherwise: the reviewers already on the PR (`gh pr view <N> --json reviewRequests,reviews`).
2. Re-request:
   ```
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/requested_reviewers -f 'reviewers[]=<login>'
   ```
3. Do **not** post a top-level "ready for re-review" comment — the re-request is the signal.

**Skip Step 8 only when:** no replies were posted in Step 6, or user passed `--no-rerequest`.

### Step 9: Report final summary

Table: **# | File | Status | Linear | Thread | Reply | Pattern**. The Pattern column carries the Step 4.5 outcome for each finding (e.g. `A7`, `new D6`, `skipped — typo`). An empty Pattern cell is a Step 4.5 miss — go back and fill it before declaring the workflow complete.

Plus line "Re-requested review from: @reviewer".

## User briefing — lower-resolution Korean framing

When briefing back to the user (NOT the reply text posted to GitHub), default to **Korean, one altitude higher than the reviewer comment**. The user is the author of the PR and already knows the code; what they need is the *shape* of the round-trip, not a literal translation.

**Rules:**
- **Frame, don't translate.** Lead with what larger goal the PR serves and what invariant / contract / subsystem each finding actually pokes at. Then say what was done about it. The reviewer's exact words are not the value-add; the framing is.
- **Group by theme, not by comment id.** Two findings that both attack the same invariant from different angles get one paragraph, not two literal translations.
- **Mark deferrals plainly.** If something was acknowledged-but-not-fixed (P3 nit, follow-up PR), say so in one sentence with the reason — don't re-translate the reviewer's full Recommendation block.
- **End with state, not reply text.** Last line names the SHA pushed, that replies are posted inline, and that re-review is requested. Do NOT paste the GitHub reply bodies back to the user — they wrote the PR; they can read the thread.

**Applies to:** Step 3 listing (when summarizing items for proceed-confirmation) and Step 9 final summary. Step 6 reply *drafts* shown for batch approval stay as the literal English bodies that will hit GitHub — those are not for briefing.

Reference example: see the closing brief on PR #166 (2026-04-25) — "ADR-0031 인변량 → 두 우회로 닫음 + 한 건 후속 PR로 이월" framing rather than per-comment translation.

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
