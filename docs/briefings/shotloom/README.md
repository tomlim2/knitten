---
status: accepted
---
# Shotloom Briefings

`/shotloom-start-task` writes one briefing per task:

```text
docs/briefings/shotloom/<slug>.md
```

The matching spec lives at:

```text
docs/plans/<slug>.md
```

Commit both files together when `/shotloom-draft-spec` lands a clean direct
spec. The same workflow runs the spec review gate before asking whether to
implement.
