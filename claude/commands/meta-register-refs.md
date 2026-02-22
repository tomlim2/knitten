---
description: Register a repo path to local JSON
argument-hint: "<repo-name> <path> [description]"
allowed-tools: Read, Write
---

# Register Refs

Register a repo name and path to `~/.claude/private/repo-paths.json`.
## Arguments

- `<repo-name>` - Name of the repo (e.g., `anju`, `caol-ila`)
- `<path>` - Absolute path to the repo directory
- `[description]` - Optional description of the repo (quoted if contains spaces)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /meta-register-refs <repo-name> <path> [description]
Example: /meta-register-refs anju /Users/me/www/anju "Graphics/shader experiments"
```

## Execution

1. Parse `$ARGUMENTS[0]` as repo-name, `$ARGUMENTS[1]` as path, remaining as description
2. Read existing `~/.claude/private/repo-paths.json` (or start with `{}` if not found)
3. Add/update the entry: `{ "repo-name": { "path": "...", "description": "..." } }`
4. Write back to `~/.claude/private/repo-paths.json`
5. Confirm:

```
Registered: anju → /Users/younsoolim/Desktop/www/anju
  Description: Graphics/shader experiments
```

## Error Cases

- If only one argument is provided, show usage and ask for the missing argument
- Path does not need to be validated (may register paths for other machines)
- If description is omitted, store empty string
