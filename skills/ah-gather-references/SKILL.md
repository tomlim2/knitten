---
name: ah-gather-references
description: Gather repository, issue, PR, document, or source references for generic AH development work and summarize why each reference matters.
---

# AH Gather References

Use this leaf skill when a task needs context before planning, reviewing, or
implementing.

## Input

- User request.
- Repository context, issue/PR/doc links, or named files when present.

## Output

- Reference list.
- Short relevance note for each reference.
- Missing context, if any.

## Steps

1. Read only the files and sources needed for the task.
2. Prefer repository files over broad searches when the answer is local.
3. Record each useful reference with its role in the task.
4. Note missing or stale context instead of pretending it is known.

When path roots are unclear, run:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs
```
