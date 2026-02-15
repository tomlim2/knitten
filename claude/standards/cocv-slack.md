# cocv-slack

CINEV (cocv) Slack integration standard. All cocv skills that send Slack messages must follow this document.

---

## Bot Identity

- **Bot name:** 아트 아르리므
- **Token:** `SLACK_BOT_TOKEN` in `~/.claude/config/.env`
- **Scope required:** `chat:write.customize` (enables `username` parameter override)

### Channels

| Key | Channel ID | Description |
|-----|-----------|-------------|
| `ta_channel` | `C020ZF7RGH5` | TA팀 채널 |
| `art_channel` | `C05CS9N5E69` | 아트 채널 |
| `external_channel` | `C0A9AB6P77V` | 외부 프로젝트 채널 |

The `username` parameter in `chat.postMessage` is the only reliable way to control displayed bot name. Without `chat:write.customize` scope, the parameter is silently ignored.

---

## Config Files

### `~/.claude/config/.env`

```
SLACK_BOT_TOKEN=xoxb-...
```

Shared across all cocv Slack skills and the MCP server.

### `~/.claude/config/slack.json`

```json
{
  "art_channel": "C05CS9N5E69",
  "bot_username": "아트 아르리므",
  "art_notice_message": "...",
  "art_merge_notice_message": "...",
  "art_merge_result_message": "...",
  "art_merge_detail_message": "..."
}
```

Message templates use `{branch_name}`, `{details}` placeholders.

---

## Thread Management

### `~/.claude/private/slack_threads.json`

Maps branch names to their announcement thread:

```json
{
  "art/art-main-1.5.0-r3": {
    "channel": "C05CS9N5E69",
    "ts": "1738000000.000000",
    "created_at": "2026-02-01T10:00:00+09:00"
  }
}
```

- **Created by:** `cocv-art-create-branch` (via MCP `thread_save`)
- **Read by:** `cocv-art-send-merge-notice`, `cocv-art-send-merge-result` (via `send.py`)

---

## Merge Stats

### `~/.claude/private/art-merge-stats/<branch-slug>.json`

Saved by `cocv-art-send-merge-result` before sending messages. Korean PM-friendly summaries, no contributor info:

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

Filename: branch slug (e.g. `art-art-main-1.5.0-r3.json`).

---

## Skills Overview

| Skill | Role | Sends via |
|-------|------|-----------|
| `cocv-art-create-branch` | Create branch, send announcement, save thread | MCP `slack_post_message` + `thread_save` |
| `cocv-art-send-notice` | Send general messages to art channel | MCP `slack_post_message` |
| `cocv-art-send-merge-notice` | Send merge warning as thread reply | `send.py` |
| `cocv-art-send-merge-result` | Send merge completion + detail as thread replies | `send.py` |

---

## MCP Server

Registered as `cocv` MCP server:

```bash
claude mcp add cocv --scope user -- python ~/.claude/skills/cocv-serve-mcp/server.py
```

### Tools

| Tool | Description |
|------|-------------|
| `slack_post_message` | Post to art channel (supports threads, broadcast) |
| `thread_save` | Save thread metadata for a branch |
| `thread_get` | Get thread info for a branch |
| `thread_list` | List all branches with thread info |
| `get_art_config` | Return channel, bot_username, message templates |

---

## Rules

1. **Use `send.py` for threaded replies** — Skills with `send.py` (`cocv-art-send-merge-notice`, `cocv-art-send-merge-result`) MUST use their script. Direct API calls or MCP tools may miss thread context.

2. **Never use Claude AI Slack MCP tools** — Tools like `slack_send_message` from Claude AI's built-in Slack integration show "Sent via @Claude" and wrong sender identity. Always use `send.py` or the `cocv` MCP server.

3. **Dry-run before sending** — Always `--dry-run` first, show preview to user, get explicit approval, then send.

4. **File input for long messages** — Use `--file` flag for messages with Korean markdown. Avoids shell escaping issues.

5. **Save stats before sending** — `cocv-art-send-merge-result` must save merge stats to `private/art-merge-stats/` before any Slack delivery.
