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
gh pr view "$ARGUMENTS" --json title,body,headRefName,baseRefName,state,number,reviewRequests,reviewDecision \
  > "/tmp/pr${ARGUMENTS}-view.json"
gh api "repos/CINEV/shotloom/pulls/${ARGUMENTS}/comments" \
  > "/tmp/pr${ARGUMENTS}-comments.json"
gh api "repos/CINEV/shotloom/pulls/${ARGUMENTS}/reviews" \
  > "/tmp/pr${ARGUMENTS}-reviews.json"
```

- `pr<N>-comments.json` — array of inline comments (`id`, `path`, `line`, `body`, `diff_hunk`, `user.login`)
- `pr<N>-reviews.json` — array of reviews with `state` and `user.login`; Step 8 reads this to compute the `CHANGES_REQUESTED` reviewer roster.
- `pr<N>-view.json` — object with current `reviewRequests`, `reviewDecision`, and PR metadata. Step 8 uses `reviewDecision` to decide which roster path to take and `reviewRequests` for the fallback union.

Note the file shapes are different (object vs array). Step 8 jq must run filters against the matching file — never mix `.reviewRequests` and `.[]` filters in one jq invocation across both files.

Checkout PR branch if needed: `git checkout <headRefName> && git pull`.

### Step 2.5: Classify each item by scope AND justification

**Two axes, applied in order. A finding only reaches Step 4 if BOTH pass.**

#### Axis 1 — Scope check

Apply shotloom's `.claude/standards/shotloom-pr-scope-policy.md`:

| Bucket | Step 2.5 action | Step 4 action | Step 6 reply |
|---|---|---|---|
| **in-scope — fix now** | route to Axis 2 (justification) | apply fix if Axis 2 passes | "Fixed in `<sha>`. …" |
| **in-scope — defer with follow-up** (large but legitimate scope inside this PR's domain) | route to Axis 2 (justification) | acknowledge, file STL-NN via `/shotloom-linear-create-issue` | "Follow-up tracked as STL-NN. …" |
| **out-of-scope** (different subsystem / unrelated concern) | surface to user as "needs separate issue"; do NOT fix, do NOT reply, do NOT resolve thread | skip | (no reply) |
| **ambiguous (≥9/10)** | surface to user for routing decision; do NOT fix, do NOT reply, do NOT resolve | skip until user decides | (no reply) |

**Key distinction:** "out-of-scope" and "defer-with-issue" both involve filing a Linear ticket, but they differ on whether to reply on this PR. Out-of-scope = the comment shouldn't have been on this PR at all → no reply, surface separately to user. Defer-with-issue = legitimate concern inside the PR's domain that's too large to land here → reply with STL-NN link so the reviewer sees the trail. Step 7 only governs the in-scope rows.

Ambiguity scoring: ≤8 = pick best interpretation and proceed; ≥9 = surface.

#### Axis 2 — Justification check (reviewers can be wrong)

For every in-scope finding, before adding it to the Step 4 fix queue, run a justification check. The reviewer is not the authority — the standard is. A finding is actionable only if the rule it cites actually applies and the proposed fix actually improves things.

| Bucket | When to use | Step 2.5 action | Step 4 action | Step 6 reply |
|---|---|---|---|---|
| **justified — fix as recommended** | rule cited maps to the finding; recommended fix is the right shape and the right strength | proceed to Step 4 | apply as recommended | "Fixed in `<sha>`. …" |
| **justified — fix differently** | rule applies, but the recommended fix is weaker / stronger / shaped differently than the rule justifies (e.g. reviewer says "downgrade `pub` to `pub(crate)`" but the alias has zero consumers and full deletion is cleaner; or reviewer says "extract to new crate" but a sentinel test pins the same invariant for free) | **surface to user as "reviewer says X, my read is Y, your call"** before deciding; do NOT silently go stronger or weaker than the recommendation | apply the agreed-on fix | "Fixed in `<sha>`. … [explain divergence from recommendation, citing rule]" |
| **pushback candidate** | rule cited doesn't actually apply; reviewer mis-read the diff; the cure is worse than the disease; symmetric-treatment argument is actually asymmetric; finding is real but better fixed by a broader follow-up the reviewer themselves filed | **surface to user with the counterpoint framing** before replying; do NOT auto-fix and do NOT auto-defer-with-issue | skip until user decides | drafted with user input; cites the rule (or the reason the cited rule doesn't apply), not the reviewer |
| **disagree outright** | rule cited is correctly named but the reviewer's interpretation is wrong | surface to user for the disagree-or-fix decision | typically skip | "<technical rationale>" — never `Done` / `Fixed` |

Justification triggers (any one is enough to drop a finding out of "justified — fix as recommended"):

- The cited rule's section is about a different defect class (e.g. "speculative public API" cited at a `pub` symbol that has a live consumer is a misread).
- The recommended fix is **stronger** than the rule requires (rule says "no `pub` without consumer"; finding has zero consumers; reviewer says "downgrade to `pub(crate)`" but **delete entirely** is the rule's natural conclusion). Stronger != worse, but it's a judgment call worth surfacing.
- The recommended fix is **weaker** than the rule requires (rule says "no in-place ADR rewrite"; reviewer says "add `[Updated]` parenthetical"; full section-level supersession banner may actually be the rule's natural conclusion).
- Symmetric-treatment argument: reviewer cites a precedent set elsewhere in the PR ("apply ADR-0023 §6 fix to ADR-0024 §1"), but the two cases differ in a material way (e.g. one is a Decision rewrite, the other is a Context bullet update; the Decision is durable record, Context bullets aren't).
- Reviewer themselves filed a broader follow-up issue tracking the pattern, AND that broader issue is the natural home for this fix. Doing it twice (once narrowly here, once broadly there) is churn.
- Reviewer admitted to missing it in the prior pass ("I missed in the prior round"). This isn't a disqualifier on its own — they may be right now and wrong before — but it's a flag to verify the new reading independently before fixing.

**Operational rule:** when a finding lands in `justified — fix differently` or `pushback candidate`, do NOT silently execute the reviewer's exact recommendation. Surface the alternative to the user with one of these framings before Step 3 default-approval kicks in:

- "Reviewer recommends X. My read is Y because Z. Which way?"
- "Reviewer cites rule R, but R is about defect class A and this is class B. Skip the fix and reply with the rule mismatch?"
- "Reviewer asks for symmetric treatment with prior fix P. The two cases differ in W. Apply or push back?"

**Why this exists:** PR #188 round 2 (2026-04-28) trigger — 4 actionable findings were addressed without explicitly asking "should this be in this PR" (e.g. ADR-0024 §1 supersession when the broader pattern is already tracked in STL-220) or "is the reviewer's symmetric-treatment argument actually airtight." User feedback after the fact: always evaluate scope AND justification, reviewer can be wrong, do not blindly accept and fix.

### Step 3: List feedback items

Parse all comments into a numbered table (# | Source | File | Line | Summary | **Scope** | **Justification**). Inline = has `id` (directly repliable); suppressed = review body items.

The **Scope** column carries the Axis 1 bucket from Step 2.5 (`fix-now` / `defer-with-issue` / `out-of-scope` / `ambiguous`). The **Justification** column carries the Axis 2 bucket (`justified-as-rec` / `justified-fix-different` / `pushback` / `disagree`). A row only auto-proceeds to Step 4 fix queue if Scope is in-scope AND Justification is `justified-as-rec`. Any other combination requires explicit user input before fixing.

"Default: all" no longer applies blindly. The default is: every `in-scope + justified-as-rec` row proceeds; every other row gets surfaced for user decision. Invoking this skill authorizes the workflow on the un-flagged rows; the flagged ones still need a per-row call.

### Step 4: Resolve each item

For each finding routed here from Step 2.5 / Step 3:

1. Read target file at indicated line with context.
2. **Justification beat (mandatory, before applying anything).** Re-read the cited rule at its current location. Confirm:
   - The rule's defect class actually matches the finding (not just the keyword).
   - The recommended fix is the right shape and the right strength for that rule (not weaker, not stronger).
   - If a precedent inside this same PR is cited for symmetric treatment, the precedent case and this case match on the dimensions that the rule cares about.
   - If the reviewer themselves tracks the broader pattern in another issue, the in-this-PR fix is not duplicating that follow-up.

   If any of these checks fail, route the finding back to Step 2.5 Axis 2 (`justified-fix-different` / `pushback` / `disagree`) and surface to the user — do NOT proceed to step 3 below.
3. Choose action:
   - **Direct suggestion** (code block) → apply via Edit if correct
   - **Valid concern, justified as recommended** → implement the fix exactly as recommended
   - **Valid concern, justified differently** → apply the user-agreed fix (Step 2.5 Axis 2 already surfaced this); reply text cites the rule and explains the divergence from the recommendation
   - **Design concern / large scope** → acknowledge, defer to STL-NN
   - **Pushback / disagree** → prepare explanation for reply citing the rule (or the reason the cited rule doesn't apply)
4. Apply the fix (also PR description + docs if implied).
5. Briefly report each change, including the justification verdict (`as-rec` / `differently — <reason>` / `pushback` / `disagree`).

### Step 4.5: Cross-check fix against in-repo review spec (CRITICAL)

After a fix lands, confirm it aligns with the rules in `docs/guidelines/review-rust.md`. If the finding surfaces a class of defect not yet covered by the in-repo spec, draft a follow-up to amend that file in a separate PR.

For each resolved finding:
1. Re-read `docs/guidelines/review-rust.md` and `docs/guidelines/code-review-guideline.md`.
2. **Match existing rules first.** If the finding maps to an existing rule, note the section name in the capture block.
3. **If nothing matches**, flag as a potential new-rule candidate to surface to the user. Do NOT silently amend the in-repo spec from this skill — that requires its own PR.

Filters:
- **Match** → finding is covered by an existing in-repo rule.
- **New-rule candidate** → finding represents a recurring defect class not yet documented.
- **Skip** → ad-hoc rename, typo, local semantic bug without recurring shape.

**Mandatory output — one line per resolved finding, before Step 5 begins:**

```
Review-rule capture:
  finding 1 (<file>:<line>) → matched <section name in review-rust.md>
  finding 2 (<file>:<line>) → new-rule candidate: <one-line description, surface to user>
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
   `shotloom-desktop` is excluded per `~/.claude/rules/shotloom.md`. **Do not** substitute crate-specific `cargo test -p` lines — review-response pushes must validate against the same workspace test set as pre-PR pushes, otherwise regressions in unrelated crates surface only after CI fails. Targeted `cargo test -p <crate> --lib` invocations are fine as **additive diagnostics** when narrowing a failing test, but they never replace the workspace bundle.

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

