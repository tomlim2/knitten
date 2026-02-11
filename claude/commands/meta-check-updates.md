---
description: "Check today's updated skills and commands via git"
argument-hint: "[YYYY-MM-DD]"
allowed-tools: Bash(git:*), Bash(curl:*), Read, Glob, Grep
---

# Check Updates

Show skills, commands, and standards changed in caol-ila on a given date (defaults to today).

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `meta-check-updates`

## Arguments

- `[YYYY-MM-DD]` - Date to check (optional, defaults to today)

```
Usage:
  /meta-check-updates              → Show today's changes
  /meta-check-updates 2026-02-09   → Show changes for Feb 9
```

## Execution

### Step 1: Determine date

- If `$ARGUMENTS` is provided, use it as the target date (validate YYYY-MM-DD format)
- If no argument, use today's date

### Step 2: Get changed files from git

Run in the caol-ila repo (`/Users/younsoolim/Desktop/www/caol-ila`):

```bash
git -C /Users/younsoolim/Desktop/www/caol-ila log \
  --after="YYYY-MM-DD 00:00" --before="YYYY-MM-DDT23:59:59" \
  --name-only --format="" -- claude/commands/ claude/skills/ claude/standards/
```

Deduplicate the file list (a file may appear in multiple commits).

### Step 3: Classify changes

Group deduplicated files by type:

| Path pattern | Category |
|---|---|
| `claude/commands/*.md` | Commands |
| `claude/skills/*/` (any file) | Skills (group by skill directory name) |
| `claude/standards/*.md` | Standards |

For each file, determine if it was **new** or **modified** on that date:

```bash
git -C /Users/younsoolim/Desktop/www/caol-ila log \
  --diff-filter=A --after="YYYY-MM-DD 00:00" --before="YYYY-MM-DDT23:59:59" \
  --name-only --format="" -- <file>
```

If the file appears in `--diff-filter=A` output, it's **(new)**. Otherwise it's **(modified)**.

### Step 4: Check skill server status

Try to reach the skill server:

```bash
curl -s --max-time 1 http://localhost:972/api/skills 2>/dev/null
curl -s --max-time 1 http://localhost:972/api/commands 2>/dev/null
```

- If server responds, check whether newly added commands/skills appear in the response
- If server is unreachable, note "Server not running"

### Step 5: Output

Display results in this format:

```
## Updates for YYYY-MM-DD

### Commands (N changed)
- NEW  command-name
- MOD  other-command

### Skills (N changed)
- NEW  skill-name
- MOD  other-skill

### Standards (N changed)
- MOD  slash-commands

### Server Status
Server running - All N new items discovered
```

Rules:
- Use `NEW` for newly added, `MOD` for modified
- Omit a category section if it has 0 changes
- If no changes at all, show: "No skill/command/standard changes on YYYY-MM-DD."
- For skills, show the skill directory name (e.g., `cocv-open-creator-character`), not individual files
- Server status line: show whether new items are discoverable, or "Server not running" if unreachable
