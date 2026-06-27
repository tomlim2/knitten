# Public Metadata

Status: recommended. GitHub repository settings are not changed by this file.

Use this document as the source of truth when aligning public-facing repository
metadata, README copy, marketplace text, or release notes.

## GitHub About

Recommended:

```text
Lightweight Codex workflow core for compact checked agent workflows.
```

Repo-file status:

- `.codex-plugin/plugin.json` uses the same positioning.
- Top-level `README.md` uses the same positioning.

GitHub settings status:

- Not tracked in git.
- Apply manually in GitHub settings, or use a later authenticated `gh repo edit`
  task when external mutation is explicitly approved.

## GitHub Topics

Recommended topics:

- `codex`
- `codex-plugin`
- `ai-agent`
- `developer-tools`
- `workflow-automation`
- `prompt-engineering`
- `token-optimization`
- `compact-workflows`

These topics are recommendations until the repository settings are updated.

## Release Note Wording

Prefer:

```text
Knitten is a lightweight Codex workflow core for compact checked agent
workflows. It keeps common steps, output paths, validation, and ownership rules
small, with detailed procedure loaded only after a clear match.
```

## Claim Guardrails

- Say Knitten avoids unnecessary context and work.
- Cite the measurement commands before publishing numeric token or smoke-eval
  claims.
- Do not claim every task uses fewer tokens.
- Do not frame token savings as a substitute for validation, safety checks, or
  required implementation.
