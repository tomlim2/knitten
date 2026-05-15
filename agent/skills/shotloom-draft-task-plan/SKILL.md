---
description: Draft cold-start Shotloom task plans after live code audit and iterative self-review; commit clean direct plans, then immediately run review-task-plan
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
---

# shotloom-draft-task-plan

Plan-phase companion to `/shotloom-start-task`. Audit live Shotloom code, write
one plan artifact, commit and push only a clean direct plan, then immediately
run `/shotloom-review-task-plan <slug>` on that plan. Implementation needs a
later user message after the review skill finishes.

## Mandatory Contract

After Step 1 resolves `$plan_path`, every stop writes one `.md` artifact:

| Result | Artifact | Commit |
|---|---|---|
| Clean converged plan | `<plan_dir>/<slug>.md` | Yes |
| Step 2 factual stop | `<plan_dir>/<slug>.draft.md` | No |
| Unconverged draft | `<plan_dir>/<slug>.partial.md` | No |
| Parallel or staged-delete plan | `<plan_dir>/<slug>.claude.md` | No |

Pre-Step-1 failures stop without writing because no target path exists.

## Purpose

This skill is a cold-start plan author, not a briefing formatter. Linear and the
Ready briefing are inputs; live Shotloom code is canonical evidence. Already-done
briefing items become current-state evidence. Ambiguous implementation choices
go in `## Locked Decisions`. Missing primitives or scope expansion create a
`.draft.md` conflict artifact.

## Arguments

- `[slug]` - optional kebab-case plan slug.
- Without `[slug]`, derive from current branch body after `<type>/`.
- If branch is `main`, `HEAD`, or lacks `/`, show usage and stop.
- Never invent a slug.

## Preconditions

- `/shotloom-start-task` has run and the user accepted the Ready briefing.
- cwd is inside Shotloom main checkout or a Shotloom worktree.
- `caol-resolve-doc-path` resolves `shotloom` and `caol-ila`.
- Pre-Step-1 failure: report and stop.

## Workflow

### Step 1: Resolve Inputs

Run:

```bash
branch="$(git rev-parse --abbrev-ref HEAD)"
repo_root="$(git rev-parse --show-toplevel)"
git_common="$(git rev-parse --git-common-dir)"
origin="$(git remote get-url origin)"
shotloom_root="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo shotloom)"
shotloom_root="${shotloom_root#RESOLVED_PATH=}"
caol_ila="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo caol-ila)"
caol_ila="${caol_ila#RESOLVED_PATH=}"
```

Derive `slug`:

```bash
if [ -n "$1" ]; then
  slug="$1"
else
  if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ] || ! [[ "$branch" == */* ]]; then
    echo "usage: /shotloom-draft-task-plan <kebab-slug>"
    exit 1
  fi
  slug="${branch#*/}"
fi
```

Verify:
- `slug` matches `^[a-z0-9]+(-[a-z0-9]+)*$` and contains no `/`.
- `$caol_ila/docs/plans/` exists.
- cwd belongs to Shotloom by `repo_root`, `git_common`, or `origin`.

Set `plan_path="$caol_ila/docs/plans/$slug.md"`. Surface plan slug, target,
and Shotloom root.

### Step 2: Run Current-State Audit

Before drafting, search the live Shotloom tree. Choose terms from Linear,
branch, Ready briefing, AC, ADR, and affected modules. Search examples:
[reference.md](reference.md).

Read matching source files that define wire shape, handler branch, editor entry
point, fixtures, tests, and docs. Classify each surface as `Already Done`,
`Partial`, `Missing`, or `Conflict`.

Factual stop conditions:
1. Cited primitive mismatch: briefing cites a template, standard, ADR, or repo
   rule that does not codify the cited pattern.
2. Out-of-briefing expansion: scope forces protocol change, dependency, ADR, or
   multi-file import design absent from the briefing.

If a stop condition fires, draft the conflict report as `.draft.md` in Step 6a,
skip commit, then ask for the split or scope decision.

### Step 3: Detect Create vs Update Mode

Inspect `$plan_path`, `git status`, and `git show HEAD:docs/plans/<slug>.md`.
Use Read for files present on disk. Use `git show HEAD:<path>` only for
HEAD-only or deleted-at-HEAD content.

