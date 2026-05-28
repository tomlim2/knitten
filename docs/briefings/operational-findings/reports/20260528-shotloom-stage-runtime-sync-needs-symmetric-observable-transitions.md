---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: merged-pr-review-sweep
area: workflow
contexts:
  - Shotloom PR 385 review findings
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom stage runtime sync needs symmetric observable transitions

## Summary

Merged PR review findings on stage runtime hydration were mostly nits, but they
form a reusable review pattern: runtime sync code should account for writes
symmetrically, restore fallback state on every exit path, log or diagnose silent
skips, and test multi-stage or active-stage flip scenarios rather than only the
single happy path.

## Observations

### 1. Merged PR review sweep

- Observed In: Shotloom PR 385, merged 2026-05-21.
- Rough Finding: Review found missing write accounting for void despawns,
  single-stage-only tests, hardcoded spawn counts, silent authored-stage and
  dangling-reference skips, no-authoring-shot fallback asymmetry, and incomplete
  active-stage flip coverage.
- Why It Matters: Runtime synchronization code can keep passing steady-state
  tests while hiding state-machine asymmetry, observability gaps, or fallback
  regressions.
- Evidence: Review comments focused on write counts, multi-stage coverage,
  fallback restoration, telemetry, and branch-specific regression tests.
- Follow-up Guess: Promote to review ledger for engine runtime sync changes.
- Needs Clarification: no

## Suggested Follow-up

- Problem: Runtime sync diffs need transition-focused review, not only final
  entity-count assertions.
- Likely Scope: review
- Done When: future runtime sync reviews check accounting, fallback symmetry,
  observability, multi-entity scenarios, and active-state flips.
- Possible destination: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md

## Status

- Current State: captured
- Fast Track: no
