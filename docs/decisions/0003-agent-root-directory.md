---
status: accepted
date: 2026-05-10
supersedes: docs/decisions/0001-platform-neutral-agent-system.md
---
# Agent Root Directory

## Decision

`caol-ila` uses `agent/` as the canonical repository root for shared agent artifacts.

| Path | Role |
|------|------|
| `agent/` | Canonical repo source for shared agent rules, standards, skills, commands, config, hooks, templates, and durable shims |
| `~/.claude/` | Claude Code deploy target and runtime path |
| root entry documents | Harness-specific cold-start files that read `SYSTEM.md` first |

The folder name `agent/` is the shared-source name. It does not rename the Claude Code runtime contract.

## Context

Decision `0001` blocked a neutral directory rename until platform metadata, adapter boundaries, and validation existed. Those prerequisites now exist:

| Prerequisite | Current owner |
|--------------|---------------|
| Shared policy root | `SYSTEM.md` |
| Harness registry | `agent/config/agent-hub.json` after this migration |
| Platform metadata | `agent/config/frontmatter-schema.json` |
| Route-domain metadata | `agent/config/context-routing.json` |
| Drift checks | `scripts/validate-llm-first.mjs` |

Keeping `claude/` as the canonical repo path now creates cold-start ambiguity: the repo claims to be agent-neutral while its durable source path is named for one harness.

## Accepted Rule

| Rule | Effect |
|------|--------|
| Canonical source path is `agent/` | Docs, validators, and registries point to `agent/...` |
| Claude deploy target remains `~/.claude/` | Claude Code imports and runtime files keep their harness path |
| Entry documents stay thin | `CLAUDE.md` and `AGENTS.md` translate shared source into harness mechanics |
| Vendor Claude examples keep `.claude/` | External plugin docs and runtime conventions are not rewritten as repo policy |

## Cascade

When this decision changes:

1. Edit `SYSTEM.md` durable source and deploy target policy.
2. Edit `AGENT-HUB.md`, `README.md`, `LOOKUP.md`, and entry documents.
3. Edit `agent/config/agent-hub.json` and `agent/config/context-routing.json`.
4. Edit `scripts/validate-llm-first.mjs` path constants and generated block output.
5. Verify `~/.claude` points at `caol-ila/agent`.

## Consequences

- Agent cold starts see a neutral shared source path.
- Claude Code still reads `@~/.claude/...` imports.
- Codex reads `agent/rules/index.md` and route-domain artifacts directly.
- Any future harness can add an entry adapter without inheriting Claude-named source paths.
