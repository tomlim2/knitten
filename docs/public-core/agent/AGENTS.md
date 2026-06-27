# AGENTS.md

Codex entry for the Knitten plugin core.

First shared-policy read: `SYSTEM.md`.

## Load Order

1. Read `SYSTEM.md`.
2. Read `.codex-plugin/plugin.json` when checking plugin metadata.
3. Read plugin skills only when Codex exposes them or the user names one.

## Boundary

This checkout is a Codex plugin source. Do not require external harness deploy
folders to operate this plugin.
