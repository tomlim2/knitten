---
description: Run Shotloom pre-PR review through code/docs passes, then hand off to shotloom-make-pr when clean
allowed-tools: Read, Agent, Bash(git:*), Bash(rg:*), Bash(pwd)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-review-before-pr

Run pre-PR self-review on the current Shotloom branch, then immediately hand
off to `shotloom-make-pr` once both code and docs phases are clean or nit-only.
The skill uses read-only Explore subagents. The first pass for each phase is a
cold-start review. Later passes in the same phase are independent verification
passes from different angles after fixes change `HEAD`. If later verification
passes find P0-P2 issues and fixes change `HEAD` again, continue the same review
chain with the next pass letter instead of restarting at pass A.

## Delegation Authorization

Invoking this skill is an explicit request to delegate the review passes to
read-only subagents. For Codex harnesses with a "spawn agents only when the user
explicitly asks" rule, this skill invocation itself is the explicit delegation
request because the workflow cannot satisfy its review contract without
independent subagent passes.

Subagent scope is read-only:

- Allowed: inspect the worktree, read files, run read-only git/rg commands, and
  report findings.
- Forbidden: edit files, stage, commit, push, post GitHub comments, change
  Linear, or run destructive commands.

If a harness cannot spawn subagents after this authorization, stop and report
that the pre-PR review gate is blocked. Do not silently substitute a local-only
review and call the gate complete.

## Arguments

None. Operates on the PR diff, `git diff origin/main...HEAD`, from the
current Shotloom worktree. The three-dot diff is required because branches may
be behind `origin/main`; a two-dot tree diff can misread base-branch additions
as deletions in the review branch.

## Review Shape

| Phase | Initial cold-start pass | Follow-up verification passes |
|---|---|---|
| Code | code pass A | code pass B, C, ... while fixes change `HEAD` and P0-P2 findings remain |
| Docs | targeted docs pass A | docs pass B, C, ... while fixes change `HEAD` and P0-P2 findings remain |

Run phases sequentially: code first, docs second. Docs review includes
comments and docstrings, so it must read the post-code-fix tree.

Stop a phase when its latest report is clean or contains only P3/nit
findings. If the last remaining issues are nits, either fix/accept those nits
once and move on, but do not keep cycling that phase solely to chase more nits.

Do not stop after a clean code phase. A clean or nit-only code phase
automatically continues to the targeted docs phase. A clean or nit-only docs
phase automatically continues to `shotloom-make-pr`; the make-PR skill still
owns its local gates, PR body draft, and explicit `gh pr create` approval.

## Workflow

### Step 1: Worktree Sanity

```bash
toplevel=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "ERROR: not in git repo"; exit 1; }
remote=$(git -C "$toplevel" remote get-url origin 2>/dev/null || true)
case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git) ;;
  *) echo "ERROR: cwd is not a shotloom worktree (origin: $remote)"; exit 1 ;;
esac
cd "$toplevel"
pwd
branch=$(git rev-parse --abbrev-ref HEAD); echo "$branch"
[ "$branch" = "main" ] && { echo "ERROR: HEAD is main"; exit 1; }
git log --oneline origin/main..HEAD
git status --short
```

Refuse if `HEAD` is `main`, the branch has zero commits ahead of
`origin/main`, or cwd is not a Shotloom worktree.

Record `head_step1=$(git rev-parse HEAD)`.

### Step 2: Code Pass A

Dispatch one read-only Explore subagent.

| Field | Value |
|---|---|
| `description` | `Code review pass A (cold-start) - review-rust + skill-side test lens + Patterns A-F + T + U` |
| `prompt` | Read `~/.claude/skills/shotloom-review-code/SKILL.md` Step 3 and pass it verbatim with `<worktree>` and `<branch>` substituted. |

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - code pass A
```

If findings exist, ask which findings to fix. After the user finishes or
declines fixes, compute:

```bash
code_fixes_applied=$(test "$(git rev-parse HEAD)" != "$head_step1" && echo true || echo false)
```

### Step 3: Code Verification Passes If Needed

If `code_fixes_applied=false`, set
`head_after_code=$(git rev-parse HEAD)` and continue automatically to Step 4.

If `code_fixes_applied=true`, dispatch one read-only Explore subagent
using the `shotloom-review-code` Step 3 checklist. Override the role
framing with this preamble:

```text
This is an independent verification pass after earlier fixes changed HEAD.
Use the code-review catalog as a verification checklist for current HEAD.
If the changed HEAD is test-heavy, start by verifying the in-repo
`review-rust.md` production-code sections and the skill-side Test Code Review
Lens before applying the rest of the supplementary patterns.
Review from a different angle than all earlier passes in this phase: confirm
previously reported P0-P2 issues are fixed, look for regressions introduced by
fixes, and report any pre-existing defect still visible in the current diff.
Do not rely on the authoring session or on earlier pass conclusions; check
directly.
```

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - code pass <letter> (verify)
```

