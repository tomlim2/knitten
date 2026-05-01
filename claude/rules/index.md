# Rules Index

Always-applied constraints. Short, enforceable, one-liners. Read at session start.

Unlike `standards/` (long reference docs read on-demand), rules here are **must-follow** directives. Each file contains a few terse bullets. Standards remain the source of truth for detailed rationale and examples — rules link back via `@import`.

## Core (extracted from CLAUDE.md)

| Rule | Scope |
|------|-------|
| [`git.md`](git.md) | Git commit / push / author |
| [`runtime.md`](runtime.md) | Session-start checks, Slack, Obsidian, delegation |
| [`coding.md`](coding.md) | Writing code principles |
| [`conventions.md`](conventions.md) | Always re-read repo conventions before work AND before reviewing |
| [`testing.md`](testing.md) | Unit tests mandatory for new code; PR blocker; exception list |
| [`verification.md`](verification.md) | Before presenting results |
| [`security.md`](security.md) | Secrets, documentation language |

## Command / Skill authoring

| Rule | Scope |
|------|-------|
| [`naming.md`](naming.md) | `{category}-{verb}-{subject}` pattern |
| [`command-frontmatter.md`](command-frontmatter.md) | Required fields, argument validation |
| [`tool-permissions.md`](tool-permissions.md) | `allowed-tools` Bash patterns |

## Domain-specific

| Rule | Scope |
|------|-------|
| [`obsidian.md`](obsidian.md) | Obsidian vault document format |
| [`cinev-git.md`](cinev-git.md) | CINEV project git ops (UE lock check) |
| [`multi-agent.md`](multi-agent.md) | When assigned 지통실 #1 (1호기) |
| [`shotloom.md`](shotloom.md) | Shotloom Claude-side meta — gh account, commit identity, build flag, auto-commit/push exemption, `/shotloom-auto-pr` exemption, `/claude-review` trigger. Project rules themselves live in shotloom's own `docs/guidelines/`, `AGENTS.md`, `CONTRIBUTING.md`, `docs/adr/`. |
