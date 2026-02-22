---
description: "Send messages to Slack art channel. Use when communicating art branch updates to the team."
disable-model-invocation: true
---

# cocv-art-send-notice

Send messages to Slack art channel.

## Purpose

Send formatted messages to the Slack art channel for team communication about art branch operations.

---

## Usage

```
/cocv-art-send-notice "message content"
```

## Configuration

- `~/.claude/config/.env` → `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` → `art_channel`, `bot_username`

## Implementation

Uses MCP server `cocv`'s `slack_post_message()` tool for direct invocation.

## Files

```
cocv-art-send-notice/
└── SKILL.md    # This document
```
