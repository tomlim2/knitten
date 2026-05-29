---
status: done
created: 2026-05-29
updated: 2026-05-29
initial-source: wrapup-task
area: docs
contexts:
  - shotloom PR 397
promotion-target: agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md
urgent: false
---

# Reviewer found that import_stage_map documentation mentioned the 4096-placement

## Summary

Reviewer found that import_stage_map documentation mentioned the 4096-placement cap and all-skipped terminal reject path in narrative text but omitted explicit rejection-code table rows for those producer-visible failures. Future bridge command docs should keep narrative failure cases and machine-readable rejection tables synchronized at the public command boundary.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 397
- Rough Finding: Reviewer found that import_stage_map documentation mentioned the 4096-placement cap and all-skipped terminal reject path in narrative text but omitted explicit rejection-code table rows for those producer-visible failures. Future bridge command docs should keep narrative failure cases and machine-readable rejection tables synchronized at the public command boundary.
- Why It Matters: <clarify during triage>
- Evidence: PR 397; review finding on docs/ipc/bridge-contract.md
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: docs
- Done When: finding is promoted, resolved, assetized, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: done
- Fast Track: no
