---
description: Generate a new command following naming conventions
argument-hint: "<category> <verb> <subject>"
allowed-tools: Read, Write, Bash(ls:*)
---

# Generate New Command

Create a new Claude Code command following the standardized naming convention.

## Arguments

$ARGUMENTS = `<category> <verb> <subject>`

**If no argument is provided, show usage and ask. NEVER auto-execute.**

```
Usage: /meta-new-command <category> <verb> <subject>

Examples:
  /meta-new-command git push remote
  /meta-new-command tutoring export records
  /meta-new-command ue validate blueprint
```

## Naming Rules Reference

**MANDATORY: Read the complete naming rules before creating any command.**

```
~/.claude/skills/meta-new-command/SKILL.md
```

This file contains:
- `{category}-{verb}-{subject}` pattern structure
- 7 naming rules
- All standard categories (git, tutoring, cinev, ue, art, learn, meta, etc.)
- Frontmatter rules (F1-F4)
- Content rules (C1-C4)
- Compatibility rules (X1-X3)
- Common mistakes
- Examples by category

## Special Case: Unreal Engine Commands

**If user asks to create a `ue-*` command (Unreal Engine related), check if it needs a skill first:**

**For UE commands that export/analyze UE assets:**

Use the UE skill generator instead:
```
/ue-new-skill <verb> <noun>
```

This automatically creates both the skill AND the command.

**Why?**
- UE commands typically need UE skills to do the actual work
- `/ue-new-skill` creates the complete package: skill + command + templates
- Ensures consistency with UE-specific patterns

**Example:**
```
User: "Create a ue-analyze-texture command"
→ Response: "For Unreal Engine export/analysis commands, use /ue-new-skill analyze texture which creates both the skill and command automatically."
```

**When to use meta-new-command for UE:**
- Simple wrapper commands that call existing UE skills
- Commands that don't need new UE Editor integration
- Commands that only orchestrate existing UE tools

## Execution

1. **Parse arguments**: Extract category, verb, subject
2. **Validate naming**: Check against rules in SKILL.md
3. **Construct filename**: `{category}-{verb}-{subject}.md`
4. **Ask user**:
   - Description (one-line summary)
   - What arguments does it accept? (for argument-hint)
   - What tools does it need? (for allowed-tools)
   - What does it do? (for content body)

5. **Generate file**: `~/.claude/commands/{category}-{verb}-{subject}.md`
   - Frontmatter: description → argument-hint → allowed-tools
   - Title: `# {Verb} {Subject}`
   - Arguments section (if applicable)
   - Execution section
   - Examples section

6. **Confirm**: Show created file path and basic structure

## Template Structure

```markdown
---
description: [One-line summary]
argument-hint: "[<arg>]"
allowed-tools: [Tool list]
---

# [Title]

[Description of what this command does]

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask. NEVER auto-execute.**

\```
Usage: /[command-name] <argument>
\```

## Execution

[Step-by-step instructions for Claude]

## Example

[Usage examples]
```

## After Creation

1. Test the command: Verify it works as expected
2. Register in skill server (if web skill)
3. Update CLAUDE.md if new category added
