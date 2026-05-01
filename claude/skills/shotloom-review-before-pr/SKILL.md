---
description: Pre-PR self-review for Shotloom Rust — walks review-rust.md against the diff, reports defects. Does NOT create a PR.
allowed-tools: Read, Bash(git:*), Bash(rg:*), Bash(cargo:*), Bash(node:*), Bash(gh:*), Bash(jq:*)
---

# shotloom-review-before-pr

Self-review pass for a Shotloom branch **before** opening a PR. Loads the in-repo formal Rust review spec (`docs/guidelines/review-rust.md`) and the review process (`docs/guidelines/code-review-guideline.md`), walks them against the current diff, reports findings. Does **not** push, **not** call `gh pr create`, **not** modify files — reports only.

> **Note:** The legacy 22-pattern catalog (`~/.claude/standards/review-code-rust.md`) has been retired. The in-repo `docs/guidelines/review-rust.md` is now the single source of truth for what counts as a Rust defect on this repo.

Run repeatedly during development. When the report comes back clean, then `/shotloom-make-pr` to open the PR.

## Mindset (read every time)

Approach the diff as a senior engineer who has **never seen this code**. Step out of the author's mental model — the goal is fresh-eyes review, not validation of intent.

- **Read for architectural fit, not just local correctness.** Does this change respect crate boundaries? Does it cross a layer it shouldn't? Does it duplicate something already owned elsewhere? Does it leak an invariant a sibling crate relies on?
- **Question the framing, not just the implementation.** "Why does this struct exist?" "Why this layer, not the next one up?" "What would break if I deleted this line entirely?" Use the diff comment / commit message as a hypothesis, not a conclusion.
- **No charity.** Do not assume the author thought of edge cases — verify each one against the code. Do not assume the comment matches the code — read both.
- **No author empathy.** "I just wrote this an hour ago" is not in scope. The reviewer is a stranger; act like one.
- **Big picture before line-by-line.** Walk the change list once at the architecture level (which crates moved? which contracts shifted? which ADRs are implicated?) before diving into individual hunks. A line-level review that misses a misplaced module is worse than no review.
- **Defects are facts, not opinions.** Every finding cites the rule, ADR, standard, or in-repo guideline section it violates — no "I prefer", no "looks weird".

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

### Step 3.5: Pattern H — doc & comment discipline (post-in-repo-review)

**Run after groups A–G clear.** These sweeps catch doc/comment drift the in-repo `docs/guidelines/review-rust.md` does not enforce:

- **H1** — future-tense / speculation without a concrete `STL-NN` (e.g. `lands in a follow-up issue`, `planned`, `will be added`).
- **H2** — stale status claims on touched lib/mod docs (`scaffold` / `stub` / `WIP` / `empty` after the file gained real logic).
- **H3** — broken `lives in <crate>` / `moved to <crate>` cross-crate citations (path / symbol / STL-NN must resolve).
- **H4** — naming-convention coherence for new public identifiers (sibling-mirror trait/struct/fn names; sibling-mirror crate / module layout).
- **H5** — `ADR-NNNN` cited in changed comments must exist as a file; section refs (`§Decision`, `§Out of scope`) must be present in that ADR.
- **H6** — claimed Out-of-Scope items (in PR body / commit body) must actually be honored by the diff.
- **H7** — ADR-discipline: no `STL-NN` citations or session-plan / port-plan prose (`Session 2 ports them`, `will land in a later session`, `Revised during port`) inside Decision / Consequences / Alternatives sections — those belong only in a Status / Amendment block. Material Decision-section edits must bump Status to `Accepted (amended YYYY-MM-DD)` and add an Amendment block (per `docs/guidelines/documentation-standard.md` §5.7 + §2.8 and `docs/guidelines/adr-template.md` Usage Notes), not rewrite in place. Treat as P1 when the PR's primary scope IS the ADR; nit otherwise — still flag, drift accumulates silently.

Mindset: **doc must describe what IS, not what MIGHT BE.** Comments that promise future work without a concrete issue ID are wishes, not specification. Comments that claim "scaffold" after 200 lines of logic land are lies. ADRs that carry execution-plan prose are progress trackers, not durable rationale. Default verdict on any H finding: rewrite to current-state-only, or cite a specific `STL-NN` that exists.

