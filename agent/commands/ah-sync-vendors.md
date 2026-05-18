---
description: Sync agent-hub vendor skills to upstream latest
allowed-tools: Read, Bash(git:*), Bash(jq:*), Bash(bash:*), Bash(ls:*)
---

# ah-sync-vendors

Pull every external vendor registered in agent-hub to its upstream latest commit.

Scope: this command only touches `~/.claude/vendor/*` local upstream checkouts
(git pull via the vendor skill vault's `scripts/sync.sh`). It does NOT audit internal
agent-hub skills, does NOT update descriptions or frontmatter, and does NOT
write to the tracked agent-hub repo.

The vendor skill vault holds third-party vendor skills in `vendor/`.
`~/.claude/vendor` should symlink to that vendor root, and wrapper skills
`@import` from the symlinked path. This command:

1. Shows how far each vendor is behind its upstream
2. Asks for confirmation
3. Runs the vendor skill vault's `scripts/sync.sh` to pull latest
4. Verifies each wrapper's `@import` target still exists

## Usage

```
/ah-sync-vendors
```

No arguments.

## Workflow

### Step 1: Locate vendor skill vault and vendor root

Resolve the vault through machine-paths, then derive the vendor root:

```bash
vault_root="$(bash "$HOME/.claude/skills/ah-resolve-doc-path/resolve.sh" tool vendor-skill-vault | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')"
vendor_root="$vault_root/vendor"
registry="$vault_root/skills.json"
sync_script="$vault_root/scripts/sync.sh"
[ -d "$vendor_root" ] || { echo "vendor root not found: $vendor_root"; exit 1; }
[ -f "$registry" ] || { echo "vendor registry not found: $registry"; exit 1; }
[ -x "$sync_script" ] || { echo "vendor sync script not executable: $sync_script"; exit 1; }
```

If the vendor registry or sync script is missing, stop and fix the agent-hub
and vendor vault install before pulling upstreams.

### Step 2: Report per-vendor drift

Read `$registry`, and for each vendor under
`$vendor_root/<name>`:

```bash
cd "$vendor_root/<name>"
git fetch --depth 1 origin "$branch" 2>/dev/null
local=$(git rev-parse HEAD)
remote=$(git rev-parse "origin/$branch")
behind=$(git rev-list --count "$local..$remote")
```

Show a table:

```
| Vendor          | Branch | Local    | Remote   | Behind |
|-----------------|--------|----------|----------|--------|
| hyperframes     | main   | abc1234  | def5678  | 7      |
| huashu-design   | master | aaaa111  | aaaa111  | 0      |
```

If every vendor is at 0 behind, report "all up to date" and stop.

### Step 3: Confirm before pulling

Show the user the drift table and ask: "Pull latest for the N vendors that are behind? [y/N]"

Do NOT pull without explicit approval. The user may want to inspect upstream changes first (e.g., `gh release view` or reading the vendor's CHANGELOG).

### Step 4: Run sync.sh

If approved:

```bash
bash "$sync_script"
```

`sync.sh` iterates `skills.json` and does `git fetch --depth 1 + git reset --hard origin/<branch>` per vendor. Local changes in `vendor-skill-vault/vendor/<name>` are lost — that's intentional (vendor folders are gitignored, not a working copy).

### Step 5: Verify wrapper @import targets

For each wrapper in `~/.claude/skills/` that starts with `{category}-{repo}-`, extract the `@import` line and verify the target file exists:

```bash
for skill in ~/.claude/skills/*/SKILL.md; do
  import_path=$(grep -m1 -oE '@~[^ ]+\.md' "$skill" 2>/dev/null | head -1 | sed 's|^@||' | sed "s|^~|$HOME|")
  if [ -n "$import_path" ] && [ ! -f "$import_path" ]; then
    echo "BROKEN: $skill → $import_path"
  fi
done
```

If any wrapper points to a path that no longer exists in upstream (e.g. upstream reorganized), surface them. Do NOT auto-fix — the user must decide whether to repoint, rename, or drop the wrapper.

### Step 6: Summary

Report:

```
Updated: hyperframes (7 commits pulled), ...
Unchanged: huashu-design
Broken wrappers: (none) | <list>
```

## Notes

- This command does NOT commit anything. `vendor-skill-vault/vendor/<name>/` checkouts
  are gitignored.
- If `skills.json` changed (new vendor added, entry removed), that's a separate edit flow — covered by the CRUD process, not this command.
- For a full wipe + reinstall: delete the vendor checkout folder and run
  `cd "$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh tool vendor-skill-vault | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')" && ./scripts/sync.sh`.

## Related

- Wrapper naming: `~/.claude/rules/author.md` — external wrapper pattern
- Vendor layout: `~/.claude/vendor` symlink plus the vendor skill vault `README.md`
