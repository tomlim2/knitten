---
description: Cold-start docs / wording / markup review via Explore subagent — Patterns G + H + I + M + S. Pair skill of shotloom-review-code
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(node:*), Bash(pwd), Bash(cd:*)
---

# shotloom-review-docs

Cold-start docs / wording / markup review for a Shotloom branch before opening a PR. Dispatches an Explore subagent that re-reads `docs/guidelines/pr-guideline.md`, `commit-guideline.md`, `documentation-standard.md`, and `adr-template.md` fresh on every invocation, runs Patterns G + H + I + M + S against the current diff, and reports findings. The subagent has zero context about the author's intent — that is the point. The current author cannot reliably review their own prose; a cold-start subagent is the structural fix for the doc-claim self-rationalization failure mode.

Pair skill: `shotloom-review-code` covers Rust/TS code quality. Umbrella `shotloom-review-before-pr` invokes both in parallel.

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

## Read fresh (in full, every invocation)

1. `<worktree>/docs/guidelines/pr-guideline.md` — PR title/body conventions.
2. `<worktree>/docs/guidelines/commit-guideline.md` — Conventional Commits + body discipline.
3. `<worktree>/docs/guidelines/documentation-standard.md` — durable-knowledge rules, ADR scope §5.7, repository language.
4. `<worktree>/docs/guidelines/adr-template.md` — ADR template, Usage Notes, Litmus test, Anti-patterns, Editing rules.
5. `<worktree>/docs/guidelines/code-review-guideline.md` — review priorities P0–P3.
6. `~/.claude/skills/shotloom-review-docs/reference.md` — full bash command catalog for Patterns G1–G7, H1–H11, I1–I4, M1–M5, plus S1/S2/S3 trigger checks.

Re-read every invocation. The standards are amended as new defect classes are found.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main..HEAD`
- Content: `git diff origin/main..HEAD` (full hunks)

## Run every applicable pattern

For each pattern in reference.md:

- **G (always):** G1 crate ownership, G2 commit subject conventions, G3 PR shape vs recent merged PRs, G4 branch name, G5 ADR/tech-debt coherence on structure shifts, G6 doc-paths validator, G7 fix-commit ↔ regression-test pairing.
- **H (md or rust diff):** H1 future-tense, H2 stale status, H3 cross-crate citation accuracy, H4 naming-convention coherence, H5 ADR section-citation accuracy, H6 claimed Out-of-Scope honored, H7 past-state contrast, H8 Linear-ID in tree files, H9 ADR execution-status leak, H10 ADR Status/Amendment discipline, H11 long rationale in `//!` instead of README.
- **I (moves):** I1 removed pub use refs still cited, I2 deleted/renamed file paths still cited, I3 removed imports still cited in ADRs/READMEs, I4 unresolved rustdoc links via `cargo doc --workspace --exclude shotloom-desktop --no-deps`.
- **M (yaml/json):** M1 yaml syntax, M2 action pinning, M3 json parseability, M4 plaintext secrets, M5 concurrency group on race-prone workflows.
- **S (mechanical trigger check):** scan added prose for S1 (`ADR-NNNN §SectionName`, `docs/.../*.md §...`, `<crate>/README.md §...`), S2 (`scaffold`/`stub`/`WIP`/`empty`/`owns X`/`produces Y`/`only consumer is Z`/`no output yet`), S3 (literal numeric constant paired with directional/positional claim like `0.6 is forward of X`, `index 5 is the wrist`). For each trigger, open the cited source and verify the claim against the literal text. Report each S finding as **confirm | refute | unclear** with the cited text quoted.

For each hit, triage as one of:
- **defect** — cite the rule, ADR, or guideline section it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-judgment** — describe the tradeoff and propose a default.

Do NOT skip a pattern silently. If a pattern produces zero hits, report it as `Pattern XN — clean`.

## Output format

```markdown
## Docs review — branch <branch>

### Applicability — md:N rust:N yaml:N json:N moved:N

Ran: <pattern list>. N/A: <pattern list with reason>.

### Findings

#### Pattern G2 — commit subject
- `<sha> "<subject>"` — <defect description and rule cite>

#### Pattern H1 — future-tense
- `<path>:<line>` — `<text>` — rewrite to current-state-only or drop

#### Pattern S1 — cross-reference body accuracy
- `<path>:<line>` cites `ADR-XXXX §Foo`. Verified against `docs/adr/adr-XXXX-...md`: section exists, body says <quoted excerpt>. Verdict: confirm | refute | unclear.

(... continue for every pattern ...)

### Recommendation

All patterns clean → ready to pair with code review. OR specific findings to address — priority labels per code-review-guideline.md (P0 blocker / P1 critical / P2 should-fix / P3 nit). H10/H11 may escalate to P1 per their source-standard rules.
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

- **Cold-start subagent dispatch is mandatory every invocation.** Never inline the sweep into the main session. The cold-start guarantee is the entire point.
- **Read-only by contract.** The Explore subagent type is read-only.
- **Re-read standards inside the subagent.** Main session does not need to load `pr-guideline.md` etc.
- **Sibling skill split:** Rust/TS code quality lives in `shotloom-review-code`. This skill only covers docs / comment / markup / PR-prose / Linear-discipline.

## Related

- `shotloom-review-code` — paired skill for Rust/TS code quality + test coverage.
- `shotloom-review-before-pr` — umbrella router invoking both in parallel.
- `docs/guidelines/pr-guideline.md` (in shotloom repo) — PR body shape.
- `docs/guidelines/commit-guideline.md` (in shotloom repo) — Conventional Commits.
- `docs/guidelines/documentation-standard.md` (in shotloom repo) — durable-knowledge rules.
- `docs/guidelines/adr-template.md` (in shotloom repo) — ADR template + Usage Notes.

## Additional Resources

[reference.md](reference.md) — full bash command catalog for every pattern.
