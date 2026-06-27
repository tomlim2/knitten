# Changelog

## v0.1.3 - 2026-06-16

- Added context-load smoke eval coverage for KC review activation
  surfaces.
- Added local output entries and templates for Shotloom RCA briefings, task
  activity, and prepare-task briefings.
- Added `kc-log-usage` for local usage journaling and refreshed KC review/report
  guidance.
- Refreshed adapter integration, token-efficient skill loading, and repository
  shell validation docs.
- Updated repository shell validation to allow the changelog in the compact
  plugin shell.

## v0.1.2 - 2026-06-11

- Slimmed Knitten Core to the compact KC skill set.
- Removed `kc-promote-reference` from Core so payload plugins own their own
  promoted-reference CRUD.
- Added `Use for:` lines to active KC skills for cheaper shallow discovery.
- Added `docs/guidelines/skill-authoring.md` for token-aware activation-shell
  skill authoring.
- Added adapter integration guidance for connecting payload adapters, exposed
  skills, workflow indexes, and shared activation gates.
- Updated Core docs and draft-spec guidance to point new skill work at the
  authoring and classification guidelines.
- Refreshed the local plugin copy and verified `node scripts/doctor.mjs`.
