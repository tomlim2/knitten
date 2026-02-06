# meta-new-skill

**Version:** 0.1.0

Skill creation generator for Claude Code with comprehensive structure rules.

---

## Changelog

- **0.1.0** - Initial release with skill structure rules

---

## Purpose

This skill helps create new Claude Code skills following the standardized naming convention and structure. It serves as the authoritative rulebook for skill creation.

**IMPORTANT: All new Python skills MUST include usage tracking by importing `_shared.track_usage` and calling at start of main(). See "Usage Tracking" section.**

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
~/.claude/skills/ue-skill-template/SKILL.md
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

**Version:** 0.1.0

[One-line description of what this skill does]

---

## Changelog

- **0.1.0** - Initial release

---

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
2. **Version**: `**Version:** 0.1.0`
3. **Description**: One-line summary under version
4. **Changelog**: List of version changes
5. **Purpose**: Detailed explanation
6. **Usage**: How to use with examples
7. **Files**: List and describe all files in the skill

### Version Numbering

Follow semantic versioning:
- `0.1.0` - Initial release
- `0.2.0` - Minor feature addition
- `0.x.0` - Breaking changes in 0.x range
- `1.0.0` - First stable release
- `1.1.0` - New features (backward compatible)
- `1.1.1` - Bug fixes

---

## Implementation Files

### Main Script Naming

