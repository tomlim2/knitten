---
status: accepted
platforms: all
portability: shared
---
# Harness Deployment Standard

Defines how external LLM agents and harnesses (Claude Code, Pi, Codex, Cursor, etc.) connect to the durable configuration source in `caol-ila/agent/`.

## Core Contract

| Term | Rule |
|------|------|
| Durable Source | `caol-ila/agent/` is the single source of truth. Configurations live here. |
| Deploy Target | The global path a harness reads from (e.g., `~/.claude`, `~/.pi`). |
| Deployment Method | The mechanism that connects the deploy target to the durable source. |

## Deployment Methods

Never manually copy files from the durable source to a deploy target. Always link or configure the harness to read directly from `caol-ila`.

| Harness Type | Deployment Method | Example |
|--------------|-------------------|---------|
| Native Config | JSON configuration pointing to absolute paths | `~/.pi/settings.json` pointing to `/path/to/caol-ila/agent/skills` |
| Link-based | File system symlinks or hardlinks | `~/.claude/skills` symlinked to `/path/to/caol-ila/agent/skills` |

When a harness natively supports reading external paths via configuration (like `pi` via `settings.json`), **Native Config** is preferred over symlinking. 

## Harness Registry

All supported harnesses must be registered in `agent/config/agent-hub.json` under the `harnesses` array. The registry dictates:
1. The `id` and `displayName` of the harness.
2. The `deployTarget`.
3. The `linkMethod` (`symlink`, `json-config`, etc.).

## Validation

The local machine's deployment state is validated by `scripts/validate-harness-links.mjs`. If a harness is listed in `agent-hub.json`, the deployment script ensures its deploy target exists and correctly points to the `caol-ila` root. Broken links or mismatched configurations will trigger a validation error.