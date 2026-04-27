---
description: Pre-PR self-review for Shotloom Rust changes. Walks the in-repo formal Rust review spec (docs/guidelines/review-rust.md) against the current diff and reports defects locally before pushing. Does NOT create a PR.
allowed-tools: Read, Bash(git:*), Bash(rg:*), Bash(cargo:*), Bash(node:*), Bash(gh:*), Bash(jq:*)
---

# shotloom-review-before-pr

Self-review pass for a Shotloom branch **before** opening a PR. Loads the in-repo formal Rust review spec (`docs/guidelines/review-rust.md`) and the review process (`docs/guidelines/code-review-guideline.md`), walks them against the current diff, reports findings. Does **not** push, **not** call `gh pr create`, **not** modify files — reports only.

> **Note:** The legacy 22-pattern catalog (`~/.claude/standards/review-code-rust.md`) has been retired. The in-repo `docs/guidelines/review-rust.md` is now the single source of truth for what counts as a Rust defect on this repo.

Run repeatedly during development. When the report comes back clean, then `/shotloom-make-pr` to open the PR.

## Why separate from `shotloom-make-pr`

- `make-pr` creates a PR — destructive, requires explicit user approval, once per PR.
- `review-before-pr` reviews a diff — safe, idempotent, pre-flight catches defects early.

Splitting lets you iterate on the diff until review is clean, then make the PR in one shot.

## Workflow

### Step 1: Sanity — branch state + cwd verification (CRITICAL)

Every sweep reads `git grep`/`git diff` from cwd. If cwd is the main checkout but the branch lives in a worktree (or vice versa), the sweep reviews the **wrong branch** and reports clean while real defects sit unreviewed. Always resolve the worktree from cwd, not from `repo-paths.json`.

```bash
# Resolve the worktree from the *current working directory*, not from
# repo-paths.json. The repo-paths entry points at the main checkout, which
# is almost never the branch the user is asking to review.
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repo"; exit 1; }
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *)
    echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"
    echo "  cd into the worktree whose branch you want to review."
    exit 1
    ;;
esac
worktree="$toplevel"
cd "$worktree"

pwd                                                   # MUST match intended target
git rev-parse --abbrev-ref HEAD                       # MUST be branch to review, NOT main
git log --oneline origin/main..HEAD                   # MUST show branch commits
git status --short                                    # surface unstaged work
```

`repo-paths.json → shotloom` remains a fallback for cross-worktree cleanup, but the review target is whatever cwd resolves to. This matches the cwd-based discipline in `shotloom-make-pr`.

**Refuse to proceed if:**
- `HEAD` is `main` or default branch — almost certainly wrong dir.
- `git log origin/main..HEAD` is empty — no commits to review.
- The remote check above fails — cwd is not a shotloom worktree.

Run `pwd` every time before first grep — cwd may silently reset between tool calls in long sessions.

### Step 2: Load the standards (MANDATORY, in-repo only)

**The shotloom in-repo guidelines are the only authority now.** Read in this order:

1. **`docs/guidelines/review-rust.md`** (in-repo) — formal Rust review spec. Single source of truth for what counts as a defect on this repo. Read in full.
2. **`docs/guidelines/code-review-guideline.md`** (in-repo) — review process, P0/P1/P2/P3 priorities, reviewer expectations.

The legacy 22-pattern catalog (`~/.claude/standards/review-code-rust.md`) has been retired. Use the in-repo formal spec as the checklist; do not load any external supplementary catalog.

Re-read both files every invocation — they get amended as new defect classes are found.

### Step 2.5: Load repo conventions (MANDATORY)

Group G assumes these were loaded. Skipping drops G entirely.

Read in full, in order:
1. `CONTRIBUTING.md` — contributor workflow, co-location / MAP.md rules, doc-path validator.
2. `AGENTS.md` — agent-facing workflow, ownership model.
3. `docs/guidelines/commit-guideline.md` — conventional format G2 enforces.
4. `docs/guidelines/pr-guideline.md` (if present) — PR body shape for G3.
5. `docs/adr/README.md` — ADR index; note crate-boundary ADRs for G1/G5.
6. Last 3–5 merged PRs (`gh pr list --state merged --limit 5`) for shape reference.

If a repo-local rule file exists (`~/.claude/rules/<repo>-*.md`, e.g. `shotloom-git.md`), load that too — it overrides generic rules.

### Step 3: Run pattern sweeps against the current diff

**Every hit is a candidate defect needing human triage** — do NOT auto-classify as false positive. The full command catalog for each pattern lives in [reference.md](reference.md); re-read before each sweep.

