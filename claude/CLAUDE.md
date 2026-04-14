# CLAUDE.md

Central hub for Claude Code — all commands, skills, standards, and configuration live here and symlink to `~/.claude`. Works on both Windows (work) and macOS (home).

---

## Setup

```
caol-ila/claude/  →  symlinked to  →  ~/.claude
```

- **Role:** Single source of truth for all Claude Code configuration across machines and projects
- **Skill server port:** 972
- **Slack mention:** `<@U04MCMGPN05>` / emoji: `:arnyang_ugly:`

---

## Architecture

```
claude/                          # Symlinked to ~/.claude
├── CLAUDE.md                    # This file (loaded every session)
├── commands/                    # Slash commands (.md files)
├── skills/                      # Skills with SKILL.md (directories)
│   ├── meta-make-command/        # Command/skill naming rulebook
│   └── meta-make-skill/          # Skill creation guide
├── standards/                   # Detailed reference docs (read on-demand)
│   ├── slash-commands.md        # [REQUIRED] Command authoring standard
│   └── ...                      # JS, UE C++, design system, etc.
└── private/                     # Personal data vault (gitignored)
```

**Runtime (auto-generated, gitignored):** `settings.json`, `projects/`, `todos/`, `history.jsonl`

---

## Writing Skills & Commands

Skills and commands are a **unified system**. Both create `/slash-commands`.

| Location | Format | Creates |
|----------|--------|---------|
| `commands/review.md` | Single markdown file | `/review` |
| `skills/review/SKILL.md` | Directory + SKILL.md | `/review` |

If both exist with the same name, the skill takes precedence. Skills are the recommended format (support directories, supporting files).

### Frontmatter Fields

Essential: `description` (recommended), `allowed-tools` (never bare `Bash` — use `Bash(git:*)` etc.), `argument-hint`
Advanced: `name`, `disable-model-invocation`, `user-invocable`, `context`/`agent`/`model`, `hooks`
Full reference: @~/.claude/standards/slash-commands.md

### Key Patterns

- **Dynamic context:** `` !`command` `` runs shell before sending to Claude
- **Arguments:** `$ARGUMENTS`, `$ARGUMENTS[0]`, `$0` shorthand
- **@import:** `@path/to/file` imports content into CLAUDE.md or skills

### Naming Convention

**MANDATORY: `{category}-{verb}-{subject}` pattern.**

- Lowercase only, hyphens as separators, max 64 characters
- Categories: `meta`, `cci`, `ue`, `dev`, `review`, `git`, `tutoring`, `writing`, `drink`, `design`, `consulting`, `learn`, `pmx`, `vrm`, `image`, `project`, `system`, `caol`
- Examples: `git-collect-commits`, `ue-analyze-material`, `meta-make-command`
- Full rules: @~/.claude/skills/meta-make-command/SKILL.md

### Creating New

- **Command:** `/meta-make-command <category> <verb> <subject>`
- **Skill:** `/meta-make-skill <category> <verb> <subject>`
- **UE skill:** `/ue-make-skill <verb> <noun>` (uses special template)
- **Command standard:** @~/.claude/standards/slash-commands.md

---

## Git Workflow

@~/.claude/rules/git.md

---

## Private Folder

`private/` is the personal data vault. Gitignored. Never committed.

- Extracted data (commits, UE assets, analysis)
- Business data (invoices, tutoring logs, drinks)
- Cached computations and notes
- Full guide: @~/.claude/skills/meta-guide-private/SKILL.md

---

## Rules

Always-applied constraints. Full index: @~/.claude/rules/index.md

## Domain Standards

Read on-demand, NOT auto-loaded. Full index: @~/.claude/standards/index.md

---

## Context Management

- **CLAUDE.md ≤ 150 lines** — move detailed examples/patterns to `standards/` files
- **50% context → `/compact`** — when context reaches ~50%, manually run `/compact` to reclaim space
- **Subtask sizing** — each subtask must be completable within 50% of context window
- **Plan mode first** — for non-trivial tasks, start with plan mode to align before coding

---

## Runtime Rules

@~/.claude/rules/runtime.md

---

## Coding Principles

@~/.claude/rules/coding.md

---

## Verification

@~/.claude/rules/verification.md

---

## Security

@~/.claude/rules/security.md

---

> **ultrathink** — Every command is a guardrail. Every skill is accumulated experience. `private/` is sacred.
