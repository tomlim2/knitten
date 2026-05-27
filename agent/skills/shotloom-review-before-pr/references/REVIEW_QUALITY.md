---
status: accepted
---

# Review Quality

Use this reference from `shotloom-review-before-pr` after every review pass and
before `PROCESS_POLICY.md` handles findings.

## Finding Quality Check

Run this check for Single, Triad, Large Boundary, and Docs findings.

| Step | Action |
|---|---|
| 1 | Convert every candidate with P0, P1, or P2 priority into the Blocker Finding Contract. |
| 2 | Run the Refute Pass against each blocker candidate. |
| 3 | Send only `supported` blockers to `PROCESS_POLICY.md` Finding Handling. |
| 4 | Move `unsupported` candidates to notes or P3. |
| 5 | Move `design-question` and `out-of-scope` findings to the existing `PROCESS_POLICY.md` branches. |

## Blocker Finding Contract

Every finding with `blocker=true` must include all rows.

| Field | Required content |
|---|---|
| Priority | P0, P1, or P2. |
| Blocker | `true`. |
| Location | Exact changed or directly adjacent path and line. |
| Failure scenario | Concrete user, runtime, data, API, test, or maintenance failure. |
| Current evidence | Direct diff, source, test, spec, issue, or command evidence. |
| Expected behavior | Cited requirement or repo convention. |
| Test/proof gap | Why current tests, checks, or docs do not prove the behavior. |
| Suggested verification | Smallest command, assertion, fixture, or manual proof that verifies the fix. |
| Scope source | Issue, spec, PR scope, changed surface, or `needs-design-judgment`. |

If any row is missing, label the candidate `needs-evidence` before the Refute
Pass.

## Refute Pass

Run this pass caller-side. Dispatch another review agent only when direct
evidence is unavailable.

| Verdict | Meaning | Next action |
|---|---|---|
| supported | Direct evidence proves the blocker contract. | Send to Finding Handling. |
| duplicate | Same behavior and same evidence as another finding. | Merge into the stronger finding. |
| unsupported | Evidence does not prove the failure. | Downgrade to P3/note or drop. |
| design-question | Correct behavior requires product/design judgment. | Ask one focused question before editing. |
| out-of-scope | Real issue outside current branch scope. | Ask whether to accept risk or split follow-up. |

Template:

```markdown
## Refute Pass - branch <branch>

| Candidate | Contract complete? | Refutation check | Verdict | Next action |
|---|---:|---|---|---|
| <id/path> | yes/no | <direct evidence checked> | supported/duplicate/unsupported/design-question/out-of-scope | <action> |
```

## Calibration Notes

When useful, summarize repeated false positives, missed supported blockers, or
duplicate findings as short notes in the review output.
