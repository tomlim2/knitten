---
status: captured
created: 2026-05-27
updated: 2026-05-27
initial-source: user-report
area: config
contexts:
  - git-pull-repos / repo-paths.json
promotion-target: unknown
urgent: false
---

# repo-paths lacks pull target policy

## Summary

repo-paths.json can register a repository without a way to mark it out of scope for git-pull-repos. git-pull-repos currently treats every entry with a path and .git directory as pull target; worktreePolicy.enabled exists but does not control pull inclusion. Need an explicit pullPolicy.enabled or equivalent so config can distinguish path lookup from pull participation.

## Observations

### 1. Initial capture

- Observed In: git-pull-repos / repo-paths.json
- Rough Finding: repo-paths.json can register a repository without a way to mark it out of scope for git-pull-repos. git-pull-repos currently treats every entry with a path and .git directory as pull target; worktreePolicy.enabled exists but does not control pull inclusion. Need an explicit pullPolicy.enabled or equivalent so config can distinguish path lookup from pull participation.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: config
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
