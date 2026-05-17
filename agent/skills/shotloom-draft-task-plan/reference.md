# shotloom-draft-spec reference

Expanded detail for the `shotloom-draft-spec` workflow. The legacy
`shotloom-draft-task-plan` command name is retained only for compatibility.
This reference uses **task spec** for the artifact being written. `SKILL.md`
holds the binding flow; this file holds the spec schema, validation lenses,
sibling-spec handling, and external-review protocol.

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

## Step 4 - Spec Frontmatter

```yaml
---
status: open
created: YYYY-MM-DD
updated: YYYY-MM-DD
load: triggered
trigger: <when to re-read this spec>
repo: shotloom
linear: STL-NN
briefing: ../briefings/shotloom/<slug>.md
---
```

## Step 4 - Spec Body Template

| Section | Required content |
|---|---|
| `# <Title>` | Action title derived from live remaining work. |
| `## Spec Contract` | Five bullets: briefing basis, current truth, required change, locked boundary, proof method. |
| `## Current State` | Evidence table with paths, symbols, classification, and what each surface proves. |
| `## Linear Briefing` | Required when frontmatter has `linear:` or the briefing cites a Linear issue. |
| `## Problem` | Concrete remaining gap after audit, tied to Linear/user intent. |
| `## Requirements` | Numbered implementation requirements. Each requirement maps to AC, ADR, repo precedent, or user clarification. |
| `## Risk Map` | Defect-class table with evidence, plan response, and test proof for each applicable risk. |
| `## Locked Decisions` | Numbered decisions with `Rationale:` and `Rejected alternatives:`. |
| `## Non-Goals` | Explicit adjacent exclusions. |
| `## Implementation Spec` | Ordered implementation stages from smallest proof to broader updates. First stage is S0 baseline re-check. |
| `## Acceptance Criteria` | Checklist tied to remaining work. |
| `## Verification` | Focused gates, broad gates, manual repro per diagnostic or rejection code. |
| `## Traps` | Defensive warnings against false implementation paths, including partial mutation traps for coupled artifacts. |
| `## Follow-Up Candidates` | Real out-of-scope work. |

## Step 4 - Body Rules

- Do not restate Linear verbatim.
- Cite the briefing path in frontmatter and summarize only the briefing facts
  that survive live-code audit.
- Do not write a chronological implementation checklist. Write a contract that
  an implementer can execute and a reviewer can verify.
- Do not list already-complete behavior as future work.
- Do not promise unsupported formats or workflows.
- Use concrete file paths in `## Current State`.
- If the spec says `add`, verify the target does not exist.
- If the spec says `reuse existing`, name the implementation.
- Every requirement traces to an AC line, ADR, repo precedent, or user
  clarification.
- Every implementation stage maps to at least one requirement and one
  verification item.
- Linear-backed specs include `## Linear Briefing` before `## Problem`.
- Every direct spec includes `## Risk Map` before `## Locked Decisions`.
- Every applicable Risk Map row has concrete `Evidence`, `Plan response`, and
  `Test proof`. Use `N/A: <reason>` only when the evidence proves the risk does
  not apply.
- High-risk implementation stages cite the Risk Map row they satisfy.
- Every user-facing string defaults to split diagnostics or labels. Collapse
  only when `Rationale:` cites source evidence.
- If one operation mutates more than one representation of the same artifact
  (for example JSON + BIN, model + cache, state + event, bundle + index),
  include a `Locked Decision` for atomicity: either pre-validate every later
  mutation before the first write, rollback the first write on later failure,
  or prove partial persistence is impossible.
- Verification for coupled artifact mutation must assert the final persisted
  artifact or emitted event sequence. Do not accept tests that check only one
  side of the mutation, internal stats, or an unchanged buffer while another
  representation can already be dirty.
- Rust parser, loader, validator, and error-type specs must include
  source-chain proof. Name each external error type, show where it is preserved
  with `#[source]` / typed fields, and add verification that
  `std::error::Error::source()` is present or intentionally absent. Do not
  accept `external_error.to_string()` stored in a `String` field unless the spec
  explains why no source chain can exist.

## Step 4 - Linear Briefing Template

Use when a Linear issue id is known:

```md
## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-NN` |
| State | `<current state>` |
| Owner | `<name or me>` |
| Goal | `<one sentence from current issue truth>` |
| Acceptance criteria | `<short AC bullets or N/A>` |
| Latest relevant comment | `<date + summary or N/A>` |
| Blockers / dependencies | `<issue ids or N/A>` |
| Related PRs | `<PR ids or N/A>` |
| Current review state | `<none/approved/changes requested/checks failing>` |
| Planning consequence | `<scope, risk, or verification impact>` |
```

Rules:

- Summarize Linear. Do not paste the full issue body.
- If Linear conflicts with live code, state the conflict in `## Problem` or
  `## Locked Decisions`.
- Update this section when review discovers newer Linear or PR context.

## Step 4 - Risk Map Template

Every direct Shotloom spec includes:

