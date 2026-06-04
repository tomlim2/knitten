---
name: ah-report-finding
description: Record a recurring AH workflow or system finding with context, impact, evidence, and a suggested next action.
---

# AH Report Finding

Use this leaf skill only for checked mechanical errors:

- missing file, path, script, config, skill, or command
- stale skill reference to a moved config or helper
- source, installed copy, or Codex cache drift
- doctor, validator, install, or plugin boundary failure

Do not use this skill for ideas, naming/style preferences, guesses, one-off
confusion, or user-directed scope changes.

## Input

- Finding description.
- Evidence or reproduction notes that make the mismatch mechanically checkable.
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