If the verification pass finds P0-P2 issues, fix/ask whether to fix now. If
fixes change `HEAD`, run the next code verification pass with the same
verification preamble and a new pass letter. Do not restart code pass A unless
the user explicitly asks for a fresh cold-start review.

If the verification pass is clean or contains only P3/nit findings, stop the
code review loop. Fix or accept the final nits once, then set
`head_after_code=$(git rev-parse HEAD)` and continue automatically to docs
without another code pass.

Each verification pass must:

- use the same independent-verification preamble;
- review current `HEAD` directly;
- confirm prior findings were fixed;
- look for regressions introduced by the latest fixes;
- render under `code pass <letter> (verify)`.

Record `head_after_code=$(git rev-parse HEAD)`.

### Step 4: Targeted Docs Pass A

Dispatch one read-only Explore subagent.

| Field | Value |
|---|---|
| `description` | `Docs review pass A (targeted context) - changed zones + related terms` |
| `prompt` | Use the targeted docs brief below with `<worktree>` and `<branch>` substituted. |

#### Targeted docs brief

```text
You are a targeted Shotloom docs/comment reviewer. This is not a broad
cold-start docs audit. Stay near the implementation zone changed by the branch.

Read fresh:
1. `<worktree>/docs/guidelines/documentation-standard.md`
2. `<worktree>/docs/guidelines/code-review-guideline.md`
3. `~/.claude/skills/shotloom-review-docs/reference.md` only for targeted
   G/H/S checks that apply to changed prose.

Diff under review:
- Worktree: `<worktree>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main..HEAD`
- Content: `git diff origin/main..HEAD`

Related issue and decision context:
- Detect a Linear issue from `$ARGUMENTS`, PR body, or recent commit footers
  like `Related to STL-NN`. If a Linear connector is visible, fetch the issue
  and use its title, problem statement, acceptance criteria, affected modules,
  linked ADRs, and linked specs as context. If Linear is unavailable, say so
  and continue from local branch/commit hints.
- Check related ADRs deliberately. Start from ADRs linked by Linear, then
  `docs/adr/README.md`, then exact keyword matches in `docs/adr/`. Do not scan
  unrelated ADRs just to fill the report.
- Treat code comments and rustdoc in changed or nearby implementation files as
  docs. Review them with the same previous-vs-current behavior standard as
  markdown docs.

Scope:
1. Identify changed docs/comments/rustdoc/prose in the diff.
2. Extract implementation-zone keywords from changed code and docs. Include
   domain terms, diagnostic codes, cache/version strings, function names, and
   behavior words. Examples: `normalize_vrm`, `axis-bake`, `humanoid`,
   `inverseBindMatrices`, `skin`, `cache`, `VRM 0.x`, `VRM 1.x`,
   `normalized_vrm_axis_bake`.
3. Search only nearby related docs/comments/ADRs for those terms. Prefer
   changed files first, then directly related ADRs, specs, guidelines, and
   architecture pages. Do not run a repository-wide prose audit except for
   exact diagnostic/code/path references introduced by the diff.
4. Compare previous wording against current wording:
   - What did the pre-branch text imply before?
   - What does the branch now claim?
   - Is there stale contrast, future-tense, old behavior, or an incomplete
     replacement near the same topic?
5. Use actual review findings from the code phase as inspiration for targeted
   terms. For example, if code review discussed malformed skins,
   inverse-bind metadata, cache versioning, or best-effort skips, check whether
   docs/comments now describe that boundary accurately.

Report only actionable mismatches in the changed/related zone. If a broad docs
standard would require PR-body-only content and no PR body exists, mark it N/A.

Output:
## Docs review — branch <branch>

### Applicability
- Targeted terms searched: ...
- Context sources checked: Linear issue/ACs, ADRs, changed comments/rustdoc,
  related docs, with unavailable sources called out.
- Files checked: ...

### Findings
- clean, OR findings with P0/P1/P2/P3 priority and source rule/pattern.

### Previous vs Current Notes
- Briefly list any important changed meaning that was verified as coherent.

### Recommendation
- clean / nit-only / P0-P2 remains.
```

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - docs pass A (targeted)
```

If findings exist, ask which findings to fix. After the user finishes or
declines fixes, compute:

```bash
docs_fixes_applied=$(test "$(git rev-parse HEAD)" != "$head_after_code" && echo true || echo false)
```

### Step 5: Docs Verification Passes If Needed

If `docs_fixes_applied=false`, continue to Step 6.

If `docs_fixes_applied=true`, dispatch one read-only Explore subagent using
the same targeted docs brief. Override the role framing with this preamble:

```text
This is an independent verification pass after earlier docs fixes changed
HEAD. Use the targeted docs brief as a verification checklist for current
HEAD. Review from a different angle than all earlier docs passes: confirm
previously reported P0-P2 issues are fixed, look for regressions introduced by
fixes, and report any stale previous-vs-current wording still visible around
the changed implementation zone. Do not rely on the authoring session or on
earlier pass conclusions; check directly.
```

Render the report verbatim under:

```markdown
## Pre-PR review - branch <branch> - docs pass <letter> (verify)
```

If the verification pass finds P0-P2 issues, fix/ask whether to fix now. If
fixes change `HEAD`, run the next docs verification pass with the same
verification preamble and a new pass letter. Do not restart docs pass A unless
the user explicitly asks for a fresh cold-start review.

If the verification pass is clean or contains only P3/nit findings, stop the
docs review loop. Fix or accept the final nits once, then continue to Step 6
without another docs pass.

Each verification pass must:

- use the same independent-verification preamble;
- review current `HEAD` directly;
- confirm prior findings were fixed;
- look for regressions introduced by the latest fixes;
- render under `docs pass <letter> (verify)`.

### Step 6: Make-PR Handoff

If the latest code and docs passes are clean or nit-only, invoke
`shotloom-make-pr` immediately in the same worktree. Do not stop at a
"ready" recommendation. The handoff is part of this skill's default success
path.

`shotloom-make-pr` must still:

- run its own local CI-equivalent gates;
- draft the title/body from its whitelisted inputs;
- ask for explicit per-PR approval before `gh pr create`.

If the current harness cannot invoke another local skill directly, report:
`Ready to /shotloom-make-pr — run it next in this same worktree`.

Report one of these outcomes:

| Result | Recommendation |
|---|---|
| All fired passes clean | Invoke `shotloom-make-pr` now |
| Only P3/nit findings remain | Invoke `shotloom-make-pr` now; note fixed/accepted nits |
| Findings fixed or accepted | Invoke `shotloom-make-pr` now; note accepted residual risk |
| Latest verification pass found P0-P2 issues | Fix and continue with next pass, or document accepted risk in PR body |

Add one short Korean paragraph only if findings were non-clean.

## Binding Rules

- Always run code before docs, and never stop after code while docs has not run.
- Always use read-only Explore subagents.
- After docs is clean or nit-only, immediately hand off to `shotloom-make-pr`
  unless the harness cannot invoke local skills.
- Docs passes are targeted to changed implementation-zone terms and nearby
  related wording, especially previous-vs-current behavior. They are not broad
  cold-start repository docs audits unless the user explicitly asks.
- Never run a verification pass unless the matching phase's fixes changed
  `HEAD`.
- Label every follow-up pass as independent verification after fixes changed
  `HEAD`.
- Only the first pass of each phase is cold-start. Later passes are different
  verification perspectives, not fresh cold-start restarts.
- Continue verification while P0-P2 findings remain and fixes keep changing
  `HEAD`; stop once the latest pass is clean or nit-only.
- Do not push, create PRs, or post PR comments inside this review skill. PR
  creation belongs only to the `shotloom-make-pr` handoff.
- Use this umbrella for default pre-PR review. Use leaf skills only for
  narrow rechecks.

## Related

- `shotloom-review-code` - code-quality leaf.
- `shotloom-review-docs` - docs and wording leaf.
- `shotloom-make-pr` - next step after a clean report.
- `docs/guidelines/review-rust.md` - Rust review spec.
- `docs/guidelines/code-review-guideline.md` - review priorities.
