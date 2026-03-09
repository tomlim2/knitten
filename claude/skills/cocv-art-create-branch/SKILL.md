---
description: "Create art branch from develop with cherry-picked commits. Use at the start of weekly CINEV art integration."
---

# cocv-art-create-branch

Automated branch creation for CINEV art team.

## Purpose

1. `git fetch --all`
2. `git checkout -b <new_branch> origin/develop` (remote develop 기반, 로컬 develop 사용 금지)
3. Cherry-pick remnant commits from `current` branch (see Cherry-Pick Logic below)
4. Push new branch
5. **[MANDATORY] Delete previous art branch from remote** — DO NOT skip this step
   - `git push origin --delete <current_branch>`
   - 삭제 전 유저 확인 필수
   - 삭제 후 art-branches.json에서 이전 브랜치 state → `archived`
6. Ask user for this week's emoji (see Weekly Emoji below)
7. Send notification to Slack art channel

**Execution order is strict: steps 1→7 must run sequentially. Do NOT skip step 5 to jump to Slack.**

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

## Cherry-Pick Logic

**CRITICAL: Do NOT cherry-pick by SHA diff from merge branch tip.** The merge branch is rebased, so SHAs differ from the original art branch commits. Using `merge_branch_head..origin/<art_branch>` will include commits already in develop and cause binary conflicts.

### Correct Procedure

1. Read `merge_created_at` from the current branch's history entry in `art-branches.json`
2. Find remnant commits by **date** — commits added AFTER the merge branch was created:
   ```bash
   git log origin/<current_art_branch> --oneline --after="<merge_created_at>" --reverse
   ```
3. Cherry-pick only these remnant commits (oldest first)
4. If no `merge_created_at` exists (branch was never merged), cherry-pick nothing — the new branch is already based on `origin/develop`

### Why date-based, not SHA-based

| Method | Result |
|--------|--------|
| `merge_branch_head..origin/<art_branch>` | Includes ALL original commits (rebased versions already in develop) → binary conflicts |
| `--after="<merge_created_at>"` | Only commits added after merge branch was cut → clean cherry-pick |

The merge branch rebases art commits onto develop, producing new SHAs. The originals remain on the art branch with different SHAs. Git can't tell they're the same content, so SHA-based diff gives false positives.

## Conflict Handling

If a conflict occurs during cherry-pick, stop immediately and report to the user.

## Weekly Emoji

Before sending the Slack announcement, ALWAYS ask the user for this week's emoji. Update `~/.claude/config/slack.json` → `weekly_emoji` field with the new value before sending.

Do NOT reuse the previous week's emoji without asking.

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
