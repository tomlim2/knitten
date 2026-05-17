---
status: accepted
---

# Spec Lifecycle

## Path Resolution

Resolve a spec slug by searching these paths in order:

```text
docs/plans/active/<slug>.md
docs/plans/proposed/<slug>.md
docs/plans/drafts/<slug>.md
docs/plans/parked/<slug>.md
docs/plans/completed/<slug>.md
docs/plans/archive/<slug>.md
docs/plans/<slug>.md
```

If more than one path exists for the same slug, stop and report duplicate
lifecycle state. Do not choose one silently.

For direct path input, accept only paths under `docs/plans/` and reject report
or evidence paths:

```text
docs/plans/reports/**
```

Default create target:

| User intent | Target |
|-------------|--------|
| spec first, proposal, plan | `docs/plans/proposed/<slug>.md` |
| start implementation now | `docs/plans/active/<slug>.md` |
| conflict or unresolved facts | `docs/plans/drafts/<slug>.md` |

During the transition, existing flat paths under `docs/plans/<slug>.md` remain
valid. New code and skills should use the resolver instead of assuming the flat
path.

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
