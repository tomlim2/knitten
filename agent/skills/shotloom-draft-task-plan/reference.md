# shotloom-draft-task-plan reference

Expanded detail for the shotloom-draft-task-plan skill. `SKILL.md` holds the
binding flow; this file holds templates, review lenses, sibling handling, and
external-review protocol.

## Step 2 - Audit Search Examples

```bash
git status --short
rg -n "<primary type/function/command names>" crates apps docs contracts MAP.md
rg -n "<bridge command/event/kind names>" crates/shotloom-core apps/editor/src/bridge crates/shotloom-engine
rg -n "<editor entry point names>" apps/editor/src
rg -n "<fixture or asset names>" assets crates apps docs
```

Read matching definitions for wire shape, handler branch, editor entry point,
fixtures, tests, and docs. Classify each surface as `Already Done`, `Partial`,
`Missing`, or `Conflict`.

## Step 4 - Plan Frontmatter

```yaml
---
status: open
created: YYYY-MM-DD
updated: YYYY-MM-DD
load: triggered
trigger: <when to re-read this plan>
repo: shotloom
linear: STL-NN
---
```

## Step 4 - Plan Body Template

| Section | Required content |
|---|---|
| `# <Title>` | Action title derived from live remaining work. |
| `## Cold-Start Summary` | One paragraph: current truth, remaining gap, non-goal boundary. |
| `## Current State` | Evidence table with paths, symbols, and classification. |
| `## Problem` | Concrete remaining gap after audit. |
| `## Locked Decisions` | Numbered decisions with `Rationale:` and `Rejected alternatives:`. |
| `## Non-Goals` | Explicit adjacent exclusions. |
| `## Implementation Plan` | Stages from smallest proof to broader updates. First stage is S0 baseline re-check. |
| `## Acceptance Criteria` | Checklist tied to remaining work. |
| `## Verification` | Focused gates, broad gates, manual repro per diagnostic or rejection code. |
| `## Traps` | Defensive warnings against false implementation paths. |
| `## Follow-Up Candidates` | Real out-of-scope work. |

## Step 4 - Body Rules

- Do not restate Linear verbatim.
- Do not list already-complete behavior as future work.
- Do not promise unsupported formats or workflows.
- Use concrete file paths in `## Current State`.
- If the plan says `add`, verify the target does not exist.
- If the plan says `reuse existing`, name the implementation.
- Every in-scope line traces to an AC line, ADR, or repo precedent.
- Every user-facing string defaults to split diagnostics or labels. Collapse
  only when `Rationale:` cites source evidence.

## Step 5 - Severity Model

| Priority | Meaning | Required action |
|---|---|---|
| `P1` | Implementation follows the wrong API, layer, invariant, or scope. | Patch before landing. |
| `P2` | Required test, doc, edge case, invariant, or diagnostic is absent. | Patch or scope out with rationale. |
| `P3` | Naming, layout, markdown, or cheap cleanup. | Patch when cheap; else move to `Traps` or `Follow-Up Candidates`. |

## Step 5 - Review Lenses

Run each lens before declaring convergence:

| Lens | Check |
|---|---|
| Current-code contradiction | Plan does not add existing code, cite absent APIs, or miss failure paths. |
| API boundary | Signatures, ownership, validation, return types, and public surface are exact. |
| Error ownership | Rejection codes, diagnostics, messages, and event order have one owning layer. |
| Wire contract | Existing command and event shapes stay intact unless protocol change is in scope. |
| Invariants | Staged-byte draining, cache failures, success events, identity, paths, and URI shapes do not regress. |
| Test evidence | Unit, integration, snapshot, fixture, manual, and negative cases map to changed behavior. |
| Format and docs | Tables render, paths resolve, and doc targets match repo structure. |
| Scope creep | Related features are in `Non-Goals` or `Follow-Up Candidates`. |

## Step 5a - Stance Rotation

Run four passes. Patch findings from a pass before running the next pass.

| Pass | Stance | Lead question |
|---|---|---|
| 1 | Author | Did the draft contain every intended constraint? |
| 2 | Paranoid reviewer | What invariant, error path, edge case, or review objection is absent? |
| 3 | Minimalist reviewer | What speculative API or related feature belongs outside scope? |
| 4 | Domain reviewer | Does each plan line trace to an AC, ADR, or repo precedent? |

