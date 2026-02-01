---
allowed-tools: Bash(python:*)
description: Send message to Slack art channel
argument-hint: "<message>"
---

# Send Art Notice

Send a notification message to the Slack art channel.

## Arguments

$ARGUMENTS

**If no argument is provided, stop immediately and show:**
```
Usage: /send-art-notice <message>
Example: /send-art-notice New build is ready!
```

## Execution

Run the art notice sender script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\send-art-notice\send_notice.py" $ARGUMENTS
```
