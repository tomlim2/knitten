---
description: Cold-start Rust/TS code-quality review via Explore subagent — review-rust.md, test-code lens, Patterns A–F + T + U + J. Pair skill of shotloom-review-docs
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-review-code

Cold-start code-quality review for a Shotloom branch before opening a PR. Dispatches an Explore subagent that re-reads `docs/guidelines/review-rust.md` and `code-review-guideline.md` fresh on every invocation, runs the in-repo test-code lens when tests change, then runs Patterns A–F + T against the current diff and reports findings. The subagent has zero context about the author's intent — that is the point. The current author cannot reliably review their own prose / code because they silently re-rationalize claims; a cold-start subagent is the structural fix.

Pair skill: `shotloom-review-docs` covers docs/wording discipline.
Umbrella `shotloom-review-before-pr` invokes this as pass A; for pass B, it reuses this catalog with a verification preamble.

## Arguments

None. Operates on the PR diff, `git diff origin/main...HEAD`, from the current
shotloom worktree. The three-dot diff is required because branches may be
behind `origin/main`; a two-dot tree diff can misread base-branch additions as
deletions in the review branch.

## Workflow

### Step 1: cwd + branch sanity

```bash
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "ERROR: not in git repo"; exit 1; }
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *) echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"; exit 1 ;;
esac
cd "$toplevel"
pwd
branch=$(git rev-parse --abbrev-ref HEAD); echo "$branch"
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git log --oneline origin/main..HEAD
```

Refuse if HEAD is `main`, branch has zero commits ahead of `origin/main`, or cwd is not a shotloom worktree.

### Step 2: applicability check

```bash
rust_changed=$(git diff --name-only origin/main...HEAD -- '*.rs' | wc -l | tr -d ' ')
rust_test_changed=$(git diff --name-only origin/main...HEAD -- 'crates/**/tests/**/*.rs' 'crates/**/tests/*.rs' 'crates/**/src/**/*.rs' | rg '(^|/)tests(/|_)|_test\.rs$|/test_' -c || true)
ts_changed=$(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx' | wc -l | tr -d ' ')
echo "rust=$rust_changed rust_test=$rust_test_changed ts=$ts_changed"
```

If `rust_changed + ts_changed == 0`, report `Code review N/A — no Rust or TS diff. Run /shotloom-review-docs for the markup-side review.` and stop. Do NOT dispatch a subagent on an empty code surface.

### Step 3: dispatch cold-start subagent

Invoke the `Agent` tool with `subagent_type: Explore`. Pass the subagent brief below VERBATIM as `prompt`. Set `description` to `Code review (cold-start) — Patterns A–F + T against <branch>`.

#### Subagent brief (copy verbatim)

```
You are a cold-start code reviewer for the Shotloom repo. You have ZERO context about the diff's author, intent, or surrounding session. Approach this as a senior engineer who has never seen the code, with no charity and no author empathy. The author's commit message and PR body are hypotheses, not conclusions.

## Read fresh (in full, every invocation, in this order)

1. `<worktree>/docs/guidelines/review-rust.md` — canonical Rust review spec. **The only authority for what counts as a Rust defect on this repo.** Carries §1 Clippy → §2 Panic → §3 Error → §4 Unsafe → §5 Ownership → §6 ECS → §7 Serde → §8 WASM → §9 Complexity → §10 Deps → §11 Bridge DTO → §12 Test code review, each with a P0–P3 priority.
2. `<worktree>/docs/guidelines/code-review-guideline.md` — review process, P0/P1/P2/P3 priorities.
3. `~/.claude/skills/shotloom-review-code/reference.md` — **supplementary** sweep catalog (Patterns A–F + T). These cover defect classes the in-repo spec does not directly enforce. Loaded AFTER 1 and 2, executed in Phase 2.

Re-read every invocation. The standards are amended as new defect classes are found.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main...HEAD`
- Content: `git diff origin/main...HEAD` (full hunks)

## Two-phase execution (strict order)

### Phase 1 — In-repo canonical walk (FIRST)

Walk `docs/guidelines/review-rust.md` **section by section, in source order**, against the diff:

1. §1 Clippy compliance (P2) — any added code that would fail `cargo clippy -- -D warnings`?
2. §2 Panic discipline (P0) — `unwrap` / `expect` / `panic!` on non-test paths?
3. §3 Error propagation (P0) — `Result` mishandling, dropped errors, `unwrap_or_default` on fallible IO?
4. §4 Unsafe code (P0) — `unsafe` blocks without justifying comment + invariant statement?
5. §5 Ownership and lifetimes (P1) — gratuitous `.clone()`, unnecessary `Rc<RefCell<T>>`, lifetime-elision misuse?
6. §6 ECS patterns (P1) — Bevy system signatures, schedule placement, query soundness?
7. §7 Serialization and serde (P1) — `#[serde(default)]` masking schema drift, tag/untagged mistakes?
8. §8 WASM compatibility (P1) — std::time, std::thread, fs uses unguarded by `#[cfg(not(target_arch = "wasm32"))]`?
9. §9 Function complexity (P3) — nested control flow, parameter explosion?
10. §10 Dependency supply chain (P1) — new crate deps without justification, transitive risk, version pinning?
11. §11 Bridge DTO naming (P2) — bridge types follow the snake/camel + role-suffix convention?
12. §12 Test code review (P2/P3) — for changed Rust tests, check assertion strength, fixture rationale, failure locality, brittle diagnostic strings, intentional partial fixtures, helper duplication, and green-run output.

