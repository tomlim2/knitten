---
description: Cold-start Rust/TS code-quality review via Explore subagent — review-rust.md, stable Patterns A–F + T, promoted patterns, review axes, deep adjacency. Pair skill of shotloom-review-docs
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/shotloom.md,rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-review-code

Cold-start code-quality review for a Shotloom branch before opening a PR. Dispatches an Explore subagent that re-reads `docs/guidelines/review-rust.md` and `code-review-guideline.md` fresh on every invocation, runs the skill-side test-code lens when tests change, then runs stable Patterns A–F + T, promoted review-finding patterns, Review Axes Triage, and Deep Adjacency against the current diff and reports findings. The subagent judges only the diff, repo guidelines, and directly cited evidence; it does not rely on author intent or session context.

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

Invoke the `Agent` tool with `subagent_type: Explore`. Pass the subagent brief below VERBATIM as `prompt`. Set `description` to `Code review (cold-start) — Patterns A–F + T + V + U + J against <branch>`.

#### Subagent brief (copy verbatim)

```
You are a cold-start code reviewer for the Shotloom repo. You do not have session context about the diff's author or intent. Review as a senior engineer using only the diff, repo guidelines, and directly cited evidence. Treat the commit message and PR body as claims to verify, not proof.

## Read fresh (in full, every invocation, in this order)

1. `<worktree>/docs/guidelines/review-rust.md` — canonical Rust review spec. **The only authority for what counts as a production Rust defect on this repo.** Carries §1 Clippy → §2 Panic → §3 Error → §4 Unsafe → §5 Ownership → §6 ECS → §7 Serde → §8 WASM → §9 Complexity → §10 Deps → §11 Bridge DTO, each with a P0–P3 priority.
2. `<worktree>/docs/guidelines/code-review-guideline.md` — review process, P0/P1/P2/P3 priorities.
3. `~/.claude/skills/shotloom-review-code/reference.md` — **supplementary** test-code lens and stable sweep catalog (Patterns A–F + T). These cover durable defect classes the in-repo spec does not directly enforce. Loaded AFTER 1 and 2, executed in Phase 2.
4. `~/.claude/skills/shotloom-review-code/reference-promoted.md` — **promoted-only** review patterns generalized from real Shotloom PR review findings. Load after `reference.md`; execute any applicable promoted pattern in Phase 2, but keep source provenance separate from the stable catalog.

Re-read every invocation. The standards are amended as new defect classes are found.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main...HEAD`
- Content: `git diff origin/main...HEAD` (full hunks)

## Four-phase execution (strict order)

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
For every §-section: produce a finding (or `clean`) with a P0/P1/P2/P3 priority. The in-repo spec is the authority for what counts as a defect in that section.

### Phase 2 — Supplementary sweep catalog (AFTER Phase 1)

Only after Phase 1 is fully reported, run the patterns in `reference.md`, then run applicable promoted-only patterns in `reference-promoted.md`. These are **additional** defect classes the in-repo spec does not directly enforce:

- **Test Code Review Lens** — for changed Rust tests, check assertion strength, fixture rationale, failure locality, brittle diagnostic strings, intentional partial fixtures, helper duplication, and green-run output.
- **Pattern A** — Doc ↔ Code coherence (backticked identifier resolution, file path references, top-of-file state descriptions).
- **Pattern B** — Classifier / dispatch asymmetry.
- **Pattern C** — Silent fallback in hot path (overlaps §3 partially; surface where the in-repo spec is silent).
- **Pattern D** — Library hygiene (logging in lib code, mixed-language comments, bare `allow(dead_code)`).
- **Pattern E** — Build / platform (Linux dev-dep regressions, Cargo.lock drift, Windows fs ops).
- **Pattern F** — Cross-crate & inherited-pattern hygiene.
- **Pattern T** — Test coverage on changed behavior (enforces `~/.claude/rules/test-write.md`). Use it for missing-test gaps; use the Test Code Review Lens above for the quality of tests that already exist. Includes T5: defensive / fallback branch without a matching test (TS `data-testid` fallbacks, Rust `_ =>` arms, empty-state guards).
- **Promoted patterns** — recent reusable lessons from actual Shotloom review findings, currently including Pattern V (validator / manifest contract), Pattern U (speculative public API surface), and Pattern J (TypeScript defensive-shape patterns). Run only entries in `reference-promoted.md` whose trigger matches the diff. These entries are separated so they can be audited or folded into the stable catalog later.

For each pattern: run the sweep command from its reference file, triage hits,
report.

### Phase 3 — Review Axes Triage (AFTER Phase 2)

