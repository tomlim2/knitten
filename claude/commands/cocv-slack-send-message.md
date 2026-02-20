---
description: Send a Slack message as my personal account via MCP
argument-hint: "<channel_name_or_id> <message>"
---

# Slack Send Message (Personal)

Send a Slack message as deemo (personal account) using Claude AI MCP Slack tools.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-slack-send-message`

## 사용법

**If $ARGUMENTS is empty, show usage and ask the user. NEVER auto-execute.**
```
Usage: /cocv-slack-send-message <channel_name_or_id> <message>
Example: /cocv-slack-send-message cinev-art "오늘 아트 리뷰 3시에 합니다"
Example: /cocv-slack-send-message C05CS9N5E69 "테스트 메시지"
```

## Arguments

$ARGUMENTS

- First argument: channel name or channel ID
- Remaining arguments: message content

## 채널 참조

자주 쓰는 채널 (`~/.claude/config/slack.json`):
- `art` or `cinev-art` → `C05CS9N5E69`

채널 이름이 주어지면 `slack_search_channels`로 ID를 찾는다.

## 실행

1. 채널 ID 확인 (이름이면 검색)
2. 보낼 메시지 내용을 사용자에게 보여주고 확인
3. 확인 후 `slack_send_message`로 전송
4. 전송 결과 (message link) 표시
