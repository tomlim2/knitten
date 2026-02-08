# Slash Commands Standard

**Version:** 2.0.0

Common patterns, rules, and templates for all Claude Code slash commands.

---

## Changelog

- **2.0.0** - Replaced inline tracking with pre-execution pattern for centralized logic
- **1.0.0** - Initial release with usage tracking, error handling, and common patterns

---

## Purpose

This document defines standard patterns that **ALL slash commands must follow**. It ensures consistency, maintainability, and proper integration with the skill server ecosystem.

---

## Mandatory Patterns

### 1. Pre-Execution Reference (Usage Tracking & Common Logic)

**Every command MUST include a pre-execution reference** immediately after the title and description.

#### What is Pre-Execution?

Pre-execution is a centralized pattern where all commands read and execute `command-pre-execution.md` before their main workflow. This file contains:
- Usage tracking (curl POST to localhost:972)
- Environment checks
- Any other logic that ALL commands need

#### Template

```markdown
# Command Title

Brief description of what this command does.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`

## [Rest of command content...]
```

#### Rules

1. **Place immediately after title** - Before any workflow sections
2. **Replace `command-name`** with the actual command name (e.g., `design-sync`, `git-make-message`)
3. **NO `Bash(curl:*)` needed** in allowed-tools - Pre-execution file handles it
4. **Centralized logic** - All tracking and pre-execution logic lives in one file
5. **Single source of truth** - Update `command-pre-execution.md` to change all commands

#### Frontmatter (NO curl needed)

**Do NOT include `Bash(curl:*)` in allowed-tools** - it's handled by pre-execution:

```yaml
---
description: Command description
allowed-tools: Read, Write, Bash(git:*)  # NO Bash(curl:*)
---
```

#### Example

```markdown
---
description: Verify design system version and sync work artifacts
allowed-tools: Read, Glob, Grep, Edit, Task
---

# Design System Sync

Synchronize GUI/UI work artifacts with the design system version.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`design-sync\`

## Workflow

### Step 0: Generate Showcase Specification
[...]
```

#### Pre-Execution File Location

The centralized pre-execution logic is defined in:
```
~/.claude/standards/command-pre-execution.md
```

This file contains the actual tracking curl command and any other global pre-execution logic.

---

### 2. Argument Validation

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

### 3. Error Handling

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

**Server not running:**
```markdown
If skill server is not running, continue without tracking (fail silently for tracking only).
```

**Missing dependencies:**
```markdown
If required tool is not installed, show installation instructions and exit.
```

---

### 4. Frontmatter Standards

**All commands must follow this frontmatter structure:**

```yaml
---
description: Brief one-line description (50 chars max)
argument-hint: "<required> [optional]"
allowed-tools: Read, Write, Bash(git:*)  # NO Bash(curl:*) needed
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

**Note:** `Bash(curl:*)` is NO LONGER needed in allowed-tools - usage tracking is handled by `command-pre-execution.md`

---

## Common Command Patterns

### Pattern 1: Simple Workflow Command

**Use case:** Commands that execute a linear workflow.

**Template:**
```markdown
---
description: Brief description
allowed-tools: Read, Write  # NO Bash(curl:*)
---

# Command Name

Brief explanation of what this command does.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`

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
allowed-tools: Read, Write  # NO Bash(curl:*)
---

# Command Name

Brief explanation.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`

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
allowed-tools: Bash(python:*)  # NO Bash(curl:*)
---

# Command Name

Brief explanation. This command delegates to the `skill-name` skill.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`

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
allowed-tools: Read, Write, Edit, Glob, Grep  # NO Bash(curl:*)
---

# Command Name

Brief explanation.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`

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
3. **Usage Tracking** - Standard template
4. **Arguments** - If applicable
5. **Workflow** - Step-by-step execution

### Optional Sections

Commands MAY include:

- **Examples** - Usage examples
- **Output** - Expected output format
- **Notes** - Important caveats
- **Related** - Related commands/skills

### Writing Style

