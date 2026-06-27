# Output Registry Health Cleanup

## Status

Partially implemented. Registry reachability and installed-copy checks exist;
remaining work is contract reconciliation for compatibility Shotloom outputs.
Current reconciliation requires each retained Shotloom registry entry to carry
explicit compatibility metadata pointing to the Shotloom task artifact resolver.

## Goal

Make Knitten's output registries match the core plugin contract: generic KC
output/path ownership stays in Knitten, documented compatibility outputs stay
explicit, and doctor checks catch stale registry paths before users hit them.

## Problem

Earlier drafts treated every Shotloom registry entry as accidental domain
leakage. Current KC usage is more specific: some Shotloom output contracts are
active compatibility surfaces resolved by `knitten-path`, while Shotloom skills,
helpers, and detailed payload behavior remain payload-owned.

The remaining risk is ambiguity. If compatibility outputs are not documented as
intentional, future cleanup can remove contracts that Shotloom skills rely on.
If payload-owned helpers or skill paths reappear in the core registry, callers
can still hit stale paths that pass shape checks but fail at runtime.

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
| Current registry files | Yes | Source of output and local-artifact entries under `agent/config/`. |
| Boundary policy | Yes | Expected core/payload ownership contract. |
| Doctor output | Yes | Existing validation baseline. |
| Missing-path scan | Yes | Evidence that registered helper paths are stale. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Updated registries | durable | Registry entries either point to existing generic core resources, documented compatibility outputs, or are removed/deferred. |
| Stronger doctor checks | durable | Doctor fails on stale helper paths and undocumented domain registry entries. |
| Updated shell validation | durable | Repository shell validation rejects newly introduced undocumented domain routing surfaces when appropriate. |
| Validation evidence | local | Command output proving the cleanup works. |

## Contract

- Knitten core may own generic KC output kinds, generic KC skill aliases, plugin
  diagnostics, hub-local KC storage, and explicitly documented compatibility
  outputs used by payload workflows.
- Knitten core must not register payload skill paths, payload helper paths, or
  local artifact paths unless a separate accepted spec promotes that contract to
  core compatibility.
- Keep the three active registry files as compatibility surfaces for now:
  `outputs.json`, `local-artifact-paths.json`, and `local-helper-paths.json`.
- Retained Shotloom output and local-artifact entries must be marked
  `compatibility.status = "compatibility-era"`,
  `compatibility.owner = "shotloom"`,
  `compatibility.deprecatedBy = "shotloom-task-artifact-resolver"`, and
  `compatibility.primaryStorage = false`.
- `local-helper-paths.json` may be empty, but every retained entry must point to
  an existing source-relative file in this checkout.
- This cleanup does not allow external helper entries. Any future external
  command registry shape needs a separate accepted spec.
- Doctor must fail when a registry points at a missing source file.
- Doctor must fail when core registries contain owners or makers that are not
  allowlisted.
- The current allowlist is:
  - output `madeBy`: `workflow:*`, an existing `kc-*` skill under
    `skills/<madeBy>/SKILL.md`, or a documented Shotloom compatibility maker
  - local artifact `owner`: `ah` or documented Shotloom compatibility storage
  - helper `path`: an existing source-relative path under `bin/`, `scripts/`,
    or `skills/kc-*`
- Every retained `outputs.json` template path must exist in this checkout.
- Every retained `outputs.json` maker that is not prefixed with `workflow:` or
  documented as Shotloom compatibility must match `kc-*` and resolve to an
  existing skill directory in this checkout.
- Retained durable output paths must match current Knitten generic document
  locations unless the entry is a section of another retained output.
