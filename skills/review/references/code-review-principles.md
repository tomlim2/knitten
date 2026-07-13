---
status: accepted
---

# Core Code Review Principles

This reference is the canonical, organization-neutral review contract shared by
`review`, `triad-preflight`, and `review-fix-loop`. External engineering guides
may explain its provenance, but this local contract is normative at runtime.

## Approval Standard

- Approve readiness when the change improves or preserves overall code health,
  all review-required coverage is complete, no supported P0-P2 blocker remains,
  and no product or design judgment is unresolved.
- Do not require perfection. P3 polish, optional alternatives, and educational
  notes do not delay readiness.
- Do not accept a demonstrated reduction in correctness, safety,
  maintainability, readability, testability, or supported behavior under the
  non-perfection rule.
- Evidence, accepted specifications, repository rules, and established
  engineering principles outrank personal preference. When multiple approaches
  are equally valid, accept the author's choice.

## Finding Priority And Loop Eligibility

- `priority` and `blocker` are the only machine-readable readiness and generic
  fix-loop eligibility fields. Do not introduce a parallel intent state.
- P0, P1, and P2 findings use `blocker=true`; the generic Core loop never
  downgrades them. P3 uses `blocker=false`.
- `Optional:`, `Nit:`, and `FYI:` are presentation labels for P3 only. They do
  not affect readiness, merge priority, or loop selection.
- A finding enters the generic fix loop only when it is P0-P2 and
  `blocker=true`. Custom callers fully normalize their own schema before entry;
  Core does not interpret custom mapping objects.
- Genuine product or design ambiguity goes to `needsDesignJudgment` and stops
  for caller judgment instead of becoming an automatic fix.

## Review Navigation And Coverage

The caller creates a changed-surface inventory before role dispatch. Each item
uses this exact shape:

```json
{
  "surfaceId": "src/example.ts#changed-lines",
  "path": "src/example.ts",
  "kind": "human|generated|data",
  "reviewRequired": true,
  "exclusionReason": null
}
```

`surfaceId` is unique within the packet. A file-level ID covers every
human-written changed line in that file; hunk or section IDs may split one file.
Human-written surfaces always require review. Generated or data surfaces may be
excluded only with a non-empty reason.

An excluded surface must not appear in any role's assigned, checked, or skipped
coverage. Reject such a packet instead of counting the surface as reviewed.

Every review-required surface is assigned to at least one role. Within its
assigned scope, each full-review role follows this order:

1. Confirm the change purpose, concise what/why description, accepted scope,
   non-goals, and primary consumer.
2. Inspect the highest-value design or contract surface first.
3. Inspect tests early when they clarify intent, including whether they fail for
   the defect they claim to catch.
4. Review every human-written changed line, then enough whole-file and system
   context to judge integration and complexity.
5. Report assigned, checked, and reason-bearing skipped surface IDs.

A required skipped surface remains uncovered. Excluded generated/data surfaces
are not counted as reviewed. Full review is complete only when no required
surface is uncovered. Preflight applies only navigation steps 1-2 plus cheap
evidence and surface checks; it never claims every-line coverage or readiness.

The authoritative full-review calculations are:

```text
coverage.complete = uncovered is empty
ready = no P0-P2 blocker
        AND coverage.complete
        AND needsDesignJudgment is empty
nextAction = ask      when needsDesignJudgment is non-empty
             fix      when no design judgment remains and a P0-P2 blocker exists
             review   when no blocker remains and coverage.complete is false
             complete otherwise
```

Emit the exact `nextAction` literals `ask`, `fix`, `review`, or `complete`.
Never substitute synonyms such as `ready`, `fix-blocker`, or `needs-review`.
Validation is a separate completion gate: a fix loop may write a complete
checkpoint only when `ready=true` and validation passes.

## Design, Complexity, And Change Size

- Check current requirements and design before local style polish.
- New abstractions, dependencies, public surfaces, or generic behavior require
  a current accepted need. Speculative future flexibility is a scope finding.
- Treat one self-contained behavior or contract, its tests, and required docs as
  one conceptual change.
- Recommend a split for independent behavior, unrelated reviewers, mixed
  refactor/feature work, rollback boundaries, or review comprehension risk.
  Do not use a hard line-count threshold.
- Keep tests that prove changed behavior with that behavior. An earlier
  test-only change may establish missing baseline coverage for a later refactor.

## Comment And Explanation Quality

- Address code and behavior, never the author.
- A required finding directly states the evidence, violated contract, impact,
  and smallest corrective outcome. Do not disguise a supported requirement as
  a question.
- Ask a question only for genuine ambiguity and place it in
  `needsDesignJudgment`.
- Prefer simpler code or durable `why` documentation when future readers would
  otherwise need the review conversation. A thread-only explanation is not a
  fix.
- Generic praise and emotional commentary are out of scope. Factual positive
  reinforcement may appear as `Positive evidence: ...` in role `Notes` when it
  names the practice and code-health benefit; it is never a finding or risk.
- On pushback, re-evaluate against new evidence. Withdraw an invalid finding;
  otherwise restate its technical reason and impact.
- Resolve complexity introduced by the current change now. Record unrelated
  pre-existing debt as an explicit follow-up rather than expanding scope.

## Description Handoff

Packets contain concise what/why context, not only paths or a branch name. When
review proves that accepted scope or behavior changed, merged output sets:

```json
{
  "handoff": {
    "descriptionRefreshRequired": true,
    "reason": "<grounded scope or behavior change>"
  }
}
```

Core emits only this signal. The owning PR or specification workflow decides
how to refresh its durable description. External links supplement but do not
replace local what/why context.
