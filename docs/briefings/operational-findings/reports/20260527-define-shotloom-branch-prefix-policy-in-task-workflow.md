---
status: captured
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: workflow
contexts:
  - Shotloom editor UI stickerbook branch was named codex/editor-ui-stickerbook-guideline; user expected a Shotloom-specific prefix policy to exist
promotion-target: unknown
urgent: false
---

# Define Shotloom branch prefix policy in task workflow

## Summary

Shotloom task workflow does not appear to define or enforce a repository-specific branch prefix, so Codex's default codex/ branch prefix can leak into Shotloom work branches. The start-task and make-pr skills should explicitly define the branch naming policy and either create branches with that prefix or warn before PR creation when the branch does not match.

## Observations

### 1. Initial capture

- Observed In: Shotloom editor UI stickerbook branch was named codex/editor-ui-stickerbook-guideline; user expected a Shotloom-specific prefix policy to exist
- Rough Finding: Shotloom task workflow does not appear to define or enforce a repository-specific branch prefix, so Codex's default codex/ branch prefix can leak into Shotloom work branches. The start-task and make-pr skills should explicitly define the branch naming policy and either create branches with that prefix or warn before PR creation when the branch does not match.
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
