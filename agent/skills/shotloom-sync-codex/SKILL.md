---
description: Read/write .agent/handoff.md to coordinate with the Codex 돌쇠 agent on the same Shotloom worktree
argument-hint: "[read|write|append <msg>]"
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(date:*)
---

# shotloom-sync-codex

Shotloom has a dedicated Codex agent (돌쇠) that may operate on the same worktrees as Claude. To avoid stepping on each other and to hand off work cleanly, both agents read and append to a shared `.agent/handoff.md` file.

## Arguments

- `read` — read the current handoff state and summarize (default if no args).
- `write` — overwrite handoff.md with a fresh snapshot (use after major state change).
- `append <msg>` — append a new dated entry without touching prior content.

Usage:
- `/shotloom-sync-codex` → read
- `/shotloom-sync-codex append "finished retarget viewer removal, Codex please review commit bdf4c80"`
- `/shotloom-sync-codex write` → regenerate from current worktree + git state

## File location

Per the in-repo `AGENTS.md` and `.agent/` convention, agent operational docs live at repo root `.agent/`:

```
$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)/.agent/handoff.md
```

If inside a worktree: path is `<worktree>/.agent/handoff.md` — each worktree has its own. The file is **tracked** (not gitignored) so it ships with the branch.

## File format

```markdown
# Handoff — <branch-name>

**Linear:** STL-NN (link)
**Current owner:** Claude | Codex 돌쇠 | none
**Last sync:** <ISO timestamp>

## What's done
- <bullet>

## What's in progress
- <bullet — file paths + specific unfinished item>

## What's next
- <bullet>

## Blockers / open questions
- <bullet>

## Log
- <ISO> — <agent> — <one-line note>
- <ISO> — <agent> — <one-line note>
```

## Workflow

### `read` (default)

1. Resolve repo root → current worktree.
2. Read `.agent/handoff.md` if it exists.
3. Summarize to user:
   ```
   Handoff for <branch>:
     Owner: Codex 돌쇠 (last update 3h ago)
     In progress: vrm_rest.rs bone normalization — Codex reached step 2/5
     Blockers: waiting on user decision re: ADR-0025 scope
     Last 3 log entries: ...
   ```
4. If the file doesn't exist, report "no handoff yet — call with `write` to create".

### `write`

1. Gather current state in parallel: `git log -5`, `git status`, `git diff --stat main...HEAD`, current branch, Linear ID (from branch/commit).
2. Draft the file per template.
3. **Show draft to user, get approval** before writing (this touches an in-repo file).
4. Write file. Stage it but do NOT auto-commit — leave for user's next commit via `/shotloom-commit`.

### `append <msg>`

1. Locate `.agent/handoff.md` — if missing, treat as `write` with just this log entry.
2. Determine current owner tag — "Claude" for this skill.
3. Append to `## Log`:
   ```
   - <ISO timestamp> — Claude — <msg>
   ```
4. If `<msg>` implies ownership change (contains "handing off", "Codex please", "넘김"), also update `**Current owner:**` line at top.
5. No approval gate for append (single-line log entry is low-risk).

## Binding rules

- **Never delete log entries.** Append-only.
- **Keep entries concise** — one line. Details go in the commit message or ADR.
- **Write English** (per `agent/rules/security.md` documentation-language rule). Korean OK in the log field only when quoting the user.
- **Handoff.md is tracked** — changes ship in the branch's commits. The commit that updates it should mention "update handoff" in the body.
- This skill does NOT push. User pushes when they commit.

## Related

- Repo `.agent/` folder convention: in-repo `AGENTS.md` and `.agent/README.md`
- Codex 돌쇠's side of this protocol: `repo-paths.json → codex-base` (resolve via `jq -r '."codex-base"' ~/.claude/private/caol-config/repo-paths.json`). Codex reads the same `.agent/handoff.md` from its own workspace root.
