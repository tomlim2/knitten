# Changelog

## v0.1.2 - 2026-06-11

- Slimmed Knitten Core to the compact KC skill set.
- Removed `kc-promote-reference` from Core so payload plugins own their own
  promoted-reference CRUD.
- Added `Use for:` lines to active KC skills for cheaper shallow discovery.
- Added `docs/guidelines/skill-authoring.md` for token-aware activation-shell
  skill authoring.
- Added `docs/guidelines/routing-integration.md` for connecting payload routers,
  leaf skills, route maps, and shared activation gates.
- Updated Core docs and draft-spec guidance to point new skill work at the
  authoring and routing guidelines.
- Refreshed the local plugin copy and verified `node scripts/doctor.mjs`.
