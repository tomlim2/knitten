# AGENTS.md

Codex adapter entry for the Knitten Agent Hub routing system.

## Load Order

1. Read `SYSTEM.md`.
2. Read `.codex-plugin/plugin.json` when checking plugin metadata.

## Boundary

This checkout is a Codex plugin source. It should load without external harness
deploy folders, private paths, or domain-specific credentials.

Knitten routes generic Agent Hub workflow intent, path/output destinations, and
plugin boundaries. Domain-specific behavior belongs in payload plugins.
