---
description: Pre-write gate for Shotloom coding — Linear fetch, conventions re-read, category-targeted standard load, Ready briefing
argument-hint: "[STL-NN | linear-url | category]"
allowed-tools: Read, Glob, Grep, Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(grep:*), Bash(code:*), Bash(jq:*)
---

# shotloom-start-code

Mandatory pre-write flow before editing any Shotloom code. Auto-invoked by the `shotloom-linear-detect` hook when a Linear reference appears while cwd is under the `shotloom` repo (main checkout or any worktree under `.worktrees/` / `.claude/worktrees/`). Can also be invoked manually.

## Arguments

- `[STL-NN]` — Linear issue ID. Optional.
- `[linear-url]` — full Linear URL. Optional.
- `[category]` — one of `rust` / `ts` / `bridge` / `docs` / `test`. Optional; auto-detected if absent.

Zero args is valid — the skill will detect intent from current branch, `git status`, recent `git log`.

Usage: `/shotloom-start-code STL-123` or `/shotloom-start-code` or `/shotloom-start-code rust`

## Workflow

### Step 1: Pre-flight (MANDATORY — never skip)

Run in parallel:

```bash
gh auth status
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git log -1 --format="%an <%ae>"
git status --short
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
```

Verify:
- `git rev-parse --show-toplevel` matches `$shotloom_root`
- `gh` active user is `tomlim2`
- commit identity is `tomlim2 <deemo@vonvon.me>` (warn but don't block — first commit on branch may set it)
- if uncommitted changes exist, report and ask whether to stash/commit/proceed

**Hard stop on wrong repo or wrong gh user.**

### Step 2: Resolve Linear issue

Parse `$ARGUMENTS` for Linear signals: `STL-\d+`, linear.app URL, commit body `Related to STL-NN` on the current branch. Do **not** parse the branch name for an STL prefix — Shotloom branches use `feat/<description>` per `~/.claude/rules/shotloom.md` and never carry an STL ID. Linear's auto-suggested `deemo/stl-NN-…` shape is a Linear UI hint, not the canonical branch name.

If identifier found, fetch via `mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue`. Extract: problem statement, acceptance criteria, affected modules/crates, linked ADRs, linked specs.

If no identifier and no args, skip — rely on git state for category detection.

### Step 2.5: Create worktree for the Linear issue

Skip if the current branch already matches the Linear issue. Otherwise:

1. **Type prefix** from Linear title (`feat`/`fix`/`chore`/`refactor`/`docs`/`test`/`perf`/`build`/`ops`/`style`); `bug` label → `fix`; default → `feat`.
2. **Branch name** (repo rule: no STL-NN in branch): `<type>/<kebab-summary>`, summary from Linear title, max 50 chars, no trailing hyphen.
3. **Worktree base:** prefer `.worktrees/` if gitignored, else `<parent>/shotloom-worktrees/`. For Shotloom today this is `<shotloom>/.worktrees/`.
4. **Worktree dir name:** `<worktree_base>/stl-<NN>-<kebab-summary>` (STL-NN here for human clarity — this is a local path, not a branch).
5. **Create from latest `origin/main`:**
   ```bash
   cd "$shotloom_root"
   git fetch origin main
   git worktree add "<worktree_dir>" -b "<branch>" origin/main
   ```
   If worktree dir exists, report and stop. If branch exists, use without `-b`.
6. Ask user: open in VS Code? Default yes.
7. All subsequent steps operate **inside the worktree**.
8. **Auto-move Linear state** — if resolved issue is `Todo` or `Backlog`, invoke `/shotloom-linear-move <STL-NN> "In Progress"` silently.

See [reference.md](reference.md) for the branch-name derivation example and the full worktree-base detection script.

### Step 3: Re-read repo conventions (mandatory, every session)

Read in parallel:
- `AGENTS.md` (repo root) — workflow, ask-first matrix
- `CONTRIBUTING.md` — pre-commit, PR policy, branch naming
- `CLAUDE.md` (repo root) — hard rules
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

Per-category additions (still in-repo):

| Category | Additional reads |
|----------|------------------|
| `rust` | none beyond the always-load set |
| `ts` | `docs/guidelines/review-typescript.md` |
| `bridge` | `docs/ipc/bridge-contract.md` + `review-typescript.md` |
| `docs` | `docs/guidelines/documentation-standard.md` |
| `test` | (covered by `review-rust.md`) |
| `mixed` | everything |

In-repo Rust review SSOT:

- `docs/guidelines/review-rust.md` — formal Rust review spec. Walk this against the diff before push. Loaded by `/shotloom-review-before-pr`.

For Rust, also scan `docs/adr/` for ADRs relevant to the affected crate.

### Step 5b: Cross-check Linear AC against cited primitives (mandatory)

For each acceptance criterion in the Linear issue that cites a repo primitive — template, standard, rule, ADR section, in-repo guideline — open the primitive's actual file and confirm:

1. The cited section / clause exists at the named path.
2. The pattern the AC asks you to enforce is actually codified in that primitive.

If the cited pattern is **not codified** (template Usage Notes doesn't mention it; the rule file doesn't carry the constraint; the ADR section points elsewhere), the AC is **wrong-shape** — it asks you to enforce a standard that doesn't exist.

**Default response: reject the AC. Do NOT apply Option-A/B/C workarounds.** The right move is:

- Surface the AC ↔ primitive mismatch in the Step 6 Ready briefing as a separate bullet.
- Propose splitting the work: file a follow-up issue to *codify the cited pattern in the primitive* as its own PR, then revisit this AC after the primitive is updated.
- Do NOT smuggle the uncodified pattern into a single ADR / file in this PR. Single-file standard invention recreates the defect class the AC was trying to enforce against, and round 1 review will P2-Block it.

Trigger: PR #208 (STL-247) — AC #2 cited "ADR template Usage Notes canonical amendment style (`Accepted (amended YYYY-MM-DD)`)", but `docs/guidelines/adr-template.md` Usage Notes did not codify that form. The author noticed the gap at briefing time but applied "Option A" (use the form in this one ADR). Reviewer P2 Blocking forced revert. The right call at briefing time was to reject AC #2 and split.

### Step 6: Ready briefing

Emit the compact briefing (template in reference.md) showing issue, branch, standards loaded, ADRs, ask-first triggers, pre-write checklist, **plus the Step 5b AC ↔ primitive cross-check verdict for every AC that cited a primitive (codified ✓ / wrong-shape ✗ with proposed split)**. **Stop. Do NOT edit yet — wait for user confirmation.**

### Step 7: Mandatory post-write self-review (before any PR)

**HARD RULE — auto-trigger on push.** The instant `git push` completes, **immediately invoke `/shotloom-review-before-pr` in the same turn**, without asking the user first.

Do NOT:
- Ask "PR 열까요?" before running the review.
- Pause after reporting push result and wait for instruction.
- Jump from push → `/shotloom-make-pr` or `gh pr create` directly.

Fixed sequence: **gates pass → commit → push → `/shotloom-review-before-pr` (no approval needed) → report findings → ask user before PR**.

The review is also required before `/shotloom-make-pr`, `gh pr create`, or declaring "done" — even with no recent push.

Walks `docs/guidelines/review-rust.md` (in-repo formal Rust review spec; re-read every invocation). Fix every hit before opening PR.

**Skip only when:** branch contains zero Rust/TS source changes (docs/md/ADR-only), OR user explicitly says "skip review" for this specific PR.

Auto-commit/push cadence (per `~/.claude/rules/shotloom.md`) does NOT bypass the review — commits/push go out freely, but the review runs automatically right after, and the PR gate holds until review has passed.

## Binding rules

- **Never skip Step 1 pre-flight.** Wrong gh user or wrong repo = hard stop.
- **Never skip Step 3 re-read.** Stale memory is the #1 cause of CHANGES_REQUESTED.
- **Never open a PR without running `/shotloom-review-before-pr` first** (Step 7). Applies to every PR touching Rust or TS source, even under the auto-commit/push exemption.
- If Linear MCP fetch fails, report the error but continue — use branch/commit hints.
- The Ready briefing is the **only** output at Step 6. No code, no plan, no extra prose until user confirms.
- If user says "skip pre-flight" / "already did this", log the decision and skip Step 3 only — never skip Step 1. Step 7 review opt-out ("skip review") must be stated explicitly per-PR.

## Related

- Hook: `~/.claude/hooks/shotloom-linear-detect.sh` (auto-invoker)
- `~/.claude/rules/shotloom.md` — hub
- in-repo `docs/guidelines/*` — writing rules (authoritative)
- in-repo `docs/guidelines/review-rust.md` — formal Rust review SSOT for pre-PR self-review
- `~/.claude/rules/shotloom.md` — Claude-side PR gates / auto-commit policy

## Additional Resources

For the worktree-base detection script, branch-name derivation example, and the Ready-briefing template, see [reference.md](reference.md).
