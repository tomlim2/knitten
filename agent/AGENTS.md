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

Payload skills may use `reference-promoted.md` as a temporary supplemental
reference. Use `ah-promote-reference` when a checked mechanical issue needs a
skill-local gate before it is stable enough for `SKILL.md`, `reference.md`,
scripts, tests, or repository guidelines.
