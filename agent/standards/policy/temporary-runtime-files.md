---
status: accepted
---
# Temporary Runtime Files Standard

## Contract

| Rule | Requirement |
|------|-------------|
| One task, one directory | Every task that writes temporary runtime files MUST create one `workDir`. |
| Directory name | Default: `.agent-local/runtime/<workflow>-<stable-id>/`. Example: `.agent-local/runtime/shotloom-start-task-STL-431/`. |
| Override | Scripts MUST accept `--work-dir <dir>` when they write more than one temporary file. |
| Discovery output | The first script that creates the directory MUST print `workDir` in JSON. |
| Final output | The final chat JSON MUST include `workDir` and `cleanupPaths: ["<workDir>"]`. |
| Runtime files | Raw tool responses, normalized JSON, discovered context, caches, and intermediate docs belong under `workDir`. |
| LLM handoff docs | Temporary documents meant for another LLM to resume MUST be JSON, not Markdown. |
| Durable files | Briefings, plans, reports, specs, and committed docs MUST NOT live under `workDir`. |
| Cleanup | Wrapup deletes every path in `cleanupPaths` after durable outputs are verified. |

## Script Interface

| Case | Required behavior |
|------|-------------------|
| `--work-dir` passed | Use that directory for every default temporary output. Create it if missing. |
| `--work-dir` omitted | Create/use `.agent-local/runtime/<workflow>-<stable-id>/`. |
| `--out` passed | Write that exact file. If it is temporary, prefer a path inside `workDir`. |
| `--out-dir` passed | Use it only to derive the default `workDir`; do not scatter files directly under it. |
| Failure JSON | Include `ok: false`, `error`, and `detail`. Include `workDir` if known. |

## Bad / Good

Bad:

```text
raw.json in the repo root
intake-STL-431.json in the repo root
context.json in the repo root
/var/folders/.../related.json
```

Good:

```text
.agent-local/runtime/shotloom-start-task-STL-431/linear-raw.json
.agent-local/runtime/shotloom-start-task-STL-431/intake.json
.agent-local/runtime/shotloom-start-task-STL-431/context-discover.json
.agent-local/runtime/shotloom-start-task-STL-431/context.json
.agent-local/runtime/shotloom-start-task-STL-431/related-STL-430-raw.json
```

Bad LLM handoff:

```text
.agent-local/reports/20260530-continue-shotloom-docs.md
.agent-local/shotloom/planning/stl-431/brief.md
```

Good LLM handoff:

```text
.agent-local/reports/20260530-continue-shotloom-docs.json
.agent-local/shotloom/planning/stl-431/brief.json
```

## Consumer Rule

If a skill writes temporary runtime files, it MUST:

1. Name this standard in the skill body.
2. Capture `workDir` from the first script output.
3. Pass `--work-dir "$workDir"` to later helper scripts.
4. Return `cleanupPaths` in the final JSON.
