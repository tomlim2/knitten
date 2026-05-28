---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: wrapup-task
area: workflow
contexts:
  - shotloom PR 423
promotion-target: agent/skills/shotloom-review-before-pr/PROMOTED_FINDINGS.md, agent/skills/shotloom-check-gates/PROMOTED_FINDINGS.md
urgent: false
---

# Provider error classification should tolerate partial malformed diagnostics

## Summary

Reviewer found that FastAPI validation issue parsing could let one malformed diagnostic entry collapse the whole provider validation failure into a generic malformed response. Future provider adapters should scope optional parsing failures to the individual diagnostic item so valid typed errors and source-chain classification survive mixed-quality provider error payloads.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 423
- Rough Finding: Reviewer found that FastAPI validation issue parsing could let one malformed diagnostic entry collapse the whole provider validation failure into a generic malformed response. Future provider adapters should scope optional parsing failures to the individual diagnostic item so valid typed errors and source-chain classification survive mixed-quality provider error payloads.
- Why It Matters: <clarify during triage>
- Evidence: PR 423; review finding on crates/shotloom-t2m/src/lib.rs:452; docs/guidelines/error-handling.md typed error discipline
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
