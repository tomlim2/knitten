---
description: Read Shotloom PR review comments, fix issues, commit, and post inline replies
argument-hint: "<pr-number>"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-respond-pr

Read GitHub PR review comments on a Shotloom PR, resolve each item, commit fixes, and post inline replies.

## Arguments

- `<pr-number>` - GitHub PR number (e.g., 85)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /shotloom-respond-pr <pr-number>

## Workflow

### Step 1: Sanity check

1. Validate `$ARGUMENTS` contains a PR number. If missing, show usage and stop.
2. Run `gh auth status` — confirm `tomlim2` account is `Active: true`.
3. Run `git log -1 --format="%an <%ae>"` — confirm `tomlim2 <deemo@vonvon.me>`.
4. Confirm current repo is `CINEV/shotloom` (`gh repo view --json nameWithOwner -q .nameWithOwner`).

If any check fails, report the issue and stop.

### Step 2: Read PR + comments

Fetch all review data in parallel:

1. `gh pr view $ARGUMENTS --json title,body,headRefName,baseRefName,state,number` — PR metadata.
2. `gh api repos/CINEV/shotloom/pulls/$ARGUMENTS/comments` — inline review comments (with `id`, `path`, `line`, `body`, `diff_hunk`).
3. `gh api repos/CINEV/shotloom/pulls/$ARGUMENTS/reviews` — review summaries (contains suppressed/low-confidence items in body).

Checkout the PR branch if not already on it:
```
git checkout <headRefName>
git pull
```

### Step 3: List feedback items

Parse all comments into a numbered table and show to the user:

```
## Review Feedback — PR #<N>

| # | Source | File | Line | Summary |
|---|--------|------|------|---------|
| 1 | inline | docs/adr/adr-0025.md | 77 | Wrong file path for build_from_bytes |
| 2 | inline | docs/tech-debt/vrm-rest.md | 21 | Typo SS3 → §3 |
| 3 | suppressed | vrm_extract.rs | 846 | Unchecked indexing on untrusted input |
| ... | | | | |
```

- **inline** = review comments with `id` (can be replied to directly)
- **suppressed** = low-confidence items from review body (reply on the review itself or as top-level if needed)

Ask user which items to address. Default: all. Then proceed without further approval — the user has authorized the full workflow by invoking this skill.

### Step 4: Resolve each item

For each selected feedback item:

1. Read the target file at the indicated line with surrounding context.
2. Evaluate the feedback:
   - **Direct suggestion** (code block in comment) → apply via Edit if correct.
   - **Valid concern** → implement the fix.
   - **Design concern / large scope** → note as "acknowledged, will address in follow-up STL-NN" (create Linear issue if needed).
   - **Disagree** → prepare explanation for reply.
3. Apply the fix. If the feedback also implies PR description or doc changes, apply those too.
4. After each fix, briefly report what was changed.

### Step 4.5: Capture defect as a reusable pattern

After a fix lands, decide whether the defect represents a **new pattern class** or a new instance of an existing one. This prevents the same finding from resurfacing on a future PR.

For each resolved finding:

1. Open `~/.claude/standards/review-code-rust.md` and re-read the Pattern A–G taxonomy (plus the self-review checklist at the bottom).
2. **Match against existing patterns first.** If the finding is a clearer / more dramatic instance of an already-listed pattern (A1, B2, C3, etc.), add a one-line secondary "Real defect" reference to that pattern citing this PR and the comment ID.
3. **If nothing matches, draft a new pattern entry.** Write a pattern stub with:
   - Title line: `### X8 — <one-line pattern name>` (use the next free number in the relevant group, or open a new Group letter if no group fits)
   - Short description (2–3 sentences)
   - `**Self-check:**` bash one-liner or a "for every X, ask Y" rule
   - `**Real defect:**` line with PR link and comment ID
4. Add the new pattern to the Self-review checklist block at the bottom of the standard.
5. Append a one-line entry to the Provenance section noting the date, PR, and pattern added.

Do **not** update the standard for every trivial fix. Use these filters:
- Add → the fix is "replace this kind of construct with that kind", the rule is gr[ae]p-able against any future diff, and a senior reviewer would have caught it mechanically.
- Skip → fix is ad-hoc (rename for clarity, data typo, local semantic bug without a recurring shape).

Report to user at the end: "Added Pattern X to review-code-rust.md" or "No new pattern — fix was {reason}."

### Step 5: Validate + commit

1. **Always update the PR description** after resolving feedback:
   - `gh pr view $ARGUMENTS --json body -q .body` to read current body
   - Update the Summary section to reflect new changes (added fixes, deleted files, new deps, etc.)
   - Update the Validation section with fresh test counts and doc-path counts
   - Remove or correct any statements that are no longer true
   - `gh pr edit $ARGUMENTS --body "..."` to push the update

2. Run Shotloom CI-equivalent gates (parallel where possible):
   ```
   cargo fmt --check
   cargo clippy --workspace -- -D warnings
   cargo check --workspace --exclude shotloom-desktop
   cargo test -p shotloom-gltf --lib
   cargo test -p shotloom-retarget --lib
   node scripts/validate-doc-paths.mjs
   ```

