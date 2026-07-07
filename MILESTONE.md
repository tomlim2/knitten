# Knitten Milestone

## Core + Domain Plugin Discipline

Status: Active.

Knitten's lead milestone is to keep the personal Codex core small while domain
plugins own project-specific workflows and load detailed flow context only when
used.

## Position

Knitten is a small personal Codex workflow core with pluggable domain plugins.

The system should help a large skill library stay usable without turning the
core into a large prompt. The core keeps shared workflow contracts, output
paths, validation, and ownership rules. Domain plugins own domain behavior and
keep long flow details behind match checks or internal references.

## Current Focus

1. **Context Load Smoke Eval**
   - Create a durable 20-case request set for current core skills.
   - Measure baseline versus matched-context cost with a clearly labeled
     worst-case model.
   - Record match accuracy, reject accuracy, reference precision, safety misses,
     and the follow-up decision before expanding the pattern.

2. **Pilot Skill Audit And Migration**
   - Audit `implement` first because it is the active implementation pilot.
   - Then audit `draft-spec`, `review`, and `report-finding` as the
     remaining core workflow surfaces with deferred references or safety checks.
   - Keep mutation and external-state safety checks in `SKILL.md`; move only
     detailed procedures into references.

3. **Skill Audit Guidance**
   - Define a small checklist for overlong skill bodies, ambiguous triggers,
     missing non-trigger rules, missing required input, and missing Step 0
     safety checks.
   - Start as guidance. Promote only mechanically checkable parts to `doctor`
     after the pilot is stable.

4. **Registry Contract Reconciliation**
   - Treat current legacy domain output entries in Knitten as explicit compatibility
     contracts, not accidental domain leakage.
   - Keep `doctor` and repository shell validation checking source and installed
     copies for reachable templates, allowed makers, helper reachability, and
     stale plugin copies.
   - Document any future move from core compatibility outputs to domain-owned
     registries before changing active contracts.

5. **Milestone Hygiene**
   - Keep this milestone as the priority source of truth.
   - Keep source specs focused on their own contracts and remove obsolete pilot
     names or completed cleanup claims as they are discovered.

6. **Public Adoption Readiness**
   - Make the first README screen explain the problem, the concrete benefit, and
     the quickest proof path for a new Codex user.
   - Show measured evidence without over-claiming: current skill exposure,
     context-load smoke eval result, and the "avoid unnecessary context/work"
     framing.
   - Add a copy-paste quickstart and a tiny domain-plugin example path so the
     repository feels usable within minutes, not just internally coherent.
   - Align GitHub About/topics/release wording with the lightweight workflow
     core message.

7. **Mild Context Harness Hardening**
   - Improve context handling without turning Knitten into a new agent framework.
   - Keep raw high-volume tool results out of the active conversation when a
     compact artifact and summary will do.
   - Add warning-level checks for obvious skill-shape drift before promoting any
     new hard validator rules.
   - Prove any domain-plugin exposure change with measurement and one small
     pilot before broad migration.

## Next Work

Work these in order. Keep this batch small: fix measured drift, add compact
artifact contracts, and prove one repeated workflow before any broad migration.

| Priority | Work | Output | Done When |
|----------|------|--------|-----------|
| P0 | Refresh exposure proof | Updated README/milestone measurement notes, or a short spec if the proof block should move out of README. | `node scripts/measure-skill-exposure.mjs .` matches the public proof text, including skill count and approximate tokens. |
| P1 | Large tool-output artifact contract | Document a small `.agent-local/workflow/runs/<run-id>/` shape with `raw/`, `summary.md`, `handoff.json`, and `next.md`. | Linear/GitHub/shell-heavy workflows have a clear rule: store raw output locally, keep only compact summary/path/next action in the active context. |
| P1 | Compact collector pilot | One repeated workflow pilot, preferably Shotloom Linear/PR triage, that writes raw evidence and prints a compact summary. | The pilot replaces manual multi-tool context buildup for one real workflow without adding RAG, vector search, or a broad router. |
| P2 | Skill-shape validator warnings | Warning-only checks for active skills missing `match-check`, `Step 0: Match Check`, or post-match reference guards when references exist. | `doctor` or repository validation can surface obvious drift without hard-failing judgment-heavy skill quality questions. |
| P2 | Triad packet budget | Updated review/triad guidance for compact packets, role-specific context, and when full base docs are justified. | Triad review can avoid sending every large base document to every role by default while preserving read-only safety. |
| P3 | Domain exposure audit plan | Measured KSL/KAS exposure note with candidates for internal flow consolidation. | Candidate reductions are ranked by measured exposure and usefulness; no broad domain-plugin migration starts without a separate accepted target list. |

