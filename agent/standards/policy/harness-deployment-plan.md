---
status: draft
---
# Harness Deployment Plan

Current context: agent-hub defines the durable source (`<agent-hub-checkout>/agent/`)
and mentions deploy targets such as `~/.claude/` in `SYSTEM.md`. However, it
lacks a standardized, cross-platform mechanism to deploy or link those artifacts
globally for any agent, including Claude, Codex, Pi, Cursor, and future
harnesses.

This plan standardizes harness deployment across all agents and models.

## Phase 1: Define the Deployment Standard
Create a canonical policy that dictates *how* deploy targets connect to the durable source.
- **Target:** `agent/standards/policy/harness-deployment.md`
- **Content:**
  - **Decision Matrix:** When to use Symlinks (e.g., `~/.claude/skills`), Hardlinks (if cross-device restrictions apply), or Config files (e.g., `~/.pi/settings.json`).
  - **Rule:** Never copy. Always link or configure. Edits from any harness must securely write back to `<agent-hub-checkout>/agent/`.

## Phase 2: Create the Harness Registry
Create a machine-readable source of truth for all known agents and their global paths.
- **Target:** `agent/config/harness-registry.json`
- **Proposed Schema:**
  ```json
  {
    "harnesses": [
      {
        "name": "claude",
        "targetPath": "~/.claude",
        "linkMethod": "symlink",
        "mappings": { "skills": "agent/skills", "commands": "agent/commands" }
      },
      {
        "name": "pi",
        "targetPath": "~/.pi",
        "linkMethod": "json-config",
        "configFile": "settings.json",
        "configFormat": { 
          "skills": ["$AGENT_HUB_ROOT/agent/skills"],
          "prompts": ["$AGENT_HUB_ROOT/agent/commands"]
        }
      },
      {
        "name": "codex",
        "targetPath": "~/.codex",
        "linkMethod": "symlink",
        "mappings": { "skills": "agent/skills" }
      }
    ]
  }
  ```

## Phase 3: Build the Automation Skill & Script
An agent should be able to instantly connect a new machine or a newly installed harness to agent-hub.
- **Target Script:** `scripts/link-harnesses.mjs` (reads registry, resolves `$AGENT_HUB_ROOT`, applies links/configs safely).
- **Target Skill:** `agent/skills/ah-setup-harness/SKILL.md` (executes the script, backs up existing configs, handles errors).

## Phase 4: Validation
Ensure the local machine's state matches the deployment standard.
- **Target:** `scripts/validate-harness-links.mjs`
- **Duty:** Validates that `~/.pi/settings.json`, `~/.claude/skills`, and equivalent deploy targets correctly point back to the agent-hub root, warning the user/agent if a link is broken. Fits into existing `scripts/validate-llm-first.mjs` flow.
