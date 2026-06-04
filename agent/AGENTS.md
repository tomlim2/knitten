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

## Mechanical Findings

When Knitten or a payload plugin exposes a reproducible mechanical mismatch,
route it through `knitten:ah-report-finding`. Examples include stale paths,
missing scripts, config/helper drift, failed validators, install/cache drift,
or plugin boundary contradictions.

Do not route general improvement ideas, style preferences, speculative notes,
one-off confusion, or user-directed scope changes through `ah-report-finding`.
