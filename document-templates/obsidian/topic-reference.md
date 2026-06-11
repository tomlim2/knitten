---
title: "{{TOPIC_TITLE}}"
tags:
  - type/reference
  - project/{{PROJECT}}
  - area/{{AREA}}
  # Add lang/{{LANG}} + lib/{{LIB}} when the topic is code-bearing.
  # Drop these two lines (and this comment) otherwise.
  - lang/{{LANG}}
  - lib/{{LIB}}
date: {{YYYY-MM-DD}}
source: agent
---

# {{TOPIC_TITLE}}

<!--
"리소스 / topic / resource" — a self-contained reference on ONE concept.
Pick the body shape that fits and DELETE the others. Do not keep multiple
shapes in one file.

Shape A — Reference (API/option list, command summary, term glossary)
  - Use a short intro + tables. No timeline.
  - Default sections: Summary · Reference · Examples · See also

Shape B — Decision (why X over Y)
  - Default sections: Context · Options · Decision · Consequences

Shape C — How-to (step-by-step procedure)
  - Default sections: Goal · Prerequisites · Steps · Verification · Troubleshooting

Shape D — Concept explainer (one idea, prose-leaning)
  - Default sections: Problem · Mechanism · Why it works · Caveats
-->

## {{SECTION_1}}

{{BODY}}

## {{SECTION_2}}

{{BODY}}

## See also

- [[{{PROJECT}}/learnings-index#{{CONCEPT}}]]
- [[{{PROJECT}}/days/day-{{NN}}]]

<!--
Tag rules:
- `type/reference` + project/{{PROJECT}} required by default.
- If the note is not a reference, replace `type/reference` with one of
  `type/analysis`, `type/spec`, `type/brief`, `type/note`, or `type/decision`.
- area/ recommended (game-dev / shader / web / hardware / writing / …).
- lang/ + lib/ ONLY when code-bearing. Both or neither.
- Max 5 tags total.

Filename: kebab-case, English. Example: vrm-spring-bone.md, audio-pipeline.md.
Cross-project topics: lives under projects/_cross-project/{{NAME}}.md
(graphics / web3d / unreal / slack / general) — use project tag
`project/cross-project`.
-->
