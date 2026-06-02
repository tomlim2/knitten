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

Do not invent a storage path. Use the active or target repository's documented
finding location when one exists; otherwise report the record in the response.

If an operational finding record should be stored in the active workspace,
resolve it with:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-report-finding --name=<finding-name> --create
```

If the finding is about a different target workspace, pass that workspace
explicitly:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-report-finding --name=<finding-name> --target-root=<target-workspace> --create
```
