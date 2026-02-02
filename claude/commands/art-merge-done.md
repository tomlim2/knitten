---
allowed-tools: Bash(python:*)
description: Check merge status and send completion notifications
argument-hint: "<branch_name> | --list"
---

# Art Merge Done

Check if an art branch was merged to develop and send completion notifications as thread replies.

## Usage

```
/art-merge-done <branch_name>
/art-merge-done --list
```

## Execute

Run the merge done script:

```bash
cd ~/.claude/skills/art-merge-done && python merge_done.py $ARGUMENTS
```

## Options

- `<branch_name>` - Branch to check merge status for
- `--list` - List available branches with saved thread info

## Example

```
/art-merge-done art/art-main-1.5.0-r2
```

## What It Does

1. Checks if the branch was merged to develop this week
2. If merged, sends thread reply: "디벨롭에 머지 완료되었습니다!"
3. Sends second thread reply with merge details
