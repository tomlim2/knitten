---
status: done
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: workflow
contexts:
  - CINEV/shotloom#416 shotloom-respond-pr
promotion-target: agent/skills/shotloom-respond-pr/PROMOTED_FINDINGS.md
urgent: false
---

# Do not respond to unassigned Shotloom PRs

## Summary

사용자가 assignee가 아닌 CINEV/shotloom PR #416에 shotloom-respond-pr 흐름으로 응대하면서 tomlim2 커밋과 reply가 PR에 들어갔다. 앞으로 Shotloom PR/이슈 응대 전에는 내가 assignee인지 확인하고, 내가 assignee가 아니면 응대/커밋/댓글/리뷰요청을 금지해야 한다.

## Observations

### 1. Initial capture

- Observed In: CINEV/shotloom#416 shotloom-respond-pr
- Rough Finding: 사용자가 assignee가 아닌 CINEV/shotloom PR #416에 shotloom-respond-pr 흐름으로 응대하면서 tomlim2 커밋과 reply가 PR에 들어갔다. 앞으로 Shotloom PR/이슈 응대 전에는 내가 assignee인지 확인하고, 내가 assignee가 아니면 응대/커밋/댓글/리뷰요청을 금지해야 한다.
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

- Current State: done
- Fast Track: no

## Resolution

Done by [PR #77](https://github.com/tomlim2/knitten/pull/77), merged
2026-05-27.

| Evidence | Value |
|---|---|
| Merge commit | `2903def0565ced5719e6693fecf8392b566cae87` |
| Scope | `agent/rules/shotloom.md`, `agent/skills/shotloom-respond-pr/SKILL.md`, `agent/skills/shotloom-auto-pr/SKILL.md`, and GitHub PR helper scripts |
| Outcome | Shotloom PR/issue response flows now require a `tomlim2` assignee guard before comments, edits, commits, pushes, PR body refreshes, or reviewer re-requests. |
