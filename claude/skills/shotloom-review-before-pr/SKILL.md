---
description: Pre-PR self-review for Shotloom Rust — walks review-rust.md against the diff, reports defects. Does NOT create a PR.
allowed-tools: Read, Bash(git:*), Bash(rg:*), Bash(cargo:*), Bash(node:*), Bash(gh:*), Bash(jq:*)
---

# shotloom-review-before-pr

Self-review pass for a Shotloom branch **before** opening a PR. Loads the in-repo formal Rust review spec (`docs/guidelines/review-rust.md`) and the review process (`docs/guidelines/code-review-guideline.md`), walks them against the current diff, reports findings. Does **not** push, **not** call `gh pr create`, **not** modify files — reports only.

> **Note:** The in-repo `docs/guidelines/review-rust.md` is the single source of truth for what counts as a Rust defect on this repo. Do not load `~/.claude/standards/review-code-rust.md`.

Run repeatedly during development. When the report comes back clean, then `/shotloom-make-pr` to open the PR.

## Mindset (read every time)

Approach the diff as a senior engineer who has **never seen this code**. Step out of the author's mental model — the goal is fresh-eyes review, not validation of intent.

- **Read for architectural fit, not just local correctness.** Does this change respect crate boundaries? Does it cross a layer it shouldn't? Does it duplicate something already owned elsewhere? Does it leak an invariant a sibling crate relies on?
- **Question the framing, not just the implementation.** "Why does this struct exist?" "Why this layer, not the next one up?" "What would break if I deleted this line entirely?" Use the diff comment / commit message as a hypothesis, not a conclusion.
- **No charity.** Do not assume the author thought of edge cases — verify each one against the code. Do not assume the comment matches the code — read both.
- **No author empathy.** "I just wrote this an hour ago" is not in scope. The reviewer is a stranger; act like one.
- **Big picture before line-by-line.** Walk the change list once at the architecture level (which crates moved? which contracts shifted? which ADRs are implicated?) before diving into individual hunks. A line-level review that misses a misplaced module is worse than no review.
- **Defects are facts, not opinions.** Every finding cites the rule, ADR, standard, or in-repo guideline section it violates — no "I prefer", no "looks weird".

**Self-review's hard limit.** When the same model that wrote the prose is also reviewing it, automated grep sweeps stay objective but semantic-judgment checks (cross-reference accuracy, sibling-crate state claims, numeric/geometric reasoning) silently revert to author-validation — the grep finds the keyword; the author rationalizes it as "factual" because they remember writing it that way. **Load-bearing prose claims are not author-reviewable.** Step 3.8 enforces a mandatory subagent dispatch for those classes; do not skip it on the assumption that "I already checked".

This mindset applies independent of whatever the in-repo `review-rust.md` checklist says. The checklist is what to look for; this mindset is how to look.

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

Use the in-repo formal spec as the checklist; do not load `~/.claude/standards/review-code-rust.md` or any external supplementary catalog.

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

If a repo-local rule file exists (`~/.claude/rules/<repo>-*.md`, e.g. `~/.claude/rules/shotloom.md`), load that too — it overrides generic rules.

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

### Step 3.5: Pattern H — doc & comment discipline (grep-catchable)

These sweeps catch doc/comment drift the in-repo `docs/guidelines/review-rust.md` does not enforce. Run them on every invocation regardless of whether A–G are fully clean — gating Pattern H on a clean A–G silently skips it whenever a long-running nit lingers.

The catalog is **grep-catchable rules only**. Semantic-judgment classes (cross-reference body accuracy, sibling-crate state claims, numeric/geometric reasoning) move to Step 3.8 — those are not author-reviewable and require subagent dispatch.

