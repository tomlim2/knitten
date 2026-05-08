---
status: accepted
---
# Slash Commands Standard

Common patterns, rules, and templates for all Claude Code slash commands.

---

## Purpose

This document defines standard patterns that **ALL slash commands must follow**. It ensures consistency, maintainability, and proper integration with the skill server ecosystem.

---

## Mandatory Patterns

### 1. Argument Validation

**If a command accepts arguments, it MUST validate them before execution.**

#### Template

```markdown
## Arguments

- `<required_arg>` - Description of required argument
- `[optional_arg]` - Description of optional argument

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /command-name <required_arg> [optional_arg]
```

#### Rules

1. **Define all arguments** with clear descriptions
2. **Use `<>` for required**, `[]` for optional
3. **Include usage guard** - Prevent auto-execution without args
4. **Show usage string** - Make it easy to understand

---

### 2. Error Handling

**Commands should handle common error cases gracefully.**

#### Common Patterns

**File not found:**
```markdown
If the file does not exist, inform the user and exit gracefully.
```

**Git repo not found:**
```markdown
If the current directory is not a git repository, show an error and exit.
```

**Missing dependencies:**
```markdown
If required tool is not installed, show installation instructions and exit.
```

---

### 3. Frontmatter Standards

**All commands must follow this frontmatter structure:**

```yaml
---
description: Brief one-line description (50 chars max)
argument-hint: "<required> [optional]"
allowed-tools: Read, Write, Bash(git:*)
---
```

#### Field Order

1. `description` (required)
2. `argument-hint` (if command accepts arguments)
3. `allowed-tools` (required)

#### Bash Tool Specificity

**NEVER use bare `Bash`** - Always specify patterns:

| Pattern | Use Case |
|---------|----------|
| `Bash(git:*)` | Git operations |
| `Bash(python:*)` | Python script execution |
| `Bash(npm:*)` | NPM commands |
| `Bash(open:*)` | App launchers |
| `Bash(mv:*), Bash(ls:*)` | File operations |

---

## Frontmatter Reference (Full)

