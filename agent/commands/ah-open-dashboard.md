---
description: Open the Agent Hub HQ dashboard
allowed-tools: Bash(open:*), Bash(curl:*), Bash(npm:*), Bash(cd:*), Bash(pnpm:*)
---

# ah-open-dashboard

Start the Agent Hub HQ Astro dashboard (port 9720) and open it in browser.

## Execution

```bash
agent_hub_root="$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo agent-hub | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')"
cd "$agent_hub_root/tools/ah-hq"

# Install if needed
if [ ! -d "node_modules" ]; then
    pnpm install
fi

# Build if dist missing
if [ ! -d "dist" ]; then
    pnpm build
fi

# Start if not running
if ! curl -s http://localhost:9720 > /dev/null 2>&1; then
    pnpm start &
    sleep 2
fi

open http://localhost:9720
```
