---
allowed-tools: Bash(python:*)
description: Send message to Slack art channel
argument-hint: "<message>"
---

# Send Art Notice

슬랙 아트 채널에 메시지를 전송합니다.

## 사용법

**If $ARGUMENTS is empty, stop immediately and show:**
```
Usage: /send-art-notice <message>
Example: /send-art-notice 새 빌드가 준비되었습니다!
```

## 실행

Run the art notice sender script:

```bash
python "C:\Users\TA_yeonsu\.claude\skills\send-art-notice\send_notice.py" $ARGUMENTS
```
