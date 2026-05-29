# shotloom-review-docs reference

**Supplementary catalog — runs in Phase 2 of the SKILL.md subagent brief.** The
canonical authorities are the resolver-loaded Shotloom guidance files. The
patterns below catch additional defect classes the in-repo guidelines do not
directly enforce: mechanical doc/comment sweeps, PR-induced staleness,
yaml/json sanity, and load-bearing prose verification.

If a pattern below overlaps an in-repo guideline section, the Phase 1 finding is
authoritative; this catalog adds the grep-catchable mechanical sweep on top.
Pattern S verifies load-bearing prose claims against cited sources.

---

## Pattern G — Structural / repo-convention coherence

### G1: new files under changed crates — crate ownership matches file's concern?

```bash
for f in $(git diff --name-only --diff-filter=A origin/main...HEAD -- 'crates/*/src/*.rs'); do
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
git diff --name-only origin/main...HEAD -- 'crates/*/src/' 'crates/Cargo.toml' \
  | rg 'lib\.rs|mod\.rs' \
  && echo "Structure may have shifted — verify docs/adr/ or docs/tech-debt/ reflect it"
git diff --name-only origin/main...HEAD -- 'docs/adr/' 'docs/tech-debt/' 'docs/adr/README.md' 'docs/tech-debt/README.md'
# If crate structure changed but no ADR/tech-debt edit, record the rationale in
# changed docs or leave it for the PR drafting step.
```

### G6: doc-paths validator + Rust comment path spot-check

```bash
node scripts/validate-doc-paths.mjs 2>&1 | tail -2
git diff origin/main...HEAD -- '*.rs' '*.md' \
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
# A fix: commit without a paired regression test violates rules/test-write.md.
```

---

## Pattern H — Doc & comment discipline

These catch doc/comment drift the in-repo `docs/guidelines/review-rust.md` does not enforce: speculative future-tense, stale status claims, broken cross-crate citations, naming-convention incoherence, ADR-prose discipline, Linear-ID rot, and overlong `//!` rationale that belongs in a per-crate README.

Mindset: documentation describes current behavior. Future-work prose needs a
specific open issue; stale status claims and broken crate references should be
rewritten or removed.

### H1: future-tense / speculation in added prose

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '\b(will\s+(?:add|land|move|become|expose|introduce|migrate|emit)|future\b|follow[- ]up|lands?\s+in|planned|TODO|will\s+be|to\s+be\s+(?:added|defined|implemented)|eventually|soon|coming soon|next pass|phase [0-9]|\bTBD\b|TBA)\b' \
  | rg -v 'STL-[0-9]+'
```

For each hit:
- Cite a concrete `STL-NN` that exists and is open, **or** drop the future-work claim entirely and describe only the current state.
- Pre-existing TODO comments untouched by the diff are out of scope.
- Exception: PR descriptions, commit bodies, ADR Status / Amendment blocks.

### H2: stale status claims on touched lib/mod docs

```bash
for f in $(git diff --name-only origin/main...HEAD -- 'crates/*/src/lib.rs' 'crates/*/src/mod.rs'); do
  echo "=== $f ==="
  head -40 "$f" | rg -in '\b(scaffold|stub|WIP|placeholder|reserved|empty|TODO|coming soon|not yet)\b'
done
```

For each hit, verify against the current file's actual content. Rewrite or
delete stale status words that no longer match the code.

### H13: local absolute path exposure in durable files

```bash
git diff --name-only origin/main...HEAD \
  | rg -v '(^node_modules/|^target/|^\\.git/)' \
  | xargs rg -n '(/Users/|/home/|[A-Za-z]:[\\/]|Downloads/|Desktop/)'
```

For each hit:
- P1 if the local machine path appears in source, docs, manifests, fixtures,
  generated examples, scripts, or durable prose.
- Replace with a repo-relative path, symbolic source name, resolver/config
  lookup, or `.gitignore`d private config.
- Allow only intentionally local runtime config, private ignored files, and
  clearly home-relative harness paths such as `~/.claude/...`.

### H3: cross-crate citation accuracy

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '(lives in|moved to|owned by|owns|consumes|now in|re-exported (?:from|via))\s+`?(shotloom-[a-z0-9-]+|shotloom_[a-z0-9_]+)' \
  | sort -u
```

For each hit verify the cited crate / module path exists and the symbol is actually owned / re-exported there.

### H4: naming-convention coherence for new public identifiers

```bash
# 1. New crate names
git diff --name-only --diff-filter=A origin/main...HEAD -- 'crates/*/Cargo.toml' \
  | xargs -I{} dirname {} | xargs -I{} basename {}
# Check against the shotloom-<domain>-<role> naming shape.

