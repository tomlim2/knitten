# Knitten System

## Contract

| Rule | Meaning |
|------|---------|
| Plugin source | The checkout is loaded by Codex through `.codex-plugin/plugin.json`. |
| Routing core | This repository contains plugin identity, entry guidance, validation, local registration, and generic AH routing. |
| Path/output routing | Durable documents route to the target workspace; generic local AH outputs route to the Knitten hub. |
| Self-contained source | Operation does not require a second harness-specific source tree. |
| Payload boundary | Skills, standards, domain workflows, and working documents live in separate payload plugins. |

## Load

Codex reads plugin metadata from `.codex-plugin/plugin.json`.

## Runtime Assumptions

Do not require another harness runtime, private local paths, domain service
credentials, or legacy source checkouts for this plugin to load.

## Boundary

Canonical boundary policy lives in
`docs/guidelines/plugin-boundary.md`.

## Mechanical Finding Capture

Use `knitten:kc-report-finding` only for checked mechanical errors:

- missing file, path, script, config, skill, or command
- stale skill reference to a moved config or helper
- source, installed copy, or Codex cache drift
- doctor, validator, install, or plugin boundary failure

Do not record ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to this Knitten core plugin. Even when the defect is
observed while using a payload plugin, store the report in Knitten's local hub
queue, not in the payload plugin.

## Promoted References

Payload plugins may place `reference-promoted.md` next to a payload `SKILL.md`.
The payload plugin that owns the skill owns the CRUD workflow.

Use the payload plugin's promote-reference skill for every create, update,
delete, promotion, retirement, or move involving `reference-promoted.md`.

Use promoted references only for temporary supplemental gates, checks, or
patterns that should affect skill execution now but are not stable enough for
`SKILL.md`, `reference.md`, a script, a test, or a repository guideline.

Promotion criteria:

- The issue is repeatable or mechanically checkable.
- A skill-local trigger and check can prevent recurrence.
- The rule is not already covered by a stable owner.
- The entry has a clear retirement target.

If `reference-promoted.md` exists, the payload skill must inspect its trigger
index after `reference.md` and read only matching promoted sections. If it does
not exist, skip it.
