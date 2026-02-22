---
description: Send merge notice as thread reply to art branch announcement
argument-hint: "<branch_name> | --list"
allowed-tools: MCP(cocv)
---

# Art Merge Notice

Send a threaded reply to an art branch announcement notifying that the branch will be merged.
## Usage

```
/cocv-art-send-merge-notice <branch_name>
/cocv-art-send-merge-notice --list
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

## Options

- `<branch_name>` - Branch to send merge notice for
- `--list` - List available branches with saved thread info

## Execution

### If `--list`

Call `thread_list()` and display results.

### If `<branch_name>`

#### Step 1: Get thread info

```
thread_get(branch_name=$ARGUMENTS)
```

If `found: false`, show error and call `thread_list()` to display available branches.

#### Step 2: 실행 전 확인

**Before sending, show the user the Slack message and ask for confirmation:**

> **채널:** art 채널 (thread reply, broadcast)
> **메시지:**
> ```
> {branch_name} 아트 브렌치 디벨롭에 머지합니다.
>
> 반드시 리다이렉터 업데이트, 커밋, 푸시 및 언락 부탁드립니다!
> ```

Only proceed after user confirms.

#### Step 3: Send thread reply

Use the message template from `get_art_config()` → `art_merge_notice_message`, replacing `{branch_name}` with the actual branch name.

```
slack_post_message(text=<formatted message>, thread_ts=<ts from step 1>, broadcast=true)
```

## Example

```
/cocv-art-send-merge-notice art/art-main-1.5.0-r2
```
