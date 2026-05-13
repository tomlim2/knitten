---
description: Draft cold-start Shotloom task plans after live code audit and iterative self-review; always writes the .md artifact; stop-and-ask only on factual briefing conflicts.
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(jq:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
---

# shotloom-draft-task-plan

Plan-phase companion to `/shotloom-start-task`. Writes one durable execution
plan to `caol-ila/docs/plans/<slug>.md`, self-reviews it until material gaps are
closed, commits, pushes, then stops. Implementation begins only after a separate
user go-ahead.

## Mandatory Output

**This skill MUST end with a `.md` file present on disk at `$plan_path`.**
Writing the file is non-deferrable. Commit/push is conditional (see Step 6),
but disk-write is not. If you reach the end of the skill without writing the
`.md`, you have failed the skill's contract.

Stop-and-ask without writing is allowed **only** for the two cases listed in
Step 2 ("Factual stop conditions"). All other ambiguity (which library to
reuse, which of several valid implementation paths to take, which default to
pick) is handled by the `## Locked Decisions` section of the plan, not by
stopping the skill.

## Purpose

This skill is a **cold-start plan author**, not a briefing formatter.
`/shotloom-start-task` Step 6 is a hypothesis. Linear and briefing text may be
stale because the Shotloom worktree may already contain partial or complete
implementation. This skill must audit the live codebase before writing a plan.

When live code disagrees with the briefing, distinguish two cases:

| Case | Skill behavior |
|---|---|
| **Factual conflict** — briefing claims X exists/doesn't exist but live code says the opposite | Rewrite the plan's scope around what is actually true; do not stop. |
| **Implementation-choice conflict** — briefing names a scope element (e.g. `.gltf` support) but multiple valid implementation paths exist (embed-only, multi-upload, zip-bundle) | Pick a default; document alternatives in `## Locked Decisions` with `Rejected alternatives:`; do not stop. |
| **Missing-scope conflict** — briefing assumes a wire shape, fixture, event, ADR, or dependency that does not exist in the repo at all | Stop and ask (Step 2 factual stop condition). |

## Arguments

- `[slug]` - kebab-case slug for the plan file. Optional; default is the
  current worktree branch body with the `<type>/` prefix stripped.

If no argument is provided and no Shotloom worktree branch is active, show usage
and stop. Never invent a slug.

Usage:
- `/shotloom-draft-task-plan` inside an active worktree
- `/shotloom-draft-task-plan gltf-normalize-extended-collider`

## Preconditions

- `/shotloom-start-task` has run in this session and the user OK'd the Step 6
  Ready briefing.
- Current cwd is inside a Shotloom repo or Shotloom worktree.
- `caol-ila` repo path is resolvable from
  `~/.claude/private/caol-config/repo-paths.json`.

If any precondition fails, surface the failure and stop.

## Workflow

### Step 1: Resolve Inputs

Resolve the branch, slug, Shotloom root, caol-ila root, and plan path.

```bash
branch=$(git rev-parse --abbrev-ref HEAD)
slug=${1:-${branch#*/}}
caol_ila=$(jq -r '."caol-ila".path // ."caol-ila" // .caol_ila.path // .caol_ila // empty' ~/.claude/private/caol-config/repo-paths.json)
plan_path="$caol_ila/docs/plans/$slug.md"
```

Verify:
- `slug` is non-empty kebab-case.
- `slug` has no `<type>/` prefix.
- `$caol_ila/docs/plans/` exists.
- Shotloom root is the repo being audited.

Surface:

```text
plan slug = <slug>
target = <plan_path>
shotloom root = <path>
```

### Step 2: Run Current-State Audit

Before drafting, verify what already exists in the live Shotloom tree. This is
mandatory even if the briefing sounds complete.

Run targeted searches from the Shotloom root. Choose terms from the issue and
briefing:

```bash
git status --short
rg -n "<primary type/function/command names>" crates apps docs contracts MAP.md
rg -n "<bridge command/event/kind names>" crates/shotloom-core apps/editor/src/bridge crates/shotloom-engine
rg -n "<editor entry point names>" apps/editor/src
rg -n "<fixture or asset names>" assets crates apps docs
```

Read the matching source files that define:
- existing bridge wire shape
- handler branch
- editor entry point
- tests and fixtures
- docs that already claim the behavior

Classify every relevant item:

| Class | Meaning |
|---|---|
| Already Done | Live code already implements this part. |
| Partial | Live code exists but is weaker than the target behavior. |
| Missing | No live implementation found. |
| Conflict | Briefing claims a shape that live code contradicts. |

**Audit-driven adjustments (continue and write the plan):**
- If the briefing says to add something that already exists, rewrite the
  scope around the actual remaining gap. Continue.
- If the briefing names a scope element but the implementation path is
  ambiguous (multiple valid options), pick the smallest correct default
  and document alternatives in `## Locked Decisions` under
  `Rejected alternatives:`. Continue.

**Factual stop conditions (stop and ask without writing the plan body to
disk):** These are the ONLY two cases that block writing.

1. **Wrong-shape briefing primitive citation** — the briefing cites a
   primitive (template, standard, ADR section, repo rule) but the cited
   pattern is not codified in that primitive. The plan would smuggle in
   single-file standard invention. Report the AC ↔ primitive mismatch
   and ask for a split.
2. **Out-of-briefing scope expansion** — implementing the named scope
   forces a protocol change, a new dependency, a new ADR, or a multi-file
   import design that the briefing did not even mention. This is
   different from an ambiguous implementation path within a named scope:
   here the scope itself is enlarging.

Anything else — implementation choice, library reuse, error policy,
diagnostic shape, test seam, doc-update wording — is **not a stop**. It
goes in `## Locked Decisions` and the plan still gets written.

### Step 3: Detect Create vs Update Mode

Distinguish four states by reading both `$plan_path` and `git status` /
`git show HEAD:docs/plans/<slug>.md`:

| Disk | Index | HEAD | Treat as |
|---|---|---|---|
| absent | absent | absent | Create. Write fresh. |
| present | committed | matches | Update. Default to in-place replace; show existing `status` and title. |
| absent | staged-delete | present | **In-progress rewrite by another author/agent.** Surface both: the HEAD body and the proposed new body. Ask the user which to keep. This is the ONE Step-6 approval gate the skill permits. |
| present (untracked) | absent | present (different content) | **Parallel draft scenario** (e.g. user comparing two AI agents' drafts). Do not overwrite the working-tree file silently. Ask whether to overwrite, append a `-claude` / `-codex` suffix, or stop. |

For ordinary updates (row 2):
- Show the existing `status` and title before overwriting.
- Default to replacing stale content in-place if the user explicitly asked
  for a revised plan via `/shotloom-draft-task-plan` re-invocation, "redo
  the plan", or similar.
- Start a revision section only when historical comparison is useful.

### Step 4: Draft Cold-Start Plan Body

Match the `caol-ila/docs/plans/` frontmatter convention:

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

Use this body structure by default:

| Section | Required content |
|---|---|
| `# <Title>` | Action title derived from the real remaining work, not stale Linear wording. |
| `## Cold-Start Summary` | One paragraph stating what is already true and what remains. |
| `## Current State` | Table of audited surfaces with evidence paths. |
| `## Problem` | The concrete remaining gap after audit. |
| `## Locked Decisions` | Numbered decisions with rationale and rejected alternatives. |
| `## Non-Goals` | Explicit exclusions, especially stale or tempting scope creep. |
| `## Implementation Plan` | Staged plan from smallest proof to broader updates. |
| `## Acceptance Criteria` | Checklist tied to the remaining gap, not duplicated completed work. |
| `## Verification` | Focused gates first, then broad gates, then manual repro. |
| `## Traps` | False paths that would break current architecture. |
| `## Follow-Up Candidates` | Real but out-of-scope work. |

Rules:
- Do not restate Linear verbatim.
- Do not list already-complete work as future work.
- Do not promise unsupported formats or workflows.
- Use concrete file paths in `Current State`.
- If the plan says "add", verify the target does not already exist.
- If the plan says "reuse existing", name the existing implementation.

### Step 5: Run Iterative Plan Self-Review

Do not land the first draft. Review the drafted plan as if it were a PR under
implementation review, then revise it. Repeat until the latest review pass finds
no unhandled material defects.

Use this severity model:

| Priority | Meaning | Required action before landing |
|---|---|---|
| P1 | Implementation would likely go wrong, rework, or create the wrong API. | Must be fixed in the plan. |
| P2 | Reviewable ambiguity, missing test/doc acceptance, or risky edge case. | Fix in the plan unless explicitly scoped out with rationale. |
| P3 | Nit, layout, naming, or speculative cleanup. | Fix when cheap; otherwise move to `Follow-Up Candidates` or `Traps`. |

Run at least these review lenses:
- **Current-code contradiction:** Does the plan add something that already
  exists, cite a non-existent API, or miss an existing failure path?
- **API boundary:** Are function signatures, ownership, input validation,
  return types, and public surface area exact enough to avoid speculative APIs?
- **Error and diagnostic ownership:** Are rejection codes, diagnostic codes,
  human-readable messages, and event ordering owned by a named layer?
- **Wire contract:** Does the plan preserve existing command/event shapes unless
  a protocol change is explicitly in scope?
- **Invariant preservation:** Does it mention staged-byte draining, cache
  failure paths, existing success events, identity, paths, and URI shapes that
  must not regress?
- **Test evidence:** Are unit, integration, snapshot, fixture, manual repro, and
  negative cases mapped to the changed behavior?
- **Format and docs:** Will markdown tables render, paths resolve, and doc
  updates match the actual repository structure?
- **Scope creep:** Are tempting related features captured as non-goals or
  follow-ups instead of hidden implementation work?

#### External Claude review protocol

If the user asks to use Claude, another model, or an external agent to improve
the plan, use that agent only as a reviewer of the current canonical draft.
Never ask for or accept a wholesale replacement plan once `$plan_path` already
exists.

Reviewer prompt contract:
- Provide the current plan text, Ready briefing, relevant Linear AC, and the
  live-code evidence gathered in Step 2.
- State that the current plan is the canonical draft.
- Instruct the reviewer to preserve existing `Locked Decisions` unless live-code
  evidence proves them wrong.
- Ask for `P1` / `P2` / `P3` findings only, with plan line references,
  live-code evidence, and minimal patch suggestions.
- Forbid rewriting the whole plan, renaming the plan, deleting the plan, or
  producing a new standalone plan body.
- Forbid broadening specific diagnostics into generic buckets, weakening API
  signatures, or replacing already-converged decisions without evidence.

Reviewer output must have this shape:

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

Triage rule:
- Treat external output as evidence, not authority.
- Verify every finding against live source before editing the plan.
- Apply only minimal patches that strengthen the canonical plan.
- If the reviewer returns a complete replacement plan anyway, do not adopt it.
  Mine it only for new evidenced findings, then patch the existing plan.
- If the reviewer writes a parallel `.md` file, keep it uncommitted and compare
  it as review input. Do not replace `$plan_path` unless the user explicitly
  selects that file after seeing the delta.

For each pass:
1. List findings internally as `P1`, `P2`, or `P3`.
2. Patch the plan for every P1.
3. Patch or explicitly scope every P2.
4. Patch cheap P3 items; otherwise record them in `Traps` or
   `Follow-Up Candidates`.
5. Re-run a focused source check for any changed claim.

Convergence rule:
- Continue self-review until one full pass finds no P1 and no unhandled P2.
- If a new P1 appears in any pass, fix it and run another full pass.
- If only P3 items remain, land only after they are either fixed or documented.
- If convergence requires changing the requested scope, stop and ask instead of
  landing a misleading plan.

When the user provides external review findings after a plan has landed, treat
them as another self-review pass in update mode. Apply the same P1/P2/P3 model,
revise the same plan, then commit and push a follow-up.

### Step 6: Write + Commit + Push

The user's Step 6 briefing OK plus invoking this skill is approval to land a
valid plan. Do not add another approval gate after a clean current-state audit
and converged self-review loop, **except** for the Step 3 row-3 (staged-delete)
and row-4 (parallel-draft) edge cases.

#### Step 6a: Write to disk (MANDATORY, unconditional)

`Write` the drafted body to `$plan_path` on disk. This is non-deferrable.
Even when one of the following applies, the `.md` body MUST exist on disk
before the skill ends — under a temporary suffix if necessary:

| Condition | Action |
|---|---|
| Step 2 factual stop condition fired | Write the body anyway as `$plan_path.draft` so the user can read the proposed scope side-by-side with the conflict report. |
| Step 5 left an unhandled P1/P2 | Continue self-review until convergence. Do not exit. The convergence loop has no time budget; converge or report that you cannot. Disk-write happens after convergence. |
| Step 3 row 3 (staged delete + HEAD) | Write under `$plan_path.claude.md` so HEAD content stays intact for comparison. Ask user which to keep. |
| Step 3 row 4 (parallel draft) | Write under `$plan_path.claude.md`. Ask user which to keep. |
| Anything else | Write directly to `$plan_path`. |

Reaching the end of the skill turn without any `.md` artifact on disk is
a contract violation. If you find yourself about to do that, write the
current best-effort draft to `$plan_path.partial.md` and surface the
reason.

#### Step 6b: Commit + push (conditional)

Only proceed past 6b's first line if 6a wrote directly to `$plan_path`
(not to a `.draft.md`, `.claude.md`, or `.partial.md` suffix). Otherwise
skip 6b — disk artifact is enough for the user to act on.

From the caol-ila working directory:
1. `git add docs/plans/<slug>.md`
2. `git commit -m "plan(shotloom): <slug>"`
3. `git log -1 --format="%an <%ae>"`
4. `git push`

Expected caol-ila author identity: `tomlim2 <tomandlim@gmail.com>`. If
hooks fail, fix the cause and retry. Never use `--no-verify`.

Only commit the plan file unless the user explicitly asked for related
skill or doc updates in the same turn.

### Step 7: Report + STOP

Emit one short report:

```text
plan doc landed at <plan_path>
Implementation needs a separate go-ahead.
```

Then end the turn.

Do not edit Shotloom source files. Reading Shotloom source for the audit is
required; modifying it is forbidden in this skill.

## Binding Rules

- **Always write the `.md` to disk.** Step 6a is unconditional. Ending the
  skill turn without a `.md` artifact on disk is a contract violation, even
  when Step 2 fires or Step 5 cannot converge — use a `.draft.md` /
  `.partial.md` / `.claude.md` suffix in those cases, but write something.
- **Audit before write.** The live Shotloom tree outranks Linear and briefing
  text.
- **Implementation-choice ambiguity goes in Locked Decisions, not in a
  stop.** Multiple valid library/error/diagnostic/test/api paths within
  the named scope are resolved by picking a default and documenting the
  rejected alternatives. They do not block writing the plan.
- **Review before landing.** A plan is not ready until the iterative self-review
  pass has converged.
- **External agents are reviewers, not planners of record.** Claude or another
  model may supply P1/P2/P3 findings and minimal patches, but must not replace
  the canonical plan wholesale.
- **Factual-conflict briefing stops the skill before commit, not before write.**
  When Step 2 stop conditions fire, still write the draft to disk under a
  suffix so the user can read both the proposed scope and the conflict
  report.
- **One plan artifact, one commit.** This skill commits at most one
  `docs/plans/<slug>.md`. Drafts written under suffixes are not committed.
- **Plan is not implementation.** Worktree source edits require a later user
  message such as `implement`, `go`, or an explicit implementation request.
- **No hidden scope expansion.** Protocol changes, `.gltf` multi-file support,
  new dependencies, ADRs, and broad UX changes require explicit scope.
- **No `--no-verify`.** Hook failures are real feedback.

## Related

- `/shotloom-start-task` - Step 1-6 pre-flight and Ready briefing.
- `~/.claude/rules/shotloom.md` - Shotloom gates and approval matrix.
- `caol-ila/docs/plans/` - destination folder; inspect sibling plans for local
  style.
- `caol-ila/LOOKUP.md` "Design a new layer" row - canonical pointer to this
  folder.
