---
description: Open MMD Player (Three.js WebGPU viewer). Use when opening or launching the mmd-player-anju web app.
allowed-tools: Bash(npx:*), Bash(open:*), Bash(curl:*), Bash(lsof:*), Read
---

# dev-open-mmd-anju

Open the MikuMikuDance web player for PMX model viewing and VMD animation playback.

ES modules require an HTTP server (file:// blocked by CORS).

## Workflow

### Step 1: Resolve Path
- Read `~/.claude/private/repo-paths.json` to get the `anju` repo path
- Player path: `<anju>/web/mmd-player-anju`

### Step 2: Start Server
- Check if port 3002 is already in use via `lsof -i :3002`
- If not running, start `npx serve -l 3002 .` in background from the player directory
- Wait briefly for server startup

### Step 3: Open Browser
- Open `http://localhost:3002` via `open` (macOS) or `start` (Windows)
- Confirm the webapp opened successfully

## Test Files

For debugging and testing, use these known files from `mmd-archive`:

- **PMX:** `pmx/槿廚屆돛―빻삽/빻삽3.0.pmx`
- **VMD:** `vmd/[MrPolarbear]/When the Moon Reaches Stars/When the Moon Reaches Stars/Mitsuru Solo.vmd`
