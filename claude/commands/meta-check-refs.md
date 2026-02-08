---
description: Register and list repo paths in local JSON
argument-hint: "[repo-name] [path]"
allowed-tools: Read, Write, Glob
---

# Check Refs

Register repo name and path to `~/.claude/private/repo-paths.json`, or list all registered repos.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `meta-check-refs`

## Arguments

- `[repo-name]` - Name of the repo (e.g., `anju`, `caol-ila`)
- `[path]` - Absolute path to the repo directory

**If both arguments are provided**, save the mapping.
**If no arguments are provided**, show all registered repos.

```
Usage:
  /meta-check-refs                           → List all registered repos
  /meta-check-refs anju /Users/me/www/anju   → Register repo path
```

## Execution

### Case 1: No arguments — List repos

1. Read `~/.claude/private/repo-paths.json`
2. If file doesn't exist, show "No repos registered yet."
3. If file exists, display all entries as a table:

```
Registered repos:

| Repo      | Path                                    |
|-----------|-----------------------------------------|
| anju      | /Users/younsoolim/Desktop/www/anju      |
| caol-ila  | /Users/younsoolim/Desktop/www/caol-ila  |
```

### Case 2: Two arguments — Register repo

1. Parse `$ARGUMENTS[0]` as repo-name, `$ARGUMENTS[1]` as path
2. Read existing `~/.claude/private/repo-paths.json` (or start with `{}` if not found)
3. Add/update the entry: `{ "repo-name": "path" }`
4. Write back to `~/.claude/private/repo-paths.json`
5. Confirm:

```
Registered: anju → /Users/younsoolim/Desktop/www/anju
```

### Error Cases

- If only one argument is provided, show usage and ask for the missing argument
- Path does not need to be validated (may register paths for other machines)
