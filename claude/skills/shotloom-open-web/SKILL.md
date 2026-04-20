---
description: Launch shotloom web dev server (WASM build + Vite) and report the local URL
argument-hint: "[--port N]"
allowed-tools: Read, Bash(pnpm:*), Bash(npx:*), Bash(cargo:*), Bash(node:*), Bash(which:*), Bash(ls:*), Bash(cd:*)
---

# shotloom-open-web

Spin up the Shotloom web runtime locally — WASM build via `wasm-pack` + Vite dev server — and surface the URL the user should open in a WebGPU-capable browser (Chrome / Edge stable).

Minimal orchestration around `pnpm dev:web`; handles the common environment gaps (missing `pnpm`, `wasm-pack`, or `node_modules`) so the skill is idempotent across machines.

## Arguments

- `[--port N]` — Optional. Forward a port override to Vite. Defaults to Vite's own default (5173).

**If no argument is provided, run with defaults. NEVER prompt the user for missing flags — this is a launcher, not a configurator.**

## Binding rules

- **Never auto-open the browser.** Print the URL and let the user click. Avoids racing the WASM initialization.
- **Never run in the foreground.** `pnpm dev:web` is a long-lived process; always launch in the background and hand control back to the user once the URL is ready.
- **Respect repo path indirection.** Resolve the shotloom repo from `~/.claude/private/repo-paths.json` (key `shotloom`); never hardcode paths.
- **Do not run destructive installs silently.** If `wasm-pack` / `pnpm` are missing, show the exact install command and ask before running.

## Workflow

### Step 1: Resolve the shotloom repo path

Read `~/.claude/private/repo-paths.json` and look up the `shotloom` entry. If missing, abort and ask the user to register it first (`/caol-register-refs`).

### Step 2: Environment preflight

Check for required binaries. For each missing one, show the install command and ask for approval before running:

| Missing | Fix |
|---------|-----|
| `pnpm` | `npm i -g pnpm` (or use `npx pnpm ...`) |
| `wasm-pack` | `cargo install wasm-pack --locked` |
| `node_modules/` under repo root | `pnpm install` from repo root |

Skip to the launch step once preflight is green.

### Step 3: Launch dev:web in the background

Run from the shotloom repo root:

```bash
pnpm dev:web
```

Use the Bash `run_in_background: true` flag so the server keeps running after the tool call returns.

### Step 4: Wait for Vite to report a URL

Monitor the background task's output file for the line `Local:   http://localhost:PORT/` (Vite prints it once WASM build completes and the server is ready). Do not poll in a tight loop — the `Monitor` tool with a single `grep --line-buffered "Local:"` filter is the right pattern.

### Step 5: Report to the user

Once the URL appears, print:

```
Shotloom web runtime ready.
→ Open in a WebGPU-capable browser (Chrome / Edge stable):
  http://localhost:5173/
```

Include any browser-specific notes that apply (e.g. Firefox requires the WebGPU flag).

### Step 6: Leave the process running

Do **not** kill the background task. The user will stop it themselves (Ctrl+C in their terminal, or by closing the tab and letting the system reclaim the port).

## Notes

- **WASM build is slow first time** (minutes). Subsequent builds are cached and complete in seconds. Communicate this up front if a cold build is detected (no `crates/shotloom-web/pkg/` or `target/wasm32-*`).
- **Port collisions** — if 5173 is taken, Vite auto-selects the next free port and prints it. Parse whatever `Local:` line appears, don't assume 5173.
- **Spawn Debug Character** is the primary smoke-test interaction once the page loads. Fixture VRM is `vrm_yoya.vrm`; fixture FBX clips (stand / figure-eight run) come bundled via `include_bytes!` from `crates/shotloom-retarget/fixtures/anims/body/`.

## Related

- `pnpm dev:desktop` — Tauri native target (separate skill candidate if this one proves useful).
- `pnpm probe:vrm` — headless Chrome VRM spawn probe, used for regression screenshots (see STL-116 PR #106).