- **H1** — future-tense / speculation in added prose. Sweep `*.rs` / `*.md` for `will be`, `will land`, `will live`, `to be added`, `planned`, `eventually`, `soon`, `in a follow-up`, `in a later`, `next pass`, `phase \d`, `\bTBD\b`, `TBA`, `coming soon`. Comments live forever; specification beats wish. Exception: PR descriptions, commit bodies, ADR Status/Amendment blocks.
- **H2** — stale status claims on touched lib/mod docs (`scaffold`, `stub`, `WIP`, `empty`) after the file gained real logic.
- **H3** — broken `lives in <crate>` / `moved to <crate>` cross-crate citations: the path / symbol must resolve in the current tree.
- **H4** — naming coherence for new public identifiers: sibling-mirror trait/struct/fn names; sibling-mirror crate / module layout.
- **H5** — `ADR-NNNN` cited in changed prose must exist as a file; section refs (`§Decision`, `§Out of scope`) must be present in that ADR file.
- **H6** — claimed Out-of-Scope items in PR / commit body must actually be honored by the diff.
- **H7** — past-state contrast framing in added comments (`previously`, `prior pipeline`, `was unconstrained`, `cannot resolve` when implying this pass fixes a sibling, `used to`, `before this change`, `now …` when implying delta). Comments live forever; the contrast becomes meaningless once the prior version is forgotten. Rewrite to describe what the symbol IS. Exception: changelog, commit body, PR description, ADR Amendment blocks.
- **H8** — Linear ID (`STL-\d+`) references anywhere in the working tree (`*.rs`, `*.md`, `*.toml`, `*.json`). Linear IDs belong in commit messages and PR descriptions only — they rot (renumber, cancel, repurpose) and tie code rationale to a tracker the next reader may not be able to open. Rewrite the prose to describe *what* (rule, invariant, algorithm); let the commit / PR carry *who-asked-for-it*. Exceptions: ADR Status/Amendment blocks (per H10); explicit CHANGELOG-style files designed to track tickets.
- **H9** — execution-status leak in ADR body. AFDS `documentation-standard.md` §5.7 excludes "active execution status" from `docs/adr/*.md` (including `docs/adr/README.md` index entries). Sweep added lines for `Implementation status`, `Implementation log`, `landed in`, `this PR scopes`, `this PR locks`, `formalized by PR #\d+`, `as of \d{4}-\d{2}-\d{2}`, `currently scoped to`. Right home: per-crate README, CHANGELOG, commit body, or PR description. Do not extend ADR body with "Implementation status (X)" subsections — even inside `§Out of scope` or `§Consequences`.
- **H10** — ADR Status/Amendment discipline. Material Decision-section edits to an Accepted ADR must bump Status to `Accepted (amended YYYY-MM-DD)` and add an Amendment block, not rewrite in place (per `documentation-standard.md` §5.7 + §2.8 and `adr-template.md` Usage Notes). Proposed ADRs may edit in place. Session-plan / port-plan prose (`Session 2 ports them`, `Revised during port`) is forbidden in any ADR body section.
- **H11** — long rationale in `//!` instead of crate README. **Dumb sweep**: any added `//!` (or top-of-file `///`) block longer than 40 lines, OR adding 3+ new `# Heading` subsections of explanatory prose. Surface as candidate; the verdict is "leave in `//!`" only when no `crates/<this>/README.md` exists or the README is unrelated. Rationale lives in per-crate README per AFDS §5.13.

Findings are P3 by default unless the violated rule's source standard escalates them (e.g. ADR Decision rewrite per H10 = P1). Accumulated H nits become onboarding tax; do not let them slide just because the in-repo spec does not list them.

**Catalog discipline.** When a Pattern H rule's defect class lands in `docs/guidelines/review-rust.md` (or any other in-repo SSOT), delete the H entry here in the same PR — Pattern H is for what the in-repo spec misses, not a parallel catalog. Do not append trigger anecdotes ("the failure mode that motivated this sweep was ...") to rule bodies; those belong in commit history. Rules accrete one direction; without active pruning the catalog becomes a leftover dump.

