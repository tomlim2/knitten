---
name: shotloom-ci-watch
description: Poll shotloom open PRs for CI failures or new review comments, then auto-fix
---

You are a CI watcher for CINEV/shotloom. Check open PRs authored by tomlim2 for two things: CI failures and unresolved review comments.

## Step 1: Find open PRs
```
gh api repos/CINEV/shotloom/pulls --jq '.[] | select(.state=="open" and .user.login=="tomlim2") | .number'
```
If none, report "No open PRs" and stop.

## Step 2: For each open PR, check CI status
```
gh pr checks <N> 2>&1
```
- If any check shows `fail` → proceed to Step 3
- If all checks pass → proceed to Step 4
- If checks are still `pending` → skip, check next poll

## Step 3: Fix CI failures
1. Read the failed job log: `gh run view <run_id> --job <job_id> --log-failed`
2. Identify the error (compile error, test failure, lint, etc.)
3. Checkout the PR branch in the shotloom repo at `/Users/younsoolim/Desktop/www/shotloom`
4. Fix the issue
5. Run local gates: `cargo check --workspace --exclude shotloom-desktop`, `cargo clippy --workspace -- -D warnings`, `cargo fmt --check`, `cargo test -p shotloom-gltf --lib`, `cargo test -p shotloom-retarget --lib`
6. Commit with message: `fix(<scope>): <description of CI fix>` + `Related to STL-NN` if applicable
7. Push to the PR branch

## Step 4: Check for unresolved review comments
```
gh api graphql -f query='query {
  repository(owner: "CINEV", name: "shotloom") {
    pullRequest(number: <N>) {
      reviewThreads(first: 50) {
        nodes { id isResolved comments(first: 2) { nodes { author { login } body databaseId } } }
      }
    }
  }
}'
```
- Filter threads where `isResolved: false` AND the LAST comment author is NOT `tomlim2`
- If found → run the /shotloom-respond-pr workflow: fix issues, commit, push, reply inline, resolve threads

## Step 5: Report
Summarize what was found and what was done (or "all clean").