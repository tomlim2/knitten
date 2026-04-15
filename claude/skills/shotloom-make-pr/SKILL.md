---
description: Draft + open a Shotloom PR per repo guideline, with pre-flight gates and supersedes handling
argument-hint: "[pr-number-to-supersede]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*), Bash(pbcopy)
---

# shotloom-make-pr

Orchestrates the full "open a PR against CINEV/shotloom" flow: gathers context, runs local gates, drafts title/body per `docs/guidelines/pr-guideline.md`, presents to user for approval, then (and only then) runs `gh pr create`.

Supports supersedes workflow — if invoked with a prior PR number, generates redirect comments and includes `Supersedes #N` in the new PR body.

## Arguments

- `[pr-number-to-supersede]` — Optional. Prior PR number that this PR replaces. Example: `/shotloom-make-pr 62` or `/shotloom-make-pr 62,64` for multiple.

**If no argument, proceed without supersedes linkage.**

## Binding rules

- **NEVER call `gh pr create` without explicit per-PR user approval.** Draft status does not exempt. (See `rules/git.md`.)
- **Use `tomlim2` account only.** If `gh auth status` shows deemotl as active, abort and ask user to fix.
- **Commit identity must be `tomlim2 <deemo@vonvon.me>`.** If wrong, abort and instruct user.
- **Build gate excludes `shotloom-desktop`** — use `--exclude shotloom-desktop`.
- All text in the PR body must be in English (Shotloom PR convention).

## Workflow

### Step 1: Sanity — branch, identity, gh account

```bash
cd ~/Desktop/www/shotloom-github
git status                                      # working tree clean
git log -1 --format="%an <%ae>"                  # must be tomlim2 <deemo@vonvon.me>
gh auth status 2>&1 | grep -E "Active|account"   # tomlim2 active, deemotl NOT active
git rev-parse --abbrev-ref HEAD                  # current branch
git log --oneline origin/main..HEAD || git log --oneline main..HEAD
```

If any check fails, stop and report. Do not proceed to gates or drafting.

### Step 2: Read the guideline

Re-read `docs/guidelines/pr-guideline.md` every invocation. The template and rules may have changed.

```
Read: ~/Desktop/www/shotloom-github/docs/guidelines/pr-guideline.md
Read: ~/Desktop/www/shotloom-github/.github/pull_request_template.md
Read: ~/Desktop/www/shotloom-github/docs/guidelines/commit-guideline.md   # PR title format
```

Also read any agent-operational guidance in `.agent/` if the folder
exists:

```
Read: ~/Desktop/www/shotloom-github/.agent/README.md          # index, if present
Read: ~/Desktop/www/shotloom-github/.agent/working-rules.md   # repo-scoped agent rules
Read: ~/Desktop/www/shotloom-github/.agent/checklists.md      # pre/post-task checklists
```

`.agent/` holds informal operational rules the shotloom agents
(including Codex "돌쇠") share inside this repo. It is NOT a
substitute for `docs/guidelines/` — treat it as additive guidance
and honor any repo-scoped rules found there even if they are not
yet reflected in `~/.claude/rules/shotloom-git.md`. If `.agent/`
does not exist in the current checkout, skip this step silently.

### Step 3: Local CI-equivalent gates

Run in order. Any failure blocks PR creation.

```bash
cd ~/Desktop/www/shotloom-github
cargo fmt --check                                           # formatting
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop           # MUST pass — see rules/testing.md
node scripts/validate-doc-paths.mjs                         # doc path validator
```

If `cargo test` fails because no tests exist in a changed crate, do NOT skip — that itself is a violation of `rules/testing.md`. Add tests first.

If CI fails on Linux-specific deps (e.g. `alsa-sys` when bevy is pulled in as a heavy dev-dep), narrow bevy features locally (`default-features = false`) before push.

### Step 4: Sample recent merged PRs for tone

```bash
gh pr list --state merged --limit 5 --json number,title,headRefName
gh pr view <N> --json body -q .body    # sample 2-3 bodies to match tone
```

