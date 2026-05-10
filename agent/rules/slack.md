---
load: triggered
trigger: sending any Slack message
---

- **Confirm first** — ALWAYS show the full draft message and get explicit user approval before sending. One approval covers exactly one message.
- **Per-message approval** — Batched messages need batch approval with each draft visible.
- **No silent retries** — If a send fails, surface the error and ask, do not auto-retry.
