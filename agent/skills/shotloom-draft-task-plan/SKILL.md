---
description: Compatibility entry for Shotloom task specs; prefer shotloom-draft-spec for user-facing flows
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
context-rules: rules/shotloom.md,rules/shotloom-docs-lane.md
---

# shotloom-draft-task-plan

Compatibility alias for the Shotloom spec workflow. Prefer
[`/shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md) in new user-facing
instructions.

When this legacy name is invoked, run the same workflow as
`/shotloom-draft-spec`: read the persisted Linear briefing, audit live Shotloom
code, write one requirements/decisions/verification contract, commit and push
only a clean direct spec plus its briefing, immediately run the spec review
gate, share the final spec path, then ask whether to implement.

## Mandatory Contract

After Step 1 resolves `$spec_path`, every stop writes one `.md` artifact:

| Result | Artifact | Commit |
|---|---|---|
| Clean converged spec | `$knitten/docs/plans/proposed/<slug>.md` + `$knitten/docs/briefings/shotloom/<slug>.md` | Yes |
| Step 2 factual stop | `$knitten/docs/plans/drafts/<slug>.md` | No |
| Unconverged draft | `$knitten/docs/plans/drafts/<slug>-partial.md` | No |
| Parallel or staged-delete spec | `$knitten/docs/plans/drafts/<slug>-claude.md` | No |

Pre-Step-1 failures stop without writing because no target path exists.

## Purpose

This skill authors a task spec, not an implementation checklist or briefing.
The spec is a pre-implementation contract: it locks requirements, evidence,
decisions, non-goals, verification, traps, and the design plan before source
edits begin. The persisted Ready briefing is the required handoff input; live
Shotloom code is canonical evidence. Missing primitives or scope expansion
create a `.draft.md` conflict artifact.

## Planning Stages

Use this stage order: Briefing -> Research -> Options -> Spec Contract ->
Design Plan -> Implementation. This skill owns Research through Design Plan;
`/shotloom-start-task` owns Briefing, and a later user-approved workflow owns
Implementation. Full section rules: [reference.md](reference.md).

## Arguments

- `[slug]` - optional kebab-case spec slug.
- Without `[slug]`, derive from current branch body after `<type>/`.
- If branch is `main`, `HEAD`, or lacks `/`, show usage and stop.
- Never invent a slug.

## Workflow

### Step 1: Resolve Inputs

```bash
branch="$(git rev-parse --abbrev-ref HEAD)"
repo_root="$(git rev-parse --show-toplevel)"
git_common="$(git rev-parse --git-common-dir)"
origin="$(git remote get-url origin)"
shotloom_root="$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo shotloom)"
shotloom_root="${shotloom_root#RESOLVED_PATH=}"
knitten="$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo knitten)"
knitten="${knitten#RESOLVED_PATH=}"
```

```bash
if [ -n "$1" ]; then
  slug="$1"
else
  if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ] || ! [[ "$branch" == */* ]]; then
    echo "usage: /shotloom-draft-spec <kebab-slug>"
    exit 1
  fi
  slug="${branch#*/}"
fi
```

Verify:
- `/shotloom-start-task` has run and the user accepted the Ready briefing.
  When invoked by `/shotloom-prepare-task`, its no-blocker orchestration counts
  as Ready-briefing acceptance.
- `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and contains no `/`.
- Knitten is on the daily Shotloom docs branch from
  `agent/rules/shotloom-docs-lane.md`: `codex/YYYYMMDD-shotloom-docs`.
- `$knitten/docs/plans/proposed/` and `$knitten/docs/plans/drafts/` exist.
- `$knitten/docs/briefings/shotloom/$slug.md` exists.
- cwd belongs to Shotloom by `repo_root`, `git_common`, or `origin`.

Set `spec_path="$knitten/docs/plans/proposed/$slug.md"`. Surface spec slug, target,
briefing path, and Shotloom root.

### Step 2: Run Current-State Audit

Read `briefing_path="$knitten/docs/briefings/shotloom/$slug.md"` first. Before
authoring, search the live Shotloom tree. Choose terms from the briefing,
Linear, branch, AC, ADR, and affected modules. Search examples:
[reference.md](reference.md).

Read matching source files that define wire shape, handler branch, editor entry
point, fixtures, tests, and docs. Classify each surface as `Already Done`,
`Partial`, `Missing`, or `Conflict`. This step is the Research stage.

Factual stop conditions:
1. Cited primitive mismatch: briefing cites a template, standard, ADR, or repo
   rule that does not codify the cited pattern.
2. Out-of-briefing expansion: scope forces protocol change, dependency, ADR, or
   multi-file import design absent from the briefing.

If a stop condition fires, write the conflict report as `.draft.md` in Step 6a,
skip commit, then ask for the split or scope decision.

### Step 3: Detect Create vs Update Mode

Inspect `$spec_path`, `git -C "$knitten" status`, and
`git -C "$knitten" show HEAD:docs/plans/proposed/<slug>.md`.
Use Read for files present on disk. Use `git -C "$knitten" show HEAD:<path>`
only for HEAD-only or deleted-at-HEAD content.

| Disk | Index | HEAD | Action |
|---|---|---|---|
| absent | absent | absent | Create direct spec. |
| present | committed | matches | Update direct spec in place. Surface current title and `status` first. |
| absent | staged-delete | present | Write `.claude.md`; ask which body to keep. |
| present untracked | absent | present different | Write `.claude.md`; ask whether to overwrite, keep suffix, or stop. |

### Step 4: Author Spec Contract

Use the schema, section order, and body rules in [reference.md](reference.md).
Author around the audited remaining gap. Do not restate Linear verbatim or list
complete work as future work. Use concrete file paths. Verify every `add`
target is missing and every `reuse` target is named.

For boundary-heavy work, include an `## Options Considered` section before
locked decisions. Boundary-heavy work includes bridge protocol, core model,
runtime topology, import/export pipeline, persisted schema, asset lifecycle,
promotion/demotion, or user-facing workflow ownership.

Write `## Design Plan` as the implementation-order section in new specs.
Existing specs that already use `## Implementation Spec` remain valid during
updates; do not rename the section unless the spec is already being rewritten.
Each Design Plan stage must state input, output, forbidden output, failure
handling, and proof. Use the I/O block in [reference.md](reference.md).

The spec must answer these questions before any Design Plan stage appears:

| Question | Required answer |
|---|---|
| What exists now? | Current-state evidence table with paths and symbols. |
| What must change? | Problem statement and acceptance criteria tied to Linear/user intent. |
| Which option is selected? | Options considered, rejected alternatives, and selected direction when more than one plausible design exists. |
| What is locked? | Decisions, rejected alternatives, non-goals, invariants, and ownership. |
| How is it built? | Design Plan stages with file/module boundaries, I/O blocks, and risk rows. |
| How is it proven? | Verification gates, manual repro, and failure-path evidence. |

If the spec adds or changes a validator, manifest, package script, file IO path,
asset importer, or path resolver, add a `Validator Contract Matrix` before
Design Plan stages:

| Row | Required content |
|---|---|
| Contract claim | What the validator/script promises to accept or reject. |
| Negative fixture | Minimal bad input that must fail before implementation. |
| Boundary rule | Root containment, absolute-path policy, traversal handling, and symlink stance when relevant. |
| Error order | Which diagnostic appears first for the bad input. |
| Enforcement surface | CI workflow, local-only command, or README-documented exclusion with reason. |
| Regression proof | Test or command that fails before the fix and passes after it. |

Use `path.relative`-style root containment for new relative path checks unless
the spec names a stronger existing Shotloom helper. Do not use string-prefix
containment alone for sibling-path safety.

Apply the specialized clauses in [reference.md](reference.md) for coupled
artifact atomicity, Rust fixture shape, error-source-chain proof, Linear
Briefing, and Risk Map.

Every direct Shotloom spec must include `## Risk Map`. If a Linear issue id is
known, the spec must also include `## Linear Briefing`. High-risk Design Plan
stages must cite the Risk Map row they satisfy.

If any answer depends on user intent rather than live code or written Linear
scope, stop and ask the user before writing the direct spec. Do not bury the
question as a guessed locked decision.

### Step 5: Validate Spec Contract Until Only Nits Remain

Validate through the loop in [reference.md](reference.md): first-round context
collection, explicit one-PR suitability, sibling spec consumption, rotated
stances, structural floor checks, and zero unhandled `P1`/`P2`. Patch every
`P1`/`P2`, re-check claims against source, then continue until only `P3`/nit
findings remain. For Rust parser/loader/validator work, include an
error-source-chain pass.

If convergence changes requested scope, write `.draft.md`, skip commit, and ask.
If convergence exposes a product, scope, or trade-off question that cannot be
resolved from live code, Linear, sibling specs, or briefing evidence, stop and
ask the user instead of guessing.

### Step 6: Write, Commit, Push

#### Step 6a: Write Artifact

Write exactly one artifact according to the Mandatory Contract table. If a
clean spec cannot land, write the best current candidate under the correct suffix
and report the blocker.

#### Step 6b: Commit Direct Spec Only

Continue only when Step 6a wrote directly to `$spec_path`.

From Knitten:

```bash
git -C "$knitten" config user.name
git -C "$knitten" config user.email
git -C "$knitten" add docs/briefings/shotloom/<slug>.md
git -C "$knitten" add docs/plans/proposed/<slug>.md
git -C "$knitten" commit -m "docs(shotloom): spec <slug>"
git -C "$knitten" push
```

Before commit, verify the Knitten docs lane identity from
`agent/rules/shotloom-docs-lane.md` (`tomlim2 <tomandlim@gmail.com>`). This is
separate from the Shotloom implementation repo identity. If hooks fail, fix the
cause and retry. Never use `--no-verify`.
The commit lands on the daily Shotloom docs branch, not a per-STL Knitten
branch.

Commit only `docs/briefings/shotloom/<slug>.md` and
`docs/plans/proposed/<slug>.md` unless the user explicitly requested skill or
doc edits in the same turn.

After push, create or update the daily docs PR required by
`agent/rules/shotloom-docs-lane.md`.

### Step 7: Chain to Review or Stop

If Step 6b committed and pushed a direct spec at `$spec_path`, immediately run:

```bash
/shotloom-review-task-plan "$slug"
```

Let `/shotloom-review-task-plan` own the review-spec commit and final report.
The final report must include the spec path and ask the user whether to start
implementation from the reviewed spec.

If Step 6a wrote a suffix artifact (`.draft.md`, `.partial.md`, or
`.claude.md`), report the artifact path and blocker, then stop. Do not run
review-task-plan on non-direct artifacts.

Do not edit Shotloom source files in this skill.

## Binding Rules

- Audit before write. Live Shotloom code outranks Linear and briefing text.
- The persisted briefing is mandatory input. Do not author a spec from chat
  memory alone.
- After `$spec_path` resolves, every stop writes a direct or suffix `.md`.
- Implementation-choice ambiguity goes in `## Locked Decisions`.
- User-intent ambiguity does not go in `## Locked Decisions`; stop and ask the
  user before committing the spec.
- Factual stop conditions stop before commit, not before writing.
- One briefing artifact, one task spec artifact, one direct-spec commit, then
  one automatic `/shotloom-review-task-plan <slug>` run for direct specs only.
- The user-facing next command name is `/shotloom-draft-spec`; this legacy
  skill name remains only for compatibility.
- Spec is not implementation. Source edits need a later user request.
- Protocol changes, multi-file `.gltf` support, dependencies, ADRs, and broad
  UX changes require explicit scope.
- No `--no-verify`.
