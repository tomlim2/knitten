# Google Engineering Review Practices Alignment

## Status

Accepted on 2026-07-13 by the user's explicit implementation start instruction.
Amended on 2026-07-19 by explicit instruction to fix grounded, locally
actionable P3 and documentation findings before the review/fix loop completes.

## Goal

Align Knitten Core review protocols with the useful, organization-neutral
principles in Google Engineering Practices while preserving Knitten's existing
priority, blocker, role-routing, and mutation boundaries.

## Problem

Knitten already has grounded findings, P0-P3 priorities, blocker-driven loops,
scope control, and read-only review agents. It does not yet state one canonical
approval standard or one review navigation order across `review`,
`triad-preflight`, and `review-fix-loop`.

The current review output template also overstates two rules:

- it forbids praise instead of allowing factual reinforcement tied to an
  engineering reason;
- it prefers questions even when a supported blocker needs a direct required
  action.

Without a shared contract, domain workflows can interpret P3, optional advice,
review completeness, PR size, and reviewer explanations differently.

## Boundary

In scope:

- Define a canonical Knitten review-principles reference.
- Adopt the code-health improvement standard without requiring perfection.
- Standardize review navigation: intent, main design, tests, remaining changed
  lines, and wider file/system context where needed.
- Preserve P0-P3 and `blocker` as the only machine-readable loop eligibility
  contract; keep P3 non-blocking while allowing grounded local P3 corrections
  to enter the fix loop after blockers, and standardize Optional, Nit, and FYI
  as presentation labels only.
- Clarify when review feedback should request code/docs changes rather than an
  explanation that exists only in the review conversation.
- Add conceptual change-size and split guidance.
- Align runtime role output, legacy document-template wording, and review/fix
  loop behavior without treating the template as a runtime dependency.
- Add mechanical contract validation and committed review-contract fixtures.

Out of scope:

- Importing Google-specific CL, LGTM, OWNERS, staffing, escalation, emergency,
  pair-programming, or one-business-day policies.
- Adding a new review skill, priority system, or broad routing layer.
- Changing subagent model ids or bypassing Core agent-profile resolution.
- Making `review` or `triad-preflight` mutate files or external state.
- Making `review-fix-loop` commit, push, post, deploy, or mutate GitHub/Linear.
- Rewriting domain-specific review catalogs in this implementation pass.
- Adding comment-intent fields to the finding schema or changing
  `triad-preflight`'s `candidateBlockers`/`warnings` schema.
