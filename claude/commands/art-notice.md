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
Usage: /art-notice <message>
Example: /art-notice New build is ready!
```

## Execution

Run the art notice sender script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\art-notice\send_notice.py" $ARGUMENTS
```
