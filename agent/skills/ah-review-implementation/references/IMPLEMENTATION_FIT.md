---
status: accepted
---

# Implementation Fit

Use this reference when reviewing whether an implementation matches the purpose
of the function, skill, module, or workflow it changed.

## Check

| Question | Finding when |
|---|---|
| Purpose fit | The implementation performs work outside the artifact's stated purpose. |
| Ownership fit | The implementation re-implements behavior owned by another skill, module, or helper. |
| Interface fit | Inputs and outputs do not match the contract the caller needs. |
| Control-flow fit | A router, wrapper, or button contains domain logic instead of delegation. |
| State fit | The implementation records or mutates state it no longer uses. |
| Reference fit | Always-read references are loaded even though only one conditional branch needs them. |
| Naming fit | Names imply a broader or narrower role than the implemented behavior. |

## Review Rule

For every changed function, skill, module, or workflow:

1. Quote its stated purpose or contract.
2. List the work it actually performs.
3. Mark each performed action as `owned`, `delegated`, or `leaked`.
4. Report `leaked` actions as findings.

## Scope Creep Checklist

Use these checks when an implementation starts to absorb adjacent workflow
responsibilities:

| Signal | Review question |
|---|---|
| Next-step command | Is the artifact telling the caller what workflow to run next instead of returning its own result? |
| PR / commit / push flow | Does the artifact mention repository mutation that belongs to a release, PR, or caller workflow? |
| Readiness policy | Does the artifact own blocker/nit/readiness decisions that should belong to a review router? |
| Review cadence | Does the artifact decide when another review loop should run? |
| Parent skill dependency | Does a leaf artifact load or invoke a parent workflow just to discover context? |
| Duplicated guidance | Are guideline names, policy text, or file-selection rules duplicated outside the owning helper or reference? |
| Broad validation | Does validation exceed what the changed input or loaded guidance requires? |

Default fix: keep the owned input, owned action, owned output, and minimal local
validation. Delete or move the rest to the caller workflow, owning helper, or
owning reference.

## Output

```markdown
Purpose-fit check:
- artifact: <path or symbol>
- stated purpose: <quote or summary>
- leaked action: <action or none>
- owner that should receive it: <path/symbol/skill or N/A>
```
