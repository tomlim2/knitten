---
description: "Structure rules and templates for creating Claude Code skills. Use when creating new skills."
---

# meta-new-skill

Skill creation generator for Claude Code with comprehensive structure rules.

## Purpose

This skill helps create new Claude Code skills following the standardized naming convention and structure. It serves as the authoritative rulebook for skill creation.

---

## Skill Structure

Skills are reusable utilities that commands invoke. They consist of:

```
skills/{category}-{verb}-{subject}/
├── SKILL.md              # Skill documentation (required)
├── script.py             # Main implementation
├── config.json           # Optional configuration
└── other files...        # Additional scripts, data, etc.
```

---

## Naming Convention

**MANDATORY: All skills MUST follow the `{category}-{verb}-{subject}` pattern.**

This is the SAME pattern as commands. See `meta-new-command` skill for complete naming rules:
- `~/.claude/skills/meta-new-command/SKILL.md`

### Quick Reference

- **Lowercase only** - No capitals, no camelCase
- **Hyphens as separators** - Never underscores
- **Three parts**: `{category}-{verb}-{subject}`
- **Multi-word subjects**: Use hyphens (e.g., `asset-name`)

### Examples

| Skill Directory | Category | Verb | Subject |
|-----------------|----------|------|---------|
| `git-commit-collector` | git | commit | collector |
| `ue-analyze-material` | ue | analyze | material |
| `ue-validate-asset-name` | ue | validate | asset-name |
| `meta-new-command` | meta | new | command |
| `meta-new-skill` | meta | new | skill |
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
/ue-new-skill <verb> <noun>
```

**Why UE skills are special:**
- Require specific Python patterns for Unreal Editor integration
- Need `run_in_editor.py` wrapper for remote execution
- Export JSON data to `~/.claude/private/unreal/{noun}-{verb}/`
- Follow strict logging conventions with `[LogTag]` prefixes
- Use `export_{noun}_data.py` naming pattern
- Have specific error handling for `get_editor_property()` calls

**When to use ue-new-skill:**
- Any skill that exports data from Unreal Editor
- Any skill that analyzes UE assets (materials, meshes, blueprints, etc.)
- Any skill that validates UE naming conventions
- Any skill that requires running Python inside UE Editor

**Example:**
```
User request: "Create a ue-analyze-texture skill"
→ Use: /ue-new-skill analyze texture
→ NOT: /meta-new-skill ue analyze texture
```

---

## SKILL.md Structure (Required)

Every skill MUST have a `SKILL.md` file with this exact structure:

### Template

```markdown
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
- `other_file.py` - [Description of other files]

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

1. **Title**: `# {category}-{verb}-{subject}`
2. **Description**: One-line summary
3. **Purpose**: Detailed explanation
4. **Usage**: How to use with examples
5. **Files**: List and describe all files in the skill

## Additional Resources

For detailed implementation patterns, templates, and code examples, see [reference.md](reference.md).
