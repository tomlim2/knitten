# Knitten Core

Knitten Core is an LLM-first agent operating core. It provides shared policy,
entry documents, routing, validation, and artifact-pack infrastructure for
agent workflows.

## Contents

| Path | Purpose |
|------|---------|
| `SYSTEM.md` | Shared policy loaded before harness-specific behavior. |
| `agent/AGENTS.md` | Codex entry document template. |
| `agent/CLAUDE.md` | Claude Code entry document template. |
| `agent/rules/` | Always-on and triggered operating rules. |
| `agent/skills/` | Core lifecycle and artifact management skills. |
| `agent/config/` | Machine-readable registries and validation inputs. |
| `scripts/validate-llm-first.mjs` | Repository validator. |

## Validate

```bash
node scripts/validate-llm-first.mjs
```

## Artifact Packs

Artifact packs are manifest-declared collections of optional agent artifacts.
Core keeps the resolver, installer, validation gates, and bootstrap workflows.
Domain, company, personal, and repository-specific workflows should live in
packs instead of the public core tree.

## License

Apache License 2.0. See `LICENSE`.

## Status

This README is the public core overlay source. The private integration
repository may keep a different generated README for local inventory.
