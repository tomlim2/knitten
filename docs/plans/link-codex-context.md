---
status: open
created: 2026-05-11
load: triggered
trigger: installing caol-ila as Codex global context
standard: agent/standards/policy/llm-first-docs.md
related: docs/plans/agent-symlink-followup.md
---

# Link Codex Context Plan

**status:** open. This plan connects Codex global startup context to `caol-ila` while preserving the current Codex personal queue behavior.

## Goal

| Source | Target behavior |
|--------|-----------------|
| `caol-ila/SYSTEM.md` | Codex can load canonical policy from `~/.codex/SYSTEM.md` |
| `caol-ila/agent/` | Codex can resolve shared layers through `~/.codex/agent/` |
| `caol-ila/docs/` | Codex can resolve glossary and plan references through `~/.codex/docs/` |
| existing `~/.codex/AGENTS.md` | Personal queue rules remain available |

## Decision

| Choice | Status | Reason |
|--------|--------|--------|
| Keep `~/.codex/AGENTS.md` as a shim | default | preserves existing personal Codex rules and `order/` routing |
| Symlink `~/.codex/AGENTS.md` to `caol-ila/AGENTS.md` | fallback | use only if the user wants caol-ila to own all Codex startup behavior |
| Symlink only `SYSTEM.md` | rejected | Codex does not load `SYSTEM.md` unless the entry document tells it to read that file |

## Acceptance Criteria

- [ ] `~/.codex/AGENTS.md` contains an explicit first-read instruction for `SYSTEM.md`.
- [ ] Existing personal queue rules from the current `~/.codex/AGENTS.md` remain present.
- [ ] `~/.codex/SYSTEM.md` resolves to `caol-ila/SYSTEM.md`.
- [ ] `~/.codex/agent` resolves to `caol-ila/agent`.
- [ ] `~/.codex/docs` resolves to `caol-ila/docs`.
- [ ] A fresh Codex session can read the global entry document and identify `SYSTEM.md` as loaded policy.
- [ ] Rollback restores the previous `~/.codex/AGENTS.md` and removes only the new Codex links.

## Constraints

| Constraint | Rule |
|------------|------|
| Path source | Resolve repo and Codex paths from `~/.claude/private/caol-config/*.json`; do not hardcode machine paths in scripts |
| Filename case | Use `SYSTEM.md`; do not create lowercase `system.md` |
| Personal queue | Preserve `~/.codex/order/` behavior unless the user explicitly replaces it |
| Shared policy | Do not copy `SYSTEM.md` content into `~/.codex/AGENTS.md`; link and instruct read instead |
| Secrets | Do not copy `auth.json`, state databases, logs, or session files |

## Execution Tasks

| Task | Command / check | Acceptance |
|------|-----------------|------------|
| T1: Resolve paths | `CODEX_HOME="$(jq -r '."codex-home"' ~/.claude/private/caol-config/machine-paths.json)"` and `CAOL_ILA="$(jq -r '."caol-ila"' ~/.claude/private/caol-config/repo-paths.json)"` | both variables are non-empty directories |
| T2: Back up entry | `cp "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S)"` | backup file exists |
| T3: Link support paths | `ln -sfn "$CAOL_ILA/SYSTEM.md" "$CODEX_HOME/SYSTEM.md"`; `ln -sfn "$CAOL_ILA/agent" "$CODEX_HOME/agent"`; `ln -sfn "$CAOL_ILA/docs" "$CODEX_HOME/docs"` | each link resolves to `caol-ila` |
| T4: Update shim | edit `$CODEX_HOME/AGENTS.md` so the first shared-policy read is `SYSTEM.md`, then keep the existing personal queue rules below it | file keeps queue rules and names `SYSTEM.md` first |
| T5: Verify reads | `sed -n '1,40p' "$CODEX_HOME/AGENTS.md"` and `sed -n '1,20p' "$CODEX_HOME/SYSTEM.md"` | output shows shim and canonical policy |
| T6: Verify links | `readlink "$CODEX_HOME/SYSTEM.md"`; `readlink "$CODEX_HOME/agent"`; `readlink "$CODEX_HOME/docs"` | each target is under `caol-ila` |
| T7: Verify startup behavior | start a fresh Codex session and ask whether `SYSTEM.md` loaded | answer identifies `caol-ila/SYSTEM.md` or `~/.codex/SYSTEM.md` |

## Shim Shape

```md
# Personal Codex Entry

First shared-policy read: [SYSTEM.md](SYSTEM.md).

Read `SYSTEM.md` before applying global planning, rules, or repo conventions.

<existing Personal Codex Rules content stays below this line>
```

## Rollback

| Task | Command / check |
|------|-----------------|
| Find backup | `ls -t "$CODEX_HOME"/AGENTS.md.backup.* | head -1` |
| Restore entry | `cp "$BACKUP" "$CODEX_HOME/AGENTS.md"` |
| Remove support links | `rm "$CODEX_HOME/SYSTEM.md" "$CODEX_HOME/agent" "$CODEX_HOME/docs"` |
| Verify rollback | `test -e "$CODEX_HOME/AGENTS.md"` and `test ! -e "$CODEX_HOME/SYSTEM.md"` |

## Direct Symlink Fallback

Use this only after explicit user approval because it replaces personal Codex queue behavior:

```sh
CODEX_HOME="$(jq -r '."codex-home"' ~/.claude/private/caol-config/machine-paths.json)"
CAOL_ILA="$(jq -r '."caol-ila"' ~/.claude/private/caol-config/repo-paths.json)"
cp "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S)"
ln -sfn "$CAOL_ILA/AGENTS.md" "$CODEX_HOME/AGENTS.md"
ln -sfn "$CAOL_ILA/SYSTEM.md" "$CODEX_HOME/SYSTEM.md"
ln -sfn "$CAOL_ILA/agent" "$CODEX_HOME/agent"
ln -sfn "$CAOL_ILA/docs" "$CODEX_HOME/docs"
```
