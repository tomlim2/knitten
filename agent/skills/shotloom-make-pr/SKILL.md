---
description: Draft and open a Shotloom PR after prReady=true, per repo guideline, with local gates and approval before `gh pr create`
argument-hint: "[pr-number-to-supersede]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*), Bash(mktemp:*), Bash(cat:*), Bash(rm:*), Bash(printf:*), Bash(sleep:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/git-defaults.md,rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-make-pr

Open a PR against `CINEV/shotloom`: require current
`/shotloom-review-before-pr` output with `prReady=true`, gather context, run
local gates, draft title/body per `docs/guidelines/pr-guideline.md`, present
the draft for user approval, then run `gh pr create`.

If invoked with a prior PR number, include `Supersedes #N` in the new
PR body and ask before posting any redirect comment.

## Arguments

- `[pr-number-to-supersede]` — Optional. Example: `/shotloom-make-pr 62` or `/shotloom-make-pr 62,64`.

**If no argument, proceed without supersedes linkage.**

## Binding rules (CRITICAL)

- **NEVER call `gh pr create` without explicit per-PR user approval.** Draft status does not exempt. (See `rules/git-defaults.md`.)
- **Use `tomlim2` account and commit identity only.** Run `agent/lib/shotloom-github-guard.mjs --require-git-author`.
- **Build gate excludes `shotloom-desktop`** — use `--exclude shotloom-desktop`.
- **All PR body text in English** (Shotloom convention).
- **Assign every PR to `@me`.** This applies to both draft and ready-for-review PRs.

## Workflow

### Step 0: Resolve worktree (use cwd, not repo-paths root)

Resolve the current git toplevel. Do not switch to the repo-paths root.

```bash
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository"; exit 1;
}
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *)
    echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"
    exit 1
    ;;
esac
worktree="$toplevel"
```

### Step 1: Sanity — branch, identity, gh account

```bash
cd "$worktree"
git fetch origin main

status=$(git status --short)
[ -z "$status" ] || { echo "ERROR: working tree is not clean"; git status --short; exit 1; }

knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
node "$knitten_root/agent/lib/shotloom-github-guard.mjs" --require-git-author

default_branch=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
default_branch="${default_branch#origin/}"
[ -n "$default_branch" ] || default_branch="main"

branch=$(git rev-parse --abbrev-ref HEAD)
[ "$branch" != "main" ] && [ "$branch" != "$default_branch" ] || {
  echo "ERROR: HEAD is the default branch ($branch)"
  exit 1
}

ahead_count=$(git rev-list --count "origin/main..HEAD")
[ "$ahead_count" -gt 0 ] || {
  echo "ERROR: branch has no commits ahead of origin/main"
  exit 1
}
git log --oneline origin/main..HEAD
```

Stop on any failure. **Refuse to proceed if `HEAD` is `main` or the default branch** — almost certainly invoked from the wrong worktree.

### Step 2: Read guidelines (re-read every invocation)

**Hard input whitelist for drafting the PR body. Read ONLY these:**

```
Read: $worktree/docs/guidelines/pr-guideline.md
Read: $worktree/.github/pull_request_template.md
Read: $worktree/docs/guidelines/commit-guideline.md   # title format only
git diff origin/main...HEAD                           # actual branch changes
git diff --stat origin/main...HEAD                    # file list for grounding
```

**Do NOT read for drafting purposes:** past PR bodies, Linear issue
bodies, branch commit messages, `.agent/`, this skill's `reference.md`,
devlogs, sibling PR descriptions, or reviewer comments.

If a fact you want to write doesn't come from `pr-guideline.md` (template) or the `git diff` (content), DROP it. No exceptions, no "but this is useful context" — if it didn't make it into the diff it doesn't belong in the body.

### Step 3: Require before-PR readiness

`shotloom-review-before-pr` owns pre-PR code/docs readiness.
`shotloom-make-pr` owns local CI-equivalent gates and PR creation approval.

Require a current `/shotloom-review-before-pr` JSON result for this branch:

```json
{
  "prReady": true,
  "branch": "<current branch>",
  "headSha": "<current HEAD>",
  "dirty": false,
  "blockersRemaining": 0
}
```

Resolve the result file before trusting readiness:

```bash
safe_branch="$(git rev-parse --abbrev-ref HEAD | tr '/[:space:]' '--')"
result_path="/tmp/shotloom-before-pr-${safe_branch}-readiness.json"
```

If the file is missing, stale, for another branch, for another `HEAD`, has
`dirty=true`, or has `prReady=false`, run `/shotloom-review-before-pr` now. If
the current harness cannot invoke another skill directly, stop and tell the user
to run `/shotloom-review-before-pr` first.

If `prReady=false` after the rerun, stop. Let `/shotloom-review-before-pr` own
the blocker-to-implementation loop; do not bypass it from PR creation.

### Step 4: Local CI-equivalent gates

Any failure blocks PR.

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

If no tests in a changed crate, do NOT skip — that violates `rules/test-write.md`. Add tests first.

### Step 5: Draft title + body

**Two inputs only:** `pr-guideline.md` for structure and `git diff`
for content. If the fact is not in the diff, do not write it. If the
section is not in the in-repo template, do not add it.

**Title:** follow `docs/guidelines/commit-guideline.md` §1:
`<type>(<scope>): <imperative summary>`, lowercase type/scope,
max 80 chars, no trailing period. Do not embed provisional ADR numbers
in the title.

