---
description: Open Matcap Painter web app. Use when opening or launching the matcap-painter tool.
allowed-tools: Bash(npx:*), Bash(open:*), Bash(lsof:*), Read
---

# dev-open-matcap-painter

Open the Matcap Painter web app for creating and editing matcap textures.

ES modules require an HTTP server (file:// blocked by CORS).

## Workflow

### Step 1: Resolve Path
- Read `~/.claude/private/caol-config/repo-paths.json` to get the `matcap-painter` repo path

### Step 2: Start Server
- Check if port 3003 is already in use via `lsof -i :3003`
- If not running, start `npx serve -l 3003 .` in background from the repo directory
- Wait briefly for server startup

### Step 3: Open Browser
- Open `http://localhost:3003` via `open` (macOS) or `start` (Windows)
- Confirm the webapp opened successfully
