---
description: "Send messages to Slack art channel. Use when communicating art branch updates to the team."
---

# cocv-art-send-notice

Send messages to Slack art channel.

## Purpose

Send formatted messages to the Slack art channel for team communication about art branch operations.

---

## 사용법

```
/cocv-art-send-notice "메시지 내용"
```

## 설정

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `bot_username`

## 구현

MCP 서버 `cocv`의 `slack_post_message()` 도구로 직접 호출.

## 파일 구조

```
cocv-art-send-notice/
└── SKILL.md    # 이 문서
```
