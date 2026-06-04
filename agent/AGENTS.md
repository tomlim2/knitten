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

Use `knitten:ah-report-finding` only for checked mechanical errors: missing
files/paths/scripts/configs, stale helper references, install/cache drift,
validator failures, or plugin boundary failures.

Do not report ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to the Knitten core plugin. Payload plugins should
not own or document the finding-report workflow.

## Promoted References

Knitten core may place `reference-promoted.md` next to a payload skill, and
Knitten core owns all CRUD for it. Use `ah-promote-reference` for creating,
editing, deleting, promoting, retiring, or moving entries. Payload plugins are
skill storage only.
