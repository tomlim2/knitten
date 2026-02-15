---
description: Generate technical specification document from code
argument-hint: "<path> | --diff"
allowed-tools: Bash(git:*), Bash(mkdir:*), Bash(ls:*), Bash(date:*), Glob, Grep, Read, Task, Write
---

# dev-generate-spec

Generate a technical specification document for code or branch changes.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `dev-generate-spec`

## Arguments

Target: $ARGUMENTS

**If no argument provided:**
```
Usage: /spec <path> | --diff

Examples:
  /spec Plugins/VRM4U/           # Analyze a plugin directory
  /spec src/MyModule/            # Analyze a module
  /spec --diff                   # Analyze current branch vs develop
  /spec path/to/file.h           # Analyze specific file(s)
```
**Stop here if no argument. Do not auto-execute.**

## Context

- Current directory: !`pwd`
- Date: !`date +%Y-%m-%d`
- Author: !`git config user.name 2>/dev/null || echo "Unknown"`

## Template Reference

Read the spec template for structure guidance:
!`cat ~/.claude/standards/tech-spec-template.md 2>/dev/null | head -100`

## Workflow

### Mode Detection

1. **If `--diff`**: Branch diff mode
   - Get changed files: `git diff develop...HEAD --stat`
   - Get commit history: `git log develop..HEAD --oneline`
   - Derive name from branch: `git branch --show-current`

2. **If path provided**: Directory/file mode
   - List source files in the path
   - Derive name from directory/file name

### Analysis Phase

Use **Task tool with subagent_type=Explore** to deeply analyze the code:

**For the Explore agent, include these instructions:**
- Read all header files (.h) to understand public API
- Read implementation files (.cpp) for algorithms and logic
- Identify core classes and their responsibilities
- Map data flow: input → processing → output
- Note any coordinate systems, unit conversions, version handling
- Extract key algorithm descriptions
- List all public functions with their signatures

### Generation Phase

Create a specification document following the template structure:

1. **Metadata**: Fill from git/context
2. **Overview**: One paragraph summary from code analysis
3. **Architecture**: Core components table, data flow diagram
4. **Implementation**: Key algorithms, public API signatures, configuration
5. **File Structure**: List new/modified files with descriptions
6. **Test Plan**: Based on existing tests or suggest manual verification
7. **Limitations**: Note any TODOs or known issues from code

### Output

1. Generate the full specification as markdown
2. Show the user the generated content
3. Create output directory if needed: `mkdir -p ~/.claude/private/specs`
4. Save to: `~/.claude/private/specs/{name}.md`
   - For `--diff`: sanitize branch name (replace `/` with `-`)
   - For path: use directory or file name

## Requirements

- **Language**: English
- **Detail**: Standard (3-5 pages)
- **Specificity**: Use actual class names, function signatures, file paths
- Include code snippets for key algorithms (keep brief)
