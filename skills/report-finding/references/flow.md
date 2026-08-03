# Report Finding Flow

Use this reference after `report-finding` Step 0 passes.

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
or domain plugin.

If the user supplied an existing finding path, use that exact record and its
`operational-findings` ancestor for this task. Do not redirect it to another
checkout.

Otherwise, use the runtime Knitten plugin root that supplied the currently
loaded `report-finding` skill. Do not substitute the current working directory,
the checkout containing `SYSTEM.md`, a domain plugin root, or a guessed
`$HOME` path. When the runtime root is a Codex cache entry, its shim resolves the
active installed Knitten hub.

Locate an existing queue without creating a record:

```bash
resolver="<runtime-knitten-plugin-root>/bin/knitten-resolve-output"
resolution="$("$resolver" --skill=report-finding --name=queue-location-probe)"
queue_root="$(printf '%s' "$resolution" | jq -er '.operationalFindingsRoot')"
```

Resolve a new record path with:

```bash
"$resolver" --skill=report-finding --name=<finding-name> --create
```

Treat the resolver JSON fields `hubRoot`, `operationalFindingsRoot`, and
`selectedPath` as authoritative. This writes under:

```text
<resolved-hub-root>/.agent-local/workflow/operational-findings/<YYYY-MM-DD>/reports/
```

Include the affected repository, plugin, skill, or path in the JSON body as
metadata. Do not redirect the storage owner.

If the record implies a temporary skill-local gate or check, send that follow-up
to the domain plugin that owns the skill. Do not make a domain plugin own the
finding report itself.
