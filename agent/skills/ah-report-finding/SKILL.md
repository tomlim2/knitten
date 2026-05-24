---
description: Capture a Knitten operational finding into the dedicated findings inbox. Use when the user says to report a Knitten issue, finding, workflow problem, skill problem, or operational lesson.
argument-hint: "<summary>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(node:*), Bash(rg:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,javascript
task-types: ops,authoring
work-modes: company,experiment,personal
context-profile: ah-authoring
context-standards: standards/authoring/document-templates.md
context-repo-docs: repo:docs/plans/proposed/operational-findings-pipeline.md
---

# ah-report-finding

Capture a Knitten operational finding into the dedicated findings inbox.

## Purpose

Use this when the user says a Knitten problem, workflow issue, skill issue, or
operational lesson should be reported. Capture first; precise diagnosis,
promotion, and durable artifact edits can happen later.

## Inputs

| Input | Meaning |
|-------|---------|
| summary | Rough finding in the user's words. |
| title | Optional user title. |
| source | `user-report`, `wrapup-task`, `ci`, `rule`, or similar. |
| area | `skill`, `rule`, `standard`, `validator`, `docs`, `config`, `workflow`, `routing`, `ux`, `other`, or `unknown`. |
| context | Skill, PR, workflow, repo, or session label. |
| urgent | Whether the user explicitly asked for urgent handling. |

## Workflow

1. Preserve the user's wording as the initial report.
2. Prepare the dedicated worktree and capture the absolute path:

```bash
knitten_root=$(pwd)
findings_worktree=$(
  node scripts/operational-findings-worktree.mjs prepare \
    | awk -F': ' '/^worktree:/ {print $2; exit}'
)
```

3. Change into the prepared findings worktree:

```bash
cd "$findings_worktree"
```

4. In the prepared worktree, run the capture script:

```bash
node "$knitten_root/scripts/operational-findings-report.mjs" capture \
  --summary "<rough finding>" \
  --context "<context>" \
  --source user-report \
  --area unknown
```

5. If the user gave a title, add `--title "<title>"`.
6. If the user explicitly said urgent, add `--urgent`.
7. Report only the created report path and pushed commit on success.
8. On failure, report the failed safety condition and next safe action.

## Safety

- Do not write findings from a dirty findings worktree.
- Do not commit unrelated files.
- Do not classify too aggressively during capture.
- Do not edit the target skill, rule, standard, or validator from this skill
  unless the user asks to immediately fix the finding.

## Files

| File | Purpose |
|------|---------|
| `docs/briefings/operational-findings-inbox.md` | Canonical thin index. |
| `docs/briefings/operational-findings/reports/` | Report-context files. |
| `docs/briefings/operational-findings/fast-track-manual.md` | Urgent handling route. |
| `agent/document-templates/agent-hub/operational-finding-report.md` | Report body template. |
| `scripts/operational-findings-worktree.mjs` | Prepare or verify findings worktree. |
| `scripts/operational-findings-report.mjs` | Capture report, update index, commit, and push. |
