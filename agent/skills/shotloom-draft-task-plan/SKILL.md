---
description: Draft cold-start Shotloom task plans after live code audit and iterative self-review; stop on stale briefing; no implementation.
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(jq:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
---

# shotloom-draft-task-plan

Plan-phase companion to `/shotloom-start-task`. Writes one durable execution
plan to `caol-ila/docs/plans/<slug>.md`, self-reviews it until material gaps are
closed, commits, pushes, then stops. Implementation begins only after a separate
user go-ahead.

## Purpose

This skill is a **cold-start plan author**, not a briefing formatter.
`/shotloom-start-task` Step 6 is a hypothesis. Linear and briefing text may be
stale because the Shotloom worktree may already contain partial or complete
implementation. This skill must audit the live codebase before writing a plan.

If live code contradicts the briefing, stop before writing. Report the stale
assumptions and ask for a revised scope.

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

Stop conditions:
- If the briefing says to add something that already exists, rewrite the scope
  around the actual remaining gap.
- If the briefing assumes a wire shape, event, file, fixture, or command that
  does not exist, stop and report it unless the correction is obvious and narrow.
- If `.gltf`, multi-file import, protocol changes, new dependencies, or ADR
  changes appear necessary but were not in the briefing, stop and ask.

### Step 3: Detect Create vs Update Mode

If `$plan_path` exists, read it and treat the run as an update. Otherwise create
from scratch.

For updates:
- Show the existing `status` and title.
- Default to replacing stale content in-place if the user explicitly asked for a
  revised plan.
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
and converged self-review loop.

Do not write if Step 2 found unresolved stale assumptions or Step 5 still has
unhandled P1/P2 findings.

For a clean plan:
1. Write the drafted body to `$plan_path`.
2. From the caol-ila working directory:
   - `git add docs/plans/<slug>.md`
   - `git commit -m "plan(shotloom): <slug>"`
   - `git log -1 --format="%an <%ae>"`
   - `git push`
3. Expected caol-ila author identity: `tomlim2 <tomandlim@gmail.com>`.
4. If hooks fail, fix the cause and retry. Never use `--no-verify`.

Only commit the plan file unless the user explicitly asked for related skill or
doc updates in the same turn.

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

- **Audit before write.** The live Shotloom tree outranks Linear and briefing
  text.
- **Review before landing.** A plan is not ready until the iterative self-review
  pass has converged.
- **Stale briefing stops the skill.** Report conflicts instead of landing a
  misleading plan.
- **One artifact, one stop.** This skill writes at most one plan doc.
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
