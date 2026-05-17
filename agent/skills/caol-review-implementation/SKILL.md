---
description: Review completed caol-ila implementations against the owning spec, diff, validators, generated indexes, routing metadata, and deploy-target sync before commit or handoff.
argument-hint: "[spec-slug-or-path] [--staged|--working|--base <rev>]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*), Bash(test:*), Bash(wc:*), Bash(diff:*)
domains: caol
repo-keys: caol-ila
languages: markdown,yaml,json
task-types: review
context-profile: caol-authoring
---

# caol-review-implementation

Review a completed caol-ila implementation before commit or handoff.

## Purpose

Use this after files have changed and before reporting, committing, or handing
off. The skill checks whether the implementation matches its spec and whether
the repo-level contracts still hold.

This is read-only. Report findings; do not patch, stage, commit, push, delete,
or mutate external services inside this review pass.

## Inputs

| Input | Meaning |
|-------|---------|
| no argument | infer from one changed `docs/plans/**/*.md` spec; otherwise run diff-only review |
| `<slug>` | resolve through the spec lifecycle search order |
| `<path>` | use that spec path |
| `--staged` | review staged diff |
| `--working` | review unstaged working tree diff |
| `--base <rev>` | compare `<rev>..HEAD` |

If more than one changed spec can own the work, stop and ask for the spec
slug. If no spec resolves, continue as diff-only and report that limitation.

## Related Review Skills

| Condition | Use |
|-----------|-----|
| one skill body needs depth audit | `caol-audit-skill` |
| docs/comments changed and wording risk is high | `review-audit-docs` |
| Shotloom PR review | `shotloom-review-before-pr` |
| web code or UI changed | `review-audit-web`, `review-audit-ux` |

Do not load sibling review bodies unless the changed files and user request
match that condition.

## Workflow

### Step 1: Resolve Scope

Run:

```bash
git status --short --branch
git diff --name-only
git diff --staged --name-only
git log --oneline origin/main..HEAD
```

Determine the review source:

| Case | Scope |
|------|-------|
| `--staged` | `git diff --staged` |
| `--working` | `git diff` |
| `--base <rev>` | `git diff <rev>..HEAD` |
| branch has commits ahead | `git diff origin/main...HEAD` |
| no ahead commits | working tree and staged diffs |

Record changed files and dirty state before reading bodies.

### Step 2: Resolve Spec

If the input is a slug, search:

```text
docs/plans/active/<slug>.md
docs/plans/proposed/<slug>.md
docs/plans/drafts/<slug>.md
docs/plans/parked/<slug>.md
docs/plans/completed/<slug>.md
docs/plans/archive/<slug>.md
docs/plans/<slug>.md
```

If multiple paths exist, stop and report duplicate lifecycle state.

If the input is a path, read that path.

If no input:

1. list changed `docs/plans/**/*.md`;
2. exclude `docs/plans/*-reports/**`, `docs/plans/reports/**`, `index.md`,
   and `README.md`;
3. if exactly one spec exists, read it;
4. if none exists, run diff-only review;
5. if more than one exists, stop and ask for the owning spec.

When a spec resolves, extract goals, non-goals, validation, risks, and
acceptance criteria. Treat the spec as the contract, not as proof.

### Step 3: Gather Evidence

Read only files needed to answer the review contract:

| Changed surface | Evidence |
|-----------------|----------|
| `agent/skills/*/SKILL.md` | skill body, `caol-make-skill`, line count |
| `agent/rules/*` | rule body and `agent/rules/index.md` |
| `agent/standards/*` | standard body and `agent/standards/index.md` |
| `agent/config/context-routing.json` | route profile, pilot file, fixture |
| `agent/config/taxonomy.json` | category and naming registry |
| `README.md` or `AGENT-HUB.md` | generated block freshness |
| `scripts/validate-llm-first.mjs` | validator behavior touched by the diff |
| `docs/plans/**` or `docs/milestones/*` | lifecycle status and links |

Do not scan broad sibling domains when the changed files do not touch them.

### Step 4: Run Checks

Always run:

```bash
git diff --check
node scripts/validate-llm-first.mjs
```

Run focused checks when relevant:

| Trigger | Command |
|---------|---------|
| routing metadata changed | `node scripts/validate-llm-first.mjs --check context-routing` |
| generated views changed | `node scripts/validate-llm-first.mjs --check generated-blocks` |
| skill/rule/standard changed | `node scripts/validate-llm-first.mjs --check length-caps` |
| taxonomy changed | `node scripts/validate-llm-first.mjs --check taxonomy` |
| spec or milestone links changed | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |

For shared-layer edits under `agent/skills`, `agent/rules`, `agent/standards`,
or `agent/commands`, verify the affected deploy target exists and matches when
the matching `~/.claude` path exists:

```bash
diff -rq ~/.claude/skills/<name> agent/skills/<name>
```

Use the corresponding top-level folder for rules, standards, and commands.

### Step 5: Review Contract

Classify findings:

| Severity | Meaning |
|----------|---------|
| P0 | corrupts policy, deletes data, leaks secrets, or makes validators unusable |
| P1 | implementation contradicts spec or required validator is red |
| P2 | missing acceptance proof, stale generated view, routing gap, or deploy sync gap |
| P3 | clarity, naming, or small follow-up that does not block commit |

Check:

1. Every changed file is inside the spec scope or explicitly justified.
2. Every non-goal remains excluded.
3. Every acceptance criterion has evidence.
4. Every validator command either passed or has an exact blocker.
5. Generated views match registries after config/inventory changes.
6. Routing metadata has a matching profile, pilot file, fixture, or exemption.
7. Docs describe current state only; no unimplemented capability is presented as
   available.
8. Shared-layer deploy target matches for edited subtrees.
9. No push, external mutation, or destructive operation happened during review.

Verify each finding against the live tree before reporting.

## Output

Lead with findings:

```markdown
## Findings

| Sev | File | Finding | Evidence |
|-----|------|---------|----------|
| P1 | path:line | ... | command or file evidence |

## Validation Evidence

| Command | Result |
|---------|--------|

## Residual Risk

## Summary
```

If no findings exist, say `No blocking findings.` and list validation commands.
If review ran without a spec, include `Spec: not resolved; diff-only review`.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | post-implementation review workflow |

## Related

- `docs/plans/caol-review-implementation.md`
- `agent/skills/caol-manage-spec/SKILL.md`
- `agent/skills/caol-audit-skill/SKILL.md`
- `agent/skills/review-audit-docs/SKILL.md`
