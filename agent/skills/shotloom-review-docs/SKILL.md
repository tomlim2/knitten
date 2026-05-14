---
description: Cold-start docs / wording / markup review via Explore subagent — Patterns G + H + I + M + S. Pair skill of shotloom-review-code
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(node:*), Bash(pwd), Bash(cd:*)
---

# shotloom-review-docs

Cold-start docs / wording / markup review for a Shotloom branch before opening a PR. Dispatches an Explore subagent that re-reads `docs/guidelines/pr-guideline.md`, `commit-guideline.md`, `documentation-standard.md`, and `adr-template.md` fresh on every invocation, runs Patterns G + H + I + M + S against the current diff, and reports findings. The subagent has zero context about the author's intent — that is the point. The current author cannot reliably review their own prose; a cold-start subagent is the structural fix for the doc-claim self-rationalization failure mode.

Pair skill: `shotloom-review-code` covers Rust/TS code quality.
Umbrella `shotloom-review-before-pr` invokes this as pass A; for pass B, it reuses this catalog with a verification preamble.

## Arguments

None. Operates on `git diff origin/main..HEAD` from the current shotloom worktree.

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

Group G (repo conventions, doc-paths, ci-coverage) always runs — even on Rust-only or yaml-only diffs, the commit / PR / branch conventions still apply. The other groups gate on file-type presence:

```bash
md_changed=$(git diff --name-only origin/main..HEAD -- '*.md' | wc -l | tr -d ' ')
rust_changed=$(git diff --name-only origin/main..HEAD -- '*.rs' | wc -l | tr -d ' ')
yaml_changed=$(git diff --name-only origin/main..HEAD -- '*.yml' '*.yaml' | wc -l | tr -d ' ')
json_changed=$(git diff --name-only origin/main..HEAD -- '*.json' | wc -l | tr -d ' ')
moved=$(git diff --name-status origin/main..HEAD | grep -cE '^[DR]' || true)
echo "md=$md_changed rust=$rust_changed yaml=$yaml_changed json=$json_changed moved=$moved"
```

| Group | Runs when |
|-------|-----------|
| G — repo conventions, commit / PR / branch shape, doc-paths validator, ci-rust-coverage | always |
| H — doc / comment discipline (future-tense, stale status, cross-crate citations, ADR discipline) | `md_changed > 0` OR `rust_changed > 0` (added prose may live in `///`) |
| I — reverse-side audit (PR-induced staleness in unchanged prose) | `moved > 0` (any rename / removal / deletion) |
| M — markup / manifest sanity (workflow yaml, JSON parseability, action pinning, secrets refs) | `yaml_changed + json_changed > 0` |
| S — subagent verification of S1/S2/S3 load-bearing prose claims | any added prose carries S1/S2/S3 triggers — grep is mechanical, verification is the subagent's job |

This skill is **never wholly skipped** while commits exist on the branch. G always applies; a workflow-yaml-only PR still runs G + M (+ H if any added comment text).

### Step 3: dispatch cold-start subagent

Invoke the `Agent` tool with `subagent_type: Explore`. Pass the subagent brief below VERBATIM as `prompt`. Set `description` to `Docs review (cold-start) — Patterns G + H + I + M + S against <branch>`.

#### Subagent brief (copy verbatim)

```
You are a cold-start docs / wording / markup reviewer for the Shotloom repo. You have ZERO context about the diff's author, intent, or surrounding session. Approach this as a senior reviewer who has never seen the prose, with no charity and no author empathy. The author's commit message and PR body are hypotheses, not conclusions.

## Read fresh (in full, every invocation, in this order)

1. `<worktree>/docs/guidelines/pr-guideline.md` — PR title/body conventions. **Canonical.**
2. `<worktree>/docs/guidelines/commit-guideline.md` — Conventional Commits + body discipline. **Canonical.**
3. `<worktree>/docs/guidelines/documentation-standard.md` — durable-knowledge rules, ADR scope §5.7, repository language. **Canonical.**
4. `<worktree>/docs/guidelines/adr-template.md` — ADR template, Usage Notes (Litmus test, Anti-patterns, Editing rules). **Canonical.**
5. `<worktree>/docs/guidelines/code-review-guideline.md` — review priorities P0–P3.
6. `~/.claude/skills/shotloom-review-docs/reference.md` — **supplementary** sweep catalog (Patterns G + H + I + M + S). Covers defect classes the in-repo guidelines do not directly enforce + S-pattern verification. Loaded AFTER 1–5, executed in Phase 2.

Re-read every invocation. The standards are amended as new defect classes are found.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main..HEAD`
- Content: `git diff origin/main..HEAD` (full hunks)