# 2. New public types / traits / fns in changed files
git diff origin/main...HEAD -- 'crates/*/src/*.rs' \
  | rg '^\+pub (struct|enum|trait|fn|const|type) [A-Za-z_]'
# Verify against sibling crate's analogue (same suffix shape).

# 3. Module file layout vs sibling crates
for new_crate in $(git diff --name-only --diff-filter=A origin/main...HEAD -- 'crates/*/src/lib.rs' | xargs -I{} dirname {}); do
  echo "=== $new_crate ==="
  ls "$new_crate"
done
```

### H5: ADR section-citation accuracy

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -o 'ADR-[0-9]{4}' \
  | sort -u \
  | while read adr; do
      lower=$(echo "$adr" | tr 'A-Z' 'a-z')
      hits=$(ls docs/adr/${lower}-*.md 2>/dev/null | head -1)
      if [ -z "$hits" ]; then
        echo "MISSING ADR FILE for $adr"
      fi
    done
```

For each ADR cited with `§SectionName`, manually open the ADR and confirm the section heading exists. (Body-text verification of the section moves to Pattern S1.)

### H6: claimed Out-of-Scope items honored by the diff

```bash
git diff --name-only origin/main...HEAD | rg -q 'Cargo\.toml' && \
  git log origin/main..HEAD --format='%B' | rg -i 'out of scope.*dep' && \
  echo "VERIFY: PR claims no new deps but Cargo.toml changed."

git diff origin/main...HEAD -- 'crates/*/src/*.rs' | rg '^\+pub fn|^\-pub fn' | head -20
# Cross-check against any "Out of scope: API change" claim.
```

### H7: past-state contrast framing in added comments

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '\b(previously|prior pipeline|was unconstrained|used to|before this change|now\s+(?:we|the))\b'
```

Comments live forever; the contrast becomes meaningless once the prior version is forgotten. Rewrite to describe what the symbol IS. Exception: changelog, commit body, PR description, ADR Amendment blocks.

### H8: Linear-ID references anywhere in the working tree

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' '*.toml' '*.json' \
  | rg '^\+' \
  | rg 'STL-[0-9]+'
```

Linear IDs belong in commit messages and PR descriptions only. Rewrite prose to describe *what* (rule, invariant, algorithm); let commit / PR carry *who-asked-for-it*. Exceptions: ADR Status / Amendment blocks (per H10); CHANGELOG-style files.

### H9: execution-status leak in ADR body

```bash
git diff origin/main...HEAD -- 'docs/adr/*.md' \
  | rg '^\+' \
  | rg -in 'Implementation status|Implementation log|landed in|this PR scopes|this PR locks|formalized by PR #|as of [0-9]{4}-[0-9]{2}-[0-9]{2}|currently scoped to'
```

`documentation-standard.md` §5.7 excludes active execution status from ADR body (including README index). Right home: per-crate README, CHANGELOG, commit body, PR description.

### H10: ADR Status / Amendment discipline

```bash
# Linear-ID in ADR Decision / Consequences / Alternatives
git diff origin/main...HEAD -- 'docs/adr/*.md' \
  | rg '^\+' \
  | rg -in 'STL-[0-9]+' \
  | rg -v 'Status:|Amendment'

# Session-plan / port-plan prose
git diff origin/main...HEAD -- 'docs/adr/*.md' \
  | rg '^\+' \
  | rg -in '\b(Session\s+[0-9]|Phase\s+[0-9]|will\s+land\s+(?:in|when)|ports?\s+them|defers?\s+to\s+whenever|Revised during port|incremental port)\b'

# In-place Decision rewrite vs canonical amendment style
for adr in $(git diff --name-only origin/main...HEAD -- 'docs/adr/*.md'); do
  echo "=== $adr ==="
  rg -n '^\*\*Status:\*\*|^Status:' "$adr"
  git diff origin/main...HEAD -- "$adr" \
    | rg '^[-+].*##\s+(Decision|Consequences|Alternatives)' && \
    echo "  WARN: decision-section header changed in diff — verify Status banner reflects amendment per adr-template.md Usage Notes"
done
```

Material Decision-section edits to an Accepted ADR should update Status to
`Accepted (amended YYYY-MM-DD)` and add an Amendment block instead of rewriting
in place. Proposed ADRs may edit in place. Session-plan / port-plan prose does
not belong in ADR body sections. H10 hits where the PR's scope is the ADR
escalate to P1.

### H11: long rationale in `//!` instead of crate README

```bash
# Added //! blocks longer than 40 lines, or 3+ new # Heading subsections of prose
git diff origin/main...HEAD -- 'crates/*/src/lib.rs' 'crates/*/src/mod.rs' \
  | rg -c '^\+//!' \
  | awk -F: '$2 > 40 {print}'
```

Rationale lives in per-crate README per `documentation-standard.md` §5.13. Surface as candidate; the verdict is "leave in `//!`" only when no `crates/<this>/README.md` exists.

