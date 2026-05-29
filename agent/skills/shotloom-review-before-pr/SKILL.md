---
description: Run the Shotloom pre-PR review/fix loop and return prReady true/false.
argument-hint: ""
allowed-tools: Read, Write, Bash(git:*), Bash(pwd)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-review-before-pr

## Role

User-facing orchestrator. For ambiguous Shotloom task selection, start with
[`../shotloom-router/SKILL.md`](../shotloom-router/SKILL.md).

Run the pre-PR review/fix loop for the current Shotloom branch.

Contract:

```text
implemented branch code -> review findings -> implement blockers -> commit blocker fixes -> prReady true|false
```

This skill does not create PRs, decide mergeability, run broad CI-equivalent
gates, push commits, or mutate GitHub state.

This skill is a router. Review child skills produce findings. This skill sends
blocker findings to [`../shotloom-implement-code/SKILL.md`](../shotloom-implement-code/SKILL.md)
and repeats review until blockers are gone or implementation needs user input.

## Arguments

No arguments. Review `git diff origin/main...HEAD` from the current Shotloom
worktree.

Mode overrides belong to
[`../shotloom-decide-review-mode/SKILL.md`](../shotloom-decide-review-mode/SKILL.md).

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
git fetch origin main
branch=$(git rev-parse --abbrev-ref HEAD); echo "$branch"
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git log --oneline origin/main..HEAD
git status --short
```

Refuse if `HEAD` is `main`, the branch has zero commits ahead of
`origin/main`, cwd is not a Shotloom worktree, or the initial worktree is dirty.
After `shotloom-implement-code` runs inside this loop, review child skills may
include the current-loop working-tree changes in their next pass.

### Step 2: Review Mode Decision

Run [`../shotloom-decide-review-mode/SKILL.md`](../shotloom-decide-review-mode/SKILL.md)
and record its JSON output.

### Step 3: Selected Main Review

If `needsTriad=false`:

1. Run [`../shotloom-review-code/SKILL.md`](../shotloom-review-code/SKILL.md).
2. Capture its findings.

If `needsTriad=true`:

1. Run [`../shotloom-review-triad/SKILL.md`](../shotloom-review-triad/SKILL.md).
2. Capture its merged findings.

### Step 4: Handle Code Blockers

Read `references/PROCESS_POLICY.md` -> `Finding JSON Schema`.
Normalize code or triad findings into the schema.

If any finding has `blocker=true`:

1. Resolve the code blocker path with
   `agent/lib/resolve-local-artifact-path.mjs`:
   ```bash
   knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
   safe_branch="$(git rev-parse --abbrev-ref HEAD | tr '/[:space:]' '--')"
   node "$knitten_root/agent/lib/resolve-local-artifact-path.mjs" \
     --root "$knitten_root" --create shotloom before-pr stl-<N> "$safe_branch" code-blockers
   ```
   Write normalized blocker findings to the returned `absolutePath`.
2. Run [`../shotloom-implement-code/SKILL.md`](../shotloom-implement-code/SKILL.md)
   with that JSON path.
3. Re-run Step 3 on the updated branch.
4. If implementation stops for missing input or a product/design question,
   render `Readiness JSON` with `prReady=false` and `phase="code-review"`.
5. If code blockers reach zero and the worktree has fixes from this loop,
   stage only those files and run [`../shotloom-commit/SKILL.md`](../shotloom-commit/SKILL.md).
   If commit approval, hook failure, or missing staged files stops the commit,
   render `Readiness JSON` with `prReady=false` and `phase="commit-handoff"`.
6. Otherwise repeat until code blockers are zero.

If no code blocker exists, continue to Step 5.

### Step 5: Docs Review

Run [`../shotloom-review-docs/SKILL.md`](../shotloom-review-docs/SKILL.md).
Capture its findings.

### Step 6: Handle Docs Blockers

If any docs finding has `blocker=true`:

1. Resolve the docs blocker path with
   `agent/lib/resolve-local-artifact-path.mjs`:
   ```bash
   node "$knitten_root/agent/lib/resolve-local-artifact-path.mjs" \
     --root "$knitten_root" --create shotloom before-pr stl-<N> "$safe_branch" docs-blockers
   ```
   Write normalized blocker findings to the returned `absolutePath`.
2. Run [`../shotloom-implement-code/SKILL.md`](../shotloom-implement-code/SKILL.md)
   with that JSON path.
3. Re-run Step 5 on the updated branch.
4. If implementation stops for missing input or a product/design question,
   render `Readiness JSON` with `prReady=false` and `phase="docs-review"`.
5. If docs blockers reach zero and the worktree has fixes from this loop,
   stage only those files and run [`../shotloom-commit/SKILL.md`](../shotloom-commit/SKILL.md).
   If commit approval, hook failure, or missing staged files stops the commit,
   render `Readiness JSON` with `prReady=false` and `phase="commit-handoff"`.
6. Otherwise repeat until docs blockers are zero.

Non-blocking docs findings do not change readiness. Include them in the output
findings list.

If no blocker remains, continue to Step 7.

### Step 7: Readiness Summary

Apply `PROCESS_POLICY.md` -> `Readiness JSON` and `Review Summary`.
Before printing the final JSON, write the same object to:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
safe_branch="$(git rev-parse --abbrev-ref HEAD | tr '/[:space:]' '--')"
result_path="$(
  node "$knitten_root/agent/lib/resolve-local-artifact-path.mjs" \
    --root "$knitten_root" --create shotloom before-pr stl-<N> "$safe_branch" readiness \
    | jq -r '.absolutePath'
)"
```

If no blocker remains, output:

```json
{
  "prReady": true,
  "phase": "complete",
  "branch": "<branch>",
  "headSha": "<git rev-parse HEAD>",
  "dirty": false,
  "resultPath": ".agent-local/shotloom/before-pr/stl-<N>/<branch>/readiness.json",
  "needsTriad": "<Step 2 needsTriad>",
  "blockersRemaining": 0,
  "findings": []
}
```
