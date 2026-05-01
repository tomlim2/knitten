- **Hardware specs** — read `~/.claude/private/caol-config/hardware.json` first. Run `/system-save-hardware` if missing.
- **Repo paths first** — ALWAYS read `~/.claude/private/caol-config/repo-paths.json` before asking user for project paths. Keys = named git repos (e.g. `caol-ila`, `shotloom`, `codex-base`). Values = absolute paths to repo roots on this machine.
- **Machine paths too** — ALSO read `~/.claude/private/caol-config/machine-paths.json` whenever you need non-repo resources: `obsidian-vault-claude` (may be absent on work Mac — that's normal, handle gracefully), `obsidian-staging` (fallback log target when vault absent), `codex-home`. Missing key ≠ error; it means "this machine doesn't have that resource". NEVER hardcode these paths or put logs in `~/.claude/ops/` when a log destination already exists here.
- **Config discovery fallback** — when a path/key seems missing, `ls ~/.claude/private/` and read EVERY `*.json` file there before asking the user. Rule-file injections may be stale (file updated mid-session); disk is the source of truth. Why: a past session missed `machine-paths.json → obsidian-staging` and asked the user when the answer was on disk.
- **codex-base vs codex-home (don't confuse)** — Two distinct keys with overlapping path prefix.

  | Key | Source | Path | Role |
  |-----|--------|------|------|
  | `codex-base` | `repo-paths.json` | `~/.codex/codex-base` | Project subdir used like a git workspace by `cci-add-codex-order` and other `cci-*` Codex skills |
  | `codex-home` | `machine-paths.json` | `~/.codex` | Codex tooling root |

  When adding a new Codex skill: pick `repo-paths` for project-workspace operations, `machine-paths` for tooling-root operations.
- **Slack confirm first** — ALWAYS show full message and get explicit approval before sending ANY Slack message.
- **Writing pipeline** — External content: `/writing-draft-human` → `/writing-fix-ai` → final. Internal content exempt.
- **Docs path: ALWAYS resolve via `caol-resolve-doc-path` first** — never hand-build a doc path by reading `machine-paths.json` directly. The resolver is the single source of truth; it reads `doc-paths.json` and falls back to `obsidian-staging` automatically when the vault is absent.
  - Trigger purposes (use as the resolver's first arg): `devlog`, `learning`, `topic`, `postmortem`, `consulting`, `research`, `notes`, `experiment`, `tutoring`, `drinks`, `vocab`, `private-data`, `ops`.
  - Any user request that maps to these (개발일지, 회고, 메모, 결정 기록, 학습 로그, 포스트모템, devlog, learning, decision record 등) MUST route through the resolver — even for ad-hoc one-off writes inside conversation, not just when a `*-log-*` skill is invoked.
  - Run: `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh <purpose> [project]`. Read `RESOLVED_PATH` from output — that is the directory to write to. `VAULT_AVAILABLE=false` means it auto-fell-back to `obsidian-staging`; behavior is the same.
  - **Prefer the wrapping skill over raw resolver when one exists.** For project-bound `devlog`/`learning`/`topic` writes, invoke `/learn-log-day <project> [devlog|learning|topic]` — it wraps resolver + frontmatter + hub/day pattern + interactive prompts. Drop to raw `resolve.sh` only when no skill fits (e.g., project-free `notes`, or ad-hoc one-off where invoking a skill is overkill). Decision tree: project context exists → skill; no project context → raw resolver with `notes` or matching purpose.
  - **Purpose-first principle (Layer 1 owns paths, not consumers).** If a doc destination isn't in `doc-paths.json` yet, ADD the purpose entry to `doc-paths.json` FIRST, then call `resolve.sh doc <new-purpose>`. NEVER work around a missing purpose with `tool` mode + manual subpath, or by hardcoding the path in the consumer. Path knowledge belongs to Layer 1 (config), not Layer 2 (skills/commands). Adding a new purpose is a 1-line edit to `doc-paths.json`; that is always cheaper than encoding path structure in a consumer.
  - `~/.claude/ops/` is allowed only when `purpose=ops` (transient runtime state, e.g. per-PR cycle logs). Durable records MUST NOT live there.
  - Before inventing a new project folder name, `ls` the resolved parent to check whether a folder/convention already exists for this project.
- **Obsidian format** — ALWAYS read `~/.claude/standards/obsidian-format.md` before creating or editing Obsidian .md files. Frontmatter, wikilinks, tags required.
- **Kill by PID** — NEVER broad-kill by process name. Find PID first, then kill specific PID.
- **Delegate mechanical work** — For pure mechanical edits (bulk rename, sed-style replacements, file moves, boilerplate scaffolding, scoped cleanup passes), dispatch a subagent with `model: "haiku"` (single-file trivial) or `model: "sonnet"` (multi-file, light judgment), prefer `run_in_background: true`, and stay in conversation with the user in foreground while it works. Do NOT delegate: design decisions, debugging, test interpretation, anything requiring conversation context.
- **No success feedback** — Say nothing on success. Report only when something fails or is blocked.
- **Ambiguity scoring** — When evaluating whether to auto-execute an ambiguous action, score 1–10. 9+ = execute immediately without asking. When reporting a score, lead with what's missing (why it's not 10), not the positives.
