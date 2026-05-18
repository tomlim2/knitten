# shotloom-review-code reference

**Supplementary catalog — runs in Phases 2-4 of the SKILL.md subagent brief.** The canonical Rust review spec is the in-repo `<shotloom>/docs/guidelines/review-rust.md` §1–11, which the subagent walks first in Phase 1. The test-code review lens and patterns below catch additional defect classes the in-repo spec does not directly enforce (test signal quality, doc-code coherence, classifier asymmetry, silent fallback in hot path, library hygiene, build/platform, cross-crate inheritance, test coverage). Review Axes Triage runs after those sweeps as a compact mandatory checklist. The Deep Adjacency pass then follows two bounded hops past the diff to direct consumers, persistence paths, bridge mirrors, and compatibility decisions.

If a Pattern below already overlaps an in-repo §-section, the Phase 1 finding is authoritative; this catalog adds the grep-catchable mechanical sweep on top. Keep sweeps grep-catchable; semantic-judgment hits move to the subagent's triage column, not into the sweep itself.

---

## Test Code Review Lens — P2/P3

Test code has a different review surface from production code. Production code
review protects runtime behavior, public contracts, and safety. Test code
review protects the quality of the regression signal.

Use this lens for `#[cfg(test)]` modules, integration tests, fixtures, and test
helpers:

- **Assertion strength — P2:** Assert the behavior under test, not only that a
  name, item, or container exists. Presence-only checks are acceptable only
  when topology presence is the full invariant. If the behavior is about
  animation, parsing, diagnostics, or mutation, assert the relevant data shape
  as well.
- **Failure locality — P2:** Matrix tests should report the failing fixture or
  case directly. Prefer one `#[test]` per meaningful case, a helper macro, or a
  collected-failures pattern over a single loop that stops at the first case
  without showing the rest of the matrix.
- **Fixture rationale — P3:** Curated fixture lists need a short rationale near
  the constant or table. A maintainer adding a fixture should know whether it
  belongs in the matrix.
- **Brittle assertions — P3:** Avoid exact string matches for diagnostic text
  when a stable prefix, code, enum, or formatted expectation captures the
  intended contract. Keep numeric cardinality in one assertion instead of
  duplicating it inside a diagnostic string.
- **Intentional partial fixtures — P3:** If a test omits parents, fields, or
  branches on purpose, add a short comment naming the invariant. The comment is
  useful when "fixing" the omission would change what the test exercises.
- **Helper duplication — P3:** Duplicate fixture loaders and mirrored structs
  are acceptable in integration-test binaries when sharing would add churn, but
  call out intentional mirrors with a short comment. Factor them into
  `tests/common/` when three or more tests need the same shape or when fields
  change often.
- **Green-run output — P3:** Avoid unconditional `println!` / `eprintln!` in
  tests. Failure messages should carry the diagnostic context. Gate debug
  traces behind an env var when green-run observability is actually needed.

Do not apply production-path panic discipline to test helpers mechanically:
descriptive `expect`, `unwrap`, and `panic!` are permitted in tests per
`review-rust.md` §2.

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

### T5: defensive / fallback branch without coverage

Every reachable defensive branch — empty-state fallback, `unwrap_or_default` arm, "should-never-happen" `else` clause, error path that returns a placeholder — needs at least one unit test that exercises it. Without coverage, the branch is dead from a measurement standpoint and a future refactor can silently break it while every other test stays green.

Triggers (any one):

- A new `data-testid="<x>-fallback"` / `data-testid="<x>-empty"` / `data-testid="<x>-error"` element in TSX without a test matching `getByTestId("<x>-…")`.
- A new Rust `match` arm `_ =>` or `None =>` that returns a non-trivial value, with no test in the same diff that constructs the precondition (empty input, missing config, malformed enum).
- A new `if <guard> === undefined / .is_none()` early return whose body is non-empty, with no test exercising the guard's true branch.

```bash
# TS: new fallback-shaped testids without a matching test
git diff origin/main..HEAD --unified=0 -- '*.tsx' \
  | rg '^\+.*data-testid="([^"]*(?:-fallback|-empty|-none|-error|-no-[^"]+))"' -o -r '$1' \
  | sort -u
# For each testid, grep tests for getByTestId("<id>") usage.
```

Finding format:

