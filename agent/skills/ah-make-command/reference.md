# ah-make-command Reference

Full examples table, file structure specs, creation workflows, and convention rationale.

---

## Examples by Category

| Command | Category | Verb | Subject | Purpose |
|---------|----------|------|---------|---------|
| `git-collect-commits` | git | collect | commits | Extract commit history |
| `git-make-message` | git | make | message | Generate commit message |
| `tutoring-open-invoice` | tutoring | open | invoice | Open invoice generator |
| `tutoring-move-invoice` | tutoring | move | invoice | Move PDF to storage |
| `tutoring-format-kakaotalk` | tutoring | format | kakaotalk | Generate KakaoTalk message |
| `tutoring-log-lesson` | tutoring | log | lesson | Log tutoring lesson |
| `tutoring-mark-paid` | tutoring | mark | paid | Mark lessons as paid |
| `learn-add-log` | learn | add | log | Add learning entry |
| `cci-open-creator-launcher` | cci | open | creator-launcher | Open CINEV launcher |
| `cci-open-creator-shipper` | cci | open | creator-shipper | Open CINEV shipper |
| `cci-review-cpp` | cci | review | cpp | Review C++ code |
| `cci-open-zo-downloader` | cci | open | zo-downloader | Open ZO downloader |
| `ue-analyze-material` | ue | analyze | material | Analyze UE material |
| `ue-validate-asset-name` | ue | validate | asset-name | Validate UE naming |
| `ue-make-skill` | ue | make | skill | Generate UE skill |
| `cci-art-create-branch` | cci-art | create | branch | Create art branch |
| `cci-art-send-notice` | cci-art | send | notice | Send Slack notice |
| `cci-art-send-merge-notice` | cci-art | send | merge-notice | Send merge notice |
| `cci-art-send-merge-result` | cci-art | send | merge-result | Send merge result |
| `cci-art-prepare-merge` | cci-art | prepare | merge | Prepare art merge |
| `cci-art-remove-branch` | cci-art | remove | branch | Remove old art branch |
| `ah-make-command` | ah | make | command | Generate new command |
| `ah-review-skills` | ah | review | skills | Review skill files |
| `drink-log-entry` | drink | log | entry | Log wine/whisky |

---

## Command File Structure

### Frontmatter (YAML)

**Standard field order:**
1. `description` - One-line summary
2. `argument-hint` - Argument placeholder (optional)
3. `allowed-tools` - Tool whitelist

```yaml
---
description: Brief description of what this command does
argument-hint: "<required_arg> [optional_arg]"
allowed-tools: Read, Write, Bash(git:*), Grep
---
```

### Frontmatter Rules

**F1. Field Order**
- Must follow: `description` → `argument-hint` → `allowed-tools`

**F2. Bash Specificity**
- NEVER use bare `Bash`
- ALWAYS use specific patterns:
  - `Bash(git:*)` - Git commands
  - `Bash(python:*)` - Python scripts
  - `Bash(open:*)` - App launchers
  - `Bash(mv:*), Bash(ls:*)` - File operations
  - `Bash(mkdir:*)` - Directory creation
  - `Bash(npm:*)` - NPM commands

**F3. Argument Hint**
- Include if command accepts arguments
- Use `<required>` and `[optional]` notation

**F4. Heading Structure**
- H1 = Title
- H2+ = Sections (Arguments, Execution, Output, etc.)

### Content Rules

**C1. Missing-Argument Guard**
- If command uses `$ARGUMENTS`, must include guard:
```markdown
**If no argument is provided, show usage and ask the user. NEVER auto-execute.**
```

**C2. Usage Example**
- Show how to invoke the command:
```markdown
Usage: /command-name <argument>
```

**C3. Output Structure**
- Define what the command outputs/produces

**C4. Multi-Step Workflows**
- Use numbered steps for clear execution flow

### Compatibility Rules

**X1. Valid Shell Commands**
- `!backtick` expressions must be valid shell commands

**X2. Argument Syntax**
- Use `$ARGUMENTS` (preferred) or `{{input}}` (for Handlebars)
- Don't mix both

