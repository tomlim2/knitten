---
description: List registered repo paths with connection status
allowed-tools: Read
---

# Check Refs

List all registered repos from `~/.claude/private/repo-paths.json` with connection status.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `meta-check-refs`

## Execution

1. Read `~/.claude/private/repo-paths.json`
2. If file doesn't exist, show "No repos registered yet. Use `/meta-register-refs` to add one."
3. If file exists, check each path with `fs.existsSync` and display as a table:

```
Registered repos:

| Repo           | Path                                    | Status      |
|----------------|-----------------------------------------|-------------|
| anju           | /Users/younsoolim/Desktop/www/anju      | connected   |
| ta-portfolio   | /Users/younsoulim/Desktop/www/ta-port.. | connected   |
| obsidian       | /Users/younsoolim/Library/Mobile Do...  | connected   |
```

To register a new repo, use `/meta-register-refs <name> <path>`.
