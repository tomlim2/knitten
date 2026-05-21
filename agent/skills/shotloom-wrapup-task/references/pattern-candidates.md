---
status: active
---

# Review-Finding Pattern Candidates

## Purpose

Capture reusable review, CI, or rule findings during Shotloom wrapup without
promoting them directly into the review catalog.

## Destination

| Field | Value |
|---|---|
| Branch | `codex/shotloom-review-finding-patterns` |
| Preferred worktree | `<knitten-root>/.worktrees/shotloom-review-finding-patterns` |
| Inbox | `docs/briefings/shotloom/review-finding-patterns-inbox.md` |

## Worktree Rules

1. Do not write this inbox from a dirty Knitten main checkout.
2. Use the preferred worktree when it exists.
3. If the branch exists without a worktree, create the preferred worktree.
4. If neither branch nor worktree can be prepared safely, skip this phase and
   report the skip; do not block Linear or worktree cleanup.
5. Commit and push only the inbox update from that branch.

## Entry Shape

Write one `## PR NNN` section only when the PR has findings. Under it, add one
`### Pattern: ...` entry per generalized lesson. The entry is not a PR summary
and not a duplicate of the devlog `지적`; it is a reusable pattern candidate.

| Field | Content |
|---|---|
| `Finding` | What the reviewer, CI, or rule actually pointed out. |
| `Why It Was Right` | The underlying engineering principle, generalized beyond the PR. |
| `General Rule` | A portable rule that can guide future implementation or review. |
| `Trigger` | Concrete signals that should make an agent check for this pattern next time. |
| `Fix Shape` | The smallest typical fix or test shape. |
| `Source Evidence` | `PR NNN`, reviewer type, file:line or check name; no private GitHub URLs. |

## Constraints

- Do not include private Shotloom PR URLs or markdown links.
- Do not include Branch / Worktree / Commit-list metadata.
- Do not summarize the feature.
- Do not write bare `#NNN` or `#word` inline tags, except intentional allowed
  tags already used by the destination doc.
- Prefer 1-3 high-signal patterns per PR; merge repetitive nits into one
  pattern.
- If the finding is too PR-specific to generalize, keep it in the day log only
  and skip the inbox entry.

## Manual Promotion

- Run `/shotloom-promote-review-patterns` when the user wants to turn
  accumulated inbox entries into the actual review catalog.
- Run `/shotloom-promote-review-patterns --dry-run` to preview proposed
  promotions without editing.
- No scheduled automation is required by this skill.

## Example

```md
## PR 371

### Pattern: Multi-event command status precedence needs a regression case

- Finding: Reviewer pointed out that the status-ordering refactor had only single-terminal-event tests.
- Why It Was Right: Ordering bugs only appear when competing terminal events share the same command identity.
- General Rule: Any event-status precedence rule needs at least one test with competing correlated events in the same buffer.
- Trigger: Code chooses status by scanning an event list, prioritizing errors, or combining success and failure sentinels.
- Fix Shape: Add a test with success then failure, and preferably failure then success, for the same command id.
- Source Evidence: PR 371; review finding on `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx:437`.
```
