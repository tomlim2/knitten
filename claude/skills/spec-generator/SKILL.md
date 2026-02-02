# spec-generator

**Version:** 0.1.0

Technical specification document generator for Claude Code.

## Changelog

- **0.1.0** - Initial release

## Purpose

Analyzes code (plugin, module, or directory) and generates a technical specification document following the standard template defined in `standards/tech-spec-template.md`.

## Usage

### Input Modes

1. **Directory Path**: Analyze all code in a directory
   ```
   /spec Plugins/MyPlugin/
   ```

2. **Branch Diff** (optional): Compare against develop branch
   ```
   /spec --diff
   ```

3. **Specific Files**: Analyze specific files
   ```
   /spec path/to/file1.h path/to/file2.cpp
   ```

## Workflow

### Step 1: Gather Context

**For directory/files:**
- List all source files (.h, .cpp, .py, etc.)
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

Read the template from `~/.claude/standards/tech-spec-template.md` and fill each section:

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
- Directory: `{directory-name}.md`
- Branch: `{branch-name-sanitized}.md`
- Custom: Use provided argument

## Output Requirements

- **Language**: English
- **Detail Level**: Standard (3-5 pages)
- **Format**: Markdown following template structure
- Be specific: use actual class names, function signatures, file paths
- Include code snippets for key algorithms

## Related Files

- Template: `~/.claude/standards/tech-spec-template.md`
- Output: `~/.claude/private/specs/`
