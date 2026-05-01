---
load: auto
---

Default-counter rules that must be in cold-start memory. The Claude Code system prompt biases the LLM toward each opposite default; these rules counter at intent-formation time, not after the fact.

- **No auto-push** — Commit only. Do NOT push unless the user explicitly says so. (Default: harness-trained to push after commit.)
- **No `Co-Authored-By: Claude`** — Do NOT add `Co-Authored-By` lines to commits. (Default: harness system prompt instructs adding it.)
- **Author identity** — Use `user.name=tomlim2`, `user.email=tomandlim@gmail.com` for personal repos. CINEV GitHub repos use `tomlim2 <deemo@vonvon.me>` (verify with `git log -1 --format="%an <%ae>"`). (Default: use whatever git config has.)

For PR-related rules see `~/.claude/rules/pr-mutate.md`, `pr-comment.md`, `pr-create.md` — each fires only when its phase begins. Repo-specific overrides: `shotloom.md`, `cinev-git.md`.
