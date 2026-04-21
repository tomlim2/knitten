---
description: Pre-write gate for Shotloom coding — Linear fetch, conventions re-read, category-targeted standard load, Ready briefing
argument-hint: "[STL-NN | linear-url | category]"
allowed-tools: Read, Glob, Grep, Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(code:*)
---

# shotloom-start-code

Mandatory pre-write flow before editing any Shotloom code. Auto-invoked by the `shotloom-linear-detect` hook when a Linear reference appears while cwd is under `shotloom-github`. Can also be invoked manually.

## Arguments

- `[STL-NN]` — Linear issue ID (e.g. `STL-123`). Optional.
- `[linear-url]` — full Linear URL. Optional.
- `[category]` — one of `rust` / `ts` / `bridge` / `docs` / `test`. Optional; auto-detected if absent.

Zero args is valid — the skill will detect intent from current branch, `git status`, and recent `git log`.

Usage: `/shotloom-start-code STL-123` or `/shotloom-start-code` or `/shotloom-start-code rust`

## Workflow

### Step 1: Pre-flight

Run in parallel (single message):

```bash
gh auth status
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git log -1 --format="%an <%ae>"
git status --short
```

Resolve the expected shotloom repo path from `~/.claude/private/caol-config/repo-paths.json`:

```bash
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
```

