---
status: captured
created: 2026-05-28
updated: 2026-05-28
initial-source: merged-pr-review-sweep
area: workflow
contexts:
  - Shotloom PR 387 review findings
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom compact editor errors must not be hidden

## Summary

Merged PR review findings found a production-default compact editor mode where
timeline errors were suppressed by layout mode even though runtime errors and
command rejections still occurred. Future editor UI refactors should verify
that compact, minimized, or alternative production layouts still surface
critical errors through a layout-independent feedback path.

## Observations

### 1. Merged PR review sweep

- Observed In: Shotloom PR 387, merged 2026-05-21.
- Rough Finding: Timeline compact mode suppressed `timelineError` while the
  production app rendered that compact mode by default. Review also found layout
  and test gaps around inspector sizing, min-mode coverage, raw token usage, and
  topbar sizing.
- Why It Matters: A refactor can keep the subscription path alive while hiding
  the only visible feedback surface from users.
- Evidence: Review requested routing runtime errors and command rejections
  through a mode-independent toast or equivalent path, plus tests for shipped
  default mode.
- Follow-up Guess: Promote to review ledger for editor UI refactors.
- Needs Clarification: no

## Suggested Follow-up

- Problem: Mode-specific layout checks can accidentally become error visibility
  gates.
- Likely Scope: review
- Done When: future compact/minimized UI changes prove critical errors remain
  visible and tests exercise the production-default layout mode.
- Possible destination: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md

## Status

- Current State: captured
- Fast Track: no
