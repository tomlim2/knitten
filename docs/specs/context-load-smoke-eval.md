# Context-Load Token Efficiency Smoke Eval

## Status

Implemented as a deterministic smoke eval. The first reviewed run is recorded in
[`context-load-smoke-eval-result.md`](context-load-smoke-eval-result.md).

## Goal

Design a small experiment that can show whether Knitten's match-based progressive
loading direction produces measurable context savings without breaking skill
match accuracy or safety checks.

This is not a full product benchmark. It is a smoke eval for deciding whether
the context-load direction is worth implementing in the first pilot batch.

## Hypothesis

Knitten can reduce always-loaded instruction context by using short match
checks and loading detailed references only after a skill match.

The hypothesis is valid only if:

- match and reject accuracy remain high,
- mutation safety checks are never missed,
- selected references are narrower than the full skill body,
- the match overhead is smaller than the avoided context.

## Recording Rule

Every context-load/token-efficiency experiment must leave a durable record before its
results are used to justify migration or README claims.

Record:

- hypothesis,
- test cases,
- measurement method,
- raw result or summary report,
- objective review findings,
- decision and follow-up.

## Experiment Shape

### Pilot Skills

| Skill | Role | Why |
|-------|------|-----|
| `implement` | Implementation umbrella | Tests scoped implementation matching and deferred detailed flow. |
| `draft-spec` | Spec drafting | Tests plan/spec requests, match policy guidance, and reusable-concept checks. |
| `review` | Read-only review | Tests single/triad review matching and prepared-packet rejection. |
| `report-finding` | Local finding capture | Tests evidence-match-based local record writes without external mutation. |

### Test Set

Use 20 request cases:

| Group | Count | Expected Behavior |
|-------|-------|-------------------|
| Matching implementation requests | 5 | Match `implement`; select implementation reference when present. |
| Matching spec requests | 4 | Match `draft-spec`; keep drafting constraints visible. |
| Matching review requests | 4 | Match `review`; require a prepared packet or reject with missing packet. |
| Matching finding-record requests | 3 | Match `report-finding`; require checked mechanical evidence. |
| Neighboring/non-Knitten Core requests | 4 | Reject from the pilot set or name the better non-Knitten Core match. |

Each case records:

| Field | Meaning |
|-------|---------|
| `id` | Stable case id. |
| `request` | User-like request text. |
| `expectedSkill` | Pilot skill or `reject`. |
| `expectedReferences` | References that should load after match. |
| `safetyCheckRequired` | Whether file, local-record, or external-state safety must remain visible. |
| `notes` | Why the expected match is correct. |

## Token Cost Model

Use a deterministic estimate first. A later version can compare real model
usage.

Approximate tokens as:

```text
estimated_tokens = ceil(character_count / 4)
```

Baseline cost:

```text
baseline = full SKILL.md bodies for all pilot skills
      + all references those skills would otherwise load eagerly
```

Match-Based cost:

```text
match-based = match sections for all pilot skills
      + selected full skill/reference content for the matched skill
```

Rejected-request cost:

```text
reject_cost = match sections for all pilot skills
```

Context savings:

```text
savings = baseline - match-based
savings_rate = savings / baseline
```

This intentionally favors a simple, inspectable estimate over a model-specific
tokenizer in the first round.

## Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| Match accuracy | >= 18/20 | Matched requests choose the expected pilot skill. |
| Reject accuracy | >= 4/4 | Neighboring/non-Knitten Core requests do not incorrectly enter a pilot skill. |
| Safety miss count | 0 | Implementation and local-record requests keep safety checks visible. |
| Reference precision | >= 80% | Loaded references are expected by the test case. |
| Average savings rate | >= 30% | Match-Based path loads substantially less context than baseline. |

## Procedure

1. Create a small JSON test set at `evals/context-load-smoke/cases.json`.
2. Measure current pilot `SKILL.md` sizes.
3. Declare match surfaces and counted references at
   `evals/context-load-smoke/match-surfaces.json`.
4. Run `node scripts/run-context-load-smoke-eval.mjs --report`.
5. Review the local report at `.agent-local/workflow/evals/context-load-smoke/latest.json`.
6. Record the reviewed result and decide whether the pilot migration should
   proceed.

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Eval plan | durable | This document. |
| Test cases JSON | durable | `evals/context-load-smoke/cases.json`. |
| Match surfaces JSON | durable | `evals/context-load-smoke/match-surfaces.json`. |
| Runner | durable | `scripts/run-context-load-smoke-eval.mjs`. |
| Raw report | local | `.agent-local/workflow/evals/context-load-smoke/latest.json`. |
| Reviewed result | durable | `docs/specs/context-load-smoke-eval-result.md`. |

## Acceptance Criteria

- The eval can be run without external services.
- The test set includes positive, neighboring, and reject cases.
- The cost model is simple enough to audit by hand.
- Safety misses are treated as blockers regardless of token savings.
- A passing result supports only the pilot migration, not broad migration.
- The experiment result is recorded before any migration decision is made from
  it.

## Objective Review

### Findings

**[P1] The first cost model can overstate savings.**

The baseline assumes all pilot skill bodies are loaded together. If the runtime
already loads only one full skill body after initial matching, the measured
savings will be smaller. The eval must label the baseline as a conservative
"worst-case full pilot context" comparison, not as guaranteed current runtime
behavior.

**[P1] Accuracy cannot be proven with token counts alone.**

Reduced context is useful only if matching and safety stay correct. The eval
therefore needs expected-match assertions and safety-check checks, not just
before/after token estimates.

**[P2] A 20-case set is too small for broad claims.**

Twenty cases can justify a pilot, but it cannot prove Knitten is generally
token-efficient. Any README claim should say "pilot smoke eval" until a larger
eval exists.

**[P2] Reference precision needs concrete Knitten Core references.**

The eval should use current Knitten Core references such as `review/references/triad.md`
and `report-finding/references/flow.md`, plus proposed reference stubs for
skills that do not yet have deferred flow files.

### Readiness

Ready as pilot evidence after the reviewed result is recorded. Not ready as a
broad migration benchmark.

### Recommendation

Proceed with the smoke eval before migrating pilot skills. Treat any safety
miss as a blocker, and treat token savings as valid only when match/reject
accuracy also meets target.
