---
status: active
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Bootstrap Skill Definition Selection

## Purpose

Define Knitten bootstrap skill criteria and classify the current core-owned
agent-hub skills before generator rules or artifact-pack migration consume
`core-skill-role`.

## Problem

`agent/config/artifact-inventory.json` already emits `core-skill-role`, and the
previous generator default classified most `ah-*` skills as `bootstrap`. That
default was too broad for artifact-pack migration.

Without a reviewed definition, migration specs lack evidence to distinguish
lifecycle, router, support, and private workflow skills.

## Goals

| Goal | Acceptance |
|------|------------|
| Define bootstrap skill criteria. | The spec lists deterministic `bootstrap`, `router`, `lifecycle`, `support`, `pack`, `none`, and `migrate-later` rules. |
| Select current bootstrap skills. | The spec records a first reviewed decision table for core-owned skills. |
| Mark bootstrap candidate disposition. | Each bootstrap-skill candidate has `keep`, `rewrite`, `create-new`, `exclude`, or `undecided`. |
| Identify generator changes. | The spec names which generator defaults need replacement. |
| Implement reviewed generator output. | The generator emits reviewed roles and migrate-later fields for this batch. |
| Preserve pre-pack safety. | Skills required before any pack loads stay in core. |
| Defer artifact movement. | No skill files move into packs in this spec. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not manually edit `agent/config/artifact-inventory.json`. | generated output only |
| Do not move skills into packs. | `artifact-repo-migration-plan` |
| Do not split skill bodies. | `thin-skill-guide-boundary` |
| Do not split skill bodies. | `thin-skill-guide-boundary` |
| Do not define artifact manifests. | `artifact-pack-manifest-contract` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Core-owned skill rows | 29 current skill rows plus 2 blocked extraction rows exist. | `core skill rows` command in Validation |
| Current roles | 2 `bootstrap`, 4 `router`, 15 `lifecycle`, 8 `none`, and 2 missing role extraction rows. | `current role distribution` command in Validation |
| Generator mapping | `classifyCoreSkillRole()` uses reviewed `ah-*` mappings and returns `none` for unmapped `ah-*` skills. | `scripts/generate-artifact-inventory.mjs` |
| Boundary rule | Bootstrap, router, lifecycle, installer, validator, resolver, and safety skills can stay core. | `docs/plans/active/core-artifact-boundary.md` |
| Public core transition | Core keeps bootstrap, lifecycle, routing, validation, resolver, installer, and safety infrastructure. | `docs/plans/proposed/knitten-core-public-transition.md` |

## Role Criteria

Apply privacy and review-state gates before role selection:

| If | Then |
|----|------|
| `review-state: blocked` | Keep `core-skill-role` unchanged for current skill rows; do not add `core-skill-role` to extraction rows; set `classification-stage: migrate-later` and `proposed-destination: migrate-later` when generator emission is implemented. |
| `privacy-risk: private-only` or `needs-scrub` | Do not select as public bootstrap until scrub gates pass. |

Apply the first matching role rule:

| Priority | Criteria | Role |
|----------|----------|------|
| 1 | Required to locate, load, validate, install, or repair core before any pack loads. | `bootstrap` |
| 2 | Required to route implementation, planning, review, path resolution, or report capture before pack selection. | `router` |
| 3 | Required to create, update, delete, audit, or review core artifacts after core loads. | `lifecycle` |
| 4 | Required only for optional human briefing, logging, browsing, private guidance, or permission toggles. | `support` |
| 5 | Required only after a repo, domain, company, or personal route is selected. | `pack` |
| 6 | No current pre-pack dependency and no lifecycle dependency. | `none` |

`support` is a reviewed decision label in this spec. The inventory enum does not
contain `support`; generator implementation maps reviewed `support` rows to
`core-skill-role: none`.

`pack` is a reviewed decision label in this spec. Generator implementation maps
reviewed `pack` rows to an existing enum: `domain` for reusable domain packs,
`repo-specific` for one-repo packs, and `none` when the pack owner is not yet
known.

