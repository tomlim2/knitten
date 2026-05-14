---
description: "MCP server for CINEV art branch Slack integration. Infrastructure service providing Slack tools."
disable-model-invocation: true
---

# cci-serve-mcp

MCP server for CINEV art branch Slack integration.

## Skill-owned standards

Read `references/CCI-SLACK.md` only when sending CINEV Slack messages, configuring channels, or updating Slack MCP behavior.

## Purpose

Provides MCP tools for Slack messaging and thread management used by art branch workflows. Replaces individual Python scripts in `cci-art-send-notice`, `cci-art-send-merge-notice`, `cci-art-send-merge-result`, and `cci-art-create-branch`.

---

## Tools

| Tool | Description |
|------|-------------|
| `slack_post_message` | Send message to art Slack channel (supports threads, broadcast) |
| `thread_save` | Save Slack thread metadata for a branch |
| `thread_get` | Get saved thread info for a branch |
| `thread_list` | List all branches with saved thread info |
| `get_art_config` | Return art workflow config (repo_path, channel, templates) |

---

## Configuration

- `~/.claude/config/.env` - `SLACK_BOT_TOKEN`
- `~/.claude/config/slack.json` - channel, bot_username, message templates
- `~/.claude/skills/cci-art-create-branch/config.json` - repo_path

---

## Registration

```bash
claude mcp add cci --scope user -- python ~/.claude/skills/cci-serve-mcp/server.py
```

---

## Files

- `server.py` - FastMCP server implementation
- `requirements.txt` - Python dependencies
