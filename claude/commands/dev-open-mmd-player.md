---
description: Open MMD Player (Three.js WebGPU viewer)
allowed-tools: Bash(npx:*), Bash(start:*), Bash(curl:*)
---

# dev-open-mmd-player

Open the MikuMikuDance web player for PMX model viewing and VMD animation playback.

ES modules require HTTP server (file:// blocked by CORS).

## Execution

1. Read `~/.claude/private/repo-paths.json` to get the `anju` repo path
2. Check if port 3002 is already in use
3. If not running, start a local HTTP server in background
4. Open browser to http://localhost:3002

```bash
cd "<anju_path>/web/mmd-player"

# Check if already running
if ! curl -s http://localhost:3002 > /dev/null 2>&1; then
    npx serve -l 3002 . &
    sleep 3
fi

start http://localhost:3002
```

Confirm the webapp opened successfully.
