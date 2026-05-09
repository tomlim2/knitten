---
load: auto
---

- **Hardware specs** — read `~/.claude/private/caol-config/hardware.json`. Run `/system-save-hardware` if missing.
- **Repo paths first** — read `~/.claude/private/caol-config/repo-paths.json` before asking the user for project paths.
- **Machine paths too** — read `~/.claude/private/caol-config/machine-paths.json` for non-repo resources (obsidian, codex-home, fonts). Missing key = "not on this machine", not an error.
- **Config discovery fallback** — if a path key seems missing, `ls ~/.claude/private/` and read every `*.json` first; disk is canonical, not stale rule injections.
- **No hardcoded absolute paths.** Even in throwaway scripts (bash one-shots, ad-hoc Python in `/tmp`), look up paths via config — `jq -r '."<key>"' ~/.claude/private/caol-config/<file>.json` or the relevant resolver skill (`caol-resolve-doc-path` for vault docs). The only hardcoded prefix allowed is `~/.claude/...` (home-relative is fine; user-specific absolute is not).
- **Path missing from config? Register first.** When you need a path that isn't in `repo-paths.json`, `machine-paths.json`, or `doc-paths.json`, add the entry there before using it. Never paper over with an inline absolute path. The config is the canonical registry — if a path is worth typing twice, it's worth registering. (This applies to ad-hoc work too, not just persisted scripts.)
- **Kill by PID** — find PID first, then kill specific PID. Never broad-kill by process name.
