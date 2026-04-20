---
description: "Structure rules and templates for creating Claude Code skills. Use when creating new skills."
---

# caol-make-skill

Skill creation generator for Claude Code with comprehensive structure rules.

## Purpose

This skill helps create new Claude Code skills following the standardized naming convention and structure. It serves as the authoritative rulebook for skill creation.

Claude Code merged custom commands into skills: a file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. Skills are the recommended format — they support directories, supporting files, subagent execution, and dynamic context injection.

---

## Skill Structure

Skills are reusable utilities that commands invoke. They consist of:

```
skills/{category}-{verb}-{subject}/
├── SKILL.md              # Skill documentation (required)
├── script.py             # Main implementation
├── config.json           # Optional configuration
├── reference.md          # Detailed reference (loaded on-demand)
├── examples.md           # Examples (loaded on-demand)
└── scripts/              # Utility scripts (executed, not loaded)
```

`SKILL.md` is the only required file. Files inside the skill directory (`reference.md`, `examples.md`, `scripts/`) are **not auto-loaded** — Claude reads them on-demand when `SKILL.md` references them. See [Supporting Files + Compaction](#supporting-files--compaction).

---

## Skill vs Command Precedence

If a skill at `skills/foo/SKILL.md` and a command at `commands/foo.md` share the same name, **the skill wins**. Existing `commands/*.md` files still work with the same frontmatter, but new work should prefer skills.

Location priority when the same skill name appears in multiple scopes:

```
enterprise > personal (~/.claude/skills/) > project (.claude/skills/)
```

Plugin skills use a `plugin-name:skill-name` namespace so they never conflict.

---

## Naming Convention

**MANDATORY: All skills MUST follow the `{category}-{verb}-{subject}` pattern.**

This is the SAME pattern as commands. See `caol-make-command` skill for complete naming rules:
- `~/.claude/skills/caol-make-command/SKILL.md`

### Quick Reference

- **Lowercase only** - No capitals, no camelCase
- **Hyphens as separators** - Never underscores
- **Three parts**: `{category}-{verb}-{subject}`
- **Multi-word subjects**: Use hyphens (e.g., `asset-name`)
- **Max 64 characters** (per official docs: lowercase letters, numbers, hyphens only)

### Examples

| Skill Directory | Category | Verb | Subject |
|-----------------|----------|------|---------|
| `git-commit-collector` | git | commit | collector |
| `ue-analyze-material` | ue | analyze | material |
| `ue-validate-asset-name` | ue | validate | asset-name |
| `caol-make-command` | caol | make | command |
| `caol-make-skill` | caol | make | skill |
| `skill-server` | skill | server | (implicit) |
| `drink-log` | drink | log | (implicit) |

---

## Special Case: Unreal Engine Skills

**For `ue-*` (Unreal Engine) skills, use the dedicated template and command:**

**Template Location:**
```
~/.claude/skills/ue-show-template/SKILL.md
```

**Command:**
```
/ue-make-skill <verb> <noun>
```

**Why UE skills are special:**
- Require specific Python patterns for Unreal Editor integration
- Need `run_in_editor.py` wrapper for remote execution
- Export JSON data to `~/.claude/private/unreal/{noun}-{verb}/`
- Follow strict logging conventions with `[LogTag]` prefixes
- Use `export_{noun}_data.py` naming pattern
- Have specific error handling for `get_editor_property()` calls

**When to use ue-make-skill:**
- Any skill that exports data from Unreal Editor
- Any skill that analyzes UE assets (materials, meshes, blueprints, etc.)
- Any skill that validates UE naming conventions
- Any skill that requires running Python inside UE Editor

**Example:**
```
User request: "Create a ue-analyze-texture skill"
→ Use: /ue-make-skill analyze texture
→ NOT: /caol-make-skill ue analyze texture
```

---

## Frontmatter Fields

All fields are optional. Only `description` is recommended. Canonical source: <https://code.claude.com/docs/en/skills>.

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | directory name | Display name for the skill. Lowercase letters, numbers, hyphens (max 64 chars). |
| `description` | string | first paragraph of body | What the skill does and when to use it. Front-load the key use case — combined with `when_to_use`, capped at 1,536 chars in skill listing. |
| `when_to_use` | string | — | Additional trigger guidance (phrases, example requests). Appended to `description` in the listing. |
| `argument-hint` | string | — | Autocomplete hint. Example: `"[issue-number]"` or `"[filename] [format]"`. |
| `allowed-tools` | string or list | — | Tools Claude can use without asking permission while skill is active. Space-separated string OR YAML list. Does NOT restrict other tools. |
| `disable-model-invocation` | boolean | `false` | `true` = Claude cannot auto-invoke; user `/name` only. Use for side-effectful workflows (deploy, commit). |
| `user-invocable` | boolean | `true` | `false` = hide from `/` menu; Claude-only. Use for background/reference skills. |
| `model` | string | session default | Model override while skill is active. |
| `effort` | `low`\|`medium`\|`high`\|`xhigh`\|`max` | inherits session | Per-skill effort override. Available levels depend on the model. |
| `context` | `fork` | (inline) | Set to `fork` to run in a forked subagent context. |
| `agent` | `Explore`\|`Plan`\|`general-purpose`\|custom | `general-purpose` | Subagent type when `context: fork`. Custom agents from `.claude/agents/` also allowed. |
| `paths` | string or list of globs | — | Comma-separated string or YAML list. Auto-activation restricted to files matching patterns (monorepo support). |
| `shell` | `bash`\|`powershell` | `bash` | Shell used for `` !`command` `` and ` ```! ` blocks. `powershell` requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. |
| `hooks` | object | — | Per-skill lifecycle hooks. See [Hooks in skills and agents](https://code.claude.com/docs/en/hooks#hooks-in-skills-and-agents). |

### Example: minimal skill

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works.
---
```

### Example: user-only deploy with pre-approved tools

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git push *)
---
```

### Example: research skill in forked Explore agent

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly...
```

