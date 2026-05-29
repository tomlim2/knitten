# shotloom-respond-pr reference

Detail for the shotloom-respond-pr skill. SKILL.md is the canonical workflow.
This file holds long examples, data shapes, and failure rationale that would make
the skill body too noisy.

---

## Guideline Leak Fixes

Shotloom repo guidelines are the first source of commit, push, and PR policy.
This reference records review-response local leak fixes: extra evidence gates
added after real failures escaped the repo-guideline flow.

| Leak / failure mode | Extra gate | Evidence source |
|---|---|---|
| Review-response fixes can update the PR body before the branch has matching evidence | Run Shotloom repo guidance and `/shotloom-check-gates --full` before commit, push, and PR body refresh | Prior review-response ordering defect |
| Narrow crate tests can pass while workspace regressions surface only after CI | Do not substitute crate-specific tests for the review-response extra evidence gate; use `/shotloom-check-gates --full` | Review-response gate drift |
| REST comments and GraphQL reviewThreads can diverge after replying | Run post-response verification before final summary and report remaining actionable items as the next respond queue | 2026-05-27 post-response verification finding |
| Review response can commit a fix that was not checked against the response table | Run a pre-commit response review pass before staging, committing, and pushing | 2026-05-27 respond-pr pre-commit review finding |
| PR body markdown can break through shell quoting | Write the body to a temp file and use `gh pr edit --body-file` | 2026-05-27 respond-pr body-file finding |

The extra gate is additive. It does not replace, weaken, or redefine Shotloom
repo guidance.

---

## Step I/O matrix

Derived quick index. If this disagrees with `SKILL.md`, follow `SKILL.md` and
update this table in the same patch.

| Step | Input | Output |
|---|---|---|
| Gate | `<pr-number>`, GitHub PR assignees | Stop or permission to continue |
| 1 | `<pr-number>`, `gh auth status`, git identity, repo, PR `headRefName`, working tree status | Correct account, repo, branch, and author-neutral invariant |
| 2 | PR number on checked-out PR branch | `.agent-local/shotloom/pr/<N>/pr<N>-view.json`, `pr<N>-comments.json`, `pr<N>-reviews.json`, `pr<N>-respond-start.json` |
| 3 | `.agent-local/shotloom/pr/<N>/pr<N>-respond-start.json`, Step 1 author-neutral invariant | Numbered feedback table with one route per actionable item and hard-stop rows surfaced |
| 4 | Step 3 table, target files, cited rules, user decisions for non-default routes | Minimal diff, STL issue links or rationale, evidence line per routed finding |
| 5 | Current diff, Step 4 evidence | Re-review result; new findings routed through Step 3 or separate issue candidate |
| 6 | Step 3 table, Step 4 evidence, current diff, Shotloom gates | Commit, push, refreshed PR body, or stop on failed evidence |
| 7 | Refreshed start context, Step 3 routes, Step 4 evidence, pushed commit | `.agent-local/shotloom/pr/<N>/reply-plan.json` with replies, `approvedState`, and `reRequest` |
| 8 | Step 7 reply plan, explicit user approval | Posted inline replies and optional review-level summary/thread resolution |
| 9 | Step 7 reply plan, Step 2 cache files, posted reply state | Reviewer re-request or explicit skip |
| 10 | Post-response snapshot, PR checks | Verification result for replies, new items, threads, and CI |
| 11 | Step 10 result | Final user summary |

---

## Step 3 — feedback item table (example)

```
## Review Feedback — PR #<N>

| # | Source | Author kind | File | Line | Summary | Route |
|---|---|---|---|---|---|---|
| 1 | inline | human | docs/adr/adr-0025.md | 77 | Wrong file path for build_from_bytes | fix-as-rec |
| 2 | inline | bot | docs/tech-debt/vrm-rest.md | 21 | Typo SS3 -> section 3 | fix-as-rec |
| 3 | suppressed | app | vrm_extract.rs | 846 | Unchecked indexing on untrusted input | ask-user |
```

- **inline** = start-context `reviewItems[]` with `source=inline` and `commentId`
- **suppressed** = start-context `reviewItems[]` with `source=review-body`; reply once through a review-level `COMMENT`

## Step 2 / Step 7 — start context JSON format

```json
{
  "pr": 253,
  "headRefName": "feature/respond-pr",
  "baseRefName": "main",
  "reviewApproved": false,
  "signals": {
    "reviewDecision": "CHANGES_REQUESTED",
    "latestReviewState": "CHANGES_REQUESTED",
    "reviewApproved": false
  },
  "files": {
    "view": ".agent-local/shotloom/pr/253/pr253-view.json",
    "comments": ".agent-local/shotloom/pr/253/pr253-comments.json",
    "reviews": ".agent-local/shotloom/pr/253/pr253-reviews.json"
  },
  "reviewItems": [
    {
      "source": "inline",
      "commentId": 3091862347,
      "author": "reviewer1",
      "authorType": "User",
      "path": "src/lib.rs",
      "line": 42,
      "body": "Fix this stale path.",
      "diffHunk": "@@ ...",
      "route": null,
      "replyPlan": null
    },
    {
      "source": "review-body",
      "reviewId": 123456,
      "author": "reviewer1",
      "authorType": "User",
      "state": "CHANGES_REQUESTED",
      "body": "Also address the review-body finding.",
      "route": null,
      "replyPlan": null
    }
  ],
  "counts": {
    "inline": 1,
    "reviewBody": 1,
    "total": 2
  }
}
```

Step 3 classifies `reviewItems[]`. Step 7 converts classified items plus
evidence into the reply plan.

## Step 7 — reply plan JSON format

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
      "reply": "Fixed in abc1234. Updated `From` column from `vrm_extract.rs` to `vrm_rest.rs`."
    },
    {
      "source": "inline",
      "commentId": 3091862400,
      "route": "track-out-of-scope-nit",
      "status": "fixed",
      "severity": "P3",
      "nonBlocking": true,
      "reply": "Fixed in abc1234. Corrected `SS3` to `§3`."
    }
  ],
  "suppressedSummary": {
    "reply": "Addressed the review-body items in abc1234.",
    "nonBlocking": false
  },
  "reRequest": {
    "default": true,
    "reviewers": ["reviewer1"],
    "reason": "CHANGES_REQUESTED resolved"
  }
}
```

Step 8 presents this plan for explicit approval. Do not auto-post from this
reference example.

---

## Step 7 — stale snapshot failure

PR #253 round 1 (2026-05-07) had a main review at 02:01 with 0 inline
comments. A second review at 02:09 added 11 inline comments. The response was
drafted from the 02:01 snapshot and posted at 02:44 without addressing the 11
new threads; the reviewer moved the PR back to `CHANGES_REQUESTED` at 02:46.

This is why Step 7 re-fetches review state, rebuilds the start context, and
routes any fresh item through the response table before Step 8 can execute the
plan.

---

## Step 8 — thread-resolution helper

`agent/lib/github-pr-resolve-review-threads.mjs` owns the GraphQL mechanics for
mapping reply-plan `commentId` values to review thread IDs and resolving only
matching unresolved threads.
