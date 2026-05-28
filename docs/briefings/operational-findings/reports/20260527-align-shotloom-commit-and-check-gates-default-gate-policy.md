---
status: resolved
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: skill
contexts:
  - Shotloom commit workflow review during editor UI stickerbook work; user asked whether commit or push should run gates and where this is specified
promotion-target: agent/skills/shotloom-check-gates/reference.md
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

- Current State: resolved
- Fast Track: no

## Resolution

Resolved by [PR #76](https://github.com/tomlim2/knitten/pull/76), merged 2026-05-27.

| Evidence | Value |
|---|---|
| Merge commit | `e55cf301011a866aea2a7609c383278a46dd51a3` |
| Scope | `shotloom-commit`, `shotloom-check-gates`, `shotloom-auto-pr`, `shotloom-respond-pr`, and `shotloom.md` |
| Outcome | Shotloom repo guidelines are the first policy source. Skill-local extra evidence gates are additive only and recorded in each skill's `reference.md`. `shotloom-commit` no longer owns gate policy or exposes a commit-local gate flag. |
