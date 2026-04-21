---
description: Diagnose logical alias resolution across hardware.json + repo-paths.json
allowed-tools: Read, Bash(ls:*), Bash(test:*)
---

# caol-check-aliases

Walk every logical alias declared in `~/.claude/private/caol-config/hardware.json`, resolve it through `~/.claude/private/caol-config/repo-paths.json`, and verify the resulting absolute path exists on disk. Report each alias as OK / MISSING / BROKEN.

Run this whenever:
- A new logical alias is added.
- After moving / renaming a vault on disk.
- When a skill that uses an alias fails mysteriously.
- Periodically as drift-detection on long-running machines.

## Arguments

None.

Usage: `/caol-check-aliases`

## Workflow

### Step 1: Read config files

Read `~/.claude/private/caol-config/hardware.json` and `~/.claude/private/caol-config/repo-paths.json`.

- If `hardware.json` is missing: print `hardware.json not found — run /system-save-hardware first.` and stop.
- If `repo-paths.json` is missing: print `repo-paths.json not found — register paths with /caol-register-refs first.` and stop.

Extract the `aliases` object from hardware.json. If absent or empty, print `No aliases declared in hardware.json. Direct repo-paths keys will still work.` and continue (no errors to check).

### Step 2: Resolve and verify each alias

For each `(logical, repo_key)` entry in `hardware.aliases`:

1. Look up `repo_key` in `repo-paths.json`.
   - If missing → status `BROKEN` (alias target not registered).
2. If found, get the absolute path.
3. Check the path exists on disk (`ls -d "<path>"` or `test -d "<path>"`).
   - If exists → status `OK`.
   - If missing → status `MISSING` (registered but gone from disk).

### Step 3: Report

Print a table and a summary line:

```
Logical        Repo key              Path                                                    Status
-------        --------              ----                                                    ------
obsidian       obsidian-staging      /Users/.../caol-ila/claude/obsidian-staging             OK
codex          codex-base            /Users/.../.codex/codex-base                             OK

2/2 aliases resolve to existing directories.
```

If any alias is not `OK`, list concrete fixes inline:

- `BROKEN`: `→ add "<repo_key>": "<path>" to repo-paths.json or update hardware.aliases to point at an existing key.`
- `MISSING`: `→ the path <abs> does not exist. Either create it, or update repo-paths to point at the real location.`

### Step 4: Exit code and final line

- If every alias is `OK`: finish with `All aliases healthy.` (exit 0).
- If any alias is not `OK`: finish with `<N> alias(es) need attention — see above.` (non-zero exit).

## Notes

- This is read-only. The command never edits hardware.json or repo-paths.json.
- Resolution falls back to direct repo-paths lookup when `aliases` is absent — that path is healthy by definition for the skills calling it. This command only validates the *declared* alias layer.
- Paired with `/caol-check-refs` (validates repo-paths entries independently of aliases).

## Related

- `~/.claude/standards/repo-paths-keys.md` — logical alias vocabulary and resolution contract
- `/caol-register-refs` — add new repo-paths entries
- `/caol-check-refs` — validate repo-paths entries
- `/system-save-hardware` — rewrite hardware.json (merge-preserves aliases)
