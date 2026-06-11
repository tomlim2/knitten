# Routing Registry Health Cleanup

## Status

Draft.

## Goal

Make Knitten's routing registries match the core plugin contract: generic AH
routing stays in Knitten, domain-specific routing stays out of Knitten, and
doctor checks catch stale registry paths before users hit them.

## Problem

The current routing surface presents a healthier state than the repository can
actually support.

- `agent/config/local-helper-paths.json` registers helpers that do not exist in
  this checkout, including `agent/lib/*`, `skills/shotloom-*`, and
  `skills/cci-*` paths.
- `agent/config/outputs.json` and `agent/config/local-artifact-paths.json`
  contain many Shotloom-specific entries even though Knitten core documents its
  role as generic AH routing and output ownership.
- `scripts/doctor.mjs` and `scripts/validate-repository-shell.mjs` pass because
  they validate registry shape, not registry reachability or boundary fit.

The result is a routing system that passes local checks but can fail when a
caller follows a registered helper path, and a core/payload boundary that is
harder to reason about than the docs suggest.

## Boundary

In scope:

- `agent/config/local-helper-paths.json`.
- `agent/config/outputs.json`.
- `agent/config/local-artifact-paths.json`.
- `scripts/doctor.mjs`.
- `scripts/validate-repository-shell.mjs`.
- Boundary docs when they need small clarifications for the new checks.

Out of scope:

- Moving or rewriting Shotloom payload skills.
- Creating replacement Shotloom or CINEV helper implementations inside
  Knitten.
- Migrating historical specs that intentionally preserve old context.
- Changing the generic `scripts/resolve-output.mjs` kind behavior unless a
  failing check proves it is necessary.
- Adding a broad new routing framework.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Current registry files | Yes | Source of routing entries under `agent/config/`. |
| Boundary policy | Yes | Expected core/payload ownership contract. |
| Doctor output | Yes | Existing validation baseline. |
| Missing-path scan | Yes | Evidence that registered helper paths are stale. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Updated registries | durable | Registry entries either point to existing generic core resources or are removed/deferred. |
| Stronger doctor checks | durable | Doctor fails on stale helper paths and disallowed domain registry entries. |
| Updated shell validation | durable | Repository shell validation rejects newly introduced domain routing surfaces when appropriate. |
| Validation evidence | local | Command output proving the cleanup works. |

## Contract

- Knitten core may own generic AH output kinds, generic AH skill aliases, plugin
  diagnostics, and hub-local AH storage.
- Knitten core must not register domain-specific output kinds, helper paths, or
  local artifact paths unless a separate accepted spec promotes that contract to
  core.
- Keep the three active registry files as compatibility surfaces for now:
  `outputs.json`, `local-artifact-paths.json`, and `local-helper-paths.json`.
- `local-helper-paths.json` may be empty, but every retained entry must point to
  an existing source-relative file in this checkout.
- This cleanup does not allow external helper entries. Any future external
  command registry shape needs a separate accepted spec.
- Doctor must fail when a registry points at a missing source file.
- Doctor must fail when core registries contain non-generic owners or makers
  that are not allowlisted.
- The allowlist for this cleanup is:
  - output `madeBy`: `workflow:agent-hub-session-handoff`, or an existing
    `ah-*` skill under `skills/<madeBy>/SKILL.md`
  - local artifact `owner`: `ah`
  - helper `path`: an existing source-relative path under `bin/`, `scripts/`,
    `skills/ah-*`, or `skills/kc-status`
- Every retained `outputs.json` template path must exist in this checkout.
- Every retained `outputs.json` maker that is not prefixed with `workflow:` must
  match `ah-*` and resolve to an existing skill directory in this checkout.
- Retained durable output paths must match current Knitten generic document
  locations unless the entry is a section of another retained output.
