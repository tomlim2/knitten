---
description: "Generate technical specification documents from code. Use when creating specs for features or systems."
---

# dev-generate-spec

Technical specification document generator for Claude Code.

## Purpose

Analyzes code (plugin, module, or directory) and generates a technical specification document following `agent/document-templates/agent-hub/technical-spec.md`.

**Note:** This is an agent-driven workflow skill with no standalone script. It is invoked exclusively via the `/spec` command.

## Usage

```
/spec <path>           # Analyze a directory or file(s)
/spec --diff           # Analyze current branch vs develop
```

### Input Modes (mutually exclusive)

| Mode | Argument | Example |
|------|----------|---------|
| **Directory** | Path to directory | `/spec Plugins/MyPlugin/` |
| **Specific Files** | One or more file paths | `/spec path/to/file1.h path/to/file2.cpp` |
| **Branch Diff** | `--diff` flag | `/spec --diff` |

Modes cannot be combined. If no argument is provided, the command shows usage and stops.

## Workflow

### Step 1: Gather Context

**For directory/files:**
- List all source files (.h, .cpp, .py, and similar)
- Read headers first to understand public API
- Read implementation for algorithms and data flow

**For branch diff:**
- `git diff develop...HEAD --stat`
- `git log develop..HEAD --oneline`

### Step 2: Analyze Code

Use Task(Explore) agent to:
- Identify core classes and their responsibilities
- Map data flow and dependencies
- Extract public API signatures
- Understand key algorithms
- Note coordinate systems, unit conversions, version handling

### Step 3: Generate Specification

Read `agent/document-templates/agent-hub/technical-spec.md` and fill each section:

| Section | Source |
|---------|--------|
| Overview | Code comments, class descriptions |
| Background | Commit messages, TODOs, design notes |
| Architecture | Class structure, inheritance, composition |
| Implementation | Algorithm analysis, complexity |
| Public API | Header file signatures |
| File Structure | Directory listing |
| Test Plan | Existing tests, manual verification steps |

### Step 4: Save Document

Output path: `~/.claude/private/specs/{name}.md`

Naming convention:
- **Directory mode**: `{directory-name}.md` (e.g., `MyPlugin.md`)
- **File mode**: `{first-file-stem}.md` (e.g., `file1.md`)
- **Branch diff mode**: `{branch-name-sanitized}.md` (slashes replaced with dashes, e.g., `feat-my-feature.md`)

## Output Requirements

- **Language**: English
- **Detail Level**: Standard (3-5 pages)
- **Format**: Markdown following template structure
- Be specific: use actual class names, function signatures, file paths
- Include code snippets for key algorithms

## Related Files

- Command: `~/.claude/commands/spec.md`
- Template: `agent/document-templates/agent-hub/technical-spec.md`
- Output: `~/.claude/private/specs/`
