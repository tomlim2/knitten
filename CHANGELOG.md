# Changelog

## Unreleased

- Added a public repository readiness spec for the external-facing README,
  measured proof block, quickstart, minimal domain-plugin example, and GitHub
  metadata checklist.
- Reworked README positioning around lightweight shared skills, domain plugins,
  measured context loading, and "avoid unnecessary context/work" claim
  guardrails.
- Added a minimal domain-plugin example and public metadata guidance for GitHub
  About/topics/release wording.
- Updated repository validation and CI output-path checks for the public
  example and current `.agent-local/workflow` runtime path.

## v0.1.6 - 2026-06-27

- Reframed Knitten Core as a lightweight shared skill core with domain plugins,
  focusing on avoiding unnecessary context and implementation work.
- Removed remaining active old route-selection names from KC README, docs, skill
  guidance, eval notes, and scripts while leaving historical specs intact.
- Tightened KC review/implementation guidance around existing helpers,
  native/standard-library behavior, and avoiding unnecessary dependencies.
- Added a post-cleanup release and exposure-audit spec for KC/KSL/KAS.
- Added explicit match checks to the remaining KC workflow skills after
  parallel low-model skill testing.
- Added a fix spec for the KC/KAS/Unreal parallel skill-test findings.
- Simplified KC's external README/About wording around shared workflows,
  domain plugins, match checks, and deferred context.
- Renamed active KC contracts toward shared workflow, domain plugin, workflow
  template, and match-check names, while keeping legacy CLI aliases for
  compatibility.

## v0.1.3 - 2026-06-16

- Added context-load smoke eval coverage for KC review match
  surfaces.
- Added local output entries and templates for Shotloom RCA briefings, task
  activity, and prepare-task briefings.
- Added `kc-log-usage` for local usage journaling and refreshed KC review/report
  guidance.
- Refreshed domain-plugin integration, token-efficient skill loading, and
  repository shell validation docs.
- Updated repository shell validation to allow the changelog in the compact
  plugin shell.

## v0.1.2 - 2026-06-11

- Slimmed Knitten Core to the compact KC skill set.
- Removed `kc-promote-reference` from Core so domain plugins own their own
  promoted-reference CRUD.
- Added `Use for:` lines to active KC skills for cheaper shallow discovery.
- Added `docs/guidelines/skill-authoring.md` for short, token-conscious skill
  authoring.
- Added domain-plugin integration guidance for connecting domain skills,
  workflow indexes, and shared match checks.
- Updated Core docs and draft-spec guidance to point new skill work at the
  authoring and classification guidelines.
- Refreshed the local plugin copy and verified `node scripts/doctor.mjs`.
