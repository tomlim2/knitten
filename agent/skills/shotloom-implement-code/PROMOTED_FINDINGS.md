# Promoted Findings: Implementation Layer

This ledger contains operational findings promoted into Shotloom implementation
workflows. Read it during `/shotloom-implement-code` before editing source, and
use matching entries as implementation constraints.

## Active Entries

### Defer broad tests during small-edit iteration

- Source: `docs/briefings/operational-findings/reports/20260527-avoid-broad-test-runs-during-active-small-edit-iteration.md`
- Trigger: implementation is in active small-edit UI, copy, or style iteration.
- Check: use targeted validation for the changed behavior during iteration and
  reserve broad gates for commit, review-before-pr, make-pr, or explicit user
  request.
- Fix Shape: run the nearest focused test or check after behavior changes, then
  name the broader gate point instead of repeatedly running the whole suite for
  tiny edits.
- Status: active

### Execute proof obligations before implementation handoff

- Source: recent approved Shotloom PR layer analysis, 2026-05-28.
- Trigger: implementation consumes a spec or review finding that names tests,
  fixtures, validators, matrix rows, or acceptance checks.
- Check: build a proof ledger before editing and verify each row is passed,
  failed, or explicitly `not-run` with reason and owner before reporting done.
- Fix Shape: run targeted proof commands or add the missing fixture/check; if a
  high-risk surface has no proof obligation, route back to spec review instead
  of implementing from intent.
- Status: active
