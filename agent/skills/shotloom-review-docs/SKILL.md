---
description: Cold-start docs / wording / markup review via Explore subagent — Patterns G + H + I + M + S. Pair skill of shotloom-review-code
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(grep:*), Bash(node:*), Bash(pwd), Bash(cd:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/shotloom.md
exclude-when: unreal,obsidian
---

# shotloom-review-docs

Standalone cold-start docs / wording / markup review for a Shotloom branch.

Output contract:

```text
Shotloom guidance + accumulated docs references + branch diff -> findings JSON
```

It does not fix findings or route to implementation. Caller workflows decide
what to do with the findings.

Pair skill: `shotloom-review-code` covers Rust/TS code quality.
`shotloom-review-before-pr` invokes this skill in the pre-PR readiness flow.

## Arguments

None. Operates on the current branch change set from the Shotloom worktree.
Use `git diff origin/main...HEAD` for committed branch changes. When called
inside a before-PR fix loop after `shotloom-implement-code`, also include the
current working-tree changes produced by that loop.

## Workflow

### Step 1: Worktree Sanity

```bash
knitten_root="$(bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo knitten | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')"
node "$knitten_root/agent/lib/shotloom-worktree-sanity.mjs" --require-ahead --allow-dirty
```

If this helper fails, stop. It verifies the current checkout is a non-main
`CINEV/shotloom` worktree with commits ahead of `origin/main`, then reports
dirty files and changed files.

### Step 2: Resolve Guidance First

Run this before reading or dispatching any review guidance:

```bash
node <this-skill>/scripts/resolve-guidance.mjs --input=branch-diff --profile=review-docs --surface=docs
```

Read every existing Shotloom file listed in `read[]`. If `missing[]` is
non-empty, stop and report the missing configured guidance.

### Step 3: applicability check

Group G covers repo conventions, doc paths, and coverage metadata. The other
groups gate on file-type presence:

```bash
md_changed=$(git diff --name-only origin/main...HEAD -- '*.md' | wc -l | tr -d ' ')
rust_changed=$(git diff --name-only origin/main...HEAD -- '*.rs' | wc -l | tr -d ' ')
yaml_changed=$(git diff --name-only origin/main...HEAD -- '*.yml' '*.yaml' | wc -l | tr -d ' ')
json_changed=$(git diff --name-only origin/main...HEAD -- '*.json' | wc -l | tr -d ' ')
moved=$(git diff --name-status origin/main...HEAD | grep -cE '^[DR]' || true)
echo "md=$md_changed rust=$rust_changed yaml=$yaml_changed json=$json_changed moved=$moved"
```

| Group | Runs when |
|-------|-----------|
| G — repo conventions, commit / PR / branch shape, doc-paths validator, ci-rust-coverage | branch has commits |
| H — doc / comment discipline (future-tense, stale status, cross-crate citations, ADR discipline) | `md_changed > 0` OR `rust_changed > 0` (added prose may live in `///`) |
| I — reverse-side audit (PR-induced staleness in unchanged prose) | `moved > 0` (any rename / removal / deletion) |
| M — markup / manifest sanity (workflow yaml, JSON parseability, action pinning, secrets refs) | `yaml_changed + json_changed > 0` |
| S — subagent verification of S1/S2/S3 load-bearing prose claims | any added prose carries S1/S2/S3 triggers — grep is mechanical, verification is the subagent's job |

While commits exist on the branch, at least G applies. A workflow-yaml-only PR
runs G + M, plus H if added comment text exists.

### Step 4: dispatch cold-start subagent

Invoke the `Agent` tool with `subagent_type: Explore`. Use the subagent brief
below as `prompt`. Set `description` to `Docs review against <branch>`.

#### Subagent brief

````text
You are a cold-start docs / wording / markup reviewer for the Shotloom repo.
Review only the prose diff, resolver-loaded guidance, and directly cited
evidence. Treat commit and PR text as claims to verify.

## Read First

1. The guidance resolver output from Step 2. Read every existing Shotloom file
   listed in `read[]`.
2. `reference.md` — supplementary sweep catalog for Patterns G + H + I + M + S.

## Diff under review

- Worktree: `<pwd>`
- Branch: `<branch>`
- Committed file list: `git diff --name-only origin/main...HEAD`
- Committed content: `git diff origin/main...HEAD` (full hunks)
- If the caller reports current-loop working-tree changes, also inspect
  `git diff` and `git diff --cached`.

## Two-phase execution

### Phase 1 — In-repo canonical walk

Walk the resolver-loaded in-repo docs, PR, commit, ADR, and review-priority
guidelines in source order against the diff. Report findings with source
priority. The resolver-loaded in-repo guideline is the authority.

### Phase 2 — Skill-side supplemental review

Run the triggered G/H/I/M/S checks from `reference.md`. Resolver-loaded
Shotloom guidance remains authoritative.

Triage taxonomy (both phases):
- **defect** — cite the rule (in-repo §-section, ADR, or skill-side pattern) it violates.
- **false-positive** — cite the line of reasoning that exempts it.
- **needs-judgment** — describe the tradeoff and propose a default.

Report empty checks only when they clarify coverage.

## Output format

```markdown
## Docs review — branch <branch>

### Applicability — md:N rust:N yaml:N json:N moved:N

Ran: Phase 1 resolver-loaded Shotloom guidance; Phase 2 triggered supplemental
checks.

### Phase 1 — In-repo canonical checks

Report findings only.

### Phase 2 — Supplementary patterns (skill-side catalog)

Report only triggered G/H/I/M/S patterns. For S-patterns, include
confirm/refute/unclear evidence from the cited source.

### Findings JSON

Include one normalized JSON block after the Markdown findings:

`{"phase":"docs-review","findings":[]}`
```

## Constraints

- Read-only.
- Do not push, create PRs, or post comments.
- Verify factual claims against code or cited sources.
- Findings cite a rule, ADR, or guideline section.

Return the Markdown report.
````

### Step 5: relay findings

Print the subagent report without re-summarizing the findings.

## Binding Rules

- Cold-start review uses the Explore subagent.
- Read-only by contract.
- Read standards inside the subagent.
- Review only docs, comments, markup, and Linear discipline.
