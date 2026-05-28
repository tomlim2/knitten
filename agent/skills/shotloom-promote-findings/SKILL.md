---
description: Promote Shotloom operational findings into layer-specific promoted-finding ledgers.
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
review, task start, local gates, or completed-asset archival.

This skill is the Shotloom-specific bridge after `/ah-report-finding`. It does
not replace the operational findings inbox, delete reports, mutate Obsidian, or
rewrite Shotloom source code.

## Arguments

- No arguments: process qualifying Shotloom findings and edit ledgers.
- `--dry-run`: classify and report proposed destinations without editing.

## Promotion Ledgers

| Layer | Consuming skill | Ledger |
|---|---|---|
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

Use the narrowest destination:

| Destination | Promote when |
|---|---|
| Planning ledger | the task intake, branch setup, handoff, or implementation plan needs a reusable check |
| Implementation ledger | the coding/editing/validation loop needs a reusable constraint |
| Review ledger | future reviewers can catch the issue by reading a diff, PR surface, or documented workflow evidence |
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
