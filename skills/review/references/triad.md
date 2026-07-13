---
status: accepted
---

# Triad Review Reference

Use this reference from `review`. It defines the reusable role review
pattern:

```text
review packet -> mode selection -> role selection -> read-only role reviews -> merged findings
```

The caller owns target discovery, diff generation, guideline loading, output
persistence, fixes, commits, PR bodies, and external mutation. Triad only
reviews the supplied packet and reports findings. Apply the canonical approval,
navigation, complexity, comment, and description-handoff rules from
[`code-review-principles.md`](code-review-principles.md); this reference owns the
runtime packet, role, coverage, and merge output shapes.

## Review Packet

The caller should provide:

~~~markdown
## Review target
<already materialized diff/content, or readable path to prepared artifact>

## Review brief
<purpose, changed behavior, touched surfaces, non-goals>

## Changed surfaces
```json
[
  {
    "surfaceId": "src/example.ts#changed-lines",
    "path": "src/example.ts",
    "kind": "human|generated|data",
    "reviewRequired": true,
    "exclusionReason": null
  }
]
```

## Base review documents
- <name/path or inline label> - <why useful; include justification when full-shared> - <budget: shared|role-specific|artifact-only|full-shared> - <path readable? yes/no>

## Finding schema
<optional caller schema; omitted means default Knitten Core finding schema>

## Review mode
single | triad

## Known constraints
- <approval, scope, product, migration, or testing constraint>
~~~

The packet should be concise and source-cited. Every review-required changed
surface must be assigned to at least one selected role before dispatch. If the
packet is too vague to choose roles, assign coverage, allocate context budgets,
or ground findings, stop and ask the caller to repair it.

## Packet Budget

Triad review should preserve review quality without copying every large base
document into every role prompt.

Classify each supplied base document or evidence source before dispatch:

| Budget | Use For | Role Handling |
|--------|---------|---------------|
| `shared` | Compact contracts, specs, schemas, or summaries every role needs. | Send to every role. |
| `role-specific` | Detailed docs relevant to one or two role lenses. | Send only to matching roles. |
| `artifact-only` | Raw logs, inventories, long diffs, command output, or connector snapshots that have a compact summary. | Send summary/path to every role; load raw content only when a role needs it to verify a finding. |
| `full-shared` | Source-of-truth text that every role must inspect directly. | Send to every role, but require a short justification. |

Default large or raw inputs to `artifact-only`. Escalate to `full-shared` only
when one of these is true:

- the reviewed target is the full document itself,
- every role must inspect the exact text to verify the same contract,
- summarizing would hide security, safety, API, migration, or data-loss
  semantics,
- the caller explicitly marks the document as mandatory full shared context and
  cites why.

If the packet cannot show enough compact context to choose roles and budgets,
ask the caller to repair the packet instead of widening every role prompt.

## Default Knitten Core Finding Schema

Use this schema when the caller does not provide one:

```json
{
  "findings": [
    {
      "priority": "P0|P1|P2|P3",
      "blocker": true,
      "title": "<short finding title>",
      "location": {
        "path": "<path or artifact id>",
        "line": 1
      },
      "evidence": "<target/diff/spec/document evidence>",
      "rule": "<source rule, checklist item, or contract>",
      "impact": "<technical or consumer consequence>",
      "recommendation": "<minimal corrective action>",
      "roles": ["<role that reported or confirmed it>"]
    }
  ],
  "needsDesignJudgment": [
    {
      "topic": "<disagreement or ambiguous judgment>",
      "roles": ["<role>", "<role>"],
      "summary": "<why this needs caller judgment>"
    }
  ],
  "residualRisk": ["<risk or skipped surface>"]
}
```

Priority mapping:

- `P0`: correctness, safety, data loss, security, or release-blocking breakage.
- `P1`: architecture, API/contract, migration, or boundary issue likely to
  break real consumers.
- `P2`: missing test, missing validation, documentation mismatch, weak error
  handling, or maintainability issue with realistic recurrence.
- `P3`: nit, wording, local cleanup, or optional improvement.

