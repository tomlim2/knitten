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
- **Usage tracking:** `curl -X POST http://localhost:972/api/usage/track -H "Content-Type: application/json" -d '{"type":"commands","id":"command-name"}'`

---

## Architecture

```
claude/                          # Symlinked to ~/.claude
├── CLAUDE.md                    # This file (loaded every session)
├── commands/                    # Slash commands (39+ .md files)
├── skills/                      # Skills with SKILL.md (25+ directories)
│   ├── _shared/                 # Shared utilities (track_usage, etc.)
│   ├── meta-new-command/        # Command/skill naming rulebook
│   └── meta-new-skill/          # Skill creation guide
├── standards/                   # Detailed reference docs (read on-demand)
│   ├── slash-commands.md        # [REQUIRED] Command authoring standard
│   ├── command-pre-execution.md # Centralized pre-execution logic
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

| Field | Required | Description |
|-------|----------|-------------|
| `description` | Recommended | What the skill does — Claude uses this for auto-loading |
| `name` | No | Display name (lowercase, numbers, hyphens, max 64 chars). Defaults to directory name |
| `argument-hint` | No | Hint for autocomplete (e.g., `[issue-number]`) |
| `allowed-tools` | No | Tools allowed without permission prompts. Never use bare `Bash` — use `Bash(git:*)` etc. |
| `disable-model-invocation` | No | `true` = only user can invoke (for side-effect commands like `/deploy`) |
| `user-invocable` | No | `false` = hidden from `/` menu, Claude-only background knowledge |
| `context` | No | `fork` = run in isolated subagent |
| `agent` | No | Subagent type when `context: fork` (`Explore`, `Plan`, etc.) |
| `model` | No | Model override |
| `hooks` | No | Lifecycle hooks scoped to this skill |

### Key Patterns

- **Pre-execution:** All commands must reference @~/.claude/standards/command-pre-execution.md
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
- Full guide: @~/.claude/skills/meta-private-guide/SKILL.md

---

## Domain Standards

Detailed reference documents in `standards/` — read on-demand, NOT auto-loaded.

| Standard | When to read |
|----------|-------------|
| `slash-commands.md` | **Always** before creating commands |
| `agent-workflow.md` | Before creating multi-pass agent commands |
| `command-pre-execution.md` | Referenced by all commands automatically |
| `javascript.md` | Before writing JS/Node.js code |
| `css.md` | Before writing CSS code |
| `three-shader-language.md` | Before writing Three.js TSL shader code |
| `design-system.md` | Before creating UI/web pages |
| `unreal-engine-cpp.md` | Before writing UE C++ code |
| `unreal-engine-asset.md` | Before creating/validating UE assets |
| `review-code-javascript.md` | JavaScript/Node.js code reviews |
| `review-code-css.md` | CSS code reviews |
| `review-code-unreal-cpp.md` | C++ code reviews |
| `review-code-tsl.md` | Three.js TSL code reviews |
| `review-code-unreal-python.md` | Python code reviews (UE editor) |
| `cinev-git-workflow.md` | **Always** before git ops on CINEV projects |
| `cocv-slack.md` | Before any cocv Slack operations |
| `review-template.md` | Code review output format |
| `research-methodology.md` | Deep research |
| `tech-spec-template.md` | Technical specifications |
| `delegation.md` | Task delegation patterns |

---

## Best Practices

- **Repo paths first** — Before asking the user for project paths, ALWAYS read `~/.claude/private/repo-paths.json` first. It contains all registered project locations.
- **Slack confirm first** — Before sending ANY Slack message, ALWAYS show the full message content to the user and get explicit approval. Applies to all Slack skills (`cocv-art-send-notice`, `cocv-art-send-merge-notice`, `cocv-art-send-merge-result`, etc.).
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
