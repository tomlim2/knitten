---
description: "Create art branch from develop with cherry-picked commits. Use at the start of weekly CINEV art integration."
---

# cocv-art-create-branch

Automated branch creation for CINEV art team.

## Purpose

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <새브랜치>` (develop에서 분기)
4. 소스 브랜치에서 지정 기간 커밋 체리픽 (선택)
   - 기간: 전주 금요일 08:00 KST ~ 이번주 월요일 08:00 KST
5. 푸시 후 Slack art 채널에 알림

## 사용법

```
/cocv-art-create-branch <새브랜치명> [소스브랜치명]
```

### 예시

```
/cocv-art-create-branch art/art-main-1.5.0-r1 art/art-main-1.5.0
/cocv-art-create-branch art/art-main-1.5.0-r1
```

## 설정

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `art_new_branch_message`
- `config.json` → repo_path

## 컨플릭트 처리

체리픽 중 컨플릭트 발생 시 즉시 중단, 사용자에게 보고.

## Slack 전송 규칙

**MUST use `send.py`** for Slack delivery. Do NOT use Claude AI Slack MCP tools (`slack_send_message` etc.) — they show "Sent via @Claude" and wrong sender identity.

### 전송 절차

1. `--dry-run`으로 미리보기
2. 사용자 확인 후 실제 전송
3. 전송 후 스레드 정보 자동 저장 (`~/.claude/private/slack_threads.json`)

```bash
# 미리보기
python ~/.claude/skills/cocv-art-create-branch/send.py art/art-main-1.5.0-r4 --dry-run

# 실제 전송
python ~/.claude/skills/cocv-art-create-branch/send.py art/art-main-1.5.0-r4
```

### 스레드 정보

전송 후 `slack_threads.json`에 저장되어 후속 스킬에서 사용:
- `cocv-art-send-merge-notice` — 머지 사전 공지 (스레드 답글)
- `cocv-art-send-merge-result` — 머지 완료 알림 (스레드 답글)

## 파일 구조

```
cocv-art-create-branch/
├── SKILL.md       # 이 문서
├── config.json    # repo_path 설정
└── send.py        # Slack API 직접 전송 + 스레드 정보 저장
```
