---
name: ah-setup-harness
description: Connects external agent harnesses (Pi, Claude Code, Codex, Cursor) to the agent-hub. Enforces user consent.
---

# ah-setup-harness

Use this skill when installing a new AI coding agent on the machine, or when configuring an agent to access the agent-hub globally.

## Purpose
The agent-hub is the durable source of truth for entry documents, rules, standards, skills, config, hooks, and shared libraries. This skill maps durable files and folders to local deploy targets (like `~/.codex/AGENTS.md`, `~/.pi/settings.json`, or `~/.claude/skills`).

## Execution Flow (MANDATORY)

You **must** follow these three steps in order. Do not execute the final script without user approval.

### 1. Explain the Action
Tell the user: "To use the full capabilities of the agent-hub, I need to link it to your current harness configuration (via symlinks or JSON config edits). I will run a dry run first to show you exactly what will change."

### 2. Run the Dry Run
Execute the script in dry-run mode to see the proposed changes without altering the filesystem:

```bash
node scripts/link-harnesses.mjs --dry-run
```

For one harness only:

```bash
node scripts/link-harnesses.mjs --dry-run --harness codex
```

Check the dry-run output before asking to proceed:

- Link-based harnesses must show their entry document mapping plus `rules`, `standards`, and `skills` mappings.
- The entry document source must live under `agent/` (for example, `agent/CLAUDE.md` or `agent/AGENTS.md`); root entry documents are not canonical.
- Existing harness-owned directories and hidden children, such as `~/.codex/skills/.system`, must be preserved; the installer syncs visible directory entries instead of replacing the whole directory.
- Missing required mappings are install blockers; fix `agent/config/agent-hub.json` first.
- Run `node scripts/validate-llm-first.mjs` after manifest edits.

Show the output to the user and explicitly ask: **"Do you want to proceed and apply these changes?"**

### 3. Apply the Changes
Only if the user replies affirmatively (e.g., "yes", "proceed", "do it"), run the active script:

```bash
node scripts/link-harnesses.mjs
```

For one harness only:

```bash
node scripts/link-harnesses.mjs --harness codex
```

## How it works
1. Reads `agent/config/agent-hub.json`.
2. Locates any harness with a `linkMethod` defined.
3. Automatically sets up symlinks or edits global JSON configs.
4. Preserves any existing config values or real folders it finds by backing them up first.
