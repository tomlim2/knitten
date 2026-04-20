# caol-make-skill Reference

Detailed implementation patterns, templates, and guidelines for creating Claude Code skills.

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

**Caol Tools** (`caol-*`)
- Create and manage commands/skills
- Examples: `caol-make-command`, `caol-make-skill`

**Git Tools** (`git-*`)
- Git operations and analysis
- Examples: `git-commit-collector`

**UE Tools** (`ue-*`)
- Unreal Engine automation
- Examples: `ue-analyze-material`, `ue-validate-asset-name`

**Project Tools** (`cci-*`, etc.)
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

**Private data** -> `~/.claude/private/`
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
Skill extracts data from source -> Saves to private/ -> Command reads and displays
```

Example: `git-commit-collector`
- Skill: Extracts commit history to JSON
- Command: `git-collect-commits` invokes skill, shows summary

### Pattern 2: Analysis Skill

```
Skill receives input -> Processes/analyzes -> Returns structured output
```

Example: `ue-analyze-material`
- Skill: Exports material data from UE
- Command: `ue-analyze-material` reads and analyzes

### Pattern 3: Web Service Skill

```
Skill runs server -> Provides web interface -> Command opens browser
```

Example: `skill-server`
- Skill: Runs Express server on port 972
- Commands: `tutoring-open-invoice` opens specific routes

### Pattern 4: Generator Skill

```
Skill contains templates/rules -> Command prompts user -> Generates files
```

Example: `caol-make-command`
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
| **Documentation** | SKILL.md | Frontmatter + content |

**When to create a skill:**
- Logic is reusable across commands
- Requires multiple files
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
