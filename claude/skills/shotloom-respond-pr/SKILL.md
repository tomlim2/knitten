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

Save each fetch to a per-PR cache file so later steps (Step 8 reviewer roster) can re-read without re-fetching:

```bash
gh pr view "$ARGUMENTS" --json title,body,headRefName,baseRefName,state,number,reviewRequests \
  > "/tmp/pr${ARGUMENTS}-view.json"
gh api "repos/CINEV/shotloom/pulls/${ARGUMENTS}/comments" \
  > "/tmp/pr${ARGUMENTS}-comments.json"
gh api "repos/CINEV/shotloom/pulls/${ARGUMENTS}/reviews" \
  > "/tmp/pr${ARGUMENTS}-reviews.json"
```

- `pr<N>-comments.json` — inline (`id`, `path`, `line`, `body`, `diff_hunk`)
- `pr<N>-reviews.json` — reviews including `state` and `user.login`; required by Step 8 to compute the `CHANGES_REQUESTED` reviewer roster.
- `pr<N>-view.json` — current `reviewRequests` for the fallback re-request path.

Checkout PR branch if needed: `git checkout <headRefName> && git pull`.

### Step 2.5: Classify each item by scope

Apply [`~/.claude/standards/shotloom-pr-scope-policy.md`](../../standards/shotloom-pr-scope-policy.md):

| Bucket | Step 2.5 action | Step 4 action | Step 6 reply |
|---|---|---|---|
| **in-scope — fix now** | route to Step 4 fix queue | apply fix | "Fixed in `<sha>`. …" |
| **in-scope — defer with follow-up** (large but legitimate scope inside this PR's domain) | route to Step 4 with `defer-with-issue` flag | acknowledge, file STL-NN via `/shotloom-linear-create-issue` | "Follow-up tracked as STL-NN. …" |
| **out-of-scope** (different subsystem / unrelated concern) | surface to user as "needs separate issue"; do NOT fix, do NOT reply, do NOT resolve thread | skip | (no reply) |
| **ambiguous (≥9/10)** | surface to user for routing decision; do NOT fix, do NOT reply, do NOT resolve | skip until user decides | (no reply) |

**Key distinction:** "out-of-scope" and "defer-with-issue" both involve filing a Linear ticket, but they differ on whether to reply on this PR. Out-of-scope = the comment shouldn't have been on this PR at all → no reply, surface separately to user. Defer-with-issue = legitimate concern inside the PR's domain that's too large to land here → reply with STL-NN link so the reviewer sees the trail. Step 7 only governs the in-scope rows.

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

### Step 5: Validate + commit + push + refresh PR body

Order matters: gates first, then commit, then push, then PR body. Updating the PR description before gates pass leaves the body claiming a state the branch hasn't reached — when a gate then fails the body and the branch contradict each other.

1. Run the canonical Shotloom gate bundle by delegating to `/shotloom-check-gates` (full, default):
   ```
   cargo fmt --check
   cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
   cargo check --workspace --exclude shotloom-desktop
   cargo test --workspace --exclude shotloom-desktop
   node scripts/validate-doc-paths.mjs
   ```
   `shotloom-desktop` is excluded per `rules/shotloom-git.md`. **Do not** substitute crate-specific `cargo test -p` lines — review-response pushes must validate against the same workspace test set as pre-PR pushes, otherwise regressions in unrelated crates surface only after CI fails. Targeted `cargo test -p <crate> --lib` invocations are fine as **additive diagnostics** when narrowing a failing test, but they never replace the workspace bundle.

2. Fix failing tests before proceeding. Broken tests block the PR.

3. On green:
   - `git add <files>` (by name, not `-A`)
   - Commit per `docs/guidelines/commit-guideline.md` (conventional, imperative, ≤80 char subject)
   - `git push`

4. **After push lands**, refresh the PR description so it matches the now-pushed branch:
   - Read current body, update Summary (new fixes, deleted files, deps), refresh Validation (test counts, doc-path counts), correct stale statements.
   - `gh pr edit $ARGUMENTS --body "..."`
   - If a gate failed at step 1 and you never pushed, do NOT touch the PR body — the body still describes the prior good state.

### Step 6: Post inline replies + queue reviewer re-request (MUST get approval)

Draft a reply per resolved item:
- **Fixed:** "Fixed in <sha-short>. <brief description>"
- **Deferred (with issue):** "Follow-up tracked as STL-NN. <rationale>"
- **Deferred (no issue yet):** "Acknowledged — will file a follow-up before resolving."
- **Disagreed:** "<technical rationale>"

For suppressed items, draft one review-level summary reply.

Also draft the **reviewer re-request roster** for Step 8 right now, so the user approves replies and the re-request as one batch (Step 8 is itself a PR action and falls under the same per-PR-action approval gate per `rules/shotloom-git.md` and `rules/git.md`):

```
Re-request from: @reviewer1, @reviewer2  (rationale: CHANGES_REQUESTED resolved | review round complete)
```

**Show ALL reply drafts AND the re-request roster in one batch. Wait for explicit user approval. NEVER auto-post any of them.** One approval covers the whole batch (replies + re-request); a second approval is not required at Step 8.

Post replies via `/replies` endpoint:
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

Re-request is the signal that "I'm done with this round; please re-review." It runs whenever Step 6 posted at least one reply — independent of PR review state and independent of whether threads are resolved. **Approval was already collected in Step 6's batch** — do not prompt the user again here.

1. Identify reviewers to re-request from the cache files Step 2 saved:
   - If the PR's review state was `CHANGES_REQUESTED`: the reviewers who requested changes.
     ```
     jq -r '.[] | select(.state=="CHANGES_REQUESTED") | .user.login' "/tmp/pr${ARGUMENTS}-reviews.json" | sort -u
     ```
   - Otherwise: the union of pending review requests + everyone who has reviewed (drop the author).
     ```
     jq -r '
       (.reviewRequests[]?.login),
       (.reviews[]?.user.login)
     ' "/tmp/pr${ARGUMENTS}-view.json" "/tmp/pr${ARGUMENTS}-reviews.json" | sort -u
     ```
   - If neither cache file exists (e.g. cleared between sessions), re-fetch with `gh pr view <N> --json reviewRequests,reviews` rather than guessing.
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

**EXCEPTION:** Step 6 (posting replies + reviewer re-request roster) STILL requires explicit batch approval per `~/.claude/rules/shotloom-git.md` (the Shotloom-specific override of `rules/git.md`). The auto-commit/auto-push exemption in `shotloom-git.md` covers commits and pushes only — PR comments and reviewer-roster mutations are explicitly outside that exemption for this skill. (`/shotloom-auto-pr` carries its own broader exemption; `/shotloom-respond-pr` does not.)

## Subagent Usage

- **Step 2** — parallel agents for PR metadata, comments, reviews.
- **Step 4** — dispatch subagents (`model: "sonnet"`) for independent files.
- **Step 5** — parallel `cargo fmt`, `clippy`, `validate-doc-paths` via background Bash.

Main thread orchestrates: gather results, stage, commit, post replies.

## Binding Rules

- **Repo-specific rule wins.** `~/.claude/rules/shotloom-git.md` is the primary source for this skill (auto-commit/auto-push exemption, gh account, identity, gate set). `~/.claude/rules/git.md` is supplementary — it applies only where shotloom-git.md does not override.
- **Reply inline on each individual review comment**, NOT top-level PR comment (per `rules/git.md`).
- **Suppressed items** — evaluate honestly; OK to defer scope-exceeding work.
- **Commit message** — conventional, imperative, ≤80 char subject (per `docs/guidelines/commit-guideline.md` in the shotloom repo).
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
