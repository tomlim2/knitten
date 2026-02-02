# art-notice

**Version:** 0.2.0

Send messages to Slack art channel.

## Changelog

- **0.2.0** - Use shared config location (`~/.claude/config/`)
- **0.1.0** - Initial release

## 설정

1. `.env` 파일 생성:
```
SLACK_BOT_TOKEN=xoxb-your-token-here
```

2. `claude/config/slack.json`에 채널 ID 설정 (공용 설정)

## 사용법

```bash
python send_notice.py "메시지 내용"
```
