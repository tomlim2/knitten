---
status: accepted
---

# Operational Finding Report

Use this template for one captured finding report in the Knitten operational
findings pipeline.

- One file = one report context.
- A report context may group multiple related observations from the same PR,
  skill-use session, workflow pass, or user-reported issue cluster.
- Capture first. Precise diagnosis, routing, and promotion can happen later.

## Frontmatter

```yaml
---
status: captured
created: YYYY-MM-DD
updated: YYYY-MM-DD
source: wrapup-task
area: skill
contexts:
  - shotloom-pr-388
promotion-target: unknown
urgent: false
---
```

## Title

```markdown
# <short report title>
```

Rules:

- Agent generates the default title/slug.
- If the user provides a title, reuse or adapt it.
- Keep the title specific enough to find later.

## Summary

```markdown
## Summary

<1-3 lines describing what felt wrong or what should be revisited later.>
```

## Observations

```markdown
## Observations

### 1. <observation title>

- Observed In: <PR / skill / workflow / repo / date context>
- Rough Finding: <what happened or felt wrong>
- Why It Matters: <impact, confusion, drag, risk, or missing contract>
- Evidence: <review note / file path / command output / user note / memory>
- Follow-up Guess: <optional rough direction>
- Needs Clarification: yes|no
```

Rules:

- Multiple observations are allowed when they share one report context.
- Do not force perfect classification during capture.
- Prefer useful rough evidence over polished conclusions.

## Suggested Follow-up

```markdown
## Suggested Follow-up

- Next pass should clarify: <question / ambiguity / routing choice>
- Possible destination: <skill | rule | standard | validator | spec | docs | config | workflow | routing | ux | other | unknown>
```

## Status

```markdown
## Status

- Capture State: captured
- Triage State: pending
- Fast Track: no
```

Rules:

- Default to `captured` / `pending` / `no`.
- If the user explicitly says this needs urgent handling, set `Fast Track: yes`.

## Notes

- This template is for capture, not final diagnosis.
- Do not require a complete problem statement before saving the report.
- Prefer append-safe, LLM-first structure over narrative prose.
