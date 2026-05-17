---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
milestone: spec-lifecycle-system
briefing: ../briefings/specs/spec-validator-hardening.md
---

# Spec Validator Hardening

## Purpose

Harden `scripts/validate-llm-first.mjs` so caol/Knitten specs, milestones, and
spec intake files stay linked after the spec lifecycle system grows beyond a
flat `docs/plans/` folder.

## Problem

The current validator catches broad policy drift, generated block drift,
taxonomy naming, and broken Markdown links. It does not yet check the semantic
relationships introduced by the spec lifecycle system:

| Relationship | Current risk |
|--------------|--------------|
| spec slug uniqueness | a slug can be duplicated when lifecycle folders are added |
| spec `milestone:` backlink | a spec can point to a missing milestone |
| milestone `## Specs` link | a milestone can forget to link a spec that names it |
| milestone row status | a milestone row can drift from spec frontmatter status |
| spec `briefing:` path | a high-risk spec can point to a missing intake file |
| intake `spec:` path | an intake can point to a missing or renamed spec |

This drift matters because future agents should be able to cold-start from disk
without opening chat history or external trackers.

## Goals

1. Add a focused `spec-lifecycle` validator check.
2. Exclude report/evidence folders from spec semantics.
3. Check duplicate spec slugs across lifecycle-capable `docs/plans/**`.
4. Check milestone links, spec back-links, and row status sync.
5. Check caol spec intake links under `docs/briefings/specs/`.
6. Register the new check in generated validator documentation and the agent hub
   manifest.

## Non-Goals

1. Do not move or rename any specs.
2. Do not enforce lifecycle folders before the migration runs.
3. Do not require every spec to have a milestone.
4. Do not validate Shotloom briefings in this caol-specific batch.
5. Do not require full YAML parsing beyond the existing simple frontmatter
   parser.

## Current State

Relevant current checks:

| Check | Covers | Gap |
|-------|--------|-----|
| `taxonomy` | managed document filename patterns | no link/backlink semantics |
| `markdown-links` | Markdown link targets in docs | does not inspect frontmatter relationships |
| `agent-hub` | validator registry entries | only validates listed checks exist |
| `generated-blocks` | check list block freshness | depends on `CHECKS` order |

Existing milestone corpus:

| Milestone | Linked spec count |
|-----------|------------------:|
| `spec-lifecycle-system` | 6 planned after this spec is attached |
| `knitten-rename` | 1 |

## Proposed Design

Add `checkSpecLifecycle()` to `scripts/validate-llm-first.mjs`.

### Spec Files

Treat these as specs:

```text
docs/plans/**/*.md
```

Exclude:

```text
docs/plans/*-reports/**
docs/plans/reports/**
docs/plans/index.md
docs/plans/README.md
```

This keeps historical reports and future generated indexes out of executable
spec semantics.

### Duplicate Slug Check

The slug is the filename without `.md`. The same slug may not appear in more
than one spec path. This is what keeps future lifecycle folders from containing
both `active/foo.md` and `completed/foo.md`.

### Milestone Relationship Check

For each spec with `milestone: <slug>`:

1. `docs/milestones/<slug>.md` must exist.
2. The milestone must link to that spec in `## Specs`.

For each spec link in a milestone `## Specs` table:

1. the linked spec must exist;
2. the linked spec's `milestone:` must match the milestone slug;
3. the table row status should match the spec frontmatter `status:`.

### Intake Relationship Check

For each spec with `briefing: <path>`, the resolved path must exist.

For each file under `docs/briefings/specs/*.md`, frontmatter `spec:` must point
to an existing spec.

## Execution Plan

### Batch A: Implement Current Green Check

Status: completed on 2026-05-17.

1. Add helper functions for spec path classification and Markdown target
   resolution.
2. Add `checkSpecLifecycle()`.
3. Register `spec-lifecycle` in `CHECKS`.
4. Add the check to `agent/config/agent-hub.json`.
5. Refresh generated validator check and hub inventory blocks.
6. Attach this spec to `spec-lifecycle-system`.

## Implementation Summary

| Artifact | Result |
|----------|--------|
| `scripts/validate-llm-first.mjs` | added `spec-lifecycle` check |
| `agent/config/agent-hub.json` | registered the new validator |
| `agent/standards/policy/principles.md` | refreshed validator check list |
| `AGENT-HUB.md` | refreshed validator count |
| `docs/milestones/spec-lifecycle-system.md` | linked this spec and synchronized status |

### Batch B: Future Lifecycle Folder Enforcement

After the `docs/plans/` migration:

1. update taxonomy to validate lifecycle folders recursively;
2. add root-shape validation so only lifecycle directories and index files live
   under `docs/plans/`;
3. decide whether legacy `open` status remains allowed.

### Batch C: Optional Broader Briefing Checks

If useful, add domain checks for `docs/briefings/shotloom/` separately. Do not
fold that into the caol spec lifecycle validator unless the Shotloom briefing
contract is updated first.

## Validation

Required commands:

```bash
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs --check generated-blocks
node scripts/validate-llm-first.mjs --check agent-hub
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

## Risks

| Risk | Mitigation |
|------|------------|
| false positives from report folders | explicitly exclude report paths |
| broken current docs block implementation | run focused check before full validator |
| parser misses complex YAML | keep this batch to simple scalar fields already used by the repo |
| generated docs become stale | refresh generated blocks in the same commit |

## Acceptance Criteria

1. `spec-lifecycle` appears in `node scripts/validate-llm-first.mjs --list`.
2. `spec-lifecycle` passes on the current corpus.
3. The full validator passes.
4. Generated validator docs are fresh.
5. `agent/config/agent-hub.json` registers the new check.
6. The owning milestone links this spec and status matches frontmatter.

## Open Decisions

| Decision | Default |
|----------|---------|
| Require frontmatter on every spec? | defer |
| Enforce lifecycle folder root shape now? | defer until physical migration |
| Validate Shotloom briefings here? | no, use a domain-specific check later |
