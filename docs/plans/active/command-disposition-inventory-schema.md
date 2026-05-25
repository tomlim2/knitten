---
status: active
created: 2026-05-26
updated: 2026-05-26
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Command Disposition Inventory Schema

## Purpose

Add reviewed command-retirement fields to artifact inventory so command rows can
leave generic `migrate-later` state only after a documented disposition exists.

## Problem

`command-retirement-plan` defines command final states and deletion gates, but
`agent/config/artifact-inventory.json` currently has no command-specific fields.
As a result, command rows can only express broad artifact status through
`classification-stage`, `proposed-destination`, `compatibility-need`, and
`review-state`.

That is not enough to distinguish a compatibility wrapper from a domain-pack
candidate, a rewrite-needed command, or a deletion candidate.

## Goals

1. Add command-specific optional fields for command artifact rows.
2. Keep non-command artifact rows unchanged.
3. Generate reviewed dispositions for the initial command batches from
   `command-retirement-plan`.
4. Validate enum values and required owner evidence for reviewed command rows.
5. Keep physical command deletion out of this task.

## Non-Goals

1. Do not delete or rewrite command files.
2. Do not move commands into artifact packs.
3. Do not decide every final command owner beyond the initial reviewed batch.
4. Do not change skill row or extraction row contracts.
5. Do not add Claude slash-command adapter shims yet.

## Current State

| Surface | Current state | Evidence |
|---------|---------------|----------|
| Command count | 40 command files exist after command retirement deletion batch 0. | `find agent/commands -maxdepth 1 -type f -name '*.md' \| wc -l` |
| Inventory schema | Artifact rows have no command-specific fields. | `agent/config/artifact-inventory.schema.json` |
| Generator | Commands are emitted as generic artifact rows. | `scripts/generate-artifact-inventory.mjs` |
| Validator | Artifact inventory check validates common fields but no command disposition fields. | `scripts/validate-llm-first.mjs` |
| Parent spec | Command final states and deletion gates are defined. | `docs/plans/active/command-retirement-plan.md` |

## Proposed Design

### Command Row Fields

Add these fields only when `artifact-type: command`.

| Field | Values | Required when |
|-------|--------|---------------|
| `command-disposition` | `skill-owned-wrapper`, `router-owned-alias`, `rewrite-needed`, `pack-owned-candidate`, `shim-or-delete`, `deletion-candidate`, `unreviewed` | every command row |
| `command-owner` | artifact id, skill name, pack owner label, or `unknown` | every command row |
| `command-final-state` | `skill-owned-wrapper`, `alias-shim`, `pack-owned`, `rewritten-as-skill`, `deleted`, `undecided` | every command row |
| `command-review-batch` | `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, or `unbatched` | every command row |

Mapping rules:

| Disposition | Classification stage | Proposed destination | Compatibility need |
|-------------|----------------------|----------------------|--------------------|
| `skill-owned-wrapper` | `migrate-later` | `migrate-later` | `shim` |
| `router-owned-alias` | `migrate-later` | `migrate-later` | `alias` |
| `rewrite-needed` | `migrate-later` | `migrate-later` | `unknown` |
| `pack-owned-candidate` | `pack-candidate` | `domain-pack` or `knitten-private-pack` | `unknown` |
| `shim-or-delete` | `migrate-later` | `migrate-later` | `shim` |
| `deletion-candidate` | `deprecated` | `deprecated` | `none` |
| `unreviewed` | `migrate-later` | `migrate-later` | `unknown` |

`command-final-state: deleted` is allowed only after the command file is gone
and a historical report records the deletion proof.

### Initial Reviewed Batch Source

Use `command-retirement-plan` initial batch rows as generator input constants.
Do not infer dispositions from command names alone.

| Batch | Generator output |
|-------|------------------|
| A | explicit `skill-owned-wrapper` rows with owning CCI skills |
| B | explicit `rewrite-needed` or `router-owned-alias` rows after manual review |
| C | explicit `rewrite-needed` rows after manual review |
| D-H | `pack-owned-candidate` rows only after pack owner label is accepted |
| unreviewed commands | `unreviewed` and `migrate-later` |

## Design Plan

S0 - Baseline

Input:
- `agent/commands/*.md`
- `agent/config/artifact-inventory.schema.json`
- `scripts/generate-artifact-inventory.mjs`
- `scripts/validate-llm-first.mjs`
- `docs/plans/active/command-retirement-plan.md`

Output:
- Confirmed command count.
- Current generic command row count.

Non-output:
- No schema edits.
- No generated inventory edits.

Proof:
- Command count and inventory query in Validation.

S1 - Schema

Input:
- Command row fields in this spec.

Output:
- `agent/config/artifact-inventory.schema.json` accepts command artifact rows
  with required command fields.
- Non-command artifact rows reject command-only fields.

Non-output:
- No generator classifications yet.

Proof:
- Schema parse.
- Full validator.

S2 - Generator

Input:
- Initial reviewed batch constants.
- Existing artifact row generation.

Output:
- `scripts/generate-artifact-inventory.mjs` emits command fields for every
  command row.
- Reviewed rows receive the accepted disposition and owner.
- Unreviewed rows remain `migrate-later`.

Non-output:
- No command file body changes.

Proof:
- Regenerated inventory.
- Command disposition distribution query.

S3 - Validator

Input:
- Generated command fields.

Output:
- `artifact-inventory` validator rejects invalid command enum values.
- Validator rejects missing command owner for reviewed dispositions.
- Validator rejects `command-final-state: deleted` while the command file still
  exists.

Non-output:
- No broad command deletion enforcement.

Proof:
- Mutation test or documented manual invalid-row check.
- Full validator.

S4 - Review Report

Input:
- Generated command rows.
- Parent command retirement spec.

Output:
- Report under `docs/plans/reports/command-retirement-plan/` recording command
  disposition distribution, reviewed batch counts, and remaining unreviewed
  commands.

Non-output:
- No physical moves.

Proof:
- Report link from `command-retirement-plan`.

## Validation

| Check | Command |
|-------|---------|
| Command count | `find agent/commands -maxdepth 1 -type f -name '*.md' \| wc -l` |
| Command row count | `node -e "const i=require('./agent/config/artifact-inventory.json'); console.log(i.rows.filter(r=>r['artifact-type']==='command').length)"` |
| Schema parse | `node -e "JSON.parse(require('fs').readFileSync('agent/config/artifact-inventory.schema.json','utf8'))"` |
| Regenerate inventory | `node scripts/generate-artifact-inventory.mjs` |
| Artifact inventory | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |

## Acceptance Criteria

- [x] The milestone links this active spec.
- [x] Command disposition fields and enums are defined.
- [x] Mapping from command disposition to inventory fields is defined.
- [x] Physical command deletion is excluded.
- [x] Spec review evidence exists:
  `docs/plans/reports/command-retirement-plan/spec-review-2026-05-26.md`.
- [ ] Schema accepts command rows with command fields.
- [ ] Generator emits command fields for all command rows.
- [ ] Validator checks command disposition enums and owner evidence.
- [ ] A review report records command disposition distribution.

## Open Decisions

| Decision | Default |
|----------|---------|
| Command owner encoding | Use skill name or pack owner label until artifact ids are stable. |
| Batch B split | Manual review decides which rows are `rewrite-needed` versus `router-owned-alias`. |
| Domain pack destination | Use `knitten-private-pack` for private/company commands until public-safety gates say otherwise. |
