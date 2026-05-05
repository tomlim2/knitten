---
description: Open the Caol HQ dashboard
allowed-tools: Bash(open:*), Bash(curl:*), Bash(npm:*), Bash(cd:*), Bash(pnpm:*)
---

# caol-open-dashboard

Start the Caol HQ Astro dashboard (port 9720) and open it in browser.

## Execution

```bash
cd ~/.claude/skills/caol-hq

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
