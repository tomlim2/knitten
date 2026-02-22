---
description: Prepare art branch for merge into develop
argument-hint: "<art_branch>"
disable-model-invocation: true
allowed-tools: Bash(git:*)
---

# Art Prepare Merge

Prepare an art branch for merging into develop.
## 사용법

**If $ARGUMENTS is empty, show usage and ask the user for the branch name. NEVER auto-execute.**
```
Usage: /cocv-art-prepare-merge <art_branch>
Example: /cocv-art-prepare-merge art/art-main-1.5.0-r2
```

## Branch Naming

- Art branch: `art/<art-versioning>` (e.g., `art/art-main-1.5.0-r2`)
- Merge branch: `art/merge/<art-versioning>` (e.g., `art/merge/art-main-1.5.0-r2`)

## Arguments

$ARGUMENTS

## Git Safety

**Before any git operation, read and follow:**
`~/.claude/standards/cinev-git-workflow.md`

## 실행

Execute the following git steps **sequentially**.
Stop and report to the user if any step fails.

### Step 1: Fetch

```bash
git fetch --all
```

### Step 2: Checkout art branch

```bash
git checkout <art_branch>
git pull origin <art_branch>
```

### Step 3: Create merge branch

Derive the merge branch name: `art/merge/<art_branch_without_prefix>`

- If art_branch is `art/art-main-1.5.0-r2` → `art/merge/art-main-1.5.0-r2`
- If art_branch is `art-main-1.5.0-r2` → `art/merge/art-main-1.5.0-r2`

```bash
git checkout -b <merge_branch>
```

If the branch already exists, ask the user whether to:
1. Delete and recreate it
2. Abort

### Step 4: Rebase on origin/develop

Rebase on `origin/develop` (not local `develop` which may be stale):

```bash
git rebase origin/develop
```

If conflicts occur:
1. Show the conflicting files
2. Ask the user how to proceed
3. Do NOT auto-resolve

### Step 5: Push

Push the merge branch to origin.

**First push** (no upstream yet):
```bash
git push -u origin <merge_branch>
```

**Subsequent pushes** (after rebase, upstream already set):
```bash
git push --force origin <merge_branch>
```

**LFS lock error handling:**

If push fails due to LFS lock errors (e.g., "Lock failed: already locked by another user"):
1. Extract locked file paths from the error message
2. Unlock each file:
   ```bash
   git lfs unlock --force <locked_file_path>
   ```
3. Retry the push
4. If it still fails, stop and report to the user

### Step 6: Save merge branch info

Save the merge branch name and its HEAD commit hash to `~/.claude/private/art-branches.json`.
This info is used later by `/cocv-art-remove-branch` to find remnant commits.

```python
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

KST = timezone(timedelta(hours=9))
file = Path.home() / ".claude" / "private" / "art-branches.json"
data = json.loads(file.read_text(encoding="utf-8")) if file.exists() else {}

data["<art_branch>"] = {
    **data.get("<art_branch>", {}),
    "merge_branch": "<merge_branch>",
    "merge_branch_head": "<HEAD commit hash of merge branch>",
    "merge_created_at": datetime.now(KST).isoformat()
}

file.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
```

Get the HEAD commit hash with:
```bash
git rev-parse HEAD
```

### Step 7: Generate MR Description

Generate the MR description using `/cocv-mr` with develop as base branch:

```
/cocv-make-mr develop
```

This follows the cocv MR standard format (Summary, Problem, Solution).
Show the result to the user so they can copy-paste it into the GitLab MR.

### Summary

After all steps complete, show:
```
Merge branch ready:
  Branch: <merge_branch>
  Based on: <art_branch>
  Rebased on: origin/develop
  Pushed to: origin/<merge_branch>
  Saved to: ~/.claude/private/art-branches.json
```
