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

---

## Pattern H — Doc & comment discipline (post-in-repo-review pass)

These run **after** the formal `docs/guidelines/review-rust.md` sweeps (A–G) clear. They catch doc/comment drift the in-repo spec does not enforce: speculative future-tense, stale status claims, broken cross-crate citations, and naming-convention incoherence in newly added types/modules.

Mindset: **doc must describe what IS, not what MIGHT BE.** A comment that promises future work without a concrete issue ID is not specification — it is a wish. A comment that claims "scaffold only" after the file gained 200 lines of logic is a lie. A "lives in `crate-x`" reference where `crate-x` does not exist breaks the next reader's grep. Default verdict on every H finding: rewrite to current-state-only, or cite a specific STL-NN that exists.

### H1: future-tense / speculation in changed comments

```bash
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '\b(will\s+(?:add|land|move|become|expose|introduce|migrate|emit)|future\b|follow[- ]up|lands?\s+in|planned|TODO|will\s+be|to\s+be\s+(?:added|defined|implemented))\b' \
  | rg -v 'STL-[0-9]+'
```

For each hit:
- Cite a concrete `STL-NN` that exists and is open, **or**
- Drop the future-work claim entirely and describe only the current state.
- "lands in a follow-up" / "planned" / "future work" without a specific issue = nit; rewrite.
- Pre-existing TODO comments untouched by the diff are out of scope for this sweep.

### H2: status-claim accuracy on touched files

```bash
for f in $(git diff --name-only origin/main..HEAD -- 'crates/*/src/lib.rs' 'crates/*/src/mod.rs'); do
  echo "=== $f ==="
  head -40 "$f" | rg -in '\b(scaffold|stub|WIP|placeholder|reserved|empty|TODO|coming soon|not yet)\b'
done
```

For each hit, verify against the current file:
- "scaffold only" / "empty" / "reserved" — does the file actually contain only the boilerplate? `wc -l src/*.rs` and skim.
- "WIP" / "not yet" — is the work still in flight, or did it land and the comment never got cleaned?
- A status word that no longer matches the code is a lie that misleads every future reader. Rewrite or delete.

### H3: cross-crate citation accuracy

```bash
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '(lives in|moved to|owned by|owns|consumes|now in|re-exported (?:from|via))\s+`?(shotloom-[a-z0-9-]+|shotloom_[a-z0-9_]+)' \
  | sort -u
```

For each hit verify:
- The cited crate / module path exists (`ls crates/<crate>/src/` or `rg <symbol> crates/<crate>/`).
- The cited symbol is actually owned / re-exported there (not just a planned move).
- "moved to X (STL-NN)" — confirm STL-NN is the issue that did the move, not an arbitrary related issue.

### H4: naming-convention coherence for new public identifiers

```bash
# 1. New crate names
git diff --name-only --diff-filter=A origin/main..HEAD -- 'crates/*/Cargo.toml' \
  | xargs -I{} dirname {} | xargs -I{} basename {}
# Each MUST match shotloom-<domain>-<role> (e.g. shotloom-body-anim-normalizer).
# Sibling alignment: if two new normalizer crates land, their roles must use the
# same suffix shape (-normalizer, -anim-normalizer, -model-normalizer, etc.).

# 2. New public types / traits / fns in changed files
git diff origin/main..HEAD -- 'crates/*/src/*.rs' \
  | rg '^\+pub (struct|enum|trait|fn|const|type) [A-Za-z_]'
# For each, verify against sibling crate's analogue:
#   - Trait BodyMappingConfig ↔ FacialMappingConfig (same suffix shape)
#   - Struct SourceAnimBody ↔ SourceAnimFacial (same prefix + role suffix)
#   - Fn normalize_body ↔ normalize_facial (same verb + role)
# A new type whose name does not mirror its sibling is either a new pattern
# (justify in PR body) or a naming bug (rename to mirror).

# 3. New module file layout vs sibling crates
for new_crate in $(git diff --name-only --diff-filter=A origin/main..HEAD -- 'crates/*/src/lib.rs' | xargs -I{} dirname {}); do
  echo "=== $new_crate ==="
  ls "$new_crate"
