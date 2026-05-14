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
| `caol-ila/AGENT-HUB.md` | Codex can resolve the compact routing index from `~/.codex/AGENT-HUB.md` |
| `caol-ila/agent/` | Codex can resolve shared layers through `~/.codex/agent/` |
| `caol-ila/docs/` | Codex can resolve glossary and plan references through `~/.codex/docs/` |
| `caol-ila/agent/rules` | Codex can resolve rules through `~/.codex/rules` |
| `caol-ila/agent/standards` | Codex can resolve standards through `~/.codex/standards` |
| `caol-ila/agent/commands` | Codex can resolve commands through `~/.codex/commands` |
| `caol-ila/agent/skills/*/SKILL.md` | Codex can resolve caol-ila skills through `~/.codex/skills/<skill>/SKILL.md` |
| existing `~/.codex/AGENTS.md` | Personal queue rules remain available |

## Decision

| Choice | Status | Reason |
|--------|--------|--------|
| Keep `~/.codex/AGENTS.md` as a shim | default | preserves existing personal Codex rules and `order/` routing |
| Symlink `~/.codex/AGENTS.md` to `caol-ila/AGENTS.md` | fallback | use only if the user wants caol-ila to own all Codex startup behavior |
| Symlink only `SYSTEM.md` | rejected | Codex does not load `SYSTEM.md` unless the entry document tells it to read that file |
| Symlink `~/.codex/skills` to `caol-ila/agent/skills` | rejected | replaces Codex built-in `.system` skills |
| Symlink each caol-ila skill under `~/.codex/skills/<skill>` | default | preserves Codex built-in `.system` skills and exposes caol-ila skills |

## Acceptance Criteria

- [ ] `~/.codex/AGENTS.md` contains an explicit first-read instruction for `SYSTEM.md`.
- [ ] Existing personal queue rules from the current `~/.codex/AGENTS.md` remain present.
- [ ] `~/.codex/SYSTEM.md` resolves to `caol-ila/SYSTEM.md`.
- [ ] `~/.codex/AGENT-HUB.md` resolves to `caol-ila/AGENT-HUB.md`.
- [ ] `~/.codex/agent` resolves to `caol-ila/agent`.
- [ ] `~/.codex/docs` resolves to `caol-ila/docs`.
- [ ] `~/.codex/rules` resolves to `caol-ila/agent/rules`.
- [ ] `~/.codex/standards` resolves to `caol-ila/agent/standards`.
- [ ] `~/.codex/commands` resolves to `caol-ila/agent/commands`.
- [ ] `~/.codex/skills/.system` remains a real Codex-owned directory.
- [ ] Each caol-ila skill directory containing `SKILL.md` resolves through `~/.codex/skills/<skill>`.
- [ ] `~/.codex/AGENTS.md` tells Codex to apply `rules/task-context-routing.md` before loading route-domain bodies.
- [ ] A fresh Codex session can read the global entry document and identify `SYSTEM.md` as loaded policy.
- [ ] Rollback restores the previous `~/.codex/AGENTS.md` and removes only the new Codex links.

## Constraints

| Constraint | Rule |
|------------|------|
| Path source | Resolve repo and Codex paths from `~/.claude/private/caol-config/*.json`; do not hardcode machine paths in scripts |
| Filename case | Use `SYSTEM.md`; do not create lowercase `system.md` |
| Personal queue | Preserve `~/.codex/order/` behavior unless the user explicitly replaces it |
| Shared policy | Do not copy `SYSTEM.md` content into `~/.codex/AGENTS.md`; link and instruct read instead |
| Built-in Codex skills | Do not replace `~/.codex/skills`; preserve `~/.codex/skills/.system` |
| caol-ila skills | Link only directories that contain `SKILL.md`; skip support directories without `SKILL.md` |
| Collision handling | Inspect each destination path before replacing it; back up non-matching files or directories first |
| Secrets | Do not copy `auth.json`, state databases, logs, or session files |

## Execution Tasks