## Bootstrap Selection Rules

| Skill shape | Keep as bootstrap | Do not mark bootstrap |
|-------------|-------------------|-----------------------|
| setup harness | yes, if it connects the harness to shared layers | no, if it is provider-specific after install |
| doc path resolver | yes, if specs and reports need it before pack selection | no, if it resolves only one domain path |
| route selector | yes, if it prevents broad context loading before task routing | no, if it routes only one domain |
| artifact manager | no, classify as lifecycle unless core cannot repair itself without it | no, if it only creates optional artifacts |
| audit/review skill | no, classify as lifecycle unless it is the only safe gate before mutation | no, if it reviews one domain |
| permission toggle | no, classify as support unless installer cannot run without it | no, if it is a harness convenience |
| browse/list skill | no, classify as support unless route selection depends on it | no, if it is only discovery UX |

## First Reviewed Skill Batch

Source query:

```bash
node -e "const i=require('./agent/config/artifact-inventory.json'); console.log(i.rows.filter(r=>r['artifact-type']==='skill' && r['owner-domain']==='core'))"
```

Decision labels:

| Reviewed decision | Generator action |
|-------------------|------------------|
| `bootstrap` | Emit `core-skill-role: bootstrap`. |
| `router` | Emit `core-skill-role: router`. |
| `lifecycle` | Emit `core-skill-role: lifecycle`. |
| `support` | Emit `core-skill-role: none`. |
| `pack` | Emit `core-skill-role: domain`, `repo-specific`, or `none` using owner evidence. |
| `none` | Emit `core-skill-role: none`. |
| `migrate-later` | Keep current path; set `classification-stage: migrate-later` and `proposed-destination: migrate-later`. |

Disposition labels:

| Disposition | Meaning |
|-------------|---------|
| `keep` | Existing skill remains in core with the reviewed decision. |
| `rewrite` | Existing skill needs a scoped rewrite before generator migration. |
| `create-new` | Existing coverage is missing; create a new skill before migration. |
| `exclude` | Existing skill is not a bootstrap candidate for core migration. |
| `undecided` | Evidence is insufficient; do not migrate. |

Path prefix: `agent/skills/`.

### Keep

| Skill | Current role | Reviewed decision | Disposition | Reason |
|-------|--------------|-------------------|-------------|--------|
| `ah-setup-harness` | `bootstrap` | `bootstrap` | `keep` | Connects external harnesses to shared layers. |
| `ah-resolve-doc-path` | `bootstrap` | `bootstrap` | `keep` | Resolves spec and report storage before pack selection. |
| `ah-route-plan` | `router` | `router` | `keep` | Routes planning requests before domain skills load. |
| `ah-route-review` | `router` | `router` | `keep` | Routes review requests before domain review skills load. |
| `ah-route-implementation` | `router` | `router` | `keep` | Routes implementation requests before domain skills load. |
| `ah-report-finding` | `bootstrap` | `router` | `keep` | Captures operational findings before promotion routing. |
| `ah-manage-artifact` | `lifecycle` | `lifecycle` | `keep` | Routes shared artifact lifecycle work. |
| `ah-manage-config` | `lifecycle` | `lifecycle` | `keep` | Maintains core config and machine templates. |
| `ah-manage-document-template` | `lifecycle` | `lifecycle` | `keep` | Maintains document templates. |
| `ah-manage-milestone` | `lifecycle` | `lifecycle` | `keep` | Maintains milestone lifecycle. |
| `ah-manage-skill` | `lifecycle` | `lifecycle` | `keep` | Maintains skill lifecycle. |
| `ah-make-rule` | `lifecycle` | `lifecycle` | `keep` | Creates shared rules. |
| `ah-make-skill` | `lifecycle` | `lifecycle` | `keep` | Creates shared skills. |
| `ah-make-standard` | `lifecycle` | `lifecycle` | `keep` | Creates shared standards. |
| `ah-update-skill` | `lifecycle` | `lifecycle` | `keep` | Updates shared skills. |
| `ah-edit-skill` | `bootstrap` | `lifecycle` | `keep` | Edits existing shared skills after core loads. |
| `ah-delete-skill` | `bootstrap` | `lifecycle` | `keep` | Deletes shared skills after reference checks. |
| `ah-audit-skill` | `bootstrap` | `lifecycle` | `keep` | Reviews skill bodies after selection. |
| `ah-review-implementation` | `bootstrap` | `lifecycle` | `keep` | Reviews implementation diffs after work exists. |

