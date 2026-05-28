---
status: accepted
---
# Temporary Runtime Files Standard

## Contract

| Rule | Requirement |
|------|-------------|
| One task, one directory | Every task that writes temporary runtime files MUST create one `workDir`. |
| Directory name | Default: `/tmp/<workflow>-<stable-id>/`. Example: `/tmp/shotloom-start-task-STL-431/`. |
| Override | Scripts MUST accept `--work-dir <dir>` when they write more than one temporary file. |
| Discovery output | The first script that creates the directory MUST print `workDir` in JSON. |
| Final output | The final chat JSON MUST include `workDir` and `cleanupPaths: ["<workDir>"]`. |
| Runtime files | Raw tool responses, normalized JSON, discovered context, caches, and intermediate docs belong under `workDir`. |
| Durable files | Briefings, plans, reports, specs, and committed docs MUST NOT live under `workDir`. |
| Cleanup | Wrapup deletes every path in `cleanupPaths` after durable outputs are verified. |

## Script Interface

| Case | Required behavior |
|------|-------------------|
| `--work-dir` passed | Use that directory for every default temporary output. Create it if missing. |
| `--work-dir` omitted | Create/use `/tmp/<workflow>-<stable-id>/`. |
| `--out` passed | Write that exact file. If it is temporary, prefer a path inside `workDir`. |
| `--out-dir` passed | Use it only to derive the default `workDir`; do not scatter files directly under it. |
| Failure JSON | Include `ok: false`, `error`, and `detail`. Include `workDir` if known. |

## Bad / Good

Bad:

```text
/tmp/raw.json
/tmp/intake-STL-431.json
/tmp/context.json
/var/folders/.../related.json
```

Good:

```text
/tmp/shotloom-start-task-STL-431/linear-raw.json
/tmp/shotloom-start-task-STL-431/intake.json
/tmp/shotloom-start-task-STL-431/context-discover.json
/tmp/shotloom-start-task-STL-431/context.json
/tmp/shotloom-start-task-STL-431/related-STL-430-raw.json
```

## Consumer Rule

If a skill writes temporary runtime files, it MUST:

1. Name this standard in the skill body.
2. Capture `workDir` from the first script output.
3. Pass `--work-dir "$workDir"` to later helper scripts.
4. Return `cleanupPaths` in the final JSON.
