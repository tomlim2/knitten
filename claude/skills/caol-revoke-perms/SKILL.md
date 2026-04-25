---
description: Revoke YOLO-mode permissions — restore settings.json from the grant backup
argument-hint: ""
allowed-tools: Read, Write, Bash(cp:*), Bash(rm:*), Bash(test:*), Bash(cat:*), Bash(jq:*), Bash(ls:*)
disable-model-invocation: true
---

# caol-revoke-perms

Close down YOLO mode — restore `~/.claude/settings.json` from the backup created by `/caol-grant-perms`, then delete the grant state file. Idempotent: if no grant is active, says so and exits.

**User-only — Claude must not auto-invoke this** (`disable-model-invocation: true`). Treat as the safety partner of `/caol-grant-perms`.

## Arguments

None.

Usage: `/caol-revoke-perms`

## Workflow

### Step 1: Detect grant state

```bash
state=~/.claude/private/caol-perms-grant.json
settings=~/.claude/settings.json

if [[ ! -f "$state" ]]; then
  echo "No active grant. Nothing to revoke."
  exit 0
fi

backup=$(jq -r '.backup' "$state")
granted_at=$(jq -r '.granted_at' "$state")
preset=$(jq -r '.preset' "$state")

echo "Active grant:"
echo "  granted_at: $granted_at"
echo "  preset:     $preset"
echo "  backup:     $backup"
```

### Step 2: Validate backup exists

```bash
if [[ ! -f "$backup" ]]; then
  echo "ERROR: backup file missing — cannot restore."
  echo "Manual recovery required. settings.json + state file left untouched."
  exit 1
fi
```

### Step 3: Restore from backup

```bash
cp "$backup" "$settings"
echo "Restored: $settings ← $backup"
```

### Step 4: Clear grant state

```bash
rm "$state"
echo "Cleared grant state: $state"
```

### Step 5: (Optional) Remove the backup file

By default, **keep** the backup so the operation is reversible (re-cp the backup if Step 3 picked up something wrong). User can `rm ~/.claude/settings.json.bak.*` periodically.

If the user wants the backup cleaned up immediately, they can add a `--clean-backup` arg in a future iteration. For now: leave it.

### Step 6: Report

```
✓ Revoked at <now>
  Restored: ~/.claude/settings.json (from backup)
  Backup file kept: <backup path> (rm manually if desired)

YOLO mode is OFF. Tool calls are back under standard approval flow.
```

## Notes

- **No-op when not granted** — running `/caol-revoke-perms` without a prior grant just prints "Nothing to revoke" and exits 0. Safe to run blind.
- **Restore semantics:** the backup is whatever settings.json looked like RIGHT BEFORE the grant. If the user manually edited settings.json mid-grant, those edits are LOST on revoke. Document this in the grant skill if it becomes a real problem.
- **Why keep the backup file:** if the restore picked up a stale backup (rare race condition), having the file around lets the user manually inspect and re-cp.

## Common failures

| Symptom | Fix |
|---------|-----|
| `state` file present but `backup` file gone | Manual: edit `~/.claude/settings.json` directly to remove the YOLO permissions, then `rm ~/.claude/private/caol-perms-grant.json`. |
| Multiple `.bak.*` files accumulated | `rm ~/.claude/settings.json.bak.*` (only the one referenced by current state matters; the rest are leftovers from prior grant/revoke cycles). |

## Related

- `~/.claude/skills/caol-grant-perms/SKILL.md` — the partner skill that creates the grant state
- `~/.claude/skills/update-config/SKILL.md` — general settings.json editor
