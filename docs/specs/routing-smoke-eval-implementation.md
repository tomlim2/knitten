# Routing Smoke Eval Implementation

## Status

Superseded. The active eval is `context-load-smoke`; this document is retained
as historical implementation context for the earlier routing-smoke plan.

## Goal

Create a small, durable smoke eval that checks whether shorter Knitten Core skill
activation surfaces can route common requests without losing safety gates.

## Problem

The token-efficient routing milestone needs evidence before Knitten Core skill bodies are
shortened further. Today the repo has a planning document for the eval, but no
test cases, runner, report format, or repeatable validation command.

## Boundary

In scope:

- A 20-case eval set for current Knitten Core skills.
- A local runner that checks expected skill, expected references, reject
  behavior, visible safety requirements, and approximate token cost.
- A generated local report that records pass/fail metrics and blockers.
- Documentation that says the token model is a worst-case estimate, not a claim
  about runtime model usage.

Out of scope:

- Calling external model APIs.
- Measuring real tokenizer output.
- Migrating skill bodies.
- Changing skill routing behavior.
- Adding RAG, vector search, or retrieve-and-rerank.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `MILESTONE.md` | Yes | Priority source of truth for the token-efficient routing milestone. |
| `docs/specs/token-efficient-routing-smoke-eval.md` | Yes | Existing eval plan and metrics. |
| `skills/*/SKILL.md` | Yes | Current Knitten Core skill activation surfaces and safety text. |
| `skills/*/references/*` | No | References expected to load after activation. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| `evals/routing-smoke/cases.json` | durable | Request cases and expected route metadata. |
| `evals/routing-smoke/activation-surfaces.json` | durable | Explicit activation text and expected reference cost inputs for each pilot skill. |
| `scripts/run-routing-smoke-eval.mjs` | durable | Local deterministic eval runner. |
| `.agent-local/ah/evals/routing-smoke/latest.json` | local | Generated report with metrics, failures, and token estimates. |
| `docs/specs/routing-smoke-eval-result.md` | durable | Reviewed first-run summary and migration decision. |
| `docs/specs/token-efficient-routing-smoke-eval.md` | durable | Updated with the concrete command and artifact paths. |

## Contract

- The eval must run without network access or external services.
- The eval must use only current Knitten Core skills: `implement`, `draft-spec`,
  `review`, and `report-finding`.
- Each case must declare `id`, `request`, `expectedSkill`,
  `expectedReferences`, `safetyGateRequired`, and `notes`.
- Each case must declare `group` as one of `implementation`, `spec`, `review`,
  `finding`, or `reject` so group counts are mechanical.
- `expectedReferences` must be an array of repo-relative paths. Use an empty
  array when no reference should load.
- Reject cases must use `expectedSkill: "reject"`.
- The runner must fail when routing accuracy, reject accuracy, reference
  precision, average estimated savings rate, or safety checks miss the fixed
  threshold.
- Metric thresholds are fixed for this eval:
  - routing accuracy: at least `18/20`
  - reject accuracy: `4/4`
  - reference precision: at least `80%`
  - safety miss count: `0`
  - average estimated savings rate: at least `30%`
- The runner must treat safety misses as blockers even when token savings pass.
- The runner must compute `predictedSkill` from request text and deterministic
  matcher rules. It must not use `expectedSkill` as input to prediction.
- Matcher rules must be declared outside the test cases so the same request can
  fail when the matcher is wrong.
- The runner must read gated-cost inputs from
  `evals/routing-smoke/activation-surfaces.json`; it must not infer activation
  surfaces from ad hoc section names.
- Each activation-surface entry must declare `skill`, `activationText`,
  `references`, and `safetyTerms`.
- For safety-required matched cases, at least one declared `safetyTerms` entry
  must appear in the counted activation text for the predicted skill.
- Token estimates must be deterministic and labeled as approximate:
  `ceil(character_count / 4)`.
- A case counts as reference-precise when the loaded reference set exactly
  matches `expectedReferences`. Reject cases expect an empty reference set.
- The eval may use deterministic matcher rules; it must not pretend to measure
  live model judgment.
- Raw reports must be local artifacts under `.agent-local`.
- The first run used to justify a migration decision must be summarized in a
  durable reviewed result note.

## Validation

