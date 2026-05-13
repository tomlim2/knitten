# shotloom-review-code reference

Full bash command catalog for the code-quality patterns (A–F + T). The subagent invoked by SKILL.md re-reads this file on every invocation. Keep sweeps grep-catchable; semantic-judgment hits move to the subagent's triage column, not into the sweep itself.

---

## Pattern A — Doc ↔ Code coherence

### A1: backticked identifiers in changed comments must resolve

```bash
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o '`[A-Za-z_][A-Za-z0-9_]{2,}`' \
  | sort -u
```

### A2: file path references in changed comments must exist

```bash
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o '`(docs|crates|examples|scripts)/[^`]+`' \
  | sort -u
# For each hit, run `ls <path>` to verify.
```

### A3: top-of-file state descriptions in touched crates

```bash
for f in $(git diff --name-only origin/main..HEAD -- 'crates/*/src/lib.rs' 'crates/*/src/mod.rs'); do
  echo "=== $f ==="
  head -30 "$f" | rg '//!|scaffold|WIP|stub|Phase|session'
done
# Does each header still describe what the crate currently contains?
```

### A4: PR body vs file layout (only when PR exists)

```bash
gh pr list --head $(git rev-parse --abbrev-ref HEAD) --json number --jq '.[0].number' \
  | xargs -I {} gh pr view {} --json body --jq .body \
  | rg '`(examples|crates|fixtures)/[^`]+`'
# Verify each path against `git ls-files`.
```

### A5: test names vs setup

```bash
for f in $(git diff --name-only origin/main..HEAD -- '*.rs'); do
  rg -A 5 '#\[test\]' "$f" 2>/dev/null
done
# Does each test body actually exercise what the name promises?
```

### A6: numeric claims in comments

```bash
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -i '~?\s*[0-9]+\s*(MB|MiB|GB|GiB|minutes?|hours?|[kK]|[mM]illion|x\b)'
# For each hit, re-derive from std::mem::size_of / a constant / a bench.
```

### A8: category-changing rename (concept word sweep)

Only runs when the PR renames an identifier whose role-noun changed (importer→parser, service→worker, handler→dispatcher, client→consumer).

```bash
old_role_noun="importer"   # ← set per PR from commit subject / PR description

for crate_dir in $(git diff --name-only origin/main..HEAD -- 'crates/*/Cargo.toml' | xargs -n1 dirname | sort -u); do
  echo "=== $crate_dir ==="
  rg -n -w "$old_role_noun" \
    "$crate_dir/Cargo.toml" \
    "$crate_dir/README.md" \
    "$crate_dir/src/lib.rs" \
    "$crate_dir/src/mod.rs" 2>/dev/null
done

# Also grep sibling docs that name the crate by role:
rg -n -w "$old_role_noun" MAP.md docs/adr/ docs/guidelines/ docs/tech-debt/ 2>/dev/null
```

For every hit: keep (valid historical reference) or swap (drifted self-description)?

---

## Pattern B — Classifier / dispatch asymmetry

### B1: every classifier bucket is the only input to its handler

```bash
git diff origin/main..HEAD -- '*.rs' \
  | rg -B 2 -A 20 'match.*\{' \
  | rg 'push\(|insert\('
```

Manual review: grep `match classify` and trace each bucket.

### B2: early returns near the top of multi-stage functions

```bash
git diff origin/main..HEAD -- '*.rs' | rg '^\+.*\.is_empty\(\).*return'
```

---

## Pattern C — Silent fallback in hot path

### C1: unwrap_or with a default that overlaps real measurements

```bash
rg 'unwrap_or\(|or_default\(|unwrap_or_default\(' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')
```

### C2: normalize_or_zero followed by a magnitude check

```bash
rg -A 5 'normalize_or_zero\(\)' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg 'length_squared|length\('
```

### C3: silent `_ =>` arms in config parsing

```bash
rg -B 2 '_\s*=>\s*[A-Z][A-Za-z]+' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -B 2 'config|strategy|kind|type|name'
```

---

## Pattern D — Library hygiene

### D1: no eprintln/println/dbg in library code

```bash
rg '\beprintln!|\bprintln!|\bdbg!' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -v '#\[cfg\(test\)\]'
```

### D2: no unwrap/expect on library hot paths

```bash
rg '\.unwrap\(\)|\.expect\(' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -v '#\[cfg\(test\)\]|#\[test\]'
```

### D3: mixed-language comments in English-only crates

```bash
rg '[가-힣]|[ぁ-んァ-ン一-龯]' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')
```

### D4: bare `#[allow(dead_code)]` without justifying comment

```bash
rg -B 3 '#!?\[allow\(dead_code\)\]' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')
```

---

## Pattern E — Build / platform

### E1: Linux dev-dep regression check (only if Cargo.toml/lock touched)

```bash
if git diff --name-only origin/main..HEAD | rg -q 'Cargo\.(toml|lock)'; then
  cargo metadata --filter-platform x86_64-unknown-linux-gnu 2>/dev/null \
    | rg -o '"name":\s*"[^"]+"' \
    | rg 'alsa-sys|udev-sys|gilrs|cpal|bevy_audio'
fi
```

### E2: Cargo.lock drift after Cargo.toml change

```bash
if git diff --name-only origin/main..HEAD | rg -q 'Cargo\.toml' && \
   ! git diff --name-only origin/main..HEAD | rg -q 'Cargo\.lock'; then
  echo "WARNING: Cargo.toml changed but Cargo.lock did not — run cargo update and commit the lockfile"
fi
```

### E3: Windows portability on filesystem ops

```bash
rg 'fs::rename|fs::symlink|Path::canonicalize|set_permissions' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs')
# For each hit, verify Windows semantics (POSIX rename-over-existing fails on Windows).
```

---

## Pattern F — Cross-crate & inherited-pattern hygiene

### F1: cross-layer silent fallback — narrow integers / enum casts at parser boundary

```bash
rg 'as u8|as u16|as u32' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/parse/*.rs' 'crates/*/src/importer/*.rs')
# Is the source range validated at the parser, not delegated downstream?
```

### F2: inherited defensive code — fs::read + compare + rewrite chains on cached paths

```bash
rg -A 10 'fs::read' \
  $(git diff --name-only origin/main..HEAD -- 'crates/*/src/*.rs') \
  | rg -A 5 '== '
# Is this defensive check still load-bearing in THIS crate, or inherited?
```

### F3: mirrored-pattern inheritance — citations of "mirrors" / "follows" / "same as"

```bash
git log origin/main..HEAD --format='%B' \
  | rg -i 'mirror|follows|same as|like .* pattern|copied from'
git diff origin/main..HEAD -- '*.rs' \
  | rg '^\+' \
  | rg -i '// mirror|// follows|// same as|// copied from'
# For each hit, open the source and audit under A–F before accepting.
```

---

## Pattern T — Test coverage on changed behavior

`~/.claude/rules/test-write.md` mandates that every modified public function, every new struct/enum with behavior, and every bug fix ships with a corresponding unit test in the **same** PR. The in-repo `docs/guidelines/review-rust.md` does not enforce this directly. Pattern T closes the gap by mapping changed signatures against new test functions in the same diff.

Mindset: **a changed `impl From<X>` whose source type moved across crates is a behavior change**, even when the body is byte-identical. Field-mapping invariants need a regression-grade pin in the same PR, not a smoke test through a caller.

### T1: public surface added or modified

```bash
git diff origin/main..HEAD --unified=0 -- 'crates/*/src/*.rs' \
  | rg '^\+\s*(pub fn|pub struct|pub enum|impl(?:\s+<[^>]+>)?\s+(?:From<|TryFrom<|Default for|Display for))' \
  | sort -u
```

### T2: new test functions added in the same diff

```bash
git diff origin/main..HEAD --unified=0 -- 'crates/*/src/*.rs' 'crates/*/tests/*.rs' \
  | rg -B 2 '^\+\s*fn ' \
  | rg -B 1 '#\[test\]'
```

### T3: cross-reference T1 ↔ T2

For each T1 hit, find a T2 entry in the same diff exercising it. If absent, the PR body must name a pre-existing test that covers it. "Covered by smoke test through a caller" is not sufficient for type-mapping invariants — `From<X>` and similar conversion impls need direct field-by-field assertion.

Finding format:

```
T3: <crate>/src/<file>.rs +impl From<NewType> for X — no new test maps to it.
    Fix: add test with distinct per-field values to pin the mapping, OR cite the pre-existing test name in the PR body.
```

### T4: tests referencing private items in OTHER crates by name

```bash
git diff origin/main..HEAD -- 'crates/*/src/*.rs' \
  | rg '^\+' \
  | rg -B 5 '#\[test\]|#\[cfg\(test\)\]' \
  | rg -o '\b(compute_|extract_|build_|parse_|normalize_)[a-z_]+\b' \
  | sort -u
```

For each cited identifier:

```bash
ident="compute_foot_contact"
rg -n "fn $ident\b" crates/ 2>/dev/null
```

If the test is in crate `A` and the identifier is private in crate `B`, rewrite the test's prose around `B`'s public surface so a future internal rename in `B` does not invalidate `A`'s test comment.

---

## Sweep order

1. **A–F** (in-repo `docs/guidelines/review-rust.md` rules) — formal Rust spec.
2. **T** — test coverage on changed behavior (`rules/test-write.md` enforcement).

Findings in T are typically nits or design-judgment, but accumulated drift is exactly what every later session has to wade through. Treat them as part of the same standard.
