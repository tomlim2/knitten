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

## Repo-local rules (live inside the repo)

Repo-specific rules live at `<repo-root>/.claude/rules/` and Claude Code auto-loads them when cwd is in that repo. Resolve a repo path at runtime with `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo <key>` (returns `RESOLVED_PATH=…`).

- **shotloom** — `.claude/rules/shotloom.md` (hub) + `.claude/rules/shotloom-git.md` (pre-PR / auto-commit / agentless register) + `.claude/standards/shotloom-pr-scope-policy.md` (PR review scope policy)
