---
description: Read Shotloom PR review comments, fix issues, commit, and post inline replies
argument-hint: "<pr-number>"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/git-defaults.md
exclude-when: unreal,obsidian
---

# shotloom-respond-pr

Read GitHub PR review comments on a Shotloom PR, fix each item, commit, post inline replies, and re-request review. Never auto-resolves threads — the reviewer owns resolution.

Scope: GitHub PR review response only. Input starts from GitHub PR review
state; output returns to GitHub PR review surfaces. Linear/STL links are
deferred-reply evidence, not this skill's owned work queue.

## Mandatory First Gate

Before any other command, confirm the active GitHub login, git identity, and PR assignment:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
node "$knitten_root/agent/lib/shotloom-github-guard.mjs" --require-git-author --pr "$ARGUMENTS"
```

If this check fails, stop. Do not read comments, checkout, edit, commit, push,
refresh the PR body, build a reply plan, post replies, resolve threads, or
re-request review.

## Arguments

- `<pr-number>` - GitHub PR number (e.g., 85)

**If no argument is provided, show usage and ask. NEVER auto-execute.**

Usage: `/shotloom-respond-pr <pr-number>`

## Workflow

### Step 1: Sanity check

1. Validate `$ARGUMENTS` is a PR number.
2. Run `node "$knitten_root/agent/lib/shotloom-github-guard.mjs" --require-git-author --pr "$ARGUMENTS"`.
3. Confirm repo is `CINEV/shotloom`.
4. Resolve the PR branch before reading review comments or editing:

   ```bash
   HEAD_REF=$(gh pr view "$ARGUMENTS" --repo CINEV/shotloom --json headRefName --jq '.headRefName')
   CURRENT_BRANCH=$(git branch --show-current)

   if [ "$CURRENT_BRANCH" != "$HEAD_REF" ]; then
     test -z "$(git status --porcelain)" || {
       echo "Working tree is dirty; stop before switching to $HEAD_REF."
       exit 1
     }
     git fetch origin "$HEAD_REF"
     git checkout "$HEAD_REF"
     git pull --ff-only
   fi
   ```
6. Treat author type as metadata only. Do not discard a finding because it was
   written by a bot, app, or human. Do not treat any author type as
   authoritative. Route every finding by content and evidence.

Stop on any failure.

### Step 2: Read PR + build start context

Save each fetch to a per-PR cache file so later steps can re-read without re-fetching:

```bash
node agent/lib/github-pr-review-snapshot.mjs "$ARGUMENTS"
```

Then build the start-context JSON:

```bash
node agent/lib/github-pr-respond-start-context.mjs "$ARGUMENTS" --write
```

`/tmp/pr<N>-respond-start.json` is the workflow intake contract:

- `pr<N>-comments.json` — array of inline comments (`id`, `path`, `line`, `body`, `diff_hunk`, `user.login`)
- `pr<N>-reviews.json` — array of reviews with `state` and `user.login`; Step 9 reads this to compute the `CHANGES_REQUESTED` reviewer roster.
- `pr<N>-view.json` — object with current `reviewRequests`, `reviewDecision`, and PR metadata. Step 9 uses `reviewDecision` to decide which roster path to take and `reviewRequests` for the fallback union.
- `pr<N>-respond-start.json` — object with `reviewApproved`, review-state
  signals, cache file paths, and unclassified `reviewItems[]`.

Note the file shapes are different (object vs array). Step 9 jq must run filters against the matching file — never mix `.reviewRequests` and `.[]` filters in one jq invocation across both files.

The PR branch was checked in Step 1. Do not switch branches after Step 2 unless
the start-context `headRefName` differs from the current branch; if it differs,
stop and repeat Step 1.

### Step 3: Classify + record feedback table

Read `/tmp/pr<N>-respond-start.json`. Process every `reviewItems[]` entry under
the Step 1 author-neutral rule. Assign exactly one route per actionable item.
The route controls Step 4 work and the Step 7 reply-plan entry.

| Item type | Action |
|---|---|
| Actionable inline comment | Route, then fix/defer/reply per route. |
| Actionable review-body / suppressed item | Route, then fix/defer/reply per route. |
| Informational summary / risk note | Route as `informational`; no fix or reply unless user asks. |
| Question / uncertainty / unverifiable claim | Route as `ask-user`; no fix or reply until user decides. |

Every finding must receive the same route as every other review item. Record
the result in a numbered table: # | Source | Author kind | File | Line |
Summary | **Route**. Inline = has `commentId` (directly repliable); suppressed =
review body items. `Author kind` is `human`, `bot`, or `app`.

| Route | Use when | Step 4 action | Step 7 reply-plan entry |
|---|---|---|---|
| `fix-as-rec` | Item is in PR scope, the cited rule applies, and the requested fix has the right strength | Apply recommended fix | `Fixed in <sha>. <brief>` |
| `fix-different` | Item is in PR scope, but the requested fix is weaker, stronger, or shaped wrong | Stop and ask user before fixing | User-approved rationale |
| `defer-in-scope` | Item belongs to this PR's domain but is too large for this PR | File/reuse assigned STL issue | `Follow-up tracked as STL-NN.` |
| `track-out-of-scope-nit` | Item is optional/P3/non-blocking and outside this PR's domain | File/reuse assigned STL issue; no code fix | `Follow-up tracked as STL-NN; I will handle it outside this PR.` |
| `separate-issue-needed` | Item is outside this PR's domain and not a nit | Stop and ask user | No reply until user chooses route |
| `ask-user` | The right response depends on user/product/rollout intent, or ambiguity score is 9-10 | Stop and ask user | No reply until user chooses route |
| `pushback` | Reviewer misread the diff, cited the wrong rule, or the cure is worse than the defect | Stop and ask user | User-approved technical rationale |
| `informational` | Summary/risk note has no concrete requested action | No fix | No reply unless user asks |

Hard-stop triggers:

- Cited rule does not match the defect class.
- Recommended fix is weaker or stronger than the rule justifies.
- Reviewer asks for symmetric treatment but the compared cases differ materially.
- Existing follow-up issue is the natural home for the requested work.
- Comment is a question, unverifiable claim, or depends on external/user intent.
- Ambiguity score is 9-10. Score 8 or below picks the closest route.

Default route:

- `fix-as-rec` proceeds to Step 4 without another prompt.
- Every other route is surfaced at the end of Step 3 and waits for user decision before
  code changes or GitHub replies.

When a route requires user decision, show the user:

```md
Review feedback needs a decision before I reply:
- Route: <route>
- Source: <login>, <inline/review-body/top-level>, <url or id>
- Feedback summary: <one-sentence Korean summary>
- Why I am stopping: <uncertainty/question>
- My proposed options: <fix / defer with STL / reply with rationale / ignore as informational>
```

Wait for the user decision. Until then, no reply is posted for that item and no
reply plan may be executed if the unresolved decision could change the plan
wording, PR body, or reviewer re-request decision.

"Default: all" no longer applies blindly. The default is: every `fix-as-rec`
row proceeds; every other non-informational row gets surfaced for user
decision. Invoking this skill authorizes the workflow on the un-flagged rows;
the flagged ones still need a per-row call.

### Step 4: Resolve each item

For each `fix-as-rec`, `fix-different`, `defer-in-scope`,
`track-out-of-scope-nit`, or `pushback` row:

1. Read the target file, reviewer comment, and cited rule with nearby context.
2. Re-check the Step 3 route before editing. If the route no longer fits,
   return to Step 3 and surface the new route to the user.
3. Apply the smallest change that satisfies the route:
   - Do not refactor adjacent code.
   - Do not fix unrelated nits.
   - Do not strengthen the reviewer ask unless the user approved
     `fix-different`.
4. For `defer-in-scope` or `track-out-of-scope-nit`, create or reuse the
   assigned STL issue before drafting a reply.
5. Re-read the diff:
   - Verify the changed files match the routed finding.
   - Verify the reply claim can be proven from the diff, STL issue, or
     rationale.
   - If extra scope appeared, remove it before validation.
6. Record one evidence line:
   `finding <n> → route=<route>; evidence=<file:line | STL-NN | rationale>`.

### Step 5: Re-review the resolved diff

After Step 4 resolves every routed item, run both targeted review skills against
the current diff before validation:

```bash
/shotloom-review-code
/shotloom-review-docs
```

- If a review skill reports N/A, record the N/A line and continue.
- If either review skill reports a finding caused by the Step 4 changes, route
  that finding through Step 3 before proceeding.
- If either review skill reports unrelated existing work, surface it to the user
  as a separate issue candidate. Do not expand the PR response scope silently.

### Step 6: Validate + commit handoff + push + refresh PR body

Order matters: Shotloom repo guidance and review-response extra evidence gate first, then `/shotloom-commit`, then push, then PR body. Updating the PR description before evidence passes leaves the body claiming a state the branch hasn't reached; if evidence fails, the body and branch contradict each other.

1. Follow Shotloom repo guidance first. Then apply only the review-response
   leak fixes recorded in `reference.md` by delegating to
   `/shotloom-check-gates --full`. `reference.md` records extra evidence that
   escaped the repo-guideline flow; it is not the source of Shotloom gate
   policy.
   Do not substitute crate-specific diagnostics for this extra evidence gate.
   Targeted diagnostics are additive only.

2. Fix failing tests before proceeding. Broken tests block the PR.

3. Before staging or committing, run this workflow-local pre-commit response
   review pass inside `/shotloom-respond-pr`. This is not a separate skill.
   Use the Step 3 response table, Step 4 evidence lines, and current diff as
   inputs:
   - Compare the current working diff against the Step 3 response table.
   - Verify each routed finding has matching code/doc changes, issue linkage,
     no-op status, or rationale.
   - Verify the diff does not add unrelated scope.
   - If the review finds a miss, fix it and repeat Step 6 from the evidence
     gate.

4. On green:
   - Stage only the files that belong to the routed findings.
   - Delegate commit creation to `/shotloom-commit`, including the PR number
     and STL number when available.
   - If `/shotloom-commit` stops for user approval, missing staged files, or
     hook failure, do not push or refresh the PR body.
   - `git push`

5. **After push lands**, refresh the PR description so it matches the now-pushed branch:
   - Read current body, update Summary (new fixes, deleted files, deps), refresh Validation (test counts, doc-path counts), correct stale statements.
   - Write the updated body to a temp file and run
     `gh pr edit "$ARGUMENTS" --body-file "$BODY_FILE"`.
   - If a gate failed at step 1 and you never pushed, do NOT touch the PR body — the body still describes the prior good state.

### Step 7: Build reply plan JSON (no GitHub mutation)

**Re-fetch before planning (mandatory, no exceptions).** Step 7 can run long
after Step 2, so the original review snapshot may be stale.

Right before building the reply plan, run:

```bash
node agent/lib/github-pr-review-snapshot.mjs "$ARGUMENTS"
node agent/lib/github-pr-respond-start-context.mjs "$ARGUMENTS" --write
```

Compare the refreshed `reviewItems[]` to the Step 3 classification table. Any
new item must enter the Step 3 -> Step 4 -> Step 7 flow before any reply goes
out. If the diff is non-empty, restart Step 3 for the new
items; do not advance to Step 8 until every current inline id has a plan item
or an explicit no-reply route. See
`reference.md` for the failure that introduced this gate.

**Question gate:** after the mandatory re-fetch, run Step 3 on any new comment
or review body. If any current item is a question, uncertainty, or unverifiable
claim, stop before finishing the reply plan and ask the user. Do not advance to
Step 8 while the question could change the fix scope, PR body, suppressed
summary reply, or re-request roster. Do not run the approval-state helper until
the current start context has no unresolved `ask-user` route.

Create `/tmp/pr${ARGUMENTS}-reply-plan.json` from the refreshed start context,
Step 3 routes, and Step 4 evidence. This is the Step 7 execution contract.
Step 8 and Step 9 read this file; they do not re-derive routing fields.

Plan item rules:
- Add one `items[]` entry per resolved inline finding.
- `reply` text uses only the fix commit diff plus the reviewer comment. Do not
  pull context from past PRs, Linear issue bodies, sibling PRs, `.agent/`, or
  `reference.md`.
- Banned in `reply`: marketing/qualitative adjectives (`great catch`, `nice point`, `elegant`, `cleanly`, `nicely`), future/deferred-without-issue language (`will improve later`, `Phase 2`, `next steps`), internal tooling self-refs (`/shotloom-review-before-pr`, `/shotloom-check-gates`), and quantitative claims not re-derivable from the fix commit.
- Keep `reply` surgical: one or two sentences stating the fix, follow-up issue,
  or rationale.
- `track-out-of-scope-nit` items must reference an assigned STL issue; do not
  use an issue-less deferred reply for that route.
- `suppressedSummary` is `null` when there are no review-body items. When present,
  use an object with `reply` and `nonBlocking`; add `severity` when known.
- `approvedState` and `reRequest.default` start as draft values. The helper below
  overwrites them from cached review state plus item metadata.

```json
{
  "pr": 253,
  "approvedState": false,
  "items": [
    {
      "source": "inline",
      "commentId": 3091862347,
      "route": "fix-as-rec",
      "status": "fixed",
      "severity": "P2",
      "nonBlocking": false,
      "reply": "Fixed in abc1234. Updated the stale path."
    }
  ],
  "suppressedSummary": {
    "reply": "Addressed the review-body items in abc1234.",
    "nonBlocking": false
  },
  "reRequest": {
    "default": true,
    "reviewers": ["reviewer1", "reviewer2"],
    "reason": "CHANGES_REQUESTED resolved"
  }
}
```

After drafting the JSON, let the helper compute routing fields from the cached
review state and item metadata:

```bash
node agent/lib/github-pr-approved-state-plan.mjs "$ARGUMENTS" \
  --plan /tmp/pr${ARGUMENTS}-reply-plan.json \
  --write
