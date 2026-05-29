---
status: done
created: 2026-05-29
updated: 2026-05-29
initial-source: wrapup-task
area: ux
contexts:
  - shotloom PR 425
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Reviewer found that an App-level inspector test claimed viewport-toolbar coverag

## Summary

Reviewer found that an App-level inspector test claimed viewport-toolbar coverage while clicking a BevyViewport mock button instead of the production BevyViewport to ViewportToolbar to ViewportOverlayMenu path. Future UI forwarding moves need focused real-path coverage plus test names that do not overclaim mocked integration coverage.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 425
- Rough Finding: Reviewer found that an App-level inspector test claimed viewport-toolbar coverage while clicking a BevyViewport mock button instead of the production BevyViewport to ViewportToolbar to ViewportOverlayMenu path. Future UI forwarding moves need focused real-path coverage plus test names that do not overclaim mocked integration coverage.
- Why It Matters: <clarify during triage>
- Evidence: PR 425; review finding on apps/editor/src/__tests__/App.router.test.tsx
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: ux
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: done
- Fast Track: no
