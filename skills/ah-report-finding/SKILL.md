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

Do not invent a storage path. Finding records always accumulate in the Knitten
core hub queue, even when the observed mechanical error is in another repository
or payload plugin.

Resolve the record path with:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-report-finding --name=<finding-name> --create
```

This writes under
`<knitten-plugin-root>/.agent-local/ah/operational-findings/<YYYY-MM-DD>/`.
Include the affected repository, plugin, skill, or path in the JSON body as
metadata; do not redirect the storage owner.

If the record implies a temporary skill-local gate or check, route the follow-up
through `ah-promote-reference`. Do not make a payload plugin own the report
itself.