```

### Step 8: Execute reply plan

Read the Step 7 reply plan JSON. Do not reconstruct routing from memory. If
`reRequest.default` is `true`, include the `reRequest` roster in the approval
batch. Show all `items` and `suppressedSummary` in the same batch. Wait for
explicit user approval. NEVER auto-post any GitHub-visible reply, review, thread
resolution, or reviewer-roster mutation.

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

**Default policy:** After posting replies, the skill does NOT click "Resolve conversation" on review threads. Resolution is the reviewer's acknowledgement that the reply is adequate — the author pre-resolving removes that signal and makes the review state ambiguous for the reviewer on next pass.

- **Fixed** (default) → reply executed in Step 8, thread stays open for reviewer to resolve.
- **Deferred with Linear issue filed** → reply executed with STL-NN link, thread stays open.
- **Out-of-scope nit with Linear issue filed** → reply executed with STL-NN link, thread stays open.
- **Deferred with no issue yet** → create or reuse an assigned STL issue using
  the current Shotloom Linear workflow first, execute reply, thread stays open.
  If no issue-creation workflow is available, stop and ask the user before
  posting the reply.
- **Disagreed** → reply executed, thread stays open (never resolve your own disagreement).
- **Ambiguous** → no reply, no resolve.

When `RESPOND_PR_RESOLVE_THREADS=1` is set, resolve threads through the helper:

```bash
node agent/lib/github-pr-resolve-review-threads.mjs "$ARGUMENTS" \
  --plan /tmp/pr${ARGUMENTS}-reply-plan.json \
  --yes
