---
status: captured
created: 2026-05-24
updated: 2026-05-24
initial-source: smoke-test
area: workflow
contexts:
  - operational-findings usability test 2026-05-24
promotion-target: agent/skills/shotloom-promote-findings/PROMOTED_FINDINGS.md
urgent: false
---

# long lived findings branch can run stale scripts

## Summary

Operational findings capture should run scripts from the current Knitten checkout rather than from the long-lived findings worktree, because the findings branch may intentionally lag main and carry stale script logic.

## Observations

### 1. Initial capture

- Observed In: operational-findings usability test 2026-05-24
- Rough Finding: Operational findings capture should run scripts from the current Knitten checkout rather than from the long-lived findings worktree, because the findings branch may intentionally lag main and carry stale script logic.
- Why It Matters: <clarify during triage>
- Evidence: During smoke testing, the capture bug fix existed in main checkout before it existed in the operational-findings branch copy.
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: workflow
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
