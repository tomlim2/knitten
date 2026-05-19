---
description: Create a Linear issue in the Shotloom team using the Bravo project and repo issue-authoring policy
argument-hint: "<title> [--desc <description>] [--priority 0-4] [--label <label>] [--project <project>] [--parent <STL-XX>] [--milestone <name>] [--state <state>]"
allowed-tools: Read, AskUserQuestion
---

# Shotloom Linear Create Issue

Create a new Linear issue in the `Shotloom` team.

## Reference

Read `agent/document-templates/linear/shotloom-issue.md` before
creating or reshaping the issue.

## Arguments

$ARGUMENTS

If no argument is provided, show usage and ask the user. Never auto-execute.

```text
Usage: /shotloom-linear-create-issue <title> [options]

Options:
  --desc <description>    Issue description
  --priority <0-4>        0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  --label <label>         Label name; repeat for multiple labels
  --project <project>     Project name; default: "Shotloom - bravo"
  --parent <STL-XX>       Parent issue identifier
  --milestone <name>      Project milestone name
  --state <state>         Backlog / Todo / In Progress / Done
  --team <team>           Override team; default: Shotloom
  --assignee <user>       Override assignee; default: me
  --reuse <STL-XX>        Reuse an existing issue identifier
  --no-reuse              Skip reusable issue search
```

## Workflow

1. Read the reference file and Shotloom repo source-of-truth files listed there.
2. Parse title and optional flags from `$ARGUMENTS`.
3. If `--reuse STL-XX` is present, update that issue instead of creating a new
   issue.
4. If `--no-reuse` is absent, search reusable abandoned issues:
   - creator or assignee is me;
   - state is `Canceled`, `Backlog`, or `Duplicate` when available;
   - `updatedAt` is older than 30 days.
5. If reusable candidates exist, show candidates and ask whether to reuse one or
   create a new issue.
6. Shape the body with the template in the reference file.
7. Preview the exact title, body, project, priority, labels, state, parent, and
   milestone.
8. Wait for user confirmation before creating or updating the issue.
9. Use the available Linear `save_issue` tool.
10. Report the created or reused issue identifier and URL.

## Reuse Preview

```markdown
Reusable STL numbers:

| STL | Old title | State | Updated | Similarity |
|-----|-----------|-------|---------|------------|
| STL-55 | "early retarget spike" | Canceled | 90d ago | 42% |

Options:
- Reuse STL-55: rename, reset body, move to target state.
- Create a new STL issue.
```
