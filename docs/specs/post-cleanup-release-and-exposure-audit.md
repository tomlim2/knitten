# Post-Cleanup Release And Exposure Audit

## Status

Accepted.

## Goal

Create short release notes and tags for the current Knitten Core/KSL cleanup state, then
measure and audit the remaining Knitten Core/KSL/KAS skill exposure with the same
lightweight-core framing.

## Problem

Knitten Core and KSL have already removed the old broad pre-selection wording from active
surfaces, but the release state is not lined up with that work:

- Knitten Core and KSL source manifests are ahead of the last pushed tags.
- The user needs a short changelog/release note trail for the cleanup.
- Current-session skill lists may not reflect what a fresh session will load.
- KAS is likely the next large exposure source, so it needs the same measured
  audit before more deletion or movement.
- README, plugin About fields, and marketplace-facing wording should describe
  the direction as a lightweight skill core that avoids unnecessary context and
  implementation work.

## Boundary

In scope:

- Knitten Core release note/changelog and patch version tag.
- KSL release note/changelog and patch version tag.
- Fresh-source exposure measurement for Knitten Core, KSL, and KAS using a documented,
  repeatable command.
- KAS audit notes for descriptions, stale references/specs, and low-value
  exposed skill metadata.
- README and plugin manifest wording for Knitten Core/KSL/KAS where the old framing still
  appears.
- Personal marketplace wording only when it is produced by the plugin
  materialization helpers.

Out of scope:

- Deleting KAS skills without a measured audit and a separate accepted target
  list.
- Editing dirty user work in `knitten-unreal`.
- Rewriting historical specs solely to remove old terminology.
- Changing Codex skill discovery semantics.
- Publishing GitHub Releases through the GitHub UI/API.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Knitten Core latest main commit | Yes | Release/tag target for Knitten Core. |
| KSL latest main commit | Yes | Release/tag target for Knitten Shotloom. |
| `.codex-plugin/plugin.json` | Yes | Source version and marketplace-facing About text. |
| `CHANGELOG.md` | Yes | Durable release note location. |
| `skills/*/SKILL.md` | Yes | Active exposed skill metadata for measurement. |
| `README.md` | Yes | Human-facing framing and install docs. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Knitten Core changelog/version/tag | durable/git | Knitten Core release marker for the cleanup work. |
| KSL changelog/version/tag | durable/git | KSL release marker for the cleanup work. |
| Exposure measurement report | durable | Current source-level token/metadata estimate for Knitten Core/KSL/KAS. |
| KAS audit note | durable | Objective list of likely next trims or no-op findings. |
| Updated README/About wording | durable | Lightweight-core message aligned across active plugin surfaces. |
| Validation evidence | local | Commands proving plugin manifests and scripts still pass. |

## Contract

- Tags must point at commits that contain the matching changelog and source
  manifest version.
- Target tag names are `v0.1.6` for Knitten Core and `v0.1.4` for KSL, matching the next
  patch versions from their current source manifests.
- Release notes stay short and factual; they should summarize the cleanup, not
  restate every historical spec.
- Token/exposure measurement must count at least skill names, descriptions, and
  active `SKILL.md` bodies from source repositories so the result is repeatable
  outside this already-loaded session.
- KAS audit must separate objective measurement from recommended action.
- Wording must avoid promising "always fewer tokens"; the claim is avoiding
  unnecessary implementation and context until a matching skill actually needs
  it.
- Do not stage or commit unrelated dirty user files.

## Validation

- `git status --short --branch`
- `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- Knitten Core: `node scripts/validate-repository-shell.mjs`
- Knitten Core: `node scripts/doctor.mjs`
- KSL: `node scripts/validate-activation.mjs`
- KSL: `node scripts/test-shotloom-skills.mjs`
- KSL: `node scripts/doctor.mjs`
- KAS: `node scripts/doctor.mjs`
- `git diff --check`
- `git tag --list --sort=-version:refname`

## Acceptance Criteria

- Knitten Core has a new patch version, short changelog entry, passing validation, and a
  pushed `v0.1.6` tag.
- KSL has a new patch version, short changelog entry, passing validation, and a
  pushed `v0.1.4` tag.
- A durable exposure report records Knitten Core/KSL/KAS counts and approximate tokens.
- KAS audit identifies whether the next best action is description trimming,
  skill movement, stale reference cleanup, or no-op.
- Active README/About wording frames Knitten as a lightweight skill core plus
  payload adapters rather than a token-efficiency pre-selection system.
- Every implementation cycle is committed before moving to the next major
  cycle.

## Open Questions

- None.

## Design Plan

### Inputs

- `/Users/younsoolim/Desktop/www/knitten`
- `/Users/younsoolim/Desktop/www/knitten-sl`
- `/Users/younsoolim/Desktop/www/knitten-all-skills`
- `/Users/younsoolim/.agents/plugins/marketplace.json`

### Outputs

- Updated changelogs and manifests in Knitten Core/KSL.
- Release tags in Knitten Core/KSL.
- Measurement/audit docs in Knitten Core or the owning payload repo.
- Updated README/About wording where needed.

### Implementation Sequence

#### 1. Release Knitten Core And KSL

Files:

- `CHANGELOG.md`
- `.codex-plugin/plugin.json`

Changes:

- Bump Knitten Core to the next patch version from the current source manifest.
- Bump KSL to the next patch version from the current source manifest.
- Use tag names `v0.1.6` for Knitten Core and `v0.1.4` for KSL.
- Add short changelog entries dated 2026-06-27.
- Validate both plugin manifests and nearest repo checks.
- Commit and tag after validation.

Risk:

- Tagging the wrong commit would make the release note untrustworthy.

Proof:

- `git log -1 --oneline`
- `git tag --points-at HEAD`
- Repository validation commands.

#### 2. Measure Fresh Source Exposure

Files:

- `docs/specs/post-cleanup-exposure-measurement.md`
- Source skill files in Knitten Core/KSL/KAS.

Changes:

- Run a repeatable local measurement that counts exposed skill count,
  name+description characters, active `SKILL.md` characters, and approximate
  tokens.
- Record the command, assumptions, and results.

Risk:

- Source measurement is not identical to a new Codex session, but it avoids the
  already-loaded-session bias and is repeatable.

Proof:

- Measurement command and generated numbers are recorded in the report.

#### 3. Audit KAS And Other Active Payload Text

Files:

- KAS README/manifest/skills.
- Measurement report or KAS audit doc.

Changes:

- Rank KAS exposed skills by description and `SKILL.md` size.
- Identify stale wording, obsolete references, and likely movement/deletion
  candidates without deleting them in this cycle unless the action is clearly
  mechanical and low risk.

Risk:

- Removing or moving skills based only on token size can break useful workflows.

Proof:

- Audit separates "measured" from "recommended".

#### 4. Align Public Wording

Files:

- Knitten Core/KSL/KAS `README.md`.
- Knitten Core/KSL/KAS `.codex-plugin/plugin.json`.
- Local marketplace output after materialization, if refreshed.

Changes:

- Describe Knitten Core as a lightweight shared skill core.
- Describe KSL/KAS as payload adapters/collections that keep detailed context
  outside the core until used.
- Remove active README/About language that still centers broad pre-selection as
  the product claim.

Risk:

- Over-marketing the claim could imply token reductions without measurement.

Proof:

- Targeted text scan plus plugin validation.

### Review Plan

- Contract: release tags, measurement method, KAS audit separation, and wording
  claim all match this spec.
- Boundary: dirty unrelated user files and historical specs are left alone.
- Validation: plugin validation and nearest repo checks pass for every edited
  repo.
