---
description: Sync TA Python tools between anju and cinev-ta-tools repos
allowed-tools:
  - Bash(python:*)
user-invocable: true
---

# cocv-sync-ta-tools

Bidirectional sync for TA Python tools (`user_character_manager`, `shipping_manager`) between the anju UE project and the standalone cinev-ta-tools repo.

## Usage

Run the sync script:

```
python ~/.claude/skills/cocv-sync-ta-tools/sync.py                        # dry-run preview
python ~/.claude/skills/cocv-sync-ta-tools/sync.py --execute              # apply changes
python ~/.claude/skills/cocv-sync-ta-tools/sync.py --direction anju       # anju → ta-tools only
python ~/.claude/skills/cocv-sync-ta-tools/sync.py --direction ta-tools   # ta-tools → anju only
```

## Behavior

1. Reads repo paths from `~/.claude/private/repo-paths.json`
2. Compares files in each mapping pair (excludes `__pycache__`, `.env`, `*.pyc`)
3. Determines sync direction per file:
   - Both exist → newer mtime wins
   - One side only → copy to the other
4. Default is **dry-run** — shows preview, requires `--execute` to apply

## Instructions

When the user invokes `/cocv-sync-ta-tools`:

1. Run the sync script in dry-run mode first
2. Show the output to the user
3. Ask for confirmation before running with `--execute`
4. If user specifies a direction, pass `--direction` accordingly
