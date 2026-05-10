---
title: "Day {{N}} ({{MM-DD}}): {{ONE_LINE_TITLE}}"
tags:
  - type/devlog
  - project/{{PROJECT}}
  # Code-bearing day → also lang/{{LANG}} + lib/{{LIB}} (mandatory).
  # Always: area/{{AREA}}.
  - lang/{{LANG}}
  - lib/{{LIB}}
  - area/{{AREA}}
date: {{YYYY-MM-DD}}
day: {{N}}
source: claude
---

# Day {{N}} ({{MM-DD}}): {{ONE_LINE_TITLE}}

### 왜

{{MOTIVATION_1_TO_3_SENTENCES}}

### 한 일

**{{SUBSECTION_TITLE}}**
- {{BULLET}} (코드 식별자는 `backtick`)

> [!tip] {{KEY_DISCOVERY_TITLE}}
> {{ONE_LINE_DESCRIPTION}}. See [[{{PROJECT}}/learnings-index#{{CONCEPT}}]]

> [!warning] {{FAILED_ATTEMPT_TITLE}}
> {{RESULT}}. #failed

### 배운 것

**{{LESSON_TITLE_BOLD}}** — {{ONE_LINE_DETAIL}}.

### 커밋 (선택)

| Hash | Message |
|------|---------|
| `{{SHORT_HASH}}` | {{COMMIT_SUBJECT}} |

### 상태 (선택)

| 항목 | 상태 | 비고 |
|------|------|------|
| {{FEATURE}} | ✅ / 🚧 / ❌ | {{NOTE}} |

<!--
LLM fill-in:
- Replace every {{ALL_CAPS}} placeholder. Delete sections that don't
  apply (don't leave placeholders behind).
- "한 일" must include the "왜" block above it.
- "커밋" / "상태" are optional. Drop entirely when empty.
- Frontmatter: lang/lib only when the day touched code; area/ always.
  Drop the comment line itself.
- Wikilinks use [[{{PROJECT}}/...]], never bare relative paths.
- Inline tags (#rule / #failed / #gotcha) live inside callout bodies
  only — never in frontmatter.
-->