## Two-phase execution (strict order)

### Phase 1 — In-repo canonical walk (FIRST)

Walk each in-repo guideline in source order against the diff. Produce a finding (or `clean`) per major rule with a P0–P3 priority:

1. **pr-guideline.md** — §1 PR Title (Conventional + ≤80 chars, no Linear ID), §2 Description template choice (Expanded vs Minimal — gate on the §2 criteria), §3 Expanded template sections present in order, §4 Issue Linkage form (`Resolves` / `Part of` / `No issue`), §5 Writing Guidance (Summary specificity, Why explains motivation, Changes grouped by behavior not files, Impact stated, Testing concrete), §6 Breaking Changes (`!` + Breaking Changes section), §7 Assignee (`@me`), §8 Checklist coverage.
2. **commit-guideline.md** — §1 Subject Line (type, scope, casing, length ≤80, imperative, no trailing period), §2 Body (explain why, group by behavior, no file-by-file changelog), §3 Footer / Trailers, §4 Breaking Changes commit form, §5 Other discipline points carried by the file.
3. **documentation-standard.md** — §2.8 durable-vs-ephemeral boundary, §5.7 ADR scope (no active execution status in ADR body), §5.13 per-crate README ownership of crate rationale, §7.5 durable tracker references (placeholder convention).
4. **adr-template.md** — Usage Notes Litmus test (rename-fragile prose moved out of ADR body), Anti-patterns (concrete type lists, cargo dep enumerations, session/phase plans), Linear-identifier rule (no Linear IDs in ADR body), Editing rules (Accepted ADRs use silent-in-place edit OR supersession, never `## Amendment`).
5. **code-review-guideline.md** — apply the P0/P1/P2/P3 priority taxonomy from this file to every Phase 1 finding.

For every walked rule: produce a finding with a P0–P3 priority, or report `clean`. The in-repo guideline is the authority.

### Phase 2 — Supplementary sweep catalog (AFTER Phase 1)

Only after Phase 1 is fully reported, run the patterns in `reference.md`. These are **additional** defect classes the in-repo guidelines do not directly enforce:

- **G (always):** G1 crate ownership for new files, G2 mechanical commit-subject sweep (catches what humans miss), G3 PR shape vs recent merged PRs, G4 branch name regex, G5 ADR/tech-debt coherence on structure shifts, G6 doc-paths validator + Rust-comment path spot-check, G7 fix-commit ↔ regression-test pairing.
- **H (md or rust diff):** H1 future-tense / speculation, H2 stale status (`scaffold` after the file gained logic), H3 cross-crate citation accuracy, H4 naming-convention coherence for new public identifiers, H5 ADR section-citation accuracy (file + heading exists), H6 claimed Out-of-Scope honored by the diff, H7 past-state contrast framing, H8 Linear-ID rot in tree files, H9 ADR execution-status leak, H10 ADR Status/Amendment discipline, H11 long rationale in `//!` instead of README, H12 decision-by-deferral phrasing in durable docs (present-tense smuggling — "decided in the first PR" / "left to implementation" / "wait for a real consumer"; doc silence already grants freedom, explicit deferral framing is itself the defect).
- **I (moves):** I1 removed pub use refs still cited elsewhere, I2 deleted/renamed file paths still cited, I3 removed imports still cited in ADRs/READMEs, I4 unresolved rustdoc links via `cargo doc --workspace --exclude shotloom-desktop --no-deps`.
- **M (yaml/json):** M1 yaml syntax, M2 action pinning, M3 json parseability, M4 plaintext secrets, M5 concurrency group on race-prone workflows.
- **S (load-bearing prose verification — subagent main work):** scan added prose for S1 (`ADR-NNNN §SectionName`, `docs/.../*.md §...`, `<crate>/README.md §...`), S2 (`scaffold`/`stub`/`WIP`/`empty`/`owns X`/`produces Y`/`only consumer is Z`/`no output yet`), S3 (literal numeric constant paired with directional/positional claim). For each trigger, open the cited source and verify the literal text. Report **confirm | refute | unclear** with the cited text quoted.

Triage taxonomy (both phases):
- **defect** — cite the rule (in-repo §-section, ADR, or skill-side pattern) it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-judgment** — describe the tradeoff and propose a default.