```md
## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | yes/no | `<path>:<symbol>` | Preserve `#[source]` or state no wrapped source exists. | Assert `Error::source()` or `N/A: internal validator only`. |
| Schema / serialization compatibility | yes/no | `<contract or serde type>` | Preserve wire shape or name protocol scope. | Round-trip, rejection, or fixture test. |
| Ownership / API boundary | yes/no | `<crate/module boundary>` | Keep responsibility in owner layer. | Compile/API test or `N/A: no public API change`. |
| Partial mutation / rollback | yes/no | `<state/cache/persistence path>` | Pre-validate, rollback, or prove no persistence. | Failure-path test proving final state. |
| Diagnostic ownership | yes/no | `<diagnostic code/source>` | Single owner for code, severity, and recoverability. | Negative test or manual repro. |
| Test oracle strength | yes | `<planned test>` | Say why it fails before implementation. | Failing-before/passing-after assertion target. |
| Scope creep | yes | `<adjacent feature>` | Put in Non-Goals or Follow-Up Candidates. | `N/A: plan-boundary proof`. |
| Reviewer objection | yes | `<likely blocking comment>` | Pre-answer with code/test/doc plan. | Covered by mapped proof row. |
```

If a row is `no`, the Evidence cell must prove why it does not apply.

## Step 5 - Cold-Start Spec Validation Loop

The spec is not converged just because it is internally coherent. It is
converged only after repeated cold-start validation rounds leave no unhandled
`P1`/`P2` findings in the requirements, decisions, boundaries, or verification
contract.

### Round 1 - Context and One-PR Suitability

Gather context as if starting cold:

```bash
git status --short
rg -n "<linear id>|<title keywords>|<primary symbols>" crates apps docs contracts assets MAP.md
rg -n "<diagnostic/code/cache/bridge/test keywords>" crates apps docs contracts
ls "$caol_ila/docs/plans/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
```

Also inspect:

- Linear issue body and related/parent issues when available.
- Persisted briefing artifact at `docs/briefings/shotloom/<slug>.md`.
- Current live code, not just the Ready briefing.
- Current docs/specs/ADRs/cache notes relevant to the spec.
- Sibling specs and recently deleted sibling specs.
- Existing dirty files that may affect or conflict with the spec.

Then answer before patching:

| Question | Required judgment |
|---|---|
| One-PR suitability | Is the spec small enough for one reviewable PR? If not, split or write `.draft.md`. |
| Scope fit | Does every proposed edit trace to Linear AC, ADR, repo precedent, or user instruction? |
| Missing context | What live source or doc changed the spec from the Ready briefing? |
| Blocking ambiguity | Does any implementation choice need user/Linear clarification before coding? |
| Contract completeness | Does each requirement have a locked decision, implementation stage, and verification path? |

Patch all `P1`/`P2` findings from Round 1 before running Round 2.

### Round 2+ - Different Stance Each Time

Each later round must use a different stance from the previous round. Rotate
through these, adding task-specific stances when useful:

| Stance | Lead question |
|---|---|
| Paranoid implementer | Where will the code fail to compile, borrow, parse, cache, or validate? |
| Minimal PR reviewer | What belongs in a follow-up because it makes the PR too large? |
| Domain owner | Does the spec respect Shotloom ownership boundaries, ADRs, and diagnostics policy? |
| Error-source-chain owner | Do `thiserror` enums, `map_err` branches, and validator/schema errors preserve external causes instead of flattening them into strings? |
| Test owner | Would the proposed tests actually fail before the implementation and pass after? |
| Docs/spec owner | Are docs/spec changes required, and are non-goals explicit enough? |
| Release/cache owner | Does the spec invalidate cache, serialized state, or user-visible behavior correctly? |
| Coupled-artifact owner | If one operation mutates two representations, can any failure persist only one side? |
| Requirements trace owner | Does each requirement map to implementation and verification without orphan lines? |

After every round:

1. Record findings mentally by severity.
2. Patch the spec for every `P1` and `P2`.
3. Re-check changed claims against live source or docs.
4. Run another stance if any `P1`/`P2` was found.

Stop the loop only when the remaining findings are `P3`/nit. Nit-only findings
do not block landing the spec; apply cheap wording fixes, otherwise proceed.

## Step 5 - Severity Model

| Priority | Meaning | Required action |
|---|---|---|
| `P1` | Implementation follows the wrong API, layer, invariant, scope, or is not suitable for one PR. | Patch before landing; split or write `.draft.md` if it cannot fit. |
| `P2` | Required test, doc, edge case, invariant, or diagnostic is absent. | Patch or scope out with rationale. |
| `P3` | Naming, layout, markdown, wording, or cheap cleanup/nit. | Patch when cheap; otherwise proceed once all `P1`/`P2` are gone. |

## Step 5 - Validation Lenses

Run each lens before declaring convergence:

| Lens | Check |
|---|---|
| Current-code contradiction | Spec does not add existing code, cite absent APIs, or miss failure paths. |
| Requirements trace | Every requirement maps to a source of authority, implementation stage, and verification item. |
| API boundary | Signatures, ownership, validation, return types, and public surface are exact. |
| Error ownership | Rejection codes, diagnostics, messages, and event order have one owning layer. |
| Error source chain | Rust error enums preserve wrapped external errors with `#[source]`; internal validator-only errors explicitly have no source. |
| Wire contract | Existing command and event shapes stay intact unless protocol change is in scope. |
| Invariants | Staged-byte draining, cache failures, success events, identity, paths, and URI shapes do not regress. |
| Mutation atomicity | Coupled artifact writes pre-validate or roll back so cache/persistence cannot store half-updated state. |
| Test evidence | Unit, integration, snapshot, fixture, manual, and negative cases map to changed behavior. |
| Format and docs | Tables render, paths resolve, and doc targets match repo structure. |
| Scope creep | Related features are in `Non-Goals` or `Follow-Up Candidates`. |

