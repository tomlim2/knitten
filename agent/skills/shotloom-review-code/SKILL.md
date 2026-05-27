---
description: Cold-start Rust/TS code-quality review via Explore subagent using resolver-selected Shotloom guidance and supplemental patterns.
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(pwd), Bash(cd:*), Bash(node:*)
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

Cold-start code-quality review for a Shotloom branch.

This skill owns one leaf contract:

```text
Shotloom guidance + accumulated review references + branch diff -> findings JSON
```

It does not fix findings or route to implementation. Caller workflows decide
what to do with the findings.

## Arguments

None. Operates on the current branch change set from the Shotloom worktree.
Use `git diff origin/main...HEAD` for committed branch changes. When called
inside a before-PR fix loop after `shotloom-implement-code`, also include the
current working-tree changes produced by that loop.

## Workflow

### Step 1: Worktree Sanity

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
git status --short
```

Refuse if HEAD is `main`, branch has zero commits ahead of `origin/main`, or cwd is not a shotloom worktree.

### Step 2: Load Shotloom Guidance

Run this before reading or dispatching any review guidance:

```bash
node <this-skill>/scripts/resolve-guidance.mjs --input=branch-diff --profile=review-code --surface=rust,ts,bridge
```

Read every existing Shotloom file listed in `read[]`. If `missing[]` is
non-empty, stop and report the missing configured guidance.

### Step 3: Load Accumulated Review References

Read:

- `reference.md`
- `reference-promoted.md`

These files contain recurring findings and review patterns that are not already
owned by the Shotloom repo guidance.

### Step 4: Applicability Check

```bash
rust_changed=$(git diff --name-only origin/main...HEAD -- '*.rs' | wc -l | tr -d ' ')
rust_test_changed=$(git diff --name-only origin/main...HEAD -- 'crates/**/tests/**/*.rs' 'crates/**/tests/*.rs' 'crates/**/src/**/*.rs' | rg '(^|/)tests(/|_)|_test\.rs$|/test_' -c || true)
ts_changed=$(git diff --name-only origin/main...HEAD -- '*.ts' '*.tsx' | wc -l | tr -d ' ')
echo "rust=$rust_changed rust_test=$rust_test_changed ts=$ts_changed"
```

If `rust_changed + ts_changed == 0`, report `Code review skipped: no Rust or
TS diff.` and stop.

### Step 5: Review Diff

Invoke the `Agent` tool with `subagent_type: Explore`. Use the subagent brief
below as `prompt`. Set `description` to `Code review against <branch>`.

#### Subagent brief

````text
You are a cold-start code reviewer for the Shotloom repo. Review only the diff,
resolver-loaded guidance, and directly cited evidence. Treat commit and PR text
as claims to verify.

## Read First

1. The guidance resolver output from Step 2. Read every existing Shotloom file
   listed in `read[]`.
2. `reference.md` — recurring review findings and stable sweep catalog.
3. `reference-promoted.md` — promoted review patterns generalized from
   actual Shotloom PR findings.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- Committed file list: `git diff --name-only origin/main...HEAD`
- Committed content: `git diff origin/main...HEAD` (full hunks)
- If the caller reports current-loop working-tree changes, also inspect
  `git diff` and `git diff --cached`.

## Review

### Shotloom guidance

Walk the resolver-loaded in-repo code review guidelines in source order against
the diff. Report findings with the source priority. The resolver-loaded
guideline is the authority for what counts as a defect.

### Accumulated review references

Run only the triggered checks from `reference.md` and `reference-promoted.md`.
These references may add grep-catchable sweeps or promoted defect patterns that
are not already covered by the resolver-loaded Shotloom guidance. Shotloom
guideline priorities remain authoritative.

Triage taxonomy (both phases):
- **defect** — cite the rule (in-repo §-section, directly related ADR, or skill-side pattern) it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-design-judgment** — describe the tradeoff and propose a default.

Report empty checks only when they clarify coverage.

## Output format

```markdown
## Code review — branch <branch>

### Applicability — rust:N ts:N

Ran: resolver-loaded Shotloom guidance; triggered accumulated review references.

### Shotloom guidance findings

Report findings only.

### Accumulated reference findings

Report findings only.

### Findings JSON

Include one normalized JSON block after the Markdown findings:

`{"phase":"code-review","findings":[]}`
```

## Constraints

- Read-only.
- Do not push, create PRs, or post comments.
- Verify factual claims against code or cited sources.
- Findings cite a rule, directly related ADR, or guideline section.

Return the Markdown report.
````

### Step 6: Output Findings

Print the subagent report without re-summarizing the findings.

## Binding rules

- **Default invocation is cold-start.** Use the Explore subagent for the review.
- **Read-only by contract.** The Explore subagent type is read-only.
- **Read standards inside the subagent.** Main session does not need to load Shotloom guidelines directly.
- **Leaf contract:** this skill returns findings only; implementation routing
  belongs to `shotloom-review-before-pr`.
- **Sibling skill split:** docs/wording discipline lives in `shotloom-review-docs`.
  This skill only covers Rust/TS code quality patterns + test coverage.

## Related

- `shotloom-review-docs` — paired skill for docs / comment / markup discipline.
- `shotloom-review-before-pr` — router invoking code first, then docs.
- `~/.claude/rules/test-write.md` — unit test requirement (Pattern T enforces).

## Additional Resources

[reference.md](reference.md) — stable bash command catalog.
[reference-promoted.md](reference-promoted.md) — review-derived promoted patterns loaded after the stable catalog.
