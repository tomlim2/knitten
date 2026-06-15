# Knitten Milestone

## Token-Efficient Routing

Status: Active.

Knitten's lead milestone is to make Codex skill routing cheaper, safer, and
more observable by loading only the context needed for the current request.

## Position

Knitten routes Codex work to the right skill at the lowest useful context cost.

The system should help a large skill library stay usable without turning every
request into a large prompt. The routing layer should decide quickly, reject
wrong matches cheaply, and load detailed instructions only after the selected
skill is confirmed.

## Current Focus

1. **Routing Smoke Eval**
   - Create a durable 20-case request set for current KC skills.
   - Measure baseline versus gated context cost with a clearly labeled
     worst-case model.
   - Record routing accuracy, reject accuracy, reference precision, safety
     misses, and the follow-up decision before expanding the pattern.

2. **Pilot Skill Audit And Migration**
   - Audit `kc-implement` first because it is the active implementation pilot.
   - Then audit `kc-draft-spec`, `kc-review`, and `kc-report-finding` as the
     remaining routing surfaces with deferred references or safety gates.
   - Keep mutation and external-state safety gates in `SKILL.md`; move only
     detailed procedures into references.

3. **Skill Audit Guidance**
   - Define a small checklist for overlong skill bodies, ambiguous triggers,
     missing non-trigger rules, missing required input, and missing Step 0
     safety gates.
   - Start as guidance. Promote only mechanically checkable parts to `doctor`
     after the pilot is stable.

4. **Registry Contract Reconciliation**
   - Treat current Shotloom output entries in Knitten as explicit compatibility
     contracts, not accidental domain leakage.
   - Keep `doctor` and repository shell validation checking source and installed
     copies for reachable templates, allowed makers, helper reachability, and
     stale plugin copies.
   - Document any future move from core compatibility outputs to payload-owned
     registries before changing active contracts.

5. **Milestone Hygiene**
   - Keep this milestone as the priority source of truth.
   - Keep source specs focused on their own contracts and remove obsolete pilot
     names or completed cleanup claims as they are discovered.

## Next Work

Work these in order. Do not start broad migration until the smoke eval and
pilot audit are both recorded.

| Priority | Work | Output | Done When |
|----------|------|--------|-----------|
| P0 | Audit `kc-implement` as the pilot skill | Blocker-only audit notes and any required `SKILL.md` or reference cleanup | No blocker remains for activation clarity, safety visibility, or reference loading. |
| P1 | Create the skill audit checklist | Durable checklist for overlong skills, ambiguous triggers, missing non-triggers, missing input, and missing Step 0 gates | The checklist can review one skill without inventing criteria. |
| P1 | Audit follow-up KC skills | Audit notes for `kc-draft-spec`, `kc-review`, and `kc-report-finding` | Each skill has blocker-free routing and safety findings, or a concrete fix task. |
| P1 | Document Shotloom compatibility outputs | Short contract note for retained Shotloom output ids in Knitten core | Future registry cleanup can tell compatibility outputs from payload leakage. |
| P2 | Decide validator promotion | Decision note on which audit checks belong in `doctor` | Only mechanically checkable, stable rules are selected for validation. |

## Deferred

RAG, vector search, and retrieve-and-rerank are not first-round work. They may
be useful later when explicit reference-selection rules become too noisy, but
the immediate milestone is to prove that simple gated loading works first.

Broad payload migration is also deferred. Payload skills can adopt the pattern
after the KC pilot and smoke eval show that routing accuracy and safety gates
survive the smaller context surface.

## Done

- Knitten core exposes the current output runtime through `knitten-path`.
- `doctor` checks source and installed plugin copies.
- Repository shell validation checks active registry shape and ownership.
- `local-helper-paths.json` is reachable and currently has no helper entries.
- The installed Knitten copy has the current Shotloom task activity output
  contract.
- Routing smoke eval has a 20-case fixture, deterministic runner, local raw
  report, and reviewed result note.

## Pilot Batch

| Skill | Surface | Purpose |
|-------|---------|---------|
| `kc-implement` | Scoped implementation | Prove deleted implementation leaves are covered by one practical core skill. |

Candidate follow-up audits:

| Skill | Surface | Purpose |
|-------|---------|---------|
| `kc-draft-spec` | Spec drafting | Verify reusable concepts and activation policy stay visible without bloating routing. |
| `kc-review` | Read-only review | Verify triad review details stay deferred behind a prepared-packet gate. |
| `kc-report-finding` | Finding capture | Verify mutation to local records keeps Step 0 evidence requirements visible. |

## Success Criteria

- A top-level README clearly presents Knitten as a token-efficient routing
  system.
- Pilot skills use short activation gates and conditional reference loading.
- Mutation-capable skills keep safety gates in the main skill file.
- `doctor` and shell validation catch stale, unreachable, or undocumented
  registry entries in source and installed copies.
- Audit guidance exists before broad skill migration.
- Routing/token-efficiency experiments are recorded before their results are
  used to change milestone direction.
- The status of Shotloom compatibility output contracts is documented before
  any registry ownership change.

## Source Specs

- [`docs/specs/skill-gated-progressive-loading.md`](docs/specs/skill-gated-progressive-loading.md)
- [`docs/specs/token-efficient-routing-smoke-eval.md`](docs/specs/token-efficient-routing-smoke-eval.md)
- [`docs/specs/routing-registry-health-cleanup.md`](docs/specs/routing-registry-health-cleanup.md)
