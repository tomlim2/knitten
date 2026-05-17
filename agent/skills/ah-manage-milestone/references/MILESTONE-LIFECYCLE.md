---
status: accepted
---

# Milestone Lifecycle

## Status Values

| Status | Meaning |
|--------|---------|
| `proposed` | candidate milestone, not accepted |
| `active` | accepted umbrella currently being worked |
| `completed` | all acceptance criteria are satisfied |
| `blocked` | waiting on a decision or external dependency |
| `parked` | intentionally paused |
| `superseded` | replaced by another milestone |
| `archived` | retained for history, not active work |

## Completion Gate

Set `status: completed` only when:

1. required specs are completed or removed from scope;
2. acceptance criteria have evidence;
3. blockers are empty or intentionally closed;
4. open decisions are empty or moved to a follow-up milestone or spec.

## Archive Mapping

| User intent | Status |
|-------------|--------|
| done | `completed` |
| no longer active | `archived` |
| replaced | `superseded` |
| paused | `parked` |
| waiting | `blocked` |

## Delete Gate

Delete only when the user explicitly requests deletion.

Required before deletion:

1. show exact `docs/milestones/<slug>.md` path;
2. run `git status --short`;
3. verify no unrelated or user edits in the target;
4. inspect linked specs;
5. ensure final diff deletes only the milestone file.

Deleting a milestone never deletes linked specs.