Match structure (Summary / Why / Changes / Impact / Test plan) to the most recent high-signal examples. Do not invent new sections unless the guideline expanded.

### Step 5: Draft title + body

**Title:** `<type>(<scope>): <short summary>` per commit-guideline subject line. Max 72 chars. Imperative mood. No trailing period.

**Body sections (expanded template for non-trivial changes):**

```md
## Summary

- <1-3 bullets, main outcome, no filenames>

## Why

<2-4 sentences on the problem / motivation>

## Changes

<grouped by behavior or subsystem, NOT file-by-file>

## Impact

- User-facing impact: <or "none">
- API/schema impact: <or "none">
- Performance impact: <or "none">
- Operational or rollout impact: <or "none">

## Test plan

- [x] `cargo fmt --check`
- [x] `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
- [x] `cargo check --workspace --exclude shotloom-desktop`
- [x] `cargo test --workspace --exclude shotloom-desktop`
- [x] `node scripts/validate-doc-paths.mjs`
- [ ] <feature-specific manual verification, if any>

## Scope boundary

<what is explicitly NOT in this PR and where it lands>

## Related Issues

<Resolves | Related to> STL-NN
Supersedes #<prior-PR-number>    <!-- only if argument given -->
```

For trivial/minimal changes (<50 LOC, no new behavior), use the minimal template from `.github/pull_request_template.md` instead:

```md
## Summary
-
## Validation
-
## Related Issues
Related to STL-NN
```

### Step 6: Present draft to user

Print the drafted title + body and ask explicitly:

> Draft title: `<title>`
> Draft body: (shown above)
>
> `gh pr create` 실행해도 될까요? (draft / ready-for-review)

**Wait for explicit user approval. Do NOT run `gh pr create` until the user says yes.**

### Step 7: On approval — create PR

```bash
gh pr create --base main --head <branch> --draft \
  --title "<title>" \
  --body "$(cat <<'EOF'
<body>
EOF
)"
```

Default to `--draft` unless the user said "ready-for-review" explicitly. A draft can always be marked ready later; reverting from ready-to-draft is noisier.

### Step 8: Supersedes handling (if argument given)

For each `<prior-pr>` in the argument list:

```bash
gh pr comment <prior-pr> --body "Superseded by #<new-pr> — <one-line rationale>."
```

Add `Supersedes #<prior-pr>` line to the new PR body (already in the template above).

### Step 9: Link the PR in Linear

If the PR references a Linear issue (Resolves/Related to STL-NN), add the PR URL as an attachment on the Linear issue via MCP, unless the Linear-GitHub integration will auto-link from the PR body text.

### Step 10: Report

Post the PR URL and a one-line status. Do NOT push any subsequent commits without being asked.

## Common failures + fixes

| Symptom | Fix |
|---|---|
| `gh pr create` returns Invalid username/token | `gh auth status` shows deemotl active; run `gh auth switch -u tomlim2` |
| Commit author wrong | `git config user.name tomlim2 && git config user.email deemo@vonvon.me && git commit --amend --reset-author --no-edit` |
| `cargo test` fails on Linux CI only (alsa-sys etc.) | bevy dev-dep pulled default features; narrow to `default-features = false` + explicit feature list |
| Doc-path validator fails | path you referenced in markdown doesn't exist; fix the reference, not the validator |
| `cargo clippy` fires `unnecessary_map_or` | use `is_none_or` (stable in 2021 since 1.82) |
| Let-chain used in crate on edition 2021 | rewrite as nested `if let` |

## Related

- `rules/shotloom-git.md` — per-PR approval, pre-PR checklist, account/identity rules
- `rules/git.md` — global PR lifecycle approval rules
- `rules/testing.md` — unit test requirement
- `standards/shotloom.md` — Shotloom project standard
- `docs/guidelines/pr-guideline.md` (in shotloom repo) — authoritative PR format spec