### H12: decision-by-deferral phrasing in durable docs

Distinct from H1 (future-tense verb forms). H12 catches phrasings that **look present-tense but smuggle deferral** — the prose appears to make a decision while actually naming a future artifact (PR, migration, follow-up issue, implementer, "consumer count") as the real decision point. The doc itself ducks the call.

Three principles for any decision sentence in a durable doc:

1. **Future-tense form** ("will be decided", "lands in a later PR") = drop. (H1 already covers this.)
2. **Present-tense form, actually pinned** ("Tailwind is the default styling system") = OK. Re-check rename-fragility per the Litmus test.
3. **Silence over explicit non-decision.** A durable doc that says "X is implementation choice" / "Y is decided per consumer" / "Z is intentionally underspecified" adds noise. The doc's silence already grants the freedom — explicit "we leave this open" prose is itself the defect, because future readers wonder whether the silence was deliberate or forgetful (and the prose proves it was deliberate but adds no other operational signal). Drop the sentence; let silence carry the freedom.

Sweep:

```bash
git diff origin/main...HEAD -- 'docs/adr/*.md' 'docs/specs/*.md' 'docs/arch/*.md' '*/README.md' \
  | rg '^\+' \
  | rg -in '\bdecided\s+(in|per|when|by)\s+(the|a|each|implementation|first|next)|left\s+(open|to)\s+(implementation|the\s+implementer|each|future)|intentionally\s+(underspecified|deferred|TBD|left\s+open|open)|implementation\s+choice\s+(and|;|,)|pinned\s+(in|by|at)\s+(the|each|implementation|first|next)|to\s+be\s+(decided|chosen|pinned)\s+(in|by|at|per)|wait[s]?\s+for\s+(a|the)\s+(concrete|real|first)|justif(ies|y)\s+them|TBD\s+(by|in)\s+(the|next|first)|defers?\s+to\s+(implementation|the\s+implementer)'
```

For each hit, apply the three-principle decision:

- The sentence pins a concrete present-tense choice → keep, re-check rename-fragility.
- The sentence defers to a future artifact while pretending to decide → **drop**.
- The sentence adds explicit "we leave this open" framing → **drop**, let silence carry the freedom.

Priority: P3 default; escalates to P2 when the deferral lives inside an ADR's `## Decision` section (Decision is the durable claim; diluting it with "decided later" prose defeats the ADR shape).

Real precedent (added 2026-05-13): ADR-0047 draft initially carried "Concrete class-composition tooling (helper functions, variant systems, per-primitive wrapper packages) is implementation choice and is decided in the first migration PR, not pinned here." This passed H1 (no `will` / `future` / `phase`) but failed H12 — "decided in the first migration PR" is deferral phrased as present-tense. Sentence dropped; ADR Decision stops at the actual pinned choice.

---

## Pattern I — Reverse-side audit (PR-induced staleness)

These run **after** Pattern H clears. Where A1 / H3 sweep `^+` lines for forward issues, Pattern I sweeps the converse: when this PR removes / moves / renames a symbol, grep the repo for **unchanged** prose that cites the OLD location and is now stale because of *this PR's change*.

Mindset: **A1/H3 catch what the PR adds; I catches what the PR breaks elsewhere.** "Pre-existing line" is not an excuse — the diff caused the staleness, so the diff owns the fix.

### I1: symbols this PR removes from a crate's public surface

```bash
git diff origin/main...HEAD -- 'crates/*/src/lib.rs' \
  | rg '^-\s*pub use ' \
  | rg -o '`?[A-Za-z_][A-Za-z0-9_]*`?' \
  | sort -u
```

For each removed symbol `X` from crate `shotloom-y`:

```bash
rg -n "shotloom_y::X|shotloom-y.*\bX\b" crates/ docs/ MAP.md AGENTS.md 2>/dev/null
```

### I2: file deletions / renames

```bash
git diff --name-status origin/main...HEAD | rg '^[DR]'

old_path="crates/shotloom-gltf/src/vrm_foot_contact.rs"   # ← per finding
rg -n "$old_path|$(basename "$old_path" .rs)" crates/ docs/ 2>/dev/null
```

### I3: module-internal imports removed from a non-test source file

```bash
git diff origin/main...HEAD -- 'crates/*/src/*.rs' \
  | rg '^-use\s+(shotloom_[a-z_]+::[A-Za-z0-9_:]+)' \
  | rg -o 'shotloom_[a-z_]+::[A-Za-z0-9_:]+' \
  | sort -u
```

For each removed fully-qualified path:

```bash
qualified="shotloom_gltf::extract_foot_contact_data"
rg -n "$qualified" crates/ docs/ 2>/dev/null
```

### I4: workspace-wide unresolved-link sweep on doc comments

