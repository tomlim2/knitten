# Remove Remaining Core Routing Names

## Status

Accepted.

## Goal

Remove the remaining `routing`/`router`/`route` naming from active Knitten Core
surfaces so the core consistently reads as direct activation, adapter, workflow
index, and path/output infrastructure.

## Problem

After the main terminology cleanup, a few active or user-facing Knitten Core files still
carry old routing names:

- `docs/guidelines/routing-integration.md` is a compatibility pointer.
- `docs/guidelines/legacy-router-migration.md` is still present as an active
  guideline file.
- `docs/guidelines/skill-authoring.md` still talks about routers as the
  explicit policy name.
- `skills/draft-spec/SKILL.md` still says `router-shaped` and `router
  behavior`.
- `evals/context-load-smoke/cases.json` still says requests are outside Knitten Core
  routing skills.
- `CHANGELOG.md` still describes the old guideline as connecting payload
  routers.

The user asked to finish the naming cleanup completely, so compatibility
pointers and legacy active guideline names should be removed rather than kept
as exceptions.

## Boundary

In scope:

- `CHANGELOG.md`.
- `docs/guidelines/routing-integration.md`.
- `docs/guidelines/legacy-router-migration.md`.
- `docs/guidelines/skill-authoring.md`.
- `skills/draft-spec/SKILL.md`.
- `evals/context-load-smoke/cases.json`.

Out of scope:

- Historical specs under `docs/specs/**`.
- Behavior changes to validators, eval runner logic, or skill activation.
- KSL/Shotloom files.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Current Knitten Core active-name scan | Yes | Source list of remaining old names. |
| `docs/guidelines/skill-authoring.md` | Yes | Active skill creation guidance. |
| `skills/draft-spec/SKILL.md` | Yes | Active spec drafting skill. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Removed compatibility guideline files | durable | Old active old-name docs are deleted. |
| Updated active guidance | durable | Skill authoring and spec drafting use direct activation / adapter wording. |
| Updated eval notes and changelog wording | durable | User-facing names no longer say routing/router. |
| Validation evidence | local | Commands proving Knitten Core remains valid. |

## Contract

- Active Knitten Core files outside `docs/specs/**` must not contain `routing`, `router`,
  or `route` unless the term appears inside a different domain word that is not
  part of the old Knitten Core routing direction.
- Deleting old guideline files must not leave active references to them.
- Skill-authoring guidance must still clearly forbid broad pre-selection layers
  and parent-aware leaf skills.
- No eval behavior changes: only notes text changes.
- No validator or runtime behavior changes.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- `git diff --check`
- `! rg -n 'routing|router|route|Routing|Router|Route' CHANGELOG.md README.md SYSTEM.md MILESTONE.md agent .codex-plugin docs/guidelines docs/public-core skills scripts evals --glob '!docs/specs/**'`

## Acceptance Criteria

- `docs/guidelines/routing-integration.md` is removed.
- `docs/guidelines/legacy-router-migration.md` is removed.
- `skill-authoring.md` describes direct activation, adapters, internal flows,
  classification scripts, and parent-independent exposed skills without old
  routing names.
- `draft-spec` uses the same direct activation / adapter wording.
- Context-load smoke eval notes use "evaluated Knitten Core pilot skills" or equivalent.
- The targeted active-name scan returns no matches.
- Validation passes.
- Commit the completed cycle before starting the next cycle.

## Open Questions

- None.

## Design Plan

### Inputs

- `CHANGELOG.md`
- `docs/guidelines/routing-integration.md`
- `docs/guidelines/legacy-router-migration.md`
- `docs/guidelines/skill-authoring.md`
- `skills/draft-spec/SKILL.md`
- `evals/context-load-smoke/cases.json`

### Outputs

- Deleted old-name guideline files.
- Updated wording in active Knitten Core guidance, skill, eval fixtures, and changelog.
- Validation output.

### Implementation Sequence

#### 1. Remove Old Guideline Files

Files:

- `docs/guidelines/routing-integration.md`
- `docs/guidelines/legacy-router-migration.md`

Changes:

- Delete both files.
- Do not replace them with new compatibility pointers.

Risk:

- A stale active link could point at a deleted file.

Proof:

- `! rg -n 'routing-integration|legacy-router-migration' CHANGELOG.md README.md SYSTEM.md MILESTONE.md agent docs/guidelines docs/public-core skills scripts evals --glob '!docs/specs/**'`

#### 2. Rewrite Active Authoring Guidance

Files:

- `docs/guidelines/skill-authoring.md`
- `skills/draft-spec/SKILL.md`

Changes:

- Replace old routing terms with direct activation, adapter, workflow-index, and
  classification wording.
- Preserve the rule that exposed skills must not depend on parent knowledge.

Risk:

- Over-softening the wording could allow broad pre-selection layers to return.

Proof:

- `! rg -n 'routing|router|route|Routing|Router|Route' docs/guidelines/skill-authoring.md skills/draft-spec/SKILL.md`

#### 3. Clean User-Facing Notes

Files:

- `CHANGELOG.md`
- `evals/context-load-smoke/cases.json`

Changes:

- Rewrite old routing names in notes/changelog to adapter/workflow-index or
  evaluated skill wording.

Risk:

- None; no behavior changes.

Proof:

- `! rg -n 'routing|router|route|Routing|Router|Route' CHANGELOG.md evals/context-load-smoke/cases.json`

### Review Plan

- Contract: active Knitten Core files outside `docs/specs/**` have no old routing names.
- Boundary: historical specs are not rewritten in this cycle.
- Validation: shell, doctor, plugin validation, and diff check pass.