```
T5: <path>:<line> +<branch shape> — branch reachable but no test exercises the precondition.
    Fix: add a unit test that mocks the input to force the branch (e.g. `vi.mock("./<source>", () => ({ <empty-shape> }))` for TS), or cite the existing test that already covers it.
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

## Pattern U — Speculative public API surface

Barrel `index.ts` re-exports, public Rust `pub fn` / `pub use` items, and similar widenings of a module's contract surface should only land when an out-of-module consumer already needs them. Speculative re-exports turn future renames or removals into breaking changes for callers that do not exist yet, and are a recurring source of barrel drift.

Rule: every newly exported symbol from a barrel / `pub` item must have at least one out-of-module consumer in the same diff. If the new symbol is only used by siblings reachable via relative imports / `crate::` paths inside the same module, drop the re-export; siblings should keep using the direct import.

### U1: barrel widening without an external consumer (TS)

```bash
# 1. New `export {...}` / `export type {...}` lines added in any index.ts under apps/<x>/src
git diff origin/main..HEAD --unified=0 -- 'apps/*/src/**/index.ts' \
  | rg '^\+export\s+(\{[^}]+\}|type\s+\{[^}]+\}|\*)' -o
# 2. For each new symbol name, grep for an import outside the symbol's own folder.
ident="DebugSidebar"
folder="apps/editor/src/components/debug"
rg -l "from \".*${folder##*/components/}" apps/ --type ts --type tsx \
  | rg -v "^${folder}/" \
  | xargs -I{} rg -l "\\b${ident}\\b" {} 2>/dev/null
```

Zero out-of-folder hits → finding.

### U2: speculative `pub` symbol without an external consumer (Rust)

```bash
# New `pub fn` / `pub struct` / `pub enum` / `pub use` in lib.rs / mod.rs entries
git diff origin/main..HEAD --unified=0 -- 'crates/*/src/lib.rs' 'crates/*/src/**/mod.rs' \
  | rg '^\+\s*pub\s+(fn|struct|enum|use|type)\s+([A-Za-z_][A-Za-z0-9_]*)' -o -r '$2' \
  | sort -u
# For each symbol, check if any other crate consumes it.
ident="DebugSidebar"
rg -n "use\s+[a-z_]+::${ident}\b|::${ident}\b" crates/ 2>/dev/null \
  | rg -v "^crates/${owning_crate}/"
```

Zero out-of-crate hits → finding. Downgrade to `pub(crate)` if siblings need it; drop entirely if the symbol is only used inside its own module.

Finding format:

```
U1: <path>:<line> +export {<symbol>} — no out-of-module consumer in the diff.
    Fix: drop the re-export; siblings can keep using the direct relative import. Re-export later when an outside consumer arrives.
```

```
U2: <crate>/src/<file>.rs +pub <kind> <symbol> — no out-of-crate consumer.
    Fix: downgrade to `pub(crate)` (if siblings need it) or drop the `pub` entirely.
```

Tie-in: this is the "speculative public API" defect class — the more general form of `~/.claude/rules/code-write.md` "Start small, prove, then grow". Reviewers commonly cite it as a Maintainability nit; record it on the skill side so the next session catches it before review.

---

## Pattern J — TypeScript defensive-shape patterns

Trigger: `ts_changed > 0`. Three patterns the shotloom in-repo `docs/guidelines/review-typescript.md` did not yet name when this group was added; recurring on editor PRs as "defensive but lying" shapes that weaken the type system, hide call shapes, or make alarm-bell paths unreachable.

Each hit is a candidate defect needing human triage — same triage discipline as Pattern H in the docs leaf. Grep is best-effort; the *judgment* is whether the literal/guard/parser actually has a live consumer that justifies the defensive form.

- **J1 — Nullish-coalescing literal that fake-narrows `T | undefined`.** Find lines that paper over a `Maybe<T>` with a magic literal (typical shape: `const X = something()?.field ?? "literal"`). The literal often makes the type appear `string` when it is really `string | undefined`, hiding the missing case from every downstream caller. Triage rule: confirm the literal is a *meaningful* domain value (e.g. a real default like `"system"`, `"auto"`, `0`); a placeholder keyword borrowed from the first array entry is the defect form.
- **J2 — Function signature widened beyond actual callers + dead `if (!arg)` guard.** Find `if (!<name>) return undefined` (or equivalent) added in the diff where the surrounding function's argument type includes `| undefined` / `| null`. Cross-check: does any current caller actually pass `undefined`? If every call site narrows beforehand, the widening + guard is dead code that lies about the contract. Tighten to the strict type; let future callers narrow at the call site.
- **J3 — Parser over-tolerance: silently collapsing invalid input into valid input.** Find URL / path / query parsers added in the diff that use `.split(<sep>).find(<filter>)` or `array[0]` to "extract" a single token — these patterns silently drop the rest of the input. If the route already renders an unknown-input fallback, the over-tolerant parser makes that fallback unreachable for nested-path typos and broken bookmarks. Triage rule: preserve enough structure that invalid input flows through the existing unknown / fallback UI rather than being rewritten to look valid.

Sweep commands:

```bash
# J1 — nullish-coalescing literal in production code
git diff origin/main..HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg '\?\?\s*"[a-z][\w-]*"' | rg -v '__tests__|\.test\.'

