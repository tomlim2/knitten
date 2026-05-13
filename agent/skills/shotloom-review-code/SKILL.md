---
description: Cold-start Rust/TS code-quality review via Explore subagent — Patterns A–F + T (test coverage). Pair skill of shotloom-review-docs
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*)
---

# shotloom-review-code

Cold-start code-quality review for a Shotloom branch before opening a PR. Dispatches an Explore subagent that re-reads `docs/guidelines/review-rust.md` and `code-review-guideline.md` fresh on every invocation, runs Patterns A–F + T against the current diff, and reports findings. The subagent has zero context about the author's intent — that is the point. The current author cannot reliably review their own prose / code because they silently re-rationalize claims; a cold-start subagent is the structural fix.

Pair skill: `shotloom-review-docs` covers docs/wording discipline. Umbrella `shotloom-review-before-pr` invokes both in parallel.

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

```bash
rust_changed=$(git diff --name-only origin/main..HEAD -- '*.rs' | wc -l | tr -d ' ')
ts_changed=$(git diff --name-only origin/main..HEAD -- '*.ts' '*.tsx' | wc -l | tr -d ' ')
echo "rust=$rust_changed ts=$ts_changed"
```

If `rust_changed + ts_changed == 0`, report `Code review N/A — no Rust or TS diff. Run /shotloom-review-docs for the markup-side review.` and stop. Do NOT dispatch a subagent on an empty code surface.

### Step 3: dispatch cold-start subagent

Invoke the `Agent` tool with `subagent_type: Explore`. Pass the subagent brief below VERBATIM as `prompt`. Set `description` to `Code review (cold-start) — Patterns A–F + T against <branch>`.

#### Subagent brief (copy verbatim)

```
You are a cold-start code reviewer for the Shotloom repo. You have ZERO context about the diff's author, intent, or surrounding session. Approach this as a senior engineer who has never seen the code, with no charity and no author empathy. The author's commit message and PR body are hypotheses, not conclusions.

## Read fresh (in full, every invocation)

1. `<worktree>/docs/guidelines/review-rust.md` — canonical Rust review spec. The only authority for what counts as a Rust defect on this repo.
2. `<worktree>/docs/guidelines/code-review-guideline.md` — review process, P0/P1/P2/P3 priorities.
3. `~/.claude/skills/shotloom-review-code/reference.md` — full bash command catalog for Patterns A1–A8, B1–B2, C1–C3, D1–D4, E1–E3, F1–F3, T1–T4.

Re-read every invocation. The standards are amended as new defect classes are found.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main..HEAD`
- Content: `git diff origin/main..HEAD` (full hunks)

## Run every pattern

For each pattern in reference.md (A1, A2, A3, A4, A5, A6, A8, B1, B2, C1, C2, C3, D1, D2, D3, D4, E1, E2, E3, F1, F2, F3, T1, T2, T3, T4):

1. Run the sweep command from reference.md.
2. For each hit, triage as one of:
   - **defect** — cite the rule, ADR, or guideline section it violates.
   - **false-positive** — cite the line of reasoning that exempts it.
   - **needs-design-judgment** — describe the tradeoff and propose a default.
3. Pattern T (test coverage): cross-reference T1 (changed public surface) against T2 (new tests in the diff). Every T1 item must map to ≥1 T2 entry or be explicitly named in the PR body as covered by a pre-existing test.

Do NOT skip a pattern silently. If a pattern produces zero hits, report it as `Pattern XN — clean`.

## Output format

```markdown
## Code review — branch <branch>

### Applicability — rust:N ts:N

Ran: <pattern list>. N/A: <pattern list with reason — typically "no Rust diff" or "no Cargo.toml change">.

### Findings

#### Pattern A1 — backticked identifiers
- `<path>:<line>` — `<identifier>` <one-line defect description and rule cite>

#### Pattern A2 — file path references
- clean

(... continue for every pattern ...)

### Recommendation

All patterns clean → ready for the docs review. OR specific findings to address — priority labels per code-review-guideline.md (P0 blocker / P1 critical / P2 should-fix / P3 nit).
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

- **Cold-start subagent dispatch is mandatory every invocation.** Never inline the sweep into the main session. The cold-start guarantee is the entire point of the skill — author-self-review is the failure mode this replaces.
- **Read-only by contract.** The Explore subagent type is read-only.
- **Re-read standards inside the subagent.** Main session does not need to load `review-rust.md`.
- **Sibling skill split:** docs/wording discipline lives in `shotloom-review-docs`. This skill only covers Rust/TS code quality patterns + test coverage.

## Related

- `shotloom-review-docs` — paired skill for docs / comment / markup / PR-prose discipline.
- `shotloom-review-before-pr` — umbrella router invoking both in parallel.
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec.
- `docs/guidelines/code-review-guideline.md` (in shotloom repo) — review priorities.
- `~/.claude/rules/test-write.md` — unit test requirement (Pattern T enforces).

## Additional Resources

[reference.md](reference.md) — full bash command catalog for every pattern.
