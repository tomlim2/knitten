# Operational Findings

Knitten-wide operational findings live here after capture.

| Path | Purpose |
|------|---------|
| `reports/` | One report-context file per captured finding cluster. |
| `fast-track-manual.md` | Manual route for urgent findings. |

The canonical index is `docs/briefings/operational-findings-inbox.md`.

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
