---
status: captured
created: 2026-05-24
updated: 2026-05-24
initial-source: smoke-test
area: validator
contexts:
  - operational-findings smoke test 2026-05-24
promotion-target: agent/skills/shotloom-promote-findings/PROMOTED_FINDINGS.md
urgent: false
---

# status porcelain parsing damaged changed paths

## Summary

Operational findings capture initially parsed git status porcelain lines with a fixed slice and damaged modified paths, causing docs paths to be read as ocs paths and valid report/index changes to be rejected.

## Observations

### 1. Initial capture

- Observed In: operational-findings smoke test 2026-05-24
- Rough Finding: Operational findings capture initially parsed git status porcelain lines with a fixed slice and damaged modified paths, causing docs paths to be read as ocs paths and valid report/index changes to be rejected.
- Why It Matters: <clarify during triage>
- Evidence: First real capture failed with unexpected files changed: ocs/briefings/operational-findings-inbox.md
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: validator
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
