---
status: accepted
---

# Review Quality

Use this reference from `shotloom-review-before-pr` after every review pass and
before `PROCESS_POLICY.md` handles findings.

## Finding Quality Gate

Run this gate for Single, Triad, Large Boundary, Docs, and verification pass
findings.

| Step | Action |
|---|---|
| 1 | Convert every P0-P2 candidate into the P0-P2 Finding Contract. |
| 2 | Run the Refute Pass against each P0-P2 candidate. |
| 3 | Send only `supported` P0-P2 findings to `PROCESS_POLICY.md` Finding Handling. |
| 4 | Move `unsupported` findings to notes or P3; do not edit code for them. |
| 5 | Move `design-question` and `out-of-scope` findings to the existing `PROCESS_POLICY.md` branches. |

## P0-P2 Finding Contract

Every P0-P2 finding must include all rows.

| Field | Required content |
|---|---|
| Priority | P0, P1, or P2. |
| Location | Exact changed or directly adjacent path and line. |
| Failure scenario | Concrete user, runtime, data, API, test, or maintenance failure. |
| Current evidence | Direct diff, source, test, spec, issue, or command evidence. |
| Expected behavior | Cited requirement or repo convention. |
| Test/proof gap | Why current tests, checks, or docs do not prove the behavior. |
| Suggested verification | Smallest command, assertion, fixture, or manual proof that verifies the fix. |
| Scope source | Issue, spec, PR scope, changed surface, or `needs-design-judgment`. |

If any row is missing, label the candidate `needs-evidence` before the Refute
Pass. Do not apply automatic code edits for `needs-evidence`.

## Refute Pass

Run this pass caller-side. Do not dispatch a new review agent unless direct
evidence is unavailable and the user approves extra review cost.

| Verdict | Meaning | Next action |
|---|---|---|
| supported | Direct evidence proves the P0-P2 contract. | Send to Finding Handling. |
| duplicate | Same behavior and same evidence as another finding. | Merge into the stronger finding. |
| unsupported | Evidence does not prove the failure. | Downgrade to P3/note or drop. |
| design-question | Correct behavior requires product/design judgment. | Ask one focused question before editing. |
| out-of-scope | Real issue outside current branch scope. | Ask whether to accept risk or split follow-up. |

Template:

```markdown
## Refute Pass - branch <branch>

| Candidate | Contract complete? | Refutation check | Verdict | Next action |
|---|---:|---|---|---|
| <P#/path> | yes/no | <direct evidence checked> | supported/duplicate/unsupported/design-question/out-of-scope | <action> |
```

## Feedback Log

Render this log once before handoff. Keep it in the review report; do not write
a durable file unless the user asks for persistent calibration data.

```markdown
## Review Feedback Log - branch <branch>

| Item | Count | Evidence |
|---|---:|---|
| Supported P0-P2 fixed | <N> | <finding IDs or N/A> |
| Supported P0-P2 accepted as follow-up | <N> | <finding IDs or N/A> |
| Unsupported candidates downgraded/dropped | <N> | <finding IDs or N/A> |
| Duplicate findings merged | <N> | <finding IDs or N/A> |
| Design/out-of-scope questions asked | <N> | <finding IDs or N/A> |
| New findings found during verification | <N> | <finding IDs or N/A> |
| Tests/checks added or run because of review | <N> | <commands or N/A> |
```

Use the log to calibrate future prompts: repeated unsupported candidates become
suppression examples; repeated missed supported findings become checklist rows.
