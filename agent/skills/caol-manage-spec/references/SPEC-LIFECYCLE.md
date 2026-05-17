---
status: accepted
---

# Spec Lifecycle

## Preferred Status Values

| State | Meaning |
|-------|---------|
| `draft` | written but not ready to execute |
| `proposed` | ready for user or cold-start review |
| `active` | accepted and currently being implemented |
| `implemented` | implementation done; validation may still be pending |
| `completed` | implementation and validation complete |
| `blocked` | waiting on a decision or dependency |
| `parked` | intentionally paused |
| `superseded` | replaced by another spec |
| `archived` | retained for history, not active work |

Legacy states such as `open`, `done`, and `implemented-validation-blocked`
should be preserved unless the user asks to normalize them or a lifecycle action
requires a state change.

## Archive Mapping

| User intent | Status |
|-------------|--------|
| done | `completed` |
| no longer relevant | `archived` |
| replaced | `superseded` |
| paused | `parked` |
| waiting | `blocked` |

## Update Rules

1. Preserve accepted decisions unless the user changes them.
2. Keep `updated: YYYY-MM-DD` current.
3. Add replacement links when superseding.
4. Do not silently remove acceptance criteria.
5. Do not rewrite whole docs when a focused patch is enough.

## Delete Gate

Delete is destructive. Require:

1. explicit deletion request;
2. exact path shown before edit;
3. `git status --short` review;
4. no unrelated/user edits in target;
5. final diff showing only intended deletion.
