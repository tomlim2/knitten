# Knitten Core

Knitten Core is an LLM-first agent operating core. It provides shared policy,
entry documents, resolver utilities, output contracts, and artifact-pack
configuration for Codex plugin workflows.

## Contents

| Path | Purpose |
|------|---------|
| `SYSTEM.md` | Shared policy loaded before harness-specific behavior. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `agent/config/` | Machine-readable registries and plugin-local contracts. |
| `agent/document-templates/agent-hub/` | Core document templates used by output contracts. |
| `agent/lib/` | Plugin-local resolver utilities. |
| `docs/public-core/` | Source overlay used by the split synchronization job. |

## Validate

```bash
python3 <plugin-validator-path> .
```

When synchronized through the legacy source repository, run
`scripts/materialize-codex-personal-plugins.mjs` there to refresh the local
Codex personal marketplace copy.

## Artifact Packs

Artifact packs are manifest-declared collections of optional agent artifacts.
Core keeps the resolver, installer, validation gates, and bootstrap workflows.
Domain, company, personal, and repository-specific workflows should live in
packs instead of the public core tree.

## License

MIT License. See `LICENSE`.

## Status

This README is the public core overlay source. The private integration
repository may keep a different generated README for local inventory.
