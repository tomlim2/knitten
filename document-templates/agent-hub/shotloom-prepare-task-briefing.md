---
status: accepted
---

# Shotloom Prepare Task Briefing Template

Use this template for the user-facing briefing emitted by
`/shotloom-prepare-task` after the Ready briefing and reviewed spec are prepared
but before implementation starts.

- This is an internal-consumption template.
- The briefing is a decision aid, not an implementation artifact.
- Fill it from the reviewed spec, planning manifest, Ready briefing, and
  review-gate notes only.
- The template is written in English for maintainability. Render the final
  user-facing chat briefing in Korean.

## Generated Body

```markdown
## Preparation Complete Briefing

Short summary:
- <1-3 bullets>

Overall assessment:
- <overall judgment and main risk/benefit>

Strengths:
- <why this plan is good, low-risk, or easy to review>

Weaknesses / risks:
- <known trade-offs, blockers, or uncertainty>

Estimated change size:
- LOC: <range, confidence, why>
- Main files / areas: <areas>
- Test / docs impact: <expected tests/docs or none>

PR size judgment:
- Enough for one PR: <yes|borderline|no>
- Reason: <scope coupling, review size, deployment/test boundaries>
- Suggested split: <only if borderline/no>

New terms / concepts:
- <term>: <short meaning and where it appears>

Paths:
- Ready briefing: <path>
- Reviewed spec: <path>
- Planning manifest: <path>
- Remaining P3/nit: <none|notes>
```

## Fill Rules

- Keep the final Korean briefing compact enough to scan.
- Translate section labels naturally when rendering to the user; do not expose
  the English template headings unless the user asks for the raw template.
- Do not invent implementation facts that are not in the prepared artifacts.
- Label uncertain LOC as an estimate and explain the reason.
- Treat LOC as one signal, not the PR-size gate by itself.
- Prefer one PR only when the work is cohesive, reviewable, and testable as one
  change.
- Recommend splitting when the spec has independent behavior slices, unrelated
  ownership surfaces, risky migrations, broad docs-only cleanup, or review
  burden that would obscure the main implementation.
- Define new terms and concepts only when they matter for implementation or
  review.