Scripts can have descriptive names (don't need to follow category-verb-subject):
- `extract_commits.py` - Descriptive and clear
- `validate_name.py` - Action-oriented
- `export_material_data.py` - Explains what it does
- `run_in_editor.py` - Context-specific

### Script Requirements

1. **Docstring**: Explain what the script does
2. **CLI arguments**: Use `argparse` for Python scripts
3. **Error handling**: Graceful failures with clear messages
4. **Logging**: Use appropriate logging (print, logging module, unreal.log)
5. **Output**: Predictable output location (preferably `~/.claude/private/`)

### Python Script Template

```python
#!/usr/bin/env python3
"""
{Script description}

Usage:
    python script.py [arguments]
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Script description")
    parser.add_argument("argument", help="Argument description")
    parser.add_argument("-o", "--output", help="Output file path")

    args = parser.parse_args()

    # Implementation
    try:
        # Do work
        print(f"Success: {result}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### Usage Tracking

Skills can track when they're invoked to help identify which skills are used most frequently.

**Import tracking helper:**
```python
import sys
sys.path.insert(0, str(Path.home() / ".claude" / "skills"))
from _shared.track_usage import track
```

**Track at start of main():**
```python
def main():
    # Track skill usage (fails silently if server not running)
    track('skills', 'my-skill-name')

    # Rest of implementation...
    parser = argparse.ArgumentParser(...)
```

**Full example:**
```python
#!/usr/bin/env python3
"""My skill that does something useful."""

import sys
from pathlib import Path

# Add skills directory to path for _shared imports
sys.path.insert(0, str(Path.home() / ".claude" / "skills"))
from _shared.track_usage import track

def main():
    # Track skill usage
    track('skills', 'my-skill-name')

    # Implementation
    print("Doing work...")

if __name__ == "__main__":
    main()
```

**Notes:**
- Tracking is optional but recommended
- Fails silently if skill server is not running
- Helps identify frequently-used skills for optimization
- Data stored in `~/.claude/private/usage-stats.json`
- Dashboard shows usage stats at http://localhost:972

---

## Configuration Files

### config.json (Optional)

Use JSON for configuration:

```json
{
  "version": "0.1.0",
  "name": "skill-name",
  "settings": {
    "default_output": "~/.claude/private/",
    "port": 3000
  }
}
```

---

## Skill Categories

### By Purpose

**Meta Tools** (`meta-*`)
- Create and manage commands/skills
- Examples: `meta-new-command`, `meta-new-skill`

**Git Tools** (`git-*`)
- Git operations and analysis
- Examples: `git-commit-collector`

**UE Tools** (`ue-*`)
- Unreal Engine automation
- Examples: `ue-analyze-material`, `ue-validate-asset-name`

**Project Tools** (`cinev-*`, etc.)
- Project-specific automation
- Examples: Skills for specific projects

**Domain Tools** (`tutoring-*`, `drink-*`, etc.)
- Domain-specific functionality
- Examples: Business logic, data tracking

**Infrastructure** (`skill-server`, etc.)
- Core system infrastructure
- Examples: Web servers, shared utilities

---

## Directory Organization

### Simple Skill (Single Script)

```
git-commit-collector/
├── SKILL.md
└── extract_commits.py
```

### Complex Skill (Multiple Files)

```
ue-analyze-material/
├── SKILL.md
├── run_in_editor.py
├── export_material_data.py
└── config.json
```

### Skill with Assets

```
skill-server/
├── SKILL.md
├── server.js
├── config.json
├── public/
│   ├── styles/
│   └── scripts/
└── views/
    └── templates/
```

---

## Dependencies

### Document Dependencies in SKILL.md

```markdown
## Dependencies

**Python:**
- Python 3.8+
- argparse (built-in)
- pathlib (built-in)

**External:**
- Git 2.0+ (for git operations)

**Claude Code Tools:**
- Bash tool for running scripts
- Read/Write for file operations
```

### For Node.js Skills

Include `package.json`:

```json
{
  "name": "skill-name",
  "version": "0.1.0",
  "description": "Skill description",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

---

## Output Guidelines

### Output Location

**Private data** → `~/.claude/private/`
- Extracted data
- Generated files
- Cache
- User-specific content

**Skill-specific subdirectories:**
```
~/.claude/private/
├── commits/          # git-commit-collector
├── unreal/
│   ├── material-analyze/    # ue-analyze-material
│   └── asset-validate/      # ue-validate-asset-name
├── tutoring/
│   └── invoices/            # tutoring-* skills
└── drinks/                  # drink-log
```

### Output Format

**JSON** for structured data:
```json
{
  "version": "1.0",
  "generated": "2026-02-06T12:00:00Z",
  "data": {}
}
```

**Markdown** for documentation/reports

**Plain text** for logs

---

## Testing Skills

### Manual Testing

1. Create test input
2. Run script directly: `python script.py --test`
3. Verify output in expected location
4. Check error handling with invalid input

### Integration Testing

1. Create wrapper command
2. Test command invocation: `/command-name`
3. Verify command calls skill correctly
4. Check output reaches user

---

## Common Patterns

### Pattern 1: Data Extraction Skill

```
Skill extracts data from source → Saves to private/ → Command reads and displays
```

Example: `git-commit-collector`
- Skill: Extracts commit history to JSON
- Command: `git-collect-commits` invokes skill, shows summary

### Pattern 2: Analysis Skill

```
Skill receives input → Processes/analyzes → Returns structured output
```

Example: `ue-analyze-material`
- Skill: Exports material data from UE
- Command: `ue-analyze-material` reads and analyzes

### Pattern 3: Web Service Skill

```
Skill runs server → Provides web interface → Command opens browser
```

Example: `skill-server`
- Skill: Runs Express server on port 972
- Commands: `tutoring-open-invoice` opens specific routes

### Pattern 4: Generator Skill

```
Skill contains templates/rules → Command prompts user → Generates files
```

Example: `meta-new-command`
- Skill: Contains all naming rules
- Command: Generates new command files

---

## Skill vs Command

| Aspect | Skill | Command |
|--------|-------|---------|
| **Location** | `skills/{name}/` | `commands/{name}.md` |
| **Purpose** | Reusable logic | User-facing workflow |
| **Invocation** | Called by commands | Called by user (`/command`) |
| **Files** | Multiple files (SKILL.md + scripts) | Single markdown file |
| **Tools** | Full system access | Restricted by `allowed-tools` |
| **Complexity** | Can be complex | Should be simple |
| **Documentation** | SKILL.md with version | Frontmatter + content |

**When to create a skill:**
- Logic is reusable across commands
- Requires multiple files
- Needs version tracking
- Complex implementation
- Used by other skills

**When to create just a command:**
- Simple one-off task
- Only needs allowed-tools
- Self-contained logic
- User-facing only

---

## Migration from Command to Skill

If a command grows complex:

1. **Extract logic** to skill:
   - Create `skills/{name}/` directory
   - Move implementation to script.py
   - Write SKILL.md

2. **Simplify command**:
   - Command becomes thin wrapper
   - Calls skill via `Bash(python:*)`
   - Handles user interaction only

3. **Example**:

**Before** (complex command):
```markdown
---
allowed-tools: Bash(git:*), Read, Write, Grep, Glob
---
[100 lines of complex logic]
```

**After** (simple command + skill):

Command:
```markdown
---
allowed-tools: Bash(python:*)
---
Run: python ~/.claude/skills/git-commit-collector/extract_commits.py $ARGUMENTS
```

Skill:
```
git-commit-collector/
├── SKILL.md
└── extract_commits.py (100 lines of logic)
```

---

## Related Files

- `commands/meta-new-skill.md` - Command wrapper for this skill
- `skills/meta-new-command/SKILL.md` - Naming convention rules
- `CLAUDE.md` - Main workflow guidance