**Body sections** — pick exactly one source:

- **Expanded** (non-trivial changes): copy the template from `docs/guidelines/pr-guideline.md` § 3. Sections: Summary, Why, Changes, Impact, Testing, Breaking Changes, Related Issues. **Nothing else** — no `Scope boundary`, no `Next steps`, no `Stack note`, no invented headings. If a fact doesn't fit one of those seven sections, fit it into the closest section or drop it.
- **Minimal** (<50 LOC, no new behavior): copy `.github/pull_request_template.md`. Sections: Summary, Validation, Related Issues.

**Issue linkage in `## Related Issues`** — pick `Resolves` / `Part of` / `No issue` per `docs/guidelines/pr-guideline.md` § 4. Decision rule: "after this PR merges, is there meaningful work left in the named issue?" Yes → `Part of`, No → `Resolves`. Do NOT include umbrella / parent issues — Linear's parent-child relation already shows the tree.

**Supersedes linkage** — if the skill argument names prior PR numbers, add one
`Supersedes #<prior-pr>` line per prior PR in `## Related Issues` before the
first `gh pr create`. Accept comma-separated prior PRs as a list.

**Do NOT write while drafting:** qualitative adjectives, future work,
sibling/umbrella PR content, invented sections, unsupported numbers, or
internal tool names. State concrete checks without wrapper names.

### Step 6: Present draft to user

Print drafted title + body, ask:
> Draft title: `<title>`
> Draft body: (shown above)
>
> `gh pr create` 실행해도 될까요? (draft / ready-for-review)

**Wait for explicit user approval. Do NOT run `gh pr create` until yes.**
Record the approved visibility as `pr_visibility=draft` or
`pr_visibility=ready-for-review`.

### Step 7: On approval — create PR

```bash
body_file=$(mktemp)
cat > "$body_file" <<'EOF'
<body>
EOF

if [ "$pr_visibility" = "ready-for-review" ]; then
  gh pr create --base main --head <branch> \
    --assignee @me \
    --title "<title>" \
    --body-file "$body_file"
else
  gh pr create --base main --head <branch> --draft \
    --assignee @me \
    --title "<title>" \
    --body-file "$body_file"
fi

rm -f "$body_file"
pr_number=$(gh pr view --json number --jq .number)
pr_url=$(gh pr view --json url --jq .url)
```

Default to `--draft` unless the user explicitly said "ready-for-review".
Draft → ready is easy; ready → draft is noisy.

Do not pass PR markdown through `--body "..."`. Backticks, `$...`, and command
snippets in the body can be interpreted by the shell before `gh` receives them.
After creation, inspect `gh pr view <N> --json body` before reporting success.

### Step 7a: Ready-for-review follow-up

If `pr_visibility=ready-for-review`, run `references/ready-for-review.md`
after the PR is created and before the final handoff:

1. Confirm CI checks have appeared for the new PR.
2. Post `/claude-review` as a PR comment.
3. Confirm Claude review activity is visible.
4. Ask the user which reviewer to request. Do not add a human reviewer until
   the user answers with a GitHub login.

Skip this follow-up for draft PRs unless the user explicitly asks to mark the PR
ready for review in the same session.

### Step 8: Supersedes handling (if argument given)

The redirect comment posted to the prior PR is a PR-level comment.
Ask before posting it.

1. Confirm the new PR body already contains one `Supersedes #<prior-pr>` line
   per prior PR.
2. Draft one redirect comment per prior PR:
   `Superseded by #<new-pr> - <one-line rationale>.`
3. Show the drafts and ask before posting.
4. On approval:
   ```bash
   for prior_pr in <prior-pr-list>; do
     comment_file=$(mktemp)
     printf '%s\n' 'Superseded by #<new-pr> - <one-line rationale>.' > "$comment_file"
     gh pr comment "$prior_pr" --body-file "$comment_file"
     rm -f "$comment_file"
   done
   ```

If the user declines or wants a different rationale, do not post; loop back with a fresh draft.

### Step 9: Linear update

If the PR references `STL-NN` and a Linear connector/tool is available in the
current harness, fetch that issue, add or verify the PR link, and move it to
`In Review` for ready-for-review PRs. Skip the state move for draft PRs unless
the user asked for a ready PR.

If no Linear connector/tool is visible, report
`Linear update skipped — connector unavailable`; do not block PR creation.

### Step 10: Report + handoff

Report the PR URL + one-line status. Do NOT push further commits
without being asked.

**Briefing tone:** report in Korean, one level above the PR body.

Lead with the subsystem and contract the PR advances, then give URL,
draft/ready status, and one next action. Do not paste the PR body back.

Step 6 still prints the literal English body verbatim.

Offer one follow-up only if useful: `/shotloom-auto-pr <PR-number>` for
active handling or `/shotloom-watch-pr <PR-number>` for passive watching.
Post-create devlog details live in `reference.md`. Ready-for-review CI and
Claude review handoff lives in `references/ready-for-review.md`.

## Related

- `docs/guidelines/pr-guideline.md` - authoritative PR body spec.
- `docs/guidelines/commit-guideline.md` - title format.
- `reference.md` - post-create handoff and devlog details.
- `references/ready-for-review.md` - post-create ready-for-review follow-up.
