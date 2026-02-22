---
description: "Create art branch from develop with cherry-picked commits. Use at the start of weekly CINEV art integration."
---

# cocv-art-create-branch

Automated branch creation for CINEV art team.

## Purpose

1. `git fetch --all`
2. `git checkout develop && git pull --ff-only` (fast-forward)
3. `git checkout -b <new_branch>` (branch from develop)
4. Cherry-pick commits from source branch for the specified period (optional)
   - Period: Previous Friday 08:00 KST ~ This Monday 08:00 KST
5. Push and send notification to Slack art channel

## Usage

```
/cocv-art-create-branch <new_branch_name> [source_branch_name]
```

### Examples

```
/cocv-art-create-branch art/art-main-1.5.0-r1 art/art-main-1.5.0
/cocv-art-create-branch art/art-main-1.5.0-r1
```

## Configuration

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `art_new_branch_message`
- `config.json` → repo_path

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
