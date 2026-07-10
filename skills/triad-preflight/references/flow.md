# Triad Preflight Flow

This reference defines the lightweight role-split review that runs before a full
triad review. It is intentionally shallow: find cheap, grounded issues that are
worth fixing before invoking `review` or `review-fix-loop`.

## Boundary

- Read-only only.
- Do not edit files or run mutation commands.
- Do not run tests, validators, scripts, or shell commands. This skill may report
  missing evidence and recommended validation for a caller to run later.
- Do not post comments, push, merge, deploy, delete, or mutate GitHub/Linear.
- Do not decide final PR readiness.
- Do not mark findings as final blockers. Use `candidateBlockers` for likely
  P1/P2 issues that need caller confirmation or a full review.

## Input Packet

Use a supplied packet when present. If not, build the smallest packet from
explicitly readable paths in the request.

Include:

- target repo or artifact path,
- task or PR purpose,
- base ref or comparison source when available,
- changed surface inventory,
- relevant specs, docs, PR body, review comments, or test evidence supplied by
  the caller,
- known non-goals and approval limits.

If the changed surface is missing and cannot be inferred from a supplied diff or
path list, stop and ask for it.

## Roles

Use exactly three shallow roles:

- `scope`: checks task fit, changed-surface drift, PR size, unnecessary new
  public surface, dependency creep, and whether one PR is still plausible.
- `evidence`: checks tests, validation evidence, docs/CLI/help/briefing sync,
  and whether user-visible behavior has proof.
- `surface`: checks file paths, naming, stale or legacy wording, terminology
  consistency, generated artifacts, and user-facing output shape.

Keep role prompts narrow. Prefer short role reports over broad reasoning.

When role subagents and per-agent model selection are available, dispatch the
three roles independently with:

- model: `gpt-5.6-terra`,
- `model_reasoning_effort`: `medium`,
- sandbox/profile: read-only.

If a read-only sandbox/profile cannot be enforced, do not spawn agents. Run
the three lenses sequentially in the primary read-only workflow and record the
unavailable profile in `residualRisk`.

If `gpt-5.6-terra` is unavailable, use the fastest available review-capable
model at `medium` or the closest supported reasoning effort. Record the
requested and effective model/profile in `residualRisk`. If per-agent model
selection is unavailable, keep the three agents separate with the available
model and record that fallback. If subagents are unavailable, run the same
three lenses sequentially in the current session, keep the same JSON
contracts, and record that fallback in `residualRisk`.

## Role Prompt Contract

Each role receives the same compact packet and must follow:

```text
You are a read-only preflight reviewer.
Do not edit files.
Do not run mutation commands.
Do not run tests, validators, scripts, or shell commands.
Do not post comments, push, merge, deploy, delete, or mutate GitHub/Linear.
Use only the supplied packet and readable paths explicitly provided by the caller.
Report grounded candidate issues only.
Suppress speculative findings.
Return JSON only.
```

## Role JSON

Each role returns:

```json
{
  "role": "scope|evidence|surface",
  "checked": ["<path or artifact id>"],
  "candidateBlockers": [
    {
      "priority": "P1|P2",
      "title": "<short candidate issue>",
      "location": "<path:line, section, or artifact id>",
      "evidence": "<grounded packet evidence>",
      "recommendation": "<smallest pre-triad fix>"
    }
  ],
  "warnings": [
    {
      "priority": "P3",
      "title": "<warning>",
      "location": "<path:line, section, or artifact id>",
      "evidence": "<grounded packet evidence>",
      "recommendation": "<smallest cleanup>"
    }
  ],
  "missingEvidence": ["<test, doc, command, or artifact that appears missing>"],
  "residualRisk": ["<skipped surface or uncertainty>"]
}
```

Rules:

- Use `candidateBlockers` only for issues likely to waste full triad time if
  left unfixed.
- Use `warnings` for cleanup, wording, or optional improvements.
- Place uncertain but plausible concerns in `residualRisk`, not findings.
- Include file, line, section, command, or artifact evidence where possible.
- Return empty arrays when nothing is found.

## Merge Output

Merge duplicate role results by behavior and evidence. Return one JSON object:

```json
{
  "ok": true,
  "summary": "<one sentence>",
  "candidateBlockers": [
    {
      "priority": "P1|P2",
      "title": "<merged candidate issue>",
      "location": "<path:line, section, or artifact id>",
      "evidence": "<grounded packet evidence>",
      "recommendation": "<smallest pre-triad fix>",
      "sourceRoles": ["scope", "evidence", "surface"]
    }
  ],
  "warnings": [
    {
      "priority": "P3",
      "title": "<merged warning>",
      "location": "<path:line, section, or artifact id>",
      "evidence": "<grounded packet evidence>",
      "recommendation": "<smallest cleanup>",
      "sourceRoles": ["scope", "evidence", "surface"]
    }
  ],
  "missingEvidence": [
    {
      "item": "<test, doc, command, or artifact that appears missing>",
      "reason": "<why the packet suggests it is needed>",
      "sourceRoles": ["scope", "evidence", "surface"]
    }
  ],
  "residualRisk": [
    {
      "risk": "<skipped surface or uncertainty>",
      "sourceRoles": ["scope", "evidence", "surface"]
    }
  ],
  "recommendedQuickFixes": [
    {
      "title": "<fix before full triad>",
      "reason": "<why this saves full-review time>",
      "sourceRoles": ["scope", "evidence", "surface"]
    }
  ],
  "nextStep": "quick-fix|full-review|review-fix-loop|ask"
}
```

Set `ok` to `true` when the preflight ran and produced grounded output. Set it
to `false` only when the packet is too vague to review or required readable
paths cannot be accessed; in that case use `nextStep: "ask"`.

Set `nextStep` as:

- `quick-fix` when grounded candidate blockers or cheap missing evidence exist.
- `full-review` when no preflight issue needs action first and a normal
  read-only `review` pass should run next.
- `review-fix-loop` when the caller explicitly requested a repeated
  review/fix loop or the packet already contains loop checkpoint context.
- `ask` when the packet is too vague or required evidence is unavailable.

## Quick Fix Handoff

After printing the merged JSON, briefly tell the caller:

- what should be fixed before full triad,
- what can wait,
- what evidence was missing,
- whether to run `review` or `review-fix-loop` next.

Do not perform the fixes inside this skill. The caller or a surrounding workflow
may use `implement` behavior for accepted fixes, then invoke full `review`.