### Example: monorepo-scoped auto-activation

```yaml
---
name: frontend-conventions
description: React + TS style rules
paths:
  - "packages/frontend/**"
  - "apps/web/**"
---
```

### Bash Tool Specificity

**NEVER use bare `Bash`** in `allowed-tools`. Always use specific patterns:

| Pattern | Use Case |
|---------|----------|
| `Bash(git:*)` | Git operations |
| `Bash(python:*)` | Python script execution |
| `Bash(npm:*)` | npm commands |
| `Bash(open:*)` | App launchers |
| `Bash(mv:*), Bash(ls:*)` | File operations |

---

## String Substitutions

SKILL.md content supports these substitutions at invocation time:

| Token | Meaning |
|-------|---------|
| `$ARGUMENTS` | Full argument string as typed. If not present in body, Claude Code appends `ARGUMENTS: <value>` to the end. |
| `$ARGUMENTS[N]` | 0-based indexed argument (shell-style quoting; wrap multi-word args in quotes). |
| `$N` | Shorthand: `$0` = first arg, `$1` = second, etc. |
| `${CLAUDE_SESSION_ID}` | Current session ID. Good for per-session log files. |
| `${CLAUDE_SKILL_DIR}` | Absolute directory of the current `SKILL.md`. For plugin skills this is the skill subdirectory, not the plugin root. |

### Examples

**Full argstring:**
```yaml
---
name: fix-issue
description: Fix a GitHub issue by number
---
Fix GitHub issue $ARGUMENTS following our coding standards.
```
`/fix-issue 123` → "Fix GitHub issue 123..."

**Positional:**
```yaml
---
name: migrate-component
description: Migrate a component between frameworks
---
Migrate the $0 component from $1 to $2.
```
`/migrate-component SearchBar React Vue` → `$0=SearchBar`, `$1=React`, `$2=Vue`.

**Session log:**
```yaml
---
name: session-logger
description: Log activity for this session
---
Append to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

**Skill-local script:**
```yaml
---
name: tree-view
description: Render the codebase tree
allowed-tools: Bash(python:*)
---
Run: `python ${CLAUDE_SKILL_DIR}/scripts/tree.py .`
```

---

## Dynamic Shell Injection

Skills can embed live shell output into the prompt before Claude sees it. This is **preprocessing** — Claude only receives the final rendered content, not the command text.

**Inline form:**
```markdown
- Current branch: !`git rev-parse --abbrev-ref HEAD`
- Staged files: !`git diff --cached --name-only`
```

**Block form** (multi-line, fenced with ` ```! `):
````markdown
## Environment
```!
node --version
npm --version
git status --short
```
````

The `shell` frontmatter field picks the interpreter (`bash` default, `powershell` opt-in on Windows). Per-repo/user setting `disableSkillShellExecution: true` replaces each command with `[shell command execution disabled by policy]`.

---

## Supporting Files + Compaction

### Loading rules

Files inside a skill directory other than `SKILL.md` are **loaded on-demand** — Claude reads them only when the SKILL.md body points at them.

```
my-skill/
├── SKILL.md       (loaded when invoked)
├── reference.md   (loaded only if SKILL.md references it)
├── examples.md    (loaded only if SKILL.md references it)
└── scripts/
    └── helper.py  (executed, not loaded as context)
```

Reference them explicitly so Claude knows what each contains:

```markdown
## Additional resources

- API details → see [reference.md](reference.md)
- Worked examples → see [examples.md](examples.md)
```

**Rule of thumb:** keep `SKILL.md` under 500 lines. Push heavy prose, long tables, and large examples to `reference.md` and `examples.md`.

### Auto-compaction behavior

Invoked skills enter the conversation as a single message and stay there. When the session is summarized by auto-compaction:

- Only the **most recent invocation** of each skill is re-attached.
- Only the **first 5,000 tokens** of each re-attached skill survive.
- Re-attached skills share a combined **25,000-token budget**, filled most-recent-first — older skills may be dropped entirely.

**Therefore:** put the critical rules, checklists, and invariants in the first ~5,000 tokens of `SKILL.md`. Long reference material that survives compaction poorly belongs in `reference.md` (where it can be re-fetched on demand).

---

## SKILL.md Structure (Required)

Every skill MUST have a `SKILL.md` file with this exact structure:

### Template

```markdown
---
description: "One-line description. Use when <trigger>."
---

# {category}-{verb}-{subject}

[One-line description of what this skill does]

## Purpose

[Detailed explanation of what this skill does, why it exists, and when to use it]

---

## Usage

[How to use this skill, with examples. Include both command-line and programmatic usage if applicable]

---

## Files

- `script.py` - [Description of main script]
- `config.json` - [Description of config file]
- `reference.md` - [Detailed reference loaded on demand]

---

## [Optional Additional Sections]

- Dependencies
- Configuration
- Output Format
- Related Files
- Examples
- Troubleshooting
```

### Required Sections

1. **Frontmatter**: at minimum `description`; add other fields from the table above as needed
2. **Title**: `# {category}-{verb}-{subject}`
3. **Description**: One-line summary
4. **Purpose**: Detailed explanation
5. **Usage**: How to use with examples
6. **Files**: List and describe all files in the skill

## Additional Resources

For detailed implementation patterns, templates, and code examples — including the subagent pattern, dynamic shell injection patterns, `paths`-scoped skills, and visual-output skills — see [reference.md](reference.md).

Canonical docs: <https://code.claude.com/docs/en/skills>. Slash-commands standard: `~/.claude/standards/slash-commands.md`.
