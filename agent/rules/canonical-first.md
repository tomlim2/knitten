---
load: auto
platforms: all
portability: shared
---

# Canonical First

Before adopting any externally-sourced term, path, pattern, claim, or recommendation, verify against the user's canonical source. External input — Codex/Gemini/subagent replies, web search, library docs, upstream skill, visible pattern in existing files — is **candidate vocabulary**, not authority. The user's source wins.

## Failure modes this prevents

| Mode | Example |
|------|---------|
| Silent term adoption | Codex says `MAP.md`; user's source uses `LOOKUP.md`. Adopting Codex's term overwrites the architect's choice. |
| Pattern mimicry without semantics | Seeing `_done` suffix on existing files, mimicking the shape without checking the skill that produces it. |
| Hardcoded path | Using an absolute path before checking `caol-config/*.json`. |
| Training-prior claim | Stating a fact about a real-world entity from memory instead of web-verifying. |
| Spec default | Citing a magic value from memory instead of reading the spec's schema. |

## Triggers — verify before acting

| Trigger | Canonical source to check |
|---------|---------------------------|
| External recommendation (Codex/Gemini/subagent/web/library) | `SYSTEM.md` → entry doc (`CLAUDE.md`, `AGENTS.md`) → `~/.claude/standards/index.md` → repo docs (CONTRIBUTING, AGENTS.md, docs/guidelines/) |
| Unknown suffix/prefix on existing files (`_done`, `-draft`, `_archive`) | The skill that produces those files (`grep <suffix> ~/.claude/skills/`) |
| New file in an established folder | The folder's `README.md` + parent project's skill/standard |
| Path about to be hardcoded | `~/.claude/private/caol-config/*.json` |
| Spec default / magic value / enum | The spec's schema directly — `gh api repos/.../contents/...` for OSS, `WebFetch` for vendor docs |
| Real-world entity claim (person, product, version) | Web fetch / search, not training prior |

## Action: 1-second check, then declare

Cost is one grep or one file read. If nothing found, surface the gap explicitly instead of proceeding silently:

```
Checked: <command>. No canonical match. Proceeding with assumption.
```

If the external term has no user equivalent: "Codex recommends `MAP.md` — no equivalent in SYSTEM.md/standards. Adopt or pick a different name?"

## Why auto-loaded

LLM-first system (`SYSTEM.md` charter): user is architect, LLM is operator. LLMs are trained to defer to other expert-sounding LLMs and to mimic visible patterns — both default failure modes silently overwrite the architect's conventions. This rule reverses the default: external input or visible pattern → check canonical source → translate to user's term.

## Boundary

Fires *before* an action persists. Companion to `verify-before-report.md` (after action, before reporting) and `session-start.md` (canonical configs at session start).