- Validation should remain mechanical: no word bans, no semantic guesses, and
  no rejection of historical docs.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node --check scripts/doctor.mjs`
- `node --check scripts/validate-repository-shell.mjs`
- `node scripts/resolve-output.mjs --kind=review-json --name=output-health-smoke`
- Manual scan: `rg -n 'CINEV|cci|agent/lib|skills/shotloom|skills/cci' agent/config scripts docs/guidelines README.md SYSTEM.md skills -S`
- Compatibility scan: `rg -n 'shotloom' agent/config docs/guidelines README.md SYSTEM.md skills -S`

## Acceptance Criteria

- `agent/config/local-helper-paths.json` contains no missing source paths.
- Core registries contain only entries allowed by the contract allowlist.
- `outputs.json` and `local-artifact-paths.json` remain present as compatibility
  registries, and Shotloom entries are retained only when documented as active
  compatibility contracts.
- Retained Shotloom entries include compatibility metadata with
  `primaryStorage=false`; adding a new unmarked Shotloom entry fails doctor and
  repository-shell validation.
- `outputs.json` contains no non-`workflow:` `madeBy` value unless
  `<madeBy>` matches `kc-*` and `skills/<madeBy>/SKILL.md` exists, or the maker
  is documented as Shotloom compatibility.
- `outputs.json` contains no retained template path that is missing from the
  checkout.
- `local-helper-paths.json` contains no retained helper path outside `bin/`,
  `scripts/`, or `skills/kc-*`.
- `local-helper-paths.json` remains present as a compatibility registry; it may
  contain zero entries.
- `node scripts/doctor.mjs` fails before the cleanup on a synthetic missing
  helper entry and passes after valid entries are restored.
- `node scripts/doctor.mjs` fails before the cleanup on a synthetic
  undocumented domain registry entry and passes after valid entries are
  restored.
- `scripts/resolve-output.mjs` still resolves existing generic kinds, including
  `spec`, `design-plan`, `review-json`, `response-json`, and
  `operational-finding-json`.
- Historical specs may still mention old Shotloom or legacy routing context.
- No payload helper implementation is copied into Knitten to satisfy a stale
  registry entry.
- Compatibility output ids such as `shotloom-task-activity-log` resolve from
  both source and installed Knitten copies.

## Open Questions

- None.

## Design Plan

### Inputs

- Review findings from the routing triad pass.
- Current `doctor` and `validate-repository-shell` checks.
- `docs/guidelines/plugin-boundary.md`.
- `docs/guidelines/plugin-boundary-pr-check.md`.
- `agent/config/*.json`.
- `scripts/doctor.mjs`.
- `scripts/validate-repository-shell.mjs`.

### Outputs

- Cleaned and documented output registry files.
- Doctor checks for helper reachability, installed-copy drift, and
  undocumented core/payload boundary violations.
- Validation evidence from the commands listed above.

### Implementation Sequence

#### 1. Classify Registry Entries

Files:

- `agent/config/local-helper-paths.json`
- `agent/config/outputs.json`
- `agent/config/local-artifact-paths.json`

Status: implemented for current helper reachability; still active for
compatibility documentation and metadata enforcement.

Changes:

- Classify each entry as generic KC, documented Shotloom compatibility, stale,
  or unresolved.
- Keep generic KC entries and documented compatibility outputs allowed by the
  contract.
- Add compatibility metadata to every retained Shotloom output or local-artifact
  entry.
- Remove or defer CINEV-specific helper paths, missing helper paths, and
  payload skill paths from Knitten core registries rather than recreating
  payload behavior in core.
- Preserve the registry files themselves as compatibility surfaces, even when a
  cleaned registry has zero entries.

Risk:

- A payload workflow may still assume an undocumented core registry entry
  exists.

Proof:

- A before/after count of registry entries by owner or maker.
- Manual confirmation that retained Shotloom entries are compatibility outputs,
  not payload helper implementations.
- Synthetic unmarked Shotloom entries fail validation.

#### 2. Strengthen Doctor Checks

Files:

- `scripts/doctor.mjs`

Status: implemented for current registry reachability, ownership allowlist, and
installed-copy checks; remaining work is explicit Shotloom compatibility
documentation.

Changes:

- Add a check that every source-relative helper path in
  `local-helper-paths.json` exists.
- Add a check that `outputs.json` and `local-artifact-paths.json` contain only
  the owners and makers named in the contract allowlist.
- Add a check that retained `outputs.json` template paths exist.
- Add a check that retained non-`workflow:` `outputs.json` makers resolve to an
  existing `kc-*` skill directory unless documented as Shotloom compatibility.
- Add a check that retained helper paths stay inside the contract allowlist.
- Keep failures concrete by reporting the entry id and path or owner that
  violates the contract.

Risk:

- The allowlist may become too broad if Shotloom compatibility is not documented
  per output family.

Proof:

- `node scripts/doctor.mjs` reports new check ids and passes on the cleaned
  registry.
- Temporary synthetic invalid entries fail the new checks during implementation
  testing, then are removed.

#### 3. Tighten Repository Shell Validation

Files:

- `scripts/validate-repository-shell.mjs`

Status: implemented for current registry shape and allowlist checks.

Changes:

- Keep `agent/config/*.json` allowed as durable core files.
- Add mechanical checks for disallowed or undocumented owners, makers, or helper
  path prefixes in active config files.
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

- `node scripts/resolve-output.mjs --skill=kc-draft-spec --name=output-health-smoke`
- `node scripts/resolve-output.mjs --skill=kc-report-finding --name=output-health-smoke`
- `node scripts/resolve-output.mjs --kind=review-json --name=output-health-smoke`

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

- Contract: verify active registries only contain reachable generic core output
  and local-artifact entries.
- Boundary: verify no Shotloom, CINEV, or payload helper behavior is copied into
  Knitten to make validation pass.
- Validation: require doctor, shell validation, Node syntax checks, and generic
  resolver smoke output.
