# CLAUDE.md

Global Claude Code configuration for all projects on this machine.

---

## Setup

**This repo (`caol-ila`) is the global Claude Code configuration.**

```
<repo>/claude/  →  symlinked to  →  ~/.claude
```

Works on both Windows (work) and macOS (home).

- **Skill server port:** 972
- **Slack mention:** `<@U04MCMGPN05>` / emoji: `:arnyang_ugly:`

---

## Architecture

```
claude/                          # Symlinked to ~/.claude
├── CLAUDE.md                    # This file (loaded every session)
├── commands/                    # Slash commands (39+ .md files)
├── skills/                      # Skills with SKILL.md (25+ directories)
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
- Categories: `git`, `tutoring`, `cocv`, `ue`, `learn`, `meta`, `drink`
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

Detailed reference documents in `standards/` — read on-demand, NOT auto-loaded.

| Standard | When to read |
|----------|-------------|
| `slash-commands.md` | **Always** before creating commands |
| `cinev-git-workflow.md` | **Always** before CINEV git ops |
| `cocv-slack.md` | Before Slack operations |
| `javascript.md`, `css.md` | Before writing JS/CSS |
| `three-shader-language.md` | Before Three.js TSL shaders |
| `design-system.md` | Before creating UI/web pages |
| `unreal-engine-cpp.md`, `unreal-engine-asset.md` | Before UE C++ or asset work |
| `review-code-*.md`, `review-template.md` | Code reviews (JS, CSS, UE C++, TSL, UE Python) |
| `agent-workflow.md`, `delegation.md` | Multi-pass agents, task delegation |
| `research-methodology.md`, `tech-spec-template.md` | Research and specs |

---

## Context Management

- **CLAUDE.md ≤ 150 lines** — move detailed examples/patterns to `standards/` files
- **50% context → `/compact`** — when context reaches ~50%, manually run `/compact` to reclaim space
- **Subtask sizing** — each subtask must be completable within 50% of context window
- **Plan mode first** — for non-trivial tasks, start with plan mode to align before coding

---

## Best Practices

- **Hardware specs** — When checking local machine capabilities (GPU, RAM, chip), read `~/.claude/private/hardware.json` first. Run `/system-save-hardware` if the file doesn't exist.
- **Repo paths first** — Before asking the user for project paths, ALWAYS read `~/.claude/private/repo-paths.json` first. It contains all registered project locations.
- **Slack confirm first** — Before sending ANY Slack message, ALWAYS show the full message content to the user and get explicit approval. Applies to all Slack skills (`cocv-art-send-notice`, `cocv-art-send-merge-notice`, `cocv-art-send-merge-result`, etc.).
- **Writing pipeline** — For external-facing content (blog, portfolio, README, LinkedIn, resume), always follow: `/writing-apply-voice` (draft with human voice) → `/writing-humanize-text` (review against 24 AI patterns) → final output. Internal content (commits, Slack, code comments, notes) is exempt.
- **Be specific** — "Use 2-space indentation" > "Format code properly"
- **Self-contained commands** — include all context via `` !`backtick` ``
- **Clear skill interfaces** — CLI flags, predictable output to `private/`, error handling
- **Simplify ruthlessly** — if a senior engineer says it's overcomplicated, simplify
- **Secrets** — use environment variables, NEVER store in this folder
- **Documentation language** — all rules and docs in this file must be in **English only**

---

## Philosophy

> **ultrathink** — We're not automating tasks. We're composing instruments for making a dent in the universe.

Every command is a guardrail that enforces the right way. Every skill is accumulated experience turned into reusable code. `private/` is sacred. If it doesn't make your workflow sing, iterate until it does.
