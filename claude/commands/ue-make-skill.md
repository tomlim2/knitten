---
description: Generate a new UE Editor skill from template
argument-hint: "<verb> <noun>"
allowed-tools: Read, Write, Bash(mkdir:*), Bash(copy:*), Bash(cp:*), Glob, Grep, Task
---

# Generate New UE Editor Skill

Create a new UE Editor skill following the established `ue-analyze-material` pattern.
## Arguments

Input: $ARGUMENTS

**If no argument provided:**
```
Usage: /ue-make-skill <verb> <noun>

Examples:
  /ue-make-skill analyze mesh
  /ue-make-skill inspect animation
  /ue-make-skill extract texture
  /ue-make-skill audit blueprint
```
**Stop here if no argument. Do not auto-execute.**

## Pattern Reference

Read the template specification:
!`cat ~/.claude/skills/ue-show-template/SKILL.md`

Read the reference implementation for style:
!`head -50 ~/.claude/skills/ue-analyze-material/export_material_data.py`

## Step 1: Gather Requirements

Before generating files, ask the user:

1. **What UE asset types should this skill support?**
   - e.g., StaticMesh, SkeletalMesh, AnimSequence, Blueprint, Texture2D, etc.
   - For each type, what's the `unreal.ClassName` for isinstance checks?

2. **What data should be extracted?**
   - Which editor properties matter for this asset type?
   - Any enum values that need human-readable mapping?
   - Any non-exposed properties that need ObjectIterator?

3. **What analysis sections make sense?**
   - What would be most useful to see in the Claude Code analysis output?

## Step 2: Derive Names

From the verb and noun arguments, compute:

| Variable | Pattern | Example (`analyze mesh`) |
|---|---|---|
| Skill dir | `ue-{verb}-{noun}` | `ue-analyze-mesh` |
| Script | `export_{noun}_data.py` | `export_mesh_data.py` |
| Command | `ue-{verb}-{noun}.md` | `ue-analyze-mesh.md` |
| Output dir | `{noun}-{verb}` | `mesh-analyze` |
| Log tag | `{Noun}{Verb}` PascalCase | `MeshAnalyze` |
| Description | `{Verb} exported UE {noun} data` | `Analyze exported UE mesh data` |

## Step 3: Generate Files

Create exactly 4 files:

### 3a. Create skill directory
```bash
mkdir -p ~/.claude/skills/ue-{verb}-{noun}
```

### 3b. Copy run_in_editor.py (verbatim)
```bash
cp ~/.claude/skills/ue-analyze-material/run_in_editor.py ~/.claude/skills/ue-{verb}-{noun}/run_in_editor.py
```

### 3c. Write export_{noun}_data.py

Follow the pattern EXACTLY from the template SKILL.md:
- Docstring with script path and supported types
- `import unreal, json, os, datetime`
- Enum maps for this asset type's enums
- `get_enum_name()` helper (copy verbatim from reference)
- One `extract_{type}()` function per supported asset type
- `_make_base_dict()` with the JSON schema for this asset
- `save_json()` with correct subdirectory
- `main()` with isinstance dispatch, processed counter, summary logging
- `main()` call at bottom

**Critical rules:**
- Every `get_editor_property()` call wrapped in individual try/except
- Most-specific isinstance checks first (subclasses before parents)
- Use `unreal.log()` / `unreal.log_warning()` / `unreal.log_error()` for all output
- Use `[{LogTag}]` prefix in all log messages
- Output to `~/.claude/private/unreal/{noun}-{verb}/`

### 3d. Write SKILL.md

Follow the exact section order from the template:
1. Title + version (0.1.0)
2. Changelog
3. Purpose
4. Usage (one-step + manual two-step)
5. Remote Execution reference
6. JSON Schema (matching what the script actually outputs)
7. Related Files

### 3e. Write ue-{verb}-{noun}.md

Follow the command pattern:
- Frontmatter: `allowed-tools: Read, Glob, Task, Grep, Bash(python:*)`
- Three behaviors: --export, no-arg, named-arg
- Analysis output sections tailored to the asset type
- Use `dir /b` for listing on Windows

## Step 4: Verify

After generating all files, show the user:
1. List of created files
2. JSON schema that will be exported
3. How to test: "Select a {noun} in Content Browser, then run `/ue-{verb}-{noun} --export`"

## Paths

- Skills: `~/.claude/skills/`
- Commands: `~/.claude/commands/`
- Reference: `~/.claude/skills/ue-analyze-material/`
- Template: `~/.claude/skills/ue-show-template/SKILL.md`
