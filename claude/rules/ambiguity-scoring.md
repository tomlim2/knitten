---
load: auto
---

# Ambiguity Scoring — Always-On Decision Rule

Promoted from behavior.md to first-class auto rule because this is the single most important meta-rule: it decides whether you act or ask, and it must fire before any other decision.

## The rule

When facing an ambiguous action (path of execution unclear, multiple reasonable interpretations, possible user intent mismatch), score the auto-execution safety on a **1-10 scale**.

| Score | Action |
|-------|--------|
| **9-10** | Execute immediately. Do not ask. |
| **5-8** | Show a 1-line score + "what's missing" + ask. Do not execute. |
| **1-4** | Surface options briefly, defer to user. Do not execute. |

## Reporting form

When the score is < 9, lead with **what's missing** (why it's not 10), not the positives. The negative space is the decision-relevant information.

Example:
> 점수 6 — 빠진 것: 사용자 톤(이름·줄임말 선호). README 1줄 description은 자동 생성 가능하지만 voice는 사용자 영역.

## Exceptions

- **Destructive or shared-effect actions** require explicit approval regardless of score (rm -rf, force-push, sending messages, dropping data).
- **Auto-mode active** does not raise the score — it lowers the threshold from "ask" to "make a reasonable assumption", but 1-4 score still means defer.

## Why this is auto-loaded first

This rule changes how every other rule fires. If you don't apply ambiguity scoring, you either ask too often (slow, breaks flow) or execute too aggressively (mistakes). It is the decision gate, not a behavior nuance.