Do NOT skip a section / pattern silently. If a check produces zero hits, report it as `clean`.

## Output format

```markdown
## Docs review — branch <branch>

### Applicability — md:N rust:N yaml:N json:N moved:N

Ran: Phase 1 (pr-guideline / commit-guideline / documentation-standard / adr-template), Phase 2 (Patterns <list>). N/A: <list with reason>.

### Phase 1 — In-repo canonical checks

#### pr-guideline.md
- §1 Title: clean — OR — `<defect>` cite §1.
- §3 Expanded template: clean — OR — `<defect>` cite §3.
- §4 Issue Linkage: `<verb> STL-NNN` chosen correctly per §4 decision rule.
- (... per §-section ...)

#### commit-guideline.md
- §1 Subject Line: clean — OR — `<sha> "<subject>"` cite §1 clause.
- §2 Body: clean — OR — `<sha> "<subject>"` cite §2 clause.

#### documentation-standard.md
- §2.8 / §5.7 / §5.13 / §7.5: per-rule findings.

#### adr-template.md (when docs/adr/ touched)
- Litmus test: clean — OR — `<path>:<line>` cite template note.
- Anti-patterns: clean — OR — `<path>:<line>` cite template note.
- Linear-identifier rule: clean — OR — `<path>:<line>` cite template note.
- Editing rules: clean — OR — `<path>:<line>` cite template note.

### Phase 2 — Supplementary patterns (skill-side catalog)

#### Pattern G2 — commit subject (mechanical sweep)
- `<sha> "<subject>"` — <defect description and rule cite>

#### Pattern H1 — future-tense
- `<path>:<line>` — `<text>` — rewrite to current-state-only or drop

#### Pattern S1 — cross-reference body accuracy
- `<path>:<line>` cites `ADR-XXXX §Foo`. Verified against `docs/adr/adr-XXXX-...md`: section exists, body says <quoted excerpt>. Verdict: confirm | refute | unclear.

Continue for every pattern G/H/I/M/S that applies.

### Recommendation

All Phase 1 + Phase 2 clean → ready to pair with code review. OR specific findings to address — priority labels per code-review-guideline.md (P0 blocker / P1 critical / P2 should-fix / P3 nit). Phase 1 findings carry the source guideline's priority; Phase 2 findings default to P3 unless the violated standard escalates them (e.g. H10 ADR rewrite = P1 when PR scope IS the ADR).
```

## Constraints (absolute)

- Do NOT modify any file. Read-only.
- Do NOT push, do NOT call `gh pr create`, do NOT post PR comments.
- Do NOT skip a pattern silently. Empty-result patterns report as `clean`.
- Do NOT charity-read the author's intent — if the prose claims a fact (section name, sibling-crate state, numeric pairing), open the source and verify it; do not assume it is true because the author wrote it. This is the entire reason Pattern S exists.
- Findings cite a rule / ADR / guideline section, not "I prefer".

When finished, return only the Markdown report. The orchestrator surfaces it to the user.
```

### Step 4: relay findings

Print the subagent's report verbatim. Do NOT re-summarize. Add at most one short Korean paragraph above the table framing which subsystem the diff advances (per `~/.claude/rules/shotloom.md` briefing tone), but only when there are non-clean findings.

### Step 5: loop

User fixes findings, re-invokes — restart from Step 1. Skill is idempotent.

## Binding rules

- **Default invocation is cold-start.** Never inline the sweep into the main session. If `shotloom-review-before-pr` reuses this catalog for pass B, its verification preamble controls the role framing; keep pattern and output rules.
- **Read-only by contract.** The Explore subagent type is read-only.
- **Re-read standards inside the subagent.** Main session does not need to load the docs standards.
- **Sibling skill split:** Rust/TS code quality lives in `shotloom-review-code`. This skill only covers docs / comment / markup / PR-prose / Linear-discipline.

## Related

- `shotloom-review-code` — paired skill for Rust/TS code quality + test coverage.
- `shotloom-review-before-pr` — umbrella router invoking code first, then docs.
- `docs/guidelines/pr-guideline.md` (in shotloom repo) — PR body shape.
- `docs/guidelines/commit-guideline.md` (in shotloom repo) — Conventional Commits.
- `docs/guidelines/documentation-standard.md` (in shotloom repo) — durable-knowledge rules.
- `docs/guidelines/adr-template.md` (in shotloom repo) — ADR template + Usage Notes.
- [reference.md](reference.md) — full bash command catalog for every pattern.
