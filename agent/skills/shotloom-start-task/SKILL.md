---
description: Pre-write gate for Shotloom coding - Linear fetch, worktree setup, convention re-read, persisted briefing, spec-risk handoff
argument-hint: "[STL-NN | linear-url | category]"
allowed-tools: Read, Write, Glob, Grep, Bash(bash:*), Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(rg:*), Bash(test:*)
---

# shotloom-start-task

Mandatory pre-write flow before editing Shotloom code. Auto-invoked by the
`shotloom-linear-detect` hook when a Linear reference appears while cwd is
inside the Shotloom main checkout or a Shotloom worktree.

## Arguments

- `[STL-NN]` — Linear issue ID. Optional.
- `[linear-url]` — full Linear URL. Optional.
- `[category]` — one of `rust` / `ts` / `bridge` / `docs` / `test`. Optional; auto-detected if absent.

Zero args is valid — the skill will detect intent from current branch, `git status`, recent `git log`.

Usage: `/shotloom-start-task STL-123` or `/shotloom-start-task` or `/shotloom-start-task rust`

## Workflow

### Step 1: Pre-flight (MANDATORY — never skip)

Run in parallel:

```bash
gh auth status
git rev-parse --show-toplevel
git rev-parse --git-common-dir
git rev-parse --abbrev-ref HEAD
git log -1 --format="%an <%ae>"
git status --short
git remote get-url origin
bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo shotloom
```

Verify:
- The resolver returns the Shotloom main checkout path.
- The cwd is Shotloom if one condition is true:
  - `git rev-parse --show-toplevel` equals the resolved checkout path.
  - `git rev-parse --git-common-dir` resolves to `<shotloom_root>/.git`.
  - `origin` matches `CINEV/shotloom` or `github.com/CINEV/shotloom`.
