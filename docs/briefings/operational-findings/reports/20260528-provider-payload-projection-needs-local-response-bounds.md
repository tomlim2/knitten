---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: wrapup-task
area: workflow
contexts:
  - shotloom PR 423
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Provider payload projection needs local response bounds

## Summary

Reviewer found that a provider-neutral payload projection accepted self-consistent but out-of-policy T2M responses: equal out-of-range candidate counts and oversized well-shaped motion arrays could reach candidate payload cloning. Future external-provider adapters should enforce local count and size budgets before durable payload projection.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 423
- Rough Finding: Reviewer found that a provider-neutral payload projection accepted self-consistent but out-of-policy T2M responses: equal out-of-range candidate counts and oversized well-shaped motion arrays could reach candidate payload cloning. Future external-provider adapters should enforce local count and size budgets before durable payload projection.
- Why It Matters: <clarify during triage>
- Evidence: PR 423; review findings on crates/shotloom-t2m/src/lib.rs:315 and crates/shotloom-t2m/src/lib.rs:537
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
