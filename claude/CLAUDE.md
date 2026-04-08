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
│   ├── meta-new-command/        # Command/skill naming rulebook
│   └── meta-new-skill/          # Skill creation guide
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
- Categories: `meta`, `cocv`, `ue`, `dev`, `review`, `git`, `tutoring`, `writing`, `drink`, `design`, `consulting`, `learn`, `pmx`, `vrm`, `image`, `project`, `system`, `caol`
- Examples: `git-collect-commits`, `ue-analyze-material`, `meta-new-command`
- Full rules: @~/.claude/skills/meta-new-command/SKILL.md

### Creating New

- **Command:** `/meta-new-command <category> <verb> <subject>`
- **Skill:** `/meta-new-skill <category> <verb> <subject>`
- **UE skill:** `/ue-new-skill <verb> <noun>` (uses special template)
- **Command standard:** @~/.claude/standards/slash-commands.md

---

## Git Workflow

- **Commit only** — Do NOT auto-push unless explicitly requested
- **Author:** `user.name=tomlim2`, `user.email=tomandlim@gmail.com`
- **No Co-Authored-By** — Do NOT add `Co-Authored-By: Claude` lines

---

## Private Folder

`private/` is the personal data vault. Gitignored. Never committed.

- Extracted data (commits, UE assets, analysis)
- Business data (invoices, tutoring logs, drinks)
- Cached computations and notes
- Full guide: @~/.claude/skills/meta-guide-private/SKILL.md

---

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

- **Hardware specs** — read `~/.claude/private/hardware.json` first. Run `/system-save-hardware` if missing.
- **Repo paths first** — ALWAYS read `~/.claude/private/repo-paths.json` before asking user for project paths.
- **Slack confirm first** — ALWAYS show full message and get explicit approval before sending ANY Slack message.
- **Writing pipeline** — External content: `/writing-draft-human` → `/writing-fix-ai` → final. Internal content exempt.
- **Docs in Obsidian** — All docs go in Obsidian vault (`obsidian` key in repo-paths.json), under `claude/`. NOT in `~/.claude/private/`.
- **Obsidian format** — ALWAYS read `~/.claude/standards/obsidian-format.md` before creating or editing Obsidian .md files. Frontmatter, wikilinks, tags required.
- **Kill by PID** — NEVER broad-kill by process name. Find PID first, then kill specific PID.

---

## Coding Principles

- **Start small, prove, then grow** — smallest working version first, verify, then expand incrementally.
- **Simplify ruthlessly** — if a senior engineer says it's overcomplicated, simplify.
- **Be specific** — "Use 2-space indentation" > "Format code properly"
- **Self-contained commands** — include all context via `` !`backtick` ``

---

## Verification

- **Always verify before presenting** — code change → run tests/CLI/diagnostics → confirm results → only then show to user or suggest next step.

---

## Security

- **Secrets** — use environment variables, NEVER store in this folder
- **Documentation language** — all rules and docs in this file must be in **English only**

---

> **ultrathink** — Every command is a guardrail. Every skill is accumulated experience. `private/` is sacred.
