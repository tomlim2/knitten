# Operational Finding Reports

One report-context file per captured finding cluster.

Default filename shape:

```text
YYYYMMDD-<slug>.md
```

If a filename already exists, append `-2`, `-3`, and so on.

## Completed Reports

When a finding is complete:

1. Create an Obsidian learning note for reusable context.
2. Replace the report body with a thin resolution stub.
3. Update the inbox status to `resolved` or `assetized`.

Stub fields:

```yaml
status: assetized
resolved-by: <PR-or-commit>
resolved-at: YYYY-MM-DD
moved-to: <Obsidian-note-path>
```

The stub keeps queue history. The Obsidian note owns the longer explanation.