- Making `document-templates/review/code-review.md` a runtime dependency.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| [Google review standard](https://google.github.io/eng-practices/review/reviewer/standard.html) | No | Provenance for code-health improvement, non-perfection, and facts over preference. |
| [What to look for](https://google.github.io/eng-practices/review/reviewer/looking-for.html) | No | Provenance for design, behavior, complexity, tests, docs, and coverage. |
| [Review navigation](https://google.github.io/eng-practices/review/reviewer/navigate.html) | No | Provenance for intent-first and main-design-first navigation. |
| [Review comments](https://google.github.io/eng-practices/review/reviewer/comments.html) | No | Provenance for code-focused, reasoned, severity-labeled feedback. |
| [Handling pushback](https://google.github.io/eng-practices/review/reviewer/pushback.html) | No | Provenance for evidence-based re-evaluation and debt boundaries. |
| [Small changes](https://google.github.io/eng-practices/review/developer/small-cls.html) | No | Provenance for self-contained changes and conceptual sizing. |
| [Change descriptions](https://google.github.io/eng-practices/review/developer/cl-descriptions.html) | No | Provenance for durable what/why context. |
| Existing Core review protocols | Yes | `review`, `triad-preflight`, `review-fix-loop`, finding schema, output template. |

The external references were reviewed on 2026-07-13 and are provenance only.
The local `Contract` section is the complete normative adaptation. A cold-start
implementation must not depend on live external content or later page changes.

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Review-principles reference | durable | Canonical shared review standard consumed by Core review protocols. |
| Updated Core skill references | durable | Navigation, finding labels, split, explanation, and loop behavior. |
| Updated runtime role output | durable | `triad.md` remains the authoritative runtime output contract. |
| Legacy template wording cleanup | durable | Optional consistency cleanup; not a runtime behavior proof. |
| Runtime contract checks | durable | Mechanical protection against semantic drift. |
| Review-contract fixtures and runner | durable | Reproducible normalization, coverage, and loop-eligibility proof. |
| Manual forward-test evidence | none | Supplemental agent-behavior inspection, not regression proof. |

## Contract

### Approval Standard

- A review is ready when the change demonstrably improves or preserves overall
  code health and no supported P0-P2 blocker remains.
- Review does not require perfection. P3 polish, optional alternatives, and FYI
  notes must not delay readiness.
- Nothing in the non-perfection rule permits a change that demonstrably reduces
  correctness, safety, maintainability, readability, testability, or supported
  user/developer behavior.
- Technical evidence, accepted specs, repository rules, and established
  engineering principles outrank personal preference.
- When multiple approaches are equally valid under supplied evidence, accept
  the author's choice rather than manufacturing a blocker.

### Finding Priority And Comment Intent

`priority` and `blocker` remain the only machine-readable readiness and loop
eligibility contract. Do not add a second intent state axis.

Rules:

- Review roles emit P0-P2 as `blocker=true` and render them as required
  findings. The generic Core review/fix loop does not downgrade them.
- P3 always uses `blocker=false` and may use `Optional:`, `Nit:`, or `FYI:` in
  the finding title or notes.
- `Optional:` proposes a potentially useful alternative that is not required.
- `Nit:` is bounded local polish.
- `FYI:` is educational or future-facing context and is not a corrective task.
- Presentation labels never override `priority` or `blocker` and are ignored by
  readiness and merge priority.
- Every grounded P0-P3 finding with a concrete, safe, in-scope correction enters
  `review-fix-loop`. P0-P2 blockers are fixed first; P3 remains
  `blocker=false` and is fixed afterward without changing readiness.
- Educational, subjective, pre-existing, or out-of-scope observations without
  a local corrective action remain notes or residual risk instead of loop
  findings. A product/design decision still stops for caller judgment instead
  of being fixed automatically.
- Caller-provided schemas remain authoritative in their owning workflow. Before
  entering a generic Core loop, the caller must supply fully normalized
  P0-P3-plus-`blocker` findings. Core does not accept or interpret a custom
  mapping object.

### Review Navigation

Before role dispatch, the caller creates a coverage manifest from the changed
surface inventory. One inventory item has this exact shape:

```json
{
  "surfaceId": "src/example.ts#changed-lines",
  "path": "src/example.ts",
  "kind": "human|generated|data",
  "reviewRequired": true,
  "exclusionReason": null
}
```

`surfaceId` is unique and stable within one packet. A file-level ID means every
human-written changed line in that file; callers may use finer hunk/section IDs
when roles split one file. `kind=human` requires `reviewRequired=true`.
Generated/data items may use `reviewRequired=false`, which requires a non-empty
`exclusionReason`; excluded items are not treated as reviewed.

Every required surface must be assigned to at least one role before dispatch.
One role coverage report has this exact shape:

```json
{
  "role": "<role name>",
  "assignedSurfaceIds": ["src/example.ts#changed-lines"],
  "checkedSurfaceIds": ["src/example.ts#changed-lines"],
  "skippedSurfaces": [
    { "surfaceId": "src/other.ts#changed-lines", "reason": "<reason>" }
  ]
}
```

All referenced IDs must exist in inventory; checked/skipped IDs must be
assigned to that role; duplicates and checked/skipped overlap are invalid.
Every single or triad role follows this order within its assigned scope:

1. Confirm the change purpose, description, accepted scope, non-goals, and
   primary consumer make sense.
2. Inspect the highest-value design or contract surface first.
3. Inspect tests early when they clarify intended behavior; verify that tests
   would fail for the defect they claim to catch.
4. Review every human-written changed line in scope, then inspect enough whole
   file and system context to judge integration and complexity.
5. Return the role coverage report above. A skipped required surface remains
   incomplete even when its reason is recorded.

The merged review returns:

```json
{
  "coverage": {
    "assigned": [],
    "checked": [],
    "skipped": [],
    "excluded": [],
    "uncovered": [],
    "complete": true
  },
  "ready": true,
  "nextAction": "complete|fix|review|ask"
}
```

All merged ID arrays are de-duplicated and sorted with one locale-independent
UTF-16 code-unit comparator.
`uncovered` is the required inventory minus `checked`; a skipped required ID
therefore remains uncovered. `excluded` contains only inventory items with
`reviewRequired=false` and preserves their reasons.

The authoritative calculations are:

```text
coverage.complete = uncovered is empty
ready = no P0-P2 blocker
        AND coverage.complete
        AND needsDesignJudgment is empty
nextAction = ask    when needsDesignJudgment is non-empty
             fix    when no design judgment remains and any P0-P3 finding exists
             review when no finding remains and coverage.complete is false
             complete otherwise
```

`review-fix-loop` may write a `complete` checkpoint only when `ready=true`, no
actionable P0-P3 finding remains, documentation coverage is complete, and
validation passes. Incomplete coverage triggers packet repair or another
read-only review pass; it is not an implementation finding.

An actionable validation failure is normalized as a P2 `blocker=true` finding
with command/output evidence and `nextAction=fix`. A failure with no local
corrective action is preserved with `status=blocked` and an owning handoff; it
must not loop without a corrective target. Checkpoint schema version 2 stores
remaining findings with canonical `priority` and `blocker`. A version-1
checkpoint may infer these only for its existing `remainingBlockers` entries
and must discard its legacy action, run a fresh full review for all v2-only
state, and be rewritten as version 2 before further fixes or validation.
Durable target/history/context fields may carry forward; status, summary, loop
number, coverage, judgment, readiness, both handoffs, next action, and timestamp
are recomputed. P3 or unknown legacy severities are never promoted to blockers.
The migration increments the loop number once, uses `blocked` status only for a
non-null blocked handoff and `continue` otherwise before validation, regenerates
the fresh-review summary from blocker count/coverage/next action, and timestamps
the v2 write.
Non-local validation failures use a dedicated nullable `blockedHandoff` with
`owner`, `requiredAction`, and `reason`; they never overload the description
refresh handoff.

Current `review-fix-loop` checkpoints also preserve every grounded P3 finding
with a concrete, safe, in-scope correction as `priority=P3`, `blocker=false` in
`nonBlockingFindings`; these findings do not affect readiness but select
`nextAction=fix` until corrected. Every full loop also records
`documentationCoverage` for changed or behavior-adjacent docs, comments, API
references, contracts, specs, tests, and fixtures. Required documentation
mismatches and grounded local clarity issues are both fixed before completion.
Empty documentation coverage requires an explicit non-applicability reason
rather than silently assuming that no documentation work exists.

`triad-preflight` remains shallow. It applies steps 1-2 plus cheap evidence and
surface checks, then hands off to full review. It does not claim every-line
coverage and keeps its existing `candidateBlockers`/`warnings` schema.

### Design, Complexity, And Change Size

- Reviewers check design and present requirements before local style polish.
- New abstraction, dependency, public surface, or generic behavior requires a
  current accepted need. Speculative future flexibility is a scope finding.
- Change size is conceptual: one self-contained behavior or contract with its
  related tests and required docs.
- Recommend a split when independent behavior, unrelated reviewers, mixed
  refactor/feature work, rollback boundaries, or review comprehension make one
  change unsafe or opaque.
- Do not use a hard LOC threshold. Large deletion or trusted generated output
  may have low review burden; a small cross-boundary change may have high risk.
- Keep tests that prove changed behavior with the behavior change. A separate
  earlier test-only change is acceptable when it establishes missing baseline
  coverage for a later refactor.

### Comment And Explanation Quality

- Comments address code or behavior, not the author.
- Required findings explain evidence, violated contract, impact, and the
  smallest corrective outcome. They may be direct; they do not need to be
  disguised as questions.
- Use a question when product intent, trade-offs, or required behavior is
  genuinely ambiguous. Emit that question in the existing
  `needsDesignJudgment` collection, not as a finding.
- Balance problem statements with guidance. Do not design an entire replacement
  when the author or implementing workflow owns the solution.
- When review reveals code that readers cannot understand, prefer simplifying
  the code or adding durable `why` documentation. A review-thread-only
  explanation is insufficient for future readers.
- Generic praise remains out of scope. Factual positive reinforcement is
  allowed when it names the practice and why it improves code health. Keep it
  as `Positive evidence: ...` in the role report `Notes`; it is not a finding,
  blocker, residual risk, or merged corrective action.
- On pushback, re-evaluate the finding against new evidence. Withdraw it when
  the author's case is valid; otherwise restate the technical reason and impact.
- Complexity introduced by the current change must be resolved now. Unrelated
  pre-existing debt may become an explicit follow-up rather than expanding the
  current change.

### Description Contract

- Review packets must contain concise `what` and `why` context, not only a file
  list or branch name.
- When review shows that accepted scope or behavior changed, merged output adds
  a caller-facing handoff:

  ```json
  {
    "handoff": {
      "descriptionRefreshRequired": true,
      "reason": "<grounded scope or behavior change>"
    }
  }
  ```

- Core review protocols only emit this signal. The owning PR/spec workflow
  decides whether and how to refresh its durable description before publication
  or final readiness.
- External links supplement but do not replace enough durable context for a
  future maintainer to understand the decision.

### Skill Match Contracts

- `review` remains `match-check: loose`. Step 0 continues to require a
  source-cited, read-only packet and now also requires enough what/why context
  to perform the broad-view pass.
- `triad-preflight` remains `match-check: loose`. Step 0 continues to stop on a
  vague packet and does not claim final readiness or every-line review.
- `review-fix-loop` remains `match-check: normal`. Step 0 continues to permit
  local edits only; external mutation still hands off to an owning strict
  workflow with a fresh approval gate.
- No skill loads the detailed review-principles reference before its Step 0
  match check passes.

### Canonical Consumer Matrix

`skills/review/references/code-review-principles.md` owns normative shared
policy. Runtime role reports and merged findings remain owned by
`skills/review/references/triad.md`. Protocol flows contain only their local
deltas and link to the canonical sections after Step 0 passes.

| Consumer | Post-Step-0 load | Canonical sections | Local delta |
|----------|------------------|--------------------|-------------|
| `review` | Read `code-review-principles.md`, then `triad.md`. | Approval, navigation, complexity, comments, description handoff. | Role routing, packet budgets, role report, merge and coverage output. |
| `triad-preflight` | Its flow reads `../../review/references/code-review-principles.md` before role dispatch. | Approval, navigation steps 1-2, complexity and change size. | Candidate-only scope/evidence/surface roles; no final blockers or coverage claim. |
| `review-fix-loop` | Its flow reads `../../review/references/code-review-principles.md` before loop selection. | Approval, priority/loop eligibility, coverage, and readiness calculation. | Checkpointing, implementation handoff, validation, and stop conditions. |
| `code-review.md` | Not loaded by runtime skills. | None. | Legacy/manual output wording only; it must not be cited as runtime proof. |

Do not copy canonical normative prose into each flow. Link the exact section and
state only the consumer-specific behavior needed by that protocol.

## Validation

- `node scripts/validate-repository-shell.mjs`
- `node scripts/validate-runtime-contracts.mjs`
- `node scripts/validate-review-contracts.mjs`
- `node scripts/doctor.mjs`
- `git diff --check`
- Static assertions confirm the canonical approval standard, navigation order,
  coverage contract, P0-P3 loop eligibility, and mutation boundaries.
- Valid committed fixtures under `evals/review-contracts/` use this exact
  top-level shape:

  ```json
  {
    "schemaVersion": 1,
    "caseId": "<unique id>",
    "inventory": [],
    "roleCoverage": [],
    "normalizedFindings": [
      {
        "fixtureFindingId": "F1",
        "priority": "P0|P1|P2|P3",
        "blocker": true
      }
    ],
    "needsDesignJudgmentCount": 0,
    "handoff": {
      "descriptionRefreshRequired": false,
      "reason": null
    },
    "expected": {
      "coverage": {},
      "handoff": {
        "descriptionRefreshRequired": false,
        "reason": null
      },
      "loopEligibleFindingIds": [],
      "ready": true,
      "nextAction": "complete|fix|review|ask"
    }
  }
  ```

- `invalid-cases.json` uses a second closed shape:

  ```json
  {
    "schemaVersion": 1,
    "caseId": "invalid-cases",
    "cases": [
      {
        "caseId": "<unique invalid id>",
        "input": {},
        "expectedError": "<stable error code>"
      }
    ]
  }
  ```

- Stable invalid-fixture error codes are `unknown-key`,
  `duplicate-surface-id`, `unknown-surface-id`, `excluded-surface-id`,
  `coverage-overlap`, and `invalid-blocker-priority`.
- `inventory` and `roleCoverage` use the exact shapes and invariants in Review
  Navigation. `fixtureFindingId` is unique and test-only; it does not change the
  runtime finding schema. Allowed top-level and nested keys in both fixture
  shapes are closed.
- Fixtures cover:
  - `non-perfect-improvement.json`: zero blockers; grounded P3 Optional/Nit
    enters the loop while readiness remains true;
  - `unsupported-complexity.json`: one P2 blocker enters the loop;
  - `clarity-explanation.json`: durable code/docs clarification is required and
    a review-thread-only explanation does not clear the finding;
  - `incomplete-coverage.json`: a required skipped/uncovered surface makes
    `ready=false` and `nextAction=review`;
  - `description-refresh.json`: a validated caller handoff preserves its reason;
  - `design-judgment.json`: ask precedence, priority/ID ordering, and canonical
    surface sorting remain deterministic;
  - `invalid-cases.json`: unknown keys, duplicate/out-of-inventory IDs,
    excluded or unassigned coverage IDs, checked/skipped overlap, P0-P2 with
    `blocker=false`, and P3 with `blocker=true` are rejected.
- `scripts/validate-review-contracts.mjs` accepts already merged, normalized
  findings and handoff. It does not perform semantic finding deduplication,
  derive description handoff from prose, interpret custom schemas, or simulate
  agent judgment.
- The validator checks closed keys and set invariants, sorts surface arrays with
  the canonical code-unit comparator and eligible finding IDs by priority rank
  then the same comparator, computes coverage/readiness/next action, and
  deep-compares with `expected`.
- Run the three durable qualitative packets under `evals/review-forward-packets/`
  (`non-perfect-improvement.json`, `unsupported-complexity.json`, and
  `clarity-explanation.json`) through a read-only agent as supplemental manual
  forward tests. For each case, run
  `node scripts/render-review-forward-packet.mjs <case-id>` and provide only its
  stdout to the packet's single assigned role. The renderer includes review
  mode, role, brief, inventory, assignment, and evidence while withholding
  `expected`. Compare the returned review with the source packet's oracle only
  after the agent responds. Agent output is inspection evidence, not the
  regression gate.
- The renderer requires a safe case ID matching the packet filename, emits an
  exact whitelist projection, rejects unsafe or unknown cases, and never emits
  the source packet's `expected` oracle.

## Acceptance Criteria

- One canonical Core reference defines the approval, navigation, comment,
  change-size, and pushback contracts.
- `review`, `triad-preflight`, and `review-fix-loop` consume compatible subsets
  without duplicating divergent policy.
- The finding schema remains P0-P3 plus `blocker`; no independent intent field
  is added.
- Generic Core normalization accepts P0-P2 only with `blocker=true` and P3 only
  with `blocker=false`; every grounded finding with a concrete local correction
  drives the fix loop, while presentation labels do not alter readiness.
- Full review requires every review-required human-written surface to be
  checked. Required skipped surfaces remain uncovered; generated/data exclusions
  are separate and reason-bearing. Preflight does not claim this coverage.
- Readiness requires zero P0-P2 blockers, complete coverage, and no unresolved
  design judgment. Loop completion additionally requires zero actionable P3 or
  documentation findings and passing validation.
- Runtime output from `triad.md` allows factual positive reinforcement but
  rejects generic praise and personal commentary. Positive evidence stays in
  role `Notes`; genuine questions use `needsDesignJudgment`.
- Required findings are direct and reasoned; questions are reserved for genuine
  ambiguity.
- Change splitting is based on conceptual cohesion and risk, not a hard LOC
  threshold.
- No Google-specific organizational policy becomes a Knitten runtime rule.
- External Google pages are provenance only; this document's Contract is the
  complete normative implementation input.
- Core emits `descriptionRefreshRequired` as a handoff and does not claim to
  mutate an owning PR/spec description.
- Schema-v1 checkpoint resume requires a fresh full review before v2 rewrite;
  blocked non-local validation preserves explicit owner and required action.
- Excluded generated/data surfaces cannot appear in role coverage or count as
  assigned, checked, or skipped.
- Existing read-only and external-mutation boundaries remain unchanged.
- Repository-native validation, including incomplete-coverage and invalid-case
  fixtures, passes.

## Open Questions

- None.

## Design Plan

### Inputs

- This spec as the complete normative contract.
- External references listed above as provenance only.
- `skills/review/SKILL.md`
- `skills/review/references/triad.md`
- `skills/triad-preflight/SKILL.md`
- `skills/triad-preflight/references/flow.md`
- `skills/review-fix-loop/SKILL.md`
- `skills/review-fix-loop/references/flow.md`
- `document-templates/review/code-review.md`
- `scripts/validate-runtime-contracts.mjs`

### Outputs

- `skills/review/references/code-review-principles.md`
- Targeted updates to the three Core review skill/reference pairs with explicit
  post-Step-0 canonical-reference loading.
- Updated `document-templates/review/code-review.md` as legacy/manual wording,
  not runtime authority.
- `evals/review-contracts/*.json` fixtures.
- `scripts/validate-review-contracts.mjs` and updated runtime contract checks.

### Implementation Sequence

#### 1. Add The Canonical Principles Reference

Files:

- `skills/review/references/code-review-principles.md`
- `skills/review/SKILL.md`
- `skills/triad-preflight/references/flow.md`
- `skills/review-fix-loop/references/flow.md`

Changes:

- Add the approval, navigation, change-size, comment, explanation, and pushback
  contracts.
- Keep `review` loose and read-only; require sufficient what/why context after
  matching.
- Wire each consumer to the exact canonical sections in the consumer matrix.
- Keep consumer flows limited to protocol-specific deltas.

Risk:

- The reference could become generic culture prose instead of an executable
  review contract.

Proof:

- Every rule maps to an observable finding, readiness, packet, or residual-risk
  behavior.
- The active skill remains a compact match-first file.
- A path/link inspection confirms all three consumers load the canonical
  reference only after Step 0.

#### 2. Align Finding And Navigation Semantics

Files:

- `skills/review/references/triad.md`
- `skills/review-fix-loop/references/flow.md`

Changes:

- Keep the default finding schema on P0-P3 plus `blocker`.
- Add pre-dispatch coverage assignment and role-report
  `assigned/checked/skipped` surfaces.
- Add stable surface IDs, closed set invariants, merged coverage reconciliation,
  and the authoritative readiness/next-action calculation.
- Require `review-fix-loop` completion to consume `coverage.complete` and
  unresolved design judgment as well as blocker count.
- Keep Optional/Nit/FYI as P3 presentation labels that do not affect readiness;
  send grounded, locally actionable P3 findings through the fix loop after
  blockers.
- Add the caller-facing `descriptionRefreshRequired` handoff.

Risk:

- Coverage granularity could become too expensive or inconsistent across
  callers.

Proof:

- Coverage uses the existing changed-surface inventory as its unit instead of
  inventing a line-range protocol when a file/surface unit is sufficient.
- Human-written skipped surfaces remain incomplete; only reason-bearing
  generated/data exclusions leave the required inventory.
- Existing P0-P3/blocker consumers continue to work unchanged and may ignore
  the new top-level coverage/handoff output until adopted.

#### 3. Align Runtime Output And Legacy Template Wording

Files:

- `skills/review/references/triad.md`
- `document-templates/review/code-review.md`

Changes:

- Make `triad.md` role and merge output the runtime authority for direct
  required actions, genuine questions, and factual positive reinforcement.
- Apply the same wording cleanup to the legacy/manual template without wiring
  it into runtime skills.
- Label P3 presentation as Optional, Nit, or FYI while keeping fact, evidence,
  impact, and code-not-author rules.
- Put genuine questions in `needsDesignJudgment` and factual reinforcement in
  role `Notes` as `Positive evidence`, never in findings or residual risk.

Risk:

- Output could become verbose or conversational.

Proof:

- Examples remain compact and every positive or corrective comment cites an
  engineering reason.
- A runtime path inspection proves `review` consumes `triad.md`, not the legacy
  document template.

#### 4. Add Durable Contract Fixtures And Validation

Files:

- `evals/review-contracts/non-perfect-improvement.json`
- `evals/review-contracts/unsupported-complexity.json`
- `evals/review-contracts/clarity-explanation.json`
- `evals/review-contracts/incomplete-coverage.json`
- `evals/review-contracts/description-refresh.json`
- `evals/review-contracts/design-judgment.json`
- `evals/review-contracts/invalid-cases.json`
- `evals/review-forward-packets/*.json`
- `evals/review-checkpoints/schema-v1-migration.json`
- `evals/review-checkpoints/schema-v2-blocked.json`
- `scripts/render-review-forward-packet.mjs`
- `scripts/validate-review-contracts.mjs`
- `scripts/validate-runtime-contracts.mjs`
- Review skill/reference files.

Changes:

- Store exact changed-surface inventories, role coverage, already normalized
  findings/handoff, and expected coverage/loop/readiness outputs.
- Implement closed-shape validation, set-invariant rejection, canonical sorting,
  deterministic calculation, and deep comparison.
- Keep custom-schema interpretation and semantic finding deduplication outside
  this runner; callers normalize before generic loop entry.
- Add static assertions for approval standard, canonical consumer wiring,
  P0-P3 loop eligibility, coverage, and unchanged mutation boundaries.
- Run the same packets through read-only agents only as supplemental inspection.

Risk:

- Fixture normalization may duplicate prose semantics without exercising actual
  agent judgment.

Proof:

- Keep the mechanical acceptance boundary explicit: fixtures prove
  normalization, coverage, and loop selection; manual forward tests inspect
  agent adherence but are not the regression gate.
- Run repository shell, runtime contracts, doctor, and diff checks.

### Review Plan

- Contract: verify code-health improvement, blocker eligibility, navigation, and
  explanation rules are observable and internally consistent.
- Boundary: verify no Google-specific staffing/SLA terminology, new skill,
  model pin, or mutation authority enters Core.
- Compatibility: verify current P0-P3/blocker consumers remain valid and custom
  callers normalize before entering the generic Core loop.
- Validation: require static contract checks plus all committed fixture cases;
  record manual agent forward tests separately.
