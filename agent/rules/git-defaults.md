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
- **Worktree resumes** — Continue in the current task worktree when the user
  explicitly resumes that task from inside it. If the user names an existing
  worktree path or branch, run `git status --short --branch` there before
  editing. Ambiguous resume from the main checkout creates a new worktree.
- **Worktree cleanup** — After PR merge or explicit abandonment, run
  `node scripts/worktree-clean.mjs --merged` to inspect cleanup candidates.
  Deletion is explicit only: `--apply --yes` after user approval.

PR-phase rules: `pr-mutate.md`, `pr-comment.md`, `pr-create.md`. Repo-specific overrides: `shotloom.md`, `cinev-git.md`.