Also draft the **reviewer re-request roster** for Step 8 right now, so the user approves replies and the re-request as one batch (Step 8 is itself a PR action and falls under the same per-PR-action approval gate per `~/.claude/rules/shotloom.md` and `rules/git.md`):

```
Re-request from: @reviewer1, @reviewer2  (rationale: CHANGES_REQUESTED resolved | review round complete)
```

**Show ALL reply drafts AND the re-request roster in one batch. Wait for explicit user approval. NEVER auto-post any of them.** One approval covers the whole batch (replies + re-request); a second approval is not required at Step 8.

Post **inline** replies via the `/replies` endpoint (one per inline comment id):
```
gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<comment_id>/replies -f body="<reply>"
```

Post the **suppressed-item summary reply** as a new review with `event=COMMENT`. Suppressed items are review-body items without an inline comment id; they cannot use `/replies`. The top-level PR comment endpoint is forbidden by binding rules. The correct surface is the same `/reviews` endpoint a human reviewer uses to leave a review-level note:
```
gh api -X POST /repos/CINEV/shotloom/pulls/<N>/reviews \
  -f event=COMMENT \
  -f body="<one summary reply addressing all suppressed items, with sub-bullets per finding>"
```
Use this exactly once per cycle even when there are multiple suppressed items — bundle them in one review body. If there are zero suppressed items, skip this call entirely. Do NOT use `/issues/<N>/comments` (top-level) and do NOT pass `event=APPROVE` or `event=REQUEST_CHANGES` — the author replying to their own PR review must be `COMMENT` only.

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

