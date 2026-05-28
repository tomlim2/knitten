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
| Review and pre-PR readiness | `shotloom-review-before-pr` | `agent/skills/shotloom-review-before-pr/PROMOTED_FINDINGS.md` |
| Task intake and implementation handoff | `shotloom-start-task` | `agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md` |
| Local gate / validator candidates | `shotloom-check-gates` | `agent/skills/shotloom-check-gates/PROMOTED_FINDINGS.md` |
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
| Review ledger | future reviewers can catch the issue by reading a diff, PR surface, or documented workflow evidence |
| Start-task ledger | the task intake, branch setup, handoff, or implementation plan needs a reusable check |
| Gate ledger | the finding is mechanically checkable, or it defines a candidate command/helper to add later |
| This skill ledger | the finding improves the promotion loop itself |
| Obsidian asset | the issue is resolved and only historical context remains |

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