Run `reference.md` "Review Axes Triage". This is a mandatory mental checklist,
not a request for a long report. Use it to catch missing defect classes after
the mechanical sweeps. The Shotloom in-repo review guidelines remain the
authority: the axes cannot invent a conflicting rule, priority, or merge gate.
When an axis finds a defect, cite the closest Shotloom guideline, directly
related ADR, spec, or skill-side pattern that makes the defect actionable.

Required axes:

1. Correctness — requirements, edge cases, and intentional rejection behavior.
2. Regression Risk — existing behavior, shared contracts, serialization,
   protocol, schema, and backward compatibility.
3. Test Coverage — changed behavior, failure paths, fallback branches, and
   tests that fail for the real bug.
4. Data / State Consistency — partial mutation, reference integrity,
   duplicate/missing/stale references, caches, mirrors, and derived state.
5. Error Handling — swallowed errors, actionable caller errors, accurate codes,
   messages, and related ids.
6. API / Contract Consistency — docs, types, implementation, tests, naming,
   payload shape, required/optional fields, and versioning.
7. Security / Safety — input validation, ownership boundaries, locks,
   sensitive information, panic, unsafe, races, and invalid state access.
8. Performance — hot-path complexity, clone/allocation/serialization cost,
   async, lock, render-loop, WASM bridge, and frame-budget impact.
9. Maintainability — unit size, duplication drift, useful abstraction, and
   speculative public helper/export surface.
10. Scope Control — PR goal fit, mixed refactor/feature/contract changes,
   reviewable size, and follow-up issue boundaries.

### Phase 3a — Code sub-pass catalog

After the broad Review Axes Triage, run only the sub-passes whose trigger
matches the diff. A sub-pass is a focused review lens, not a separate skill.
Report each triggered sub-pass separately. If a sub-pass trigger does not
match, report it once under `N/A` rather than mentally executing it.

| Sub-pass | Trigger | Must check |
|---|---|---|
| Core correctness | Any Rust/TS production-code diff | panic/error/result handling, partial mutation, rollback, no-op mutation, event ordering, post-state assertions, and performance hazards visible in changed hot paths. |
| Bridge contract | Bridge DTOs, commands, events, TS mirrors, fixtures, IPC docs, or rejection codes changed | serde defaults and skipped fields, Rust DTO ↔ TS optionality, command/event/rejection matrix parity, fixture snapshots, docs parity, ADR/spec links, and omitted/default-field prose. |
| Boundary/domain | Stage/Prop ownership, promotion/demotion, validators, loaders, or context-aware APIs changed | source/target kind validation, ownership boundary, validation context downgrade, error precedence, and whether existing persisted data can now fail. |
| Test matrix | New or changed command handlers, validators, fallback branches, or behavior tests | rejection-path coverage, shared failure paths, skipped happy paths, rollback/no-partial-mutation tests, aggregate attribution, and tests that fail for the real bug. |
| Asset/manifest/platform | Manifest/catalog/data-pack/assets/LFS/Node CLI/path-handling changes | manifest containment, local path leaks, asset/LFS lifecycle, source/license metadata, CI/local validator placement, and CLI entrypoint portability. |

Sub-pass detail:

- DTO default serialization: when Rust uses `#[serde(default)]`,
  `skip_serializing_if`, or a bridge-visible default, verify TypeScript treats
  omitted JSON fields as the same runtime value.
- Command rejection matrix: enumerate every new rejection branch, shared helper
  failure, missing entity path, and boundary conversion failure.
- Field-set drift: inspect manual `is_empty`, metadata keys, enum string
  mappings, docs key lists, and DTO mirrors for compile/test enforcement.
- Input constraint parity: compare new bridge inputs against adjacent validation
  policy. Tags, IDs, free-form JSON options, transforms, and payload fields need
  bounds or an explicit schema-free contract.

Report axes compactly. List only triggered axes with findings. If no axis adds
a finding beyond Phases 1-2, report one line: `Review axes triage: clean`.
Never let this phase outrank `review-rust.md`, `code-review-guideline.md`,
`error-handling.md`, directly related bridge contracts, directly related ADRs,
directly related Shotloom specs, or task-specific acceptance criteria. Do not
scan every ADR, spec, bridge contract, or issue. Use only evidence linked from
the Linear issue, branch/PR text, changed files, comments, directly referenced
specs/contracts, or exact implementation-zone keyword matches.
Default evidence depth is 2: first inspect directly linked or exact-match
evidence; then inspect only the artifacts directly referenced by that evidence.
Stop there unless the second-depth artifact reveals a concrete contradiction in
the changed implementation zone. Escalate to Depth 3 only for
protocol/schema/serialization/persistence compatibility risk or a concrete
contradiction found at Depth 2.

### Phase 4 — Deep Adjacency pass (AFTER Phase 3)

