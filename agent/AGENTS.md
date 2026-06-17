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

Use `knitten:kc-report-finding` only for checked mechanical errors: missing
files/paths/scripts/configs, stale helper references, install/cache drift,
validator failures, or plugin boundary failures.

Do not report ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to the Knitten core plugin. Payload plugins should
not own or document the finding-report workflow.

## KC Review Protocol

`kc-review` is a Knitten Core skill/protocol, not a shell command, executable,
MCP tool, or PATH binary. Do not run `which kc-review`, do not search PATH for
it, and do not report that it is unavailable as an executable.

When a review asks for `kc-review`, `/kc-review`, `kc-review mode=single`, or
`kc-review mode=triad`, read and apply:

- `skills/kc-review/SKILL.md`
- `skills/kc-review/references/triad.md`

If the active session exposes `/kc-review` as a skill, using that skill is fine.
If it does not, apply the same protocol inline from the files above. Do not
call this a fallback or substitute review; it is the KC Review Protocol.

## Promoted References

Payload plugins may place `reference-promoted.md` next to a payload skill, and
the payload plugin owns CRUD for it. Use the payload plugin's promote-reference
skill for creating, editing, deleting, promoting, retiring, or moving entries.
