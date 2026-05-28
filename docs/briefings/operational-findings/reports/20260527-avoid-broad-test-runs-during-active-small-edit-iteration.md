---
status: captured
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: workflow
contexts:
  - Shotloom /dev/ui stickerbook iteration; user asked whether to document this in Knitten report
promotion-target: agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md
urgent: false
---

# Avoid broad test runs during active small-edit iteration

## Summary

작업 중 작은 스타일/문구 변경마다 broad test suite나 전체 Vitest를 돌리지 말라는 운영 규칙을 명시해야 한다. 동작, 상태, props, 접근성, 라우팅, 데이터 계약이 바뀐 경우에만 targeted test를 돌리고, broad tests/typecheck/full gates는 commit, review-before-pr, make-pr, 또는 사용자가 명시적으로 요청했을 때로 미룬다.

## Observations

### 1. Initial capture

- Observed In: Shotloom /dev/ui stickerbook iteration; user asked whether to document this in Knitten report
- Rough Finding: 작업 중 작은 스타일/문구 변경마다 broad test suite나 전체 Vitest를 돌리지 말라는 운영 규칙을 명시해야 한다. 동작, 상태, props, 접근성, 라우팅, 데이터 계약이 바뀐 경우에만 targeted test를 돌리고, broad tests/typecheck/full gates는 commit, review-before-pr, make-pr, 또는 사용자가 명시적으로 요청했을 때로 미룬다.
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