- `node --check scripts/run-routing-smoke-eval.mjs`
- `node scripts/run-routing-smoke-eval.mjs --report`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`

## Acceptance Criteria

- The eval case file contains exactly 20 cases with the group counts from the
  milestone plan.
- The activation-surface fixture contains one entry for each pilot skill and
  names any reference files counted in gated cost.
- The runner emits JSON containing routing accuracy, reject accuracy, reference
  precision, safety miss count, average estimated savings rate, predicted skill
  for each case, and blockers.
- A clean run exits 0 only when safety miss count is 0 and metric thresholds
  pass.
- The generated report path is printed and is under `.agent-local`.
- A durable result note records the first reviewed run before any migration
  decision uses the eval result.
- The implementation does not change existing skill behavior.
- The eval document names the command and report path.

## Open Questions

- None.

## Design Plan

### Inputs

- `MILESTONE.md`
- `docs/specs/token-efficient-routing-smoke-eval.md`
- `skills/implement/SKILL.md`
- `skills/draft-spec/SKILL.md`
- `skills/review/SKILL.md`
- `skills/report-finding/SKILL.md`
- `skills/review/references/triad.md`
- `skills/report-finding/references/flow.md`

### Outputs

- `evals/routing-smoke/cases.json`
- `evals/routing-smoke/activation-surfaces.json`
- `scripts/run-routing-smoke-eval.mjs`
- `.agent-local/ah/evals/routing-smoke/latest.json`
- `docs/specs/routing-smoke-eval-result.md`
- Updated `docs/specs/token-efficient-routing-smoke-eval.md`
- Validation evidence from the commands above

### Implementation Sequence

#### 1. Add The Case Set

Files:

- `evals/routing-smoke/cases.json`

Changes:

- Add 20 request cases:
  - 5 implementation requests
  - 4 spec requests
  - 4 review requests
  - 3 finding-record requests
  - 4 neighboring or non-Knitten Core reject requests
- Include expected skill, expected references, safety requirement, and notes for
  each case.
- Keep cases short and user-like rather than synthetic parser fixtures.

Risk:

- If the requests are too obvious, the eval will not reveal ambiguous routing.

Proof:

- Case counts match the table in `docs/specs/token-efficient-routing-smoke-eval.md`.

#### 2. Add The Activation Surface Fixture

Files:

- `evals/routing-smoke/activation-surfaces.json`

Changes:

- Add one activation-surface entry for each pilot skill.
- Store the exact activation text to count for gated cost.
- Store the expected reference files that may be counted after a skill match.
- Store safety terms that must remain visible in the activation text when a
  safety-required case matches the skill.
- Keep this fixture separate from `cases.json` so cost measurement does not
  depend on hidden parsing of current `SKILL.md` headings.

Risk:

- If the fixture drifts from the skill files, token estimates become stale.

Proof:

- The runner fails when a fixture references a missing skill or reference file.

#### 3. Add The Local Runner

Files:

- `scripts/run-routing-smoke-eval.mjs`

Changes:

- Load the cases and current Knitten Core skill/reference files.
- Load matcher rules from the runner or a runner-local constant, not from
  expected case results.
- Compute `predictedSkill` from request text before comparing with
  `expectedSkill`.
- Estimate baseline cost from full pilot `SKILL.md` bodies.
- Estimate gated cost from `activation-surfaces.json` plus expected references
  for each matched case.
- Check expected skill, reject behavior, expected reference availability, and
  visible safety text for cases that require it.
- Write a JSON report to `.agent-local/ah/evals/routing-smoke/latest.json` when
  `--report` is passed.

Risk:

- A deterministic runner can verify the eval contract, but it cannot prove live
  model judgment.

Proof:

- `node --check scripts/run-routing-smoke-eval.mjs`
- `node scripts/run-routing-smoke-eval.mjs --report`

#### 4. Document The Concrete Eval Command

Files:

- `docs/specs/token-efficient-routing-smoke-eval.md`

Changes:

- Replace "future eval location" language with the concrete case file, runner,
  and report path.
- State that the runner is a deterministic smoke gate and not a model benchmark.

Risk:

- Overstating the result could turn a smoke eval into a false benchmark claim.

Proof:

- The doc says a passing result supports only pilot migration, not broad
  migration.

#### 5. Record The First Reviewed Result

Files:

- `docs/specs/routing-smoke-eval-result.md`

Changes:

- Summarize the first reviewed run after the runner exists.
- Record metrics, blockers, raw report path, and whether pilot migration may
  proceed.
- State that a passing result supports only the pilot, not broad migration.

Risk:

- Recording raw generated JSON directly in docs could make the result noisy and
  hard to review.

Proof:

- The result note cites the local report path and includes the pass/fail
  decision.

#### 6. Run Repository Validation

Files:

- `scripts/validate-repository-shell.mjs`

Changes:

- Narrowly allow `evals/routing-smoke/*.json` fixtures.
- Keep broader eval directories disallowed until a future accepted spec needs
  them.

Risk:

- Broad shell allowances could weaken the repository boundary.

Proof:

- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`

### Review Plan

- Contract: verify the eval checks routing, reject behavior, references, safety,
  and token estimates without claiming live model accuracy.
- Boundary: verify no skill behavior, external service, or broad migration is
  introduced.
- Validation: require runner syntax, runner execution, repository shell
  validation, and doctor output.
