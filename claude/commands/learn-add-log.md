---
description: Update project learnings with new insight
argument-hint: "<project> <category: convention|worked|failed|gotcha>"
allowed-tools: Read, Edit, Write, Glob, Bash(curl:*)
---

# Update Learnings

Add a new learning to the project wisdom vault.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `learn-add-log`

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user for project and category. NEVER auto-execute.**
```
Usage: /learn-add-log <project> <category>
Categories: convention, worked, failed, gotcha
```

Parse as: `<project_name> <category>`

Categories:
- `convention` - Pattern discovered in codebase
- `worked` - Successful approach worth repeating
- `failed` - Approach that didn't work (and why)
- `gotcha` - Non-obvious issue that causes problems

## Execution

**IMPORTANT:** Always use the absolute path `D:\vs\caol-ila\claude\private\learnings\` (not symlink).

1. **Parse arguments** - Extract project name and category
2. **Check/create directory**: `D:\vs\caol-ila\claude\private\learnings\projects\`
3. **Read or create** project file: `D:\vs\caol-ila\claude\private\learnings\projects\<project>.md`
   - If new, copy from `D:\vs\caol-ila\claude\private\learnings\_template.md`
4. **Ask user** to describe the learning
5. **Append** to appropriate section with today's date
6. **Confirm** the addition

## Current Learnings

Use Glob to list existing project files:
- Pattern: `D:\vs\caol-ila\claude\private\learnings\projects\*.md`

## Template Location

Use Read to load the template:
- Path: `D:\vs\caol-ila\claude\private\learnings\_template.md`
