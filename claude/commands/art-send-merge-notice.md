---
description: Send merge notice as thread reply to art branch announcement
argument-hint: "<branch_name> | --list"
allowed-tools: Bash(python:*)
---

# Art Merge Notice

Send a threaded reply to an art branch announcement notifying that the branch will be merged.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `art-send-merge-notice`

## Usage

```
/art-send-merge-notice <branch_name>
/art-send-merge-notice --list
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

## 실행 전 확인

**Before executing, show the user the Slack message that will be sent and ask for confirmation:**

> **채널:** art 채널 (thread reply, broadcast)
> **메시지:**
> ```
> {branch_name} 아트 브렌치 디벨롭에 머지합니다.
>
> 반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
> ```

Only proceed after user confirms.

## Execute

Run the merge notice script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\art-send-merge-notice\merge_notice.py" $ARGUMENTS
```

## Options

- `<branch_name>` - Branch to send merge notice for
- `--list` - List available branches with saved thread info

## Example

```
/art-send-merge-notice art/art-main-1.5.0-r2
```

## Message Sent

```
{branch_name} 아트 브렌치 디벨롭에 머지합니다.

반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
```
