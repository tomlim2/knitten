# AGENTS.md

Codex entry for Knitten shared workflow core contracts.

## Load Order

1. Read `SYSTEM.md`.
2. Read `.codex-plugin/plugin.json` when checking plugin metadata.

## Boundary

This checkout is a Codex plugin source. It should load without external harness
deploy folders, private paths, or domain-specific credentials.

Knitten owns shared workflow contracts, path/output destinations, validation,
and plugin boundaries. Domain-specific behavior belongs in domain plugins.

## Mechanical Findings

Use `knitten:report-finding` only for checked mechanical errors: missing
files/paths/scripts/configs, stale helper references, install/cache drift,
validator failures, or plugin boundary failures.

Do not report ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to the Knitten core plugin. Domain plugins should
not own or document the finding-report workflow.

## Core Protocol Skills

`review` is a Knitten Core skill/protocol, not a shell command, executable,
MCP tool, or PATH binary. Do not run `which review`, do not search PATH for
it, and do not report that it is unavailable as an executable.

When a review asks for `review`, `/review`, `review mode=single`, or
`review mode=triad`, read and apply:

- `skills/review/SKILL.md`
- `skills/review/references/triad.md`

If the active session exposes `/review` as a skill, using that skill is fine.
If it does not, apply the same protocol inline from the files above. Do not
call this a fallback or substitute review; it is the Knitten review protocol.

`review-fix-loop` follows the same rule. It is a skill/protocol that
coordinates `review`, `implement`, validation, and checkpoint JSON. Do
not search PATH for `review-fix-loop` or report that the workflow is missing
because no executable exists.

When a loop asks for `review-fix-loop`, `/review-fix-loop`, "triad review
fix loop", or "review until blockers disappear", read and apply:

- `skills/review-fix-loop/SKILL.md`
- `skills/review-fix-loop/references/flow.md`

## Promoted References

Domain plugins may place `reference-promoted.md` next to a domain skill, and
the domain plugin owns CRUD for it. Use the domain plugin's promote-reference
skill for creating, editing, deleting, promoting, retiring, or moving entries.
