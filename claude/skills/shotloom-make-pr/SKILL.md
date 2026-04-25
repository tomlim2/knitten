---
description: Draft + open a Shotloom PR per repo guideline, with pre-flight gates and supersedes handling
argument-hint: "[pr-number-to-supersede]"
allowed-tools: Read, Bash(git:*), Bash(gh:*), Bash(cargo:*), Bash(node:*), Bash(pbcopy)
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

### Step 0: Resolve repo path

```bash
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/caol-config/repo-paths.json)
```

### Step 1: Sanity — branch, identity, gh account

```bash
cd "$shotloom_root"
git status                                      # working tree clean
git log -1 --format="%an <%ae>"                  # tomlim2 <deemo@vonvon.me>
gh auth status 2>&1 | grep -E "Active|account"   # tomlim2 active
git rev-parse --abbrev-ref HEAD                  # current branch
git log --oneline origin/main..HEAD || git log --oneline main..HEAD
```

Stop on any failure.

### Step 2: Read guidelines (re-read every invocation)

```
Read: $shotloom_root/docs/guidelines/pr-guideline.md
Read: $shotloom_root/.github/pull_request_template.md
Read: $shotloom_root/docs/guidelines/commit-guideline.md
Read: $shotloom_root/.agent/README.md / working-rules.md / checklists.md (if present)
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

```bash
gh pr comment <prior-pr> --body "Superseded by #<new-pr> — <one-line rationale>."
```

Add `Supersedes #<prior-pr>` to new PR body (in template).

### Step 9: Link PR in Linear

If PR references STL-NN, add URL as attachment via MCP (unless Linear-GitHub integration auto-links from body).

### Step 10: Report

PR URL + one-line status. Do NOT push further commits without being asked.

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
