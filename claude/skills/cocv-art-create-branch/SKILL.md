---
description: "Create art branch from develop with cherry-picked commits. Use at the start of weekly CINEV art integration."
---

# cocv-art-create-branch

Automated branch creation for CINEV art team.

## Purpose

1. `git fetch --all`
2. `git checkout -b <new_branch> origin/develop` (remote develop 기반, 로컬 develop 사용 금지)
3. Cherry-pick commits from `current` branch (art-branches.json) for the specified period
   - Period: Previous Friday 08:00 KST ~ This Monday 08:00 KST
4. Push new branch
5. Delete previous art branch from remote (`git push origin --delete <current_branch>`)
   - 삭제 전 유저 확인 필수
   - `current` branch의 잔여 커밋(merge branch tip 이후)이 있으면 먼저 체리픽
6. Send notification to Slack art channel

## Usage

```
/cocv-art-create-branch [new_branch_name]
```

- Branch name is optional. If omitted, auto-suggest the next name by incrementing the `current` branch's revision number (e.g., `r4` → `r5`)
- Cherry-pick source is always the `current` branch from `art-branches.json`

### Auto-naming

Parse `current` branch name and increment the `-rN` suffix:
- `art/art-main-1.5.0-r4` → suggest `art/art-main-1.5.0-r5`
- `art/art-main-1.5.0-r9` → suggest `art/art-main-1.5.0-r10`

Show suggested name and ask user to confirm or override.

### Examples

```
/cocv-art-create-branch                           # auto-suggest: art/art-main-1.5.0-r5
/cocv-art-create-branch art/art-main-1.5.0-r5     # explicit name
```

## Branch History

Art branch history is stored in `~/.claude/private/art-branches.json`.

**Read before execution:** check `current` to show the user the previous branch name.

**Update after execution:** when a new branch is successfully created and pushed:
1. Set `current` to the new branch name
2. Append the new branch to `history` array

```json
{
  "current": "art/art-main-1.5.0-r4",
  "history": [
    {
      "branch": "art/art-main-1.5.0-r4",
      "created_at": "2026-02-17",
      "merge_branch": "art/merge/art-main-1.5.0-r4",
      "merge_branch_head": "...",
      "merge_created_at": "..."
    }
  ]
}
```

`merge_branch`, `merge_branch_head`, `merge_created_at` fields are populated later by merge skills.

## Configuration

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `art_new_branch_message`
- `config.json` → repo_path
- `~/.claude/private/art-branches.json` → branch history

## Conflict Handling

If a conflict occurs during cherry-pick, stop immediately and report to the user.

## Slack Delivery Rules

**MUST use `send.py`** for Slack delivery. Do NOT use Claude AI Slack MCP tools (`slack_send_message` etc.) — they show "Sent via @Claude" and wrong sender identity.

### Delivery Procedure

1. Preview with `--dry-run`
2. Send after user confirmation
3. Thread info auto-saved to `~/.claude/private/slack_threads.json`

```bash
# Preview
python ~/.claude/skills/cocv-art-create-branch/send.py art/art-main-1.5.0-r4 --dry-run

# Send
python ~/.claude/skills/cocv-art-create-branch/send.py art/art-main-1.5.0-r4
```

### Thread Info

Saved to `slack_threads.json` after delivery for use by follow-up skills:
- `cocv-art-send-merge-notice` — Pre-merge notification (thread reply)
- `cocv-art-send-merge-result` — Merge completion notification (thread reply)

## Files

```
cocv-art-create-branch/
├── SKILL.md       # This document
├── config.json    # repo_path configuration
├── config.json.example  # Example configuration
└── send.py        # Slack API direct delivery + thread info storage
```
