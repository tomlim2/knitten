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

Findings first. If no issues are found, say so and name residual risk.

## Path Handling

Audit the skill path supplied by the user. If only a skill name is supplied,
resolve it from the active workspace first, then from the plugin root when the
workspace does not contain it. When roots are unclear, run:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs
```
