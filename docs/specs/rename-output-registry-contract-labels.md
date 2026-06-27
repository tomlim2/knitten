# Rename Output Registry Contract Labels

## Status

Accepted.

## Goal

Rename active KC validation labels from `routing registry` to `output registry`
terms so the tooling describes what it actually checks: output, local artifact,
and local helper registries.

## Problem

Knitten no longer presents generic routing as the main product direction, but
active doctor and repository-shell checks still use `routing-registry` names.
Those checks validate `agent/config/outputs.json`,
`agent/config/local-artifact-paths.json`, and
`agent/config/local-helper-paths.json`; they do not route user requests or
select skills.

The old name makes the core look larger and more router-shaped than it is.

## Boundary

In scope:

- Active validator function names in `scripts/doctor.mjs`.
- Active repository shell validator function names in
  `scripts/validate-repository-shell.mjs`.
- Doctor check ids printed to users and copied-plugin validation output.
- The payload-boundary usage text when it names generic KC ownership.
- Current milestone source-spec references if they point at the renamed
  registry spec.

Out of scope:

- Changing registry JSON schemas or resolver behavior.
- Rewriting historical specs that intentionally record old routing work.
- Removing the compatibility `routing` wrapper scripts created by earlier
  migration work.
- Adding new routers, route maps, or skill-selection logic.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `scripts/doctor.mjs` | Yes | Source and copied-plugin health checks. |
| `scripts/validate-repository-shell.mjs` | Yes | Repository shell allow-list and registry contract validation. |
| `scripts/validate-payload-boundary.mjs` | Yes | Payload boundary usage text. |
| `docs/specs/routing-registry-health-cleanup.md` | Yes | Current registry-health spec with an outdated active-looking title. |
| `MILESTONE.md` | Yes | Source-spec pointer displayed as current direction. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Renamed active labels | durable | Functions and doctor check ids say `output-registry` instead of `routing-registry`. |
| Renamed current spec | durable | The registry-health cleanup spec reads as output registry cleanup. |
| Compatibility pointer | durable | The old spec path remains as a short pointer if needed. |
| Validation evidence | local | Commands proving the rename did not change behavior. |

## Contract

- Behavior must remain equivalent: the same registries are read and the same
  invalid entries fail.
- Doctor JSON check ids must no longer advertise `routing-registry` for the
  output/local-artifact/local-helper contract.
- Repository-shell validation must still reject disallowed output makers,
  local-artifact owners, helper paths, unsafe templates, and missing files.
- Historical specs may retain old routing wording unless they are the active
  current source of truth being renamed in this pass.
- Compatibility pointer files may mention the old name only to redirect readers
  to the new canonical file.

## Validation

- `node --check scripts/doctor.mjs`
- `node --check scripts/validate-repository-shell.mjs`
- `node --check scripts/validate-payload-boundary.mjs`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- `git diff --check`
- `node scripts/materialize-local-plugin.mjs && node scripts/doctor.mjs`

## Acceptance Criteria

- Active doctor check ids use `output-registry-contract` names for source and
  copied plugin checks.
- Active validator function names use `OutputRegistryContract`.
- The current registry-health spec and milestone pointer use the new output
  registry name.
- The old spec path, if retained, is only a compatibility pointer.
- No validation command fails after implementation.
- No active code behavior changes beyond names and user-facing wording.

## Open Questions

- None.

## Design Plan

### Inputs

- `scripts/doctor.mjs`
- `scripts/validate-repository-shell.mjs`
- `scripts/validate-payload-boundary.mjs`
- `docs/specs/routing-registry-health-cleanup.md`
- `MILESTONE.md`

### Outputs

- Renamed active functions and doctor check ids.
- Canonical `docs/specs/output-registry-health-cleanup.md`.
- Short compatibility pointer at
  `docs/specs/routing-registry-health-cleanup.md`, if the old path remains.
- Validation output from the commands above.

### Implementation Sequence

#### 1. Rename Active Validators

Files:

- `scripts/doctor.mjs`
- `scripts/validate-repository-shell.mjs`

Changes:

- Rename `validateRoutingRegistryContract` to
  `validateOutputRegistryContract`.
- Rename doctor check ids from `*-routing-registry-contract` to
  `*-output-registry-contract`.

Risk:

- Downstream scripts may assert old doctor check ids.

Proof:

- `node --check scripts/doctor.mjs`
- `node --check scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`

#### 2. Rename Current Spec Surface

Files:

- `docs/specs/routing-registry-health-cleanup.md`
- `docs/specs/output-registry-health-cleanup.md`
- `MILESTONE.md`

Changes:

- Move the current spec to the output-registry name.
- Keep the old path only as a short compatibility pointer.
- Update milestone source spec link.

Risk:

- Existing links to the old spec path need a readable redirect.

Proof:

- `rg -n 'output-registry-health-cleanup' MILESTONE.md docs/specs/output-registry-health-cleanup.md`
- `! rg -n 'routing-registry-health-cleanup' MILESTONE.md docs/specs/output-registry-health-cleanup.md`

#### 3. Clarify Payload Boundary Wording

Files:

- `scripts/validate-payload-boundary.mjs`

Changes:

- Replace usage wording that says payload plugins must not own generic
  `path, routing` surfaces with `path/output runtime` wording.

Risk:

- None; usage text only.

Proof:

- `node --check scripts/validate-payload-boundary.mjs`

### Review Plan

- Contract: verify behavior stays identical and only naming/user-facing wording
  changes.
- Boundary: verify historical specs are not mass-rewritten.
- Validation: verify shell, doctor, plugin validation, and diff check pass.