1. Identify reviewers to re-request from the cache files Step 2 saved. The two files have different shapes — view is an object, reviews is an array — so jq filters MUST run against the matching file. Mixing them in one `jq … fileA fileB` invocation crashes with `Cannot index array with string "reviewRequests"`.

   ```bash
   # Branch on cached reviewDecision (object field on view)
   DECISION=$(jq -r '.reviewDecision // ""' "/tmp/pr${ARGUMENTS}-view.json")

   if [[ "$DECISION" == "CHANGES_REQUESTED" ]]; then
     # Reviewers who requested changes — array of review records
     jq -r '.[] | select(.state=="CHANGES_REQUESTED") | .user.login' \
       "/tmp/pr${ARGUMENTS}-reviews.json" | sort -u
   else
     # Union of pending review requests + everyone who has reviewed.
     # Run two jq invocations against the right file each, then union.
     {
       jq -r '.reviewRequests[]?.login' "/tmp/pr${ARGUMENTS}-view.json"
       jq -r '.[]?.user.login' "/tmp/pr${ARGUMENTS}-reviews.json"
     } | sort -u
   fi | grep -v "^$(gh api user --jq '.login')$" || true   # drop self from roster (GitHub rejects self re-request)
   ```

   - If neither cache file exists (e.g. cleared between sessions), re-fetch with `gh pr view <N> --json reviewRequests,reviews,reviewDecision` rather than guessing. The shape returned by `gh pr view --json reviews` differs from the REST `/reviews` array — when re-fetching this way both `.reviewRequests` and `.reviews` are object fields on a single document, so a single jq invocation is fine on the re-fetch path.
