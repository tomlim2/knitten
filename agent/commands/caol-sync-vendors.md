---
description: Sync agent-hub vendor skills to upstream latest
allowed-tools: Read, Bash(git:*), Bash(jq:*), Bash(bash:*), Bash(ls:*)
---

# caol-sync-vendors

Pull every external vendor registered in agent-hub to its upstream latest commit.

Scope: this command only touches `~/.claude/vendor/*` local upstream checkouts
(git pull via `~/.claude/vendor/sync.sh`). It does NOT audit internal agent-hub
skills, does NOT update descriptions or frontmatter, and does NOT write to the
tracked repo except through the tracked vendor registry/script.

agent-hub holds third-party vendor skills in `~/.claude/vendor/`. Wrapper skills
`@import` from that vendor root. This command:

1. Shows how far each vendor is behind its upstream
2. Asks for confirmation
3. Runs `~/.claude/vendor/sync.sh` to pull latest
4. Verifies each wrapper's `@import` target still exists

## Usage

```
/caol-sync-vendors
```

No arguments.

## Workflow

### Step 1: Locate vendor root

Resolve the vendor root through the harness path:

```bash
vendor_root="$HOME/.claude/vendor"
registry="$vendor_root/skills.json"
sync_script="$vendor_root/sync.sh"
[ -f "$registry" ] || { echo "vendor registry not found: $registry"; exit 1; }
[ -x "$sync_script" ] || { echo "vendor sync script not executable: $sync_script"; exit 1; }
```

If the vendor registry or sync script is missing, stop and fix the agent-hub
install before pulling upstreams.

### Step 2: Report per-vendor drift

Read `$vendor_root/skills.json`, and for each vendor under
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

`sync.sh` iterates `skills.json` and does `git fetch --depth 1 + git reset --hard origin/<branch>` per vendor. Local changes in `~/.claude/vendor/<name>` are lost — that's intentional (vendor folders are gitignored, not a working copy).

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

- This command does NOT commit anything. `~/.claude/vendor/<name>/` checkouts
  are gitignored.
- If `skills.json` changed (new vendor added, entry removed), that's a separate edit flow — covered by the CRUD process, not this command.
- For a full wipe + reinstall: delete the vendor checkout folder and run
  `bash ~/.claude/vendor/sync.sh`.

## Related

- Wrapper naming: `~/.claude/rules/author.md` — external wrapper pattern
- Vendor layout: `~/.claude/vendor/README.md`
