---
status: captured
created: 2026-05-26
updated: 2026-05-26
initial-source: user-report
area: ux
contexts:
  - ah-report-finding / operational-findings capture while reporting Shotloom review bootstrap issue
promotion-target: agent/skills/shotloom-promote-findings/PROMOTED_FINDINGS.md
urgent: false
---

# Operational finding capture guard message is unclear

## Summary

User asked to report that the ah-report-finding capture safety guard was unclear. During capture, running the script from the Knitten root produced only 'run capture from operational-findings branch'. The guard correctly prevents writing findings from the wrong cwd/branch, but the message does not explain the actual cwd/branch, expected operational-findings worktree, or the next safe command, so the agent had to explain what 'safety guard' meant after the fact.

## Observations

### 1. Initial capture

- Observed In: ah-report-finding / operational-findings capture while reporting Shotloom review bootstrap issue
- Rough Finding: User asked to report that the ah-report-finding capture safety guard was unclear. During capture, running the script from the Knitten root produced only 'run capture from operational-findings branch'. The guard correctly prevents writing findings from the wrong cwd/branch, but the message does not explain the actual cwd/branch, expected operational-findings worktree, or the next safe command, so the agent had to explain what 'safety guard' meant after the fact.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: ux
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
