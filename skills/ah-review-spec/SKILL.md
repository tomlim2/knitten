---
name: ah-review-spec
description: Review an AH spec and design plan for unclear contracts, missing inputs or outputs, boundary leaks, validation gaps, and implementation risk.
---

# AH Review Spec

Use this leaf skill when reviewing a spec, design plan, or pre-implementation
contract.

## Input

- Spec.
- Design plan when present.

## Output

- Blocker findings.
- Nit findings.
- Readiness state.
- Residual risk.

## Review Lens

Check:

- input and output clarity
- boundary and non-goals
- implementation sequence
- validation and acceptance criteria
- naming consistency
- dependencies on unavailable paths, credentials, or legacy checkouts

Findings must cite the relevant section or line when possible.

## Path Handling

Review spec and design-plan paths relative to the active workspace. Treat plugin
paths as read-only resources unless the review is explicitly about the plugin.
