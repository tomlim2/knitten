---
name: ah-report-finding
description: Record a recurring AH workflow or system finding with context, impact, evidence, and a suggested next action.
---

# AH Report Finding

Use this support leaf skill when a recurring workflow issue, failed assumption,
or system gap should be captured instead of buried in a task summary.

## Input

- Finding description.
- Evidence or reproduction notes.
- Affected workflow, skill, script, doc, or repository surface.

## Output

- Structured finding record.
- Impact.
- Suggested next action.

## Shape

Record:

- title
- context
- evidence
- impact
- suggested next action
- status

Do not invent a storage path. Use the active repository's documented finding
location when one exists; otherwise report the record in the response.

If a temporary local scratch path is needed, resolve it with:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs --skill=ah-report-finding --name=<finding-name> --create
```
