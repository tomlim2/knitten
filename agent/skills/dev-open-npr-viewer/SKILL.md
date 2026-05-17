---
description: Open NPR Shader Viewer (Bevy). Use when launching the NPR shader viewer.
allowed-tools: Bash(cargo:*), Bash(ls:*), Read
---

# dev-open-npr-viewer

Build and run the NPR Shader Viewer (Bevy + wgpu + WGSL custom materials).

## Workflow

### Step 1: Resolve Path
- Read `~/.claude/private/agent-hub-config/repo-paths.json` to get the `anju` repo path
- Project directory: `<anju>/bevy-npr-viewer/`
- Verify `Cargo.toml` exists

### Step 2: Check VRM Asset
- Check if any `.vrm` file exists in `<project>/assets/models/`
- If none found, warn the user and suggest placing a VRM file there (auto-loads `default.vrm`)

### Step 3: Build and Run
- `export PATH="$HOME/.cargo/bin:$PATH" && cd <project> && cargo run --bin npr_viewer`
- First build takes ~3 min, subsequent runs are fast
- Window opens automatically (native app)

### Step 4: Confirm
- Confirm the Bevy window opened successfully
- Remind shortcuts: O (load), T (turntable), S (panel), [ ] (shader switch), R (reset)
