---
description: Open the skill server dashboard
allowed-tools: Bash(open:*)
---

# Open Skill Server

Start the local skill server and open the dashboard in browser.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `open-skills`

## Execution

1. Check if dependencies are installed
2. Start server if not running
3. Open browser to dashboard

```bash
cd ~/.claude/skills/skill-server

# Install if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if already running
if ! curl -s http://localhost:972 > /dev/null 2>&1; then
    # Start in background
    npm start &
    sleep 2
fi

# Open browser
open http://localhost:972
```
