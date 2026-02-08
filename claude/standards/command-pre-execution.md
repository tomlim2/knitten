# Command Pre-Execution

**Version:** 1.0.0

This file contains logic that **ALL commands must execute before their main workflow**.

---

## Purpose

Centralized pre-execution logic for all slash commands. This file is automatically included by every command to ensure consistent behavior.

---

## Usage Tracking

**Track command execution** for browse-usage statistics:

```bash
curl -X POST http://localhost:972/api/usage/track \
  -H "Content-Type: application/json" \
  -d '{"type":"commands","id":"$COMMAND_NAME"}'
```

**Important:**
- Replace `$COMMAND_NAME` with the actual command name
- Tracking only works when skill server is running on port 972
- If server is not running, this will fail silently (expected behavior)
- Do NOT block command execution if tracking fails

---

## Environment Checks

**Check if skill server is running** (optional, informational only):

```bash
curl -s http://localhost:972/health 2>/dev/null || echo "Skill server not running (tracking disabled)"
```

This is informational only - commands should continue even if server is not running.

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
