---
description: Capture a Knitten operational finding into the local findings queue. Use when the user says to report a Knitten issue, finding, workflow problem, skill problem, or operational lesson.
argument-hint: "<summary>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(node:*), Bash(rg:*)
domains: agent-hub
repo-keys: agent-hub
languages: json,javascript,markdown,yaml
task-types: ops,authoring
work-modes: company,experiment,personal
context-profile: ah-authoring
context-standards: standards/authoring/document-templates.md
context-repo-docs: repo:docs/plans/proposed/operational-findings-pipeline.md
---

# ah-report-finding

Capture a Knitten operational finding into the local findings queue.

## Purpose

Use this when the user says a Knitten problem, workflow issue, skill issue, or
operational lesson should be reported. Capture first; precise diagnosis,
promotion, and durable artifact edits can happen later.

Raw captures are temporary local JSON artifacts. Durable knowledge starts only after
promotion into the owning skill, rule, standard, script, validator, spec, or
decision.

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
2. Run the capture script from the Knitten checkout:

```bash
node scripts/operational-findings-report.mjs capture \
  --summary "<rough finding>" \
  --context "<context>" \
  --source user-report \
  --area unknown
```

3. If the user gave a title, add `--title "<title>"`.
4. If the user explicitly said urgent, add `--urgent`.
5. Report only the created report path, daily inbox path, and finding ID on
   success.
6. On failure, report the failed safety condition and next safe action.

## Safety

- Do not classify too aggressively during capture.
- Do not edit the target skill, rule, standard, or validator from this skill
  unless the user asks to immediately fix the finding.
- Do not commit or push from this skill.

## Completion Policy

If the user asks what to do with completed findings:

1. Resolve the Obsidian destination with
   `ah-resolve-doc-path doc learning agent-hub`.
2. Move reusable completion context into an Obsidian learning note.
3. Replace the repo report with a thin stub containing `status`,
   `resolved-by`, `resolved-at`, and `moved-to`.
4. Update the inbox row to `resolved` when the fix exists and `assetized` after
   the Obsidian note owns the durable explanation.
5. Delete a report only when another durable artifact already owns the context
   or the report was invalid.

## Files

| File | Purpose |
|------|---------|
| `.agent-local/ah/operational-findings/YYYY-MM-DD/inbox.json` | Local temporary JSON thin index. |
| `.agent-local/ah/operational-findings/YYYY-MM-DD/reports/*.json` | Local temporary JSON report-context files. |
| `docs/briefings/operational-findings/fast-track-manual.md` | Durable urgent handling reference. |
| `agent/document-templates/agent-hub/operational-finding-report.md` | Report body template. |
| `agent/lib/resolve-local-artifact-path.mjs` | Resolve local artifact paths. |
| `scripts/operational-findings-report.mjs` | Capture report and update local daily index. |
