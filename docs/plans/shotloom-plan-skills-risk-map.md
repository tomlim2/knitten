---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: strengthening Shotloom plan creation and plan review skills
repo: caol-ila
---

# Strengthen Shotloom Plan Skills With Risk Maps

## Cold-Start Summary

`shotloom-draft-task-plan` and `shotloom-review-task-plan` already perform
cold-start code and plan review, but the PR #341 review miss showed a gap:
reading more context does not guarantee that the plan names the defect classes
that matter. The remaining work is to make both skills produce and review
evidence-backed Risk Maps, so plans become proof-oriented artifacts instead of
linear implementation outlines. The same pass should make Linear briefing an
explicit plan input/output and add lightweight plan-index management so
`docs/plans/` stays navigable as the plan set grows.

## Current State

| Surface | Path | Classification | Finding |
|---|---|---|---|
| Draft skill | `agent/skills/shotloom-draft-task-plan/SKILL.md` | Partial | Requires live audit, locked decisions, review loop, atomicity notes, test-shape notes, and source-chain notes. It does not yet require a normalized Risk Map table. |
| Review skill | `agent/skills/shotloom-review-task-plan/SKILL.md` | Partial | Reviews plans through rotating stances and floor checks. It does not yet force risk-by-risk proof rows before convergence. |
| Draft reference | `agent/skills/shotloom-draft-task-plan/reference.md` | Partial | Holds templates, lenses, stance rotation, and floor checks. It has source-chain coverage, but no canonical Risk Map template. |
| Linear briefing flow | `agent/skills/shotloom-draft-task-plan/SKILL.md` | Partial | Linear context is read during planning, but the required briefing shape is implicit and not preserved as a stable section. |
| Plan directory | `docs/plans/` | Partial | Holds many open and historical plans, but has no `README.md`, registry table, status convention, or archive policy. |
| Trigger incident | `CINEV/shotloom#341` | Evidence | A `SchemaMismatch` source-chain defect was first treated as a maintainability nit, then reclassified as blocking after a focused error-chain pass. |
| Shared policy | `SYSTEM.md` | Already Done | Requires LLM-first artifacts: explicit, unambiguous, table-driven, and optimized for cold-start execution. |

## Problem

The current plan skills can still produce a plausible plan that lacks an
explicit defect-class map. A cold-start reviewer may inspect the code broadly
and still miss a narrow class such as `thiserror` source-chain preservation,
schema compatibility, partial mutation, or test oracle strength. The skills
need a compact required structure that forces the planner and reviewer to name
risks, evidence, plan response, and test proof before implementation starts.
They also need a stable Linear briefing block so issue AC, comments, related
issues, and current PR/review state are captured once and can be audited later.
Finally, `docs/plans/` needs a small management surface so active, blocked,
superseded, and completed plans do not become an undifferentiated pile.

## Locked Decisions

1. **Add `## Risk Map` as a required plan section for Shotloom direct plans.**

   Rationale: A table is easier for an LLM to audit than prose and makes
   missing defect classes visually obvious.

   Rejected alternatives: relying on `## Traps` alone is weaker because traps
   are negative warnings, not proof obligations; adding more review prose makes
   the skill longer without forcing a machine-checkable shape.

2. **Make Risk Map rows defect-class based, not file based.**

   Rationale: The miss in PR #341 was not that the file was unread; it was that
   the error-source-chain risk class was not elevated early enough.

   Rejected alternatives: per-file review tables duplicate Current State and
   still allow a reviewer to miss cross-cutting risks.

3. **Require `Test proof` or `N/A rationale` for every applicable risk.**

   Rationale: Plans should say what proves the change, not only what to edit.
   This prevents tests that assert presence while missing the real behavior.

   Rejected alternatives: leaving proof selection to implementation time keeps
   the highest-risk decisions outside the reviewed plan.

4. **Keep cold-start review, but demote it to orientation plus contradiction
   detection.**

   Rationale: Cold-start reading is still useful for avoiding stale context.
   It should feed the Risk Map rather than act as the primary quality method.

   Rejected alternatives: replacing cold-start review entirely would lose the
   freshness check against live code and sibling plans.

5. **Add a `## Linear Briefing` section to Shotloom plans that reference
   Linear work.**

   Rationale: Linear is the user-facing task source, but current plans merge
   issue facts into prose. A structured briefing keeps AC, latest comments,
   blockers, related issues, and PR/review state visible to every later LLM.

   Rejected alternatives: leaving Linear data only in chat history or Ready
   briefings makes plans less self-contained and harder to review cold.

6. **Add a lightweight `docs/plans/README.md` registry as a separate managed
   artifact.**

   Rationale: A single table with status, repo, Linear id, branch/PR, and next
   action lets agents choose the right plan without scanning dozens of files.

   Rejected alternatives: renaming every existing plan or moving files into
   folders is too much churn for this change and risks breaking links.

## Required Linear Briefing Template

Plans linked to Linear must include:

```md
## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-NN` |
| State | `<Todo/In Progress/In Review/Done>` |
| Owner | `<name or me>` |
| Goal | `<one sentence from current issue truth, not copied wholesale>` |
| Acceptance criteria | `<short AC bullets or N/A>` |
| Latest relevant comment | `<date + summary or N/A>` |
| Blockers / dependencies | `<issue ids or N/A>` |
| Related PRs | `<PR links or N/A>` |
| Current review state | `<none/approved/changes requested/checks failing>` |
| Planning consequence | `<what this changes in scope, risk, or verification>` |
```

Rules:

- Fetch Linear context before drafting when an issue id is known.
- Summarize, do not paste the full Linear body.
- If Linear conflicts with live code, put the conflict in `## Problem` or
  `## Locked Decisions`; live code still governs implementation truth.
