---
load: auto
---

- **Hardware specs** — read `~/.claude/private/caol-config/hardware.json` first. Run `/system-save-hardware` if missing.
- **Repo paths first** — ALWAYS read `~/.claude/private/caol-config/repo-paths.json` before asking user for project paths. Keys = named git repos (e.g. `caol-ila`, `shotloom`, `codex-base`). Values = absolute paths to repo roots on this machine.
- **Machine paths too** — ALSO read `~/.claude/private/caol-config/machine-paths.json` whenever you need non-repo resources: `obsidian-vault-claude` (may be absent on work Mac — handle gracefully), `obsidian-staging` (fallback log target when vault absent), `codex-home`. Missing key ≠ error; it means "this machine doesn't have that resource". NEVER hardcode these paths or put logs in `~/.claude/ops/` when a log destination already exists here.
- **Config discovery fallback** — when a path/key seems missing, `ls ~/.claude/private/` and read EVERY `*.json` file there before asking the user. Rule-file injections may be stale (file updated mid-session); disk is the source of truth. Why: a past session missed `machine-paths.json → obsidian-staging` and asked the user when the answer was on disk.
- **Kill by PID** — NEVER broad-kill by process name. Find PID first, then kill specific PID.
