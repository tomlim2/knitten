---
load: auto
---

Default-counter rules. The harness biases toward each opposite; these counter at intent-formation time.

- **No auto-push** — Commit only. Do NOT push unless explicitly asked.
- **No `Co-Authored-By: Claude`** — Do NOT add `Co-Authored-By` lines to commits.
- **Author identity** — Personal repos: `user.name=tomlim2`, `user.email=tomandlim@gmail.com`. CINEV repos: `tomlim2 <deemo@vonvon.me>`. Verify with `git log -1 --format="%an <%ae>"`.

PR-phase rules: `pr-mutate.md`, `pr-comment.md`, `pr-create.md`. Repo-specific overrides: `shotloom.md`, `cinev-git.md`.
