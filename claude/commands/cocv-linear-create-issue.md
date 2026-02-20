---
description: Create a Linear issue in TA team assigned to deemo
argument-hint: "<title> [--desc <description>] [--priority 0-4] [--label <label>] [--project <project>] [--due <YYYY-MM-DD>] [--team <team>] [--assignee <user>]"
---

# Linear Create Issue

Create a new Linear issue with TA team defaults.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-linear-create-issue`

## Defaults

| Field | Default |
|-------|---------|
| Team | TA |
| Assignee | deemo |
| Priority | 0 (None) |

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /cocv-linear-create-issue <title> [options]
Options:
  --desc <description>    Issue description (Markdown)
  --priority <0-4>        0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --label <label>         Label name (multiple allowed)
  --project <project>     Project name
  --due <YYYY-MM-DD>      Due date
  --team <team>           Override team (default: TA)
  --assignee <user>       Override assignee (default: deemo)
  --state <state>         Issue state (e.g., Backlog, Todo)

Example:
  /cocv-linear-create-issue 파편화된 Cinev 메시 설정 규약 모으기
  /cocv-linear-create-issue VRM 익스포트 파이프라인 점검 --priority 3 --label Pipeline
  /cocv-linear-create-issue 텍스처 네이밍 컨벤션 위반 수정 --desc "Female 폴더 내 V01 누락 건" --due 2026-03-01
```

## Execution

### Step 1: Parse arguments

Parse title and optional flags from `$ARGUMENTS`.

- Title: everything before the first `--` flag (or all arguments if no flags)
- Flags: `--desc`, `--priority`, `--label`, `--project`, `--due`, `--team`, `--assignee`, `--state`

### Step 2: Preview and confirm

Show the user what will be created:

```
Linear Issue Preview:
  Team:      {team}
  Title:     {title}
  Assignee:  {assignee}
  Priority:  {priority}
  Labels:    {labels or "None"}
  Project:   {project or "None"}
  Due:       {due or "None"}
  State:     {state or "Default"}
  Description:
    {description or "None"}
```

**Wait for user confirmation before creating.**

### Step 3: Create issue

Use `mcp__claude_ai_Linear__create_issue` with:

```
title: parsed title
team: "TA" (or override)
assignee: "deemo" (or override)
priority: 0 (or override)
labels: if provided
project: if provided
dueDate: if provided
description: if provided
state: if provided
```

### Step 4: Report result

Show the created issue identifier (e.g., `TA-123`) and URL.