Full sweep commands live in [reference.md § Pattern H](reference.md#pattern-h--doc--comment-discipline-post-in-repo-review-pass). H findings are nits, but accumulated nits become onboarding tax for the next reader — do not let them slide just because the in-repo spec doesn't list them.

### Step 3.6: Pattern I — Reverse-side audit (PR-induced staleness)

**Run after groups A–H clear.** Where Pattern A1 / H3 sweep **added** lines for forward-direction issues, Pattern I sweeps the **converse**: when the PR moves, removes, or renames a symbol / module / file, grep the repo for **unchanged** prose / imports / docs that cite the OLD location and are now stale because of *this PR's change*.

- **I1** — symbols this PR removes from a crate's public surface (`-pub use …` in a `lib.rs`); grep the whole repo for refs to the OLD fully-qualified path (`shotloom_x::Removed`).
- **I2** — file deletions / renames (`git diff --name-status | rg '^[DR]'`); grep prose comments and docs for the old file path.
- **I3** — module-internal imports removed from a non-test source file (`-use shotloom_x::Y`); grep ADRs / READMEs / module-doc comments for the fully-qualified old path.

Mindset: **A1/H3 catch what the PR adds; I catches what the PR breaks elsewhere.** A pre-existing line that became wrong because of *this PR's move* is owned by *this PR* — fix it in the same PR or explicitly decide not to fix and note that decision in the PR body. "Pre-existing" is not an excuse: the diff caused the staleness.

Concrete trigger that motivated this sweep: STL-242 moved `extract_foot_contact_data` from `shotloom-gltf` to `shotloom-character-model-normalizer`. Self-review reported clean because A1 / H3 only check `^+` lines. ADR-0025 §"Public API surface" and `crates/shotloom-retarget/README.md` Out-of-Scope list both kept *unchanged* lines that named `shotloom-gltf` as the owner, silently going stale at merge.

Full sweep commands live in [reference.md § Pattern I](reference.md#pattern-i--reverse-side-audit-pr-induced-staleness).

### Step 3.7: Pattern T — Test coverage on changed behavior

**Run after groups A–I clear.** `~/.claude/rules/test-write.md` mandates that every modified public function, every new struct/enum with behavior, and every bug fix ships with a corresponding unit test in the **same** PR. The in-repo `docs/guidelines/review-rust.md` does not directly enforce this — `rules/test-write.md` is a Claude-side rule, not a shotloom guideline. Pattern T closes the gap by mapping changed signatures against new test functions in the diff.

- **T1** — public surface added or modified (`+pub fn`, `+pub struct`, `+pub enum`, `+impl From<…>` / `TryFrom` / `Default for` / `Display for`).
- **T2** — new `#[test]` functions in the same diff (under `crates/*/src/*.rs` and `crates/*/tests/*.rs`).
- **T3** — manual cross-reference: every T1 item must map to ≥1 T2 entry that exercises it. If pre-existing coverage suffices, the PR body must name the test that covers it; "covered by smoke test through a caller" is **not** sufficient for type-mapping invariants.
- **T4** — tests referencing **private** items from OTHER crates by name (leaky abstraction — `// compute_foo bails at …` in retarget when `compute_foo` is private to a normalizer). Rewrite to behavior-focused around the public surface so the test survives a future internal rename in the other crate.

Mindset: **a changed `impl From<X>` whose source type moved across crates is a behavior change**, even when the body is byte-identical — the impl now points at a different type's fields, so a renamed/reordered field on either side silently corrupts output. `testing.md`'s "new struct/enum with behavior → invariant check" applies; sweep T enforces.

Concrete trigger that motivated this sweep: STL-242 retargeted `From<ExtractedFootGeometry>` / `From<ExtractedFootSide>` in `crates/shotloom-retarget/src/types.rs` from `shotloom_gltf::…` to `shotloom_character_model_normalizer::…`. Body was unchanged, but the source-type identity changed. Self-review reported clean (A–H all green); the field-mapping pin was added only after the user pointed out the gap.

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
   All rules in docs/guidelines/review-rust.md + Pattern H/I/T clean. Ready to run /shotloom-make-pr.
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
