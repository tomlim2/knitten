---
description: Compatibility leaf/component Shotloom skill. Prefer shotloom-router, then shotloom-draft-spec for user-facing spec work.
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*), Bash(ah-resolve-doc-path:*), Bash(node:*)
---

# shotloom-draft-task-plan

Compatibility alias for the Shotloom spec workflow. Prefer
[`/shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md) in new user-facing
instructions.

When this legacy name is invoked, run the same workflow as
`/shotloom-draft-spec`: read the local planning briefing, audit live Shotloom
code, write requirements/decisions/verification and design-plan artifacts under
the local planning bundle, immediately run the spec review gate, share the
manifest path, then ask whether to implement.

## Mandatory Contract

After Step 1 resolves the local planning bundle, every stop writes local
artifacts through output contracts:

| Result | Artifact | Commit |
|---|---|---|
| Clean converged spec | `.agent-local/shotloom/planning/stl-<N>/spec.json` + `design-plan.json` + `manifest.json` | No |
| Step 2 factual stop | `.agent-local/shotloom/planning/stl-<N>/questions.json` | No |
| Unconverged draft | `.agent-local/shotloom/planning/stl-<N>/spec.json` with unresolved questions | No |
| Parallel or staged-delete spec | `.agent-local/shotloom/planning/stl-<N>/spec.json` with blocker note | No |

Pre-Step-1 failures stop without writing because no target path exists.

## Purpose

This skill authors a task spec, not an implementation checklist or briefing.
The spec is a pre-implementation contract: it locks requirements, evidence,
decisions, non-goals, verification, traps, and the design plan before source
edits begin. The local Ready briefing is the required handoff input; live
Shotloom code is canonical evidence. Missing primitives or scope expansion
create a local `questions.json` artifact.

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
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the Knitten checkout}"
source "$knitten_root/agent/lib/activate-local-bin.sh"
branch="$(git rev-parse --abbrev-ref HEAD)"
repo_root="$(git rev-parse --show-toplevel)"
git_common="$(git rev-parse --git-common-dir)"
origin="$(git remote get-url origin)"
shotloom_root="$(ah-resolve-doc-path repo shotloom)"
shotloom_root="${shotloom_root#RESOLVED_PATH=}"
knitten="$(ah-resolve-doc-path repo knitten)"
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
- The local planning bundle for the STL exists under
  `.agent-local/shotloom/planning/stl-<N>/`.
- The planning bundle contains `brief.json` or a manifest that points to it.
- cwd belongs to Shotloom by `repo_root`, `git_common`, or `origin`.

Resolve `spec.json`, `design-plan.json`, `questions.json`, and `manifest.json`
through output contracts:

```bash
node "$knitten/agent/lib/resolve-output.mjs" --create shotloom-planning-spec stl=stl-<N>
node "$knitten/agent/lib/resolve-output.mjs" --create shotloom-planning-design-plan stl=stl-<N>
node "$knitten/agent/lib/resolve-output.mjs" --create shotloom-planning-questions stl=stl-<N>
node "$knitten/agent/lib/resolve-output.mjs" --create shotloom-planning-manifest stl=stl-<N>
```

Use returned `absolutePath` values for writes. Surface the slug, STL id,
manifest path, and Shotloom root.

### Step 2: Run Current-State Audit

Read local `brief.json` first. Before
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

If a stop condition fires, write the conflict report to `questions.json` in Step 6a,
skip commit, then ask for the split or scope decision.

### Step 3: Detect Create vs Update Mode

Inspect the local planning manifest and existing local spec/design-plan JSON files.
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
Each Design Plan stage must follow
[`agent/document-templates/agent-hub/design-plan.md`](../../document-templates/agent-hub/design-plan.md).
Use [reference.md](reference.md) for Shotloom-specific baseline, risk, Linear,
validator, and compatibility rules.

The spec must answer these questions before any Design Plan stage appears:

| Question | Required answer |
|---|---|
| What exists now? | Current-state evidence table with paths and symbols. |
| What must change? | Problem statement and acceptance criteria tied to Linear/user intent. |
| Which option is selected? | Options considered, rejected alternatives, and selected direction when more than one plausible design exists. |
| What is locked? | Decisions, rejected alternatives, non-goals, invariants, and ownership. |
| How is it built? | Design Plan stages with file/module boundaries, I/O blocks, and risk rows. |
| How is it proven? | Verification gates, manual repro, and failure-path evidence. |

If the spec touches a surface below, add a `Proof Obligation Matrix` before
Design Plan stages:

| Surface | Required proof |
|---|---|
| Public API, DTO, serde, TS mirror, or documented key list | Fixture, snapshot, type check, or docs/code cross-check that fails on drift. |
| Shared UI primitive | Controlled/uncontrolled tests, native prop omission or support proof, ARIA/title precedence proof, and type-negative fixture for invalid prop combinations. |
| Bridge command, runtime event, or state transition | Rejection matrix, event ordering proof, and post-state assertion. |
| Provider or external payload adapter | Malformed item fixture, count/range bound, payload-size bound, and oversized well-shaped response test. |
| Workflow, CI job, smoke test, cache, or package script | Zero-test rejection, exact smoke expectation, permission surface, cache exposure, and cancellation semantics proof. |
| Node process supervisor | Spawn failure, child exit, descendant cleanup, POSIX process group, and Windows termination proof. |
| Asset, path, catalog, digest, or filesystem output | Unknown-prefix, traversal, symlink, local URL, digest mismatch, and cleanup-key collision fixture. |
| Durable docs, ADR, schema, or persisted metadata | ADR/schema/example/rejection-semantics cross-check. |

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

Write the local artifacts according to the Mandatory Contract table. If a clean
spec cannot land, write the best current candidate and record the blocker in
`questions.json`.

#### Step 6b: Commit Direct Spec Only

Raw local planning artifacts are not committed. If the user explicitly asks to
promote the reviewed plan to durable docs, create a separate tracked spec from
the local manifest through the normal Knitten worktree flow.

### Step 7: Chain to Review or Stop

If Step 6a produced a complete local manifest, immediately run:

```bash
/shotloom-review-task-plan "$slug"
```

Let `/shotloom-review-task-plan` own the review-spec commit and final report.
The final report must include the spec path and ask the user whether to start
implementation from the reviewed spec.

If Step 6a recorded unresolved blockers in `questions.json`, report the artifact
path and blocker, then stop. Do not run review-task-plan on incomplete local
artifacts.

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
