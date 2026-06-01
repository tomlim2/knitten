---
name: ah-review-implementation
description: Review an AH implementation diff against its expected contract and report blockers, nits, validation gaps, and residual risk.
---

# AH Review Implementation

Use this leaf skill when reviewing changed code, docs, scripts, or plugin files.

## Input

- Implementation diff or changed files.
- Expected contract, spec, or user request.

## Output

- Findings first.
- Severity and rationale.
- Ready or blocked state.
- Residual risk.

## Review Lens

Check:

- contract satisfaction
- behavior regressions
- missing validation
- stale references or dead contracts
- naming clarity
- unnecessary dependencies

Do not summarize before findings. If no issues are found, say so directly.

## Path Handling

Review diffs and files in the active workspace unless the user explicitly gives
a plugin file path. When roots are unclear, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-review-implementation --name=<task-name> --create
```
