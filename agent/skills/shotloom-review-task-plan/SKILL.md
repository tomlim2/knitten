---
description: Review an existing Shotloom task plan before implementation; gather fresh Linear/code/docs context, patch the plan until only nit findings remain, commit and push plan-only changes, then stop
argument-hint: "[slug-or-path]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-review-task-plan

Use this before implementing a Shotloom plan when the user asks to review,
cold-start review, validate, harden, or re-check a plan. This skill reviews
the plan artifact only. Do not edit Shotloom source files.

## Purpose

Take an existing `caol-ila/docs/plans/*.md` plan and run cold-start review
rounds until no unhandled `P1`/`P2` findings remain. Patch the plan after each
serious finding. When only `P3`/nit findings remain, land the plan and stop.

## Inputs

- `[slug-or-path]` optional.
- If omitted, derive the slug from the current Shotloom branch body after
  `<type>/`.
- If the input is a path, use it directly.
- Otherwise resolve to
  `$caol_ila/docs/plans/<slug-or-derived-branch-body>.md`.

## Preconditions

- cwd is inside Shotloom or `caol-ila`.
- `caol-resolve-doc-path` resolves both `shotloom` and `caol-ila`.
- The plan file exists.
- If a Linear id appears in plan frontmatter, title, or body, fetch the current
  issue and related/parent context with Linear tools when available.

## Workflow

### Step 1: Resolve Plan and Repo Context

Run:

```bash
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
shotloom_root="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo shotloom)"
shotloom_root="${shotloom_root#RESOLVED_PATH=}"
caol_ila="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo caol-ila)"
caol_ila="${caol_ila#RESOLVED_PATH=}"
```

Resolve the plan path. Surface:

- plan path
- Shotloom root
- caol-ila root
- current branches and dirty files for both repos

If the plan path cannot be resolved, stop without writing.

### Step 2: Round 1 - Cold-Start Context Gather

Read the whole plan. Then gather current context as if the plan were untrusted:

```bash
git -C "$shotloom_root" status --short
rg -n "<linear id>|<title keywords>|<primary symbols>" "$shotloom_root"/crates "$shotloom_root"/apps "$shotloom_root"/docs "$shotloom_root"/contracts "$shotloom_root"/assets "$shotloom_root"/MAP.md
rg -n "<diagnostic/cache/bridge/test/doc keywords>" "$shotloom_root"/crates "$shotloom_root"/apps "$shotloom_root"/docs "$shotloom_root"/contracts
ls "$caol_ila/docs/plans/" 2>/dev/null | rg -i "<scope>|<subject>|<linear-id>"
git -C "$caol_ila" log --diff-filter=D --name-only --pretty=format: -- docs/plans/ | rg -i "<scope>|<subject>"
```

Also inspect:

- Linear issue body, AC, parent, blockers, and related issues.
- Current live code and tests named by the plan.
- Current docs/specs/ADRs/cache notes relevant to the plan.
- Sibling plans and deleted sibling plans.
- Dirty files in both repos that may affect the plan.

Classify findings as:

- `P1`: wrong API/layer/invariant/scope, missing primitive, or plan is not one
  reviewable PR.
- `P2`: missing required test/doc/edge/error/diagnostic/cache coverage.
- `P3`: nit, wording, markdown, cheap clarity cleanup.

Before patching, decide whether the plan is suitable for one PR. If not,
rewrite/split the plan if the split is obvious. If not obvious, patch the plan
with an explicit `P1` blocker section, do not commit, and ask.

### Step 3: Patch Serious Findings

Patch the plan for every `P1` and `P2`. Re-check patched claims against live
source/docs before continuing. Keep edits scoped to the plan file unless the
user explicitly requested skill or template changes.

### Step 4: Round 2+ - Rotate Review Stances

Run more rounds with a different stance each time. Useful stances:

| Stance | Lead question |
|---|---|
| Paranoid implementer | Where will the code fail to compile, borrow, parse, cache, or validate? |
| Minimal PR reviewer | What should be follow-up because it makes this PR too large? |
| Domain owner | Does it respect Shotloom ADRs, module boundaries, diagnostics, and cache policy? |
| Error-source-chain owner | Do planned Rust error enums and conversions preserve wrapped external errors with `#[source]`, instead of flattening them into `String`? |
| Test owner | Would tests fail before implementation and pass after? |
| Docs/spec owner | Are docs required, and are non-goals explicit? |
| Release/cache owner | Does it invalidate cache/state/user-visible behavior correctly? |

After each round:

1. Patch every `P1`/`P2`.
2. Re-check changed claims against live source/docs.
3. Continue with a different stance if any `P1`/`P2` was found.
4. Stop when only `P3`/nit findings remain.

Nit-only findings do not block. Apply cheap wording fixes; otherwise proceed.

### Step 5: Floor Checks

Before landing, verify:

- The plan has a current-state evidence table with concrete paths.
- It has an explicit one-PR suitability judgment, either in summary, decisions,
  non-goals, or implementation stages.
- `## Implementation Plan` starts with baseline re-check or includes one.
- Every `Locked Decisions` item has `Rationale:` and
  `Rejected alternatives:`.
- Non-goals list at least five adjacent exclusions.
- Traps list at least two false paths.
- Verification includes manual repro for each user-facing diagnostic,
  rejection, or behavior label introduced by the plan.
- Rust parser/loader/validator/error plans include source-chain proof: every
  wrapped external error is preserved with `#[source]` / typed fields, every
  intentional no-source schema or validator error says why, and verification
  includes `Error::source()` assertions when applicable.
- Sibling-plan disagreements are adopted or rejected with live-code rationale.

Patch any `P1`/`P2` floor failure and run one more stance. `P3`/nit-only floor
issues may be patched cheaply or left.

### Step 6: Commit Plan-Only Changes

If the plan has no unhandled `P1`/`P2`, commit only that plan file from
`caol-ila`:

```bash
git -C "$caol_ila" config user.name
git -C "$caol_ila" config user.email
git -C "$caol_ila" add "docs/plans/<slug>.md"
git -C "$caol_ila" commit -m "plan(shotloom): review <slug>"
git -C "$caol_ila" push
```

Before commit, verify identity is `tomlim2 <tomandlim@gmail.com>`. Never use
`--no-verify`. Do not stage unrelated dirty files.

If no edits were needed, do not create an empty commit.

### Step 7: Report and Stop

Report:

- plan path
- whether changes were committed/pushed
- final review result: `nit-only` or blocked `P1`/`P2`
- implementation still needs a separate go-ahead

Do not implement source changes in this skill.

## Binding Rules

- Live Shotloom code and current Linear context outrank the existing plan.
- Round 1 is always context gathering plus one-PR suitability.
- Round 2+ must use different stances and continue until only nits remain.
- `P1`/`P2` findings must be patched or explicitly blocked before landing.
- Nit-only means proceed with the plan; do not loop forever on wording.
- Commit only the reviewed plan file.
