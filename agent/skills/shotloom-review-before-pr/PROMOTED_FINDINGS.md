# Promoted Findings: Review Layer

This ledger contains operational findings promoted into Shotloom review and
pre-PR readiness checks. Read it during `/shotloom-review-before-pr` before
running selected review children, and use matching entries as additional review
lenses.

## Active Entries

### Preserve structured fallback when shared policy is unavailable

- Source: `docs/briefings/operational-findings/reports/20260526-user-reported-that-when-shotloom-agents.md`
- Trigger: a Shotloom workflow depends on Knitten shared policy or helper files
  that are absent from the active checkout.
- Check: verify the response reports the missing shared-policy input as a
  structured blocker instead of surfacing only a raw missing-file or shell error.
- Fix Shape: add a repo-root or helper resolution gate that names the required
  Knitten path and the next recovery action.
- Status: active

### Recheck PR surfaces after response actions

- Source: `docs/briefings/operational-findings/reports/20260527-shotloom-respond-pr-should-verify-pr-surface-after-replying.md`
- Trigger: a workflow replies to review threads, pushes fixes, or requests a
  follow-up review.
- Check: confirm the workflow re-reads the GraphQL review-thread surface and the
  REST comment/check surfaces before declaring the PR response complete.
- Fix Shape: add a post-response verification pass that reports remaining
  actionable threads, fresh inline comments, reply attachment state, and checks.
- Status: active

### Treat provider payload bounds as local adapter responsibility

- Source: `docs/briefings/operational-findings/reports/20260528-provider-payload-projection-needs-local-response-bounds.md`
- Trigger: a provider-neutral adapter projects external responses into durable
  Shotloom payloads.
- Check: look for local count and size budgets before cloning or storing
  candidate payloads.
- Fix Shape: enforce candidate-count and payload-size caps before durable
  projection, with tests for self-consistent but out-of-policy responses.
- Status: active

### Keep malformed diagnostics item-scoped

- Source: `docs/briefings/operational-findings/reports/20260528-provider-error-classification-should-tolerate-partial-malformed.md`
- Trigger: an external provider returns a list of validation diagnostics where
  some optional fields are malformed.
- Check: verify one malformed diagnostic does not collapse the entire typed
  provider error into a generic malformed-response path.
- Fix Shape: parse optional diagnostic detail per item and preserve valid typed
  errors plus source-chain classification.
- Status: active
