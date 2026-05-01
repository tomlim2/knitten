---
load: auto
---

- **Hardware specs** — read `~/.claude/private/caol-config/hardware.json`. Run `/system-save-hardware` if missing.
- **Repo paths first** — read `~/.claude/private/caol-config/repo-paths.json` before asking the user for project paths.
- **Machine paths too** — read `~/.claude/private/caol-config/machine-paths.json` for non-repo resources (obsidian, codex-home, fonts). Missing key = "not on this machine", not an error.
- **Config discovery fallback** — if a path key seems missing, `ls ~/.claude/private/` and read every `*.json` first; disk is the source of truth, not stale rule injections.
- **Kill by PID** — find PID first, then kill specific PID. Never broad-kill by process name.