done
# Sibling crates with the same role should mirror module layout
# (config.rs / mapping.rs / source_anim.rs / types.rs is the normalizer shape).
# Asymmetry is allowed but must be intentional, not accidental.
```

### H5: doc ↔ ADR section coherence

```bash
# Every ADR-NNNN cited in changed comments must exist + the section/claim must be present.
git diff origin/main..HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o 'ADR-[0-9]{4}' \
  | sort -u \
  | while read adr; do
      lower=$(echo "$adr" | tr 'A-Z' 'a-z')
      hits=$(rg -l "^# .*$adr|^title: .*$adr" docs/adr/ 2>/dev/null | head -1)
      if [ -z "$hits" ]; then
        # fallback: look for adr-NNNN-*.md pattern
        hits=$(ls docs/adr/${lower}-*.md 2>/dev/null | head -1)
      fi
      if [ -z "$hits" ]; then
        echo "MISSING ADR FILE for $adr"
      fi
    done
# For each ADR cited with a section ref like "ADR-0030 §Dependency direction":
#   manually open the ADR and confirm the section heading exists.
```

### H6: claimed Out-of-Scope items are honored by the diff

```bash
# When the PR body or commit body says "Out of Scope: X", verify the diff does
# not silently include X. Common false claims:
#   - "Out of scope: behavior change" but a method signature changed.
#   - "Out of scope: new deps" but Cargo.toml grew a dep line.
git diff --name-only origin/main..HEAD | rg -q 'Cargo\.toml' && \
  git log origin/main..HEAD --format='%B' | rg -i 'out of scope.*dep' && \
  echo "VERIFY: PR claims no new deps but Cargo.toml changed — list newly-added deps."

git diff origin/main..HEAD -- 'crates/*/src/*.rs' | rg '^\+pub fn|^\-pub fn' | head -20
# Cross-check against any "Out of scope: API change" claim.
```

---

## Pattern I — Reverse-side audit (PR-induced staleness)

These run **after** Pattern H clears. Where A1 / H3 sweep `^+` lines for forward issues, Pattern I sweeps the converse: when this PR removes / moves / renames a symbol, grep the repo for **unchanged** prose that cites the OLD location and is now stale because of *this PR's change*.

Mindset: **A1/H3 catch what the PR adds; I catches what the PR breaks elsewhere.** "Pre-existing line" is not an excuse — the diff caused the staleness, so the diff owns the fix.

### I1: symbols this PR removes from a crate's public surface

```bash
# List public re-exports the PR drops from any crate's lib.rs.
git diff origin/main..HEAD -- 'crates/*/src/lib.rs' \
  | rg '^-\s*pub use ' \
  | rg -o '`?[A-Za-z_][A-Za-z0-9_]*`?' \
  | sort -u
```

For each removed symbol `X` from old crate `shotloom-y`:

```bash
# Look for unchanged prose / docs / ADRs / READMEs that still claim ownership.
rg -n "shotloom_y::X|shotloom-y.*\bX\b" crates/ docs/ MAP.md AGENTS.md 2>/dev/null
```

Triage per hit: legitimate historical mention (keep) vs stale ownership claim (fix in this PR).

### I2: file deletions / renames

```bash
# Files this PR removes or renames.
git diff --name-status origin/main..HEAD | rg '^[DR]'

# For each old path, grep prose for citations.
old_path="crates/shotloom-gltf/src/vrm_foot_contact.rs"   # ← per finding
rg -n "$old_path|$(basename "$old_path" .rs)" crates/ docs/ 2>/dev/null
```

If the old file was named in a comment / ADR / README and the citation does not name the new location, flag.

### I3: module-internal imports removed from a non-test source file

```bash
# Imports the PR drops; their fully-qualified path may still be cited in prose.
git diff origin/main..HEAD -- 'crates/*/src/*.rs' \
  | rg '^-use\s+(shotloom_[a-z_]+::[A-Za-z0-9_:]+)' \
  | rg -o 'shotloom_[a-z_]+::[A-Za-z0-9_:]+' \
  | sort -u