`P0`, `P1`, and `P2` default to `blocker=true`. `P3` defaults to
`blocker=false`. Runtime roles must emit those exact combinations; the generic
Core fix loop does not downgrade P0-P2. Optional, Nit, and FYI are P3
presentation labels only. When a caller supplies another schema, that schema
remains authoritative here, but the caller must fully normalize findings to
P0-P3 plus `blocker` before entering the generic Core loop.

## Role Selection

Select one role in `single` mode or exactly three roles in `triad` mode.

Rules:

- Name roles from the reviewed change, not from a fixed list.
- Prefer concrete consumer roles over generic roles.
- Include one role for the highest-risk technical boundary.
- In `single` mode, choose the one role that best covers the highest-risk
  boundary and primary consumer.
- In `triad` mode, include one role for the primary consumer and one role for
  verification, maintainability, migration, security, or docs depending on the
  changed surface.
- Use a generic balanced set only when no specialized consumer dominates.

Example fallback roles:

- Runtime/Contract Engineer.
- QA/Test Automation Engineer.
- Maintainer/Product Engineer.

Example specialized role names:

- Editor Selection UX Engineer.
- Stage Schema Compatibility Engineer.
- Asset Resolver Pipeline Engineer.
- Docs/Spec Consumer Engineer.
- CI/Ops Reviewer.
- Security/Permissions Reviewer.

Mandatory output before dispatch:

```markdown
## Role selection
- mode: single|triad
- <role> - <why this role matches the target and consumer>
- <role> - <why this role matches the target and consumer>
- <role> - <why this role matches the target and consumer>
```

In `single` mode, print only the selected role row.

## Agent Model Routing

Resolve the Core-owned agent profile before dispatching each role subagent:

- In `single` mode, use `review-deep-readonly`.
- In `triad` mode, use `review-deep-readonly` for the role covering the
  highest-risk technical boundary.
- In `triad` mode, use `scan-fast-readonly` for the other two roles.

When multiple triad roles have equal technical risk, assign
`review-deep-readonly` to the primary-consumer role. Resolve each selected
profile through `knitten-path agent-profile <profile-id>` and apply its returned
model, reasoning, sandbox, and fallback policy as one tuple. Record the
requested profile and effective settings in each role report `Notes`.

If profile resolution fails, do not spawn role subagents. Run the same role
lenses sequentially in the primary read-only review workflow and report that
fallback in merged residual risk.

## Base Review Packet Rule

Every role receives:

- review target,
- review brief,
- changed surface inventory,
- shared compact base documents,
- artifact paths and summaries for raw evidence,
- finding schema,
- known constraints and non-goals,
- role name, role scope, primary consumer, and explicit out-of-scope boundary.
- assigned changed-surface IDs from the pre-dispatch coverage manifest.
- scope-control lens: check whether the diff adds avoidable abstraction,
  dependency, public surface, or duplicated helper logic when existing code,
  standard-library behavior, or native platform features already cover the
  accepted requirement.

Only after that shared packet is loaded does the role apply its lens.

Each role also receives:

- role-specific base documents selected for that role,
- any `full-shared` documents with the caller's justification,
- raw artifact content only when needed to verify a grounded finding.

Do not send every readable base document to every role by default.

## Role Prompt Contract

Every role prompt must include:

```text
You are a read-only review subagent.
Do not edit files.
Do not run mutation commands.
Do not post comments, push, merge, deploy, or mutate GitHub/Linear.
Use only the supplied compact review packet, role-selected readable paths
explicitly provided by the caller, and the role lens.
Report grounded findings only.
```

## Role Subagent Prompt

```text
Read this Triad reference.
Read the caller-provided review packet.
Read the shared packet first, then read only base documents selected for this
role or justified as full-shared.
Review the target as Role: <role>.
Use the shared packet first, then apply this role lens: <role lens>.
Use the Review Brief as a navigation index, not finding evidence.
Follow the canonical navigation order within the assigned surfaces and check
every human-written changed line in scope.
Report only P0-P3 findings grounded in the target, supplied documents, or
directly provided content.
Use artifact paths for raw evidence; inspect raw content only when needed to
verify a specific finding.
Suppress weak, speculative, or unanchored findings.
Render the Role Report Template.
Review is read-only.
```

