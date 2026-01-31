---
allowed-tools: Bash
description: Open invoice generator via skill server
---

# Open Invoice Generator

Open the monthly tuition invoice generator through the skill server.

## Execution

```bash
cd ~/.claude/skills/skill-server

# Install if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Check if server already running
if ! curl -s http://localhost:972 > /dev/null 2>&1; then
    # Start in background
    npm start &
    sleep 2
fi

# Open invoice generator
open http://localhost:972/skills/invoice-generator
```
