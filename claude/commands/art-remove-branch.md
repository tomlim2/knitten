---
allowed-tools: Bash(git:*)
description: Clean up old art branch after new one takes over
argument-hint: "<old_art_branch> <latest_art_branch>"
---

# Art Remove Branch

Remove an old art branch after cherry-picking remnant commits
from its merge branch into the latest art branch.

## 사용법

**If $ARGUMENTS is empty, show usage and ask the user. NEVER auto-execute.**
```
Usage: /art-remove-branch <old_art_branch> <latest_art_branch>
Example: /art-remove-branch art/art-main-1.5.0-r1 art/art-main-1.5.0-r2
```

## Branch Naming

- Art branch: `art/<art-versioning>`
- Merge branch: `art/merge/<art-versioning>` (derived automatically)

## Arguments

$ARGUMENTS

- First argument: old art branch to remove (e.g., `art/art-main-1.5.0-r1`)
- Second argument: latest art branch to keep (e.g., `art/art-main-1.5.0-r2`)

## 실행

Execute in the **current working repo**. Run each step sequentially.
Stop and report if any step fails.

### Step 1: Fetch and checkout latest art branch

```bash
git fetch --all
git checkout <latest_art_branch>
git pull origin <latest_art_branch>
```

### Step 2: Find remnant commits

Derive the merge branch from the old art branch:
- `art/art-main-1.5.0-r1` → `art/merge/art-main-1.5.0-r1`

Compare the merge branch with the old art branch to find
commits that only exist in the merge branch (remnants):

```bash
git log <old_art_branch>..origin/art/merge/<old_versioning> --oneline
```

Show the user the remnant commits and their count.
If no remnants found, skip to Step 4.

### Step 3: Cherry-pick remnant commits

Cherry-pick each remnant commit into the latest art branch:

```bash
git cherry-pick <commit_hash>
```

If conflicts occur:
1. Show the conflicting files
2. Ask the user how to proceed
3. Do NOT auto-resolve

After all cherry-picks, show summary of what was applied.

### Step 4: Verify

Show the user the current state:

```bash
git log --oneline -10
git status
```

Ask: "Everything looks good? Proceed with remote cleanup?"
**Wait for user confirmation before continuing.**

### Step 5: Remove old art branch from remote

**This is destructive. Show what will be deleted and confirm.**

> Deleting from remote: `origin/<old_art_branch>`

```bash
git push origin --delete <old_art_branch>
```

### Step 6: Push latest art branch

```bash
git push origin <latest_art_branch>
```

### Done

Show summary:
```
Cleanup complete:
  Remnant commits: N cherry-picked
  Deleted remote: <old_art_branch>
  Updated remote: <latest_art_branch>
```
