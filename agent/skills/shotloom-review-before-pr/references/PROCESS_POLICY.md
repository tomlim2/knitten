---
status: accepted
---

# Pre-PR Process Policy

Operational policy for `shotloom-review-before-pr`.

## Phase Boundary

| Phase | Owns | Does not own |
|---|---|---|
| Review brief | Source-cited diff inventory, surface map, risk questions, evidence ledger, and verifier. | Defect verdicts, safety claims, or replacing raw diff review. |
| Review quality | Blocker contract, refute pass, calibration notes. | Original defect discovery or code edits. |
| Single code | Small, low-risk code review with the `shotloom-review-code` checklist. | Triad roles, exhaustive boundary mirror checks. |
| Triad | Broad defect discovery for large or risky diffs across runtime/contract, QA, and maintainer/product roles. | Sequential boundary batch execution or final prose polish. |
| Implement blockers | Writing normalized blocker findings to a temporary JSON handoff file, passing that file to `shotloom-implement-code`, re-running the owning review phase, and committing loop fixes before `prReady=true`. | Finding discovery, PR creation, broad release gates, push. |
| Docs | Final changed prose/comment/rustdoc and evidence clarity after code review settles. | Re-reviewing code behavior already owned by Single/Triad. |

## Phase Order

Run phases in this order:

1. Review mode decision.
2. Selected main review: Single code or Triad.
3. Code blocker handling: implement blocker findings, then repeat the selected
   main review until code blockers are zero or implementation needs user input.
   Commit loop fixes before continuing to docs review.
4. Docs review.
5. Docs blocker handling: implement blocker findings, then repeat docs review
   until docs blockers are zero or implementation needs user input. Commit loop
   fixes before returning `prReady=true`.
6. Readiness summary.

If implementation needs missing input or product/design judgment, stop with
readiness JSON. Non-blocking findings do not change `prReady`.

## Missing Shared Policy Inputs

Some Shotloom worktrees reference agent-hub shared files such as `SYSTEM.md` or
`agent/rules/index.md` that are not present inside the Shotloom checkout. Handle
them as structured input state, not shell noise.

| Case | Action |
|---|---|
| Repo-requested shared file exists in cwd | Read it normally. |
| Repo-requested shared file is missing in cwd but installed agent-hub copy exists | Read the installed/current agent-hub copy and report `shared-policy-source=<path>`. |
| Repo-requested shared file is missing everywhere | Report `missing-shared-policy-input path=<path>` and continue only if Shotloom in-repo guidance plus loaded skill/rule context is enough for the current review. |
| Missing input changes the review contract | Stop and ask for the correct shared-policy path. |

Do not run `cat`, `sed`, or similar file reads against a path before checking it
exists. Do not show raw `No such file or directory` output as the finding.

## Validation Timing

Use the smallest validation that proves the current phase.

| Moment | Validation |
|---|---|
| Active small-edit iteration | No broad workspace test run. Use no command or one targeted command tied to changed behavior. |
| Behavior, state, prop, accessibility, route, or data-contract change | Run the smallest targeted test/check that can fail for that contract. |
| Commit, push, or `shotloom-make-pr` | Run the Shotloom repo-required broad gates. |
| User explicitly asks for broad validation | Run the requested broad command and report duration/result. |

Do not replace focused proof with a broad green gate. Do not run broad tests after
each wording/style-only edit.

## Finding JSON Schema

Normalize supported findings before readiness output.

| Field | Required | Meaning |
|---|---|
| `id` | yes | Stable within one run: `C1`, `T1`, `B1`, `D1`. |
| `kind` | yes | `code`, `triad`, or `docs`. |
| `priority` | yes | `P0`, `P1`, `P2`, or `P3`. |
| `blocker` | yes | `true` blocks `prReady`; `false` is nit or follow-up. |
| `status` | yes | `unresolved`, `fixed`, `accepted-follow-up`, `nit`, or `needs-normalization`. |
| `source` | yes | Guideline, ADR, spec, pattern, or contract evidence. |
| `file` | when available | Repo-relative path. |
| `line` | when available | Exact or nearest line. |
| `summary` | yes | One-sentence defect. |
| `requiredAction` | yes for blockers | Concrete fix or focused user question. |
| `acceptanceCheck` | yes for blockers | Test, fixture, command, or diff condition proving the fix. |

## Finding Handling

| Finding | Action |
|---|---|
| Supported P0-P2, in scope | Mark `blocker=true`; write to the phase handoff JSON for `shotloom-implement-code`. |
| Supported P0-P2, ambiguous | Mark `blocker=true`; ask one focused question before editing. |
| Supported P0-P2, out of scope | Mark `blocker=true` unless the user accepts it as follow-up. |
| Supported P0-P2, product/design decision | Mark `blocker=true`; ask before editing. |
| P3/nit | Mark `blocker=false`; include in findings without changing readiness. |
| Missing required schema field | Mark `status=needs-normalization`; treat as blocker when blocker risk exists. |

## Readiness JSON

Every run writes one result file and prints the same JSON block. Resolve the
result file with `agent/lib/resolve-local-artifact-path.mjs`:

```bash
node "$knitten_root/agent/lib/resolve-local-artifact-path.mjs" \
  --root "$knitten_root" --create shotloom before-pr stl-<N> <safe-branch> readiness
```

`<safe-branch>` maps slash and whitespace to `-`.

```json
{
  "prReady": false,
  "phase": "code-review",
  "branch": "feat/example",
  "headSha": "abc1234",
  "dirty": true,
  "resultPath": ".agent-local/shotloom/before-pr/stl-123/feat-example/readiness.json",
  "needsTriad": false,
  "blockersRemaining": 1,
  "findings": [
    {
      "id": "C1",
      "kind": "code",
      "priority": "P2",
      "blocker": true,
      "status": "unresolved",
      "source": "docs/guidelines/review-rust.md §3",
      "file": "crates/example/src/lib.rs",
      "line": 42,
      "summary": "Fallible IO error is dropped.",
      "requiredAction": "Preserve and return the error.",
      "acceptanceCheck": "Targeted test fails before the fix and passes after it."
    }
  ]
}
```

Set `prReady=true` when `blockersRemaining=0`.
Set `dirty=false` only after blocker fixes are committed or no worktree changes
were produced by this run.

## Review Summary

Report the review state after the JSON.

| State | Summary text |
|---|---|
| Blocker remains | `Review summary: blockers remain.` List each blocker. |
| Blockers fixed or accepted | `Review summary: blockers fixed or accepted.` List evidence. |
| Nit-only | `Review summary: nit-only; prReady=true.` List optional items. |
| Clean | `Review summary: clean; prReady=true.` List phases run. |

`shotloom-make-pr` owns local CI-equivalent gates, PR title/body drafting, and
explicit approval before `gh pr create`.

## Binding Rules

- Print the `needsTriad` decision JSON before launching review agents.
- Run `REVIEW_QUALITY.md` -> `Finding Quality Check` before `Finding Handling`.
- Run one selected main review before docs.
- In Single mode, run code pass A only.
- In Triad mode, run triad pass A only; never run code pass A in the same chain.
- Write blocker findings to the resolver path for `code-blockers` or
  `docs-blockers` before invoking `shotloom-implement-code`; do not make review
  child skills own implementation routing.
- Treat branch scope as a reviewable signal: when the diff combines multiple
  Linear scopes, the issue/spec evidence should name the combined boundary. If
  not, report a scope-control finding.
- Use read-only Explore subagents.
- Keep commits, pushes, PR creation, and PR comments outside this review skill.