Commands and skills share the same frontmatter. All fields are optional; `description` is recommended. Canonical docs: <https://code.claude.com/docs/en/skills>.

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | directory / file name | Display name (the `/slash-command`). Lowercase, digits, hyphens; max 64 chars. |
| `description` | string | first paragraph | What the command/skill does and when to use it. Combined with `when_to_use` is capped at 1,536 chars in the listing. |
| `when_to_use` | string | — | Additional trigger guidance (phrases, example requests). |
| `argument-hint` | string | — | Autocomplete hint for required/optional args. |
| `allowed-tools` | string or list | — | Tools usable without per-use approval while active. Does NOT restrict other tools. |
| `disable-model-invocation` | boolean | `false` | `true` = user-only; Claude cannot auto-invoke. Use for deploys, commits, Slack sends. |
| `user-invocable` | boolean | `true` | `false` = hide from `/` menu; Claude-only. Use for background/reference skills. |
| `model` | string | session | Per-skill model override. |
| `effort` | `low`\|`medium`\|`high`\|`xhigh`\|`max` | session | Per-skill effort override. |
| `context` | `fork` | inline | Set to `fork` to run in a forked subagent context. |
| `agent` | `Explore`\|`Plan`\|`general-purpose`\|custom | `general-purpose` | Subagent type when `context: fork`. |
| `paths` | string or list of globs | — | Restricts auto-activation to matching files (monorepo support). |
| `shell` | `bash`\|`powershell` | `bash` | Interpreter for `` !`command` `` injections. PowerShell needs `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. |
| `hooks` | object | — | Per-skill lifecycle hooks. |

### Skill vs Command Precedence

If `skills/foo/SKILL.md` and `commands/foo.md` exist with the same name, **the skill wins**. Existing `commands/*.md` files keep working with the same frontmatter, but new work should prefer skills since they support directories, supporting files, subagent execution (`context: fork`), and dynamic shell injection.

Location priority (highest to lowest): `enterprise > personal (~/.claude/...) > project (.claude/...)`. Plugin skills live in a `plugin-name:skill-name` namespace and never conflict.

### String Substitutions

| Token | Meaning |
|-------|---------|
| `$ARGUMENTS` | Full argument string. If body omits this token, Claude Code appends `ARGUMENTS: <value>` at the end. |
| `$ARGUMENTS[N]` / `$N` | 0-based positional argument. `$0` = first arg. Wrap multi-word args in quotes. |
| `${CLAUDE_SESSION_ID}` | Current session ID. Use for per-session log files. |
| `${CLAUDE_SKILL_DIR}` | Absolute dir of the current `SKILL.md`. Use when invoking bundled scripts so cwd doesn't matter. |

### Dynamic Shell Injection

```markdown
Current branch: !`git rev-parse --abbrev-ref HEAD`
```

Multi-line fenced block:

````markdown
```!
node --version
npm --version
```
````

Runs before Claude sees the content — Claude receives the command output, not the command text. Can be disabled globally via `"disableSkillShellExecution": true` in settings.

---

## Common Command Patterns

### Pattern 1: Simple Workflow Command

**Use case:** Commands that execute a linear workflow.

**Template:**
```markdown
---
description: Brief description
allowed-tools: Read, Write
---

# Command Name

Brief explanation of what this command does.

## Workflow

### Step 1: First Step
- Do something
- Execute action

### Step 2: Second Step
- Do next thing
- Verify result

### Step 3: Final Step
- Complete action
- Show result
```

---

### Pattern 2: Argument-Based Command

**Use case:** Commands that accept user input.

**Template:**
```markdown
---
description: Brief description
argument-hint: "<required_arg> [optional_arg]"
allowed-tools: Read, Write
---

# Command Name

Brief explanation.

## Arguments

- `<required_arg>` - Description
- `[optional_arg]` - Description

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /command-name <required_arg> [optional_arg]

## Workflow

Use $ARGUMENTS to access the provided argument.

### Step 1: Validate Argument
- Check if $ARGUMENTS is provided
- Validate format/content

### Step 2: Execute with Argument
- Use $ARGUMENTS in processing
- Show results
```

---

### Pattern 3: Skill-Delegating Command

**Use case:** Commands that delegate to a skill for complex logic.

**Template:**
```markdown
---
description: Brief description
allowed-tools: Bash(python:*)
---

# Command Name

Brief explanation. This command delegates to the `skill-name` skill.

## Workflow

### Step 1: Delegate to Skill
- Run skill script:
  \`\`\`bash
  python ~/.claude/skills/skill-name/script.py
  \`\`\`

### Step 2: Show Results
- Display skill output
- Confirm completion
```

---

### Pattern 4: Multi-File Processing Command

**Use case:** Commands that process multiple files.

**Template:**
```markdown
---
description: Brief description
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Command Name

Brief explanation.

## Workflow

### Step 1: Find Files
- Use Glob to find target files
- Filter by pattern

### Step 2: Process Each File
- For each file:
  - Read content
  - Apply transformation
  - Write/Edit result

### Step 3: Report Results
- List processed files
- Show summary
```

---

## Documentation Standards

### Required Sections

Every command MUST include:

1. **Frontmatter** - With proper allowed-tools
2. **Title (H1)** - Command name
3. **Arguments** - If applicable
4. **Workflow** - Step-by-step execution

### Optional Sections

Commands MAY include:

- **Examples** - Usage examples
- **Output** - Expected output format
- **Notes** - Important caveats
- **Related** - Related commands/skills

### Writing Style

- **Imperative mood** - "Execute command", not "Command is executed"
- **Active voice** - Direct and clear
- **Concise** - Short, clear sentences
- **Structured** - Use headings and lists

---

## Integration with Skills

### When to Create a Skill vs Command

| Create Command | Create Skill |
|----------------|--------------|
| User-facing workflow | Reusable logic |
| Interactive prompts | Automated processing |
| Orchestrates tools | Implements algorithm |
| Simple execution | Complex computation |

---

## Testing Checklist

Before finalizing a command, verify:

- [ ] Arguments validated if applicable
- [ ] Error cases handled gracefully
- [ ] Clear workflow steps defined
- [ ] Documentation complete

---

## Examples

### Example 1: Simple Command (clean-up)

```markdown
---
description: Update entry document project overview and language conventions
allowed-tools: Read, Write, Edit
---

# clean-up

Scan the codebase and update entry document project overview and conventions to reflect the current state.

## Workflow

### Step 1: Read entry documents
- Read current entry document content

### Step 2: Update Documentation
- Update project overview
- Update language conventions
- Ensure consistency

### Step 3: Save Changes
- Write updated entry document
- Confirm completion
```

### Example 2: Argument Command (git-collect-commits)

```markdown
---
description: Extract git commits for portfolio
argument-hint: "<repo_path> [--author name]"
allowed-tools: Read, Write, Bash(git:*)
---

# git-collect-commits

Extract git commit history from a repository for portfolio purposes.

## Arguments

- `<repo_path>` - Path to git repository
- `[--author name]` - Filter by author name (optional)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /git-collect-commits <repo_path> [--author name]

## Workflow

### Step 1: Validate Arguments
- Check if $ARGUMENTS contains repo_path
- Verify repo exists

### Step 2: Extract Commits
- Run git log with filters
- Parse commit data

### Step 3: Save to Private
- Write to ~/.claude/private/commits/
- Show summary
```

---

## Related Files

- `caol-make-command/SKILL.md` - Command creation rulebook
- `caol-make-skill/SKILL.md` - Skill creation rulebook
- `SYSTEM.md` - Shared policy source
- `design-system.md` - UI/CSS standards
- `unreal-engine.md` - UE-specific standards
