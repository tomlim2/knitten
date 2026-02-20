---
description: Clean up old art branch after new one takes over
argument-hint: "<old_art_branch> <latest_art_branch>"
allowed-tools: Bash(git:*)
---

# Art Remove Branch

Remove an old art branch after cherry-picking remnant commits into the latest art branch.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-art-remove-branch`

## 사용법

**If $ARGUMENTS is empty, show usage and ask the user. NEVER auto-execute.**
```
Usage: /cocv-art-remove-branch <old_art_branch> <latest_art_branch>
Example: /cocv-art-remove-branch art/art-main-1.5.0-r3 art/art-main-1.5.0-r4
```

## Branch Naming

- Art branch: `art/<art-versioning>`
- Merge branch: `art/merge/<art-versioning>` (derived automatically)

## Arguments

$ARGUMENTS

- First argument: old art branch to remove (e.g., `art/art-main-1.5.0-r3`)
- Second argument: latest art branch to keep (e.g., `art/art-main-1.5.0-r4`)

## Repo Path

Read repo path from `~/.claude/skills/cocv-art-create-branch/config.json` (`repo_path` field).
All git commands run against this repo.

## 실행

Execute each step sequentially. Stop and report if any step fails.

### Step 1: Fetch and checkout latest art branch

```bash
git -C <repo_path> fetch --all
git -C <repo_path> checkout <latest_art_branch>
git -C <repo_path> pull origin <latest_art_branch>
```

### Step 2: Find merge branch reference

The merge branch was created by `/cocv-art-prepare-merge` from the old art branch.
Derive its name: `art/<versioning>` → `art/merge/<versioning>`

Example: `art/art-main-1.5.0-r3` → `art/merge/art-main-1.5.0-r3`

**Find the merge branch tip using these sources (in order):**

1. **Saved info** — `~/.claude/private/art-branches.json` may have `merge_branch_head` commit hash
2. **Local branch** — `git branch -a` to find `art/merge/<versioning>` or `remotes/origin/art/merge/<versioning>`
3. **Remote ref** — `origin/art/merge/<versioning>` (may be deleted after MR merge, but local tracking ref may remain)

If none found, ask the user for the merge branch name or commit hash.

### Step 3: Find remnant commits

Remnant commits = commits on the old art branch AFTER the merge branch point.
These are commits added to the art branch after the merge MR branch was created.

```bash
git -C <repo_path> log <merge_branch_tip>..<old_art_branch> --oneline --no-merges
```

- `<merge_branch_tip>`: the merge branch HEAD (from Step 2)
- `<old_art_branch>`: `origin/<old_art_branch>`

**Show the remnant commit list and count to the user.**

If no remnants found, inform the user and skip to Step 5.

### Step 4: Cherry-pick remnant commits

**Show the commit list and ask for confirmation before proceeding.**

> Cherry-pick할 잔여 커밋 N건:
> - `abc1234` commit message 1
> - `def5678` commit message 2
>
> 진행할까요?

**Wait for user confirmation.**

Cherry-pick each commit (oldest first) into the latest art branch:

```bash
git -C <repo_path> cherry-pick <commit_hash>
```

If conflicts occur:
1. Show the conflicting files
2. Ask the user how to proceed
3. Do NOT auto-resolve

After all cherry-picks, show summary and push:

```bash
git -C <repo_path> push origin <latest_art_branch>
```

### Step 5: Confirm deletion

Show what will be deleted and ask for confirmation:

> 삭제 대상:
> - Remote: `origin/<old_art_branch>`
>
> 진행할까요?

**Wait for user confirmation before continuing.**

### Step 6: Remove old art branch from remote

```bash
git -C <repo_path> push origin --delete <old_art_branch>
```

### Done

Show summary:
```
Cleanup complete:
  Remnant commits: N cherry-picked
  Deleted remote: <old_art_branch>
  Updated remote: <latest_art_branch>
```
