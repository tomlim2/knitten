---
load: auto
---

- **Secrets** — use environment variables, NEVER store in this folder
- **Documentation language** — Operational docs (skill `SKILL.md`, rule `rules/*.md`, standard `standards/*.md`, command `commands/*.md`) are **English only**. Reason: LLM tokenizers are more efficient on English; Korean burns more tokens for the same content, and operational docs are read on every cold-start.
  - Doc prose (descriptions, explanations) is English.
  - Data examples stay in native form when the data is intrinsically Korean (UI copy, file names, tag aliases, channel names, user-input keywords). The doc *describing* the data is English; the data itself stays as-is.
  - Human-facing artifacts (Obsidian vault notes — devlogs, journals, learnings, project days) may be CJK. The vault is for human recall, not LLM operation.
  - Conversation with the user uses any language the user writes in.
