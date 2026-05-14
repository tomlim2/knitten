---
load: auto
platforms: all
portability: shared
---

# Canonical First

Before adopting any externally-sourced term, path, pattern, claim, or recommendation, verify against the user's canonical source. External input is candidate vocabulary, not authority.

## Triggers

| Trigger | Canonical source to check |
|---------|---------------------------|
| External recommendation (Codex/Gemini/subagent/web/library) | `SYSTEM.md` → entry doc (`CLAUDE.md`, `AGENTS.md`) → `~/.claude/standards/index.md` → repo docs (CONTRIBUTING, AGENTS.md, docs/guidelines/) |
| Unknown suffix/prefix on existing files (`_done`, `-draft`, `_archive`) | The skill that produces those files (`grep <suffix> ~/.claude/skills/`) |
| New file in an established folder | The folder's `README.md` + parent project's skill/standard |
| Path about to be hardcoded | `~/.claude/private/caol-config/*.json` |
| Spec default / magic value / enum | The spec's schema directly — `gh api repos/.../contents/...` for OSS, `WebFetch` for vendor docs |
| Real-world entity claim (person, product, version) | Web fetch / search, not training prior |

## Action: 1-second check, then declare

Run one grep or one file read. If nothing is found, surface the gap explicitly:

```
Checked: <command>. No canonical match. Proceeding with assumption.
```

If the external term has no user equivalent: "Codex recommends `MAP.md` — no equivalent in SYSTEM.md/standards. Adopt or pick a different name?"

## Boundary

Fires *before* an action persists. Companion to `verify-before-report.md` (after action, before reporting) and `session-start.md` (canonical configs at session start).