Pass 1 with zero findings never equals convergence. Pass 4 must finish with no
unhandled `P1` or `P2`, and the floor checks must pass.

## Step 5b - Sibling Draft Consumption

The Ready briefing includes a sibling inventory. If the inventory is absent,
run this scan from any cwd:

```bash
caol_ila="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo caol-ila)"
caol_ila="${caol_ila#RESOLVED_PATH=}"
ls "$caol_ila/docs/plans/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
ls "$caol_ila/docs/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
git -C "$caol_ila" log --diff-filter=D --name-only --pretty=format: -- \
  "docs/plans/" | rg -i "<scope>|<subject>"
```

For each sibling:

1. Read the full body with Read if it exists on disk.
2. For HEAD-only or recently deleted siblings, use `git show HEAD:<path>`.
3. Diff sibling `Locked Decisions` against the draft. Record every
   disagreement as `Sibling <path> chose A; this plan chooses B because
   <live-code evidence path>.`
4. Mine sibling `Traps`, `Non-Goals`, `Verification`, and `Acceptance Criteria`.
   Adopt evidenced items. Reject only with an explicit rationale in
   `Locked Decisions`.
5. If a sibling has a stricter signature, finer diagnostic split, or defensive
   invariant, adopt it unless live-code evidence rejects it.

## Step 5c - Structural Floor Checks

Every final direct plan must pass:

| Floor | Pass condition |
|---|---|
| Traps | At least 2 defensive items against paths the plan does not propose. |
| Non-Goals | At least 5 adjacent-concern exclusions. |
| Manual repro | One line per user-facing diagnostic, error, or rejection code. |
| Baseline | Implementation Plan starts with S0 baseline re-check or AC for one. |
| Locked Decisions | Every decision has `Rationale:` and `Rejected alternatives:` labels. |
| String split | Every user-facing string defaults to separate code or label; collapsed strings cite rationale. |
| Traceability | Every in-scope line traces to an AC, ADR, or repo precedent. |

If any floor fails, patch the plan and re-run the relevant review lens.

## External Review Protocol

Use this only when the user asks for Claude, another model, or an external
agent to improve the plan. The external agent reviews the current canonical
draft. It does not create the plan of record.

Reviewer prompt inputs:

- Current plan text.
- Ready briefing.
- Relevant Linear AC.
- Live-code evidence from Step 2.
- Instruction to preserve existing `Locked Decisions` unless live-code evidence
  proves them wrong.
- Instruction to return findings only, with priorities, line references,
  evidence, and minimal patch suggestions.
- Prohibition on full rewrite, rename, deletion, standalone replacement plan,
  broader diagnostics, weaker API signatures, or evidence-free decision changes.

Reviewer output contract:

```text
## Findings
| Prio | Plan line | Issue | Evidence | Minimal patch |

## Keep
<decisions that are sound and must not be changed>

## Do Not Rewrite
<sections or decisions to preserve>

## Patch Suggestions
<small section-level edits only>
```

Triage rules:

- Treat external output as evidence, not authority.
- Verify every finding against live source before editing the plan.
- Apply minimal patches that strengthen the canonical plan.
- If the reviewer returns a full replacement plan, mine only evidenced
  findings and patch the existing plan.
- If the reviewer writes a parallel `.md` file, keep it uncommitted and compare
  it as review input. Replace `$plan_path` only after explicit user selection.

## Step 6 - Conflict Artifact Content

For `.draft.md` factual stops, write:

```markdown
---
status: draft-conflict
created: YYYY-MM-DD
updated: YYYY-MM-DD
load: triggered
trigger: <issue or branch>
repo: shotloom
linear: STL-NN
---

# <Title>

## Conflict Summary
| Stop condition | Briefing claim | Live evidence | Required decision |

## Audited Evidence
| Surface | Path | Finding |

## Proposed Narrow Scope
<what a valid plan can cover after the split or decision>

## Blocked Scope
<what needs user or Linear clarification>
```

For `.partial.md`, write the same frontmatter with `status: partial` and include
the latest draft plus `## Unresolved Review Findings`.

For `.claude.md`, write the full candidate body and include
`## Parallel Draft Note` with the existing plan path and preservation reason.
