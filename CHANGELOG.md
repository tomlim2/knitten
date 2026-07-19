# Changelog

## Unreleased

- Updated `review-fix-loop` to fix grounded, locally actionable P3 and
  documentation findings after blockers while keeping P3 non-blocking for
  readiness.
- Tightened active skill wording for low-model match checks and removed
  domain-specific examples from generic guidance.

## v0.1.7 - 2026-06-28

- Focused the README, plugin manifest, and public metadata on Knitten itself as
  a compact checked workflow core.
- Renamed exposed core skills to concise names such as `implement`, `review`,
  and `draft-spec`, and removed active old core-prefix naming from source, installed
  copies, and the Codex cache.
- Kept the public proof block current: 7 skills, about 111 list tokens, about
  3282 `SKILL.md` tokens, and a 20/20 context-load smoke eval with 63.0%
  average savings.
- Added and validated public readiness, skill audit, and follow-up audit records
  for `implement`, `draft-spec`, `review`, and `report-finding`.
- Tightened repository validation, output-path checks, match checks, and
  cache-drift diagnostics for the current `.agent-local/workflow` runtime.
- Recorded the validator-promotion decision: mechanical repository checks
  stay automated while judgment-heavy skill quality checks stay in human audit.

## v0.1.6 - 2026-06-27

- Reframed Knitten Core as a lightweight shared skill core with domain plugins,
  focusing on avoiding unnecessary context and implementation work.
- Removed remaining active old selection-layer names from Knitten Core README, docs, skill
  guidance, eval notes, and scripts while leaving historical specs intact.
- Tightened Knitten Core review/implementation guidance around existing helpers,
  native/standard-library behavior, and avoiding unnecessary dependencies.
- Added a post-cleanup release and exposure-audit spec for Knitten Core and
  companion plugins.
- Added explicit match checks to the remaining Knitten Core workflow skills after
  parallel low-model skill testing.
- Added a fix spec for companion-plugin parallel skill-test findings.
- Simplified Knitten Core external README/About wording around shared workflows,
  domain plugins, match checks, and deferred context.
- Renamed active Knitten Core contracts toward shared workflow, domain plugin, workflow
  template, and match-check names, while keeping legacy CLI aliases for
  compatibility.

## v0.1.3 - 2026-06-16

- Added context-load smoke eval coverage for Knitten Core review match
  surfaces.
- Added local output entries and templates for domain RCA briefings, task
  activity, and prepare-task briefings.
- Added `log-usage` for local usage journaling and refreshed Knitten Core review/report
  guidance.
- Refreshed domain-plugin integration, token-efficient skill loading, and
  repository shell validation docs.
- Updated repository shell validation to allow the changelog in the compact
  plugin shell.

## v0.1.2 - 2026-06-11

- Slimmed Knitten Core to the compact Knitten Core skill set.
- Removed `promote-reference` from Core so domain plugins own their own
  promoted-reference CRUD.
- Added `Use for:` lines to active Knitten Core skills for cheaper shallow discovery.
- Added `docs/guidelines/skill-authoring.md` for short, token-conscious skill
  authoring.
- Added domain-plugin integration guidance for connecting domain skills,
  workflow indexes, and shared match checks.
- Updated Core docs and draft-spec guidance to point new skill work at the
  authoring and classification guidelines.
- Refreshed the local plugin copy and verified `node scripts/doctor.mjs`.
