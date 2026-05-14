---
description: Pre-write gate for Shotloom coding - Linear fetch, worktree setup, convention re-read, plan-risk handoff, Ready briefing
argument-hint: "[STL-NN | linear-url | category]"
allowed-tools: Read, Glob, Grep, Bash(bash:*), Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(rg:*), Bash(test:*)
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
bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo shotloom
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

### Step 5c: Seed the plan-review loop (mandatory)

Before the Ready briefing, run targeted `rg` searches for identifiers named by
Linear, branch, AC, or affected modules. Search examples: `reference.md`.

Read only matching definitions needed for the briefing. Record P1/P2/P3 seeds
with evidence, exact plan question, and AC/ADR/precedent trace. If a seed lacks
that trace, move it to follow-up notes. If a seed implies scope change, mark it
as ask-first. Full taxonomy: `reference.md`.

### Step 5d: Sibling-draft scan (mandatory)

Before the Ready briefing, scan `caol-ila/docs/plans/` and `caol-ila/docs/`
for sibling plan artifacts whose slug overlaps the work at hand. Commands:
`reference.md`.

Read every match in full with the Read tool. Record slug, status, stance, and
disagreement signal. If zero siblings are found, write `Sibling drafts: none
found`.

### Step 6: Ready briefing — END OF THIS SKILL

Emit the compact briefing (template in reference.md) showing issue, branch, standards loaded, ADRs, ask-first triggers, pre-write checklist, **plus the Step 5b AC-to-primitive cross-check verdict for every AC that cited a primitive (codified / wrong-shape with proposed split)**, the Step 5c plan-risk handoff, and the Step 5d sibling-draft inventory.

After the briefing, **end the turn**. Do NOT edit code. Do NOT write a plan doc inside this skill. The Ready briefing is the only output.

Tell the user explicitly what comes next:

> "Briefing OK → 다음 단계는 `/shotloom-draft-task-plan` (플랜 문서 작성 + 커밋/푸시 후 정지). 구현은 플랜 검토가 끝나고 별도 지시 후 시작."

**Plan ↔ implementation are two distinct gates.** Plan-doc authoring is
delegated to [`/shotloom-draft-task-plan`](../shotloom-draft-task-plan/SKILL.md),
which writes `caol-ila/docs/plans/<slug>.md`, commits/pushes from caol-ila,
then stops. Implementation begins only after a separate user message such as
"구현 시작", "implement", or "go".

This skill (`/shotloom-start-task`) NEVER:
- Writes the plan doc itself.
- Reads worktree source files for the full file-map section (that belongs in
  `/shotloom-draft-task-plan`'s draft phase). Targeted definition reads for the
  Step 5c plan-risk handoff are allowed.
- Edits any code in the worktree.

## Binding rules

- **Never skip Step 1 pre-flight.** Wrong gh user or wrong repo = hard stop.
- **Never skip Step 3 re-read.** Stale memory is the #1 cause of CHANGES_REQUESTED.
- **Never skip Step 5c plan-risk handoff.** The draft-plan skill needs seeded
  P1/P2 questions before it starts its own review loop.
- **Never open a PR without running `/shotloom-review-before-pr` first.** The
  persistent push/PR rule lives in `~/.claude/rules/shotloom.md`.
- If Linear MCP fetch fails, report the error but continue — use branch/commit hints.
- The Ready briefing is the **only** output at Step 6. No code, no plan, no extra prose until user confirms.
- If user says "skip pre-flight" / "already did this", log the decision and skip Step 3 only — never skip Step 1.

## Additional Resources

For the worktree-base detection script, branch-name derivation example, and the Ready-briefing template, see [reference.md](reference.md).