- Update the briefing when plan review discovers newer Linear or PR context.

## Plan Directory Management

Add `docs/plans/README.md` with:

| Column | Meaning |
|---|---|
| Plan | Link to the plan file. |
| Status | `open`, `blocked`, `implemented`, `superseded`, or `archived`. |
| Repo | Target repository. |
| Linear | Issue id or `N/A`. |
| Branch / PR | Active branch or PR link when known. |
| Next action | One short action for the next agent. |

Management rules:

- New direct plans add one README row in the same change that creates the plan.
- Plan review updates the row when status, PR, or next action changes.
- Superseded plans point to the replacement plan.
- Do not archive by moving files until a separate archive policy exists.

## Required Risk Map Template

Plans must include:

```md
## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | yes/no | `<path>:<symbol>` | Preserve `#[source]` or state no wrapped source exists. | Assert `Error::source()` or `N/A: internal validator only`. |
| Schema / serialization compatibility | yes/no | `<contract or serde type>` | Preserve wire shape or name protocol scope. | Round-trip / rejection / fixture test. |
| Ownership / API boundary | yes/no | `<crate/module boundary>` | Keep responsibility in owner layer. | Compile/API test or no public API change. |
| Partial mutation / rollback | yes/no | `<state/cache/persistence path>` | Pre-validate, rollback, or prove no persistence. | Failure-path test proving final state. |
| Diagnostic ownership | yes/no | `<diagnostic code/source>` | Single owner for code, severity, recoverability. | Negative test or manual repro. |
| Test oracle strength | yes | `<planned test>` | Say why it fails before implementation. | Failing-before/passing-after assertion target. |
| Scope creep | yes | `<adjacent feature>` | Put in Non-Goals or Follow-Up Candidates. | N/A: plan-boundary proof. |
| Reviewer objection | yes | `<likely blocking comment>` | Pre-answer with code/test/doc plan. | Covered by mapped proof row. |
```

## Implementation Plan

1. **S0: Baseline skill audit.**

   Re-read the two `SKILL.md` files and draft reference. Confirm current
   source-chain additions remain and identify exact insertion points for Risk
   Map requirements.

2. **S1: Draft skill changes.**

   Update `shotloom-draft-task-plan` so Step 4 requires `## Risk Map` for every
   direct Shotloom plan. Add a short rule that implementation stages must cite
   Risk Map rows when they address high-risk code paths.

3. **S2: Review skill changes.**

   Update `shotloom-review-task-plan` floor checks so a plan cannot converge
   with missing Risk Map rows, missing `Test proof`, or unexplained `N/A`.

4. **S3: Reference template changes.**

   Add the canonical Risk Map template to
   `shotloom-draft-task-plan/reference.md`. Keep it compact enough to paste into
   new plans without bloating token use.

5. **S4: Methodology wording.**

   State the preferred review model:
   `cold-start orientation -> diff-risk map -> lens review -> executable proof`.
   Do not present cold-start review as the only quality mechanism.

6. **S5: Linear briefing changes.**

   Update both skills so known Linear issues produce a required
   `## Linear Briefing` section. Make review treat stale or missing Linear
   briefing evidence as `P2` when the plan references a Linear issue.

7. **S6: Plan registry changes.**

   Add `docs/plans/README.md` with the registry table and management rules.
   Update the two skills so creating or reviewing a direct plan maintains the
   registry row without touching unrelated rows.

8. **S7: Validation.**

   Run `node scripts/validate-llm-first.mjs`. If routing metadata or references
   change, verify `~/.claude/skills/...` still matches `agent/skills/...`.

## Acceptance Criteria

- `shotloom-draft-task-plan` requires `## Risk Map` before direct-plan commit.
- `shotloom-review-task-plan` treats missing Risk Map proof as `P2`.
- `reference.md` contains one canonical Risk Map template.
- The template includes error source chain, schema compatibility, ownership,
  partial mutation, diagnostic ownership, test oracle, scope creep, and reviewer
  objection rows.
- Plans with Linear ids include `## Linear Briefing` with issue state, AC,
  latest relevant comment, blockers, related PRs, current review state, and
  planning consequence.
- `docs/plans/README.md` exists and defines a plan registry table plus minimal
  status/update rules.
- Plan creation and plan review skills update the registry row for direct plans
  without rewriting unrelated rows.
- The skills describe cold-start review as orientation plus contradiction
  detection, not as the sole review method.
- `node scripts/validate-llm-first.mjs` passes.

## Verification

- `node scripts/validate-llm-first.mjs`
- Manual check: create or inspect one future Shotloom plan and confirm every
  high-risk implementation stage maps back to a Risk Map row.
- Manual check: inspect one Linear-backed plan and confirm the Linear briefing
  explains how issue context changes scope, risk, or verification.
- Manual check: inspect `docs/plans/README.md` and confirm the new plan has one
  row with a concrete next action.

## Traps

- Do not turn Risk Map into a long essay. It must stay table-shaped and compact.
- Do not require every row to be `yes`; `no` is allowed only with evidence or a
  clear `N/A` rationale.
- Do not remove cold-start review. It still catches stale code, sibling-plan
  disagreement, and scope drift.
- Do not paste full Linear issue bodies into plans. The briefing is a compact
  decision surface, not a transcript.
- Do not make plan registry maintenance a broad gardening task; update only the
  row for the plan being created or reviewed.

## Follow-Up Candidates

- Add a validator for plan section presence if plan formats stabilize.
- Create a small library of task-type-specific risk rows for Rust parser,
  bridge protocol, editor UI, cache, and deployment plans.
- Add an archive policy after the README registry has enough status history to
  show which files should move.
