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
  create a fresh worktree even if another task worktree exists. Default branch type is `feat/`; use `--type fix|docs|chore` when clearer.
- **Lightweight branch exception** — In a worktree-first repo, small docs-only
  or CI/CD-only changes can use a feature branch in the primary checkout when
  `worktreePolicy.allowMainFeatureBranch: true`. Allowed scope: `.github/**`,
  PR templates, release notes, changelog entries, and narrow docs-only policy
  wording.
- **Worktree resumes** — Continue in the current task worktree when the user
  explicitly resumes that task from inside it. If the user names an existing
  worktree path or branch, run `git status --short --branch` there before
  editing. Ambiguous resume from the main checkout creates a new worktree.
- **Worktree cleanup** — After PR merge or explicit abandonment, run
  `node scripts/worktree-clean.mjs --merged` to inspect cleanup candidates.
  Deletion is explicit only: `--apply --yes` after user approval.
- **Knitten unused local worktree cleanup** — If the user says
  `니튼 미사용 로컬 워크트리 정리`, switch the Knitten checkout to `main`,
  inspect local worktrees, and remove only clean local worktree directories.
  Do not delete local branches or remote branches unless the user explicitly
  says branch cleanup or remote branch deletion. Use
  `node scripts/worktree-clean.mjs --local-only` for the dry run and
  `--local-only --apply --yes` only after approval.
- **No merge-time branch deletion** — Never pass `--delete-branch` to
  `gh pr merge`. Merge first; if cleanup was requested, run `git push origin --delete <branch>` and then the worktree cleanup flow.
- **Suggest PR after push** — In a worktree-first repo, when a write task has
  been committed and pushed, suggest opening a PR before handing off. Create
  the PR only when the user asks for it or has already requested publication
  through PR/merge. If a PR is created, record validation and objective review
  evidence in the PR body.
- **Main chore lane** — Load `main-chore-lane.md` before committing or pushing from the primary `main` checkout in a worktree-first repo.

PR-phase rules: `pr-mutate.md`, `pr-comment.md`, `pr-create.md`. Repo-specific overrides: `shotloom.md`, `cinev-git.md`.
