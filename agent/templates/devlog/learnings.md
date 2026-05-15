---
title: "{{PROJECT}} Learnings"
tags:
  - type/learning
  - project/{{PROJECT}}
  - area/{{AREA}}
date: {{YYYY-MM-DD}}
updated: {{YYYY-MM-DD}}
source: agent
---

# {{PROJECT}} Learnings

---

## What Worked

### {{CONCEPT_NAME}}

- **Date** — {{YYYY-MM-DD}}
- **Context** — {{SITUATION}}
- **Problem** — {{WHAT_WAS_THE_PROBLEM}}
- **Solution** — {{HOW_RESOLVED}}
- **Why it worked** — {{WHY_EFFECTIVE}}

> [!abstract] Rule
> {{GENERALIZED_LESSON}} #rule

---

## What Failed

### {{ATTEMPT_NAME}}

- **Date** — {{YYYY-MM-DD}}
- **Context** — {{SITUATION}}
- **Problem** — {{WHY_FAILED}}

> [!abstract] Rule
> {{WHAT_TO_AVOID_NEXT_TIME}} #rule

---

## Gotcha

### {{TRAP_NAME}}

- **Date** — {{YYYY-MM-DD}}
- **Context** — {{SITUATION}}
- **Problem** — {{NON_OBVIOUS_BEHAVIOR}}
- **Solution** — {{WORKAROUND_IF_ANY}}

> [!abstract] Rule
> {{WHAT_TO_REMEMBER}} #rule

<!--
Project-bound learnings index. One file per project, three sections,
append-only. Each entry = one ### subsection.
- The three ## headings stay even when empty (drop the example ### entry
  but keep the section header).
- Every entry MUST end with `> [!abstract] Rule` + inline #rule tag.
  That's the takeaway anyone (incl. future-you) skim-reads first.
- Update top-level `updated:` field on every append.
- Cross-project learnings use the flat shape instead — see
  agent/templates/devlog/cross-learning.md.
-->
