---
status: captured
created: 2026-05-29
updated: 2026-05-29
initial-source: wrapup-task
area: ux
contexts:
  - shotloom PR 425
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Reviewer found that moving persistence actions into a portal introduced target l

## Summary

Reviewer found that moving persistence actions into a portal introduced target lookup timing, z-index layering, and fallback branch contracts that each needed explicit handling. Future portal UI moves should review target capture timing, overlay stacking, fallback rendering, and slot stub provenance together.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 425
- Rough Finding: Reviewer found that moving persistence actions into a portal introduced target lookup timing, z-index layering, and fallback branch contracts that each needed explicit handling. Future portal UI moves should review target capture timing, overlay stacking, fallback rendering, and slot stub provenance together.
- Why It Matters: <clarify during triage>
- Evidence: PR 425; review findings on apps/editor/src/persistence/PersistenceActions.tsx and related tests
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