Full sweep commands live in [reference.md § Pattern H](reference.md#pattern-h--doc--comment-discipline-post-in-repo-review-pass).

### Step 3.8: Subagent verification — load-bearing prose claims (MANDATORY)

Three defect classes are **not author-reviewable**: the model that wrote the prose silently re-rationalizes the same claim as "verified" without re-checking. Self-review repeatedly clears them; round-1 reviewers and AI deep reviews catch them. The fix is structural — dispatch an independent Explore subagent with zero context about the edit.

When the diff contains any of the following, you MUST dispatch a subagent before declaring the review clean. Do not skip on "I already checked":

- **S1 — Cross-reference body accuracy.** Added prose cites an in-repo location by section name (`ADR-NNNN §SectionName`, `docs/arch/foo.md §Bar`, `<crate>/README.md §Baz`). H5 verifies the header exists; S1 verifies the section's body actually contains the material the prose paraphrases. Failure mode: section exists, author skim-reads it as supporting the claim, but the literal text says something weaker / different / about a sibling concern. Subagent task: open the cited file, paste the section text, verify the prose's paraphrase matches.
- **S2 — Sibling-crate state claim.** Added prose makes a factual claim about another crate's state (`scaffold`, `stub`, `WIP`, `empty`, `owns X`, `produces Y type`, `no output yet`, `not used by anything`, `the only consumer is Z`). Subagent task: open the named crate's `lib.rs` / `types.rs` / `Cargo.toml`, paste a one-line evidence quote, confirm or refute.
- **S3 — Numeric / geometric claim about a constant.** Added prose pairs a literal numeric constant with a directional / positional claim (`0.6 ratio is forward of X`, `index 5 is the wrist`, `the 1.0 represents Y`). Subagent task: open the code where the constant is used, derive the geometric meaning from arithmetic, confirm or refute the prose.

**Subagent prompt shape (copy literally):**

```
Independent verification — no context about my edits.
Diff: git diff origin/main..HEAD -- <files>
Verify each S1/S2/S3 claim listed below against current source. For each:
  - quote the cited file's literal text
  - state confirm | refute | unclear
  - if refute, propose the corrected wording
Do not summarize my work. Do not infer intent. Just verify the claims.
```

Subagent return is the only objective signal for these classes. If the subagent finds a refute, fix the prose and re-dispatch — never accept the initial author wording on a refute.

Skip the dispatch only when the diff contains zero S1/S2/S3 triggers. The trigger check itself is mechanical (grep for cited section names, sibling-crate names, numeric+directional pairings); the verification is what cannot be self-done.

### Step 3.6: Pattern I — Reverse-side audit (PR-induced staleness)

**Run after groups A–H clear.** Where Pattern A1 / H3 sweep **added** lines for forward-direction issues, Pattern I sweeps the **converse**: when the PR moves, removes, or renames a symbol / module / file, grep the repo for **unchanged** prose / imports / docs that cite the OLD location and are now stale because of *this PR's change*.

- **I1** — symbols this PR removes from a crate's public surface (`-pub use …` in a `lib.rs`); grep the whole repo for refs to the OLD fully-qualified path (`shotloom_x::Removed`).
- **I2** — file deletions / renames (`git diff --name-status | rg '^[DR]'`); grep prose comments and docs for the old file path.
- **I3** — module-internal imports removed from a non-test source file (`-use shotloom_x::Y`); grep ADRs / READMEs / module-doc comments for the fully-qualified old path.
- **I4** — workspace-wide unresolved-link sweep on doc comments. Trigger: this PR touches any `///` / `//!` doc comment OR renames any file in `crates/`. The repo's `validate-doc-paths.mjs` only checks markdown link targets in `docs/`; Rust `///` and `//!` doc comments accumulate stale references silently across PR cycles (renames, cross-crate moves, removed symbols, bracket-misuse where a file path was written with intra-doc syntax). The canonical sweep is `cargo doc --workspace --exclude shotloom-desktop --no-deps 2>&1 | rg "warning: unresolved link"` — rustdoc itself is the source of truth. Earlier drafts of this rule used a rename-history grep, but module-promotion renames (`foo.rs → foo/mod.rs`) preserve all qualified paths, so the rename grep produces high false-positive rates. Use `cargo doc` instead. **Triage rule:** any new unresolved-link warning whose file is in this PR's diff is in-scope; pre-existing warnings on files this PR did not touch are out-of-scope (surface them as candidate STL-NN follow-ups, do not fix in the current PR).

Mindset: **A1/H3 catch what the PR adds; I catches what the PR breaks elsewhere.** A pre-existing line that became wrong because of *this PR's move* is owned by *this PR* — fix it in the same PR or explicitly decide not to fix and note that decision in the PR body. "Pre-existing" is not an excuse: the diff caused the staleness.

Full sweep commands live in [reference.md § Pattern I](reference.md#pattern-i--reverse-side-audit-pr-induced-staleness).

### Step 3.7: Pattern T — Test coverage on changed behavior

**Run after groups A–I clear.** `~/.claude/rules/test-write.md` mandates that every modified public function, every new struct/enum with behavior, and every bug fix ships with a corresponding unit test in the **same** PR. The in-repo `docs/guidelines/review-rust.md` does not directly enforce this — `rules/test-write.md` is a Claude-side rule, not a shotloom guideline. Pattern T closes the gap by mapping changed signatures against new test functions in the diff.

- **T1** — public surface added or modified (`+pub fn`, `+pub struct`, `+pub enum`, `+impl From<…>` / `TryFrom` / `Default for` / `Display for`).
- **T2** — new `#[test]` functions in the same diff (under `crates/*/src/*.rs` and `crates/*/tests/*.rs`).
- **T3** — manual cross-reference: every T1 item must map to ≥1 T2 entry that exercises it. If pre-existing coverage suffices, the PR body must name the test that covers it; "covered by smoke test through a caller" is **not** sufficient for type-mapping invariants.
- **T4** — tests referencing **private** items from OTHER crates by name (leaky abstraction — `// compute_foo bails at …` in retarget when `compute_foo` is private to a normalizer). Rewrite to behavior-focused around the public surface so the test survives a future internal rename in the other crate.

Mindset: **a changed `impl From<X>` whose source type moved across crates is a behavior change**, even when the body is byte-identical — the impl now points at a different type's fields, so a renamed/reordered field on either side silently corrupts output. `testing.md`'s "new struct/enum with behavior → invariant check" applies; sweep T enforces.

Full sweep commands live in [reference.md § Pattern T](reference.md#pattern-t--test-coverage-on-changed-behavior).

### Step 4: Triage — group findings by pattern

**Finding text discipline (same negative checklist as `shotloom-make-pr` Step 5):**

- Inputs for finding text: only the current diff + `docs/guidelines/review-rust.md` (and the in-repo conventions loaded in Step 2.5). Do NOT pull from past PRs, prior review threads, Linear issue bodies, `.agent/`, or `reference.md`.
- Banned in finding text: marketing/qualitative adjectives (`cleanly`, `elegantly`, `nicely`), future/deferred speculation (`could later`, `next pass`, `Phase 2`), internal-tool self-refs, and any quantitative claim not re-derivable from the diff.
- One finding = one file:line + one concrete defect + (if non-obvious) the fix direction. No editorial commentary on style choices outside the rule being checked.

```
## Findings

### Pattern A1 — Backticked identifiers
- `crates/foo/src/bar.rs:42` — `OldName` (renamed to `NewName` in commit XYZ)

### Pattern C1 — unwrap_or
- `crates/foo/src/baz.rs:123` — `tracks.get(i).copied().unwrap_or(0.0)` — verify default doesn't conflict with real samples
```

**If a section is clean, write `### Pattern XN — clean`** so the user knows you actually checked it.

### Step 5: Recommend next action

1. **All rules clean (groups A–T)** →
   ```
   All rules in docs/guidelines/review-rust.md + Pattern H/I/T/S clean. Ready to run /shotloom-make-pr.
   ```
2. **Findings, fixable locally** → list them, ask whether to fix now or later. Do **NOT** auto-fix.
3. **Findings requiring design judgment** → list, explain tradeoff, ask user. Default B1/B2 or C1.

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
- `~/.claude/rules/shotloom.md` — pre-PR identity / build / commit conventions
- `rules/test-write.md` — unit test requirement (orthogonal to this checklist)

## Additional Resources

For the full bash sweep commands keyed against the in-repo `docs/guidelines/review-rust.md` rules, see [reference.md](reference.md). Re-read both when the in-repo spec gains new rules.
