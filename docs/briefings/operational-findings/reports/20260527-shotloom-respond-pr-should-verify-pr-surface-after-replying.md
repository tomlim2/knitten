---
status: done
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: skill
contexts:
  - shotloom-respond-pr post-response verification
promotion-target: unknown
urgent: false
---

# shotloom-respond-pr should verify PR surface after replying

## Summary

shotloom-respond-pr 응대 후에도 REST comments와 GraphQL reviewThreads 표면이 달라 unresolved actionable thread가 남을 수 있다. Reply/re-request 뒤 Step 9 전에 post-response verification pass를 넣어 GraphQL unresolved threads, 새 human/bot inline, reply 부착 여부, CI 상태를 다시 확인하고 남은 항목을 다음 respond queue로 보고해야 한다.

## Observations

### 1. Initial capture

- Observed In: shotloom-respond-pr post-response verification
- Rough Finding: shotloom-respond-pr 응대 후에도 REST comments와 GraphQL reviewThreads 표면이 달라 unresolved actionable thread가 남을 수 있다. Reply/re-request 뒤 Step 9 전에 post-response verification pass를 넣어 GraphQL unresolved threads, 새 human/bot inline, reply 부착 여부, CI 상태를 다시 확인하고 남은 항목을 다음 respond queue로 보고해야 한다.
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
| Scope | `agent/skills/shotloom-respond-pr/SKILL.md`, `agent/skills/shotloom-respond-pr/reference.md`, and `agent/lib/github-pr-review-snapshot.mjs` |
| Outcome | The response workflow now includes post-response verification before the final summary, including reply attachment, fresh review items, expected unresolved threads, and CI/check state. |
