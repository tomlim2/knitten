# Promoted Findings: Code Review Layer

This ledger contains operational findings promoted into Shotloom Rust, TypeScript,
frontend, and test-quality review. Read it during `/shotloom-review-code` after
`reference.md` and `reference-promoted.md`, and use matching entries as
additional review lenses.

## Active Entries

### Preserve structured fallback when guidance is unavailable

- Source: `docs/briefings/operational-findings/reports/20260526-user-reported-that-when-shotloom-agents.md`
- Trigger: code review depends on Knitten shared policy, resolver-selected
  Shotloom guidance, or helper files that are absent from the active checkout.
- Check: verify the review reports the missing guidance input as a structured
  blocker instead of surfacing only a raw missing-file or shell error.
- Fix Shape: use the resolver or helper gate to name the required path and next
  recovery action before attempting review.
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

### Require a UI primitive contract matrix

- Source: `docs/briefings/operational-findings/reports/20260528-shotloom-ui-primitives-need-contract-matrix.md`
- Trigger: a PR adds or changes shared editor UI primitives.
- Check: verify each primitive states controlled versus uncontrolled behavior,
  callback/value semantics, disabled/title precedence, owned ARIA props, native
  input constraints, token/icon provenance, and required tests.
- Fix Shape: add a small primitive contract matrix before merge and make tests
  follow that matrix instead of one-off edge cases.
- Status: active

### Review bridge command families as a matrix

- Source: `docs/briefings/operational-findings/reports/20260528-shotloom-bridge-stage-commands-need-contract-matrix.md`
- Trigger: a PR adds or changes a family of bridge commands or IPC handlers.
- Check: compare every handler against the same rejection surface, success event
  ordering, mutation facade path, documented no-op behavior, and contract docs.
- Fix Shape: add table-driven tests and docs rows for the whole command family,
  or document a scoped exception before merge.
- Status: active

### Keep compact editor modes from hiding critical errors

- Source: `docs/briefings/operational-findings/reports/20260528-shotloom-compact-editor-errors-must-not-be-hidden.md`
- Trigger: an editor refactor adds compact, minimized, or alternate production
  layout modes while preserving runtime subscriptions.
- Check: verify runtime errors and command rejections surface through a
  layout-independent feedback path, and tests exercise the shipped default mode.
- Fix Shape: route critical failures through toast or equivalent global feedback
  and add default-mode regression coverage.
- Status: active

### Review runtime sync as transitions, not only final state

- Source: `docs/briefings/operational-findings/reports/20260528-shotloom-stage-runtime-sync-needs-symmetric-observable-transitions.md`
- Trigger: a PR changes engine runtime sync, hydration, fallback, or drift
  repair logic.
- Check: verify write accounting, fallback restoration symmetry, observable
  silent-skip paths, multi-entity scenarios, and active-state flip regressions.
- Fix Shape: add transition-focused tests and telemetry or diagnostics for
  intentionally silent branches.
- Status: active
