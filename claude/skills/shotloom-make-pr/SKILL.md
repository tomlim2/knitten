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

```
Read: $worktree/docs/guidelines/pr-guideline.md
Read: $worktree/.github/pull_request_template.md
Read: $worktree/docs/guidelines/commit-guideline.md
Read: $worktree/.agent/README.md / working-rules.md / checklists.md (if present)
```

`.agent/` holds informal repo-scoped agent rules (incl. Codex "돌쇠"). Additive to `docs/guidelines/`; honor even if not yet in `~/.claude/rules/shotloom-git.md`. Silently skip if absent.

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

### Step 4: Sample recent merged PRs for tone

```bash
gh pr list --state merged --limit 5 --json number,title,headRefName
gh pr view <N> --json body -q .body    # sample 2-3 bodies
```

Match structure (Summary / Why / Changes / Impact / Test plan) to high-signal examples.

### Step 5: Draft title + body

**Title:** `<type>(<scope>): <short summary>`. Max 72 chars. Imperative. No trailing period.

**Body:** see [reference.md](reference.md) for the full template (Summary, Why, Changes, Impact, Test plan, Scope boundary, Related Issues). For trivial changes (<50 LOC), use the minimal `.github/pull_request_template.md` form.

### Step 5b: Self-audit PR body via Codex (MANDATORY)

When the same overclaim pattern recurs across PRs (e.g. "well below the f32 ulp" inverted-direction inequalities, off-by-one cardinality claims), capture it: append a one-line entry to a body-audit miss-pattern appendix in `~/.claude/skills/shotloom-make-pr/reference.md` so the audit prompt can be tightened over time. Without this, Codex re-discovers the same false-positive shapes every PR.

Before presenting the body to the user, hand the drafted body + the
branch diff to Codex (`gpt-5.4`, high reasoning) and ask it to flag:

- **Numeric / comparative claims** that do not derive from the diff or
  from a linked constant / benchmark ("well below the f32 ulp", "8x
  faster", "reduces allocs by half"). Direction of inequality must be
  correct and the magnitude re-derivable.
- **Marketing / exaggeration phrases** ("easily handles", "trivially
  extends", "hugely improves", "dramatically", "seamlessly"). Either
  drop or replace with a concrete quantitative statement.
- **Assertions not backed by a command** in the Test details list
  (e.g. claiming "CI clean" without a matching `cargo test`/`clippy`
  line).
- **Summary / Changes bullets** whose subject does not appear in
  `git diff --stat` (body claims a change that the diff does not ship).
- **Count / cardinality claims** ("52 bones", "34 files") — verify
  against the actual artifact (snapshot, ls-files output, etc.).

Recent real defects this catches:

- "well below the f32 ulp near 1.0" on a `1e-6` tolerance (1e-6 is
  ~8x **above** the ulp, not below — direction inverted).
- "all 52 non-root bones flipped digest" when the snapshot has 53
  bones and the injection hit all of them.

```bash
prompt_file=$(mktemp -t shotloom-pr-body-audit.XXXXXX.md)
{
  cat <<'PROMPT_HEAD'
You are auditing a Shotloom PR body for overclaims and drift from the
actual diff. For every sentence / bullet, flag it if it matches any
of these classes:

1. Quantitative claim that cannot be re-derived from the diff or a
   cited constant/bench. Check the direction of every inequality.
2. Marketing / subjective phrase ("easily", "trivially", "huge",
   "seamlessly", "well below"). Replace with a concrete number or drop.
3. Assertion not backed by a command in the Test details list.
4. Change described in Summary / Changes that is absent from the diff.
5. Count / cardinality mismatch between body and artifacts.

Output format per finding:

- body line <N>: "<quoted>" — <why unsupported or wrong> — <concrete
  fix suggestion>

If nothing is wrong, answer literally `OK`. Do not rewrite the body;
only report. Do not comment on code-level concerns (that is
`/shotloom-review-before-pr`'s job).
PROMPT_HEAD
  echo
  echo "## Drafted PR body"
  echo
  cat "<path-to-drafted-body>"
  echo
  echo "## Branch diff (git diff origin/main..HEAD)"
  echo
  echo '```diff'
  git diff origin/main..HEAD
  echo '```'
} > "$prompt_file"

bash ~/.claude/lib/cci-codex/run-codex.sh audit-pr-body --file "$prompt_file"
```

Triage the output:

- **`OK` → continue to Step 6.**
- **Findings that are real** → fix the body inline, re-run this step
  (idempotent). Do NOT hand-wave past a finding; either fix it or
  justify dropping it in a one-line note under the Test details.
- **Findings that are false positives** (e.g. the claim IS in the
  diff but Codex misread) → briefly note why the body is correct and
  continue. Log the miss pattern so the prompt can be tightened.

Skip **only** when:

- PR is trivial (< 50 LOC) AND the body has zero quantitative claims
  AND no Test details beyond the template boilerplate.
- User explicitly says "skip body audit" for this specific PR.

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
3. Append PR section. **Lead paragraph must frame work in big picture** per `rules/shotloom.md`: which subsystem (VRM/timeline/bridge/rendering/retarget/stage), larger goal, what this unblocks. PR link + issue ID go at END of paragraph, not start.
4. H2 sections: Big picture (optional) / Why / How / What. See reference.md for section contents and template.
5. Convention surprises → `### 사이드 노트` bullet list.
6. Do NOT open Obsidian to verify rendering — file is durable on disk.
7. Body: Korean narrative, technical terms English. Code/paths/CLI in code spans.

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

- `standards/review-code-rust.md` — Step 3b mandatory pre-PR checklist
- `rules/shotloom-git.md` — per-PR approval, pre-PR checklist, account/identity
- `rules/git.md` — global PR lifecycle approval
- `rules/testing.md` — unit test requirement
- `standards/shotloom.md` — project standard
- `docs/guidelines/pr-guideline.md` (in shotloom repo) — authoritative PR spec

## Additional Resources

For the full PR body template (expanded + minimal variants), the devlog frontmatter shape, and the full Why/How/What section template with big-picture framing guidance, see [reference.md](reference.md).
