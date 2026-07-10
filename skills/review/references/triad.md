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
reviews the supplied packet and reports findings.

## Review Packet

The caller should provide:

```markdown
## Review target
<already materialized diff/content, or readable path to prepared artifact>

## Review brief
<purpose, changed behavior, touched surfaces, non-goals>

## Changed surfaces
- <path or artifact> - <surface> - <primary consumer> - <risk>

## Base review documents
- <name/path or inline label> - <why useful; include justification when full-shared> - <budget: shared|role-specific|artifact-only|full-shared> - <path readable? yes/no>

## Finding schema
<optional caller schema; omitted means default Knitten Core finding schema>

## Review mode
single | triad

## Known constraints
- <approval, scope, product, migration, or testing constraint>
```

The packet should be concise and source-cited. If it is too vague to choose
roles, assign context budgets, or ground findings, stop and ask the caller to
repair it.

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
`blocker=false`.

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

Assign the model before dispatching each read-only role subagent:

- In `single` mode, use `gpt-5.6` with `model_reasoning_effort = "high"`.
- In `triad` mode, use `gpt-5.6` with
  `model_reasoning_effort = "high"` for the role covering the highest-risk
  technical boundary.
- In `triad` mode, use `gpt-5.6-terra` with
  `model_reasoning_effort = "medium"` for the other two roles.
- Use a read-only sandbox/profile for every role.

If the dispatcher cannot enforce a read-only sandbox/profile, do not spawn
role subagents. Run the same role lenses sequentially in the primary read-only
review workflow and record the unavailable sandbox/profile in merged residual
risk. A prompt-only prohibition is not an effective read-only profile.

When multiple triad roles have equal technical risk, assign `gpt-5.6` to the
primary-consumer role. If an exact model is unavailable, preserve the routing
intent: use the strongest available review-capable model at `high` effort for
the deep role and the fastest available review-capable model at `medium` effort
for scan roles. Record the requested and effective model/profile in the role
report `Notes`.

If per-agent model selection is unavailable but a read-only profile is
enforceable, keep the selected roles separate, use the available agent model,
and report the requested and effective model/profile in each role's `Notes`.
If role subagents or an enforceable read-only profile are unavailable, run the
same role lenses sequentially in the current session and report that fallback
in the merged residual risk.

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
Report only P0-P3 findings grounded in the target, supplied documents, or
directly provided content.
Use artifact paths for raw evidence; inspect raw content only when needed to
verify a specific finding.
Suppress weak, speculative, or unanchored findings.
Render the Role Report Template.
Review is read-only.
```

## Role Report Template

```markdown
## Triad role review - <role>

### Applicability
- Primary consumer: <consumer>
- Role scope: <scope>
- Files/artifacts checked: <paths or ids>
- Context checked: <review docs, specs, contracts, schemas, or none>

### Findings
- <priority> <path-or-artifact>:<line-or-section> - <defect> - <source rule/check>
- OR none

### Notes
- <false-positive rationale, skipped surface, residual risk, or design judgment>
```

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

## Weak-Finding Suppression

Suppress findings when:

- the role cannot cite target evidence or a supplied review document,
- the issue is only stylistic and no supplied rule requires it,
- the recommendation depends on product/business judgment not present in the
  packet,
- the finding would require discovering context outside the supplied packet.

When a suppressed concern may matter, put it in residual risk instead of
presenting it as a finding.