# J2 — defensive `!arg` guard added on a widened signature
git diff origin/main..HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg 'if \(!\w+\)\s*return (undefined|null|\{|\[|\"\")'

# J3 — first-non-empty path/URL extraction
git diff origin/main..HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg '\.split\("/"\)\.(find|filter)\(' \
  | rg -v 'filter\(.*\)\.join\('   # join after filter is fine — drop the .find() over-tolerant shape
```

Findings escalate per the rule's source — all three default to P2 (maintainability / contract clarity / UX-signal preservation). When the in-repo `docs/guidelines/review-typescript.md` ships parallel section names for J1/J2/J3, prune the Pattern J entries here in the same PR — this pattern is for what the in-repo spec misses, not a parallel catalog. Same discipline as Pattern H in the docs leaf.

---

## Review Axes Triage — compact defect-class checklist

Run after the mechanical sweeps. This checklist prevents blind spots; it must
not inflate the report. If an axis is clean or already covered by a Phase 1/2
finding, record it only in the compact triage line. Add detail only when the
axis produces a new finding.

Authority order:

1. Shotloom in-repo guidelines, especially `docs/guidelines/review-rust.md`,
   `docs/guidelines/code-review-guideline.md`, and
   `docs/guidelines/error-handling.md`.
2. Directly related Shotloom ADRs, specs, bridge contracts, and task-specific
   issue acceptance criteria.
3. Skill-side patterns and this Review Axes Triage checklist.

The axes do not define independent merge policy. They organize inspection and
surface missed applications of the authorities above. Every axis finding must
cite the closest guideline, directly related ADR, spec, contract, or skill-side
pattern that makes it actionable.

Related evidence boundary:

- Use ADRs, specs, bridge contracts, and issue acceptance criteria explicitly
  linked by the Linear issue, PR body, commit text, changed docs, changed code
  comments, or directly referenced specs/contracts.
- Use exact implementation-zone keyword matches when no direct link exists.
  Search the smallest relevant root first, such as `docs/adr/`, `docs/specs/`,
  `docs/ipc/`, or the fetched Linear issue text.
- Do not read every Shotloom ADR, spec, bridge contract, or issue. If no
  related evidence is found through those routes, report
  `Related evidence: none found` instead of broadening the review.

Depth rule:

- Default depth is 2.
- Depth 0 is the changed diff surface.
- Depth 1 is directly linked or exact-match evidence from the changed diff,
  Linear issue, PR body, commit text, changed docs, changed comments, or
  referenced specs/contracts.
- Depth 2 is the artifacts directly referenced by Depth 1 evidence.
- Stop after Depth 2 unless the Depth 2 artifact exposes a concrete
  contradiction in the changed implementation zone. Do not follow general
  "related reading" links, navigation indexes, or broad roadmap references.
- Escalate to Depth 3 only for protocol/schema/serialization/persistence
  compatibility risk or a concrete contradiction found at Depth 2. Report the
  reason as `Depth escalation: <reason>`.

Axes:

1. **Correctness.** Verify the diff satisfies the stated requirement or
   acceptance criteria, handles edge cases, rejects invalid inputs, and
   preserves domain invariants.
2. **Regression Risk.** Identify changed existing behavior, shared types,
   public API, serialization, protocol, schema, persistence shape, and backward
   compatibility needs.
3. **Test Coverage.** Verify changed behavior has direct tests for happy path,
   failure path, edge case, fallback branch, and observable contract.
4. **Data / State Consistency.** Check partial mutation, create/update/delete
   reference integrity, duplicate/missing/stale references, caches, mirrors,
   indexes, and derived state.
5. **Error Handling.** Check swallowed errors, silent fallback, actionable
   caller errors, accurate codes/messages, related ids, and recovery-vs-bug
   separation.
6. **API / Contract Consistency.** Check docs, types, implementation, tests,
   naming, payload shape, required/optional fields, defaults, mirrors, and
   versioning notes.
7. **Security / Safety.** Check input validation, permission/ownership/lock
   boundaries, sensitive data in logs/responses, panic, unsafe, races, and
   invalid state access.
8. **Performance.** Check hot-path complexity, clone/allocation/serialization
   cost, large-data behavior, async/lock/render-loop/WASM bridge impact, and
   frame-budget risk.
9. **Maintainability.** Check unit size, duplication drift, abstraction value,
   speculative public surface, naming, and comments for non-obvious invariants.
10. **Scope Control.** Check PR goal fit, mixed refactor/feature/contract
   changes, reviewable size, and follow-up issue boundaries.

Output rule:

```markdown
### Phase 3 — Review axes triage