### Exclude

| Skill | Current role | Reviewed decision | Disposition | Reason |
|-------|--------------|-------------------|-------------|--------|
| `ah-brief-today` | `bootstrap` | `support` | `exclude` | Human-facing daily briefing, not pre-pack bootstrap. |
| `ah-browse-standards` | `bootstrap` | `support` | `exclude` | Discovery UX for standards. |
| `ah-grant-perms` | `bootstrap` | `support` | `exclude` | Permission convenience, not required to load packs. |
| `ah-revoke-perms` | `bootstrap` | `support` | `exclude` | Permission convenience, not required to load packs. |
| `ah-guide-private` | `bootstrap` | `support` | `exclude` | Private-folder guidance, not public bootstrap. |
| `ah-log-postmortem` | `bootstrap` | `support` | `exclude` | Completed project logging, not pre-pack bootstrap. |
| `ah-show-patterns` | `bootstrap` | `support` | `exclude` | Pattern browsing, not pre-pack bootstrap. |

### Rewrite

| Skill | Current role | Reviewed decision | Disposition | Reason |
|-------|--------------|-------------------|-------------|--------|
| `ah-manage-spec` | `lifecycle` | `migrate-later` | `rewrite` | Blocked review state and split-ready body. |

### Undecided

| Row id | Current role | Reviewed decision | Disposition | Reason |
|--------|--------------|-------------------|-------------|--------|
| `extraction:agent/skills/ah-manage-spec/SKILL.md#archive-delete-policy` | missing | `migrate-later` | `undecided` | Blocked extraction row; do not add `core-skill-role`. |
| `extraction:agent/skills/ah-manage-spec/SKILL.md#review-checklist` | missing | `migrate-later` | `undecided` | Blocked extraction row; do not add `core-skill-role`. |

## Gap Table

| Gap | Decision |
|-----|----------|
| Harness setup | keep `ah-setup-harness` |
| Spec/report path resolution | keep `ah-resolve-doc-path` |
| Planning route selection | keep `ah-route-plan` |
| Review route selection | keep `ah-route-review` |
| Implementation route selection | keep `ah-route-implementation` |
| Operational finding intake | keep `ah-report-finding` |
| Shared artifact lifecycle | keep `ah-manage-artifact` |
| Config lifecycle | keep `ah-manage-config` |
| Milestone lifecycle | keep `ah-manage-milestone` |
| Skill lifecycle | keep `ah-manage-skill` |
| Rule/skill/standard creation | keep `ah-make-rule`, `ah-make-skill`, `ah-make-standard` |
| New bootstrap skill required | none |
| New router skill required | none |
| New lifecycle skill required | none |
| Blocked lifecycle replacement | Resolve `ah-manage-spec` split-ready body before generator migration. |

## Generator Change Contract

| Current behavior | Required replacement |
|------------------|----------------------|
| `ah-*` default maps to `bootstrap`. | Use explicit skill-name mapping for reviewed skills; map unmapped `ah-*` skills to `none`. |
| Extraction rows do not accept `core-skill-role`. | Do not emit `core-skill-role` for extraction rows. |
| `support` has no enum value. | Map reviewed `support` rows to `core-skill-role: none`. |
| `pack` has no enum value. | Map reviewed `pack` rows to `domain`, `repo-specific`, or `none` using owner evidence. |
| Blocked current skill rows keep migration ambiguity. | Keep existing `core-skill-role`; set `classification-stage: migrate-later` and `proposed-destination: migrate-later`. |
| Blocked extraction rows keep migration ambiguity. | Do not emit `core-skill-role`; set `classification-stage: migrate-later` and `proposed-destination: migrate-later`. |

