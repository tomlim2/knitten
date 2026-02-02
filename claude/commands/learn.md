---
allowed-tools: Read, Edit, Write, Bash(mkdir:*), Bash(ls:*), Bash(date:*)
description: Update project learnings with new insight
argument-hint: "<project> <category: convention|worked|failed|gotcha>"
---

# Update Learnings

Add a new learning to the project wisdom vault.

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user for project and category. NEVER auto-execute.**
```
Usage: /learn <project> <category>
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

Projects with learnings:
!`ls "D:\vs\caol-ila\claude\private\learnings\projects" 2>/dev/null || echo "No learnings yet - this will be the first!"`

## Template Location

!`cat "D:\vs\caol-ila\claude\private\learnings\_template.md" 2>/dev/null || echo "Template not found - will create project file from scratch"`

## Today's Date

!`date +%Y-%m-%d`
