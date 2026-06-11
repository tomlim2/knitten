---
title: "{{PROJECT}} 개발일지"
tags:
  - type/devlog
  - project/{{PROJECT}}
  - area/{{AREA}}
date: {{YYYY-MM-DD}}
source: agent
---

# {{PROJECT}} 개발일지

{{ONE_LINE_DESCRIPTION}}

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 시작일 | {{YYYY-MM-DD}} |
| 스택 | {{TECH_STACK}} |
| 목표 | {{GOAL}} |

---

## 현재 상태 ({{YYYY-MM-DD}} 기준)

| 기능 | 상태 | 비고 |
|------|------|------|
| {{FEATURE}} | ✅ / 🚧 / ❌ | {{NOTE}} |

---

## TODO

- [ ] {{TASK}}

---

## Day {{N}} ({{MM-DD}}): {{ONE_LINE_TITLE}}
- {{SUMMARY_1_OR_2_LINES}}
- 배운 것: {{KEY_LESSONS}}
- [[{{PROJECT}}/days/day-{{NN}}|상세]]

<!--
Hub is a *summary* file. Per-day detail lives in days/day-NN.md.
- Keep each day section to 3-4 lines max here; push detail to the day file.
- "현재 상태" / "TODO" sections live ONLY in hub. Don't duplicate them in day files.
- Append new days at the bottom (chronological).
- Frontmatter: type/devlog + project/ are required. area/ if the project
  has a clear domain (game-dev / shader / web / hardware / writing / …).
-->
