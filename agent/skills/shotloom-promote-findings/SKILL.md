---
description: Leaf/component Shotloom skill for promoting operational findings only. Prefer shotloom-router for ambiguous Shotloom work.
argument-hint: "[--dry-run]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*), Bash(date:*)
domains: rust,typescript
repo-keys: shotloom
languages: rust,typescript,markdown
task-types: documentation,review
context-profile: shotloom-review
exclude-when: unreal
---

# shotloom-promote-findings

Promote Shotloom operational findings into the layer that consumes them next:
repo validation, review, task start, local gates, or completed-asset archival.

This skill is the Shotloom-specific bridge after `/ah-report-finding`. It does
not replace the operational findings inbox, delete reports, mutate Obsidian, or
rewrite Shotloom source code.

## Arguments

- No arguments: process qualifying Shotloom findings and edit ledgers.
- `--dry-run`: classify and report proposed destinations without editing.

## Promotion Targets

| Target | Owner | Destination |
|---|---|---|
| Executable validation | Shotloom repo | test, fixture, validator, package script, or CI workflow follow-up |
| Planning and task intake | `shotloom-start-task` | `agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md` |
| Implementation | `shotloom-implement-code` | `agent/skills/shotloom-implement-code/PROMOTED_FINDINGS.md` |
| Code review | `shotloom-review-code` | `agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md` |
| Docs and workflow review | `shotloom-review-docs` | `agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md` |
| Promotion routing policy | this skill | `agent/skills/shotloom-promote-findings/PROMOTED_FINDINGS.md` |

## Workflow

### Step 1: Sanity Check

Run from a Knitten worktree:

```bash
git rev-parse --show-toplevel
git status --short --branch
```

Stop if the worktree has unrelated edits in any target ledger. If `$ARGUMENTS`
contains `--dry-run`, do not edit files.

### Step 2: Read Sources

Read:

- `docs/briefings/operational-findings-inbox.md` when present;
- `docs/briefings/operational-findings/reports/*.md`;
- existing `PROMOTED_FINDINGS.md` ledgers listed above.

Use `shotloom-promote-review-patterns` for the legacy compatibility inbox at
`docs/briefings/shotloom/review-finding-patterns-inbox.md`. This skill handles
the Knitten-wide operational findings pipeline.

### Step 3: Classify Each Finding

Classify by the earliest layer that should have prevented the issue, not by the
layer that discovered it. A review comment can promote to planning,
implementation, or executable validation when those layers are the first
reliable prevention point.

First decide whether the finding belongs in executable Shotloom validation:

| Evidence | Promotion target |
|---|---|
| deterministic bad input or unsupported prop combination | type-level negative fixture, unit test, or validator fixture |
| Rust/TypeScript DTO drift | shared fixture, snapshot, or code/docs cross-check |
| command family inconsistency | table-driven command matrix test |
| docs, ADR, or PR-template drift | doc validator or markdown check |
| CI-only failure class | CI workflow or local helper gate |
| reviewer-only judgment | layer-specific promoted finding |

If a deterministic validator/test target exists, do not stop at a skill ledger.
Record the executable target in the finding report as `promotion-target`. Add a
skill-ledger entry only when future agents must remember to demand or design
that executable proof.

Use the narrowest destination:

| Destination | Promote when |
|---|---|
| Planning ledger | task intake, proof obligations, matrix design, branch setup, handoff, or implementation plan should prevent the issue before code edits |
| Implementation ledger | the coding/editing/validation loop should prevent the issue while changing code |
| Review ledger | no earlier layer can reliably prevent it, but reviewers can catch it from diff, PR surface, or documented workflow evidence |
| This skill ledger | the finding improves the promotion loop itself |
| Obsidian asset | the issue is resolved and only historical context remains |

Do not create a `PROMOTED_FINDINGS.md` ledger for `shotloom-check-gates`.
Mechanical checks belong there only after an actual gate/helper exists. Until
then, keep the reusable pattern in the owning review ledger and leave validator
implementation as a follow-up.

Skip findings that are too vague, already covered in the target ledger, or tied
to one non-repeatable incident.

### Step 4: Write Entries

Add compact entries with this shape:

```md
### <short title>

- Source: `docs/briefings/operational-findings/reports/<file>.md`
- Trigger: <when the consuming layer notices this>
- Check: <specific reviewer/implementer/gate action>
- Fix Shape: <how future work resolves it>
- Status: active | candidate | archived
```

Keep entries grep-catchable. Do not include private Shotloom PR URLs, bare
GitHub issue tags, or full report text.

### Step 4.5: Lossiness Check

Before marking a finding promoted, compare the ledger entry with the source
report and preserve every reusable mechanism that caused the original miss:

| Source evidence contains | Ledger entry must keep |
|---|---|
| type/API surface mismatch | public contract / prop-type check |
| inherited native prop leak | inherited-prop omission or support rule |
| invalid state allowed by types | type-level negative fixture |
| runtime state split | draft / committed / native-safe value rule |
| workflow status-function risk | exact status-function check |
| repeated one-off review fixes | matrix/checklist rule that prevents another case-by-case loop |

If a single umbrella entry hides one of these mechanisms, either expand the
entry or split out a second promoted finding. Do not treat broad words such as
"contract", "matrix", or "quality" as enough by themselves.

### Step 5: Update Finding Status

When a report has a complete promotion destination and no remaining action,
change report frontmatter to `status: done` or `status: resolved` only when the
report already contains resolution evidence. Otherwise leave it captured and
record the ledger destination in `promotion-target`.

### Step 6: Validate

Run:

```bash
node scripts/validate-llm-first.mjs
git diff --check
rg -n 'github\.com/CINEV/shotloom/pull/|(^|\s)#[A-Za-z0-9]' \
  agent/skills/shotloom-*/PROMOTED_FINDINGS.md
```

The grep normally returns no matches. Intentional markdown headings are allowed;
private PR URLs and accidental inline tags are not.

## Report

Return:

- promoted count by layer;
- skipped count with short reasons;
- changed ledgers and finding reports;
- validation commands and results.
