---
description: Draft and open a Shotloom PR per repo guideline, with local gates and approval before `gh pr create`
argument-hint: "[pr-number-to-supersede]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*)
---

# shotloom-make-pr

Open a PR against `CINEV/shotloom`: gather context, run local gates,
draft title/body per `docs/guidelines/pr-guideline.md`, present the
draft for user approval, then run `gh pr create`.

If invoked with a prior PR number, include `Supersedes #N` in the new
PR body and ask before posting any redirect comment.

## Arguments

- `[pr-number-to-supersede]` — Optional. Example: `/shotloom-make-pr 62` or `/shotloom-make-pr 62,64`.

**If no argument, proceed without supersedes linkage.**

## Binding rules (CRITICAL)

- **NEVER call `gh pr create` without explicit per-PR user approval.** Draft status does not exempt. (See `rules/git-defaults.md`.)
- **Use `tomlim2` account only.** If `gh auth status` shows deemotl active, abort and ask user.
- **Commit identity must be `tomlim2 <deemo@vonvon.me>`.** If wrong, abort.
- **Build gate excludes `shotloom-desktop`** — use `--exclude shotloom-desktop`.
- **All PR body text in English** (Shotloom convention).

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
git status                                      # working tree clean
git log -1 --format="%an <%ae>"                  # tomlim2 <deemo@vonvon.me>
gh auth status 2>&1 | grep -E "Active|account"   # tomlim2 active
git rev-parse --abbrev-ref HEAD                  # current branch (NOT main)
git log --oneline origin/main..HEAD || git log --oneline main..HEAD
```

Stop on any failure. **Refuse to proceed if `HEAD` is `main` or the default branch** — almost certainly invoked from the wrong worktree.

### Step 2: Read guidelines (re-read every invocation)

**Hard input whitelist for drafting the PR body. Read ONLY these:**

```
Read: $worktree/docs/guidelines/pr-guideline.md
Read: $worktree/.github/pull_request_template.md
Read: $worktree/docs/guidelines/commit-guideline.md   # title format only
git diff origin/main..HEAD                            # the actual code
git diff --stat origin/main..HEAD                     # file list for grounding
```

**Do NOT read for drafting purposes:** past PR bodies, Linear issue
bodies, branch commit messages, `.agent/`, this skill's `reference.md`,
devlogs, sibling PR descriptions, or reviewer comments.

If a fact you want to write doesn't come from `pr-guideline.md` (template) or the `git diff` (content), DROP it. No exceptions, no "but this is useful context" — if it didn't make it into the diff it doesn't belong in the body.

### Step 3: Local CI-equivalent gates

Any failure blocks PR.

```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

If no tests in a changed crate, do NOT skip — that violates `rules/test-write.md`. Add tests first.

### Step 4: Confirm `/shotloom-review-before-pr`

`shotloom-make-pr` does NOT inline pattern-based review. That's `/shotloom-review-before-pr`'s job.

Ask:
> Did you run `/shotloom-review-before-pr` on this branch and resolve all findings? (y/n)

- **yes** → continue.
- **no** → stop, instruct user to run it first. Do NOT auto-run — keep make-pr single-purpose.
- **skip on insistence** → record `- [ ] /shotloom-review-before-pr — SKIPPED on user request` in Test plan so reviewers see it.

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

### Step 7: On approval — create PR

```bash
gh pr create --base main --head <branch> --draft \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

Default to `--draft` unless user explicitly said "ready-for-review". Draft → ready is easy; ready → draft is noisy.

### Step 8: Supersedes handling (if argument given)

The redirect comment posted to the prior PR is a PR-level comment.
Ask before posting it.

1. Draft `Superseded by #<new-pr> - <one-line rationale>.`
2. Show the draft and ask before posting.
3. On approval:
   ```bash
   gh pr comment <prior-pr> --body "Superseded by #<new-pr> — <one-line rationale>."
   ```
4. Add `Supersedes #<prior-pr>` to the new PR body.

If the user declines or wants a different rationale, do not post; loop back with a fresh draft.

### Step 9: Linear update

If the PR references `STL-NN`, add/link the PR in Linear when the
integration has not already done so. For ready-for-review PRs, move the
issue to `In Review`; skip for draft PRs unless the user asked for a
ready PR.

### Step 10: Report + handoff

Report the PR URL + one-line status. Do NOT push further commits
without being asked.

**Briefing tone:** report in Korean, one level above the PR body.
Lead with the subsystem and contract the PR advances, then give URL,
draft/ready status, and one next action. Do not paste the PR body back.

Step 6 still prints the literal English body verbatim.

Offer one follow-up only if useful: `/shotloom-auto-pr <PR-number>` for
active handling or `/shotloom-watch-pr <PR-number>` for passive watching.
Post-create devlog, CI waiting, and Claude review details live in
`reference.md`.

## Related

- `docs/guidelines/pr-guideline.md` - authoritative PR body spec.
- `docs/guidelines/commit-guideline.md` - title format.
- `reference.md` - post-create handoff and devlog details.
