---
description: Review CINEV/shotloom-asset-library pull requests as a human reviewer with asset catalog, LFS, static output, docs, and CI/CD checks.
argument-hint: "<pr-number | github-pr-url>"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(node:*), Bash(pnpm:*), Bash(rg:*), Bash(sed:*), Bash(wc:*), Bash(file:*), Bash(ls:*), Bash(shasum:*), Bash(mkdir:*), Bash(rm:*)
domains: shotloom
repo-keys: shotloom
languages: javascript,json,markdown,yaml
task-types: review,ops
context-profile: shotloom-review
context-rules: rules/pr-comment.md,rules/pr-mutate.md,rules/git-defaults.md,rules/verify-before-report.md
context-references: references/REVIEW-CHECKLIST.md
exclude-when: unreal,obsidian
---

# shotloom-review-asset-library-pr

Review a `CINEV/shotloom-asset-library` pull request as the reviewer, using the
Shotloom PR review discipline plus asset-library-specific documents and
checklists.

## Role

This is an independent user-facing review skill, not a leaf/component helper.
Use it directly for `shotloom-asset-library` PR URLs or PR numbers. Use
`shotloom-review-pr` for the main `CINEV/shotloom` repo.

## Arguments

- `<pr-number | github-pr-url>` - Asset-library PR number or GitHub PR URL.

If no argument is provided, show usage and ask. Never auto-execute.

Usage: `/shotloom-review-asset-library-pr 8`

## Hard Gates

- Submit real pull-request review comments through
  `POST /repos/CINEV/shotloom-asset-library/pulls/<PR>/reviews`.
- Do not use top-level PR comments for actionable findings when inline comments
  can anchor to changed lines.
- Show the exact review event, body, and every inline comment before posting.
  Wait for explicit user approval after showing that final payload.
- Re-fetch PR head immediately before posting. Stop and re-review if it changed.
- Verify active GitHub user is `tomlim2`; never approve a PR authored by
  `tomlim2` unless the user explicitly confirms a self-review, and still do not
  submit `APPROVE` on your own PR.

## Workflow

### 1. Sanity Check

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
- repo origin is `CINEV/shotloom-asset-library`;
- active `gh` user is `tomlim2`;
- current dirty files are reported and left untouched;
- PR is open and not a draft unless the user explicitly wants draft review.

Fetch:

```bash
gh pr view "$PR" \
  --json number,title,body,author,baseRefName,headRefName,headRefOid,headRepository,state,isDraft,reviewDecision,url
gh pr diff "$PR" --patch
gh pr checks "$PR" --json name,state,completedAt,link
```

Per Knitten PR policy, inspect checks before deeper PR action.

### 2. Prepare Detached Worktree

Create a detached review worktree so the user's checkout stays untouched:

```bash
repo_root="$(git rev-parse --show-toplevel)"
base="$(gh pr view "$PR" --json baseRefName --jq .baseRefName)"
head_oid="$(gh pr view "$PR" --json headRefOid --jq .headRefOid)"
review_dir="$repo_root/.worktrees/review-pr-${PR}-asset-library"
git fetch origin "$base"
test ! -e "$review_dir" || { echo "review worktree already exists: $review_dir"; exit 1; }
git worktree add --detach "$review_dir" "$head_oid"
```

Run all local reads and gates from `$review_dir`. Use `origin/$base...HEAD` as
the review diff.

### 3. Load Required Context

Read [`references/REVIEW-CHECKLIST.md`](references/REVIEW-CHECKLIST.md), then
load every required repo doc and Knitten rule it names. Do this before judging
findings, because asset-library reviews depend on source catalog, LFS, generated
static output, docs, and workflow contracts.

### 4. Inspect Surfaces

Collect:

```bash
git -C "$review_dir" diff --name-status "origin/$base...HEAD"
git -C "$review_dir" diff --stat "origin/$base...HEAD"
git -C "$review_dir" diff "origin/$base...HEAD"
```

Classify the change as catalog/source assets, generated `dist/`, verifier/build
logic, docs, CI/CD workflow, or PR metadata/process.

### 5. Run Gates And Checklist

Run the gates and priority checklist in
[`references/REVIEW-CHECKLIST.md`](references/REVIEW-CHECKLIST.md). Escalate
failures according to observed risk: catalog/asset breakage and editor contract
breakage are blocking; weak style nits are not.

### 6. Draft Findings

Every finding must include priority, exact file path, exact new-diff line when
possible, rule/source document, concise problem, and a concrete fix only when it
reduces ambiguity.

Anchor inline findings to changed lines. If the issue is visible only through
unchanged context, anchor to the nearest changed line and name the affected
symbol or contract in the body.

Suppress weak findings. Do not block on taste, phrasing, or speculation that no
repo rule or observable behavior supports.

### 7. Submit Or Approve

Build a review payload:

- `REQUEST_CHANGES` for any P0/P1/P2 blocker.
- `COMMENT` for non-blocking P3/nit-only reviews.
- `APPROVE` only when there are no blockers and the user explicitly requests
  approval.

Show the exact payload:

```markdown
Review event: REQUEST_CHANGES | COMMENT | APPROVE
Inline comments: N

1. <path>:<line>
   <exact body>

Review body:
<exact body>

Post this GitHub review? (y/N)
```

After approval, re-fetch `headRefOid`; stop if it differs from the reviewed
head. Then submit:

```bash
gh api -X POST "/repos/CINEV/shotloom-asset-library/pulls/${PR}/reviews" \
  --input "$payload_json"
```

Verify the submitted review and re-check current PR checks before reporting the
result.
