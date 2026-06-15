# Token-Efficient Routing Smoke Eval

## Status

Active planning. The eval has not produced evidence yet.

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
| `kc-implement` | Implementation umbrella | Tests scoped implementation routing and deferred detailed flow. |
| `kc-draft-spec` | Spec drafting | Tests plan/spec requests, activation policy guidance, and reusable-concept checks. |
| `kc-review` | Read-only review | Tests single/triad review routing and prepared-packet rejection. |
| `kc-report-finding` | Local finding capture | Tests evidence-gated local record writes without external mutation. |

### Test Set

Use 20 request cases:

| Group | Count | Expected Behavior |
|-------|-------|-------------------|
| Matching implementation requests | 5 | Route to `kc-implement`; select implementation reference when present. |
| Matching spec requests | 4 | Route to `kc-draft-spec`; keep drafting constraints visible. |
| Matching review requests | 4 | Route to `kc-review`; require a prepared packet or reject with missing packet. |
| Matching finding-record requests | 3 | Route to `kc-report-finding`; require checked mechanical evidence. |
| Neighboring/non-KC requests | 4 | Reject from the pilot set or name the better non-KC route. |

Each case records:

| Field | Meaning |
|-------|---------|
| `id` | Stable case id. |
| `request` | User-like request text. |
| `expectedSkill` | Pilot skill or `reject`. |
| `expectedReferences` | References that should load after activation. |
| `safetyGateRequired` | Whether file, local-record, or external-state safety must remain visible. |
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
| Reject accuracy | >= 4/4 | Neighboring/non-KC requests do not incorrectly enter a pilot skill. |
| Safety miss count | 0 | Implementation and local-record requests keep safety gates visible. |
| Reference precision | >= 80% | Loaded references are expected by the test case. |
| Average savings rate | >= 30% | Gated route loads substantially less context than baseline. |

## Procedure

1. Create a small JSON test set under a future eval location.
2. Measure current pilot `SKILL.md` sizes.
3. Draft or identify the proposed activation-only sections and reference files
   without relying on absent legacy pilot skills.
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

**[P2] Reference precision needs concrete KC references.**

The eval should use current KC references such as `kc-review/references/triad.md`
and `kc-report-finding/references/flow.md`, plus proposed reference stubs for
skills that do not yet have deferred flow files.

### Readiness

Ready as a planning artifact. Not ready as evidence until the test cases,
reference stubs, and cost report are created.

### Recommendation

Proceed with the smoke eval before migrating pilot skills. Treat any safety
miss as a blocker, and treat token savings as valid only when routing/reject
accuracy also meets target.