For every §-section: produce a finding (or `clean`) with a P0/P1/P2/P3 priority. The in-repo spec is the authority for what counts as a defect in that section.

### Phase 2 — Supplementary sweep catalog (AFTER Phase 1)

Only after Phase 1 is fully reported, run the patterns in `reference.md`. These are **additional** defect classes the in-repo spec does not directly enforce:

- **Pattern A** — Doc ↔ Code coherence (backticked identifier resolution, file path references, top-of-file state descriptions).
- **Pattern B** — Classifier / dispatch asymmetry.
- **Pattern C** — Silent fallback in hot path (overlaps §3 partially; surface where the in-repo spec is silent).
- **Pattern D** — Library hygiene (logging in lib code, mixed-language comments, bare `allow(dead_code)`).
- **Pattern E** — Build / platform (Linux dev-dep regressions, Cargo.lock drift, Windows fs ops).
- **Pattern F** — Cross-crate & inherited-pattern hygiene.
- **Pattern T** — Test coverage on changed behavior (enforces `~/.claude/rules/test-write.md`). Use it for missing-test gaps; use in-repo §12 for the quality of tests that already exist. Includes T5: defensive / fallback branch without a matching test (TS `data-testid` fallbacks, Rust `_ =>` arms, empty-state guards).
- **Pattern U** — Speculative public API surface. Barrel `index.ts` re-exports and `pub` items added without an out-of-module consumer in the same diff. Source of recurring "Maintainability" nits at review time.
- **Pattern J** — TypeScript defensive-shape patterns (J1 nullish-coalescing fake-narrow, J2 dead `!arg` guard on widened signature, J3 parser over-tolerance). Fires only when `ts_changed > 0`. Detail in `reference.md`.

For each pattern: run the sweep command from reference.md, triage hits, report.

Triage taxonomy (both phases):
- **defect** — cite the rule (in-repo §-section, ADR, or skill-side pattern) it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-design-judgment** — describe the tradeoff and propose a default.

Do NOT skip a section / pattern silently. If a check produces zero hits, report it as `clean`.

## Output format

```markdown
## Code review — branch <branch>

### Applicability — rust:N ts:N

Ran: Phase 1 (review-rust.md §1-12), Phase 2 (Patterns <list>). N/A: <list with reason, e.g. "no Rust diff" or "no Cargo.toml change">.

### Phase 1 — In-repo review-rust.md checks (canonical)

#### §1 Clippy compliance (P2)
- clean — OR — `<path>:<line>` — <defect> — cite §1 clause.

#### §2 Panic discipline (P0)
- clean — OR — `<path>:<line>` — <defect> — cite §2 clause.

Continue for every §-section through §12. If §12 is N/A because no Rust test files changed, report `N/A — no Rust test diff`.

### Phase 2 — Supplementary patterns (skill-side catalog)

#### Pattern A1 — backticked identifiers
- clean — OR — `<path>:<line>` — `<identifier>` <one-line defect description and rule cite>

Continue for every pattern A-F + T + U + J that applies.

### Recommendation

All Phase 1 + Phase 2 clean → ready for the docs review. OR specific findings to address — priority labels per code-review-guideline.md (P0 blocker / P1 critical / P2 should-fix / P3 nit). Phase 1 findings always carry the §-section's source priority; Phase 2 findings default to P3 unless the violated standard escalates them.
```

## Constraints (absolute)

- Do NOT modify any file. Read-only.
- Do NOT push, do NOT call `gh pr create`, do NOT post PR comments.
- Do NOT skip a pattern silently. Empty-result patterns report as `clean`.
- Do NOT charity-read the author's intent — if the comment claims a fact, verify it against the code; do not assume it is true because the author wrote it.
- Findings cite a rule / ADR / guideline section, not "I prefer".

When finished, return only the Markdown report. The orchestrator surfaces it to the user.
```

### Step 4: relay findings

Print the subagent's report verbatim. Do NOT re-summarize the findings list — the subagent's table is the artifact. Add at most one short Korean paragraph above the table framing which subsystem the diff advances (per `~/.claude/rules/shotloom.md` briefing tone), but only when there are non-clean findings.

### Step 5: loop

User fixes findings, re-invokes — restart from Step 1. Skill is idempotent.

## Binding rules

- **Default invocation is cold-start.** Never inline the sweep into the main session. If `shotloom-review-before-pr` reuses this catalog for pass B, its verification preamble controls the role framing; keep pattern and output rules.
- **Read-only by contract.** The Explore subagent type is read-only.
- **Re-read standards inside the subagent.** Main session does not need to load `review-rust.md`.
- **Sibling skill split:** docs/wording discipline lives in `shotloom-review-docs`. This skill only covers Rust/TS code quality patterns + test coverage.

## Related

- `shotloom-review-docs` — paired skill for docs / comment / markup / PR-prose discipline.
- `shotloom-review-before-pr` — umbrella router invoking code first, then docs.
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec.
- `docs/guidelines/code-review-guideline.md` (in shotloom repo) — review priorities.
- `~/.claude/rules/test-write.md` — unit test requirement (Pattern T enforces).

## Additional Resources

[reference.md](reference.md) — full bash command catalog for every pattern.
