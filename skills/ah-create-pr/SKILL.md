---
name: ah-create-pr
description: Create a generic AH pull request from a reviewed branch, preserving repository conventions and reporting the PR URL and summary.
---

# AH Create PR

Use this leaf skill only when the user explicitly asks to create a PR.

## Input

- Reviewed branch.
- Repository remote.
- PR title/body context.

## Output

- PR URL.
- PR title and summary.
- Check or push blockers, if any.

## Steps

1. Confirm the working tree state.
2. Push the current branch when needed.
3. Create the PR using repository conventions.
4. Report the PR URL and any checks already known.

Do not merge the PR from this skill.

## Path Handling

Create the PR from the active workspace repository, not from the plugin install
path unless the plugin itself is the target repository. When roots are unclear,
run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