2. Re-request:
   ```
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/requested_reviewers -f 'reviewers[]=<login>'
   ```
3. Do **not** post a top-level "ready for re-review" comment — the re-request is the signal.

**Skip Step 8 only when:** no replies were posted in Step 6, or user passed `--no-rerequest`.

### Step 9: Report final summary

Table: **# | File | Status | Linear | Thread | Reply | Pattern**. The Pattern column carries the Step 4.5 outcome for each finding (e.g. `A7`, `new D6`, `skipped — typo`). An empty Pattern cell is a Step 4.5 miss — go back and fill it before declaring the workflow complete.

Plus line "Re-requested review from: @reviewer".

## User briefing — Korean framing + full translation block

When briefing back to the user (NOT the reply text posted to GitHub), default to Korean. The briefing has **two mandatory parts** serving different purposes — both must be present, neither replaces the other.

### Part 1 — Framing (altitude: one above the reviewer comment)

Purpose: give the user the *shape* of the round-trip so they can decide what it means for the PR without reading every comment verbatim.

- **Frame, don't translate HERE.** Lead with what larger goal the PR serves and what invariant / contract / subsystem each finding pokes at. Then say what was done about it. In this part the reviewer's exact words are not the value-add; the framing is.
- **Group by theme, not by comment id.** Two findings that attack the same invariant from different angles get one paragraph.
- **Mark deferrals plainly.** If something was acknowledged-but-not-fixed (P3 nit, follow-up PR), say so in one sentence with the reason — don't re-translate the reviewer's full Recommendation block here.
- **End with state.** Last line names the SHA pushed, that replies are posted inline, and the re-request decision (sent / skipped / why).

### Part 2 — Full Korean translation block (verbatim, per finding)

Purpose: give the user an **auditable Korean record** of "what was said to me and what I said back" without them having to open the GitHub thread.

