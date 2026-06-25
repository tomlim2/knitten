# Shotloom-Owned Task Memory

## Status

Implemented, first pass.

## Goal

Make Shotloom task documents and task byproducts live under the Shotloom
workspace as the primary source of truth, while reducing Knitten/KSL token cost
by turning Knitten into an optional helper layer instead of the task memory
owner.

## Problem

Shotloom task preparation currently writes planning briefs, specs, manifests,
review outputs, RCA briefings, and activity logs through KC-owned output
contracts and the KC local artifact path registry. This keeps paths consistent,
but it creates three problems:

- The task memory is physically separated from the Shotloom repo and the
  worktree that produced it.
- KSL workflows must keep reading KC output contract instructions and long flow
  documents even when the real need is only "append task context."
- Plugin source, materialized copy, and Codex cache drift can block or confuse
  a Shotloom task even though the task documents are Shotloom-owned in meaning.

The important durable decision is not whether Knitten is used. The important
decision is where Shotloom task documents accumulate so future sessions,
follow-ups, summaries, and infographics can find them.

## Boundary

In scope:

- Define a Shotloom repo-local task memory layout.
- Add a migration plan from KC-hosted Shotloom local artifacts to
  Shotloom-owned task memory.
- Keep Knitten/KSL usable as helper workflows during migration.
- Slim KSL task workflows so they write through a small resolver/script instead
  of repeatedly loading long path policy.
- Keep task artifacts local by default and promote only selected summaries into
  durable Shotloom docs.

Out of scope:

- Rewriting all historical task artifacts in one pass.
- Removing Knitten or KSL entirely in the first pass.
- Changing Linear, GitHub, deploy, PR posting, or destructive cleanup approval
  rules.
- Creating a database, external service, or Notion dependency.
- Making Shotloom source code depend on Codex plugins at runtime.
- Moving generic KC finding reports into Shotloom.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `agent/config/outputs.json` | Yes | Current KC compatibility output contracts for Shotloom artifacts. |
| `agent/config/local-artifact-paths.json` | Yes | Current KC local artifact registry for Shotloom task memory. |
| `docs/specs/long-running-work-memory-decision-contract.md` | Yes | Existing KC-era memory contract that this spec amends for Shotloom task artifacts. |
| `knitten-sl/skills/shotloom-prepare-task/flow.md` | Yes | Current orchestration that renders prepared briefings and appends task activity. |
| `knitten-sl/skills/shotloom-start-task/flow.md` | Yes | Current start-task artifact and worktree preparation flow. |
| `knitten-sl/skills/shotloom-draft-spec/flow.md` | Yes | Current planning artifact writer. |
| Shotloom repo checkout | Yes | New owner of task memory paths and promotion conventions. |
| Shotloom `docs/guidelines/project-management-model.md` | Yes | Existing system-of-record rules for specs, issues, PRs, and agent-local plans. |
| Shotloom `docs/guidelines/documentation-standard.md` | Yes | Existing durable-doc classification and anti-duplication rules. |
| Shotloom `.agent-local/` ignore behavior | Yes | Proof that local task memory cannot be accidentally committed. |
| Existing `.agent-local/shotloom/**` artifacts | No | Optional migration source; old artifacts may stay in place. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Shotloom task memory layout | durable docs/code | Canonical path convention under the Shotloom workspace. |
| Shotloom task artifact resolver | durable code | Small script or command that resolves and creates task artifact paths without KC. |
| KSL workflow updates | durable plugin docs/scripts | KSL writes through the Shotloom resolver and no longer owns detailed path policy. |
| KC compatibility deprecation | durable KC docs/config | KC keeps old output contracts temporarily but marks Shotloom task memory as Shotloom-owned. |
| Optional migration index | local | Mapping from old KC artifact paths to new Shotloom task folders when migrated. |

## Contract

- The primary Shotloom task memory root is:

```text
<shotloom-root>/.agent-local/shotloom/tasks/<task-key>/
```

- `<task-key>` is `stl-<N>` when a Linear issue exists. The Linear id must come
  from task metadata, Linear context, or an explicit environment value, not from
  the git branch name. If no Linear issue exists, use a short lowercase kebab
  slug.
- The default local layout is:

