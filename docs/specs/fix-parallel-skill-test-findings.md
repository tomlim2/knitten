# Fix Parallel Skill Test Findings

## Status

Accepted.

## Goal

Fix every actionable finding from the low-model parallel skill sweep across Knitten Core,
KAS, and Knitten Unreal.

## Problem

The read-only sweep found:

- Knitten Core skill convention gaps in `draft-spec`, `log-usage`, `implement`,
  and `status`.
- KAS strict payload boundary failure from an empty local `docs/plans`
  directory.
- KAS false-positive risk in ad-hoc markdown link checks.
- Knitten Unreal placeholder validation still uses old `routing` names.

## Boundary

In scope:

- Add activation frontmatter and Step 0 gates to the four Knitten Core skills reported by
  the sweep.
- Remove the empty local KAS `docs/plans` directory and add a repo-owned skill
  link checker that understands code fences/placeholders.
- Rename Knitten Unreal activation validator surfaces from old `routing` names
  to `activation` names.
- Update affected README/changelog/doctor references.

Out of scope:

- Editing dirty Unreal helper files already present in the working tree.
- Rewriting historical specs.
- Changing KSL, which passed the sweep.
- Adding new external dependencies.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Parallel sweep results | Yes | Source findings to fix. |
| Existing repo validators | Yes | Local validation commands and naming conventions. |
| Dirty Unreal status | Yes | Files that must not be touched. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Knitten Core skill gate edits | durable | All active Knitten Core skills have explicit activation gates. |
| KAS boundary/link-check cleanup | durable/local | Strict boundary passes locally and link checking is repeatable. |
| Unreal activation naming cleanup | durable | Placeholder validator naming matches current activation language. |
| Validation evidence | local | Commands proving each edited repo still passes. |

## Contract

- Knitten Core mutation-capable skills must say when to proceed, when to stop, and when
  not to read later instructions.
- KAS link checking must ignore markdown links inside fenced code blocks and
  placeholder destinations such as `{url}`.
- KAS strict boundary must pass after removing empty local-only disallowed
  directories.
- Unreal changes must avoid dirty files listed by `git status`.
- No KSL changes are needed.

## Validation

- Knitten Core: `python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .`
- Knitten Core: `node scripts/validate-repository-shell.mjs`
- Knitten Core: `node scripts/doctor.mjs`
- KAS: `node scripts/validate-activation.mjs`
- KAS: `node scripts/check-skill-links.mjs`
- KAS: `node scripts/validate-boundary.mjs`
- KAS: `node scripts/doctor.mjs`
- Unreal: `node scripts/validate-activation.mjs`
- Unreal: `node scripts/validate-boundary.mjs --warn-only`
- Unreal: `node scripts/doctor.mjs`
- `git diff --check`

## Acceptance Criteria

- Knitten Core sweep failures are resolved for the four reported skills.
- KAS strict boundary no longer reports `docs/plans`.
- KAS link checker reports no broken active skill links and avoids the previous
  `{url}` false positive.
- Unreal README/doctor/script names use activation wording.
- Dirty Unreal helper files remain untouched.
- Each edited repo is committed and pushed separately.

## Open Questions

- None.

## Design Plan

### Inputs

- `/Users/younsoolim/Desktop/www/knitten`
- `/Users/younsoolim/Desktop/www/knitten-all-skills`
- `/Users/younsoolim/Desktop/www/knitten-unreal`

### Outputs

- Updated Knitten Core `SKILL.md` files.
- New KAS link checker script and doctor integration.
- Removed empty local KAS `docs/plans`.
- Renamed Unreal activation validator and README/doctor references.

### Implementation Sequence

#### 1. Knitten Core Activation Gates

Files:

- `skills/draft-spec/SKILL.md`
- `skills/log-usage/SKILL.md`
- `skills/implement/SKILL.md`
- `skills/status/SKILL.md`

Changes:

- Add `match-check` frontmatter.
- Add concise `Step 0: Match Check` sections.

Risk:

- Overly strict gates could make core skills harder to invoke.

Proof:

- Mechanical search for activation frontmatter and Step 0.

#### 2. KAS Boundary And Link Check

Files:

- `scripts/check-skill-links.mjs`
- `scripts/doctor.mjs`
- `CHANGELOG.md`
- local `docs/plans` directory

Changes:

- Remove empty `docs/plans`.
- Add link checker that strips fenced code blocks and skips placeholder links.
- Add link checker to doctor.

Risk:

- Over-strict link checking could fail valid non-file links.

Proof:

- `node scripts/check-skill-links.mjs`
- `node scripts/validate-boundary.mjs`

#### 3. Unreal Activation Naming

Files:

- `scripts/validate-activation.mjs`
- `scripts/doctor.mjs`
- `README.md`
- `CHANGELOG.md`

Changes:

- Keep activation validation under `validate-activation.mjs`.
- Update doctor check ids/messages and README/changelog text.

Risk:

- Installed copy may still have the old script until materialized.

Proof:

- Materialize, then `node scripts/doctor.mjs`.

### Review Plan

- Contract: every finding maps to a change or documented no-op.
- Boundary: KSL remains untouched and dirty Unreal helper files remain dirty but
  unmodified by this work.
- Validation: all listed commands pass.