| Disk | Index | HEAD | Action |
|---|---|---|---|
| absent | absent | absent | Create direct plan. |
| present | committed | matches | Update direct plan in place. Surface current title and `status` first. |
| absent | staged-delete | present | Write `.claude.md`; ask which body to keep. |
| present untracked | absent | present different | Write `.claude.md`; ask whether to overwrite, keep suffix, or stop. |

### Step 4: Draft Plan Body

Use the frontmatter, section order, and body rules in [reference.md](reference.md).

Draft around the audited remaining gap. Do not restate Linear verbatim. Do not
list complete work as future work. Use concrete file paths. Verify every `add`
target is missing and every `reuse` target is named.

For any plan that mutates coupled representations of one artifact, explicitly
lock the atomicity invariant before implementation. Examples: JSON + BIN,
model + cache artifact, command state + event, serialized bundle + index,
thumbnail cache + manifest. The plan must say what happens when the second
mutation fails, and the verification must assert the final persisted artifact,
not only intermediate counters or one side of the mutation.

When the plan adds or changes Rust fixture/matrix tests, include a short test
shape note: why those fixtures are in the matrix, whether each fixture gets its
own `#[test]` or a collected-failures loop, which assertion proves behavior
beyond presence, and whether any test output is intentionally env-gated.

### Step 5: Cold-Start Review Until Only Nits Remain

Review the draft through the cold-start review loop in
[reference.md](reference.md). Round 1 is context collection and suitability:
re-read Linear context, related issues, live code, current docs, sibling plans,
and repo state; decide whether the plan is appropriate for one PR. Patch the
plan before continuing.

Round 2 and later must use different review stances from the previous round.
Patch the plan after every round with `P1` or `P2` findings, then re-check the
patched claims against source. Keep looping until only `P3` / nit findings
remain. Nit-only means the plan can proceed; do not block or keep polishing
forever on harmless wording. Severity: `P1` wrong API/layer/scope or not-one-PR
scope, `P2` missing required test/doc/edge/invariant/error branch, `P3` cheap
cleanup/nit.

Convergence requires first-round context collection, explicit one-PR suitability
judgment, sibling draft consumption, structural floor checks, and zero
unhandled `P1`/`P2`. Details: [reference.md](reference.md).

If convergence changes requested scope, write `.draft.md`, skip commit, and ask.

### Step 6: Write, Commit, Push

#### Step 6a: Write Artifact

Write exactly one artifact according to the Mandatory Contract table. If a
clean plan cannot land, write the best current draft under the correct suffix
and report the blocker.

#### Step 6b: Commit Direct Plan Only

Continue only when Step 6a wrote directly to `$plan_path`.

From `caol-ila`:

```bash
git config user.name
git config user.email
git add docs/plans/<slug>.md
git commit -m "plan(shotloom): <slug>"
git push
```

Before commit, verify identity is `tomlim2 <tomandlim@gmail.com>`. If hooks
fail, fix the cause and retry. Never use `--no-verify`.

Commit only `docs/plans/<slug>.md` unless the user explicitly requested skill
or doc edits in the same turn.

### Step 7: Chain to Review or Stop

If Step 6b committed and pushed a direct plan at `$plan_path`, immediately run:

```bash
/shotloom-review-task-plan "$slug"
```

Let `/shotloom-review-task-plan` own the final report, review-plan commit, and
implementation go-ahead reminder.

If Step 6a wrote a suffix artifact (`.draft.md`, `.partial.md`, or
`.claude.md`), report the artifact path and blocker, then stop. Do not run
review-task-plan on non-direct artifacts.

Do not edit Shotloom source files in this skill.

## Binding Rules

- Audit before write. Live Shotloom code outranks Linear and briefing text.
- After `$plan_path` resolves, every stop writes a direct or suffix `.md`.
- Implementation-choice ambiguity goes in `## Locked Decisions`.
- Factual stop conditions stop before commit, not before writing.
- External agents are reviewers only. They return `P1` / `P2` / `P3` findings
  against the current canonical draft. Continue review/patch rounds until only
  `P3`/nit findings remain.
- One plan artifact, one direct-plan commit, then one automatic
  `/shotloom-review-task-plan <slug>` run for direct plans only.
- Plan is not implementation. Source edits need a later user request.
- Protocol changes, multi-file `.gltf` support, dependencies, ADRs, and broad
  UX changes require explicit scope.
- No `--no-verify`.

## Related

`/shotloom-start-task`, `/shotloom-review-task-plan`,
`~/.claude/rules/shotloom.md`, `caol-ila/docs/plans/`,
[reference.md](reference.md).
