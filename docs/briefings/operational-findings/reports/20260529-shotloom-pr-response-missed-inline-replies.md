---
status: captured
created: 2026-05-29
updated: 2026-05-29
initial-source: user-report
area: workflow
contexts:
  - shotloom-respond-pr CINEV/shotloom#430
promotion-target: unknown
urgent: false
---

# Shotloom PR response missed inline replies

## Summary

PR review-response workflow kept posting top-level PR comments instead of replying to actionable inline review threads. For CINEV/shotloom#430, the latest 5 inline comments were initially missed until the user pointed it out. The respond-pr workflow should force enumeration of /pulls/<PR>/comments and POST replies to each actionable comment id before top-level summary or reviewer re-request.

## Observations

### 1. Initial capture

- Observed In: shotloom-respond-pr CINEV/shotloom#430
- Rough Finding: PR review-response workflow kept posting top-level PR comments instead of replying to actionable inline review threads. For CINEV/shotloom#430, the latest 5 inline comments were initially missed until the user pointed it out. The respond-pr workflow should force enumeration of /pulls/<PR>/comments and POST replies to each actionable comment id before top-level summary or reviewer re-request.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: workflow
- Done When: finding is promoted, resolved, assetized, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
