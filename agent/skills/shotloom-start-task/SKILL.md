---
description: Pre-write gate for Shotloom coding - Linear fetch, worktree setup, convention re-read, persisted briefing, spec-risk handoff
argument-hint: "[STL-NN | linear-url | category]"
allowed-tools: Read, Write, Glob, Grep, Bash(bash:*), Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(rg:*), Bash(test:*)
context-rules: rules/shotloom-docs-lane.md
---

# shotloom-start-task

Mandatory pre-write flow before editing Shotloom code.

## Arguments

Accepts optional `STL-NN`, Linear URL, or category (`rust` / `ts` / `bridge` /
`docs` / `test`). Zero args is valid; detect intent from current branch,
`git status`, and recent `git log`.

## Workflow

### Step 1: Pre-flight (MANDATORY — never skip)

Run:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
node "$knitten_root/agent/lib/shotloom-preflight.mjs" --allow-dirty
```

Machine contract: exit `0` means pass; nonzero means stop. For structured
output, add `--print-json` and read `ok: true|false`.

**Hard stop on wrong repo or wrong gh user.**
If dirty, report the dirty paths and offer stash / commit / proceed choices.
Warn when git identity differs from `tomlim2 <deemo@vonvon.me>`.

### Step 2: Resolve Linear issue

Parse `$ARGUMENTS` for Linear signals: `STL-\d+`, linear.app URL, commit body
`Related to STL-NN` on the current branch. Do **not** parse the branch name for
an STL prefix — Shotloom branches use `feat/<description>` per
`CONTRIBUTING.md` and never carry an STL ID.

If an identifier is found, use the currently available Linear connector to
fetch the issue. If no Linear `get_issue` tool is visible, discover it with a
tool search for `Linear get_issue`; MCP server names vary by harness and must
not be hard-coded. Extract: problem statement, acceptance criteria, affected
modules/crates, linked ADRs, linked specs, and the intent lens.

Intent lens = failure mode to prevent, AC lines that are verification examples
rather than primitives, and user clarification that overrides literal AC text.
Apply the intent-vs-literal precedent in `reference.md`.

If no identifier is found, skip Step 2.5 and rely on git state for category
detection.

### Step 2.5: Create worktree for the Linear issue

Skip this step if no Linear issue was resolved. Before deriving a branch, read
`CONTRIBUTING.md` Branch Naming Policy.

Derive the canonical branch from the Linear title. If the current branch equals
that derived branch, stay in the current checkout or worktree. Otherwise create
`<type>/<scope>-<verb>-<subject>` from `origin/main` in the worktree base from
`reference.md`. Branch and directory names must not include Linear IDs. If the
directory exists, report and stop; if the branch exists, use it.

All subsequent steps operate inside the worktree. If the issue is `Todo` or
`Backlog`, move it to `In Progress` with Linear; if unavailable, report and
continue.

See [reference.md](reference.md) for the branch-name derivation example and the full worktree-base detection script.

### Step 3: Re-read repo conventions (mandatory, every session)

Read in parallel: repo `AGENTS.md`, `CONTRIBUTING.md`,
`docs/adr/README.md`, `.agent/working-rules.md` if present, and
`.agent/checklists.md` if present.

List filenames under `docs/guidelines/` and mention which apply to the inferred category.

### Step 4: Detect work category

Classify as `rust` / `ts` / `bridge` / `docs` / `test` / `mixed`. Priority:
1. Explicit `$ARGUMENTS` category
2. Linear "Affected modules" / labels
3. `git diff --name-only origin/main...HEAD` file-type distribution
4. Branch name hint
5. Ask user if ambiguous

### Step 5: Load targeted standards (in-repo authoritative)

Always load from the shotloom repo: `CONTRIBUTING.md`,
`docs/guidelines/error-handling.md`, `review-rust.md`,
`commit-guideline.md`, and `pr-guideline.md`.

Category additions: `ts` -> `review-typescript.md`; `bridge` ->
`docs/ipc/bridge-contract.md` + `review-typescript.md`; `docs` ->
`documentation-standard.md`; `mixed` -> all category additions. For Rust, scan
`docs/adr/` for ADRs relevant to the affected crate.

### Step 5b: Cross-check Linear AC against cited primitives (mandatory)

For each AC that cites a repo primitive, open that primitive and classify the AC
as `codified`, `wrong-shape`, `verification-example`, or `sibling-owned`.
`wrong-shape` means propose primitive codification before implementation; do
not apply a one-file workaround. Use `reference.md` precedents and the issue
intent lens to decide the row.

### Step 5c: Seed the spec-validation loop (mandatory)

Run targeted `rg` searches for identifiers named by Linear, branch, AC, or
affected modules. Read only matching definitions needed for the briefing.
Record P1/P2/P3 seeds only when they have evidence, an exact spec question, and
AC/ADR/precedent trace. Move untraced notes to follow-up notes. Mark scope
changes ask-first. Taxonomy and search examples: `reference.md`.

Always seed intent-preserving verification for sibling-owned or absent workflow
steps when the failure mode can be proved another way. Always seed atomicity for
coupled artifacts, such as JSON + BIN, state + event, or cache + manifest.

### Step 5d: Sibling spec scan in Knitten (mandatory)

Before the Ready briefing, resolve Knitten with `repo knitten`, then scan
current and recently deleted `docs/plans/` + `docs/briefings/shotloom/` paths
for sibling artifacts whose slug overlaps the work. Commands: `reference.md`.

Read every match in full with the Read tool. Record slug, status, stance, and
disagreement signal. If zero siblings are found, write `Sibling specs: none
found`.

### Step 6: Write Ready Briefing

Resolve the task slug from the Linear title, the derived branch, or the current
branch body after `<type>/`. If no Linear issue was resolved and the current
branch is not `<type>/<slug>`, ask for an STL ID or slug and stop before writing.
Before writing, switch Knitten to the daily Shotloom docs lane defined in
`agent/rules/shotloom-docs-lane.md`:

```text
codex/YYYYMMDD-shotloom-docs
```

Use an existing local branch or remote branch for the current KST date. Create
the branch from `origin/main` only when no branch exists. If the primary
Knitten checkout is busy, use the matching worktree:

```text
../knitten-worktrees/YYYYMMDD-shotloom-docs
```

Write the compact briefing to
`$knitten/docs/briefings/shotloom/<slug>.md` using the template in
`reference.md`. Resolve `$knitten` with
`ah-resolve-doc-path repo knitten`. Create the directory if absent.

The briefing must show issue, branch, standards loaded, ADRs, ask-first
triggers, pre-write checklist, intent lens, AC-to-primitive verdicts, spec-risk
handoff, and sibling-spec inventory.

Emit the same briefing content in chat plus the briefing path.

After the briefing, stop this skill. When invoked standalone, **end the turn**.
When invoked by `/shotloom-prepare-task`, return the briefing path, slug, and
ask-first triggers to the orchestrator. Do NOT edit code. Do NOT write a task
spec doc inside this skill. Do NOT commit yet; `/shotloom-draft-spec` commits
the briefing and spec together only after a clean direct spec lands, then runs
the spec review gate in the same workflow.

Tell the user explicitly what comes next:

> "Briefing OK → 다음 단계는 `/shotloom-draft-spec`입니다. 스펙 작성/리뷰,
> 브리핑/스펙 커밋/푸시 후 구현할지 물어봅니다."
> "구현 후 PR 전에는 `/shotloom-review-before-pr`가 먼저 돌아야 합니다."
> "한 번에 준비를 끝내려면 `/shotloom-prepare-task`를 사용합니다."

**Spec ↔ implementation are two distinct gates.** `/shotloom-draft-spec` reads
the briefing, writes `docs/plans/proposed/<slug>.md`, reviews it, commits and
pushes briefing + spec, shares the spec path, then asks whether to implement.
Implementation begins only after a separate user message such as "구현 시작",
"implement", or "go".

This skill (`/shotloom-start-task`) NEVER:
- Writes the task spec doc itself.
- Reads source files for the full file-map section; targeted Step 5c reads are allowed.
- Edits any code in the worktree.

## Binding rules

- **Never skip Step 1 pre-flight.** Wrong gh user or wrong repo = hard stop.
- **Never skip Step 3 re-read.** Stale memory is the #1 cause of CHANGES_REQUESTED.
- **Never skip Step 5c spec-risk handoff.** The task-spec authoring skill needs
  seeded P1/P2 questions before it validates the spec contract.
- **Never open a PR without `/shotloom-review-before-pr` first.**
- If Linear MCP fetch fails, report the error and continue from branch/commit hints.
- Step 6 outputs only the briefing file and matching chat briefing.
- Every Ready briefing uses the daily Shotloom docs branch, not a per-STL branch.
- If user says "skip pre-flight" / "already did this", skip Step 3 only; never skip Step 1.

## Additional Resources

For the worktree-base detection script, branch-name derivation example, and the Ready-briefing template, see [reference.md](reference.md).
