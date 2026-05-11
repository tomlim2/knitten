---
status: open
created: 2026-05-11
load: triggered
trigger: stale ~/.claude symlinks discovered after agent root rename
followup_to: docs/plans/agent-root-rename.md
decision: docs/decisions/0003-agent-root-directory.md
---

# Agent Symlink Followup

**status:** partially remediated on 2026-05-11. Broken per-child symlinks under `~/.claude/` were repointed to `agent/` so a Claude Code session can load global context again. Final alignment with the accepted ADR (`~/.claude -> caol-ila/agent`) is still open.

## Discovery

A Claude Code session opened in `shotloom-github` on 2026-05-11 had no user-level `CLAUDE.md`, no custom slash commands, no hooks, and no custom rules. Cause: yesterday's `8d9ad51 docs: rename canonical agent root` moved sources from `claude/` to `agent/`, but `~/.claude/` on this machine is **not** a directory symlink — it is a real directory containing per-child symlinks, all still pointing at the old `caol-ila/claude/` path.

## Architectural discrepancy

ADR 0003 (`docs/decisions/0003-agent-root-directory.md`) and the rename plan (`docs/plans/agent-root-rename.md`) both assume:

```
~/.claude -> caol-ila/agent
```

This machine instead has:

```
~/.claude/                   (real directory)
├── CLAUDE.md          ->  caol-ila/claude/CLAUDE.md      (stale)
├── commands           ->  caol-ila/claude/commands       (stale)
├── config             ->  caol-ila/claude/config         (stale, but resolves)
├── hooks              ->  caol-ila/claude/hooks          (stale)
├── lib                ->  caol-ila/claude/lib            (stale)
├── repo-registry.json ->  caol-ila/claude/...            (stale)
├── rules              ->  caol-ila/claude/rules          (stale)
├── settings.json      ->  caol-ila/claude/settings.json  (stale)
├── skills             ->  caol-ila/claude/skills         (stale, but resolves)
├── standards          ->  caol-ila/claude/standards      (stale)
└── (real subdirs: history, sessions, projects, backups, file-history,
    paste-cache, plugins, telemetry, ops, tasks, plans, downloads,
    cache, session-env, shell-snapshots)
```

Step 5 of the ADR Cascade ("Verify `~/.claude` points at `caol-ila/agent`") was not executed on this machine, presumably because `~/.claude` held a per-child symlink scheme rather than a single directory symlink.

## Leftover stub

A non-tracked directory `caol-ila/claude/` still exists. It contains only `config/`, `obsidian-staging/`, `private/`, `skills/` — partial leftover from before/around the rename. It is the reason `~/.claude/config` and `~/.claude/skills` still resolved (silently divergent from the canonical `agent/` versions).

## Remediation applied on 2026-05-11

Repointed only the broken per-child symlinks. Conservative scope: did not collapse `~/.claude` into a directory symlink, did not touch the leftover stub, did not repoint the two non-broken symlinks.

| Symlink | New target |
|---|---|
| `~/.claude/CLAUDE.md` | `caol-ila/agent/CLAUDE.md` |
| `~/.claude/commands` | `caol-ila/agent/commands` |
| `~/.claude/hooks` | `caol-ila/agent/hooks` |
| `~/.claude/lib` | `caol-ila/agent/lib` |
| `~/.claude/repo-registry.json` | `caol-ila/agent/repo-registry.json` |
| `~/.claude/rules` | `caol-ila/agent/rules` |
| `~/.claude/settings.json` | `caol-ila/agent/settings.json` |
| `~/.claude/standards` | `caol-ila/agent/standards` |

## Open work

1. **Decide canonical `~/.claude/` shape on this machine.** Two viable options:
   - **(A) Keep per-child symlinks.** Cheap, no data migration. Diverges from the ADR's "single directory symlink" expectation. Update ADR 0003 / rename plan to recognize this as an acceptable variant.
   - **(B) Collapse to `~/.claude -> caol-ila/agent`.** Matches the ADR exactly. Requires relocating Claude Code runtime state currently living as real subdirs in `~/.claude/` (history, sessions, projects, backups, file-history, paste-cache, plugins, telemetry, ops, tasks, plans, downloads, cache, session-env, shell-snapshots) — likely under `~/.claude-runtime/` or similar — and re-establishing them inside `agent/` or via runtime path overrides.
2. **Repoint `~/.claude/config` and `~/.claude/skills`** from `caol-ila/claude/...` to `caol-ila/agent/...`. They still resolve via the leftover stub and silently diverge from canonical sources.
3. **Remove the leftover `caol-ila/claude/` stub** once nothing references it. Confirm none of its `private/` / `obsidian-staging/` contents are unique before deletion.
4. **Optional: add a validator check.** Extend `scripts/validate-llm-first.mjs` (or a new lint) to assert every `~/.claude/*` symlink on a dev machine points into `caol-ila/agent/`, so future renames cannot drift silently.

## Acceptance for closing this followup

| Check | Expected |
|---|---|
| `readlink ~/.claude/CLAUDE.md` | resolves into `caol-ila/agent/` (or `~/.claude` is itself a symlink to `caol-ila/agent`) |
| `readlink ~/.claude/config` and `~/.claude/skills` | resolve into `caol-ila/agent/` (no longer stale) |
| `~/Desktop/www/caol-ila/claude/` | removed, or explicitly documented as preserved with reason |
| ADR 0003 | reflects the chosen `~/.claude/` shape on dev machines |
