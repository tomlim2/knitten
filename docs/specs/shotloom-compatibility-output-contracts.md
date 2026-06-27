# Shotloom Compatibility Output Contracts

## Status

Implemented.

## Goal

Document why Shotloom-named output and local artifact entries still exist in
Knitten Core, and make the boundary clear for future registry cleanup.

## Contract

Shotloom output entries in Knitten Core are compatibility-era surfaces only.
They are retained so older KSL flows and local task artifacts can resolve
paths while Shotloom task memory migrates to the Shotloom-owned resolver.

Every retained Shotloom entry must have:

- `compatibility.status: "compatibility-era"`
- `compatibility.owner: "shotloom"`
- `compatibility.deprecatedBy: "shotloom-task-artifact-resolver"`
- `compatibility.primaryStorage: false`

New primary Shotloom task memory must not be added to Knitten Core. New primary
Shotloom artifacts should resolve through Shotloom's task artifact resolver or
the owning Shotloom/KSL workflow.

## Current Compatibility Entries

Current counts:

- `agent/config/outputs.json`: 15 Shotloom compatibility entries.
- `agent/config/local-artifact-paths.json`: 23 Shotloom compatibility entries.

Output contract groups:

- planning: start-task brief, planning spec, design plan, questions, manifest
- task: activity log, triad RCA briefing
- before-PR: readiness, code blockers, docs blockers
- PR: cache, reply plan
- deploy: release notes, manifest, rollback

Local artifact groups:

- planning: brief, spec, design plan, questions, manifest
- task: activity, RCA briefing
- before-PR: readiness, code blockers, docs blockers
- PR monitor/cache: watcher pid/log, reaction log, state, last event, cache,
  reply plan, pause marker, lock files
- deploy: release notes, manifest, rollback

## Validator Behavior

`scripts/validate-repository-shell.mjs` and `scripts/doctor.mjs` allow
Shotloom-owned registry entries only when the compatibility metadata matches
this contract.

They should reject:

- Shotloom entries without compatibility metadata,
- Shotloom entries marked as primary storage,
- undocumented Shotloom `madeBy` or local artifact owners,
- unsafe or missing templates.

## Migration Rule

When a compatibility entry is no longer used:

1. Verify the owning Shotloom/KSL flow no longer resolves it.
2. Remove the output entry and matching local artifact path entry together when
   both exist.
3. Keep historical specs as evidence; do not rewrite old history just to remove
   Shotloom names.
4. Run repository validation and `doctor`.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node -e` registry count check from this document's source review
- `git diff --check`
