---
status: completed
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
milestone: spec-lifecycle-system
briefing: ../../briefings/specs/docs-plans-lifecycle-migration.md
---

# Docs Plans Lifecycle Migration

## Purpose

Split the current flat `docs/plans/` workspace into lifecycle-aware locations so
future agents can distinguish active specs, proposed specs, drafts, completed
work, parked work, archived history, and report artifacts without reading the
whole folder.

## Problem

`docs/plans/` is doing several jobs at once:

| Current surface | Evidence | Risk |
|-----------------|----------|------|
| top-level specs | 53 tracked top-level Markdown files | cold-start review has to inspect too much |
| statuses | `open`, `active`, `proposed`, `draft`, `draft-conflict`, `implemented`, `implemented-validation-blocked`, `done`, `parked` | old and new lifecycle terms are mixed |
| report artifacts | 37 tracked nested files under `*-reports/` directories | report data looks like executable plan input |
| consumers | skills, milestones, briefings, taxonomy, naming standards, and validators hardcode `docs/plans/<slug>.md` | physical moves can break CRUD and review flows |

The migration should not be a raw directory move. The path contract has to move
first, then files can move with a manifest and link repair.

## Goals

1. Define the target lifecycle folder structure.
2. Update caol/Knitten spec tooling to resolve specs by slug across lifecycle
   folders.
3. Preserve milestone links, briefing links, and review inference.
4. Generate a move manifest before `git mv`.
5. Move report directories into a report namespace.
6. Add validation so duplicate spec slugs and broken links are caught.

## Non-Goals

1. Do not rename `docs/plans/` to `docs/specs/`.
2. Do not delete specs or report artifacts in this migration.
3. Do not migrate Obsidian vault docs.
4. Do not normalize every legacy status by hand without manifest evidence.
5. Do not leave machine-local absolute paths worse than the current state.

## Current State

Top-level status count, from `awk 'FNR==2 && /^status:/' docs/plans/*.md`:

| Status | Count | Initial lifecycle bucket |
|--------|-------|--------------------------|
| `open` | 26 | manifest review required |
| `implemented` | 8 | `completed/` unless validation-blocked |
| `done` | 7 | `completed/` |
| `active` | 5 | `active/` |
| `proposed` | 3 | `proposed/` |
| `draft` | 1 | `drafts/` |
| `draft-conflict` | 1 | `drafts/` |
| `implemented-validation-blocked` | 1 | `active/` unless blocker is closed |
| `parked` | 1 | `parked/` |

Direct consumers after Batch A include:

| Consumer | Current contract |
|----------|--------------------|
| `agent/skills/caol-manage-spec/SKILL.md` | create and resolve lifecycle paths under `docs/plans/` |
| `agent/skills/caol-manage-milestone/SKILL.md` | link resolved spec paths from milestone tables |
| `agent/skills/caol-review-implementation/SKILL.md` | infer changed specs from `docs/plans/**/*.md` with report exclusions |
| `docs/briefings/specs/README.md` | briefing frontmatter points to the actual spec path |
| `agent/config/taxonomy.json` | validates `docs/plans` recursively |
| `agent/standards/policy/naming.md` | describes `docs/plans/**/*.md` |
| `scripts/validate-llm-first.mjs` | validates spec lifecycle relationships |

## Proposed Structure

```text
docs/plans/
  active/
  proposed/
  drafts/
  completed/
  parked/
  archive/
  reports/
```

Rules:

1. One spec slug may exist only once across lifecycle folders.
2. Report folders move under `docs/plans/reports/<spec-slug>/`.
3. `archive/` is for `archived` and `superseded` specs, not normal completed
   work.
4. New specs should default to `docs/plans/proposed/<slug>.md` unless the user
   asks to start active implementation immediately.
5. Spec lookup by slug must search lifecycle folders before any physical move.

## Proposed Design

### Resolver Contract

Spec CRUD skills should resolve a slug by searching this ordered set:

```text
docs/plans/active/<slug>.md
docs/plans/proposed/<slug>.md
docs/plans/drafts/<slug>.md
docs/plans/parked/<slug>.md
docs/plans/completed/<slug>.md
docs/plans/archive/<slug>.md
docs/plans/<slug>.md
```

If more than one path exists for a slug, stop and report duplicate lifecycle
state. Do not pick one silently.

### Link Strategy

Prefer real link rewrites over flat-path redirect stubs.

Redirect stubs may be used only as a temporary compatibility bridge when a
consumer cannot be migrated in the same batch. If stubs are used, they must have
frontmatter `status: superseded` and a `superseded-by:` target, and the final
batch must remove or archive them explicitly.

### Manifest Shape

Before moving files, generate a tracked or reviewed manifest with:

| Field | Meaning |
|-------|---------|
| `source` | current tracked path |
| `target` | lifecycle target path |
| `slug` | basename without `.md` |
| `status` | current frontmatter status |
| `bucket` | lifecycle bucket |
| `reason` | direct evidence or rule used |
| `needs-review` | true when `open` or ambiguous |

The manifest can be TSV, JSON, or Markdown, but it must be reviewable before
the move batch.

## Execution Plan

### Batch A: Prepare Resolvers

Status: implemented on 2026-05-17.

1. Update `caol-manage-spec` to create under lifecycle folders and resolve slug
   paths across all buckets.
