---
description: Decide whether a Shotloom branch needs triad review by evaluating a checklist against the branch diff.
argument-hint: "[force single|force standard|force triad]"
allowed-tools: Read, Grep, Bash(git:*), Bash(rg:*), Bash(pwd)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/shotloom.md
exclude-when: unreal,obsidian
---

# shotloom-decide-review-mode

Return `needsTriad: true | false` for the current Shotloom branch.

## Arguments

| Argument | Effect |
|---|---|
| `force single` | Return `needsTriad=false` after Step 1 evidence. |
| `force standard` | Return `needsTriad=false` after Step 1 evidence. |
| `force triad` | Return `needsTriad=true` after Step 1 evidence. |

No argument is valid. Default behavior evaluates the checklist below.

## Workflow

### Step 1: Worktree Sanity

Run from the Shotloom worktree:

```bash
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "ERROR: not in git repo"; exit 1; }
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *) echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"; exit 1 ;;
esac
cd "$toplevel"
branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git fetch origin main
git diff --shortstat origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Stop if `HEAD` is `main`, cwd is not a Shotloom worktree, or the branch has no
diff against `origin/main`.

### Step 2: Read Review-Mode Reference

Read
`agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md`.
Use its Surface Map and Decision Rules as the authoritative source for checklist
meaning.

### Step 3: Evaluate Checklist

Evaluate the trigger table from `REVIEW_MODE.md` -> `Decision Rules`.

If any trigger is true, return `needsTriad=true`.
If every trigger is false, return `needsTriad=false`.

### Step 4: Output JSON

Output one JSON block:

```json
{
  "needsTriad": true,
  "reason": "Rust contract code, TypeScript bridge consumer, and fixture snapshots changed together.",
  "triggers": [
    "bridge-api-contract",
    "rust-ts-contract",
    "runtime-proof-artifacts"
  ],
  "signals": {
    "branch": "<branch>",
    "filesChanged": 0,
    "linesAdded": 0,
    "linesDeleted": 0,
    "touchedSurfaces": []
  }
}
```

Rules:

- `reason` names the highest-risk true row in one sentence.
- `triggers` lists every true row.
- `signals` records the diff evidence used for the checklist.
- If `needsTriad=false`, use `triggers: []`.

## Related

- [`shotloom-review-before-pr`](../shotloom-review-before-pr/SKILL.md) — consumes this decision before code review
- [`shotloom-review-code`](../shotloom-review-code/SKILL.md) — single review path
- [`shotloom-review-before-pr/references/REVIEW_MODE.md`](../shotloom-review-before-pr/references/REVIEW_MODE.md) — authoritative checklist meaning
