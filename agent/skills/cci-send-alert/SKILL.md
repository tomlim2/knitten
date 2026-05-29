---
name: cci-send-alert
description: Send automated alerts to CINEV team Slack via Arnyang — CI status, PR updates, deploy alerts. Not the art channel.
argument-hint: "<message> [--thread-ts TS]"
allowed-tools: Read, Bash(python3:*), Bash(cci-send-alert:*)
disable-model-invocation: true
---

# cci-send-alert

Send automated alert messages to the CINEV team Slack channel via the Arnyang (아르리므) bot.

## Skill-owned standards

Read `agent/skills/cci-serve-mcp/references/CCI-SLACK.md` only when changing Slack channel, token, username, or message delivery behavior.

## Purpose

Deliver team-wide automated notifications (CI outcomes, PR state changes, deploy signals, scheduled reports) to the team Slack channel. This skill is **user-invocable only** — agents cannot auto-invoke it, and every send requires explicit per-message approval in the chat.

## Arguments

- `<message>` — Alert message body (required, wrap in quotes)
- `[--thread-ts TS]` — Optional Slack thread timestamp to reply in-thread

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage:

```
/cci-send-alert "<message>" [--thread-ts TS]
```

## Binding rules

- **Show the full message and target channel to the user before sending.** No exceptions.
- **Wait for explicit approval** in the chat. A prior approval does NOT carry over to new messages.
- **Never auto-send.** Even programmatic invocations must confirm.
- **Never include secrets** in the message body (tokens, passwords, private URLs).

## Configuration

| Key | File | Purpose |
|-----|------|---------|
| `SLACK_BOT_TOKEN` | `~/.config/cinev/.env` | Bot OAuth token (required) |
| `team_channel` | `agent/config/slack.json` | Target channel ID |
| `team_bot_username` | `agent/config/slack.json` | Bot display name |

## Workflow

### Step 1: Validate arguments

If `$ARGUMENTS` is empty, show usage and exit without sending.

### Step 2: Draft + show for approval

Print the full message body and the target channel (from `slack.json`) to the user. Wait for explicit approval.

### Step 3: Send

```bash
cci-send-alert "$MESSAGE" [--thread-ts "$TS"]
```

The script prints a JSON result to stdout. Exit code 0 on success, 1 on failure.

### Step 4: Report result

On success: print `ok: ts=<timestamp>`.
On failure: print the Slack API error verbatim (`not_in_channel`, `invalid_auth`, and similar).

## Related

- `cci-art-send-notice` — art channel sender (threaded branch updates)
- `agent/config/slack.json` — channel + bot username config
- `~/.config/cinev/.env` — bot token storage
