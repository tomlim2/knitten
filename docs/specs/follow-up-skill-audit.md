# Knitten Core Follow-Up Skill Audit

## Status

Implemented.

## Goal

Audit the remaining Knitten Core workflow pilot skills after `implement` using the
durable skill audit checklist.

## Scope

Reviewed:

- `skills/draft-spec/SKILL.md`
- `skills/review/SKILL.md`
- `skills/review/references/triad.md`
- `skills/report-finding/SKILL.md`
- `skills/report-finding/references/flow.md`
- `docs/guidelines/skill-audit-checklist.md`

Out of scope:

- `log-usage`, `status`, and `review-fix-loop`.
- Automated validator promotion.
- Domain-plugin skills.

## Results

| Skill | Result | Notes |
|-------|--------|-------|
| `draft-spec` | No blocker | `match-check: normal` fits local spec/doc generation. Step 0 requires request fit, active workspace, durable spec location, and stops before implementation. Skill-specific match guidance is visible without loading unrelated references. |
| `review` | No blocker | `match-check: loose` fits read-only prepared-packet review. Step 0 requires source-cited packet, mode, readable base docs, and blocks mutation expectations before loading `references/triad.md`. |
| `report-finding` | No blocker | `match-check: normal` fits local finding-record creation. Step 0 requires a mechanically checkable failure, evidence or reproduction notes, and affected workflow/plugin/path before loading the storage flow. |

## Residual P3 Notes

- `draft-spec` is the largest Knitten Core skill body, but the inline skill-specific
  spec guidance is still part of match-time behavior and not a blocker.
- `report-finding` depends on the Knitten output resolver for storage naming;
  no separate validator promotion is recommended until the validator-promotion
  decision work is done.

## Validation

- `python3 <plugin-validator-path> .`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node scripts/measure-skill-exposure.mjs .`
- `git diff --check`
