# KC Report Finding Flow

Use this reference after `kc-report-finding` Step 0 passes.

## Input

- Finding description.
- Evidence or reproduction notes that make the mismatch mechanically checkable.
- Affected workflow, skill, script, doc, repository, plugin, or path.

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

## Storage

Do not invent a storage path. Finding records always accumulate in the Knitten
core hub queue, even when the observed mechanical error is in another repository
or payload plugin.

Resolve the record path with:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=kc-report-finding --name=<finding-name> --create
```

This writes under:

```text
<knitten-plugin-root>/.agent-local/ah/operational-findings/<YYYY-MM-DD>/
```

Include the affected repository, plugin, skill, or path in the JSON body as
metadata. Do not redirect the storage owner.

If the record implies a temporary skill-local gate or check, send that follow-up
to the payload plugin that owns the skill. Do not make a payload plugin own the
finding report itself.
