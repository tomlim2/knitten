---
load: triggered
trigger: about to post any PR / review / issue comment via gh
---

- **Show full draft + per-comment approval.** NEVER post without showing the exact body to the user first and getting explicit approval. Covers `gh api .../comments`, `gh api .../reviews/*/comments`, `gh api .../pulls/*/comments/*/replies`, `gh pr comment`, `gh pr review --body`, and any equivalent API call. One approval = one comment. Batched replies need batch approval with each draft visible.

- **Inline reply, not top-level summary.** When responding to PR review feedback, reply inline on each individual review comment — not as a single top-level PR comment. Use `gh api -X POST /repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies` so each reply threads under the reviewer's original comment. A top-level summary scatters context and makes it hard for the reviewer to confirm each item is addressed. Even when a reviewer posts a top-level review summary plus inline comments, reply on the inline comments — not on the summary.
