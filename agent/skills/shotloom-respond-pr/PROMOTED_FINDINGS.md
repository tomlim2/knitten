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
