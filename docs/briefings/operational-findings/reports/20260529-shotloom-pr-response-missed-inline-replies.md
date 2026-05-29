---
status: done
created: 2026-05-29
updated: 2026-05-29
initial-source: user-report
area: workflow
contexts:
  - shotloom-respond-pr CINEV/shotloom#430
promotion-target: agent/skills/shotloom-respond-pr/PROMOTED_FINDINGS.md
urgent: false
---

# Shotloom PR response missed inline replies

## Summary

PR review-response workflow kept posting top-level PR comments instead of replying to actionable inline review threads. For CINEV/shotloom#430, the latest 5 inline comments were initially missed until the user pointed it out. The respond-pr workflow should force enumeration of /pulls/<PR>/comments and POST replies to each actionable comment id before top-level summary or reviewer re-request.

## Observations

### 1. Initial capture

- Observed In: shotloom-respond-pr CINEV/shotloom#430
- Rough Finding: PR review-response workflow kept posting top-level PR comments instead of replying to actionable inline review threads. For CINEV/shotloom#430, the latest 5 inline comments were initially missed until the user pointed it out. The respond-pr workflow should force enumeration of /pulls/<PR>/comments and POST replies to each actionable comment id before top-level summary or reviewer re-request.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

### 2. Approved PR still needs inline closure discipline

- Observed In: shotloom-respond-pr CINEV/shotloom#430 after reviewer approval
- Rough Finding: when the reviewer approves with non-blocking inline nits, the workflow must still reply to each approved nit inline. If the user explicitly asks to resolve, resolve the newly replied threads and any other unresolved review threads that already have author replies in the same pass.
- Why It Matters: an approved review can still leave visible unresolved conversations. If replies are posted but threads remain unresolved, the PR surface looks unfinished even though CI and review state are green.
- Evidence: CINEV/shotloom#430 had seven approved inline nits. The safe pass posted `/pulls/<PR>/comments/<comment_id>/replies` for each id, then used the review-thread GraphQL surface to resolve the seven unresolved replied threads and verified `missingReplies=0`, `unresolvedThreads=0`, and green CI.
- Follow-up Guess: promote into `shotloom-respond-pr` Step 8/10 as an explicit approved-nit branch: reply inline first, then optionally resolve only after user approval, then verify both REST replies and GraphQL thread state.
- Needs Clarification: no

## Suggested Follow-up

- Next pass should promote this into the Shotloom PR response workflow.
- Problem: top-level comments and unresolved replied threads make PR review state harder to audit.
- Likely Scope: workflow
- Done When: `shotloom-respond-pr` requires inline replies for all actionable approved nits and documents the user-approved resolve pass for all unresolved threads that already have author replies.
- Possible destination: `agent/skills/shotloom-respond-pr/SKILL.md` and `agent/skills/shotloom-respond-pr/PROMOTED_FINDINGS.md`

## Status

- Current State: done
- Fast Track: no