Run each of groups A–G against the diff. Representative sweeps:

```bash
# A1: backticked identifiers in changed comments must resolve
git diff origin/main..HEAD -- '*.rs' '*.md' | rg '^\+' | rg -o '`[A-Za-z_][A-Za-z0-9_]{2,}`' | sort -u

# D1: no eprintln/println/dbg in library code
rg '\beprintln!|\bprintln!|\bdbg!' $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') | rg -v '#\[cfg\(test\)\]'

# D2: no unwrap/expect on library hot paths
rg '\.unwrap\(\)|\.expect\(' $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') | rg -v '#\[cfg\(test\)\]|#\[test\]'

# G6: doc-paths validator
node scripts/validate-doc-paths.mjs 2>&1 | tail -2
```

See reference.md for the full sweep catalog. The catalog is keyed against `docs/guidelines/review-rust.md` — when the in-repo spec gains a new rule class, update reference.md at the same time.

### Step 4: Triage — group findings by pattern

```
## Findings

### Pattern A1 — Backticked identifiers
- `crates/foo/src/bar.rs:42` — `OldName` (renamed to `NewName` in commit XYZ)

### Pattern C1 — unwrap_or
- `crates/foo/src/baz.rs:123` — `tracks.get(i).copied().unwrap_or(0.0)` — verify default doesn't conflict with real samples
```

**If a section is clean, write `### Pattern XN — clean`** so the user knows you actually checked it.

### Step 5: Recommend next action

1. **All rules clean** →
   ```
   All rules in docs/guidelines/review-rust.md clean. Ready to run /shotloom-make-pr.
   ```
2. **Findings, fixable locally** → list them, ask whether to fix now or later. Do **NOT** auto-fix.
3. **Findings requiring design judgment** → list, explain tradeoff, ask user. Usually B1/B2 or C1.

### Step 6: Loop

If user fixes findings and asks to re-check, restart from Step 1. Skill is idempotent.

## User briefing — lower-resolution Korean framing

When briefing the findings table back to the user (NOT the raw `git diff` lines or pattern-sweep output), default to **Korean, one altitude higher than the per-pattern list**. The user wrote the diff and already knows what changed; what they need is the *shape* of the defects: which invariant / contract / subsystem each finding pokes at, grouped by theme.

**Rules:**
- **Frame, don't enumerate.** Lead with the diff's larger goal (which crate, which subsystem, which ADR it advances). Then group findings by what they actually attack — invariant break, classifier asymmetry, doc drift — rather than by Pattern ID order.
- **Group by theme, not by Pattern ID.** Two A1 findings + one A2 finding that all hit the same renamed identifier get one paragraph. Two C1 findings on different invariants stay separate even though they share an ID.
- **Keep the literal evidence below the briefing.** The framing comes first; the per-pattern list with line refs comes after, so the user can verify but isn't forced to read raw output to understand.
- **Skip framing on a clean review.** If all patterns are clean, just say so — don't manufacture a narrative.

The literal rule enumeration (Step 4 output) stays in English/code-quote form so it's greppable for the next session. Self-review is read-only by contract; if a review-time finding looks like a new rule class not yet covered by `docs/guidelines/review-rust.md`, surface it to the user in Step 5 and let them decide whether to fix-and-amend the in-repo spec inside the next PR cycle.

## Binding rules (CRITICAL)

- **Read `docs/guidelines/review-rust.md` and `docs/guidelines/code-review-guideline.md` in full every invocation.** Do not summarize from memory — re-read.
- **Do NOT modify any file.** Read-only. Even fixing a typo while reviewing creates ambiguity.
- **Do NOT push.** User pushes when ready.
- **Do NOT call `gh pr create`.** That's `shotloom-make-pr`'s job.
- **Do NOT skip a pattern.** If a pattern returns no output, explicitly report as clean. Silent skips defeat the checklist.

## Related

- `docs/guidelines/review-rust.md` (in shotloom repo) — **authoritative Rust review SSOT** loaded at Step 2
- `docs/guidelines/code-review-guideline.md` (in shotloom repo) — review process / priorities
- `skills/shotloom-make-pr/SKILL.md` — next step after clean report
- `rules/shotloom-git.md` — pre-PR identity / build / commit conventions
- `rules/testing.md` — unit test requirement (orthogonal to this checklist)

## Additional Resources

For the full bash sweep commands keyed against the in-repo `docs/guidelines/review-rust.md` rules, see [reference.md](reference.md). Re-read both when the in-repo spec gains new rules.
