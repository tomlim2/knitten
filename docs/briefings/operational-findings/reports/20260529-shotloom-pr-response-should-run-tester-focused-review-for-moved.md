---
status: done
created: 2026-05-29
updated: 2026-05-29
initial-source: user-report
area: workflow
contexts:
  - shotloom PR #431 / shotloom-respond-pr
promotion-target: proposed `agent/skills/shotloom-review-tests/PROMOTED_FINDINGS.md`
urgent: false
---

# Shotloom PR response should run tester-focused review for moved contracts

## Summary

Shotloom PR #431 moved S2M StageRenderable seed ownership into shotloom-s2m. Review feedback caught that newly owned public helpers had happy-path coverage but missed direct false-case and edge-case tests: matches_seed needed asset_id/source/uri mismatch tests, asset_id_from_source_asset_id needed canonical seed and prefixless fallback tests, and asset_id_from_path needed implicit edge-case tests. General lesson: `shotloom-review-before-pr` needs a test-focused review leaf named `shotloom-review-tests` that checks whether tests prove true cases, false cases, fallback inputs, edge inputs, and drift cases for each new public/helper contract before PR review.

## Observations

### 1. Initial capture

- Observed In: shotloom PR #431 / shotloom-respond-pr
- Rough Finding: Shotloom PR #431 moved S2M StageRenderable seed ownership into shotloom-s2m. Review feedback caught that newly owned public helpers had happy-path coverage but missed direct false-case and edge-case tests: matches_seed needed asset_id/source/uri mismatch tests, asset_id_from_source_asset_id needed canonical seed and prefixless fallback tests, and asset_id_from_path needed implicit edge-case tests.
- Why It Matters: `shotloom-review-code` can find implementation defects while still missing whether the test suite proves the new contract. `shotloom-review-before-pr` needs a separate test-focused leaf so test-code review is not incidental to code review.
- Evidence: PR #431 review feedback identified missing negative and fallback tests for helpers newly owned by `shotloom-s2m`.
- Follow-up Guess: Add proposed leaf `shotloom-review-tests`; wire it into `shotloom-review-before-pr` after code/triad blocker handling and before docs review.
- Needs Clarification: no

## Suggested Follow-up

- Next pass should design `shotloom-review-tests` as the before-PR test contract review leaf.
- Problem: before-PR review lacks a named test-code reviewer for contract proof quality.
- Likely Scope: workflow
- Done When: `shotloom-review-before-pr` runs `shotloom-review-tests` after code/triad blocker handling and before docs review, and the leaf reviews tests for true, false, fallback, edge, and drift coverage on changed public/helper contracts.
- Possible destination: `agent/skills/shotloom-review-tests/PROMOTED_FINDINGS.md`

## Status

- Current State: done
- Fast Track: no