- clean
```

or:

```markdown
### Phase 3 — Review axes triage

- Triggered axes: Regression Risk, API / Contract Consistency.
- `<path>:<line>` — <new finding from an axis not already captured above>.
```

---

## Deep Adjacency Pass — two-depth boundary review

Run after Review Axes Triage. This is not a broad fresh review. Follow two
bounded hops past each changed contract-shaped item and verify that the
surrounding boundary still matches the diff.

Contract-shaped items:

- new or changed public Rust types, enum variants, validation functions, serde
  fields, bridge-visible DTOs, TS exported types, route parsers, and diagnostic
  strings;
- new rejection paths, fallback paths, or defaulting behavior in validators,
  importers, loaders, savers, bridge handlers, or bundle serializers;
- new public helpers, `pub use` entries, barrel exports, or crate/module
  boundary widenings.

For each item, inspect:

1. **Depth 1 direct callers and consumers.** Use `rg` on the symbol or
   diagnostic code, then open the immediate caller, not the whole repository.
   Confirm the caller handles the new shape without silent fallback or
   unreachable branch drift.
2. **Depth 1 direct load/save/import paths.** Trace bundle load, bundle save,
   import, bridge ingestion, fixture construction, and test data paths that
   touch the changed shape.
3. **Depth 2 direct references from Depth 1 artifacts.** From each relevant
   caller, path, fixture, doc, spec, or contract found at Depth 1, inspect only
   the artifacts it directly references. Stop after those references unless a
   concrete contradiction is visible in the changed implementation zone.
4. **Validation compatibility.** For each new rejection, decide whether existing
   persisted bundles or fixtures can now fail. Require one of: explicit
   migration/compatibility note in the PR body, linked follow-up issue, or a
   local test proving the old shape still loads.
5. **Mirror surfaces.** For new serde enum variants or bridge-visible types,
   check Rust serde tests, TypeScript mirrors, directly related docs/specs,
   fixtures, and diagnostic wording.
6. **Public helper exposure.** For each new helper or export, find the current
   production consumer. If none exists, require private/crate-private surface or
   a named follow-up issue that explains the widened contract.

Useful commands:

```bash
# Contract-shaped Rust additions
git diff origin/main..HEAD --unified=0 -- '*.rs' \
  | rg '^\+\s*(pub\s+)?(struct|enum|fn|type)\s+|^\+\s*#\[serde|^\+\s*pub\s+use'

# Bridge/serde/diagnostic additions
git diff origin/main..HEAD --unified=0 -- '*.rs' '*.ts' '*.tsx' \
  | rg '^\+' \
  | rg 'serde|Serialize|Deserialize|diagnostic|error|warning|bridge|Dto|DTO|Bundle|import|load|save|validate'

# For each symbol or diagnostic code, inspect Depth 1 consumers.
ident="StageRenderableState"
rg -n "\b${ident}\b" crates apps docs contracts
```

Report under `Deep adjacency findings` separately and include
`Depth checked: 2` when contract-shaped items exist. Use `clean` only after
checking every contract-shaped item produced by the diff. Findings default to
P3 unless the violated in-repo rule, directly related evidence, compatibility
break, or missing test raises the priority.
If the pass escalates to Depth 3, include `Depth escalation: <reason>`.

---

## Sweep order

1. **A–F** (in-repo `docs/guidelines/review-rust.md` rules) — formal Rust spec.
2. **T** — test coverage on changed behavior (`rules/test-write.md` enforcement).
3. **U** — speculative public API surface (barrel widening without consumer).
4. **J** — TypeScript defensive-shape patterns (fires only when `ts_changed > 0`).
5. **Review Axes Triage** — compact defect-class checklist.
6. **Deep Adjacency** — two-depth consumers, persistence paths, mirrors,
   diagnostics, public exposure, and validation compatibility.

Findings in T are typically nits or design-judgment, but accumulated drift is exactly what every later session has to wade through. Treat them as part of the same standard.
