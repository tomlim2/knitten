---
description: Review a Shotloom GitHub PR as the reviewer: checkout PR head, inspect code/docs diff, draft inline review comments, submit one GitHub review so threads get Resolve buttons, then verify the review landed.
argument-hint: "<pr-number | github-pr-url>"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(mkdir:*), Bash(python3:*), Bash(rg:*), Bash(wc:*), Bash(tr:*), Bash(sed:*), Agent
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-review-pr

Review a Shotloom pull request as the reviewer, submit real inline GitHub review
comments, and verify the submitted review landed.

## Arguments

- `<pr-number | github-pr-url>` - Shotloom PR number or GitHub PR URL.

If no argument is provided, show usage and ask. Never auto-execute.

Usage: `/shotloom-review-pr 339`

## Purpose

Use this when the user wants to review someone else's Shotloom PR. This is the
review-author counterpart to `/shotloom-respond-pr`.

This skill must create GitHub review comments through the pull-request review
API. That makes each inline comment a real review thread with GitHub's Resolve
conversation button. Do not use top-level PR comments for findings.

## Workflow

### Step 1: Sanity Check

Parse `$ARGUMENTS` to `PR`.

Run:

```bash
gh auth status
gh api user --jq .login
git rev-parse --show-toplevel
git remote get-url origin
git status --short
```

Verify:
- active `gh` user is `tomlim2`;
- repo origin is `CINEV/shotloom`;
- current dirty files are reported before creating any worktree;
- PR is not authored by `tomlim2` unless the user explicitly says this is a
  self-review. Never approve your own PR.

Fetch PR metadata:

```bash
gh pr view "$PR" \
  --json number,title,body,author,baseRefName,headRefName,headRefOid,headRepository,headRepositoryOwner,state,isDraft,reviewDecision,url \
  > "/tmp/pr${PR}-review-view.json"
gh pr diff "$PR" --patch > "/tmp/pr${PR}-review.diff"
```

Stop if the PR is closed.

### Step 2: Prepare Review Worktree

Create a detached review worktree so the user's current checkout is untouched:

```bash
repo_root="$(git rev-parse --show-toplevel)"
base="$(jq -r '.baseRefName' "/tmp/pr${PR}-review-view.json")"
head_oid="$(jq -r '.headRefOid' "/tmp/pr${PR}-review-view.json")"
review_dir="$repo_root/.worktrees/review-pr-${PR}"
git fetch origin "$base"
test ! -e "$review_dir" || { echo "review worktree already exists: $review_dir"; exit 1; }
git worktree add --detach "$review_dir" "$head_oid"
```

All later local reads run inside `$review_dir`. The review diff is
`origin/$base...HEAD`.

### Step 3: Load Review Standards

Read fresh in the worktree:
- `AGENTS.md`
- `CONTRIBUTING.md`
- `docs/guidelines/code-review-guideline.md`
- `docs/guidelines/review-rust.md` when Rust changed
- `docs/guidelines/review-typescript.md` when TS/TSX changed
- `docs/guidelines/review-domain.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/documentation-standard.md` when docs/comments changed
- `docs/guidelines/pr-guideline.md`

Also read `~/.claude/rules/pr-comment.md` and `~/.claude/rules/shotloom.md`
for approval gates.

### Step 4: Inspect Diff

Collect:

```bash
git -C "$review_dir" diff --name-status "origin/$base...HEAD"
git -C "$review_dir" diff --stat "origin/$base...HEAD"
git -C "$review_dir" diff "origin/$base...HEAD"
gh pr checks "$PR" --json name,state,completedAt,link
```

Review in priority order:
1. P0 correctness/safety.
2. P1 architecture/boundary/contract issues.
3. P2 missing tests, docs, validation, or CI failures.
4. P3 nits only after blocking issues are covered.

For Rust/TS, use the same defect catalog as `/shotloom-review-code`. For docs,
comments, workflow, or PR-shape, use `/shotloom-review-docs`.

### Step 5: Draft Findings

Every finding must include:
- priority (`P0`, `P1`, `P2`, `P3/nit`);
- exact file path;
- exact new-diff line if possible;
- rule source;
- concise problem statement;
- recommendation only when it materially reduces ambiguity.

Inline findings must anchor to changed lines in the PR diff. If a finding needs
unchanged context, anchor to the nearest changed line and cite the unchanged
symbol in the body.

Suppress weak findings. Do not block on style that existing lints or repo
guidelines do not require.

### Step 6: Build GitHub Review Payload

Create `/tmp/pr${PR}-review-payload.json`:

```json
{
  "event": "REQUEST_CHANGES",
  "body": "<review summary>",
  "comments": [
    {
      "path": "crates/example/src/lib.rs",
      "line": 42,
      "side": "RIGHT",
      "body": "**P1 | Boundary** — <finding body>"
    }
  ]
}
```

Event selection:
- `REQUEST_CHANGES` when any P0/P1/P2 finding remains.
- `COMMENT` when only non-blocking P3/nit findings remain.
- `APPROVE` only when there are no blocking findings and the user explicitly
  approves submitting an approval. Never approve a PR authored by `tomlim2`.

Payload rules:
- Use `comments[]` on `POST /pulls/<PR>/reviews`.
- Use `line` + `side: "RIGHT"` for new-file lines.
- Use `start_line` only for short contiguous ranges when the range improves
  clarity.
- Do not use `/issues/<PR>/comments`.
- Do not use `/commits/<sha>/comments`.
- Do not post a top-level summary as a substitute for inline findings.

### Step 7: Approval Gate

Show the exact review payload summary before posting:

```markdown
Review event: REQUEST_CHANGES | COMMENT | APPROVE
Inline comments: N

1. <path>:<line>
   <exact body>
...

Review body:
<exact body>

Post this GitHub review? (y/N)
```

Wait for explicit user approval. A single `y` approves this one review
submission. Any edit request returns to Step 5 or Step 6.

### Step 8: Submit Review

Right before posting, re-fetch PR head and diff:

```bash
old_head="$(jq -r '.headRefOid' "/tmp/pr${PR}-review-view.json")"
gh pr view "$PR" --json headRefOid,state > "/tmp/pr${PR}-review-prepost.json"
new_head="$(jq -r '.headRefOid' "/tmp/pr${PR}-review-prepost.json")"
test "$old_head" = "$new_head" || { echo "PR head changed; re-review required"; exit 1; }
```

Submit:

```bash
gh api -X POST "/repos/CINEV/shotloom/pulls/${PR}/reviews" \
  --input "/tmp/pr${PR}-review-payload.json" \
  > "/tmp/pr${PR}-submitted-review.json"
```

Capture:

```bash
jq -r '.id' "/tmp/pr${PR}-submitted-review.json"
```

### Step 9: Verify + Watch

Run `/shotloom-verify-review <PR> <review-id>` semantics:

```bash
python3 ~/.claude/skills/shotloom-verify-review/verify.py "$PR" "$review_id"
```

Report whether every inline comment landed with path and position.

Offer to start `/shotloom-verify-review` watch for replies. Do not start a
watcher unless the user says yes.

## Output

Final report:

```markdown
PR #<N> reviewed.
Review id: <id>
Event: <REQUEST_CHANGES|COMMENT|APPROVE>
Inline comments: <count>
Verification: <passed|failed>
Checks at review time: <summary>
Watch: <started|not started>
```

## Related

- `/shotloom-review-code`
- `/shotloom-review-docs`
- `/shotloom-verify-review`
- `/shotloom-respond-pr`
