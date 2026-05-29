---
status: done
created: 2026-05-29
updated: 2026-05-29
initial-source: wrapup-task
area: docs
contexts:
  - shotloom PR 397
promotion-target: agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md
urgent: false
---

# Reviewer found that ADR-0060 described Stage import map_id, document_id, and pla

## Summary

Reviewer found that ADR-0060 described Stage import map_id, document_id, and placement_id as sharing one lowercase slug grammar while the implementation used structural Map segment validators for map/document ids and a stricter placement slug validator. Future durable contract docs should cross-check grammar prose against the exact validator branches or defer to the owning bridge contract.

## Observations

### 1. Initial capture

- Observed In: shotloom PR 397
- Rough Finding: Reviewer found that ADR-0060 described Stage import map_id, document_id, and placement_id as sharing one lowercase slug grammar while the implementation used structural Map segment validators for map/document ids and a stricter placement slug validator. Future durable contract docs should cross-check grammar prose against the exact validator branches or defer to the owning bridge contract.
- Why It Matters: <clarify during triage>
- Evidence: PR 397; review finding on docs/adr/adr-0060-stage-map-import-id-derivation.md
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: docs
- Done When: finding is promoted, resolved, assetized, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: done
- Fast Track: no