- `gh` active user is `tomlim2`
- commit identity is `tomlim2 <deemo@vonvon.me>` (warn but don't block — first commit on branch can set it)
- if uncommitted changes exist, report and ask whether to stash/commit/proceed

**Hard stop on wrong repo or wrong gh user.**

### Step 2: Resolve Linear issue

Parse `$ARGUMENTS` for Linear signals: `STL-\d+`, linear.app URL, commit body
`Related to STL-NN` on the current branch. Do **not** parse the branch name for
an STL prefix — Shotloom branches use `feat/<description>` per
`~/.claude/rules/shotloom.md` and never carry an STL ID.

If an identifier is found, use the currently available Linear connector to
fetch the issue. If no Linear `get_issue` tool is visible, discover it with a
tool search for `Linear get_issue`; MCP server names vary by harness and must
not be hard-coded. Extract: problem statement, acceptance criteria, affected
modules/crates, linked ADRs, linked specs.

Also extract the **intent lens**:
- What failure mode is the issue trying to prevent?
- Which AC lines are verification examples or current-branch notes rather than
  required implementation primitives?
- Did the user clarify the intent in chat? If yes, prefer that clarification
  over a literal AC reading and quote it in the Ready briefing.

Do not turn an AC's incidental workflow wording into a blocker when the stated
problem can be proved on `origin/main` with an equivalent or stronger
verification. Example: if an AC says `spawn -> clear -> spawn` but the issue
intent is GPU asset leak prevention and `clear` belongs to a sibling issue,
seed a spec question for stable asset counts after repeated spawn batches
instead of blocking the task on the absent clear command.

If no identifier is found, skip Step 2.5 and rely on git state for category
detection.

### Step 2.5: Create worktree for the Linear issue

Skip this step if no Linear issue was resolved. Before deriving a branch, read
`CONTRIBUTING.md` Branch Naming Policy and `~/.claude/rules/shotloom.md`
Worktree dir naming.

Derive the canonical branch from the Linear title. If the current branch equals
that derived branch, stay in the current checkout or worktree. Otherwise:

1. Derive branch as `<type>/<scope>-<verb>-<subject>`, max 50 chars, no
   Linear ID. See `reference.md` for derivation rules.
2. Derive worktree dir as `<worktree_base>/<scope>-<verb>-<subject>`, no
   Linear ID. Prefer `<shotloom>/.worktrees/` if gitignored.
3. Create from latest `origin/main`; if the dir exists, report and stop. If
   the branch exists, use the existing branch. Commands: `reference.md`.
4. All subsequent steps operate **inside the worktree**.
5. **Auto-move Linear state** — if the issue is `Todo` or `Backlog`, move it to
   `In Progress` with the available Linear connector. If the connector is
   unavailable, report and continue.

See [reference.md](reference.md) for the branch-name derivation example and the full worktree-base detection script.

### Step 3: Re-read repo conventions (mandatory, every session)

Read in parallel:
- `AGENTS.md` (repo root) — workflow, ask-first matrix
- `CONTRIBUTING.md` — pre-commit, PR policy, branch naming
- Repo entry documents (`AGENTS.md`, `CLAUDE.md` when present) — hard rules
- `docs/adr/README.md` — ADR index (note any "Proposed" entries)
- `.agent/working-rules.md` and `.agent/checklists.md` if present

List filenames under `docs/guidelines/` and mention which apply to the inferred category.

### Step 4: Detect work category

Classify as `rust` / `ts` / `bridge` / `docs` / `test` / `mixed`. Priority:
1. Explicit `$ARGUMENTS` category
2. Linear "Affected modules" / labels
3. `git diff --name-only main...HEAD` file-type distribution
4. Branch name hint
5. Ask user if ambiguous

### Step 5: Load targeted standards (in-repo authoritative)

Always load from the shotloom repo:

- `docs/guidelines/error-handling.md` — typed error discipline
- `docs/guidelines/review-rust.md` — panic / unwrap / unsafe / ECS / WASM rules
- `docs/guidelines/commit-guideline.md` — conventional commits format
- `docs/guidelines/pr-guideline.md` — PR title / body / review-reply policy
- `CONTRIBUTING.md` — repo language, branch naming, pre-commit hooks

Per-category additions: `ts` loads `review-typescript.md`; `bridge` loads
`docs/ipc/bridge-contract.md` and `review-typescript.md`; `docs` loads
`documentation-standard.md`; `mixed` loads all of them. For Rust, scan
`docs/adr/` for ADRs relevant to the affected crate.

### Step 5b: Cross-check Linear AC against cited primitives (mandatory)

For each AC that cites a repo primitive, open the primitive and confirm the
cited section and pattern exist. If the primitive does not codify the pattern,
mark the AC `wrong-shape`, reject that AC in the briefing, and propose a
separate primitive-codification issue. Do not apply one-file workarounds. See
`reference.md` for the PR #208/STL-247 precedent.

If an AC cites a workflow step whose primitive is absent, classify it before
rejecting:

| Classification | Action |
|---|---|
| Required primitive | `wrong-shape`; propose split/codification before implementation. |
| Verification example | Keep task viable; seed an equivalent stronger proof in Step 5c. |
| Sibling-owned primitive | Mark ask-first only if implementation would need to edit that sibling surface. Otherwise keep it out of scope and state the sibling owner. |

Use the issue problem statement and user clarifications to decide the row.

### Step 5c: Seed the spec-validation loop (mandatory)

Before the Ready briefing, run targeted `rg` searches for identifiers named by
Linear, branch, AC, or affected modules. Search examples: `reference.md`.

Read only matching definitions needed for the briefing. Record P1/P2/P3 seeds
with evidence, exact spec question, and AC/ADR/precedent trace. Each seed must
target the future spec contract: requirements, locked decisions, non-goals,
implementation stages, verification, or traps. If a seed lacks that trace, move
it to follow-up notes. If a seed implies scope change, mark it as ask-first.
Full taxonomy: `reference.md`.

Include at least one intent-preserving verification seed when the literal AC
mentions a sibling-owned or absent workflow step but the failure mode can still
be proved on the current base. The seed must name the original AC wording, the
intent lens, the proposed equivalent proof, and the sibling issue if any.

When the task can mutate coupled representations of one artifact, always add a
spec-risk seed for atomicity. Examples: JSON + BIN, model + cache artifact,
state + event, serialized bundle + index, thumbnail bytes + manifest. The seed
asks whether the spec pre-validates every later write before the first mutation,
rolls back on partial failure, or proves partial persistence impossible.

### Step 5d: Sibling spec scan (mandatory)

Before the Ready briefing, scan `agent-hub/docs/plans/` and `agent-hub/docs/`
for sibling spec artifacts whose slug overlaps the work at hand. Commands:
`reference.md`.

Read every match in full with the Read tool. Record slug, status, stance, and
disagreement signal. If zero siblings are found, write `Sibling specs: none
found`.

### Step 6: Write Ready Briefing — END OF THIS SKILL

Resolve the task slug from the created/current branch body after `<type>/`.
Write the compact briefing to
`$agent_hub/docs/briefings/shotloom/<slug>.md` using the template in
`reference.md`. Create the directory if absent.

The briefing must show issue, branch, standards loaded, ADRs, ask-first
triggers, pre-write checklist, **plus the intent lens**, **the Step 5b
AC-to-primitive cross-check verdict for every AC that cited a primitive
(codified / wrong-shape / verification-example / sibling-owned)**, the Step 5c
spec-risk handoff, and the Step 5d sibling-spec inventory.

Emit the same briefing content in chat plus the briefing path.

After the briefing, **end the turn**. Do NOT edit code. Do NOT write a task spec
doc inside this skill. Do NOT commit yet; `/shotloom-draft-spec` commits the
briefing and spec together only after a clean direct spec lands, then runs the
spec review gate in the same workflow.

Tell the user explicitly what comes next:

> "Briefing OK → 다음 단계는 `/shotloom-draft-spec` (브리핑 문서 기반 스펙 작성 + 스펙 리뷰 + 브리핑/스펙 커밋/푸시). 마지막에는 스펙문서를 공유하고 구현할지 물어봅니다."
> "구현이 끝나고 커밋/푸시한 뒤 PR을 만들기 전에는
> `/shotloom-review-before-pr`를 실행해야 합니다. `/shotloom-make-pr`는
> 이 리뷰가 아직 안 돌았다면 먼저 트리거하거나, 트리거할 수 없는
> 환경에서는 실행하라고 멈춰야 합니다."

**Spec ↔ implementation are two distinct gates.** Task-spec authoring is
delegated to [`/shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md), which
writes `agent-hub/docs/plans/proposed/<slug>.md`, runs the review loop,
commits/pushes from agent-hub, shares the final spec path, then asks whether to
implement. It reads `agent-hub/docs/briefings/shotloom/<slug>.md` first and
commits that briefing with the spec. Implementation begins only after a
separate user message such as "구현 시작", "implement", or "go".

This skill (`/shotloom-start-task`) NEVER:
- Writes the task spec doc itself.
- Reads worktree source files for the full file-map section (that belongs in
  `/shotloom-draft-spec`'s spec-authoring phase). Targeted definition
  reads for the Step 5c spec-risk handoff are allowed.
- Edits any code in the worktree.

## Binding rules

- **Never skip Step 1 pre-flight.** Wrong gh user or wrong repo = hard stop.
- **Never skip Step 3 re-read.** Stale memory is the #1 cause of CHANGES_REQUESTED.
- **Never skip Step 5c spec-risk handoff.** The task-spec authoring skill needs
  seeded P1/P2 questions before it validates the spec contract.
- **Never open a PR without running `/shotloom-review-before-pr` first.** The
  persistent push/PR rule lives in `~/.claude/rules/shotloom.md`.
- If Linear MCP fetch fails, report the error but continue — use branch/commit hints.
- The Ready briefing markdown file and matching chat briefing are the **only**
  outputs at Step 6. No code, no spec, no extra prose until user confirms.
- If user says "skip pre-flight" / "already did this", log the decision and skip Step 3 only — never skip Step 1.

## Additional Resources

For the worktree-base detection script, branch-name derivation example, and the Ready-briefing template, see [reference.md](reference.md).
