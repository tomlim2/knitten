# Token-Efficient Routing Smoke Eval

## Status

Draft.

## Goal

Design a small experiment that can show whether Knitten's gated progressive
loading direction produces measurable context savings without breaking routing
accuracy or safety gates.

This is not a full product benchmark. It is a smoke eval for deciding whether
the routing direction is worth implementing in the first pilot batch.

## Hypothesis

Knitten can reduce always-loaded instruction context by routing through short
activation gates and loading detailed references only after a skill match.

The hypothesis is valid only if:

- routing and reject accuracy remain high,
- mutation safety gates are never missed,
- selected references are narrower than the full skill body,
- the routing overhead is smaller than the avoided context.

## Recording Rule

Every routing/token-efficiency experiment must leave a durable record before its
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
| `ah-review-work` | Read-only review umbrella | Tests routing among spec, implementation, PR, and skill review. |
| `kc-implement` | Implementation umbrella | Tests scoped implementation routing and deferred detailed flow. |
| `ah-create-pr` | Mutation-adjacent PR leaf | Tests explicit user-request, push, and PR safety gates. |

### Test Set

Use 20 request cases:

| Group | Count | Expected Behavior |
|-------|-------|-------------------|
| Matching review requests | 5 | Route to `ah-review-work`; select one review reference. |
| Matching implementation requests | 5 | Route to `kc-implement`; select implementation reference. |
| Matching PR creation requests | 4 | Route to `ah-create-pr`; require safety gate. |
| Neighboring AH requests | 3 | Reject or route to a different AH skill. |
| Non-AH/domain requests | 3 | Reject from the pilot set. |

Each case records:

| Field | Meaning |
|-------|---------|
| `id` | Stable case id. |
| `request` | User-like request text. |
| `expectedSkill` | Pilot skill or `reject`. |
| `expectedReferences` | References that should load after activation. |
| `safetyGateRequired` | Whether mutation/external-state safety must remain visible. |
| `notes` | Why the expected route is correct. |

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
```

Gated cost:

```text
gated = activation sections for all pilot skills
      + selected full skill/reference content for the matched skill
```

Rejected-route cost:

```text
reject_cost = activation sections for all pilot skills
```

Context savings:

```text
savings = baseline - gated
savings_rate = savings / baseline
```

This intentionally favors a simple, inspectable estimate over a model-specific
tokenizer in the first round.

## Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| Routing accuracy | >= 18/20 | Matched requests choose the expected pilot skill. |
| Reject accuracy | >= 5/6 | Neighboring/non-AH requests do not incorrectly enter a pilot skill. |
| Safety miss count | 0 | PR/push/mutation-adjacent requests keep safety gates visible. |
| Reference precision | >= 80% | Loaded references are expected by the test case. |
| Average savings rate | >= 30% | Gated route loads substantially less context than baseline. |

## Procedure

1. Create a small JSON test set under a future eval location.
2. Measure current pilot `SKILL.md` sizes.
3. Draft the proposed activation-only sections and reference files without
   migrating the real skills yet.
4. Estimate baseline vs gated cost for every case.
5. Review routing decisions manually against expected routes.
6. Record misses and decide whether the pilot migration should proceed.

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Eval plan | durable | This document. |
| Test cases JSON | durable, future | Request cases and expected routes. |
| Cost report | durable | Baseline/gated token estimate and routing result summary. |
| Review notes | durable | Findings before pilot migration. |

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

Reduced context is useful only if routing and safety stay correct. The eval
therefore needs expected-route assertions and safety-gate checks, not just
before/after token estimates.

**[P2] A 20-case set is too small for broad claims.**

Twenty cases can justify a pilot, but it cannot prove Knitten is generally
token-efficient. Any README claim should say "pilot smoke eval" until a larger
eval exists.

**[P2] Reference precision needs concrete reference files.**

The milestone currently names examples such as `references/pr-create-flow.md`,
but the files do not exist yet. The smoke eval should either use proposed
reference stubs or wait until pilot references are drafted.

### Readiness

Ready as a planning artifact. Not ready as evidence until the test cases,
reference stubs, and cost report are created.

### Recommendation

Proceed with the smoke eval before migrating pilot skills. Treat any safety
miss as a blocker, and treat token savings as valid only when routing/reject
accuracy also meets target.
