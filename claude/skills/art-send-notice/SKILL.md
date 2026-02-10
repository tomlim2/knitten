# art-send-notice

**Version:** 0.3.0

Send messages to Slack art channel.

---

## Changelog

- **0.3.0** - Migrate to MCP server (`art`). Python script removed, uses `slack_post_message()` tool directly
- **0.2.0** - Use shared config location (`~/.claude/config/`)
- **0.1.0** - Initial release

---

## Purpose

Send formatted messages to the Slack art channel for team communication about art branch operations.

---

## 사용법

```
/art-send-notice "메시지 내용"
```

## 설정

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `bot_username`

## 구현

MCP 서버 `art`의 `slack_post_message()` 도구로 직접 호출.

## 파일 구조

```
art-send-notice/
└── SKILL.md    # 이 문서
```