## Role Report Template

~~~markdown
## Triad role review - <role>

### Applicability
- Primary consumer: <consumer>
- Role scope: <scope>
- Files/artifacts checked: <paths or ids>
- Context checked: <review docs, specs, contracts, schemas, or none>

### Coverage
```json
{
  "role": "<role name>",
  "assignedSurfaceIds": ["<surface id>"],
  "checkedSurfaceIds": ["<surface id>"],
  "skippedSurfaces": [
    { "surfaceId": "<surface id>", "reason": "<reason>" }
  ]
}
```

### Findings
- <priority> blocker=<true|false> <path-or-artifact>:<line-or-section> - <title>
  - Evidence: <target/diff/spec/document evidence>
  - Rule: <source rule, checklist item, or contract>
  - Impact: <technical or consumer consequence>
  - Recommendation: <smallest corrective outcome>
- OR none

### Notes
- <false-positive rationale or residual risk>
- Positive evidence: <specific practice and its code-health benefit>
- Genuine ambiguity: <question for needsDesignJudgment>
~~~

Coverage IDs must exist in inventory and must have `reviewRequired=true`.
Excluded IDs are invalid in assigned, checked, or skipped role coverage.
Checked and skipped IDs must be assigned to the role; each list is
duplicate-free and checked/skipped do not overlap. A skipped required surface
remains uncovered even when its reason is recorded.
Generic praise is omitted. Factual reinforcement stays in `Notes`, while a
genuine question is merged into `needsDesignJudgment` rather than findings.

## Merge Rules

- Merge duplicate findings by behavior and evidence location.
- Preserve distinct root causes even when they affect the same file.
- Keep the highest priority across duplicate findings.
- Preserve role disagreement as a design-judgment item.
- Drop findings that cannot cite the target, diff/content, spec, or supplied
  review document.
- Keep P3/nit findings separate from blocker findings when the caller schema
  supports it.
- Include role names that reported or confirmed each merged finding.
- Merge factual `Positive evidence:` notes only as notes; never promote them to
  findings, blockers, or residual risk.
- Merge genuine ambiguity into `needsDesignJudgment` and do not send it to an
  automatic fix loop.

## Merged Coverage And Readiness Output

Return the default finding schema together with this top-level output:

```json
{
  "coverage": {
    "assigned": [],
    "checked": [],
    "skipped": [],
    "excluded": [],
    "uncovered": [],
    "complete": true
  },
  "handoff": {
    "descriptionRefreshRequired": false,
    "reason": null
  },
  "ready": true,
  "nextAction": "complete|fix|review|ask"
}
```

Reconcile coverage as follows:

- Validate unique inventory IDs and closed inventory/role coverage shapes.
- Human surfaces require review. Excluded generated/data surfaces require a
  non-empty reason, appear in `excluded` as `{surfaceId, reason}` objects, and
  are rejected if any role reports them as assigned, checked, or skipped.
- De-duplicate and lexicographically sort `assigned`, `checked`, `skipped`, and
  `uncovered`. `uncovered` is every review-required inventory ID not present in
  `checked`; required skipped surfaces therefore remain uncovered.
- Compute `coverage.complete`, `ready`, and `nextAction` with the authoritative
  formula in the canonical Review Navigation And Coverage section. Emit only
  the exact `ask`, `fix`, `review`, or `complete` literal; never a synonym.
- Set `handoff.descriptionRefreshRequired=true` with a grounded reason only when
  accepted scope or behavior changed. Core does not update an owning PR or spec.

Full review must not claim completion without this reconciliation. Preflight
does not emit or claim this full-review coverage contract.

## Weak-Finding Suppression

Suppress findings when:

- the role cannot cite target evidence or a supplied review document,
- the issue is only stylistic and no supplied rule requires it,
- the recommendation depends on product/business judgment not present in the
  packet,
- the finding would require discovering context outside the supplied packet.

When a suppressed concern may matter, put it in residual risk instead of
presenting it as a finding.
