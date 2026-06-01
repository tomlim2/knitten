---
name: ah-apply-review-fixes
description: Apply accepted AH review findings to a target artifact or implementation, prioritizing blockers and keeping nits bounded.
---

# AH Apply Review Fixes

Use this leaf skill when the input is review findings that the user has accepted
or asked to fix.

## Input

- Findings.
- Target artifact or files.
- Accepted action for each finding when known.

## Output

- Fix summary.
- Updated artifact or changed files.
- Validation results.
- Deferred findings, if any.

## Steps

1. Classify findings as blocker, nit, question, or defer.
2. Fix blockers first.
3. Fix cheap local nits only after blockers are gone.
4. Do not expand scope beyond the finding.
5. Validate the changed surface.

## Path Handling

Apply fixes to paths in the active workspace. If a finding references a plugin
resource, resolve the plugin root separately before editing. When roots are
unclear, run:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs
```