## Deferred

RAG, vector search, and retrieve-and-rerank are not first-round work. They may
be useful later when explicit reference-selection rules become too noisy, but
the immediate milestone is to prove that simple match-based loading works first.

Broad domain-plugin migration is also deferred. Domain skills can adopt the pattern
after the Knitten Core pilot and smoke eval show that match/reject accuracy and safety
checks survive the smaller context surface.

Custom compaction engines, cache layers, model-specific prompt tuning systems,
and all-skill rewrites are also deferred. The next batch should improve the
existing harness with small contracts, warnings, and one workflow pilot.

## Done

- Knitten core exposes the current output runtime through `knitten-path`.
- `doctor` checks source and installed plugin copies.
- Repository shell validation checks active registry shape and ownership.
- `local-helper-paths.json` is reachable and currently has no helper entries.
- The installed Knitten copy has the current legacy task activity output
  contract.
- Context-load smoke eval has a 20-case fixture, deterministic runner, local raw
  report, and reviewed result note.
- README first screen, quickstart, measured proof block, when-to-use guidance,
  public metadata note, and minimal domain-plugin example are implemented.
- Repository validation allows the minimal domain-plugin example and CI expects
  the current `.agent-local/workflow` output path.
- `implement` pilot audit is recorded and its match check now reflects local
  implementation work while keeping external mutation safety in Step 0.
- Skill audit checklist exists for discovery surface, match checks, context
  loading, mutation safety, implementation discipline, and audit completion.
- Follow-up audit for `draft-spec`, `review`, and `report-finding`
  found no P0/P1/P2 blockers.
- Legacy domain compatibility output contracts are documented as non-primary
  compatibility surfaces with required metadata and migration rules.
- Validator promotion decision is recorded: mechanical repository checks
  stay in validators, judgment-heavy skill quality checks stay in human audits.

## Pilot Batch

| Skill | Surface | Purpose |
|-------|---------|---------|
| `implement` | Scoped implementation | Prove deleted implementation leaves are covered by one practical core skill. |

Candidate follow-up audits:

| Skill | Surface | Purpose |
|-------|---------|---------|
| `draft-spec` | Spec drafting | Verify reusable concepts and match policy stay visible without bloating the core. |
| `review` | Read-only review | Verify triad review details stay deferred until a prepared packet exists. |
| `report-finding` | Finding capture | Verify mutation to local records keeps Step 0 evidence requirements visible. |

## Success Criteria

- A top-level README clearly presents Knitten as a small personal core with
  pluggable domain plugins.
- Pilot skills use short match checks and conditional reference loading.
- Mutation-capable skills keep safety checks in the main skill file.
- `doctor` and shell validation catch stale, unreachable, or undocumented
  registry entries in source and installed copies.
- Audit guidance exists before broad skill migration.
- Context-load/token-efficiency experiments are recorded before their results are
  used to change milestone direction.
- The status of legacy domain compatibility output contracts is documented before
  any registry ownership change.
- README and GitHub-facing wording make the project understandable to a
  non-owner without reading internal history.
- Public claims cite measured smoke-eval or exposure data and avoid promising
  universal token reduction.
- A minimal domain-plugin example exists before broad public promotion.
- Large tool outputs have a documented artifact-and-summary path before more
  Linear/GitHub-heavy workflows are added.
- Validator promotion remains warning-first for skill-shape drift until repeated
  audits prove a low false-positive hard rule.
- Domain plugin exposure reductions are based on measured usefulness, not token
  count alone.

## Source Specs

- [`docs/specs/skill-match-progressive-loading.md`](docs/specs/skill-match-progressive-loading.md)
- [`docs/specs/context-load-smoke-eval.md`](docs/specs/context-load-smoke-eval.md)
- [`docs/specs/output-registry-health-cleanup.md`](docs/specs/output-registry-health-cleanup.md)
- [`docs/specs/public-repository-readiness.md`](docs/specs/public-repository-readiness.md)
- [`docs/specs/implement-pilot-audit.md`](docs/specs/implement-pilot-audit.md)
- [`docs/specs/follow-up-skill-audit.md`](docs/specs/follow-up-skill-audit.md)
- [`docs/specs/validator-promotion-decision.md`](docs/specs/validator-promotion-decision.md)
- [`docs/specs/context-artifact-first-harness.md`](docs/specs/context-artifact-first-harness.md)
