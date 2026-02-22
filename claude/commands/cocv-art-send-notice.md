---
description: Send message to Slack art channel
argument-hint: "<message>"
allowed-tools: MCP(cocv)
---

# Send Art Notice

Send a notification message to the Slack art channel.
## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user for the message. NEVER auto-execute.**
```
Usage: /cocv-art-send-notice <message>
Example: /cocv-art-send-notice New build is ready!
```

## 실행 전 확인

**Before executing, show the user the Slack message that will be sent and ask for confirmation:**

> **채널:** art 채널
> **메시지:** `{the message from $ARGUMENTS}`

Only proceed after user confirms.

## Execution

Call the MCP tool:

```
slack_post_message(text=$ARGUMENTS)
```