| Task | Command / check | Acceptance |
|------|-----------------|------------|
| T1: Resolve paths | `CODEX_HOME="$(jq -r '."codex-home"' ~/.claude/private/caol-config/machine-paths.json)"` and `CAOL_ILA="$(jq -r '."caol-ila".path' ~/.claude/private/caol-config/repo-paths.json)"` | both variables are non-empty directories |
| T2: Inspect collisions | `for p in AGENTS.md SYSTEM.md AGENT-HUB.md agent docs rules standards commands skills; do ls -ld "$CODEX_HOME/$p" 2>/dev/null || true; done` | every existing destination is understood before edits |
| T3: Back up entry | `cp "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S)"` | backup file exists |
| T4: Back up collisions | for each existing non-matching `SYSTEM.md`, `AGENT-HUB.md`, `agent`, `docs`, `rules`, `standards`, or `commands`, move it to `"$CODEX_HOME/<name>.backup.$(date +%Y%m%d-%H%M%S)"` | no non-matching destination remains |
| T5: Link support paths | `ln -s "$CAOL_ILA/SYSTEM.md" "$CODEX_HOME/SYSTEM.md"`; `ln -s "$CAOL_ILA/AGENT-HUB.md" "$CODEX_HOME/AGENT-HUB.md"`; `ln -s "$CAOL_ILA/agent" "$CODEX_HOME/agent"`; `ln -s "$CAOL_ILA/docs" "$CODEX_HOME/docs"` | each link resolves to `caol-ila` |
| T6: Link top-level shared layers | `ln -s "$CAOL_ILA/agent/rules" "$CODEX_HOME/rules"`; `ln -s "$CAOL_ILA/agent/standards" "$CODEX_HOME/standards"`; `ln -s "$CAOL_ILA/agent/commands" "$CODEX_HOME/commands"` | each link resolves to `caol-ila/agent` |
| T7: Link caol-ila skills | for each `$CAOL_ILA/agent/skills/<skill>/SKILL.md`, create `"$CODEX_HOME/skills/<skill>" -> "$CAOL_ILA/agent/skills/<skill>"` | `.system` remains and caol-ila skills resolve |
| T8: Update shim | edit `$CODEX_HOME/AGENTS.md` so the first shared-policy read is `SYSTEM.md`, then keep the existing personal queue rules below it | file keeps queue rules and names `SYSTEM.md` first |
| T9: Verify reads | `sed -n '1,80p' "$CODEX_HOME/AGENTS.md"` and `sed -n '1,20p' "$CODEX_HOME/SYSTEM.md"` | output shows shim, load order, and canonical policy |
| T10: Verify links | `readlink "$CODEX_HOME/SYSTEM.md"`; `readlink "$CODEX_HOME/AGENT-HUB.md"`; `readlink "$CODEX_HOME/agent"`; `readlink "$CODEX_HOME/docs"`; `readlink "$CODEX_HOME/rules"`; `readlink "$CODEX_HOME/standards"`; `readlink "$CODEX_HOME/commands"` | each target is under `caol-ila` |
| T11: Verify skills | `test -d "$CODEX_HOME/skills/.system"` and `find -L "$CODEX_HOME/skills" -mindepth 2 -maxdepth 2 -name SKILL.md | wc -l` | `.system` exists and caol-ila skills are discoverable |
| T12: Verify startup behavior | start a fresh Codex session and ask whether `SYSTEM.md`, auto rules, task context routing, and caol-ila skills loaded | answer identifies `SYSTEM.md`, `rules/index.md`, `rules/task-context-routing.md`, and at least one caol-ila skill |

## Shim Shape

```md
# Personal Codex Entry

First shared-policy read: [SYSTEM.md](SYSTEM.md).

Read `SYSTEM.md` before applying global planning, rules, or repo conventions.

System terms: [docs/reference/system-glossary.md](docs/reference/system-glossary.md).

## Load Order

1. Read `SYSTEM.md`.
2. Read `docs/reference/system-glossary.md` when editing system policy, entry documents, plans, manifests, or validators.
3. Read `rules/index.md`.
4. Read every auto rule listed by `rules/index.md`.
5. Read triggered rules, standards, skills, and commands when the task matches them.

## Task Context Routing

Before loading route-domain skills, standards, commands, rules, or references:

1. Read `rules/task-context-routing.md`.
2. Classify the task with user words, cwd, repo key, file extensions, named skill, command name, and frontmatter.
3. Use routing axes and profiles from `agent/config/context-routing.json`.
4. Load only artifacts whose routing metadata matches the task route.
5. If route confidence is low, read only the `AGENT-HUB.md` routing block or ask one short question.

## Shared Layers

Top-level shared-layer paths resolve to caol-ila:

- `rules/`
- `standards/`
- `skills/`
- `commands/`

Compact routing index resolves through `AGENT-HUB.md`.

Use `skills/<name>/SKILL.md` when a user names a skill or the task matches that skill's description.

<existing Personal Codex Rules content stays below this line>
```

## Skill Link Command

```sh
mkdir -p "$CODEX_HOME/skills"
find "$CAOL_ILA/agent/skills" -mindepth 2 -maxdepth 2 -name SKILL.md -print0 |
  while IFS= read -r -d '' skill_file; do
    src="$(dirname "$skill_file")"
    name="$(basename "$src")"
    dst="$CODEX_HOME/skills/$name"
    if [ -e "$dst" ] || [ -L "$dst" ]; then
      continue
    fi
    ln -s "$src" "$dst"
  done
```

## Rollback

| Task | Command / check |
|------|-----------------|
| Find backup | `ls -t "$CODEX_HOME"/AGENTS.md.backup.* | head -1` |
| Restore entry | `cp "$BACKUP" "$CODEX_HOME/AGENTS.md"` |
| Remove support links | remove `SYSTEM.md`, `AGENT-HUB.md`, `agent`, `docs`, `rules`, `standards`, and `commands` only when they are symlinks created by this plan |
| Remove skill links | remove `~/.codex/skills/<skill>` only when it is a symlink to `caol-ila/agent/skills/<skill>` |
| Restore collisions | move any `*.backup.<timestamp>` collision backups back to their original names |
| Verify rollback | `test -e "$CODEX_HOME/AGENTS.md"` and inspect `SYSTEM.md`, `AGENT-HUB.md`, `agent`, `docs`, `rules`, `standards`, `commands`, and `skills` state |

## Direct Symlink Fallback

Use this only after explicit user approval because it replaces personal Codex queue behavior. Run T1 through T5 first so support links and collision backups are already handled.

```sh
CODEX_HOME="$(jq -r '."codex-home"' ~/.claude/private/caol-config/machine-paths.json)"
CAOL_ILA="$(jq -r '."caol-ila".path' ~/.claude/private/caol-config/repo-paths.json)"
mv "$CODEX_HOME/AGENTS.md" "$CODEX_HOME/AGENTS.md.backup.$(date +%Y%m%d-%H%M%S)"
ln -s "$CAOL_ILA/AGENTS.md" "$CODEX_HOME/AGENTS.md"
```