## Step 5a - Stance Rotation

Run these passes as the default Round 2+ rotation. Patch findings from a pass
before running the next pass.

| Pass | Stance | Lead question |
|---|---|---|
| 1 | Spec author | Did the spec contain every required contract: evidence, requirements, decisions, implementation, verification, traps? |
| 2 | Paranoid reviewer | What invariant, error path, edge case, or review objection is absent? |
| 2a | Error-source-chain reviewer | Which planned `thiserror` variant or `map_err` branch could lose a wrapped external cause by converting it into `String`? |
| 3 | Minimalist reviewer | What speculative API or related feature belongs outside scope? |
| 4 | Domain reviewer | Does each spec line trace to an AC, ADR, or repo precedent? |

Pass 1 with zero findings never equals convergence. Pass 4 must finish with no
unhandled `P1` or `P2`, and the floor checks must pass.

## Step 5b - Sibling Spec Consumption

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
3. Diff sibling `Locked Decisions` against the candidate spec. Record every
   disagreement as `Sibling <path> chose A; this spec chooses B because
   <live-code evidence path>.`
4. Mine sibling `Traps`, `Non-Goals`, `Verification`, and `Acceptance Criteria`.
   Adopt evidenced items. Reject only with an explicit rationale in
   `Locked Decisions`.
5. If a sibling has a stricter signature, finer diagnostic split, or defensive
   invariant, adopt it unless live-code evidence rejects it.

## Step 5c - Structural Floor Checks

Every final direct spec must pass:

| Floor | Pass condition |
|---|---|
| Traps | At least 2 defensive items against paths the spec does not propose. |
| Non-Goals | At least 5 adjacent-concern exclusions. |
| Manual repro | One line per user-facing diagnostic, error, or rejection code. |
| Persisted artifact proof | Coupled artifact mutation specs assert final persisted bytes/state/event order, not only intermediate counters or one mutated side. |
| Requirements trace | Every requirement maps to one implementation stage and one verification item. |
| Baseline | Implementation Spec starts with S0 baseline re-check or AC for one. |
| Locked Decisions | Every decision has `Rationale:` and `Rejected alternatives:` labels. |
| String split | Every user-facing string defaults to separate code or label; collapsed strings cite rationale. |
| Error source chain | Rust parser/loader/validator specs preserve external causes with `#[source]`, and tests cover `Error::source()` for source/no-source variants. |
| Traceability | Every in-scope line traces to an AC, ADR, or repo precedent. |

If any floor fails, patch the spec and re-run the relevant review lens.

## External Review Protocol

Use this only when the user asks for Claude, another model, or an external
agent to improve the spec. The external agent reviews the current canonical
spec candidate. It does not create the spec of record.

Reviewer prompt inputs:

- Current spec text.
- Ready briefing.
- Relevant Linear AC.
- Live-code evidence from Step 2.
- Instruction to preserve existing `Locked Decisions` unless live-code evidence
  proves them wrong.
- Instruction to return findings only, with priorities, line references,
  evidence, and minimal patch suggestions.
- Prohibition on full rewrite, rename, deletion, standalone replacement spec,
  broader diagnostics, weaker API signatures, or evidence-free decision changes.

Reviewer output contract:

```text
## Findings
| Prio | Spec line | Issue | Evidence | Minimal patch |

## Keep
<decisions that are sound and must not be changed>

## Do Not Rewrite
<sections or decisions to preserve>

## Patch Suggestions
<small section-level edits only>
```

Triage rules:

- Treat external output as evidence, not authority.
- Verify every finding against live source before editing the spec.
- Apply minimal patches that strengthen the canonical spec.
- If the reviewer returns a full replacement spec, mine only evidenced
  findings and patch the existing spec.
- If the reviewer writes a parallel `.md` file, keep it uncommitted and compare
  it as review input. Replace `$spec_path` only after explicit user selection.

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
<what a valid spec can cover after the split or decision>

## Blocked Scope
<what needs user or Linear clarification>
```

For `.partial.md`, write the same frontmatter with `status: partial` and include
the latest candidate plus `## Unresolved Review Findings`.

For `.claude.md`, write the full candidate body and include
`## Parallel Candidate Note` with the existing spec path and preservation reason.