- **Imperative mood** - "Track usage", not "Usage is tracked"
- **Active voice** - "Execute command", not "Command is executed"
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

### Skill Tracking

Skills should also track usage. In Python:

```python
import requests
import json

def track_usage(skill_name):
    """Track skill usage (fails silently if server not running)"""
    try:
        requests.post(
            'http://localhost:972/api/usage/track',
            headers={'Content-Type': 'application/json'},
            data=json.dumps({'type': 'skills', 'id': skill_name}),
            timeout=1
        )
    except:
        pass  # Fail silently

def main():
    track_usage('skill-name')
    # ... rest of skill logic
```

For shared tracking utility, see `~/.claude/skills/_shared/usage_tracking.py` (if exists).

---

## Testing Checklist

Before finalizing a command, verify:

- [ ] Pre-execution reference present immediately after title
- [ ] Command name in pre-execution matches filename
- [ ] Frontmatter does NOT include `Bash(curl:*)` (handled by pre-execution)
- [ ] Arguments validated if applicable
- [ ] Error cases handled gracefully
- [ ] Clear workflow steps defined
- [ ] Documentation complete
- [ ] Tested with skill server running (tracking works)
- [ ] Tested with skill server stopped (tracking fails silently)

---

## Migration Guide

### Migrating from Old (Inline) to New (Pre-Execution) Pattern

**OLD PATTERN (deprecated):**
```markdown
## Usage Tracking
curl -X POST http://localhost:972/api/usage/track...
```

**NEW PATTERN (current):**
```markdown
**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`command-name\`
```

### Migration Steps

1. **Remove `Bash(curl:*)` from frontmatter:**
   ```yaml
   # OLD
   allowed-tools: Read, Write, Bash(curl:*), Bash(git:*)

   # NEW
   allowed-tools: Read, Write, Bash(git:*)
   ```

2. **Replace Usage Tracking section** with pre-execution reference:
   ```markdown
   # Command Name

   Brief description.

   **Before executing, read and execute:**
   \`~/.claude/standards/command-pre-execution.md\`

   Replace \`$COMMAND_NAME\` with: \`command-name\`

   ## Workflow
   [...]
   ```

3. **Test** both scenarios (server running/stopped)

4. **Commit** with message:
   ```
   feat(command-name): migrate to pre-execution pattern

   Replaced inline tracking with centralized pre-execution pattern.
   ```

---

## Examples

### Example 1: Simple Command (clean-up)

```markdown
---
description: Update CLAUDE.md project overview and language conventions
allowed-tools: Read, Write, Edit  # NO Bash(curl:*)
---

# clean-up

Scan the codebase and update the `CLAUDE.md` project overview and conventions to reflect the current state.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`clean-up\`

## Workflow

### Step 1: Read CLAUDE.md
- Read current CLAUDE.md content

### Step 2: Update Documentation
- Update project overview
- Update language conventions
- Ensure consistency

### Step 3: Save Changes
- Write updated CLAUDE.md
- Confirm completion
```

### Example 2: Argument Command (git-collect-commits)

```markdown
---
description: Extract git commits for portfolio
argument-hint: "<repo_path> [--author name]"
allowed-tools: Read, Write, Bash(git:*)  # NO Bash(curl:*)
---

# git-collect-commits

Extract git commit history from a repository for portfolio purposes.

**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace \`$COMMAND_NAME\` with: \`git-collect-commits\`

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

- `command-pre-execution.md` - Centralized pre-execution logic (usage tracking)
- `meta-new-command/SKILL.md` - Command creation rulebook
- `meta-new-skill/SKILL.md` - Skill creation rulebook
- `CLAUDE.md` - Overall system guide
- `design-system.md` - UI/CSS standards
- `unreal-engine.md` - UE-specific standards

---

## Version History

- **2.0.0** (2026-02-08) - Replaced inline tracking with pre-execution pattern for centralized logic
- **1.0.0** (2026-02-08) - Initial standard with usage tracking, error handling, and common patterns
