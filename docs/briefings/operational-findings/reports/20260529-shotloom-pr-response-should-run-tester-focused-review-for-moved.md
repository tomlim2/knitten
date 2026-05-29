---
status: captured
created: 2026-05-29
updated: 2026-05-29
initial-source: user-report
area: workflow
contexts:
  - shotloom PR #431 / shotloom-respond-pr
promotion-target: unknown
urgent: false
---

# Shotloom PR response should run tester-focused review for moved contracts

## Summary

Shotloom PR #431 moved S2M StageRenderable seed ownership into shotloom-s2m. Review feedback caught that newly owned public helpers had happy-path coverage but missed direct false-case and edge-case tests: matches_seed needed asset_id/source/uri mismatch tests, asset_id_from_source_asset_id needed canonical seed and prefixless fallback tests, and asset_id_from_path needed implicit edge-case tests. General lesson: when a PR moves ownership or defines a new boundary, a tester-focused review pass should explicitly ask whether the owning module now pins true cases, false cases, fallback inputs, and drift cases for every new public/helper contract before PR review.

## Observations

### 1. Initial capture

- Observed In: shotloom PR #431 / shotloom-respond-pr
- Rough Finding: Shotloom PR #431 moved S2M StageRenderable seed ownership into shotloom-s2m. Review feedback caught that newly owned public helpers had happy-path coverage but missed direct false-case and edge-case tests: matches_seed needed asset_id/source/uri mismatch tests, asset_id_from_source_asset_id needed canonical seed and prefixless fallback tests, and asset_id_from_path needed implicit edge-case tests. General lesson: when a PR moves ownership or defines a new boundary, a tester-focused review pass should explicitly ask whether the owning module now pins true cases, false cases, fallback inputs, and drift cases for every new public/helper contract before PR review.
- Why It Matters: <clarify during triage>
- Evidence: <add evidence during triage>
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: workflow
- Done When: finding is promoted, resolved, assetized, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: no