**X3. External References**
- File references must point to existing files

---

## Skills Directory Structure

```
skills/{category}-{verb}-{subject}/
├── SKILL.md              # Skill documentation
├── script.py             # Main implementation
└── config.json           # Optional configuration
```

### SKILL.md Structure

```markdown
# {category}-{verb}-{subject}

Brief description of what this skill does.

## Purpose

Detailed explanation of what this skill does and why it exists.

---

## Usage

How to use this skill, with examples.

---

## Files

- `script.py` - Description of main script
- `config.json` - Description of config (if applicable)
```

---

## Creation Workflow

### For Commands

1. **Identify domain/project** → Choose category
2. **Identify action** → Choose verb
3. **Identify target** → Choose subject
4. **Combine**: `{category}-{verb}-{subject}`
5. **Create file**: `commands/{category}-{verb}-{subject}.md`
6. **Write frontmatter**: description → argument-hint → allowed-tools
7. **Add content**: Title, Arguments, Execution, Examples
8. **Include guard**: If using `$ARGUMENTS`
9. **Test**: Verify command works as expected

**Complete pattern documentation:** `~/.claude/skills/ah-make-command/references/SLASH-COMMANDS.md`

### For Skills

1. **Follow same naming pattern** for directory
2. **Create**: `skills/{category}-{verb}-{subject}/`
3. **Write SKILL.md**: Purpose, usage, files
4. **Implement scripts**: With descriptive filenames
5. **Add config** (if needed)
6. **Document dependencies**: In SKILL.md
7. **Test**: Verify skill works standalone

---

## Why This Convention?

1. **Discoverability**
   - Type category prefix to see all related commands
   - `/tutoring-` shows all tutoring commands
   - `/git-` shows all git commands
   - `/ue-` shows all Unreal Engine tools

2. **Consistency**
   - Clear pattern for creating new commands
   - No guessing about naming
   - Enforces structure

3. **Namespace Isolation**
   - Prevents command name collisions
   - `tutoring-open-invoice` vs `cci-open-creator-launcher`
   - Both "open" something but clearly different

4. **Self-Documenting**
   - Name reveals purpose at a glance
   - `git-collect-commits` = collects git commits
   - `ue-validate-asset-name` = validates UE asset naming

5. **Scalability**
   - Easy to add new categories as projects grow
   - Add new project → Add new category prefix
   - All commands grouped logically

---

## Special Case: Unreal Engine Commands

**For `ue-*` (Unreal Engine) commands, use the dedicated skill generator:**

**Command:**
```
/ue-make-skill <verb> <noun>
```

This creates BOTH the skill AND the command automatically.

**Why?**
- Most UE commands need a UE skill to do the actual work
- UE skills require specific patterns (Editor integration, JSON export, logging)
- `/ue-make-skill` ensures consistency and creates the complete package

**What `/ue-make-skill` generates:**
1. Skill: `ue-{verb}-{noun}/` with Python scripts
2. Command: `ue-{verb}-{noun}.md` that calls the skill
3. All necessary templates and wrappers

**When to use ah-make-command for UE:**
- Simple wrapper commands for existing UE skills
- Commands that only orchestrate existing UE tools
- Commands without new Editor integration needs

**Example:**
```
User: "Create ue-analyze-texture command"
→ Use: /ue-make-skill analyze texture
→ Creates: ue-analyze-texture skill + command
→ NOT: /ah-make-command ue analyze texture
```

**Reference:**
- Template: `~/.claude/skills/ue-show-template/SKILL.md`
- Command: `~/.claude/commands/ue-make-skill.md`

---

## Related Files

- `commands/ah-make-command.md` - Command wrapper for this skill
- `skills/ah-make-skill/SKILL.md` - Skill structure rules (use for creating skills)
- `skills/ah-make-command/references/COMMAND-SKILL-REFERENCE.md` - Detailed command and skill examples
- `commands/ue-make-skill.md` - UE-specific skill/command generator
- `skills/ue-show-template/SKILL.md` - UE skill template
- `SYSTEM.md` - Canonical policy
