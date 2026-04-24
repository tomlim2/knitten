# shotloom-review-before-pr reference

Full bash command catalog for every pattern. SKILL.md has the workflow skeleton and critical rules; this file is the pattern sweep library. Re-read before every review pass.

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

## Pattern G — Structural / repo-convention coherence

### G1: new files under changed crates — crate ownership matches file's concern?

```bash
for f in $(git diff --name-only --diff-filter=A origin/main..HEAD -- 'crates/*/src/*.rs'); do
  echo "=== NEW FILE: $f ==="
  crate=$(echo "$f" | cut -d/ -f1-2)
  echo "Existing content in $crate:"
  git ls-files "$crate/src/" | head -8
done
# Does the crate's ADR/mission cover this file's concern?
```

### G2: commit subjects against docs/guidelines/commit-guideline.md

```bash
git log origin/main..HEAD --format='%s' | while read subj; do
  len=${#subj}
  if [ "$len" -gt 80 ]; then echo "TOO LONG ($len): $subj"; fi
  case "$subj" in
    feat\(*|fix\(*|docs\(*|test\(*|refactor\(*|chore\(*|ci\(*|build\(*|perf\(*|style\(*) ;;
    *) echo "NON-CONVENTIONAL: $subj" ;;
  esac
done
# Also visually check imperative mood and no trailing period.
```

### G3: PR title + body shape vs recent merged PRs

```bash
gh pr list --state merged --limit 5 --json number,title,body 2>/dev/null \
  | python3 -c 'import json,sys; [print(f"--- PR #{p[\"number\"]}: {p[\"title\"]}"); print(p["body"][:400]) for p in json.load(sys.stdin)]' \
  2>/dev/null
# Compare section headings, footer shape, checkbox usage with draft body.
```

### G4: branch name convention

```bash
branch=$(git rev-parse --abbrev-ref HEAD)
case "$branch" in
  feat/*|fix/*|refactor/*|chore/*|hotfix/*|release/*) ;;
  *) echo "BRANCH NAME: $branch does not match feat/fix/refactor/chore/hotfix/release prefix" ;;
esac
# Shotloom: no stl-NN prefix — Linear's auto-suggestion is a UI hint, not canonical.
```

### G5: ADR / tech-debt coherence when structure shifts

```bash
git diff --name-only origin/main..HEAD -- 'crates/*/src/' 'crates/Cargo.toml' \
  | rg 'lib\.rs|mod\.rs' \
  && echo "Structure may have shifted — verify docs/adr/ or docs/tech-debt/ reflect it"
git diff --name-only origin/main..HEAD -- 'docs/adr/' 'docs/tech-debt/' 'docs/adr/README.md' 'docs/tech-debt/README.md'
# If crate structure changed but no ADR/tech-debt edit — justify in PR body or add one.
```

### G6: doc-paths validator + Rust comment path spot-check

```bash
node scripts/validate-doc-paths.mjs 2>&1 | tail -2
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o '`(docs|crates|scripts|examples|fixtures)/[^`]+`' \
  | sort -u
# For each path in Rust comments, `ls` it.
```

### G7: every fix-type commit ships a paired regression test

```bash
for sha in $(git log origin/main..HEAD --format='%H' --grep='^fix'); do
  subj=$(git log -1 --format='%s' "$sha")
  has_test=$(git show --stat "$sha" | rg -c '#\[test\]|_test\.rs')
  if [ "${has_test:-0}" = "0" ]; then
    later_test=$(git log "$sha..HEAD" --format='%s' | rg -c '^test\(' || true)
    if [ "${later_test:-0}" = "0" ]; then
      echo "FIX COMMIT WITHOUT TEST: $sha $subj"
    fi
  fi
done
# A fix: commit without a paired regression test violates rules/testing.md.
```
