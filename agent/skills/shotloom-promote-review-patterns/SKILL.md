---
description: Manually promote Shotloom wrapup review-finding inbox entries into the reusable review catalog.
argument-hint: "[--dry-run]"
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(rg:*), Bash(sed:*), Bash(awk:*)
domains: rust,typescript
repo-keys: shotloom
task-types: documentation,review
context-profile: shotloom-review
---

# shotloom-promote-review-patterns

Manual lifecycle for turning Shotloom PR review findings collected during
`shotloom-wrapup-task` into reusable review patterns.

Use when:
- the user says to promote, collect, generalize, or process Shotloom review
  finding patterns;
- the user wants a manual alternative to scheduled automation;
- the inbox has accumulated entries and it is time to update the actual review
  catalog.

Usage:

```bash
/shotloom-promote-review-patterns
/shotloom-promote-review-patterns --dry-run
```

## Source and targets

| Role | Path |
|---|---|
| Work branch | `codex/shotloom-review-finding-patterns` |
| Preferred worktree | `<knitten-root>/.worktrees/shotloom-review-finding-patterns` |
| Inbox | `docs/briefings/shotloom/review-finding-patterns-inbox.md` |
| Stable catalog | `agent/skills/shotloom-review-code/reference.md` |
| Promoted-only catalog | `agent/skills/shotloom-review-code/reference-promoted.md` |
| Secondary targets | `agent/skills/shotloom-review-before-pr/references/*.md` only when clearly relevant |

## Workflow

### Step 1: Sanity check

Run from the preferred worktree when it exists.

```bash
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git status --short --branch
git pull --ff-only
```

Stop unless:
- branch is `codex/shotloom-review-finding-patterns`;
- dirty files are either absent or only the user's unrelated work, which must be
  left untouched;
- the inbox exists.

If `$ARGUMENTS` contains `--dry-run`, do not edit, stage, commit, or push. Report
the proposed promotions only.

### Step 2: Read current materials

Read:
- inbox file;
- `agent/skills/shotloom-review-code/reference.md`;
- `agent/skills/shotloom-review-code/reference-promoted.md`;
- any secondary target only after deciding a pattern belongs there.

Build a table:

| Inbox entry | Existing catalog match | Decision |
|---|---|---|
| `PR NNN / Pattern: ...` | exact / partial / none | promote / merge / skip |

### Step 3: Promote only reusable patterns

Promote when all are true:
- finding has happened in real review, CI, or rule enforcement;
- lesson is portable beyond one PR;
- trigger can be checked by a future reviewer;
- fix shape can be expressed as a grep-catchable sweep, concrete test shape, or
  review checklist bullet.

Skip when:
- finding is only a feature-specific implementation detail;
- existing catalog already covers it clearly;
- source evidence is too vague to trust.

### Step 4: Edit promoted-only catalog

Default destination is `agent/skills/shotloom-review-code/reference-promoted.md`,
not the stable `reference.md`. This keeps newly promoted patterns separately
auditable. Move entries into `reference.md` only in a later consolidation pass
when the user explicitly asks.

Add to the smallest relevant section in `reference-promoted.md`:

| Pattern kind | Destination |
|---|---|
| test signal quality | `Promoted Test Patterns` |
| validator / manifest / path resolver | `Promoted Validator / Manifest Patterns` |
| TypeScript UI defensive shape | `Promoted TypeScript UI Patterns` |
| bridge/event status behavior | `Promoted Bridge / Event Patterns` |
| docs / PR / review-process guidance | `shotloom-review-before-pr` references only if code catalog is the wrong home |

Rules:
- Keep entries grep-catchable.
- Prefer one concrete trigger plus one concrete fix shape over prose.
- Include `Source evidence: PR NNN, <file:line or check name>` in a short
  parenthetical when useful.
- Do not include private Shotloom PR URLs or markdown links.
- Do not write bare `#NNN` or accidental inline tags.
- Do not paste the whole inbox item into the catalog.

### Step 5: Mark inbox status

For each processed entry, add one status line below the pattern heading:

```md
Status: promoted to `<target>` on YYYY-MM-DD.
```

or:

```md
Status: skipped on YYYY-MM-DD — <short reason>.
```

Do not delete inbox entries; this file is evidence for later consolidation.

### Step 6: Validate

Run:

```bash
git diff --check
rg -n 'github\.com/CINEV/shotloom/pull/|(^|\s)#[A-Za-z0-9]' \
  docs/briefings/shotloom/review-finding-patterns-inbox.md \
  agent/skills/shotloom-review-code/reference.md \
  agent/skills/shotloom-review-code/reference-promoted.md \
  agent/skills/shotloom-review-before-pr/references/*.md
```

Only intentional inline tags may remain. There should normally be none in these
files.

### Step 7: Commit and push

If `--dry-run`, stop after reporting proposed changes.

If changed:

```bash
git add docs/briefings/shotloom/review-finding-patterns-inbox.md \
  agent/skills/shotloom-review-code/reference.md \
  agent/skills/shotloom-review-code/reference-promoted.md \
  agent/skills/shotloom-review-before-pr/references/*.md
git commit -m "docs(shotloom): promote review finding patterns"
git push
```

If no patterns qualified, leave the tree clean and report `no promotions`.

## Report

Return:
- promoted pattern count and destination sections;
- skipped pattern count with reasons;
- validation commands;
- commit hash if committed.
