---
name: ah-review-pr
description: Review a generic AH pull request by inspecting PR diff, checks, comments, and readiness without mutating GitHub unless asked.
---

# AH Review PR

Use this leaf skill when the user asks to review a PR.

## Input

- PR URL or number.
- Repository context.

## Output

- PR findings or approval summary.
- Check status.
- Ready or blocked state.

## Steps

0. Review Eligibility Gate: before reading the diff, creating review worktrees,
   or preparing GitHub review payloads, confirm the active repository, PR number
   or URL, PR state, and reviewer authorization are appropriate for review.
   For PR review work, verify the active user is a requested reviewer or is
   otherwise explicitly authorized by the user before proceeding. If any of
   these are unclear, stop and ask.
1. Inspect PR metadata, changed files, checks, and discussion.
2. Review the diff against the expected task contract.
3. Treat comments by content, not author type.
4. Report findings first.

Do not post comments, request changes, approve, or merge unless explicitly asked.

## Path Handling

Use the active workspace repository to inspect PR context. Do not cache PR data
inside the plugin install path. For temporary PR review JSON, use:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-review-pr --name=pr-<number>-review --create
```
