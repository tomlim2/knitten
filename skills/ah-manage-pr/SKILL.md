---
name: ah-manage-pr
description: Manage generic AH pull request work, including PR creation, review, response, check waiting, and merge coordination when explicitly requested.
---

# AH Manage PR

Use this umbrella skill when the user asks to create, review, respond to, watch,
or merge a pull request.

## Input

- Current branch and reviewed implementation state.
- PR number or URL when responding or reviewing.

## Output

- PR URL or PR state.
- Review/response summary.
- Merge result or blocker.

## Flow

1. Use `ah-create-pr` when the user asks to open a PR.
2. Use `ah-review-pr` when the user asks to review a PR.
3. Use `ah-respond-pr` when the user asks to handle review comments.
4. Use `ah-implement-work` for code or doc fixes from PR feedback.
5. Re-request review, wait for checks, or merge only when requested.

## Rules

- Do not create or merge a PR without explicit user request.
- Preserve repository-specific PR conventions.
- Treat GitHub review comments by content, not by author type.

## Path Handling

Run git and PR commands from the active workspace repository. Do not use the
plugin install path unless the PR is for the plugin itself.
