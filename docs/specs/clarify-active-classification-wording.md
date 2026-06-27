# Clarify Active Classification Wording

## Status

Accepted.

## Goal

Replace active Knitten Core authoring guidance that uses generic `route` wording with
classification, dispatch, or ownership wording where no router behavior is
being introduced.

## Problem

The active Knitten Core skill-authoring direction already says not to add new routers,
but nearby wording still says:

- "mechanical route script"
- "route policy"
- "routing behavior"

`report-finding` also says to "route the follow-up" when it means assign or
send the follow-up to the owning payload plugin.

These phrases are small, but they keep active guidance sounding like router
policy rather than direct activation plus internal flow selection.

## Boundary

In scope:

- `docs/guidelines/skill-authoring.md`.
- `skills/report-finding/references/flow.md`.

Out of scope:

- `docs/guidelines/legacy-router-migration.md`.
- The compatibility pointer `docs/guidelines/routing-integration.md`.
- Skill activation behavior or scripts.
- Historical specs.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `docs/guidelines/skill-authoring.md` | Yes | Active skill authoring guidance. |
| `skills/report-finding/references/flow.md` | Yes | Active operational finding workflow reference. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Updated wording | durable | Active guidance uses classification/ownership language. |
| Validation evidence | local | Commands proving docs and plugin shell still pass. |

## Contract

- The rule "do not add new routers" must remain explicit.
- Legacy router maintenance guidance may still say "router" where the subject
  is an actual legacy router.
- Active guidance must not tell new work to maintain route policy in Markdown.
- `report-finding` must still direct follow-up gates/checks to the payload
  plugin that owns the affected skill.
- No behavior or file ownership changes.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- `git diff --check`
- `! rg -n 'route policy|route script|routing behavior|route the follow-up' docs/guidelines/skill-authoring.md skills/report-finding/references/flow.md`

## Acceptance Criteria

- `docs/guidelines/skill-authoring.md` uses classification-script and
  classification-policy wording for non-new-router guidance.
- `skills/report-finding/references/flow.md` uses ownership/direct-follow-up
  wording instead of `route the follow-up`.
- The old active phrases listed in validation no longer match.
- No legacy migration document is rewritten in this pass.

## Open Questions

- None.

## Design Plan

### Inputs

- `docs/guidelines/skill-authoring.md`
- `skills/report-finding/references/flow.md`

### Outputs

- Updated active wording in the two files above.
- Validation output from repository shell, doctor, plugin validation, and diff
  check.

### Implementation Sequence

#### 1. Update Skill Authoring Guidance

Files:

- `docs/guidelines/skill-authoring.md`

Changes:

- Replace `route script`, `route policy`, and `routing behavior` with
  classification wording.
- Keep explicit legacy-router and no-new-router rules.

Risk:

- Removing too much router language could weaken the ban on new routers.

Proof:

- `! rg -n 'route policy|route script|routing behavior' docs/guidelines/skill-authoring.md`

#### 2. Update Finding Follow-Up Wording

Files:

- `skills/report-finding/references/flow.md`

Changes:

- Replace `route the follow-up` with wording that sends the follow-up to the
  owning payload plugin.

Risk:

- The finding record owner could become ambiguous if the wording is too short.

Proof:

- `! rg -n 'route the follow-up' skills/report-finding/references/flow.md`

### Review Plan

- Contract: no active route-policy phrasing remains.
- Boundary: legacy-router guidance is not rewritten.
- Validation: shell, doctor, plugin validation, and diff check pass.
