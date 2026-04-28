---
description: Draft + open a Shotloom PR per repo guideline, with pre-flight gates and supersedes handling
argument-hint: "[pr-number-to-supersede]"
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*), Bash(pbcopy), Bash(jq:*), Bash(date:*), Bash(mkdir:*), Bash(mktemp:*), Bash(bash:*)
---

# shotloom-make-pr

Orchestrates the full "open a PR against CINEV/shotloom" flow: gathers context, runs local gates, drafts title/body per `docs/guidelines/pr-guideline.md`, presents to user for approval, then (and only then) runs `gh pr create`.

Supports supersedes workflow — if invoked with a prior PR number, generates redirect comments and includes `Supersedes #N` in the new PR body.

## Arguments

- `[pr-number-to-supersede]` — Optional. Example: `/shotloom-make-pr 62` or `/shotloom-make-pr 62,64`.

**If no argument, proceed without supersedes linkage.**

## Binding rules (CRITICAL)

- **NEVER call `gh pr create` without explicit per-PR user approval.** Draft status does not exempt. (See `rules/git.md`.)
- **Use `tomlim2` account only.** If `gh auth status` shows deemotl active, abort and ask user.
- **Commit identity must be `tomlim2 <deemo@vonvon.me>`.** If wrong, abort.
- **Build gate excludes `shotloom-desktop`** — use `--exclude shotloom-desktop`.
- **All PR body text in English** (Shotloom convention).

## Workflow

### Step 0: Resolve worktree (use cwd, not repo-paths root)

`shotloom-make-pr` operates on the **active worktree**, not the main checkout. Hard-resetting to the repo-paths `shotloom` entry would inspect `main` when invoked from a feature worktree and open the PR from the wrong context.

```bash
# Resolve current worktree from cwd. Refuse if not inside a shotloom checkout.
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "ERROR: not inside a git repository"; exit 1;
}
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *)
    echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"
    echo "  cd into the shotloom main checkout or a worktree and re-run."
    exit 1
    ;;
esac

# Use $toplevel as the working dir. Do NOT cd into the repo-paths root —
# that would target the main checkout regardless of which feature branch
# the user wanted to PR.
worktree="$toplevel"
```

The `repo-paths.json` `shotloom` entry is still useful as a *fallback* (e.g. for cross-worktree cleanup), but it must not be the default working dir for PR creation.

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

**Do NOT read for drafting purposes:**

- Past merged PR bodies (no `gh pr view`, no `gh pr list` for tone)
- Linear issue body / description (it has aspirational future-tense language)
- Branch commit messages (`git log` for body content — only use for title format check)
- `.agent/` directory (handoff notes, working-rules)
- `~/.claude/skills/shotloom-make-pr/reference.md` (implementation hints, not template — drift vector)
- Devlogs (`obsidian-vault-claude/shotloom-devlog-*.md`)
- Sibling/umbrella PR descriptions
- Reviewer comments from prior PRs

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

If no tests in a changed crate, do NOT skip — that violates `rules/testing.md`. Add tests first.

### Step 3b: Confirm `/shotloom-review-before-pr` was run

`shotloom-make-pr` does NOT inline pattern-based review. That's `/shotloom-review-before-pr`'s job.

Ask:
> Did you run `/shotloom-review-before-pr` on this branch and resolve all findings? (y/n)

- **yes** → continue
- **no** → stop, instruct user to run it first. Do NOT auto-run — keep make-pr single-purpose.
- **skip on insistence** → record `- [ ] /shotloom-review-before-pr — SKIPPED on user request` in Test plan so reviewers see it.

### Step 5: Draft title + body

**Two inputs only — `pr-guideline.md` (structure) + `git diff` (content). Nothing else.** If the fact is not in the diff, do not write it. If the section is not in the in-repo template, do not add it. See Step 2 for the full input blacklist (past PRs, Linear issue body, commit messages, `.agent/`, `reference.md`, devlogs).

