# art-create-branch

**Version:** 0.4.0

Automated branch creation for CINEV art team.

## Changelog

- **0.4.0** - Migrate to MCP server (`art`). Python script removed, logic delegated to MCP tools + `Bash(git:*)`
- **0.3.0** - Fix git flow: fetch → ff develop → branch (no reset --hard)
- **0.2.0** - Use shared config location (`~/.claude/config/`)
- **0.1.0** - Initial release

## Purpose

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <새브랜치>` (develop에서 분기)
4. 소스 브랜치에서 지정 기간 커밋 체리픽 (선택)
   - 기간: 전주 금요일 08:00 KST ~ 이번주 월요일 08:00 KST
5. 푸시 후 Slack art 채널에 알림

## 사용법

```
/art-create-branch <새브랜치명> [소스브랜치명]
```

### 예시

```
/art-create-branch art/art-main-1.5.0-r1 art/art-main-1.5.0
/art-create-branch art/art-main-1.5.0-r1
```

## 설정

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → channel, message templates
- `config.json` → repo_path

## 컨플릭트 처리

체리픽 중 컨플릭트 발생 시 즉시 중단, 사용자에게 보고.

## 구현

MCP 서버 `art`에 위임. Git 작업은 `Bash(git:*)`, Slack은 `slack_post_message()`, 스레드 저장은 `thread_save()`.

## 파일 구조

```
art-create-branch/
├── SKILL.md       # 이 문서
└── config.json    # repo_path 설정
```
