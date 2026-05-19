---
title: "{{ONE_LINE_TITLE}}"
tags:
  - type/learning
  - project/cross-project
  # Add lang/ + lib/ when the lesson is anchored to a specific
  # language/framework. Drop both (and this comment) when not.
  - lang/{{LANG}}
  - lib/{{LIB}}
  - area/{{AREA}}
date: {{YYYY-MM-DD}}
source: agent
---

# {{ONE_LINE_TITLE}}

{{ONE_PARAGRAPH_LEAD}}

---

## 증상

{{WHAT_WENT_WRONG_OR_WHAT_WAS_OBSERVED}}

## 원인

{{ROOT_CAUSE_WITH_EVIDENCE}}

## 검증

{{HOW_THE_HYPOTHESIS_WAS_CONFIRMED}}

## 해결

{{WHAT_FIXED_IT_AND_WHY_THAT_WORKS}}

## 부수 발견 (선택)

- {{ADJACENT_FACT_1}}
- {{ADJACENT_FACT_2}}

#rule {{ONE_LINE_RULE}}
#gotcha {{ONE_LINE_GOTCHA}}

<!--
Cross-project learning — one concept per file in the resolver-owned
cross-learning destination, using `learning-{{SLUG}}.md`.

Body shape: 증상 → 원인 → 검증 → 해결 (+ 부수 발견 when relevant).
Skip sections that don't apply for the kind of lesson:
  - Conceptual lesson (no incident)         → drop 증상 / 검증
  - Workflow / convention discovery         → drop 검증, keep 증상 + 원인 + 해결
  - Tool / API gotcha                       → keep all four
End with at least one #rule or #gotcha inline tag in the body. These are
the searchable anchors — don't move them to frontmatter.

Tag rules:
- type/learning + project/cross-project required.
- lang/ + lib/ when anchored to a language/framework. Both or neither.
- area/ describes the subject (observability, hooks, performance, build, …).
- Use sys/ or llm/ only when the lesson is anchored to a named tool or model
  listed in the taxonomy, and drop another optional tag to stay under 5 tags.
- Max 5 tags total — drop the least informative axis if you exceed.
-->
