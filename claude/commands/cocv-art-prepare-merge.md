---
description: Prepare art branch for merge into develop
argument-hint: "<art_branch>"
allowed-tools: Bash(git:*)
---

# Art Prepare Merge

Prepare an art branch for merging into develop.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-art-prepare-merge`

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

### Step 6: Generate MR Description

Generate the MR description using `/cocv-mr` with develop as base branch:

```
/cocv-mr develop
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
```