Run `reference.md` "Deep Adjacency Pass". This pass follows two bounded hops
past the diff instead of broad-scanning the repo. Use the same sub-pass
grouping from Phase 3a so the report stays readable.

Required checks:

1. Core correctness: for each new or changed public type, enum variant,
   validation function, or
   serde field, inspect direct callers/consumers and direct load/save/import
   paths, then inspect those callers' direct contract/evidence references when
   they exist.
2. Bridge contract: for each new serde enum variant or bridge-visible type,
   check Rust serde tests, TypeScript mirrors, directly related docs/specs,
   fixtures, diagnostic wording, IPC docs, snapshot fixtures, ADR/spec links,
   and rejection-code catalogs.
   Also check omitted-field/default semantics: Rust serialization,
   TypeScript optional/nullish handling, fixtures, and docs must agree on the
   runtime meaning.
3. Boundary/domain: for each new validation rejection, identify whether
   existing persisted data can now fail. If yes, require an explicit migration
   or compatibility decision in the PR body or a linked follow-up issue. For
   new context-aware validation paths, inspect direct public wrappers, docs
   source-of-truth references, and production callers for silent downgrade to a
   weaker no-context path.
4. Test matrix: for each accepted command that mutates state, inspect emitted
   events, selection updates, trailing sync, post-state tests, and docs for
   observable state visibility and event ordering.
5. Asset/manifest/platform: for each manifest/catalog/asset-list validator,
   inspect the direct IO path consumer and require root-containment proof before
   filesystem access. For each changed Node/TS CLI script, inspect entrypoint
   guards and supported invocation paths for URL/native-path mismatch.
6. Public surface drift: for each new public helper, metadata hint struct, DTO,
   enum string mapping, or documented key list, decide whether it has a current
   production consumer and whether field/key drift is compile-enforced,
   test-covered, or likely to go stale.
7. Report this pass separately as `Deep adjacency findings`, even when clean.
   Include `Depth checked: 2` unless the diff has no contract-shaped items.

Triage taxonomy (both phases):
- **defect** — cite the rule (in-repo §-section, directly related ADR, or skill-side pattern) it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-design-judgment** — describe the tradeoff and propose a default.

Do NOT skip a section / pattern silently. If a check produces zero hits, report it as `clean`.

## Output format

```markdown
## Code review — branch <branch>

### Applicability — rust:N ts:N

Ran: Phase 1 (review-rust.md §1-11), Phase 2 (Test Code Review Lens + Patterns <list>), Phase 3 (Review Axes Triage), Phase 4 (Deep Adjacency). N/A: <list with reason, e.g. "no Rust diff" or "no Cargo.toml change">.

### Phase 1 — In-repo review-rust.md checks (canonical)

#### §1 Clippy compliance (P2)
- clean — OR — `<path>:<line>` — <defect> — cite §1 clause.

#### §2 Panic discipline (P0)
- clean — OR — `<path>:<line>` — <defect> — cite §2 clause.

Continue for every §-section through §11.

### Phase 2 — Supplementary patterns (skill-side catalog)

#### Test Code Review Lens (P2/P3)
- clean — OR — `N/A — no Rust test diff` — OR — `<path>:<line>` — <defect> — cite Test Code Review Lens.

#### Pattern A1 — backticked identifiers
- clean — OR — `<path>:<line>` — `<identifier>` <one-line defect description and rule cite>

Continue for every pattern A-F + T + V + U + J that applies.

### Phase 3 — Review axes triage

- clean — OR — `Triggered axes: <axis list>` followed by findings not already
  captured above.

### Phase 4 — Deep adjacency findings

- clean — OR — `<path>:<line>` — <two-depth caller/path/compatibility/public-surface defect and source rule>

### Recommendation

All Phase 1 + Phase 2 + Phase 3 + Phase 4 clean → ready for the docs review. OR specific findings to address — priority labels per code-review-guideline.md (P0 blocker / P1 critical / P2 should-fix / P3 nit). Phase 1 findings always carry the §-section's source priority; Phase 2, Phase 3, and Phase 4 findings default to P3 unless the violated standard escalates them.
```

## Constraints (absolute)

- Do NOT modify any file. Read-only.
- Do NOT push, do NOT call `gh pr create`, do NOT post PR comments.
- Do NOT skip a pattern silently. Empty-result patterns report as `clean`.
- Do NOT infer unstated author intent — if the comment claims a fact, verify it against the code; do not assume it is true because the author wrote it.
- Findings cite a rule / directly related ADR / guideline section, not "I prefer".

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

[reference.md](reference.md) — stable bash command catalog.
[reference-promoted.md](reference-promoted.md) — review-derived promoted patterns loaded after the stable catalog.
