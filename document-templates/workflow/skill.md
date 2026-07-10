---
status: accepted
---

# Skill Template

Use this as the official recommended Markdown shape for production Knitten
skills.

## Generated Body

```markdown
---
name: <skill-name>
description: <one sentence trigger-facing summary>
match-check: <loose|normal|strict>
---

# <skill-name>

Use for: <one specific request shape>.

## Step 0: Match Check

- Confirm the request matches, required input is present, and the target is known.
- Keep required mutation and approval gates visible here.
- Stop when the target, scope, or authority is unclear.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), then execute the matched workflow.
```

## Fill Rules

- Keep the description trigger-facing and short.
- Choose `loose`, `normal`, or `strict` from `docs/guidelines/skill-match-check.md`.
- Keep mutation, approval, and stop conditions in the active `SKILL.md`.
- Prefer output ids over repeated path/template prose when an output contract exists.
- Put workflow steps, schemas, examples, and command recipes in the post-match reference.
- Keep HTML-like structure out of this official template.
