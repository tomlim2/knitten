---
status: accepted
platforms: all
portability: shared
---
# Harness Deployment Standard

Defines how external LLM agents and harnesses, including Claude Code, Pi, Codex, Cursor, and future adapters, connect to the durable agent-hub configuration source.

## Core Contract

| Term | Rule |
|------|------|
| Durable Source | `agent/` in the agent-hub checkout is the single source of truth. Configurations live here. |
| Deploy Target | The global path a harness reads from (e.g., `~/.claude`, `~/.pi`). |
| Deploy Entry Template | Harness entry document tracked under `agent/` and linked into the deploy target. |
| Deployment Method | The mechanism that connects the deploy target to the durable source. |

## Deployment Methods

Never manually copy files from the durable source to a deploy target. Always link or configure the harness to read directly from the agent-hub checkout.

| Harness Type | Deployment Method | Example |
|--------------|-------------------|---------|
| Native Config | JSON configuration pointing to absolute paths | `~/.pi/settings.json` pointing to `<agent-hub-checkout>/agent/skills` |
| Link-based | File system symlinks or hardlinks | `~/.claude/skills` symlinked to `<agent-hub-checkout>/agent/skills` |

When a harness natively supports reading external paths via configuration (like `pi` via `settings.json`), **Native Config** is preferred over symlinking. 

Entry documents follow the same rule as other harness files: keep the durable template under `agent/`, then let the installer create the deploy-target entry file. Do not add repo-root `CLAUDE.md`, `AGENTS.md`, or future harness entry files as tracked configuration. For example, `agent/CLAUDE.md` deploys to `~/.claude/CLAUDE.md`, and `agent/AGENTS.md` deploys to `~/.codex/AGENTS.md`.

## Required Shared-Layer Coverage

For every link-based harness, `agent/config/agent-hub.json` `mappings` must include the operator-facing shared layers:

| Mapping | Source |
|---------|--------|
| harness entry file (e.g., `CLAUDE.md`, `AGENTS.md`) | `agent/<entry-file>` |
| `rules` | `agent/rules` |
| `standards` | `agent/standards` |
| `skills` | `agent/skills` |
| `commands` | `agent/commands` |

Omitting one of these mappings is an install blocker. Fix the registry before running the installer, then validate with `node scripts/validate-llm-first.mjs`.

When a deploy target directory already exists, installers must preserve harness-owned children and sync mapped entries inside it. Hidden children are harness-owned by default. Example: do not replace `~/.codex/skills` as a whole, and do not overwrite `~/.codex/skills/.system`.

## Harness Registry

All supported harnesses must be registered in `agent/config/agent-hub.json` under the `harnesses` array. The registry dictates:
1. The `id` and `displayName` of the harness.
2. The deploy entry template in `entryDocument`.
3. The `deployTarget`.
4. The `linkMethod` (`symlink`, `json-config`, or another registered method).

## Validation

The local machine's deployment state is validated by `scripts/validate-harness-links.mjs`. If a harness is listed in `agent-hub.json`, the deployment script ensures its deploy target exists and correctly points to the agent-hub root. Broken links or mismatched configurations will trigger a validation error.
