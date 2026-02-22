---
description: "Send merge notification as thread reply to art branch announcement. Use after preparing an art branch merge."
disable-model-invocation: true
---

# cocv-art-send-merge-notice

Send merge notification as a threaded reply to an art branch announcement.

## Purpose

When an art branch is ready to be merged into develop, this skill sends a threaded reply to the original branch announcement on Slack.

## Usage

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

## Implementation

Uses `send.py` script for direct Slack API delivery.

```bash
# Send
python ~/.claude/skills/cocv-art-send-merge-notice/send.py art/art-main-1.5.0-r3 --time "tomorrow 8:30 AM"

# Preview
python ~/.claude/skills/cocv-art-send-merge-notice/send.py art/art-main-1.5.0-r3 --time "tomorrow 8:30 AM" --dry-run

# List branches
python ~/.claude/skills/cocv-art-send-merge-notice/send.py --list
```

## Configuration

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/private/slack_threads.json` → Per-branch thread info

## Files

```
cocv-art-send-merge-notice/
├── SKILL.md    # This document
└── send.py     # Slack API delivery script
```
