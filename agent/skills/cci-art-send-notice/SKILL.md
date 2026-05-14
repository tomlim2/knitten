---
description: "Send messages to Slack art channel. Use when communicating art branch updates to the team."
disable-model-invocation: true
---

# cci-art-send-notice

Send messages to Slack art channel.

## Skill-owned standards

Read `~/.claude/skills/cci-serve-mcp/references/CCI-SLACK.md` only when changing Slack channel, token, username, or message delivery behavior.

## Purpose

Send formatted messages to the Slack art channel for team communication about art branch operations.

---

## Usage

```
/cci-art-send-notice "message content"
```

## Configuration

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `bot_username`

## Implementation

Uses MCP server `cci`'s `slack_post_message()` tool for direct invocation.

## Files

```
cci-art-send-notice/
└── SKILL.md    # This document
```
