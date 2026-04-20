---
description: Generate a new skill following naming conventions
argument-hint: "<category> <verb> <subject>"
allowed-tools: Read, Write, Bash(mkdir:*)
---

# Generate New Skill

Create a new Claude Code skill following the standardized naming convention and structure.
## Arguments

$ARGUMENTS = `<category> <verb> <subject>`

**If no argument is provided, show usage and ask. NEVER auto-execute.**

```
Usage: /caol-make-skill <category> <verb> <subject>

Examples:
  /caol-make-skill git analyze diff
  /caol-make-skill tutoring export records
  /caol-make-skill ue validate texture
```

## Skill Structure Rules Reference

**MANDATORY: Read the complete skill structure rules before creating any skill.**

```
~/.claude/skills/caol-make-skill/SKILL.md
```

This file contains:
- `{category}-{verb}-{subject}` naming pattern (same as commands)
- Directory structure requirements
- SKILL.md structure template
- Implementation file guidelines
- Dependencies and configuration
- Output location guidelines
- Testing patterns
- Skill vs Command decision guide

## Special Case: Unreal Engine Skills

**If user asks to create a `ue-*` skill (Unreal Engine related), point them to:**

```
~/.claude/skills/ue-show-template/SKILL.md
```

Or use the dedicated command:
```
/ue-make-skill <verb> <noun>
```

**Why?**
- UE skills have specific patterns (Python scripts, Unreal Editor integration, JSON export)
- ue-show-template contains UE-specific templates and conventions
- ue-make-skill command generates all required files automatically

**Example:**
- User: "Create a ue-validate-texture skill"
- Response: "For Unreal Engine skills, please use `/ue-make-skill validate texture` which follows the UE-specific template and conventions."

## Execution

1. **Parse arguments**: Extract category, verb, subject
2. **Validate naming**: Check against rules in SKILL.md
3. **Construct directory name**: `{category}-{verb}-{subject}`
4. **Create directory**: `~/.claude/skills/{category}-{verb}-{subject}/`

5. **Ask user**:
   - What does this skill do? (for SKILL.md Purpose)
   - What files does it need? (script.py, config.json, etc.)
   - What's the main implementation? (Python, Node.js, shell, etc.)
   - Where should output go? (usually `~/.claude/private/`)
   - What dependencies does it have?

6. **Generate SKILL.md**:
   - Title: `# {category}-{verb}-{subject}`
   - Version: `0.1.0`
   - Changelog: Initial release
   - Purpose: User's description
   - Usage: How to use the skill
   - Files: List of files with descriptions

7. **Create implementation files**:
   - Main script (e.g., `script.py`, `server.js`)
   - Config if needed (e.g., `config.json`)
   - Other files as specified

8. **Confirm**: Show created directory structure

## SKILL.md Template

```markdown
# {category}-{verb}-{subject}

**Version:** 0.1.0

[One-line description]

---

## Changelog

- **0.1.0** - Initial release

---

## Purpose

[Detailed explanation of what this skill does and why]

---

## Usage

[How to use this skill, with examples]

---

## Files

- `script.py` - [Description]
- `config.json` - [Description]
```

## Implementation File Templates

### Python Script Template

```python
#!/usr/bin/env python3
"""
{Description}

Usage:
    python script.py [arguments]
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Description")
    parser.add_argument("arg", help="Argument help")
    parser.add_argument("-o", "--output", help="Output path")

    args = parser.parse_args()

    try:
        # Implementation
        print(f"Success: {result}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Node.js Server Template

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Skill server running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

## After Creation

1. **Test the skill**: Run implementation files directly
2. **Create wrapper command**: Create `/caol-make-command {category} {verb} {subject}` to wrap this skill
3. **Register in skill-server** (if web skill)
4. **Update CLAUDE.md** if new category added
5. **Commit**: Add to version control

## Output Location Standards

**Private data:**
- `~/.claude/private/{skill-specific}/`

**Examples:**
- `~/.claude/private/commits/` - git-commit-collector
- `~/.claude/private/unreal/material-analyze/` - ue-analyze-material
- Obsidian `claude/tutoring/invoices/` - tutoring skills
- Obsidian `claude/drinks/` - drink-log

## Naming Rules Reference

For complete naming rules, see:
```
~/.claude/skills/caol-make-command/SKILL.md
```

Skills follow the SAME naming pattern as commands: `{category}-{verb}-{subject}`
