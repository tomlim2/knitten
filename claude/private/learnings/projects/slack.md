# Slack Learnings

Project-specific wisdom for Slack integration.

## Conventions

### 2026-02-02: Shared Slack Config Location
모든 Slack 관련 스킬/도구는 `~/.claude/config/`의 공유 설정을 사용:
- `.env` - `SLACK_BOT_TOKEN`, `SLACK_CHANNEL`
- `slack.json` - `bot_username`, `art_channel`, 메시지 템플릿

## What Worked

### 2026-02-02: Custom Bot Username via API Parameter
Slack API `chat.postMessage`에서 `username` 파라미터로 봇 이름 커스터마이즈:

```python
payload = {
    "channel": channel,
    "text": message,
    "username": "아트 아르리므",  # 커스텀 봇 이름
    "link_names": True,
}
```

**필요 권한:** `chat:write.customize` 스코프

Slack App 설정에서 추가:
1. api.slack.com/apps → 앱 선택
2. OAuth & Permissions → Bot Token Scopes
3. `chat:write.customize` 추가
4. Reinstall App

## What Failed

### 2026-02-02: Slack Display Name 변경 후 캐시 문제
Slack App 설정에서 Display Name을 변경해도 일부 사용자에게는 이전 이름이 계속 표시됨.
- **원인:** 서버 측 캐시
- **해결:** API `username` 파라미터로 명시적 오버라이드
- 또는 24-48시간 대기 (자동 캐시 갱신)

## Gotchas

### 2026-02-02: Bot Token vs Display Name
- **Default Name:** 코드에서 앱 생성 시 설정한 이름 (변경 불가)
- **Display Name:** Slack App 설정에서 변경 가능하지만 캐시 문제 있음
- **username 파라미터:** API 호출 시 즉시 반영되는 가장 확실한 방법

권한 없이 `username` 파라미터 사용하면 무시되고 Default Name으로 전송됨.