## Design Plan

S0 - Baseline

Input:
- `agent/config/artifact-inventory.json`
- `scripts/generate-artifact-inventory.mjs`
- `docs/plans/active/core-artifact-boundary.md`
- `docs/milestones/agent-artifact-pack-system.md`

Output:
- Current core-owned skill row counts.
- Current `core-skill-role` distribution.

Non-output:
- No generator edits.
- No inventory edits.

Failure:
- Stop if no inventory skill fields exist.

Proof:
- Inventory query in Validation.

S1 - Definition and reviewed batch

Input:
- Baseline counts.
- Boundary role criteria.
- Current core-owned skill rows.

Output:
- Active spec with role criteria and first reviewed skill decision table.
- Milestone link to the active spec.

Non-output:
- No skill movement.
- No skill body edits.

Failure:
- Mark rows `migrate-later` when review state blocks safe selection.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`

S2 - Generator follow-up

Input:
- Accepted reviewed decision table.
- Current generator role classifier.

Output:
- Explicit generator mapping for reviewed skills.
- Validator-compatible output for extraction rows and support-role mapping.

Non-output:
- No broad classification for unreviewed domain or repo skills.

Failure:
- Keep current generator behavior until the mapping validates.

Proof:
- `node scripts/generate-artifact-inventory.mjs`
- `node scripts/validate-llm-first.mjs --check artifact-inventory`

## Validation

| Check | Command |
|-------|---------|
| Core skill rows | `node -e "const i=require('./agent/config/artifact-inventory.json'); console.log(i.rows.filter(r=>r['artifact-type']==='skill' && r['owner-domain']==='core').length)"` |
| Current role distribution | `node -e "const i=require('./agent/config/artifact-inventory.json'); const m={}; for (const r of i.rows.filter(r=>r['artifact-type']==='skill' && r['owner-domain']==='core')) m[r['core-skill-role']||'missing']=(m[r['core-skill-role']||'missing']||0)+1; console.log(m)"` |
| Disposition distribution | `node -e "const fs=require('fs'); const s=fs.readFileSync('docs/plans/active/bootstrap-skill-definition-selection.md','utf8'); const m={}; for (const l of s.split('\\n')) { if (!l.startsWith('| `')) continue; const c=l.split('|').slice(1,-1).map(x=>x.trim().replaceAll('`','')); if (c.length===5) m[c[3]]=(m[c[3]]||0)+1; } console.log(m)"` |
| Regenerate inventory | `node scripts/generate-artifact-inventory.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Artifact inventory | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |

## Risks

| Risk | Control |
|------|---------|
| Core becomes too large. | Only pre-pack loading, routing, lifecycle, repair, and validation skills stay core. |
| Bootstrap becomes too small. | Harness setup and routing skills stay bootstrap or router. |
| Support skills move before resolver exists. | This spec records decisions only; migration specs move files later. |
| Generator emits unsupported enum values. | `support` and `pack` stay reviewed labels; generator maps them to existing enum values. |

## Acceptance Criteria

- [x] The spec defines bootstrap, router, lifecycle, support, pack, and none decisions.
- [x] The spec marks bootstrap-skill candidates as keep, rewrite, create-new, exclude, or undecided.
- [x] The spec records the first reviewed core-owned skill batch.
- [x] The spec identifies current generator behavior that must change.
- [x] The generator emits reviewed role and migrate-later fields for this batch.
- [x] The milestone links this active spec.
- [x] The spec defers skill body edits and artifact movement.
- [x] Local validation passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| `support` inventory enum | Map support decisions to `core-skill-role: none`. |
| Inventory provenance validation | Follow up in `artifact-inventory-provenance-validation`. |
| `ah-manage-spec` role | Keep `migrate-later`; resolve blocked review-state and split-ready body before generator migration. |
