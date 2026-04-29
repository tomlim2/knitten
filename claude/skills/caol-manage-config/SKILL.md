---
description: "Manage caol-config files — add/remove repo-paths, machine-paths, doc-paths; validate all paths; view config state."
argument-hint: "[show|validate|orphans|setup|add|remove] [repo|machine] [key] [path] [desc]"
allowed-tools: Read, Write, Bash(ls:*), Bash(test:*), Bash(jq:*), Bash(grep:*)
---

# caol-manage-config

CRUD manager for `~/.claude/private/caol-config/`.

## Arguments

- `[action]` — `show` (default), `validate`, `orphans`, `add`, `remove`
- `[target]` — `repo` or `machine`
- `[key]` — entry name
- `[path]` — file system path
- `[desc]` — optional description

**If no argument provided, run `show`.**

```
Usage:
  /caol-manage-config                          → show all configs
  /caol-manage-config validate                 → check all paths exist
  /caol-manage-config orphans                  → find doc-paths purposes with no consumer
  /caol-manage-config add repo <key> <path> [desc]
  /caol-manage-config add machine <key> <path>
  /caol-manage-config remove repo <key>
  /caol-manage-config remove machine <key>
```

---

## Config files

All in `~/.claude/private/caol-config/`:

| File | Content |
|------|---------|
| `repo-paths.json` | Git repo locations — `{ key: { path, description } }` |
| `machine-paths.json` | Machine tool/app paths — `{ key: path }` |
| `doc-paths.json` | Document routing rules — read-only (edit manually) |
| `hardware.json` | Hardware specs — managed by `system-save-hardware` |

---

## Action: show (default)

Read all four files and display:

```
## Repos (repo-paths.json)
| Key            | Path                                      | Description                  |
|----------------|-------------------------------------------|------------------------------|
| anju           | ~/Desktop/www/anju                        | UE Python tools + shader/web |
| shotloom       | ~/Desktop/www/shotloom                    | CINEV Shotloom Rust workspace |

## Machine Paths (machine-paths.json)
| Key                   | Path                                                |
|-----------------------|-----------------------------------------------------|
| obsidian              | ~/Library/Mobile Documents/.../MyNotes              |
| obsidian-vault-claude | ~/Library/Mobile Documents/.../MyNotes/claude       |
| obsidian-staging      | ~/Desktop/www/caol-ila/claude/temp-learnings        |
| blender               | /Applications/Blender.app/Contents/MacOS/Blender    |

## Doc Routing (doc-paths.json)
Purposes: devlog, learning, topic, consulting, research, notes, ops, tutoring, drinks, private-data, postmortem, vocab, experiment

## Hardware (hardware.json)
Chip: Apple M2 Max  |  RAM: 32GB  |  GPU: 30-core
```

---

## Action: validate

For each entry in `repo-paths.json` and `machine-paths.json`, check if path exists on disk.

```
## Validation Results

✓ anju           /Users/younsoolim/Desktop/www/anju
✓ shotloom       /Users/younsoolim/Desktop/www/shotloom
✗ cinev-studio   E:\CINEVStudio  (not found — Windows path)
✓ blender        /Applications/Blender.app/Contents/MacOS/Blender

Summary: 12 ok, 1 not found
```

Paths that don't exist are expected for cross-machine entries. Just flag them, don't delete.

---

## Action: orphans

Scan `doc-paths.json` purposes for **orphan entries** — purposes registered in config but not referenced by any skill or command. Detects Layer 1 ↔ Layer 2 drift.

Run this one-liner to scan:

```bash
# NOTE: pass scan dirs as separate args (NOT a single space-joined var) — zsh
# doesn't word-split unquoted vars, so $SCAN_DIRS would be one literal arg.
DOC_PATHS=~/.claude/private/caol-config/doc-paths.json
echo "## Orphan Purpose Scan"
echo ""
for p in $(jq -r '.purposes | keys[]' "$DOC_PATHS"); do
  # Match both legacy form `resolve.sh <purpose>` and modern `resolve.sh doc <purpose>`
  hits=$(grep -rlE "resolve\.sh\s+(doc\s+)?${p}\b" \
    "$HOME/.claude/skills" "$HOME/.claude/commands" 2>/dev/null \
    | wc -l | tr -d ' ')
  if [[ "$hits" -eq 0 ]]; then
    echo "⚠ ORPHAN  $p   (no consumer found)"
  else
    echo "✓ used    $p   ($hits caller(s))"
  fi
done
```

Report orphans to the user. **Do not delete** — orphans may be:
- Reserved for future skills (intentional)
- Used by ad-hoc raw resolver calls in conversation (legitimate)
- Truly unused (candidate for removal — user decision)

---

## Action: add repo

```
/caol-manage-config add repo <key> <path> [description]
```

1. Read `repo-paths.json`
2. Add/overwrite entry: `{ "key": { "path": "...", "description": "..." } }`
3. Write back
4. Confirm: `Added: key → path`

---

## Action: add machine

```
/caol-manage-config add machine <key> <path>
```

1. Read `machine-paths.json`
2. Add/overwrite entry: `{ "key": "path" }`
3. Write back
4. Confirm: `Added: key → path`

---

## Action: remove repo

```
/caol-manage-config remove repo <key>
```

1. Read `repo-paths.json`
2. Confirm key exists — if not, error
3. Show what will be deleted and ask for confirmation
4. Delete key, write back
5. Confirm: `Removed: key`

---

## Action: remove machine

```
/caol-manage-config remove machine <key>
```

Same as remove repo but for `machine-paths.json`.

---

## Action: setup

Interactive first-time setup for a new machine. Guides the user through filling in all required config files.

```
/caol-manage-config setup
```

### Steps

1. **Check target directory** — Confirm `~/.claude/private/caol-config/` exists. Create if missing.

2. **Read templates** — Load both template files from `${CLAUDE_SKILL_DIR}`:
   - `repo-paths.template.json`
   - `machine-paths.template.json`

3. **Fill repo-paths** — For each key in the template, check if it already exists in `repo-paths.json`.
   - If missing or empty, ask the user: `repo: <key> (<description>) — path?`
   - User may press enter to skip (leave empty for repos not cloned on this machine).
   - Write completed `repo-paths.json`.

4. **Fill machine-paths** — Same for `machine-paths.json`.
   - Keys: `obsidian`, `obsidian-vault-claude`, `obsidian-staging`, `blender`, `font-sarasa`, `font-sf-mono`
   - User may skip any key not applicable to this machine.
   - Write completed `machine-paths.json`.

5. **doc-paths** — `doc-paths.json` is managed in the repo. If missing from `caol-config/`, note its canonical location in `caol-ila` and show path.

6. **hardware.json** — Prompt user to run `/system-save-hardware` to populate hardware specs.

7. **Summary** — Show all four files in the same format as the `show` action.