Verify:
- `git rev-parse --show-toplevel` matches `$shotloom_root`
- `gh` active user is `tomlim2`
- commit identity is `tomlim2 <deemo@vonvon.me>` (warn but don't block — first commit on branch may set it)
- if uncommitted changes exist, report them and ask whether to stash/commit/proceed

Stop on hard failures (wrong repo, wrong gh user).

### Step 2: Resolve Linear issue

Parse `$ARGUMENTS` for Linear signals:
- `STL-\d+` → issue identifier
- `linear.app/.../issue/STL-\d+` → extract identifier
- Current branch prefix `feat/stl-NN-…` or commit body `Related to STL-NN` → fallback

If identifier found, fetch via Linear MCP:

```
mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue  (id: "STL-NN")
```

(Fetch the schema first if needed: `ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue"`.)

Extract from issue body:
- Problem statement
- Acceptance criteria
- Affected modules / crates
- Linked ADRs
- Linked specs

If no identifier and no args, skip — rely on git state for category detection.

### Step 2.5: Create worktree for the Linear issue

**Skip** if the current branch already matches the Linear issue (e.g., user is resuming work on an existing branch/worktree — detect via commit body `Related to STL-NN` or branch name).

Otherwise:

1. Determine **type** prefix from Linear issue:
   - Title starts with `feat(...)`, `fix(...)`, `chore(...)`, `refactor(...)`, `docs(...)`, `test(...)`, `perf(...)`, `build(...)`, `ops(...)`, `style(...)` → use that type
   - Labels contain `bug` → `fix`
   - Otherwise → **default `feat`**

2. Build **branch name** (repo rule: no STL-NN in branch):
   ```
   <type>/<kebab-summary>
   ```
   - `<kebab-summary>` derived from Linear title: strip type prefix, translate Korean to English if needed, lowercase, hyphens, max 50 chars, no trailing hyphen
   - Example: Linear title `feat(retarget): ARP 스켈레톤 표준 적용` → branch `feat/arp-skeleton-standard`

3. Determine **worktree base** directory:
   ```bash
   repo_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
   if grep -qE '^\.?worktrees/?$' "$repo_root/.gitignore" 2>/dev/null; then
     # prefer the convention already in .gitignore
     entry=$(grep -oE '^\.?worktrees/?' "$repo_root/.gitignore" | head -1 | tr -d '/')
     worktree_base="$repo_root/$entry"
   else
     worktree_base="$(dirname "$repo_root")/shotloom-worktrees"
     mkdir -p "$worktree_base"
   fi
   ```
   For Shotloom today this resolves to `<shotloom>/.worktrees/`.

4. Build **worktree directory name** (STL-NN included for human clarity — this is a local path, not a branch):
   ```
   <worktree_base>/stl-<NN>-<kebab-summary>
   ```
   Example: `.worktrees/stl-99-arp-skeleton-standard/`

5. Create worktree from latest `origin/main`:
   ```bash
   cd "$repo_root"
   git fetch origin main
   git worktree add "<worktree_dir>" -b "<branch>" origin/main
   ```
   If the branch already exists locally, use `git worktree add "<worktree_dir>" "<branch>"` instead. If the worktree dir already exists, report and stop — do not overwrite.

6. Report:
   ```
   Worktree: <worktree_dir>
   Branch:   <branch>  (from origin/main)
   ```
   Ask the user: open in VS Code? (`code <worktree_dir>`). Default: yes.

7. From here on, **all subsequent steps operate inside the worktree**. Update internal cwd reference.

8. **Auto-move Linear state** — if a Linear issue ID was resolved in Step 2 AND its current state is `Todo` or `Backlog`, invoke `/shotloom-linear-move <STL-NN> "In Progress"` silently (pre-approved per auto-caller list in that skill). Skip if already In Progress / In Review / Done.

### Step 3: Re-read repo conventions (mandatory, every session)

Read in parallel:
- `AGENTS.md` (repo root) — workflow, ask-first matrix
- `CONTRIBUTING.md` — pre-commit, PR policy, branch naming
- `CLAUDE.md` (repo root) — hard rules
- `docs/adr/README.md` — ADR index (note any "Proposed" entries)
- `.agent/working-rules.md` and `.agent/checklists.md` if present

List any filename under `docs/guidelines/` and mention which ones apply to the inferred category.

### Step 4: Detect work category

Classify the task into one of: `rust` / `ts` / `bridge` / `docs` / `test` / `mixed`.

Inputs (in priority order):
1. Explicit `$ARGUMENTS` category
2. Linear issue "Affected modules" or labels (from Step 2)
3. `git diff --name-only main...HEAD` file-type distribution
4. Current branch name hint (`feat/rust-*`, `feat/ui-*`, etc.)
5. Ask user if ambiguous

### Step 5: Load targeted standards

Always load:
- `~/.claude/standards/shotloom-programming.md` — §1 (error handling), §2 (panics), §14 (git/commits), §15 (language)

Add per category:

| Category | Additional sections |
|----------|---------------------|
| `rust` | §1–§8 all |
| `ts` | §9, §5 (bridge serde), §10 (architecture) |
| `bridge` | §5, §6, §9, §10 — plus re-read `docs/ipc/bridge-contract.md` |
| `docs` | §12 — plus re-read `docs/guidelines/documentation-standard.md` |
| `test` | §13, §11 (determinism) |
| `mixed` | load everything |

For Rust tasks also scan `docs/adr/` for ADRs relevant to the affected crate (`grep -l` on crate name).

### Step 6: Ready briefing

Emit a single compact briefing:

```
### Shotloom coding mode — <category>

**Issue:** STL-NN "<title>"
  Problem: <one-line>
  Acceptance: <bulleted>
  Affected: <crate/module list>
  Linked: <ADR-XXXX, spec-YYY>

**Branch:** <current-branch>  (base: <base>)  <N> commits ahead, <clean|N dirty files>

**Standards loaded:** programming.md §<list>, review-code-rust.md (ready on pre-PR)
**ADRs to honor:** <list>
**Ask-first triggers for this task:** <filtered from §16>

**Pre-write checklist passed:**
- [x] gh auth: tomlim2
- [x] commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: <category>
- [x] targeted sections loaded

Ready. State the first code change you plan to make.
```

Stop here. Do NOT start editing yet — wait for user confirmation or an explicit request to proceed.

### Step 7: Mandatory post-write self-review (before any PR)

This skill owns the **full writing lifecycle** for a Shotloom Linear issue, not just the kickoff briefing.

**HARD RULE — auto-trigger on push:** the instant `git push` for this branch completes successfully (whether after a single commit or a batch), **immediately invoke `/shotloom-review-before-pr` in the same turn**, without asking the user first. Do NOT:

- Ask "PR 열까요?" or "review 돌릴까요?" before running the review.
- Pause after reporting the push result and wait for user instruction.
- Jump from push → `/shotloom-make-pr` (or `gh pr create`) directly.

The sequence is fixed: **gates pass → commit → push → `/shotloom-review-before-pr` (no approval needed) → report findings → ask user before PR**.

The review is also required — still with no pre-approval — before any of these, even if no push just happened:

- `/shotloom-make-pr` (opening the PR)
- `gh pr create` directly
- Declaring the task "done" to the user

The review walks `~/.claude/standards/review-code-rust.md` (22 patterns, groups A–F) against the branch diff and reports any hits. Fix every hit before opening the PR. If the review surfaces nothing, then ask the user whether to proceed to `/shotloom-make-pr`.

Skip the post-write review only when:
- The branch contains ZERO Rust/TS source changes (docs-only, `.md`-only, ADR-only).
- The user explicitly says "skip review" for this specific PR.

Otherwise it is mandatory. Do not let an auto-commit/push cadence (per `rules/shotloom-git.md`) bypass the review — commits + push go out freely, but the review runs automatically right after, and the PR gate holds until review has passed.

## Binding rules

- Never skip Step 1 pre-flight. Wrong gh user or wrong repo = hard stop.
- Never skip Step 3 re-read. Stale memory is the #1 cause of CHANGES_REQUESTED on Shotloom PRs (per `rules/conventions.md`).
- **Never open a PR without running `/shotloom-review-before-pr` first** (Step 7). Applies to every PR touching Rust or TS source, even under the shotloom auto-commit/push exemption.
- If Linear MCP fetch fails (auth, 404), report the error but continue — use branch/commit hints.
- The Ready briefing is the **only** output at Step 6. No code, no plan, no extra prose until user confirms.
- If the user explicitly says "skip pre-flight" or "i already did this", log that decision and skip Step 3 only — never skip Step 1. Step 7 review is a separate opt-out ("skip review") and must be stated explicitly per-PR.

## Related

- Hook: `~/.claude/hooks/shotloom-linear-detect.sh` (auto-invoker)
- [`~/.claude/rules/shotloom.md`](../../rules/shotloom.md) — hub
- [`~/.claude/standards/shotloom-programming.md`](../../standards/shotloom-programming.md) — writing rules
- [`~/.claude/standards/review-code-rust.md`](../../standards/review-code-rust.md) — review patterns
- [`~/.claude/rules/shotloom-git.md`](../../rules/shotloom-git.md) — PR gates
