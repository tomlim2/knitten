---
description: "Send merge completion with Korean MR summary as thread reply. Use after completing an art branch merge."
---

# cocv-art-send-merge-result

Send merge completion notification with Korean MR summary as a thread reply.

## Overview

After an art branch is merged to develop, this skill sends two messages:
1. **Broadcast reply** — short completion notice visible in channel
2. **Thread-only reply** — detailed MR summary (changes only, no participants)

**MUST use `send.py`** for Slack delivery. Do NOT use Claude AI Slack MCP tools (`slack_send_message` etc.) — they show "Sent via @Claude" and wrong sender identity.

## Workflow

### Step 1: Load thread info

Read `~/.claude/private/slack_threads.json` for the target branch's channel and thread_ts.

### Step 2: Get MR description

Use the same commit analysis as `/cocv-art-prepare-merge` Step 6:

```bash
git log origin/develop..<branch> --no-merges --oneline
```

Categorize commits the same way (Art, Fix, Chore). This is the English MR description format used when creating the GitLab MR via `/mr develop`.

### Step 3: Translate to Korean PM-friendly summary

Convert the English MR description into Korean. PM들이 보기 편한 형태로:

- Category names: Art → 아트, Fix → 수정, Chore → 기타
- Summarize related commits into one line (don't list every commit)
- Use plain Korean, avoid git/technical jargon

Example output:
```
머지 내역

[아트]
- F_CL001 텍스처 및 머티리얼 업데이트
- 캐릭터 프리셋 추가 (5건)
- 레벨 라이팅 조정

[수정]
- 머티리얼 슬롯 이름 수정

[기타]
- 설정 파일 정리
```

Omit empty categories. No participant/contributor info needed.

### Step 4: Save merge stats

Save to `~/.claude/private/art-merge-stats/<branch-slug>.json`:

```json
{
  "branch": "art/art-main-1.5.0-r3",
  "merged_at": "2026-02-13",
  "total_commits": 37,
  "changes": {
    "art": ["F_CL001 텍스처 및 머티리얼 업데이트", "캐릭터 프리셋 추가 (5건)"],
    "fix": ["머티리얼 슬롯 이름 수정"],
    "chore": ["설정 파일 정리"]
  }
}
```

Use branch slug for filename (e.g. `art-art-main-1.5.0-r3.json`).

### Step 5: Send broadcast message

Write broadcast message to a tmp file, then send:

```bash
python ~/.claude/skills/cocv-art-send-merge-result/send.py <branch> --broadcast --file broadcast.txt
```

Message format:
```
`<branch>` 디벨롭 머지 완료되었습니다.
```

Use `--dry-run` first to preview. Send only after user approval.

### Step 6: Send thread-only detail

Write the Korean PM-friendly summary from Step 3 to a tmp file, then send:

```bash
python ~/.claude/skills/cocv-art-send-merge-result/send.py <branch> --file detail.txt
```

Use `--dry-run` first to preview. Send only after user approval.

## send.py Usage

```
# List branches
python send.py --list

# Dry run (broadcast)
python send.py art/art-main-1.5.0-r3 --broadcast --file msg.txt --dry-run

# Dry run (thread-only)
python send.py art/art-main-1.5.0-r3 --file msg.txt --dry-run

# Send for real
python send.py art/art-main-1.5.0-r3 --broadcast --file msg.txt
python send.py art/art-main-1.5.0-r3 --file msg.txt
```

## Key Rules

- **Always `--dry-run` first**, show preview, get user approval, then send
- **Always use `--file`** for message input (handles long Korean markdown)
- **Never use Claude AI Slack MCP tools** — use `send.py` only
- **Save stats before sending** — merge stats in `private/art-merge-stats/`

## Dependencies

- Requires `/cocv-art-create-branch` to be run first (saves thread info)
- Thread info stored in `~/.claude/private/slack_threads.json`
- Bot token in `~/.claude/config/.env` as `SLACK_BOT_TOKEN`

## Files

```
cocv-art-send-merge-result/
├── SKILL.md    # This document
└── send.py     # Slack API direct-call script
```
