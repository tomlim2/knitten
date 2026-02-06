---
allowed-tools: Bash(python:*)
description: Check merge status and send completion notifications
argument-hint: "<branch_name> | --list"
---

# Art Send Merge Result

Check if an art branch was merged to develop and send completion notifications as thread replies.

## Usage

```
/art-send-merge-result <branch_name>
/art-send-merge-result --list
```

## 실행 전 확인

**Before executing, show the user the Slack messages that will be sent and ask for confirmation:**

> **채널:** art 채널 (thread reply)
> **메시지 1 (broadcast):** `디벨롭에 머지 완료되었습니다!`
> **메시지 2 (thread only):** 머지 내역 (커밋 목록)

Only proceed after user confirms.

## Execute

Run the merge done script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\art-send-merge-result\merge_done.py" $ARGUMENTS
```

## Options

- `<branch_name>` - Branch to check merge status for
- `--list` - List available branches with saved thread info

## Example

```
/art-send-merge-result art/art-main-1.5.0-r2
```

## What It Does

1. Checks if the branch was merged to develop this week
2. If merged, sends thread reply: "디벨롭에 머지 완료되었습니다!"
3. Sends second thread reply with merge details
