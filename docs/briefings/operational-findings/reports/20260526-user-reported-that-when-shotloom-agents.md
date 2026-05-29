---
status: captured
created: 2026-05-26
updated: 2026-05-26
initial-source: user-report
area: workflow
contexts:
  - shotloom-review-before-pr on CINEV/shotloom PR #397; worktree <shotloom-worktree>/respond-pr-397
promotion-target: agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md
urgent: false
---

# User reported that when Shotloom AGENTS

## Summary

User reported that when Shotloom AGENTS.md asks Codex to read SYSTEM.md and agent/rules/index.md, but the current worktree lacks those files, raw read errors like 'sed: SYSTEM.md: No such file or directory' surfaced during shotloom-review-before-pr. This should not happen; the bootstrap/preflight path should either resolve the shared policy location, clearly mark it optional/fallback, or report a structured missing-policy condition instead of leaking raw shell errors.

## Observations

### 1. Initial capture

- Observed In: shotloom-review-before-pr on CINEV/shotloom PR #397; worktree <shotloom-worktree>/respond-pr-397
- Rough Finding: User reported that when Shotloom AGENTS.md asks Codex to read SYSTEM.md and agent/rules/index.md, but the current worktree lacks those files, raw read errors like 'sed: SYSTEM.md: No such file or directory' surfaced during shotloom-review-before-pr. This should not happen; the bootstrap/preflight path should either resolve the shared policy location, clearly mark it optional/fallback, or report a structured missing-policy condition instead of leaking raw shell errors.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
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
