---
description: Open a Rust+Bevy VRM viewer project. Use when running Bevy VRM apps.
argument-hint: "[project_path]"
allowed-tools: Bash(cargo:*), Bash(cp:*), Bash(ls:*), Read
---

# dev-open-vrm-bevy

Build and run a Rust + Bevy + wgpu VRM viewer project.

## Arguments

- `[project_path]` - Path to the Bevy project directory (optional)

**If no argument is provided, default to `anju/bevy-vrm`.**

## Workflow

### Step 1: Resolve Path
- If `$ARGUMENTS` is provided, use it as the project path
- Otherwise, read `~/.claude/private/repo-paths.json` to get the `anju` repo path, then use `<anju>/bevy-vrm/`
- Verify `Cargo.toml` exists in the project directory

### Step 2: Check VRM Asset
- Check if any `.vrm` file exists in `<project>/assets/models/`
- If none found, warn the user and suggest placing a VRM 1.0 file there

### Step 3: Build and Run
- `cargo run` from the project directory
- Ensure `$HOME/.cargo/bin` is in PATH
- First build takes ~3 min, subsequent runs are fast
- Window opens automatically (native app, no browser needed)

### Step 4: Confirm
- Confirm the Bevy window opened successfully
