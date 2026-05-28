---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: merged-pr-review-sweep
area: workflow
contexts:
  - Shotloom PR 417 review findings
promotion-target: agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom release workflows need exact safety gates

## Summary

Merged PR review findings on the web image release workflow showed recurring
safety-gate risks: deploy jobs using status functions that can ignore
cancellation intent, registry cache settings that can expose build-only layers,
published-image smoke checks that accept any non-success response instead of an
exact expected status, and workflow docs that lag behind registry contract
changes.

## Observations

### 1. Merged PR review sweep

- Observed In: Shotloom PR 417, merged 2026-05-27 by tomlim2.
- Rough Finding: Release workflow changes need exact status, cache, smoke, and
  documentation checks because a green workflow can still violate operator stop
  intent, source exposure boundaries, or published asset contracts.
- Why It Matters: CI/CD PRs often look mechanical, but small condition or cache
  changes become release safety policy.
- Evidence: Review requested replacing cancellation-insensitive deploy gating,
  constraining BuildKit cache export, requiring exact 404 for a missing sidecar
  smoke check, and committing the workflow contract docs update.
- Follow-up Guess: Promote to review ledger and gate-candidate ledger.
- Needs Clarification: no

## Suggested Follow-up

- Problem: Release workflow diffs can pass syntax checks while weakening safety
  semantics.
- Likely Scope: review, validator-candidate
- Done When: workflow review checks cancellation semantics, cache exposure,
  exact negative smoke expectations, and docs alignment.
- Possible destination: agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md

## Status

- Current State: captured
- Fast Track: no
