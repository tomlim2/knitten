---
name: kc-report-finding
description: Record checked mechanical workflow findings.
match-check: normal
---

# KC Report Finding

Use for: recording checked mechanical workflow or plugin failures.

Use only for checked mechanical errors:

- missing file, path, script, config, skill, or command
- stale skill reference to a moved config or helper
- source, installed copy, or Codex cache drift
- doctor, validator, install, or plugin boundary failure

Do not use this skill for ideas, naming/style preferences, guesses, one-off
confusion, or user-directed scope changes.

## Step 0: Match Check

Confirm the failure is mechanically checkable, evidence or reproduction notes
are available, and the affected workflow, plugin, skill, script, doc, or path is
known.

Stop if the issue is only a preference, hypothesis, broad idea, or user-directed
scope change.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), write the structured finding
record to the Knitten core hub queue, and report the path.
