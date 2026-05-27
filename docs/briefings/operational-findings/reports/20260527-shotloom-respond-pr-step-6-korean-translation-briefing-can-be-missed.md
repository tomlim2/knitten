---
status: done
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: skill
contexts:
  - shotloom-respond-pr Korean reporting flow audit
promotion-target: unknown
urgent: false
---

# shotloom-respond-pr Step 6 Korean translation briefing can be missed

## Summary

shotloom-respond-pr 리포팅 점검: 한글 완역 블록 요구는 Step 9에 명시되어 있으나, GitHub reply draft 승인 배치가 작성되는 Step 6 본문 근처에는 짧은 체크가 없어 실행자가 승인 전 완역을 누락할 수 있다. Step 6 approval batch에도 리뷰어 원문 완역/내 리플라이 완역 포함을 중복 명시하는 보강이 필요하다.

## Observations

### 1. Initial capture

- Observed In: shotloom-respond-pr Korean reporting flow audit
- Rough Finding: shotloom-respond-pr 리포팅 점검: 한글 완역 블록 요구는 Step 9에 명시되어 있으나, GitHub reply draft 승인 배치가 작성되는 Step 6 본문 근처에는 짧은 체크가 없어 실행자가 승인 전 완역을 누락할 수 있다. Step 6 approval batch에도 리뷰어 원문 완역/내 리플라이 완역 포함을 중복 명시하는 보강이 필요하다.
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

- Current State: done
- Fast Track: no

## Resolution

Done by [PR #77](https://github.com/tomlim2/knitten/pull/77), merged
2026-05-27.

| Evidence | Value |
|---|---|
| Merge commit | `2903def0565ced5719e6693fecf8392b566cae87` |
| Scope | `agent/skills/shotloom-respond-pr/SKILL.md` |
| Outcome | The Korean user briefing is now a final reporting frame rather than a GitHub reply translation audit block, reducing approval-batch drift while preserving Korean user-facing summaries. |
