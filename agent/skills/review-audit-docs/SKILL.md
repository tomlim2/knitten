---
description: "Audit doc / comment changes via subagent — future-tense speculation, stale 'currently does X' claims, unclear names, broken cross-refs, internal contradictions. Dispatches an Explore agent, verifies findings, reports defects with file:line + provenance."
argument-hint: "[file path | 'diff' (default) | git rev]"
allowed-tools: Bash(git:*), Bash(rg:*), Bash(grep:*), Bash(ls:*), Bash(find:*), Bash(awk:*), Bash(sed:*), Read, Agent
---

# review-audit-docs

Read-only audit pass focused on **documentation and comments** in a code change. Dispatches an Explore subagent with a structured prompt, then verifies each finding against the live tree before presenting. Does not modify files.
The report is an internal-consumption review artifact. Do not write Obsidian
vault notes from this skill.

Pairs naturally with code-quality reviews (e.g. `/shotloom-review-before-pr`) — the code review checks logic; this checks the prose.

## Usage

```
/review-audit-docs                # all docs/comments in `merge-base origin/main HEAD..HEAD` diff
/review-audit-docs diff           # same as default
/review-audit-docs path/to/file   # audit a specific file's added doc/comment lines
/review-audit-docs <rev>          # audit `<rev>..HEAD` instead of merge-base
```

## Audit dimensions

Each finding cites **one** dimension. Skill always reports clean dimensions explicitly so silent skips are visible.

| Dim | Defect class | Example |
|-----|-------------|---------|
| A | Future-tense speculation without a concrete issue ID | `// will be wired in next pass` (no `STL-NN` / `JIRA-NN`) |
| B | Stale "currently does X" claim — doc disagrees with live code | doc says `foo() calls bar()` but `rg bar(` returns 0 hits in caller |
| C | Unclear / awkward / inconsistent names — public idents, struct fields, constants | `rotations: HashMap<...>` vs `xiao_rotations: HashMap<...>` siblings, prefix drift |
| D | Cross-references that don't resolve — paths, fn names, anchors, diagnostic codes | `crates/foo/...` cited but doesn't exist; `MyType` backticked but never defined |
| E | Internal contradictions — module doc vs actual code | doc says `pins X` but assert checks Y |

## Workflow

### Step 1: Resolve scope

```bash
# Default: full diff from merge-base
BASE=$(git merge-base origin/main HEAD)
git diff --name-only "$BASE..HEAD"
```

If user passed a path, scope to that file. If a rev, use `<rev>..HEAD`.

Refuse if:
- Not in a git repo
- Diff is empty (nothing to audit)
- HEAD == base (no commits to review)

### Step 2: Dispatch the Explore subagent

Use this prompt template (substitute `{WORKING_DIR}`, `{BRANCH}`, `{BASE}`, `{FILE_LIST}`):

```
You are doing a documentation/comment audit. Read-only. Report findings; do not modify anything.

**Working directory**: {WORKING_DIR}
**Branch**: {BRANCH}
**Compare to**: merge-base = {BASE}

**Files to audit** (only these; everything outside this list is out of scope):
{FILE_LIST}

**Audit dimensions** (one finding = one file:line + the specific defect):

A. Future-tense speculation without a concrete issue ID. Phrases like "will be added", "lands in a follow-up", "planned", "next pass" — defect unless paired with a specific issue ID like `STL-NN`. The repo rule is: doc must describe what IS, not what MIGHT BE.

B. Stale "currently does X" claims. The doc must match the *current* code state on this branch. For every "is wired" / "calls" / "flows through" / "has no live caller" claim, run rg to verify. If a doc claims `foo()` calls `bar()`, run `rg 'bar\(' crates/.../src/` to confirm the call site exists.

C. Unclear / awkward / inconsistent names. Public identifiers, struct fields, constants, function names. Look for sibling-prefix inconsistencies, names that don't match what they hold, names obscure to a cold reader. Don't bikeshed style — only flag genuine clarity defects.

D. Cross-references that don't resolve. Paths cited (`crates/foo/src/bar.rs`), backticked function names, fixture suffixes, diagnostic codes, anchors. Verify each one exists.

E. Internal contradictions. Module doc vs actual code. E.g. doc says `pins X` but assert checks Y. Doc says fn takes 3 args but signature has 4.

**Reporting format** (one block per finding):

## Finding N (severity: critical | nit)
**File**: <path>:<line>
**Dimension**: A | B | C | D | E
**What I see**: [quote the exact line]
**Why it's a defect**: [one sentence]
**Verification**: [for B/D — the rg command + result that proves it]

If a dimension has no findings, say `Dimension X: clean`.

Lead with critical findings; nits after. Cap report at ~600 words. Do not propose fixes — just report defects.
```

### Step 3: Verify each finding

The subagent's report is a hypothesis, not a verdict. For every finding:

1. **B / D findings**: re-run the agent's verification command yourself. If the command fails or doesn't actually prove the claim, downgrade or drop the finding.
2. **All findings**: run `git blame` on the cited line. If the line was authored before this PR's merge-base, mark **provenance: pre-existing** in the report.

```bash
git blame -L <line>,<line> <file>
git log --oneline "$BASE..HEAD" -- <file>   # did this PR touch this file?
```

Pre-existing findings are still real defects but the user decides scope (drive-by fix vs follow-up).

### Step 4: Present findings

```
## Audit summary

Scope: <N files, M commits>
Subagent findings: <K> | After verification: <K'>

## Findings

### Finding 1 (severity: critical, provenance: PR-introduced)
[block per spec above]

### Finding 2 (severity: nit, provenance: pre-existing)
...

## Clean dimensions
A: clean · B: clean · C: 1 finding · D: 1 finding · E: clean
```

End with one sentence on next action — default "drive-by fix in this PR vs spawn follow-up vs leave as-is".

### Step 5: Do not auto-fix

This skill is read-only. If the user asks to fix, that's a separate turn — do not stack a fix into the audit run.

## Binding rules

- **Read-only.** Never modify files; never push; never call `gh pr create`.
- **Verify the agent.** Subagent reports describe intent, not proof. Re-run `rg` / `git blame` for every finding before presenting.
- **Always check provenance.** A defect outside `merge-base..HEAD` was not caused by this PR — flag it but separate from PR-introduced findings.
- **Report clean dimensions explicitly.** Silent skips defeat the checklist.
- **One finding = one file:line + one dimension.** No conjoined or vague findings.
- **No fixes.** Even a typo fix during audit creates ambiguity.

## Related

- `~/.claude/skills/shotloom-review-before-pr/SKILL.md` — code-quality review pass; complementary, runs first
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation; this skill should run before that
- `agent/skills/shotloom-review-code/reference.md` — repo-specific Pattern H/I/T context
