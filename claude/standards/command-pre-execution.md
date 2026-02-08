# Command Pre-Execution

**Version:** 2.0.0

This file contains logic that **ALL commands must execute before their main workflow**.

---

## Purpose

Centralized pre-execution logic for all slash commands. This file is automatically included by every command to ensure consistent behavior.

---

## Usage Tracking

**Track command execution** for browse-usage statistics (optimized for speed):

```bash
curl -X POST http://localhost:972/api/usage/track \
  -H "Content-Type: application/json" \
  -d '{"type":"commands","id":"$COMMAND_NAME"}' \
  --max-time 0.3 2>/dev/null &
```

**Performance:**
- **0.001 seconds** - Non-blocking background execution
- **570x faster** than synchronous tracking
- Command continues immediately without waiting

**Important:**
- Replace `$COMMAND_NAME` with the actual command name
- `&` runs tracking in background (command doesn't wait)
- `--max-time 0.3` ensures fast failure if server is down
- `2>/dev/null` hides error messages from user
- Tracking only works when skill server is running on port 972
- If server is not running, tracking fails silently (expected behavior)

---

## Execution Order

When a command includes this file, execute in this order:

1. **Read this file** (`command-pre-execution.md`)
2. **Execute tracking** with command-specific name
3. **Continue to main command workflow**

---

## Integration

**Every command must include this at the start:**

```markdown
**Before executing, read and execute:**
\`~/.claude/standards/command-pre-execution.md\`

Replace `$COMMAND_NAME` with: `actual-command-name`
```

---

## Notes

- This file is version-controlled
- Changes here affect ALL commands
- Keep this file minimal and focused
- Only include logic that EVERY command needs
