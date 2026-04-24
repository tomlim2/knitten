---
description: Pre-PR self-review for Shotloom Rust changes. Walks the 22-pattern checklist from review-code-rust.md against the current diff and reports defects locally before pushing. Does NOT create a PR.
allowed-tools: Read, Bash(git:*), Bash(rg:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-review-before-pr

Self-review pass for a Shotloom branch **before** opening a PR. Loads the pattern-based Rust review standard, walks every pattern against the current diff, reports findings. Does **not** push, **not** call `gh pr create`, **not** modify files — reports only.

Run repeatedly during development. When the report comes back clean, then `/shotloom-make-pr` to open the PR.

## Why separate from `shotloom-make-pr`

- `make-pr` creates a PR — destructive, requires explicit user approval, once per PR.
- `review-before-pr` reviews a diff — safe, idempotent, pre-flight catches defects early.

Splitting lets you iterate on the diff until review is clean, then make the PR in one shot.

## Workflow

### Step 1: Sanity — branch state + cwd verification (CRITICAL)

Every sweep reads `git grep`/`git diff` from cwd. If cwd is the main checkout but the branch lives in a worktree (or vice versa), the sweep reviews the **wrong branch** and reports clean while real defects sit unreviewed. Always explicitly verify.

```bash
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
cd <worktree_dir_or_$shotloom_root>

pwd                                                   # MUST match intended target
git rev-parse --abbrev-ref HEAD                       # MUST be branch to review, NOT main
git log --oneline origin/main..HEAD                   # MUST show branch commits
git status --short                                    # surface unstaged work
```

**Refuse to proceed if:**
- `HEAD` is `main` or default branch — almost certainly wrong dir.
- `git log origin/main..HEAD` is empty — no commits to review.
- `pwd` doesn't match the named/worked directory.

Run `pwd` every time before first grep — cwd may silently reset between tool calls in long sessions.

### Step 2: Load the standard (MANDATORY)

**Read `~/.claude/standards/review-code-rust.md` in full.** This is mandatory. The file is the authoritative checklist; this skill only orchestrates.

22 patterns (derived from real Copilot defects on PR #66 + PR #72 gap analysis):

| Group | Patterns | Class |
|---|---|---|
| **A** | A1–A8 | Doc ↔ code coherence (8) |
| **B** | B1–B2 | Classifier / dispatch asymmetry (2) |
| **C** | C1–C3 | Silent fallback in hot path (3) |
| **D** | D1–D4 | Library hygiene (4) |
| **E** | E1–E3 | Build / platform regressions (3) |
| **F** | F1–F3 | Cross-crate & inherited-pattern hygiene (3) |
| **G** | G1–G7 | Structural / repo-convention coherence (7) |

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

See reference.md for the full sweep per pattern (A1–A8, B1–B2, C1–C3, D1–D4, E1–E3, F1–F3, G1–G7).

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

1. **All patterns clean** →
   ```
   All 22 patterns clean. Ready to run /shotloom-make-pr.
   ```
2. **Findings, fixable locally** → list them, ask whether to fix now or later. Do **NOT** auto-fix.
3. **Findings requiring design judgment** → list, explain tradeoff, ask user. Usually B1/B2 or C1.

### Step 6: Loop

If user fixes findings and asks to re-check, restart from Step 1. Skill is idempotent.

## Binding rules (CRITICAL)

- **Read `~/.claude/standards/review-code-rust.md` in full every invocation.** Do not summarize from memory — re-read.
- **Do NOT modify any file.** Read-only. Even fixing a typo while reviewing creates ambiguity.
- **Do NOT push.** User pushes when ready.
- **Do NOT call `gh pr create`.** That's `shotloom-make-pr`'s job.
- **Do NOT skip a pattern.** If a pattern returns no output, explicitly report as clean. Silent skips defeat the checklist.

## Related

- `standards/review-code-rust.md` — **authoritative 22-pattern checklist** loaded at Step 2
- `skills/shotloom-make-pr/SKILL.md` — next step after clean report
- `rules/shotloom-git.md` — pre-PR identity / build / commit conventions
- `rules/testing.md` — unit test requirement (orthogonal to this checklist)

## Additional Resources

For the full bash sweep commands for every pattern (A1–A8, B1–B2, C1–C3, D1–D4, E1–E3, F1–F3, G1–G7), see [reference.md](reference.md).
