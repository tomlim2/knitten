---
allowed-tools: Bash(git:*), Bash(python:*)
description: Prepare art branch for merge into develop
argument-hint: "<art_branch>"
---

# Art Prepare Merge

Prepare an art branch for merging into develop.

## 사용법

**If $ARGUMENTS is empty, show usage and ask the user for the branch name. NEVER auto-execute.**
```
Usage: /art-prepare-merge <art_branch>
Example: /art-prepare-merge art/art-main-1.5.0-r2
```

## Branch Naming

- Art branch: `art/<art-versioning>` (e.g., `art/art-main-1.5.0-r2`)
- Merge branch: `art/merge/<art-versioning>` (e.g., `art/merge/art-main-1.5.0-r2`)

## Arguments

$ARGUMENTS

## 실행

Execute the following git steps **sequentially** in the current repo.
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

### Step 4: Rebase on develop

```bash
git rebase develop
```

If conflicts occur:
1. Show the conflicting files
2. Ask the user how to proceed
3. Do NOT auto-resolve

### Step 5: Done

Show summary:
```
Merge branch ready:
  Branch: <merge_branch>
  Based on: <art_branch>
  Rebased on: develop
```

Then ask: "Run `/mr develop` to generate the MR description?"