For every finding addressed in this response-pr cycle (both `fix` and `keep-as-is` rows from Step 2.5; skip `out-of-scope` and `ambiguous` rows since those have no reply):

- **리뷰어 원문 완역:** full Korean translation of the reviewer comment, verbatim. Preserve structure — P-level tag, bold title, reasoning, `Recommendation:` line.
- **내 리플라이 완역:** full Korean translation of the English reply that was (or will be) posted inline on GitHub. Do not summarize — translate the reply as posted.

**This block coexists with Part 1 and does not replace it.** Part 1 tells the user *what it means*; Part 2 gives them the *verbatim audit trail* in their native language. Yes, it means the same content appears twice at different altitudes — that is the point.

### When each part runs

| Step | Part 1 framing | Part 2 translation block |
|------|----------------|---------------------------|
| Step 3 (item listing for proceed-confirmation) | required | optional — items haven't been addressed yet, so there are no replies to translate yet. Skip unless user explicitly asks. |
| Step 6 (batch approval of drafts) | not required — the batch is about approving English drafts that will actually post | required when drafts exist — translate reviewer comment + draft English reply for each, so the user can verify the reply addresses the point before it goes live. The English drafts themselves remain the authoritative text that hits GitHub. |
| Step 9 (final summary) | required | required — every resolved finding gets a translation block |

Reference example: closing brief on PR #172 (2026-04-25) — framing summary + per-finding `리뷰어 원문 완역` / `내 리플라이 완역` block.

## Autonomy

Invoking this skill is blanket authorization for the workflow. **Do NOT pause for per-step approval.** The following actions are auto-approved inside the skill:

- File edits, `git add`, `git commit`, `git push` (per `~/.claude/rules/shotloom.md` auto-commit exemption).
- `gh pr edit $ARGUMENTS --body "..."` in Step 5-4 — **body-only** edit, scoped to refreshing Summary / Validation / fix log so the PR description matches the now-pushed branch. This is not a state-changing PR mutation; it cannot affect mergeability, base, title, draft state, or labels. Only stop on CI failure or genuinely unexpected event.

**EXCEPTION (still requires explicit per-action approval, even inside this skill):**

- Step 6 (posting inline replies + the suppressed-item review-level summary + reviewer re-request roster) — show all drafts in one batch and wait for explicit user OK per `~/.claude/rules/shotloom.md` and `~/.claude/rules/git.md`. The auto-commit/auto-push exemption covers commits and pushes only — any GitHub-visible comment, review submission, or reviewer-roster mutation by this skill stays gated.
- `gh pr edit --base`, `--title`, `--draft`, label changes — never done by this skill; if they were, they would still need approval.
- `gh pr merge`, `gh pr close`, `gh pr reopen`, `gh pr ready`, `gh pr update-branch`, `gh pr review --approve`/`--request-changes`, top-level PR comments via `/issues/<N>/comments` — never done by this skill.

(`/shotloom-auto-pr` carries its own broader exemption that auto-approves Step 6 inside its react cycle. `/shotloom-respond-pr` does not.)

## Subagent Usage

- **Step 2** — parallel agents for PR metadata, comments, reviews.
- **Step 4** — dispatch subagents (`model: "sonnet"`) for independent files.
- **Step 5** — parallel `cargo fmt`, `clippy`, `validate-doc-paths` via background Bash.

Main thread orchestrates: gather results, stage, commit, post replies.

## Binding Rules

- **Repo-specific rule wins.** `~/.claude/rules/shotloom.md` is the primary source for this skill (auto-commit/auto-push exemption, gh account, identity, gate set). `~/.claude/rules/git.md` is supplementary — it applies only where shotloom-git.md does not override.
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
- `~/.claude/rules/git.md`, `~/.claude/rules/shotloom.md`
- `docs/guidelines/review-rust.md` (in shotloom repo) — Rust review SSOT

## Additional Resources

For the graphql thread-resolution queries, detailed reply templates, and the Pattern-capture filter rationale, see [reference.md](reference.md).
