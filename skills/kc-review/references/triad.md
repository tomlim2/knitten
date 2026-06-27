---
status: accepted
---

# KC Triad Review Reference

Use this reference from `kc-review`. It defines the reusable KC role review
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
- <name/path or inline label> - <why mandatory> - <path readable? yes/no>

## Finding schema
<optional caller schema; omitted means default KC finding schema>

## Review mode
single | triad

## Known constraints
- <approval, scope, product, migration, or testing constraint>
```

The packet should be concise and source-cited. If it is too vague to choose
roles or ground findings, stop and ask the caller to repair it.

## Default KC Finding Schema

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
## KC role selection
- mode: single|triad
- <role> - <why this role matches the target and consumer>
- <role> - <why this role matches the target and consumer>
- <role> - <why this role matches the target and consumer>
```

In `single` mode, print only the selected role row.

## Base Review Packet Rule

Every role receives:

- review target,
- review brief,
- changed surface inventory,
- every base review document supplied by the caller,
- finding schema,
- known constraints and non-goals,
- role name, role scope, primary consumer, and explicit out-of-scope boundary.
- scope-control lens: check whether the diff adds avoidable abstraction,
  dependency, public surface, or duplicated helper logic when existing code,
  standard-library behavior, or native platform features already cover the
  accepted requirement.

Only after that shared packet is loaded does the role apply its lens.

## Role Prompt Contract

Every role prompt must include:

```text
You are a read-only review subagent.
Do not edit files.
Do not run mutation commands.
Do not post comments, push, merge, deploy, or mutate GitHub/Linear.
Use only the supplied review packet, readable paths explicitly provided by the
caller, and the role lens.
Report grounded findings only.
```

## Role Subagent Prompt

```text
Read this Triad reference.
Read the caller-provided review packet.
Read every readable base review document explicitly supplied by the caller.
Review the target as Role: <role>.
Use the shared packet first, then apply this role lens: <role lens>.
Use the Review Brief as a navigation index, not finding evidence.
Report only P0-P3 findings grounded in the target, supplied documents, or
directly provided content.
Suppress weak, speculative, or unanchored findings.
Render the Role Report Template.
Review is read-only.
```

## Role Report Template

```markdown
## KC triad role review - <role>

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
