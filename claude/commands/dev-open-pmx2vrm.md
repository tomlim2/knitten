---
description: Open PMX to VRM converter webapp
allowed-tools: Bash(npm:*), Bash(start:*), Bash(curl:*)
---

# dev-open-pmx2vrm

Open the truepmx2vrm Next.js webapp for PMX to VRM conversion.

## Execution

1. Read `~/.claude/private/caol-config/repo-paths.json` to get the `anju` repo path
2. Check if port 3001 is already running
3. If not running, start the dev server in background
4. Open browser to http://localhost:3001

```bash
cd "<anju_path>/module/pmx2vrm/webapp"

# Check if already running
if ! curl -s http://localhost:3001 > /dev/null 2>&1; then
    npm run dev &
    sleep 5
fi

start http://localhost:3001
```

Confirm the webapp opened successfully.
