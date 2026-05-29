---
description: Leaf/component Shotloom triad review runner. Prefer shotloom-router or shotloom-review-before-pr for full pre-PR readiness.
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(pwd), Bash(node:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-review-triad

Run triad review for a Shotloom branch when
`shotloom-decide-review-mode` returns `needsTriad=true`.

## Arguments

No arguments. Operates on the current branch change set from the Shotloom
worktree. Use `git diff origin/main...HEAD` for committed branch changes. When
called inside a before-PR fix loop after `shotloom-implement-code`, also include
the current working-tree changes produced by that loop.

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

Refuse if `HEAD` is `main`, the branch has zero commits ahead of `origin/main`,
or cwd is not a Shotloom worktree.

### Step 2: Resolve Guidance First

Run this before building the review brief or dispatching role agents:

```bash
node <this-skill>/scripts/resolve-guidance.mjs --input=branch-diff --profile=review-triad
```

Read every existing Shotloom file listed in `read[]`. If `missing[]` is
non-empty, stop and report the missing configured guidance.

### Step 3: Build Review Brief

Read `../shotloom-review-before-pr/references/REVIEW_BRIEF.md`.
Render `Review Brief` and `Brief Verifier`.

If the verifier fails, repair the brief from direct diff evidence before
dispatching role agents.

### Step 4: Dispatch Role Reviews

Read `../shotloom-review-before-pr/references/TRIAD_REVIEW.md`.

Dispatch three read-only Explore subagents:

| Role |
|---|
| Runtime/Contract Engineer |
| QA/Test Automation Engineer |
| Maintainer/Product Engineer |

Each role receives the Review Brief and its role slice. Each role reports
findings using the role report template.

### Step 5: Merge Findings

Apply `TRIAD_REVIEW.md` -> `Merge Rules`.
Normalize findings with `PROCESS_POLICY.md` -> `Finding JSON Schema`.

Output one findings JSON block. Do not edit files, push, create PRs, post
comments, or mutate Linear/GitHub.

## Related

- [`shotloom-decide-review-mode`](../shotloom-decide-review-mode/SKILL.md)
- [`shotloom-review-before-pr`](../shotloom-review-before-pr/SKILL.md)
- [`shotloom-review-code`](../shotloom-review-code/SKILL.md)
