---
allowed-tools: Bash(python:*)
description: Send message to Slack art channel
argument-hint: "<message>"
---

# Send Art Notice

Send a notification message to the Slack art channel.

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user for the message. NEVER auto-execute.**
```
Usage: /art-send-notice <message>
Example: /art-send-notice New build is ready!
```

## 실행 전 확인

**Before executing, show the user the Slack message that will be sent and ask for confirmation:**

> **채널:** art 채널
> **메시지:** `{the message from $ARGUMENTS}`

Only proceed after user confirms.

## Execution

Run the art notice sender script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\art-send-notice\send_notice.py" $ARGUMENTS
```
