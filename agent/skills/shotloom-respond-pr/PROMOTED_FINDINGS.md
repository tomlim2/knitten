# Promoted Findings: PR Response Layer

This ledger contains operational findings promoted into Shotloom PR response
workflows. Read it during `/shotloom-respond-pr` after the initial PR snapshot,
and use matching entries as response-round checks.

## Active Entries

### Recheck PR surfaces after response actions

- Source: `docs/briefings/operational-findings/reports/20260527-shotloom-respond-pr-should-verify-pr-surface-after-replying.md`
- Trigger: a workflow replies to review threads, pushes fixes, or requests a
  follow-up review.
- Check: confirm the workflow re-reads the GraphQL review-thread surface and the
  REST comment/check surfaces before declaring the PR response complete.
- Fix Shape: add or preserve a post-response verification pass that reports
  remaining actionable threads, fresh inline comments, reply attachment state,
  and checks.
- Status: active

### Confirm assignment before responding to PRs

- Source: `docs/briefings/operational-findings/reports/20260527-do-not-respond-to-unassigned-shotloom-prs.md`
- Trigger: respond-pr starts work on a Shotloom PR or issue.
- Check: verify the current agent/user is assigned before committing, replying, requesting review, or mutating PR state.
- Fix Shape: stop with a clear ownership warning when the PR or linked issue is assigned to someone else, unless the user explicitly authorizes taking it over.
- Status: active

### Include Korean translation in approval batches

- Source: `docs/briefings/operational-findings/reports/20260527-shotloom-respond-pr-step-6-korean-translation-briefing-can-be-missed.md`
- Trigger: respond-pr drafts reviewer replies and asks the user to approve a response batch.
- Check: verify the approval batch includes Korean translations of reviewer originals and drafted replies before posting.
- Fix Shape: add the translation requirement beside the reply-draft approval step, not only in the final report step.
- Status: active

### Reply to actionable inline comments before top-level summaries

- Source: `docs/briefings/operational-findings/reports/20260529-shotloom-pr-response-missed-inline-replies.md`
- Trigger: a PR has actionable review comments from the REST pull-request comments surface.
- Check: enumerate recent inline comments and verify each actionable comment id receives a direct reply before posting a top-level summary or requesting review.
- Fix Shape: read `/pulls/<PR>/comments`, group actionable comments by id, POST replies to each thread, then run the post-response verification pass.
- Status: active
