# Knitten System

## Contract

| Rule | Meaning |
|------|---------|
| Plugin source | The checkout is loaded by Codex through `.codex-plugin/plugin.json`. |
| Core plugin | This repository contains plugin identity, entry guidance, validation, local registration, and generic AH workflows. |
| Path/output core | Durable documents stay with the target workspace; generic local AH outputs stay in the Knitten hub. |
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

## Terms

- Agent Hub (AH): the generic Codex workflow layer for preparing work, drafting
  specs, implementing, reviewing, and wrapping up tasks.
- Knitten hub: the Knitten-owned local storage root for generic Agent Hub local
  outputs, including the finding report queue.
- Output contract: a registered resolver entry exposed through
  `KNITTEN_PATH_BIN output`.
- Local artifact path registry: registered local path entries used for
  task-scoped rolling context.
- Payload source root: the source checkout for a payload plugin, distinct from
  an installed plugin root or materialized copy.

## Long-Running Work

Repositories hold code, specs, and committed durable docs. Registered local
artifact paths hold rolling work context: decisions, open loops, verification
state, review notes, briefings, and resume handoffs.

Do not rely on chat history as the only memory for reusable task context. Write
reusable context through KC-owned output contracts or the local artifact path
registry.

When a target workspace accepts its own local task-memory contract, that
workspace owns the physical task artifact root. KC may keep old registry
entries as explicit compatibility surfaces, but new primary storage should
resolve under the target workspace. Shotloom task artifacts use the Shotloom
`scripts/agent-task-artifact.mjs` contract for primary task memory.

Codex may prepare summaries, evidence, drafts, patches, and next-step
recommendations. User approval is required for publishing, external posting,
deployment, destructive cleanup, or irreversible external-state changes unless
the active skill documents a narrower explicit exemption. A direct current-turn
instruction for an exact action counts as approval for that action only after
the scoped command still matches the request.

## Mechanical Finding Capture

Use `knitten:kc-report-finding` only for checked mechanical errors:

- missing file, path, script, config, skill, or command
- stale skill reference to a moved config or helper
- source, installed copy, or Codex cache drift
- doctor, validator, install, or plugin boundary failure

Do not record ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to this Knitten core plugin. Even when the defect is
observed while using a payload plugin, store the report in Knitten's finding
report queue, not in the payload plugin.

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
