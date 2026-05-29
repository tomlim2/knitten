# Pi Customization Log

This document tracks all machine-local or harness-specific customizations applied to the `pi` coding agent. These are settings, skills, and extensions installed directly into `~/.pi/agent/`, intentionally kept out of the `agent-hub` shared durable source because they are specific to the `pi` harness execution environment.

## Settings Injection
**Date:** 2026-05-11
**File:** `~/.pi/agent/settings.json`
**Action:** Configured `pi` to load the `agent-hub` Agent Hub globally.
**Details:** 
- `skills` array points to `$AGENT_HUB_ROOT/agent/skills`.
- Pi prompt configuration uses the shared skills path only.
- `instructions` array points to `$AGENT_HUB_ROOT/SYSTEM.md` (ensuring the LLM-First context is loaded immediately on cold start without needing local project context).

## Pi-Specific Skills
**Date:** 2026-05-11
**Path:** `~/.pi/agent/skills/pi-skills/`
**Action:** Installed the official `pi-skills` repository to enable harness-specific capabilities.
**Details:** 
- Cloned `https://github.com/badlogic/pi-skills` directly into the `pi` global path.
- Provides capabilities like `brave-search`, `browser-tools`, `gccli`, `vscode`, etc.
- **Why here instead of `agent-hub`?** These skills rely on `pi`-specific tool execution or assume the `pi` CLI environment, violating the platform-neutral requirement of `agent-hub/agent/skills`.

---
*Note: Any further `pi`-specific extensions (like the OS-level sandbox) or tools should be documented here and installed in `~/.pi/agent/` to keep `agent-hub` pure.*
