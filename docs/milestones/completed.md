---
status: completed
created: 2026-07-10
updated: 2026-07-10
owner: workflow
---

# Knitten Completed Milestone Work

This is the evidence and decision log for completed Knitten milestone work. It
is not a backlog. New executable work belongs in [`MILESTONE.md`](../../MILESTONE.md)
only after it has an accepted target, concrete output, and verification.

## Release Baseline At Archive Update

Measured on 2026-07-10 with:

```bash
node scripts/measure-skill-exposure.mjs \
  . ../knitten-sl ../knitten-all-skills
```

| Plugin | Release | Skills | List approx tokens | `SKILL.md` approx tokens |
|--------|---------|-------:|-------------------:|-------------------------:|
| `knitten` | `v0.1.8` | 8 | 135 | 3085 |
| `knitten-sl` | `v0.1.5` | 28 | 511 | 6438 |
| `knitten-all-skills` | `v0.1.2` | 20 | 407 | 6098 |

These values describe the current released source checkouts. Earlier values
below remain historical evidence for the decisions made from those baselines.

## Core Runtime And Ownership

- Knitten Core exposes output, template, and semantic agent-profile resolution
  through `knitten-path`.
- `doctor` checks source and installed plugin copies, including registry shape,
  reachable helpers, skill shape, and copied-file drift.
- Repository shell validation checks active registry shape and ownership.
- `local-helper-paths.json` exposes the `agent-profile-resolver` helper.
- Shared workflow output contracts and legacy domain compatibility contracts
  are documented with owner metadata and migration rules.
- Workflow run artifacts are registered for `root`, `raw`, `summary`,
  `handoff`, and `next` through local artifact and `workflow-run-*` output ids.
- Finding records resolve to the Knitten-owned operational finding queue even
  when the observed failure belongs to a domain plugin.
- Core owns three semantic subagent profiles; Core and Shotloom skills select
  profile ids instead of pinning model, reasoning, or sandbox settings.

## Progressive Loading And Skill Audits

- The context-load smoke eval has a durable 20-case fixture and deterministic
  runner. The reviewed run achieved 20/20 match cases, 4/4 rejects, full
  reference precision, and zero safety misses.
- The `implement` pilot audit is complete and keeps external mutation safety in
  Step 0 while deferring detailed local procedure.
- Follow-up audits for `draft-spec`, `review`, and `report-finding` found no
  P0/P1/P2 blockers.
- The skill audit checklist covers discovery surfaces, match checks, context
  loading, mutation safety, implementation discipline, and audit completion.
- Mechanical repository checks remain validators; judgment-heavy skill quality
  remains a human audit responsibility.
- Warning-level skill-shape checks report missing match metadata, Step 0 gates,
  and post-match reference guards without hard-failing the repository.

## Context Harness

- The compact collector pilot stores raw validation output under a workflow run
  artifact and returns compact summary, handoff, next-action, and evidence
  paths.
- Triad packet budget guidance separates shared compact context, role-specific
  documents, raw artifact evidence, and justified full shared context.
- Large tool results have a documented artifact-and-summary path before more
  Linear/GitHub-heavy workflows are added.

## Public Repository Readiness Completed Portion

- The README first screen explains the problem, benefit, and quick proof path.
- Copy-paste quickstart, measured proof, when-to-use guidance, and a minimal
  domain-plugin example are present.
- Public claims are constrained to measured smoke-eval or exposure evidence and
  avoid universal token-reduction promises.
- Repository validation accepts the minimal domain-plugin example and validates
  the current `.agent-local/workflow` output contract.

GitHub About wording and the `v0.1.8` GitHub Release remain active work in the
current milestone rather than being recorded as complete here.

## Domain Exposure Work

- The domain exposure audit measured Core, KSL, and KAS, ranked candidates, and
  required a separate accepted target list before migration.
- The first accepted KAS Unreal/CINEV extraction migrated eight skill bodies to
  conditional flows. At that historical checkpoint, KAS selected-body exposure
  fell from about 10448 to 7026 approximate tokens while list exposure stayed
  flat.
- KAS `v0.1.2` continued focused flow extraction, completed the measured
  `dev-generate-spec` candidate, and removed the tutoring lesson workflow after
  its ownership moved. The current 20-skill value is recorded in the release
  baseline table above and must not be presented as the original eight-skill
  pilot result.

## Historical Non-Goals

- RAG, vector search, and retrieve-and-rerank were not required for the first
  progressive-loading batch.
- Broad domain-plugin migrations require a separate accepted target list and
  usefulness evidence; token count alone is not approval.
- Custom compaction engines, independent cache layers, model-specific prompt
  tuning, and all-skill rewrites were outside the completed batch.

Future work may revisit these decisions through a new milestone or accepted
spec. They are not implicit tasks in the current milestone.

## Completed Source Specs

- [`skill-match-progressive-loading.md`](../specs/skill-match-progressive-loading.md)
- [`context-load-smoke-eval.md`](../specs/context-load-smoke-eval.md)
- [`output-registry-health-cleanup.md`](../specs/output-registry-health-cleanup.md)
- [`implement-pilot-audit.md`](../specs/implement-pilot-audit.md)
- [`follow-up-skill-audit.md`](../specs/follow-up-skill-audit.md)
- [`validator-promotion-decision.md`](../specs/validator-promotion-decision.md)
- [`context-artifact-first-harness.md`](../specs/context-artifact-first-harness.md)
- [`kas-unreal-cinev-body-extraction-target-list.md`](../specs/kas-unreal-cinev-body-extraction-target-list.md)

The active public-readiness spec and domain-exposure measurement reference stay
linked from the current milestone.