3. If any test fails, fix the failing test or underlying code before proceeding. This is part of the review response — broken tests block the PR just like a review comment does.

4. If all gates pass:
   - `git add` the changed files (by name, not `-A`)
   - Draft commit message following `docs/guidelines/commit-guideline.md`:
     ```
     fix(docs): address PR #<N> review feedback

     - <item 1 summary>
     - <item 2 summary>

     Related to STL-NN
     ```
   - `git commit`
   - `git push`

### Step 6: Post inline replies

1. For each resolved inline comment, draft a reply:
   - Fixed items: "Fixed in <commit-sha-short>. <brief description of change>"
   - Acknowledged items: "Acknowledged — tracking as STL-NN for follow-up."
   - Disagreed items: "<brief technical rationale>"

2. For suppressed/low-confidence items from the review body, draft a single review-level reply summarizing which were addressed and which are deferred.

3. **Show ALL drafted replies to user in one batch:**
   ```
   ## Draft Replies

   ### Comment #1 (id: 3091862347) — adr-0025:77
   > Fixed in abc1234. Updated `From` column from `vrm_extract.rs` to `vrm_rest.rs`.

   ### Comment #2 (id: 3091862400) — tech-debt:21
   > Fixed in abc1234. Corrected `SS3` to `§3`.

   Post these replies? (yes/no)
   ```

4. **Wait for explicit user approval.** NEVER auto-post.

5. Post each reply, then resolve the conversation thread:
   ```
   # Reply
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<comment_id>/replies -f body="<reply>"
   ```

6. After all replies are posted, fetch review thread IDs and resolve each fixed thread:
   ```
   # Get thread IDs (map comment databaseId to thread id)
   gh api graphql -f query='query {
     repository(owner: "CINEV", name: "shotloom") {
       pullRequest(number: <N>) {
         reviewThreads(first: 50) {
           nodes { id isResolved comments(first:1) { nodes { databaseId } } }
         }
       }
     }
   }'
   # Resolve each thread
   gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "<PRRT_...>"}) { thread { isResolved } } }'
   ```

6. Report final summary:
   ```
   ## Summary

   | # | File | Status | Reply posted |
   |---|------|--------|-------------|
   | 1 | adr-0025.md:77 | fixed | yes |
   | 2 | tech-debt:21 | fixed | yes |
   | 3 | vrm_extract.rs:846 | deferred (STL-NN) | yes |
   ```

## Autonomy

Invoking this skill is blanket authorization for the full workflow. **Do NOT pause for per-step approval.** Specifically:
- Code edits, commits, pushes, and inline reply posting all proceed automatically.
- Only stop if a CI gate fails or something genuinely unexpected happens.
- The user reviews the final summary at the end, not each intermediate step.

## Subagent Usage

Use the Agent tool to parallelize independent work:
- **Step 2** — launch parallel agents to fetch PR metadata, comments, and reviews simultaneously.
- **Step 4** — if multiple feedback items touch unrelated files, dispatch subagents (`model: "sonnet"`) to resolve them in parallel. Each subagent receives the comment body, target file path + line range, and applies the fix in the worktree.
- **Step 5 validation** — run `cargo fmt --check`, `cargo clippy`, and `node scripts/validate-doc-paths.mjs` in parallel via background Bash calls.

Keep the main thread as orchestrator: gather results, stage files, commit, post replies.

## Binding Rules

- **Reply inline on each individual review comment**, NOT as a single top-level PR comment (per `~/.claude/rules/git.md`).
- **Suppressed/low-confidence items**: evaluate honestly. OK to reply "acknowledged, tracking as future work" if fix scope exceeds current PR.
- **Commit message** follows `docs/guidelines/commit-guideline.md` — conventional commits, imperative mood, ≤80 char subject.
- **No Co-Authored-By line** (per `~/.claude/rules/git.md`).

## Common Failures

| Symptom | Fix |
|---------|-----|
| `gh auth` shows wrong account | `gh auth switch --user tomlim2` |
| Comment ID not found (404) | PR may have been force-pushed; re-fetch comments |
| Reply posts as top-level | Use `/comments/<id>/replies` endpoint, not `/issues/<N>/comments` |
| Cargo clippy fails after fix | Fix clippy warnings before committing |
| Inline reply rejected on rename-detected diff | GitHub's rename-aware diff only accepts replies on lines present in the original `diff_hunk`. Read the comment's `diff_hunk` field first and reply at a line that appears there — do NOT bisect line numbers on the live PR. Each failed attempt leaves a visible "superseded" artifact reviewers see. If artifacts already exist, include a brief one-line apology in the next successful reply (e.g., "Apologies for the earlier superseded entries — API-bisection artifacts while locating the accepted line"). |

## Related

- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation workflow
- `~/.claude/skills/shotloom-review-before-pr/SKILL.md` — pre-PR self-review
- `~/.claude/rules/git.md` — git + PR comment rules
- `~/.claude/rules/shotloom-git.md` — shotloom-specific pre-PR checks
- `~/.claude/standards/review-code-rust.md` — 22-pattern Rust review checklist