**Title:** Format and rules per `docs/guidelines/commit-guideline.md` § 1 (PR titles inherit commit subject rules per `pr-guideline.md` § 1). Max 80 chars per commit-guideline §1, lowercase type + scope, imperative, no trailing period. **Do not embed provisional ADR numbers (`ADR-NNNN`) in the title** — ADR numbers are only locked once the ADR file lands on `main`; a parallel PR can claim the same slot first and force a renumber (real precedent: STL-193 PR #177 renumbered ADR-0032 → ADR-0033 after PR #169 claimed 0032). Use a descriptive title; cite the ADR by number only in body content where edits are cheap.

**Body sections** — pick exactly one source:

- **Expanded** (non-trivial changes): copy the template from `docs/guidelines/pr-guideline.md` § 3. Sections: Summary, Why, Changes, Impact, Testing, Breaking Changes, Related Issues. **Nothing else** — no `Scope boundary`, no `Next steps`, no `Stack note`, no invented headings. If a fact doesn't fit one of those seven sections, fit it into the closest section or drop it.
- **Minimal** (<50 LOC, no new behavior): copy `.github/pull_request_template.md`. Sections: Summary, Validation, Related Issues.

**Issue linkage in `## Related Issues`** — pick `Resolves` / `Part of` / `No issue` per `docs/guidelines/pr-guideline.md` § 4. Decision rule: "after this PR merges, is there meaningful work left in the named issue?" Yes → `Part of`, No → `Resolves`. Do NOT include umbrella / parent issues — Linear's parent-child relation already shows the tree.

**Do NOT write while drafting (active suppression):**

- Marketing/qualitative adjectives: `easily`, `seamlessly`, `robust`, `elegant`, `well below`, `dramatically`, `huge`, `trivially`. Replace with a concrete number or drop.
- Future/deferred work: `Next steps`, `Phase 2`, `will follow up`, `deferred to`. The Linear parent issue owns roadmap; this body describes only what THIS PR ships.
- Sibling/umbrella content: parallel PR numbers, sibling crate names, parent-issue scope. If it's not in `git diff --stat`, it's not in the body.
- Invented sections: `Scope boundary`, `Stack note`, `Next steps`, `Phase X`, `Monitoring`. Only the 7 expanded / 3 minimal template sections exist. If a fact doesn't fit one, fit it into the closest section or drop it.
- Quantitative claims not re-derivable from the diff or a cited constant. If you can't point to a line/file/snapshot, drop the number.
- Internal tooling self-references: `/shotloom-review-before-pr`, `/shotloom-check-gates`, `/shotloom-make-pr`, "verified via our skill", "ran the audit". Reviewers don't have these; they're noise. State the result (`cargo clippy clean`, `cargo test pass`) without naming the wrapper that ran it.

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

The redirect comment posted to the prior PR is a **PR-level comment** and goes through the standard `rules/git.md` per-comment approval gate — it is NOT covered by the shotloom auto-commit/auto-push exemption (which scopes only to commits and pushes).

1. Draft the redirect comment text:
   ```
   Superseded by #<new-pr> — <one-line rationale>.
   ```
2. **Show the draft to the user inline** and explicitly ask for approval before posting.
3. On approval:
   ```bash
   gh pr comment <prior-pr> --body "Superseded by #<new-pr> — <one-line rationale>."
   ```
4. Add `Supersedes #<prior-pr>` to new PR body (in template) — this is part of the body content already approved at Step 6, no separate gate.

If the user declines or wants a different rationale, do not post; loop back with a fresh draft.

### Step 9: Link PR in Linear + transition to In Review

1. If PR references STL-NN, add URL as attachment via MCP (unless Linear-GitHub integration auto-links from body).
2. **Transition the Linear issue to `In Review`** so the middle pipeline state is actually used:
   - Invoke `/shotloom-linear-move <STL-NN> "In Review"` (silent, pre-approved per `shotloom-linear-move` auto-caller list — `shotloom-make-pr` is added on PR-creation specifically).
   - Skip if the issue is already `In Review` or later.
   - Skip if the PR is opened as `--draft` AND the user did not pass a "ready" hint — drafts can stay In Progress until promoted.

### Step 10: Report

PR URL + one-line status. Do NOT push further commits without being asked.

**Briefing tone (Step 10 + Step 11 only — not Step 6):** When reporting back to the user, default to **Korean, one altitude higher than the PR body**. The user wrote the changes and already knows the diff; what they need is which subsystem the PR advances and what it unblocks downstream — not a re-read of the bullets they just approved at Step 6.

Rules:
- Lead with the larger goal (VRM / timeline / bridge / rendering / retarget / stage subsystem and the contract it touches), not the title.
- One paragraph framing, then the URL + draft/ready status + one-line "next action" (run `/shotloom-watch-pr` or `/shotloom-auto-pr`).
- Do NOT paste the PR body or Test plan checkboxes back to the user.

**Step 6 (PR body draft approval) keeps the literal English body verbatim** — that's the text that hits GitHub, framing it would corrupt the artifact. The Korean framing only applies to the post-create report and the auto-pr handoff prompt.

### Step 10b: Append Why/How/What devlog (MANDATORY)

Write devlog summarizing **why / how / what** so future sessions can recall context.

1. Resolve path:
   ```bash
   base=$(jq -re '.["obsidian-vault-claude"] // .["obsidian-staging"]' ~/.claude/private/caol-config/machine-paths.json)
   devlog="$base/shotloom-devlog-$(date +%Y-%m-%d).md"
   ```
2. Create with frontmatter if missing (see reference.md for frontmatter shape).
3. Append PR section. **Lead paragraph must frame work in big picture** per `~/.claude/rules/shotloom.md`: which subsystem (VRM/timeline/bridge/rendering/retarget/stage), larger goal, what this unblocks. PR link + issue ID go at END of paragraph, not start.
4. H2 sections: Big picture (optional) / Why / How / What. See reference.md for section contents and template.
5. Convention surprises → `### 사이드 노트` bullet list.
6. Do NOT open Obsidian to verify rendering — file is durable on disk.
7. Body: Korean narrative, technical terms English. Code/paths/CLI in code spans.

### Step 10c: Trigger Claude review after CI passes (MANDATORY)

`/claude-review` is **NOT** a Claude Code skill — it is a **literal text comment posted on the PR** that triggers the Claude review GitHub App / workflow on the CI side. Posting it before CI completes wastes a review cycle on a red PR; posting it after the user manually requested a human reviewer creates noise.

Sequence (after Step 10 reports the PR URL):

1. **Wait for CI to finish.** Poll `gh pr checks <PR-number> --watch` or `gh pr view <N> --json statusCheckRollup` until every check is `SUCCESS`, `FAILURE`, or `SKIPPED` (no `PENDING` / `IN_PROGRESS`).
2. **If any check failed** → do NOT post `/claude-review`. Surface the failure to the user and stop; CI failures are author-fix territory, not reviewer territory.
3. **If all checks passed** → ask user:
   > CI 통과 ✅. `/claude-review` 코멘트로 Claude 리뷰 트리거할까요? (y/n)
4. **On user `yes`** → post the literal text `/claude-review` as a top-level PR comment:
   ```bash
   gh pr comment <PR-number> --body "/claude-review"
   ```
   This is a **PR-level comment** — the post itself is a one-time author-initiated action authorized by the user's `yes` here, separate from the per-comment approval gate that covers reply-to-reviewer comments.
5. **On user `no`** → skip, proceed to Step 11.

Skip entirely when:
- The PR is `--draft` AND the user did not promote to ready-for-review (Claude review on a draft is wasted).
- Invoked inside `/shotloom-auto-pr` (auto-pr handles its own review cadence).
- The user already requested a specific human reviewer in this PR (overlapping signals).

### Step 11: Offer auto-PR watcher

> 자동 PR 응대(`/shotloom-auto-pr <N>`) 켤까요? CI/리뷰 감지 → 수정 → 푸시 → 인라인 응답을 per-comment 승인 없이 진행합니다. (y/n)

- **yes** → invoke `/shotloom-auto-pr <PR-number>`. No further approval (per `feedback_auto_pr_approval_exempt`).
- **no** → stop. User can manually run `/shotloom-watch-pr`, `/shotloom-respond-pr`, `/shotloom-auto-pr` later.
- Skip entirely if invoked inside `/shotloom-auto-pr` (avoid recursion).

## Common failures + fixes

| Symptom | Fix |
|---|---|
| `gh pr create` returns Invalid username/token | `gh auth switch -u tomlim2` |
| Commit author wrong | `git config user.name tomlim2 && git config user.email deemo@vonvon.me && git commit --amend --reset-author --no-edit` |
| `cargo test` fails on Linux CI only (alsa-sys) | bevy dev-dep pulling default features; narrow to `default-features = false` + explicit feature list |
| Doc-path validator fails | path referenced in markdown doesn't exist; fix reference, not validator |
| clippy `unnecessary_map_or` | use `is_none_or` (stable since 1.82) |
| Let-chain on edition 2021 | rewrite as nested `if let` |

## Related

- `docs/guidelines/review-rust.md` (in shotloom repo) — Rust review SSOT for Step 3b pre-PR checklist
- `~/.claude/rules/shotloom.md` — per-PR approval, pre-PR checklist, account/identity
- `rules/git.md` — global PR lifecycle approval
- `rules/testing.md` — unit test requirement
- `README.md` + `AGENTS.md` (in shotloom repo) — project overview
- `docs/guidelines/pr-guideline.md` (in shotloom repo) — authoritative PR spec

## Additional Resources

For the full PR body template (expanded + minimal variants), the devlog frontmatter shape, and the full Why/How/What section template with big-picture framing guidance, see [reference.md](reference.md).
