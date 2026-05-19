---
description: Create a Linear issue in the TA team assigned to deemo
argument-hint: "<title> [--desc <description>] [--priority 0-4] [--label <label>] [--project <project>] [--due <YYYY-MM-DD>] [--team <team>] [--assignee <user>]"
allowed-tools: Read, AskUserQuestion
---

# CCI Linear Create Issue

Create a new Linear issue with TA team defaults.

## Reference

Read `agent/document-templates/linear/cci-issue.md` before formatting
the issue description.

## Arguments

$ARGUMENTS

If no argument is provided, show usage and ask the user. Never auto-execute.

```text
Usage: /cci-linear-create-issue <title> [options]

Options:
  --desc <description>    Issue description
  --priority <0-4>        0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --label <label>         Label name; repeat for multiple labels
  --project <project>     Project name
  --due <YYYY-MM-DD>      Due date
  --team <team>           Override team; default: TA
  --assignee <user>       Override assignee; default: deemo
  --state <state>         Issue state
```

## Workflow

1. Parse title and optional flags from `$ARGUMENTS`.
2. Shape `--desc` with the reference template when a description is present.
3. Convert plain `TA-NNN` references in the description to Linear links unless
   they are already Markdown links.
4. Add a Slack thread link section only when the user provides the Slack URL.
5. Add `> 예시 사진 첨부 요망` only when visual evidence is useful.
6. Preview the exact issue fields and body.
7. Wait for user confirmation before creating the issue.
8. Use the available Linear `save_issue` tool.
9. Report the created issue identifier and URL.

## Preview

```text
Linear Issue Preview:
  Team:      {team}
  Title:     {title}
  Assignee:  {assignee}
  Priority:  {priority}
  Labels:    {labels or "None"}
  Project:   {project or "None"}
  Due:       {due or "None"}
  State:     {state or "Default"}
```