Trigger: PR touches any `///` / `//!` doc comment OR renames any file in `crates/`.

```bash
cargo doc --workspace --exclude shotloom-desktop --no-deps 2>&1 | rg "warning: unresolved link"
```

Triage rule: any new unresolved-link warning whose file is in this PR's diff is in-scope; pre-existing warnings on files this PR did not touch are out-of-scope.

---

## Pattern M — Markup / manifest sanity

Trigger: `yaml_changed + json_changed > 0`. Catches workflow yaml / JSON syntax + supply-chain hardening at review time so CI failures do not cost a round-trip.

```bash
# M1 — GitHub Actions workflow yaml syntax
for f in $(git diff --name-only origin/main...HEAD -- '.github/workflows/*.yml' '.github/workflows/*.yaml'); do
  python3 -c "import sys, yaml; yaml.safe_load(open('$f'))" || echo "::error::$f: invalid yaml"
done

# M2 — uses: pinned to a tag (not branch); flag unpinned refs
git diff origin/main...HEAD -- '.github/workflows/*.yml' '.github/workflows/*.yaml' \
  | rg '^\+\s*uses: ' | rg -v '@v[0-9]|@[0-9a-f]{40}'

# M3 — JSON files parseable
for f in $(git diff --name-only origin/main...HEAD -- '*.json'); do
  python3 -m json.tool "$f" >/dev/null 2>&1 || echo "::error::$f: invalid json"
done

# M4 — secrets reference uses ${{ secrets.NAME }} form, no hardcoded
git diff origin/main...HEAD -- '.github/workflows/*.yml' '.github/workflows/*.yaml' \
  | rg '^\+' | rg -i 'password|token|api_key|secret' | rg -v '\$\{\{\s*secrets\.'

# M5 — workflow has meaningful concurrency group when it can race
for f in $(git diff --name-only origin/main...HEAD -- '.github/workflows/*.yml'); do
  if ! rg -q '^concurrency:' "$f"; then
    echo "::note::$f: no concurrency group — confirm no race against itself"
  fi
done
```

Priorities: M1 / M3 invalid syntax = P0 (workflow does not run). M2 unpinned action = P2 (supply-chain hardening). M4 plaintext secret = P0. M5 missing concurrency = P3.

---

## Pattern S — Load-bearing prose verification (subagent territory)

Three defect classes are difficult to self-review because the same context that
wrote the prose can make a claim feel obvious on reread. Pattern S makes the
subagent verify cited text directly; this section is the subagent's main work,
not a grep sweep.

The grep step below is the trigger check: a mechanical scan for added prose
carrying S1/S2/S3 patterns. For each trigger hit, open the cited source, include
a short evidence excerpt or citation, and verify confirm | refute | unclear.

### S1: cross-reference body accuracy

Trigger:

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '(ADR-[0-9]{4}|docs/[a-z/]+\.md|crates/[a-z-]+/README\.md)\s*§'
```

Failure mode: section exists (H5 verifies), but the cited text says something
weaker, different, or about a sibling concern. Open the cited file and verify
the prose's paraphrase matches.

### S2: sibling-crate state claim

Trigger:

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '\b(scaffold|stub|WIP|empty|owns\s+\w+|produces\s+\w+|no output yet|only consumer is)\b' \
  | rg -i 'shotloom-[a-z-]+|shotloom_[a-z_]+'
```

Open the named crate's `lib.rs` / `types.rs` / `Cargo.toml`, include a short
evidence excerpt or citation, then confirm or refute.

### S3: numeric / geometric claim about a constant

Trigger:

```bash
git diff origin/main...HEAD -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg -in '[0-9]+(\.[0-9]+)?\s+(is|=|→|->)\s+(forward|backward|left|right|up|down|wrist|elbow|shoulder|hip|toe|axis|ratio)'
```

Open the code where the constant is used, derive the geometric meaning from
arithmetic, then confirm or refute the prose.

### Subagent verification format

For each S1/S2/S3 hit:

```
Pattern S<N> at `<path>:<line>`:
  Claim: "<paraphrased from diff>"
  Cited source: `<file>` §<section>
  Evidence: "<short excerpt or citation>"
  Verdict: confirm | refute | unclear
  (If refute) Corrected wording: "<proposed rewrite>"
```

When the diff contains zero S1/S2/S3 triggers, Pattern S has no extra work.

---

## Sweep order

1. **G** (always) — repo conventions, commit / PR / branch shape, doc-paths validator.
2. **H** (md or rust diff) — doc & comment discipline.
3. **I** (moves) — reverse-side audit.
4. **M** (yaml / json) — markup / manifest sanity.
5. **S** (load-bearing prose triggers) — open cited sources, verify literal text.

Findings in H/I/M/S are typically nits or design-judgment, but they are useful
when local and evidence-backed.