2. Update `caol-review-implementation` changed-file inference from
   `docs/plans/*.md` to `docs/plans/**/*.md` with report exclusions.
3. Update `caol-manage-milestone` link rules to accept nested lifecycle paths.
4. Update `docs/briefings/specs/README.md`, `agent/config/taxonomy.json`,
   `agent/standards/policy/naming.md`, and `README.md`.
5. Add duplicate slug validation for `docs/plans/**/*.md`.

Batch A implementation summary:

| Surface | Result |
|---------|--------|
| `caol-manage-spec` | resolves lifecycle paths and defaults new specs to `proposed/` |
| `caol-review-implementation` | infers changed specs from `docs/plans/**/*.md` with report exclusions |
| `caol-manage-milestone` | links resolved spec paths instead of assuming flat paths |
| `taxonomy` | validates `docs/plans` recursively |
| `spec-lifecycle` | already validates duplicate slugs, milestone links, and intake paths |

### Batch B: Generate Manifest

Status: completed on 2026-05-17.

1. Inventory all tracked `docs/plans` files.
2. Classify top-level Markdown files by status.
3. Mark every `open` file as `needs-review` unless an owner rule maps it to a
   bucket.
4. Map `*-reports/` folders to `docs/plans/reports/<spec-slug>/`.
5. Review the manifest before any file move.

Batch B output:

| File | Result |
|------|--------|
| [move-manifest.tsv](../reports/docs-plans-lifecycle-migration/move-manifest.tsv) | 90 source-to-target rows |
| [manifest-summary.md](../reports/docs-plans-lifecycle-migration/manifest-summary.md) | review summary with counts and `open` list |

Manifest counts:

| Category | Count |
|----------|------:|
| top-level tracked specs | 53 |
| tracked report artifacts | 37 |
| legacy `open` specs requiring review | 26 |

### Batch C: Move And Repair Links

Status: partially implemented on 2026-05-17.

1. Use `git mv` for approved files and report folders.
2. Rewrite milestone links, briefing `spec:` links, skill references, standards,
   README entries, and sibling-spec references.
3. Keep the move batch mechanical and generated from the manifest.
4. Do not delete old specs unless a separate delete gate is satisfied.

Batch C output:

| Result | Count |
|--------|------:|
| approved rows moved | 64 |
| spec files moved | 27 |
| report artifacts moved | 37 |
| legacy `open` specs intentionally held | 26 |
| redirect stubs created | 0 |

Batch C moved only manifest rows whose `needs-review` value was `false`. The
remaining top-level Markdown files are the 26 legacy `open` specs listed in the
manifest summary; they need a separate review/classification pass before moving.

### Batch D: Validate And Review

1. Run full validators and link checks.
2. Run `caol-review-implementation` against this spec.
3. If a temporary redirect stub was used, add a follow-up row with removal
   criteria.

### Batch E: Review Legacy Open Specs

Status: completed on 2026-05-17.

1. Review the 26 legacy top-level `open` specs that Batch C intentionally held.
2. Move specs with implementation evidence to `docs/plans/completed/`.
3. Keep still-actionable work in `docs/plans/active/`.
4. Delete only docs with no useful history or follow-up value.

Batch E output:

| Result | Count |
|--------|------:|
| moved to `completed/` | 25 |
| moved to `active/` | 1 |
| deleted | 0 |
| remaining top-level Markdown specs | 0 |

Review evidence is recorded in
[open-plans-review-summary.md](../reports/docs-plans-lifecycle-migration/open-plans-review-summary.md).

## Validation

Required commands:

```bash
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

Focused checks:

```bash
git ls-files docs/plans
find docs/plans -type f -name '*.md' | sed 's#^docs/plans/##' | sort
```

Add or run a duplicate slug check equivalent to:

```bash
git ls-files 'docs/plans/**/*.md' |
  awk -F/ '{name=$NF; sub(/\\.md$/, "", name); count[name]++; path[name]=path[name] " " $0}
           END {for (name in count) if (count[name] > 1) print name path[name]}'
```

The duplicate slug check must print nothing after the migration.

## Risks

| Risk | Mitigation |
|------|------------|
| skills cannot find moved specs | update resolver contract before moving files |
| milestone links break | rewrite links and add link validation |
| `open` status is ambiguous | classify through manifest review |
| historical reports look executable | move reports under `docs/plans/reports/` |
| broad link rewrite touches runtime logs | use tracked source scope and exclude runtime/session paths |

## Acceptance Criteria

1. This spec exists before any physical `docs/plans/` move.
2. Spec CRUD, milestone CRUD, and implementation review can resolve lifecycle
   paths.
3. A reviewed manifest maps every current top-level spec and report directory.
4. Moved specs have valid links from milestones and briefings.
5. Duplicate spec slugs are validator-detectable.
6. Full validation passes after the migration batch.
7. The final `docs/plans/` root contains only lifecycle directories and
   intentional index/readme files.

## Open Decisions

| Decision | Default |
|----------|---------|
| Should legacy `open` map to `active/` automatically? | no; require manifest review |
| Should flat-path redirect stubs remain? | no; rewrite links instead |
| Should `implemented-validation-blocked` move to `active/`? | yes, until blocker is closed |
| Should the migration create `docs/plans/index.md`? | yes, if generated from current lifecycle folders |