```text
.agent-local/shotloom/tasks/<task-key>/
  activity.md
  index.json
  briefings/
  specs/
  reviews/
  handoffs/
  rca/
  pr/
  tmp/
```

- `activity.md` is append-only and timestamped.
- `index.json` is small and points to artifact paths; it must not duplicate full
  artifact bodies.
- `index.json` must include at least `schemaVersion`, `taskKey`,
  `primaryRoot`, `storageVersion`, `artifacts`, `legacyArtifacts`, `writers`,
  and `updatedAt`. Reopened tasks resume from this index first.
- The resolver must refuse to create local task memory if `.agent-local/` is not
  ignored in the active Shotloom checkout, as proven by `git check-ignore`.
- KSL may write task artifacts only by using the Shotloom resolver. During the
  first migration pass, a KSL bridge may implement the same command contract
  only when the Shotloom repo resolver is unavailable; that bridge must resolve
  a Shotloom checkout and write only under the Shotloom `.agent-local/` task
  memory root, never a new KC-owned primary root.
- KC may provide generic templates and compatibility helpers, but it must not be
  required to locate or own Shotloom task memory.
- Existing KC Shotloom output contracts remain compatibility surfaces until all
  KSL workflows that use them have migrated.
- This spec amends the Shotloom-specific storage portion of the existing KC
  long-running work memory contract. Until the implementation lands, that older
  KC contract remains the compatibility-era behavior; after migration, KC docs
  must point Shotloom task artifacts to this Shotloom-owned contract.
- Durable publication is explicit and is not a default task-folder mirror.
  Selected task output becomes repo documentation only when it represents
  durable Shotloom truth, and it must be classified through the existing
  Shotloom documentation model such as `docs/specs/`, `docs/adr/`,
  `docs/arch/`, `docs/guidelines/`, or `docs/tech-debt/`. A new
  `docs/tasks/<task-key>/` convention requires a separate Shotloom docs
  standard update before any workflow may assume it.
- Local task memory is not committed by default and must remain agent-local
  execution state.
- Generic KC finding reports remain in the Knitten finding report queue.
- Approval gates do not change: posting to GitHub/Linear, deploying, pushing,
  deleting, or other irreversible external mutations still require the existing
  skill approvals.

## Validation

- `node scripts/doctor.mjs` from KC.
- `node scripts/validate-payload-boundary.mjs --payload <knitten-sl-root>` from
  KC.
- `node scripts/test-shotloom-skills.mjs` from KSL.
- `node scripts/validate-routing.mjs` from KSL.
- `node scripts/validate-boundary.mjs` from KSL.
- Shotloom resolver smoke tests:
  - create `activity.md` parent directories for `stl-<N>`
  - reject path traversal and invalid task keys
  - write or return `index.json` path
  - reject writes when `.agent-local/` is not ignored
  - reopen a task by reading `index.json` without loading KC config
  - run without Knitten installed
- Manual proof that `git check-ignore .agent-local/example` succeeds in the
  Shotloom checkout or the resolver exits with a clear error.
- Manual proof that `shotloom-prepare-task` can brief and append activity using
  the Shotloom task memory root.
- Manual proof that old KC output contracts either still resolve or emit a
  documented deprecation path during the migration window.
- `git diff --check`.

## Acceptance Criteria

- A new Shotloom-owned task memory path convention is documented and used by at
  least the prepare/start/draft-spec path.
- `shotloom-prepare-task` no longer needs to read KC path policy to append task
  activity.
- `shotloom-draft-spec` stores planning artifacts under the Shotloom task key
  or records a compatibility fallback path in the task index.
- The task index is the single resume entry point for mixed old/new artifacts
  and names all compatibility fallback paths under `legacyArtifacts`.
- KSL active `SKILL.md` files remain short activation shells; long path rules do
  not move into active skill bodies.
- KC docs state that Shotloom task memory is Shotloom-owned, while generic KC
  finding reports remain KC-owned.
- The existing KC long-running work memory spec is updated or marked as
  compatibility-era for Shotloom task artifacts, so KC docs do not publish two
  competing storage contracts.
- Existing KC Shotloom output contracts are either preserved as compatibility
  shims or explicitly marked deprecated with a migration target.
- KC validators or doctor checks distinguish documented compatibility entries
  from new primary Shotloom storage entries, and reject new KC-owned primary
  Shotloom task memory after the migration marker exists.