```

For each removed fully-qualified path, grep ADRs / READMEs / module-doc comments:

```bash
qualified="shotloom_gltf::extract_foot_contact_data"        # ← per finding
rg -n "$qualified" crates/ docs/ 2>/dev/null
```

Same triage as I1.

---

## Pattern T — Test coverage on changed behavior

`~/.claude/rules/testing.md` mandates that every modified public function, every new struct/enum with behavior, and every bug fix ships with a corresponding unit test in the **same** PR. The in-repo `docs/guidelines/review-rust.md` does not enforce this directly. Pattern T closes the gap by mapping changed signatures against new test functions in the same diff.

Mindset: **a changed `impl From<X>` whose source type moved across crates is a behavior change**, even when the body is byte-identical. Field-mapping invariants need a regression-grade pin in the same PR, not a smoke test through a caller.

### T1: public surface added or modified

```bash
# Added / modified public items: pub fn, pub struct, pub enum, conversion impls.
git diff origin/main..HEAD --unified=0 -- 'crates/*/src/*.rs' \
  | rg '^\+\s*(pub fn|pub struct|pub enum|impl(?:\s+<[^>]+>)?\s+(?:From<|TryFrom<|Default for|Display for))' \
  | sort -u
```

### T2: new test functions added in the same diff

```bash
# Test functions newly added in the diff (under cfg(test) or tests/).
git diff origin/main..HEAD --unified=0 -- 'crates/*/src/*.rs' 'crates/*/tests/*.rs' \
  | rg -B 2 '^\+\s*fn ' \
  | rg -B 1 '#\[test\]'
```

### T3: cross-reference T1 ↔ T2

For each T1 hit:

- Is there a T2 test in the same diff exercising it? Check by name (the test function name typically references the symbol under test) and by file (tests live in the same crate).
- If no T2 mapping exists, the PR body must name a pre-existing test that covers it. "Covered by smoke test through a caller" is **not** sufficient for type-mapping invariants — `From<X>` and similar conversion impls need a direct field-by-field assertion test.

Surface as finding:

```
T3: <crate>/src/<file>.rs +impl From<NewType> for X — no new test maps to it.
    Fix: add test in <crate>/src/<file>.rs::tests with distinct per-field values to pin the mapping, OR cite the pre-existing test name in PR body.
```

### T4: tests referencing private items in OTHER crates by name

```bash
# Test functions / cfg(test) blocks that mention a function name that is private in another crate.
# Approach: list callable identifiers cited in test comments / bodies; cross-check against pub surface.
git diff origin/main..HEAD -- 'crates/*/src/*.rs' \
  | rg '^\+' \
  | rg -B 5 '#\[test\]|#\[cfg\(test\)\]' \
  | rg -o '\b(compute_|extract_|build_|parse_|normalize_)[a-z_]+\b' \
  | sort -u
```

For each cited identifier, find its definition crate and visibility:

```bash
ident="compute_foot_contact"   # ← per finding
rg -n "fn $ident\b" crates/ 2>/dev/null
# Look at the file's pub-or-not and the crate's lib.rs re-exports.
```

If the test is in crate `A` and the identifier is private in crate `B`, the test's comment is a leaky abstraction — rewrite around `B`'s **public** surface so a future internal rename in `B` does not invalidate `A`'s test prose.

---

## Sweep order summary

Reviewers should run in this order, stopping at the first failed group only when triaging is interactive:

1. **A–G** (in-repo `docs/guidelines/review-rust.md` rules) — formal Rust spec.
2. **H** — doc & comment discipline (added lines).
3. **I** — reverse-side audit (unchanged lines newly stale).
4. **T** — test coverage on changed behavior (`rules/testing.md` enforcement).

Groups H/I/T are post-spec sweeps that the in-repo rust-review document does not cover. Findings in those groups are typically nits or design-judgment, but accumulated drift is exactly what every later session has to wade through. Treat them as part of the same standard.
