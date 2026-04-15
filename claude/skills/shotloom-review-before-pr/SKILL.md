---
description: Pre-PR self-review for Shotloom Rust changes. Walks the 22-pattern checklist from review-code-rust.md against the current diff and reports defects locally before pushing. Does NOT create a PR.
allowed-tools: Read, Bash(git:*), Bash(rg:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-review-before-pr

Self-review pass for a Shotloom branch **before** opening a PR. Loads the pattern-based Rust review standard, walks every pattern against the current diff, and reports findings. Does **not** push, does **not** call `gh pr create`, does **not** modify any file by itself — it only reports.

Run this skill repeatedly during development. When the report comes back clean, then run `/shotloom-make-pr` to actually open the PR.

## Why this is separate from `shotloom-make-pr`

- `shotloom-make-pr` creates a PR — destructive, requires explicit user approval, runs once per PR.
- `shotloom-review-before-pr` reviews a diff — safe to run anytime, idempotent, useful during development to catch defects early.

Embedding the review inside `make-pr` meant you couldn't pre-check work without committing to a PR. Splitting them lets you iterate on the diff until the review is clean, then make the PR in one shot.

## Workflow

### Step 1: Sanity — branch state

```bash
cd ~/Desktop/www/shotloom-github
git rev-parse --abbrev-ref HEAD                     # current branch
git log --oneline origin/main..HEAD || git log --oneline main..HEAD
git status --short                                   # surface unstaged work
```

If the branch has no commits ahead of `main`, abort — there's nothing to review.

### Step 2: Load the standard

**Read `~/.claude/standards/review-code-rust.md` in full.** This is mandatory. The file is the authoritative checklist; this skill is just the orchestrator that runs the checklist against the current diff.

The standard contains 22 patterns derived from real Copilot review defects on Shotloom PR #66 plus PR #72 self-review gap analysis:

| Group | Patterns | Class |
|---|---|---|
| **A** | A1–A6 | Doc ↔ code coherence (6) |
| **B** | B1–B2 | Classifier / dispatch asymmetry (2) |
| **C** | C1–C3 | Silent fallback in hot path (3) |
| **D** | D1–D4 | Library hygiene (4) |
| **E** | E1–E3 | Build / platform regressions (3) |
| **F** | F1–F3 | Cross-crate & inherited-pattern hygiene (3) |

### Step 3: Run pattern sweeps against the current diff

For each group, run the matching grep / metadata commands. **Every hit is a candidate defect that needs human triage** — do not auto-classify as false positive.

```bash
cd ~/Desktop/www/shotloom-github

# === Pattern A — Doc ↔ Code coherence ===

# A1: backticked identifiers in changed comments must resolve in the code
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o '`[A-Za-z_][A-Za-z0-9_]{2,}`' \
  | sort -u

# A2: file path references in changed comments must exist
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o '`(docs|crates|examples|scripts)/[^`]+`' \
  | sort -u
# For each hit, run `ls <path>` to verify it exists.

# A3: top-of-file state descriptions in touched crates
for f in $(git diff --name-only origin/main..HEAD -- 'crates/*/src/lib.rs' 'crates/*/src/mod.rs'); do
  echo "=== $f ==="
  head -30 "$f" | rg '//!|scaffold|WIP|stub|Phase|session'
done
# Read each header — does it still describe what the crate currently contains?

# A4: PR body vs file layout — only meaningful if a PR already exists
gh pr list --head $(git rev-parse --abbrev-ref HEAD) --json number --jq '.[0].number' \
  | xargs -I {} gh pr view {} --json body --jq .body \
  | rg '`(examples|crates|fixtures)/[^`]+`'
# If hits exist, verify each path against `git ls-files`.

# A5: test names vs setup
for f in $(git diff --name-only origin/main..HEAD -- '*.rs'); do
  rg -A 5 '#\[test\]' "$f" 2>/dev/null
done
# Read each test — does the body actually exercise what the name promises?

# A6: numeric claims in comments (MB / GB / minutes / Nx / ~N) — re-derive each
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -i '~?\s*[0-9]+\s*(MB|MiB|GB|GiB|minutes?|hours?|[kK]|[mM]illion|x\b)'
# For each hit, re-derive from std::mem::size_of / a constant / a bench.

# === Pattern B — Classifier / dispatch asymmetry ===

# B1: every classifier bucket is the only input to its handler
# (manual review — grep `match classify` and trace each bucket)
git diff origin/main..HEAD -- '*.rs' \
  | rg -B 2 -A 20 'match.*\{' \
  | rg 'push\(|insert\('

# B2: early returns near the top of multi-stage functions
git diff origin/main..HEAD -- '*.rs' \
  | rg '^\+.*\.is_empty\(\).*return'

# === Pattern C — Silent fallback in hot path ===

# C1: unwrap_or with a default that overlaps real measurements
rg 'unwrap_or\(|or_default\(|unwrap_or_default\(' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')

# C2: normalize_or_zero followed by a magnitude check
rg -A 5 'normalize_or_zero\(\)' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg 'length_squared|length\('

# C3: silent _ => arms in config parsing
rg -B 2 '_\s*=>\s*[A-Z][A-Za-z]+' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -B 2 'config|strategy|kind|type|name'

# === Pattern D — Library hygiene ===

# D1: no eprintln / println / dbg in library code
rg '\beprintln!|\bprintln!|\bdbg!' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -v '#\[cfg\(test\)\]'

# D2: no unwrap / expect on library hot paths
rg '\.unwrap\(\)|\.expect\(' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -v '#\[cfg\(test\)\]|#\[test\]'

# D3: mixed-language comments in English-only crates
rg '[가-힣]|[ぁ-んァ-ン一-龯]' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')

# D4: bare #[allow(dead_code)] without a justifying comment
rg -B 3 '#!?\[allow\(dead_code\)\]' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')

# === Pattern E — Build / platform ===

# E1: Linux dev-dep regression check (only if Cargo.toml or Cargo.lock touched)
if git diff --name-only origin/main..HEAD | rg -q 'Cargo\.(toml|lock)'; then
  cargo metadata --filter-platform x86_64-unknown-linux-gnu 2>/dev/null \
    | rg -o '"name":\s*"[^"]+"' \
    | rg 'alsa-sys|udev-sys|gilrs|cpal|bevy_audio'
fi

# E2: Cargo.lock drift after Cargo.toml change
if git diff --name-only origin/main..HEAD | rg -q 'Cargo\.toml' && \
   ! git diff --name-only origin/main..HEAD | rg -q 'Cargo\.lock'; then
  echo "WARNING: Cargo.toml changed but Cargo.lock did not — run cargo update and commit the lockfile"
fi

# E3: Windows portability on filesystem ops (rename / canonicalize / symlink)
rg 'fs::rename|fs::symlink|Path::canonicalize|set_permissions' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')
# For each hit, verify Windows semantics (POSIX rename-over-existing fails on Windows).

# === Pattern F — Cross-crate & inherited-pattern hygiene ===

# F1: cross-layer silent fallback — narrow integers / enum casts at parser boundary
rg 'as u8|as u16|as u32' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/parse/*.rs' 'crates/*/src/importer/*.rs')
# For each hit, verify the source range is validated at the parser, not delegated to a downstream catch-all.

# F2: inherited defensive code — fs::read + compare + rewrite chains on cached paths
rg -A 10 'fs::read' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -A 5 '== '
# For each hit, ask: is this defensive check still load-bearing in THIS crate, or inherited from a sibling where it was?

# F3: mirrored-pattern inheritance — comments or commit messages that cite "mirrors" / "follows" / "same as"
git log origin/main..HEAD --format='%B' \
  | rg -i 'mirror|follows|same as|like .* pattern|copied from'
git diff origin/main..HEAD -- '*.rs' \
  | rg '^\+' \
  | rg -i '// mirror|// follows|// same as|// copied from'
# For each hit, open the source and audit it under groups A–F before accepting the mirror.
```

### Step 4: Triage — group findings by pattern

For each non-empty section above, report:

```
## Findings

### Pattern A1 — Backticked identifiers
- `crates/foo/src/bar.rs:42` — `OldName` (renamed to `NewName` in commit XYZ)
- ...

### Pattern C1 — unwrap_or
- `crates/foo/src/baz.rs:123` — `tracks.get(i).copied().unwrap_or(0.0)` — verify default doesn't conflict with real samples
- ...
```

If a section is clean, write `### Pattern XN — clean` so the user knows you actually checked.

### Step 5: Recommend next action

Three possible outcomes:

1. **All patterns clean** — report:
   ```
   All 16 patterns clean. Ready to run /shotloom-make-pr.
   ```

2. **Findings exist, fixable locally** — list them and ask the user whether to fix in this session or address later. Do **NOT** auto-fix.

3. **Findings exist that require design judgment** — list them, explain the tradeoff, and ask the user to decide. These usually involve B1/B2 (classifier asymmetry) or C1 (default value semantics).

### Step 6: Loop

If the user fixes findings and asks to re-check, restart from Step 1. The skill is idempotent — running it twice on the same diff gives the same report.

## Binding rules

- **Read `~/.claude/standards/review-code-rust.md` in full at every invocation.** The standard is the authoritative checklist; this skill only orchestrates. Do not summarize from memory — re-read.
- **Do NOT modify any file.** This skill is read-only. Even fixing a typo while reviewing creates ambiguity about what the user approved.
- **Do NOT push.** Even if every pattern is clean, the user pushes when they're ready.
- **Do NOT call `gh pr create`.** That's `shotloom-make-pr`'s job.
- **Do NOT skip a pattern.** If a pattern's command returns no output, explicitly report that pattern as clean. Silent skips defeat the point of a checklist.

## Related

- `standards/review-code-rust.md` — **the authoritative 22-pattern checklist** loaded at Step 2
- `skills/shotloom-make-pr/SKILL.md` — the next step after this skill reports clean
- `rules/shotloom-git.md` — pre-PR identity / build / commit conventions
- `rules/testing.md` — unit test requirement (orthogonal to this checklist)
