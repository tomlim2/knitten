---
name: caol-setup-harness
description: Connects external agent harnesses (Pi, Claude Code, Codex, Cursor) to the caol-ila durable source.
---

# caol-setup-harness

Use this skill when installing a new AI coding agent on the machine, or when the agent asks how to connect to global settings/prompts/skills.

## Purpose
`caol-ila` is the durable source of truth for agent rules, standards, skills, and commands. Rather than manually copying files to global deploy targets (like `~/.pi` or `~/.claude`), this skill automatically configures the harness to point to `caol-ila/agent/`.

## Execution

Run the Node script to link all registered harnesses:

```bash
node scripts/link-harnesses.mjs
```

## How it works
1. Reads `agent/config/agent-hub.json`.
2. Locates any harness with a `linkMethod` defined.
3. Automatically sets up symlinks or edits global JSON configs (e.g., `~/.pi/settings.json`) to inject `caol-ila` paths.
4. Preserves any existing config values it finds.

## Validating (Phase 4)
If you need to verify links are correct without mutating them:
*(Validation logic pending full integration into validate-llm-first.mjs)*