---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: merged-pr-review-sweep
area: workflow
contexts:
  - Shotloom PR 414 review findings
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom UI primitives need a contract matrix

## Summary

Merged PR review findings on the editor UI primitive layer repeatedly clustered
around implicit component contracts: controlled versus uncontrolled behavior,
draft versus committed values, native-safe values for composite inputs, owned
ARIA props, disabled explanation precedence, token/icon provenance, and required
tests. Future UI primitive work should start from a contract matrix instead of
discovering each edge case through review follow-ups.

## Observations

### 1. Merged PR review sweep

- Observed In: Shotloom PR 414, merged 2026-05-28.
- Rough Finding: Reviewers repeatedly found RangeSlider, ColorPicker, Switch,
  SelectList, and related primitive issues where the public API implied one
  contract while internal state, native input constraints, or tests enforced
  another.
- Why It Matters: UI primitives are foundational API surface; implicit
  contracts produce repeated review loops and fragile downstream usage.
- Evidence: Review comments covered controlled/uncontrolled behavior, native
  range/color input safety, disabledReason title precedence, listbox semantics,
  focus-visible styling, icon-only labeling, owned ARIA state, third-party
  notice linkage, and matrix-style tests.
- Follow-up Guess: Promote to review ledger as a pre-PR lens for editor UI
  primitive changes.
- Needs Clarification: no

## Suggested Follow-up

- Problem: UI primitive diffs can pass local tests while leaving contract gaps
  that only emerge under controlled, uncontrolled, native input, or accessibility
  edge cases.
- Likely Scope: review
- Done When: future UI primitive PRs include an explicit contract matrix or the
  review asks for one before merge.
- Possible destination: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md

## Status

- Current State: captured
- Fast Track: no
