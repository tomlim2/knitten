- **Commit only** — Do NOT auto-push unless explicitly requested
- **Author:** `user.name=tomlim2`, `user.email=tomandlim@gmail.com`
- **No Co-Authored-By** — Do NOT add `Co-Authored-By: Claude` lines
- **PR mutating actions require explicit per-PR user approval.** Each action is its own decision; prior approval does not carry over.

| Action | Requires approval | Notes |
|--------|-------------------|-------|
| Open PR (draft or ready) | Yes | Draft status does not exempt creation |
| Close PR | Yes | "Close and reopen later" still needs per-close approval |
| Reopen PR | Yes | Prior intent to reopen ≠ current approval to reopen |
| Force-push to branch with open PR | Yes | Invalidates review threads; may trigger reopen |
| `gh pr view` / `gh pr list` / web URL | No | Reading is not acting |
- **NEVER post any PR comment, review reply, or issue comment without showing the full draft text to the user first and getting explicit per-comment approval.** This covers `gh api .../comments`, `gh api .../reviews/*/comments`, `gh api .../pulls/*/comments/*/replies`, `gh pr comment`, `gh pr review --body`, and any equivalent API call. Draft the exact body, show it inline in the chat, wait for the user to read and say OK, then post. One approval covers exactly one comment — batches of replies need batch approval with each draft visible.
- **When responding to PR review feedback, reply inline on each individual review comment, not as a single top-level PR comment.** Use `gh api -X POST /repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies` so each reply threads under the reviewer's original comment. A top-level summary issue comment scatters context and makes it hard for the reviewer to confirm each item is addressed. Even when a reviewer posts a top-level review summary plus inline comments, reply on the inline comments — not on the summary.
- **Pre-PR-open checklist — verify all before requesting user approval to call `gh pr create`:**
  - Branch is pushed to remote, up to date with base, and has no uncommitted changes.
  - Commit author identity matches the repo's expected identity (`git log -1 --format="%an <%ae>"`). For CINEV GitHub repos this is `tomlim2 <deemo@vonvon.me>`; for personal repos `tomlim2 <tomandlim@gmail.com>`.
  - Local CI-equivalent gates pass: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` (or repo-specific equivalents like `pnpm check:rust`), and any repo-specific validators (e.g., `node scripts/validate-doc-paths.mjs` in shotloom).
  - Commit messages match the repo's commit guideline (CINEV repos use conventional commits per `docs/guidelines/commit-guideline.md`; check CONTRIBUTING for repo-specific rules).
  - PR title and description match team conventions — sample 3–5 recent merged PRs in the same repo/team if unsure.
  - Any referenced Linear/GitHub issues exist, are in the right project, and are cross-linked.
  - If superseding a prior PR, the redirect comment and the prior PR number are prepared in the new PR description.
- **Repo-specific pre-PR rules take precedence over the generic checklist.** When the target repo has dedicated Claude-side meta in `~/.claude/rules/<repo>.md`, consult and satisfy it in addition to the generic bullets above:
  - shotloom (CINEV/shotloom) → @~/.claude/rules/shotloom.md
- Full reference (Read on demand): `~/.claude/standards/cinev-git-workflow.md`
