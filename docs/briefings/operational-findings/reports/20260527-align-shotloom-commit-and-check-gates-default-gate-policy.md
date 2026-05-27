---
status: captured
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: skill
contexts:
  - Shotloom commit workflow review during editor UI stickerbook work; user asked whether commit or push should run gates and where this is specified
promotion-target: unknown
urgent: false
---

# Align Shotloom commit and check-gates default gate policy

## Summary

shotloom-commit states that its default gate bundle includes fmt, clippy, check, test, and doc-paths before committing, and says the older commit-fast/push-full split was retired. However shotloom-check-gates defines the default as --fast, which skips cargo test, and only includes cargo test under --full. This creates ambiguity about whether commit-time gates should include tests and which skill is the source of truth for commit vs push gate policy.

## Observations

### 1. Initial capture

- Observed In: Shotloom commit workflow review during editor UI stickerbook work; user asked whether commit or push should run gates and where this is specified
- Rough Finding: shotloom-commit states that its default gate bundle includes fmt, clippy, check, test, and doc-paths before committing, and says the older commit-fast/push-full split was retired. However shotloom-check-gates defines the default as --fast, which skips cargo test, and only includes cargo test under --full. This creates ambiguity about whether commit-time gates should include tests and which skill is the source of truth for commit vs push gate policy.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: skill
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
