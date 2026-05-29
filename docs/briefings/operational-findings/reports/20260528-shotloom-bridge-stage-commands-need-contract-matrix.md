---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: merged-pr-review-sweep
area: workflow
contexts:
  - Shotloom PR 384 review findings
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom bridge stage commands need a contract matrix

## Summary

Merged PR review findings on stage lifecycle and edit commands showed that
bridge command PRs need a matrix covering every handler's rejection surface,
success event ordering, mutation facade path, documented no-op behavior, and
contract table rows. Reviewing a single handler path is not enough when the PR
adds or changes a command family.

## Observations

### 1. Merged PR review sweep

- Observed In: Shotloom PR 384, merged 2026-05-21.
- Rough Finding: Review found missing rejection tests for part of the command
  family, success-event-before-bundle_changed ordering asserted for only one
  handler, a direct bridge mutation path bypassing the canonical facade, an
  undocumented wrong-kind rejection, duplicate contract docs, and PR scope drift
  between lifecycle and edit handlers.
- Why It Matters: Bridge command families expose durable IPC contracts; missing
  matrix coverage lets handlers drift from each other and from docs.
- Evidence: Review body requested complete SHOT_NOT_FOUND coverage, event
  ordering for all handlers, facade conformance or documented exception,
  rejection-table rows, duplicate docs cleanup, and scope alignment.
- Follow-up Guess: Promote to review ledger as a contract-family lens.
- Needs Clarification: no

## Suggested Follow-up

- Problem: Command-family diffs can look locally correct while only one handler
  carries the documented contract tests.
- Likely Scope: review
- Done When: bridge command reviews check every handler against the same
  rejection, ordering, facade, no-op, and docs matrix.
- Possible destination: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md

## Status

- Current State: captured
- Fast Track: no
