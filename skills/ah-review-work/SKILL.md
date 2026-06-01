---
name: ah-review-work
description: Review AH specs, design plans, implementation diffs, PR diffs, or skills with findings-first output and clear severity.
---

# AH Review Work

Use this umbrella skill when the user asks for a review of a spec, design plan,
implementation, PR, or skill.

## Input

- Spec/design plan, implementation diff, PR diff, or skill file.
- Explicit review lens when provided.

## Output

- Findings first.
- Severity and rationale.
- Ready, blocked, or needs another implementation pass.

## Flow

1. Use `ah-gather-references` only when extra context is needed.
2. Use `ah-review-spec` for specs and design plans.
3. Use `ah-review-implementation` for implementation diffs.
4. Use `ah-review-pr` for PR-level review.
5. Use `ah-audit-skill` for skill reviews.
6. Use `ah-report-finding` for recurring workflow or system issues.

## Rules

- Findings must cite a file, line, contract, command, or behavior.
- Distinguish blockers from nits.
- If no issues are found, say so and name residual risk.

## Path Handling

Review active workspace artifacts by default. Use plugin paths only for plugin
resources or plugin-focused reviews. When roots are unclear, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
