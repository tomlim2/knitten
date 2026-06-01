---
name: ah-add-design-plan
description: Add an implementation design plan to an AH spec, including touched surfaces, sequence, validation, and rollback or cleanup notes when useful.
---

# AH Add Design Plan

Use this leaf skill when a spec needs an implementation plan before coding.

## Input

- Reviewed or draft spec.
- Repository context when needed.

## Output

- Design plan.
- Touched surfaces.
- Implementation sequence.
- Validation plan.

## Steps

1. Identify files, scripts, docs, or commands likely to change.
2. Split implementation into small ordered steps.
3. Name validation commands or manual checks.
4. Note rollback, cleanup, or migration concerns only when relevant.

## Path Handling

Plan target files relative to the active workspace. When writing a separate
design-plan file and no workspace convention exists, use:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-add-design-plan --name=<task-name> --create
```

Do not plan user outputs inside the plugin install path.
