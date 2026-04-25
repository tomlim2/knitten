---
description: Grant full Edit/Write/Bash permissions globally (YOLO mode) — auto-backs up settings.json
argument-hint: ""
allowed-tools: Read, Write, Bash(jq:*), Bash(cp:*), Bash(date:*), Bash(mkdir:*), Bash(test:*), Bash(ls:*), Bash(cat:*)
disable-model-invocation: true
---

# caol-grant-perms

Open up `~/.claude/settings.json` for autonomous work — grant Edit / Write / MultiEdit / NotebookEdit / Bash(*) so the harness stops asking per-action approval. Backs up settings.json first, records grant state, prints how to revoke.

**User-only — Claude must not auto-invoke this** (`disable-model-invocation: true`). Treat as security-sensitive: a granted state lets every subsequent tool call run without approval until `/caol-revoke-perms`.

## Arguments

None.

Usage: `/caol-grant-perms`

## Workflow

### Step 1: Sanity + already-granted detection

```bash
settings=~/.claude/settings.json
state_dir=~/.claude/private
state=$state_dir/caol-perms-grant.json

# Confirm settings.json exists
test -f "$settings" || { echo "ERROR: $settings not found"; exit 1; }

# If already granted, refuse and show current state
if [[ -f "$state" ]]; then
  echo "Already granted. Current state:"
  cat "$state"
  echo
  echo "Run /caol-revoke-perms first if you want to re-grant."
  exit 1
fi
```

### Step 2: Backup current settings

```bash
ts=$(date +%Y%m%d%H%M%S)
backup="$settings.bak.$ts"
cp "$settings" "$backup"
echo "Backed up to: $backup"
```

### Step 3: Inject full-preset permissions

```bash
jq '
  .permissions = (.permissions // {}) |
  .permissions.allow = (.permissions.allow // []) |
  .permissions.allow += [
    "Edit",
    "Write",
    "MultiEdit",
    "NotebookEdit",
    "Bash(*)"
  ] |
  .permissions.allow |= unique
' "$backup" > "$settings"
```

### Step 4: Record grant state

```bash
mkdir -p "$state_dir"
cat > "$state" <<EOF
{
  "granted_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup": "$backup",
  "preset": "full",
  "added": ["Edit", "Write", "MultiEdit", "NotebookEdit", "Bash(*)"]
}
EOF
```

### Step 5: Report

```
✓ Granted (full preset) at <granted_at>
  Target:  ~/.claude/settings.json
  Backup:  <backup path>
  Added:   Edit, Write, MultiEdit, NotebookEdit, Bash(*)

⚠️  YOLO mode is active. Every tool call now runs without approval prompts.
   Revoke with: /caol-revoke-perms
```

## Notes

- **Idempotent guard:** if `caol-perms-grant.json` already exists, refuse. Stops accidental double-grant which would lose the original backup pointer.
- **Backup retention:** old `.bak.*` files are NOT auto-cleaned. Periodic `rm ~/.claude/settings.json.bak.*` is fine since each grant creates a fresh one.
- **Why user-global, not project-local:** the user explicitly asked for global scope (single switch across all repos). Project-local (`.claude/settings.local.json`) would be safer but requires per-repo grant.
- **Why disable-model-invocation:** Claude must never auto-grant itself elevated permissions. Only the user types `/caol-grant-perms`.
- **Restart not required:** Claude Code re-reads settings.json on next tool dispatch; grant takes effect immediately.

## Related

- `~/.claude/skills/caol-revoke-perms/SKILL.md` — restore from backup
- `~/.claude/skills/update-config/SKILL.md` — general settings.json editor (more granular)
