---
name: ah-audit-skill
description: Audit an AH skill for trigger clarity, purpose fit, input and output contract, dependency health, reference use, and implementation readiness.
---

# AH Audit Skill

Use this support leaf skill when reviewing a skill file or skill design.

## Input

- Skill path or skill name.
- Expected purpose or user concern when provided.

## Output

- Skill audit findings.
- Severity and rationale.
- Fix recommendations.

## Review Lens

Check:

- name and description trigger the right task
- purpose matches implementation
- input and output are clear
- references and scripts are necessary and available
- instructions are concise enough for regular use
- no legacy path, domain, or runtime dependency leaks into generic workflow
- `activation-check` is present or safely inferable
- Step 0 strictness matches the skill's mutation surface
- external mutation paths have explicit approval/stop conditions

Findings first. If no issues are found, say so and name residual risk.

## Activation Review

Use `docs/specs/skill-activation-check-policy.md` when auditing skill creation,
skill updates, allowed-tools changes, routers/orchestrators, or any skill that
can mutate external state.

Flag a finding when:

- a strict skill lacks an explicit Step 0 activation check,
- `allowed-tools` or workflow text enables external mutation but activation is not
  declared or inferable,
- a router can call strict leaves without inheriting their activation check,
- a skill update adds mutation behavior without revisiting activation-check.

## Path Handling

Audit the skill path supplied by the user. If only a skill name is supplied,
resolve it from the active workspace first, then from the plugin root when the
workspace does not contain it. When roots are unclear, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
