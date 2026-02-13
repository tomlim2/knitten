---
description: "Send merge notification as thread reply to art branch announcement. Use after preparing an art branch merge."
---

# cocv-art-send-merge-notice

Send merge notification as a threaded reply to an art branch announcement.

## Overview

When an art branch is ready to be merged into develop, this skill sends a threaded reply to the original branch announcement on Slack.

## 사용법

```
/cocv-art-send-merge-notice <branch_name>
/cocv-art-send-merge-notice --list
```

## Message Format

```
{merge_time}에 `{branch_name}` 브렌치를 디벨롭에 합칠 예정입니다.

그 전에 아래 작업을 완료해 주세요.
1. 리다이렉터 픽스업 (Fix Up Redirectors)
2. 변경사항 커밋, 푸시
3. 파일 잠금이 있다면 해제 (언락)
```

## Dependencies

- Requires `/cocv-art-create-branch` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`

## 구현

`send.py` 스크립트로 Slack API 직접 호출.

```bash
# 전송
python ~/.claude/skills/cocv-art-send-merge-notice/send.py art/art-main-1.5.0-r3 --time "내일 아침 8시 30분"

# 미리보기
python ~/.claude/skills/cocv-art-send-merge-notice/send.py art/art-main-1.5.0-r3 --time "내일 아침 8시 30분" --dry-run

# 브랜치 목록
python ~/.claude/skills/cocv-art-send-merge-notice/send.py --list
```

## 설정

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/private/slack_threads.json` → 브랜치별 스레드 정보

## 파일 구조

```
cocv-art-send-merge-notice/
├── SKILL.md    # 이 문서
└── send.py     # Slack API 전송 스크립트
```
