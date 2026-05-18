---
load: auto
---

Default-counter rules. The harness biases toward each opposite; these counter at intent-formation time.

- **No auto-push** — Commit only. Do NOT push unless explicitly asked.
- **No `Co-Authored-By: Claude`** — Do NOT add `Co-Authored-By` lines to commits.
- **Author identity** — Personal repos: `user.name=tomlim2`, `user.email=tomandlim@gmail.com`. CINEV repos: `tomlim2 <deemo@vonvon.me>`. Verify with `git log -1 --format="%an <%ae>"`.
- **Worktree-first repos** — For write-capable work in a repo whose machine
  repo config has `worktreePolicy.enabled: true`, start with
  `node scripts/worktree-start.mjs <task-slug>`. New write-capable requests
  create a fresh worktree even if another task worktree exists.
- **Lightweight branch exception** — In a worktree-first repo, small docs-only
  or CI/CD-only changes can use a feature branch in the primary checkout when
  `worktreePolicy.allowMainFeatureBranch: true`. Allowed scope: `.github/**`,
  PR templates, release notes, changelog entries, and narrow docs-only policy
  wording. Keep direct commits to `main` forbidden.
- **Worktree resumes** — Continue in the current task worktree when the user
  explicitly resumes that task from inside it. If the user names an existing
  worktree path or branch, run `git status --short --branch` there before
  editing. Ambiguous resume from the main checkout creates a new worktree.
- **Worktree cleanup** — After PR merge or explicit abandonment, run
  `node scripts/worktree-clean.mjs --merged` to inspect cleanup candidates.
  Deletion is explicit only: `--apply --yes` after user approval.
- **PR after push** — In a worktree-first repo, when a write task has been
  committed and pushed, create a PR before handing off unless the user
  explicitly says not to. Record validation and objective review evidence in
  the PR body.

PR-phase rules: `pr-mutate.md`, `pr-comment.md`, `pr-create.md`. Repo-specific overrides: `shotloom.md`, `cinev-git.md`.
