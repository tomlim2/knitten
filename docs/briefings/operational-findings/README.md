# Operational Findings

Knitten-wide operational finding references live here after promotion.

Raw finding capture is temporary and local:

```text
.agent-local/ah/operational-findings/YYYY-MM-DD/
```

Temporary raw captures are JSON. Markdown belongs only to durable tracked
reports, ledgers, rules, standards, specs, or decisions.

| Path | Purpose |
|------|---------|
| `reports/` | Legacy promoted or retained report stubs. Do not write new raw captures here. |
| `fast-track-manual.md` | Manual route for urgent findings. |

The temporary daily index is
`.agent-local/ah/operational-findings/YYYY-MM-DD/inbox.json`.

## Completion Policy

Completed findings leave the active queue.

| State | Repo action | Obsidian action |
|-------|-------------|-----------------|
| `captured` / `triaged` | Keep full report in `reports/`. | None. |
| `resolved` | Keep a thin repo stub with resolution metadata. | Create a vault note when the finding has reusable context. |
| `assetized` | Keep only the stub and `moved-to` path. | Obsidian note owns the durable explanation. |
| `discarded` | Keep or delete only when the report has no reusable context. | None unless the discarded context is still useful. |

Rules:

- Do not keep completed finding details in the active report queue.
- Move reusable completion context to Obsidian with `ah-resolve-doc-path doc learning agent-hub`.
- Keep the repo stub with `status`, `resolved-by`, `resolved-at`, and `moved-to`.
- Delete a completed report only when another durable artifact already owns the
  context or the report was invalid.
