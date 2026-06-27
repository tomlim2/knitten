# AGENTS.md

Codex adapter entry for Knitten Agent Hub core contracts.

## Load Order

1. Read `SYSTEM.md`.
2. Read `.codex-plugin/plugin.json` when checking plugin metadata.

## Boundary

This checkout is a Codex plugin source. It should load without external harness
deploy folders, private paths, or domain-specific credentials.

Knitten owns generic Agent Hub workflow contracts, path/output destinations,
validation, and plugin boundaries. Domain-specific behavior belongs in payload
plugins.

## Mechanical Findings

Use `knitten:kc-report-finding` only for checked mechanical errors: missing
files/paths/scripts/configs, stale helper references, install/cache drift,
validator failures, or plugin boundary failures.

Do not report ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to the Knitten core plugin. Payload plugins should
not own or document the finding-report workflow.

## KC Protocol Skills

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

`kc-review-fix-loop` follows the same rule. It is a skill/protocol that
coordinates `kc-review`, `kc-implement`, validation, and checkpoint JSON. Do
not search PATH for `kc-review-fix-loop` or report that the workflow is missing
because no executable exists.

When a loop asks for `kc-review-fix-loop`, `/kc-review-fix-loop`, "triad review
fix loop", or "review until blockers disappear", read and apply:

- `skills/kc-review-fix-loop/SKILL.md`
- `skills/kc-review-fix-loop/references/flow.md`

## Promoted References

Payload plugins may place `reference-promoted.md` next to a payload skill, and
the payload plugin owns CRUD for it. Use the payload plugin's promote-reference
skill for creating, editing, deleting, promoting, retiring, or moving entries.
