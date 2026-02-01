# Send Art Notice

슬랙 아트 채널에 메시지를 전송하는 스킬입니다.

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