- Validation should remain mechanical: no word bans, no semantic guesses, and
  no rejection of historical docs.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node --check scripts/doctor.mjs`
- `node --check scripts/validate-repository-shell.mjs`
- `node scripts/resolve-output.mjs --kind=review-json --name=routing-health-smoke`
- Manual scan: `rg -n 'shotloom|CINEV|cci|agent/lib|skills/shotloom|skills/cci' agent/config scripts docs/guidelines README.md SYSTEM.md skills -S`

## Acceptance Criteria

- `agent/config/local-helper-paths.json` contains no missing source paths.
- Core registries contain only entries allowed by the contract allowlist.
- `outputs.json` and `local-artifact-paths.json` remain present as compatibility
  registries, but domain-specific entries are removed from them.
- `outputs.json` contains no non-`workflow:` `madeBy` value unless
  `<madeBy>` matches `ah-*` and `skills/<madeBy>/SKILL.md` exists.
- `outputs.json` contains no retained template path that is missing from the
  checkout.
- `local-helper-paths.json` contains no retained helper path outside `bin/`,
  `scripts/`, `skills/ah-*`, or `skills/kc-status`.
- `local-helper-paths.json` remains present as a compatibility registry; it may
  contain zero entries.
- `node scripts/doctor.mjs` fails before the cleanup on a synthetic missing
  helper entry and passes after valid entries are restored.
- `node scripts/doctor.mjs` fails before the cleanup on a synthetic domain
  registry entry and passes after valid entries are restored.
- `scripts/resolve-output.mjs` still resolves existing generic kinds, including
  `spec`, `design-plan`, `review-json`, `response-json`, and
  `operational-finding-json`.
- Historical specs may still mention old Shotloom or legacy routing context.
- No payload helper implementation is copied into Knitten to satisfy a stale
  registry entry.

## Open Questions

- None.

## Design Plan

### Inputs

- Review findings from the routing triad pass.
- `docs/guidelines/plugin-boundary.md`.
- `docs/guidelines/plugin-boundary-pr-check.md`.
- `agent/config/*.json`.
- `scripts/doctor.mjs`.
- `scripts/validate-repository-shell.mjs`.

### Outputs

- Cleaned routing registry files.
- Doctor checks for helper reachability and core/payload boundary violations.
- Validation evidence from the commands listed above.

### Implementation Sequence

#### 1. Classify Registry Entries

Files:

- `agent/config/local-helper-paths.json`
- `agent/config/outputs.json`
- `agent/config/local-artifact-paths.json`

Changes:

- Classify each entry as generic core, domain payload, stale, or unresolved.
- Keep generic AH entries allowed by the contract.
- Remove or defer Shotloom, CINEV, and missing helper entries from Knitten core
  registries rather than recreating payload behavior in core.
- Preserve the registry files themselves as compatibility surfaces, even when a
  cleaned registry has zero entries.

Risk:

- A payload workflow may still assume the old core registry exists.

Proof:

- A before/after count of registry entries by owner or maker.
- Manual confirmation that removed entries are domain-specific or stale.

#### 2. Strengthen Doctor Checks

Files:

- `scripts/doctor.mjs`

Changes:

- Add a check that every source-relative helper path in
  `local-helper-paths.json` exists.
- Add a check that `outputs.json` and `local-artifact-paths.json` contain only
  the owners and makers named in the contract allowlist.
- Add a check that retained `outputs.json` template paths exist.
- Add a check that retained non-`workflow:` `outputs.json` makers resolve to an
  existing `ah-*` skill directory.
- Add a check that retained helper paths stay inside the contract allowlist.
- Keep failures concrete by reporting the entry id and path or owner that
  violates the contract.

Risk:

- The allowlist may be too narrow if a legitimate core-owned compatibility entry
  was missed.

Proof:

- `node scripts/doctor.mjs` reports new check ids and passes on the cleaned
  registry.
- Temporary synthetic invalid entries fail the new checks during implementation
  testing, then are removed.

#### 3. Tighten Repository Shell Validation

Files:

- `scripts/validate-repository-shell.mjs`

Changes:

- Keep `agent/config/*.json` allowed as durable core files.
- Add mechanical checks for disallowed domain owners, makers, or helper path
  prefixes in active config files.
- Avoid scanning historical docs for domain words.

Risk:

- Duplicating too much doctor logic could make the validators drift.

Proof:

- `node scripts/validate-repository-shell.mjs` passes on the cleaned checkout.
- The script fails on a synthetic disallowed config entry during implementation
  testing, then passes after restoration.

#### 4. Preserve Generic Resolver Behavior

Files:

- `scripts/resolve-output.mjs`
- `bin/knitten-resolve-output`

Changes:

- Prefer no code changes unless cleanup exposes an actual mismatch.
- Re-run smoke commands for generic output kinds.

Risk:

- Registry cleanup could accidentally be conflated with resolver behavior and
  broaden the change.

Proof:

- `node scripts/resolve-output.mjs --skill=kc-draft-spec --name=routing-health-smoke`
- `node scripts/resolve-output.mjs --skill=kc-report-finding --name=routing-health-smoke`
- `node scripts/resolve-output.mjs --kind=review-json --name=routing-health-smoke`

#### 5. Update Boundary Notes If Needed

Files:

- `docs/guidelines/plugin-boundary.md`
- `docs/guidelines/plugin-boundary-pr-check.md`

Changes:

- Add only small clarifications if the new checks need documented allowlist
  language.
- Keep broad migration history in existing specs rather than expanding the
  guidelines.

Risk:

- Over-documenting the cleanup could make the boundary harder to read.

Proof:

- Boundary docs still state the short rule clearly: Knitten owns operation;
  payload plugins contain skills.

### Review Plan

- Contract: verify active registries only contain reachable generic core
  routing entries.
- Boundary: verify no Shotloom, CINEV, or payload helper behavior is copied into
  Knitten to make validation pass.
- Validation: require doctor, shell validation, Node syntax checks, and generic
  resolver smoke output.
