# AGENTS.md

Codex entry document.

First shared-policy read: [`SYSTEM.md`](SYSTEM.md).
Sibling entry document: [`CLAUDE.md`](CLAUDE.md).

## Load Order

1. Read `SYSTEM.md` before any other repository convention.
2. Read `claude/rules/index.md`.
3. Read every auto rule listed by `claude/rules/index.md`.
4. Read triggered rules, standards, skills, and commands when the task matches them.

## Codex Adapter

Shared rules, standards, skills, and commands are binding repository conventions for Codex unless they depend on Claude-specific runtime features.

If a shared instruction uses Claude-only mechanics, translate the intent into Codex behavior and follow higher-priority Codex platform instructions.

Do not duplicate shared policy here. Put shared policy in `SYSTEM.md` or the owning shared layer.