```

The helper maps Step 7 `items[].commentId` to review thread IDs, skips already
resolved threads, and resolves only matching unresolved threads. Use it only
when the approved Step 7 plan selected thread resolution.

### Step 9: Re-request review (after replies posted, conditional)

Re-request is the signal that "I'm done with this round; please re-review." It runs whenever at least one reply was posted and the Step 7 reply plan has `reRequest.default: true`. **Approval was already collected in Step 8** — do not prompt the user again here.

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

**Skip Step 9 only when:** no replies were posted, OR user passed `--no-rerequest`, OR the Step 7 reply plan has `reRequest.default: false`, OR the reviewer roster is empty after dropping the PR author and bots.

### Step 10: Post-response verification

Run after Step 8 reply execution and Step 9 re-request complete, before the final user
summary:

```bash
node agent/lib/github-pr-review-snapshot.mjs "$ARGUMENTS" --prefix post --threads
gh pr checks "$ARGUMENTS" --watch=false
```

Verify:

- Every reply authorized from the Step 7 plan is attached to the expected inline thread or
  review-level surface.
- No new actionable inline/review-body item appeared after the Step 7 re-fetch.
- Unresolved review threads are expected: either reviewer-owned follow-up,
  intentionally unresolved by policy, or next respond queue item.
- CI/check state is reported.

If a new actionable item or missing reply appears, do not claim the response
round is complete. Report it as the next respond queue item.

### Step 11: Report final summary

Table: **# | File | Status | Linear | Thread | Reply**.

Plus line "Re-requested review from: @reviewer".

## User briefing — Korean framing

When briefing back to the user (NOT the reply text posted to GitHub), default to
Korean. Give the user the shape of the round-trip so they can decide what it
means for the PR without reading every comment verbatim.

- Lead with what larger goal the PR serves and what invariant / contract /
  subsystem each finding pokes at. Then say what was done about it.
- **Group by theme, not by comment id.** Two findings that attack the same invariant from different angles get one paragraph.
- **Mark deferrals plainly.** If something was acknowledged-but-not-fixed (P3 nit, follow-up PR), say so in one sentence with the reason — don't re-translate the reviewer's full Recommendation block here.
- **End with state.** Last line names the SHA pushed, that replies are posted inline, and the re-request decision (sent / skipped / why).

## Autonomy

Invoking this skill is blanket authorization for the workflow. **Do NOT pause for per-step approval.** The following actions are auto-approved inside the skill:

- File edits, targeted staging, `/shotloom-commit`, and `git push`.
- `gh pr edit "$ARGUMENTS" --body-file "$BODY_FILE"` in Step 6 item 5 — **body-only** edit, scoped to refreshing Summary / Validation / fix log so the PR description matches the now-pushed branch. This is not a state-changing PR mutation; it cannot affect mergeability, base, title, draft state, or labels. Only stop on CI failure or genuinely unexpected event.

**EXCEPTION (still requires explicit per-action approval, even inside this skill):**

- Step 8 (executing the Step 7 reply plan, suppressed-item review-level summary, thread resolution, and reviewer re-request roster) — show the plan and wait for explicit user OK per this skill and `agent/rules/git-defaults.md`. Commits and pushes are covered by this skill; GitHub-visible comments, review submissions, and reviewer-roster mutations stay gated.
- `gh pr edit --base`, `--title`, `--draft`, label changes — never done by this skill; if they were, they would still need approval.
- `gh pr edit --body` without `--body-file` — never done by this skill.
- `gh pr merge`, `gh pr close`, `gh pr reopen`, `gh pr ready`, `gh pr update-branch`, `gh pr review --approve`/`--request-changes`, top-level PR comments via `/issues/<N>/comments` — never done by this skill.

(`/shotloom-auto-pr` carries its own broader exemption that auto-approves reply actions inside its react cycle. `/shotloom-respond-pr` does not.)

## Subagent Usage

- **Step 2** — helper scripts fetch PR metadata, comments, reviews, and write
  the start-context JSON.
- **Step 4** — dispatch subagents (`model: "sonnet"`) for independent files.
- **Step 6** — parallel gates, then `/shotloom-commit` for commit creation.

Main thread orchestrates: gather results, stage, commit, post replies.

## Binding Rules

- **Skill-local GitHub policy wins.** This skill owns its auto-commit, push, reply, and approval gates.
- **GitHub-to-GitHub scope.** This skill does not own issue triage, product
  decisions, or non-GitHub follow-up execution. It may create or link STL
  issues only as evidence for deferred GitHub review replies.
- **Reply inline on each individual review comment**, NOT top-level PR comment (per `rules/git-defaults.md`).
- **Suppressed items** — evaluate honestly; OK to defer scope-exceeding work.
- **Out-of-scope nits** — create or reuse an STL issue assigned to me, include
  the STL number in the reply, and say it is handled outside this PR.
- **Commit message** — conventional, imperative, ≤80 char subject, counted before commit (per `docs/guidelines/commit-guideline.md` in the shotloom repo).
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

- `agent/skills/shotloom-review-before-pr/SKILL.md`
- `agent/rules/git-defaults.md`
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec

## Additional Resources

For guideline leak fixes, graphql thread-resolution queries, and detailed reply templates, see [reference.md](reference.md).