- Repo-durable documents created from task output follow Shotloom's existing
  documentation standard; `docs/tasks/<task-key>/` is not created unless that
  convention is separately accepted by Shotloom.
- No historical artifact rewrite is required for the first implementation.
- Running the KSL and KC validators shows no source/copy/cache drift after
  materialization.

## Open Questions

- Should the Shotloom resolver live in the Shotloom repo itself, or in KSL as a
  temporary bridge until the Shotloom repo accepts it?
- Should Shotloom add a committed `.gitignore` rule for `.agent-local/`, or is a
  resolver-level `git check-ignore` refusal enough during the first pass?
- Should old KC-hosted `.agent-local/shotloom/**` artifacts be migrated lazily
  when a task is reopened, or left as historical records?

## Design Plan

### Inputs

- This spec.
- Current KC output and local artifact registries.
- Current KC long-running work memory decision contract.
- Current KSL start/prepare/draft/review/RCA flows.
- Shotloom repo `.gitignore`, docs layout, and existing `.agent-local` policy.
- Shotloom project-management and documentation-standard guidelines.
- Current plugin materialization and doctor scripts.

### Outputs

- Shotloom-owned task memory resolver and path documentation.
- KSL flow updates that call the resolver.
- KC compatibility/deprecation notes for Shotloom local artifact outputs.
- A documented durable-publication rule that keeps task execution state out of
  repo docs unless it becomes durable Shotloom truth.
- Validation evidence from KC, KSL, and Shotloom resolver smoke tests.

### Implementation Sequence

#### 1. Add Shotloom Task Memory Contract

Files:

- Shotloom repo: `docs/harness/agent-task-memory.md`,
  `docs/guidelines/agent-task-memory.md`, or the equivalent location selected
  by Shotloom's existing documentation standard.
- Shotloom repo: `.gitignore` if project-wide `.agent-local/` ignore is not
  already committed.

Changes:

- Document `.agent-local/shotloom/tasks/<task-key>/`.
- Define `activity.md`, `index.json`, and subdirectory meanings.
- Define durable-publication classification through Shotloom's existing docs
  model instead of a default `docs/tasks/<task-key>/` mirror.
- State that active issue status remains in Linear, PR flow remains in GitHub,
  and local task memory remains agent-local execution state.

Risk:

- If this lands only in KSL, Shotloom agents can still miss it when not using
  Knitten.
- If this creates a second repo task-tracking system, it conflicts with
  Shotloom's project-management model.

Proof:

- Shotloom docs path exists.
- The new doc links or cites the existing Shotloom project-management and
  documentation-standard rules.
- `.agent-local/` is ignored by a project-wide rule, or the resolver refusal is
  documented and tested.

#### 2. Add Resolver

Files:

- Preferred: Shotloom repo `scripts/agent-task-artifact.mjs`.
- Temporary bridge, only if Shotloom repo cannot be changed in the same pass:
  `knitten-sl/skills/shotloom-references/scripts/shotloom-task-artifact.mjs`.

Changes:

- Implement commands such as:
  - `resolve <task-key> activity`
  - `resolve <task-key> index`
  - `resolve <task-key> briefing <stamp>`
  - `append-activity <task-key> --kind <kind> --path <path> --summary <text>`
- Validate task keys and reject traversal.
- Resolve from a Shotloom worktree or explicit `--shotloom-root`.
- Resolve task keys from task metadata, Linear context, or explicit environment
  values; do not infer `stl-<N>` from branch naming.
- Refuse writes unless `.agent-local/` is ignored in that checkout.
- Create or update `index.json` using the required schema and keep full artifact
  bodies out of the index.
- Do not require Knitten.
- If the first pass uses the KSL bridge, keep the public command contract
  identical to the future Shotloom resolver and mark the bridge as temporary.

Risk:

- A resolver in KSL would continue plugin coupling. Prefer Shotloom repo when
  possible.
- A resolver that silently writes into a tracked directory can leak local task
  memory into commits.
- Branch-name based task-key discovery can fail because Shotloom branches are
  not required to contain `stl-<N>`.

Proof:

- Smoke tests create paths under a temporary Shotloom-like repo.
- Invalid task keys fail.
- A temporary repo without `.agent-local/` ignored fails before writing.
- Reopening a task resolves existing artifacts from `index.json`.
- A branch without an `stl-<N>` substring still resolves the task key when task
  metadata or explicit environment values provide it.

#### 3. Migrate KSL Writers

Files:

- `knitten-sl/skills/shotloom-start-task/flow.md`
- `knitten-sl/skills/shotloom-prepare-task/flow.md`
- `knitten-sl/skills/shotloom-draft-spec/flow.md`
- `knitten-sl/skills/shotloom-triad-rca/flow.md`
- `knitten-sl/skills/shotloom-review-before-pr/flow.md`

Changes:

- Replace direct KC output contract writes for Shotloom task memory with the
  Shotloom resolver.
- Keep KC output compatibility as fallback only when a migrated resolver is not
  available.
- Make `activity.md` and `index.json` the resume entry points.
- When fallback is used, record the old KC path under `legacyArtifacts` so the
  next run has one task index to inspect.
- Keep chat briefings compact; store full documents in task folders.

Risk:

- A mixed migration can split one task across old and new roots.

Proof:

- New prepare-task run writes all new task artifacts under one task folder.
- `index.json` records any compatibility fallback paths.
- Re-running prepare-task for the same task reads the existing index instead of
  creating a second root.

#### 4. Reclassify KC Shotloom Outputs

Files:

- `agent/config/outputs.json`
- `agent/config/local-artifact-paths.json`
- `SYSTEM.md`
- `docs/guidelines/plugin-boundary.md`
- `docs/specs/long-running-work-memory-decision-contract.md`
- `docs/specs/routing-registry-health-cleanup.md`
- `scripts/doctor.mjs`

Changes:

- Mark Shotloom output contracts as compatibility only.
- Add a deprecation target pointing to the Shotloom task memory resolver.
- Update or annotate the KC long-running work memory contract so its
  Shotloom-specific storage language is compatibility-era, not the future
  contract.
- Keep current contracts working during migration unless all KSL callers have
  moved.
- Add explicit metadata or validator allowlists that separate historical
  compatibility entries from new primary-storage entries.
- Ensure doctor permits documented compatibility but rejects new Shotloom
  primary storage entries in KC.

Risk:

- Removing compatibility too early can break installed caches or older sessions.

Proof:

- KC doctor passes.
- Old output ids still resolve or produce a documented migration message.
- KC docs no longer contain two active, contradictory Shotloom task-memory
  storage contracts.
- Adding a new KC-owned Shotloom task-memory entry without compatibility
  metadata fails validation.

#### 5. Slim KSL Workflow Loading

Files:

- KSL active `SKILL.md` files for task workflows.
- KSL `flow.md` files for start/prepare/draft/review paths.
- New or existing KSL scripts.

Changes:

- Keep active `SKILL.md` files as activation shells.
- Move deterministic path, worktree, and artifact plumbing into scripts.
- Replace long path-policy prose with short command contracts and examples.
- Keep domain judgment, approval gates, and stop conditions in the flow docs.

Risk:

- Over-scripting can hide important approval gates.

Proof:

- Active skill metadata remains small.
- Validator confirms Step 0 and activation gates remain present.
- A dry-run prepare path prints the task memory root and planned writes.

#### 6. Migration And Cleanup

Files:

- Optional migration report under Shotloom local task memory.
- KC/KSL docs that mention old locations.

Changes:

- Do not bulk-move historical artifacts by default.
- When reopening a task, write new artifacts to the Shotloom-owned root and add
  old KC artifact paths to `index.json` as `legacyArtifacts`.
- Do not promote task folders into repo docs by default; promote only selected
  durable knowledge into the appropriate Shotloom docs category.
- Delete large ignored temp files only by explicit cleanup request.

Risk:

- Historical context can appear split until reopened.

Proof:

- Reopened task index can point to both old and new artifact locations.

### Review Plan

- Contract: verify Shotloom task memory can function without Knitten installed.
- Boundary: verify KC no longer owns new Shotloom task memory locations.
- Docs model: verify local task memory does not become a second repo task
  tracker and durable publications follow Shotloom's documentation standard.
- Validation: verify existing KC/KSL validators pass and new resolver smoke
  tests prove path safety.
