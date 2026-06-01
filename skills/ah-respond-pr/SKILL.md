---
name: ah-respond-pr
description: Plan responses to generic AH pull request review comments and post replies only when the user explicitly asks.
---

# AH Respond PR

Use this leaf skill when the user asks to respond to PR review comments.

## Input

- PR URL or number.
- Review comments.
- Accepted actions or implementation state.

## Output

- Response plan, or posted replies when explicitly requested.
- Fixed items.
- Deferred items and rationale.
- Re-review or next action.

## Steps

1. Gather review comments and current PR state.
2. Classify each item by content: fix, reply, defer, question, or informational.
3. Use `ah-implement-work` for code or doc fixes.
4. Post replies only when the user explicitly asked for GitHub mutation.
   Otherwise, output a response plan.
5. Report remaining review state.

## Path Handling

Use the active workspace repository for PR context and fixes. Do not store PR
response plans in the plugin install path. For a temporary JSON response plan,
use:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs --skill=ah-respond-pr --name=pr-<number>-response --create
```
