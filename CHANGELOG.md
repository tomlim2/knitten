# Changelog

All notable changes to Knitten are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-05-18

**Release type:** major
**Range:** `v3.1.0..v4.0.0`
**Commit count:** 323
**Tagged commit:** `f82e454`
**Superseded tag:** `v3.2.0` points to `f82e454`; `v4.0.0` is the release tag for this range because it contains path and name contract changes.

### Breaking Changes

- Moved shared harness-owned artifacts from `claude/` to `agent/`.
- Renamed agent-hub-owned command and skill namespaces from `caol-*` to `ah-*`.
- Split harness entry documents into `SYSTEM.md`, `CLAUDE.md`, `AGENTS.md`, and `AGENT-HUB.md`.
- Reclassified `agent/` as the canonical shared layer source and `~/.claude/` as a deploy target.
- Replaced active hardcoded local path assumptions with registry-backed path resolution.

### Added

- Added cross-platform harness deployment support for Claude Code, Codex, and Pi Coding Agent.
- Added agent hub manifest, route registry, taxonomy registry, and generated drift checks.
- Added task context routing pilots and coverage for route domains, repo keys, task types, and exclusions.
- Added skill context manifests and deterministic router validation.
- Added work-routing skills for review, planning, and implementation requests.
- Added spec lifecycle validator, lifecycle-managed spec paths, and milestone/spec management skills.
- Added implementation review and shared artifact CRUD routing skills.
- Added Obsidian contract validation, project-doc structure cleanup, and vault path configuration.

### Changed

- Consolidated shared rules, standards, skills, commands, config, hooks, and templates under `agent/`.
- Updated README and AGENT-HUB generated views to match the agent hub registries.
- Moved reusable standards into owning skill reference folders where the skill is the primary consumer.
- Hardened LLM-first document policy, auto rules, route validation, and generated-document checks.
- Reworked Shotloom task planning and review skills around durable specs, risk maps, and review handoffs.
- Renamed local system references toward Knitten while preserving the `agent-hub` repo key and route identity.

### Fixed

- Fixed Claude and Codex symlink setup logic.
- Fixed Pi deploy target path handling and frontmatter validation conflicts.
- Fixed object-shaped repo path support in skills.
- Fixed triggered-rule cold-start loading behavior.
- Fixed malformed Obsidian frontmatter detection and note-contract cleanup issues.
- Fixed Shotloom review passes, planning gates, and PR-diff review scope.

### Validation

- `node scripts/validate-llm-first.mjs` passed for the release range before tagging.
- `git diff --check` and `git diff --cached --check` passed before the release commits.
- `v4.0.0^{}` resolves to `f82e454`.

[4.0.0]: https://github.com/tomlim2/knitten/compare/v3.1.0...v4.0.0
