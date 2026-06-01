---
load: triggered
trigger: about to call gh pr create
---

Verify all before requesting user approval to call `gh pr create`:

- Branch is pushed to remote, up to date with base, and has no uncommitted changes.
- Commit author identity matches the repo's expected identity (`git log -1 --format="%an <%ae>"`). For CINEV GitHub repos this is `tomlim2 <deemo@vonvon.me>`; for personal repos `tomlim2 <tomandlim@gmail.com>`.
- Local CI-equivalent gates pass: `cargo fmt --check`, `cargo clippy -- -D warnings`, `cargo test` (or repo-specific equivalents like `pnpm check:rust`), and any repo-specific validators (e.g., `node scripts/validate-doc-paths.mjs` in shotloom).
- Commit messages match the repo's commit guideline (CINEV repos use conventional commits per `docs/guidelines/commit-guideline.md`; check CONTRIBUTING for repo-specific rules).
- PR title and description match team conventions — sample 3–5 recent merged PRs in the same repo/team if unsure.
- Any referenced Linear/GitHub issues exist, are in the right project, and are cross-linked.
- If superseding a prior PR, the redirect comment and the prior PR number are prepared in the new PR description.
- PR body is written to a temporary markdown file and passed with
  `--body-file`. Do not put markdown containing backticks, command snippets, or
  `$...` text directly inside `--body "..."`; the shell can execute or expand
  it before `gh` receives the body.
- After creating or editing a PR body, read it back with
  `gh pr view <N> --json body` and verify code spans, validation commands, and
  issue links did not disappear.

**Repo-specific pre-PR rules take precedence over the generic checklist.** When the target repo has dedicated harness-side meta in `agent/rules/<repo>.md`, consult and satisfy it in addition to the bullets above.

Full reference: `~/.claude/skills/cci-manage-art-branch/references/CINEV-GIT-WORKFLOW.md`.
