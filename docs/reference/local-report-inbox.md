---
status: accepted
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
---

# Local Report Inbox

## Rule

Use `.agent-local/reports/` for report-only cross-session handoff that must not
create a branch, worktree, commit, or PR.

Do not run `scripts/worktree-start.mjs` for report-only handoff. The inbox is
the exception path that exists so another session can leave local state without
creating git state.

All LLM-to-LLM temporary handoff documents MUST be JSON. Do not write Markdown
handoff reports under `.agent-local/`; Markdown is allowed only after the
content is promoted to a durable tracked owner path.

## Path Contract

| Path | Status | Use |
|---|---|---|
| `.agent-local/` | gitignored | Local-only agent scratch and handoff tree. |
| `.agent-local/reports/` | gitignored | JSON-only report session handoff files. |
| `.agent-local/ah/operational-findings/` | gitignored | JSON-only Knitten-wide temporary operational finding queue. |

## Allowed Content

| Content | Example path |
|---|---|
| Session status | `.agent-local/reports/20260529-main-status.json` |
| Investigation summary | `.agent-local/reports/20260529-stage-flow-investigation.json` |
| Other-session handoff | `.agent-local/reports/20260529-continue-shotloom-docs.json` |
| Operational finding queue | `.agent-local/ah/operational-findings/2026-05-29/inbox.json` |

## JSON Contract

Template:
`agent/document-templates/agent-hub/json-handoff-packet.json`.

Use the template for generic `.agent-local/reports/*.json` handoff packets.
Specialized workflows may add fields, but they must keep the routing fields
below unless a workflow-specific schema replaces them.

Path scripts expose the same hint. When resolving a generic handoff path with
`agent/lib/resolve-local-artifact-path.mjs`, read `template` and `schemaKind`
from the resolver JSON instead of hardcoding the template path in the caller.

| Field | Required | Meaning |
|---|---|---|
| `schemaVersion` | yes | Integer schema version. Start at `1`. |
| `kind` | yes | Stable artifact kind, for example `session-handoff`, `investigation-summary`, or `operational-finding-report`. |
| `created` | yes | `YYYY-MM-DD` or full ISO timestamp. |
| `updated` | yes | `YYYY-MM-DD` or full ISO timestamp. |
| `status` | yes | `active`, `blocked`, `ready`, `captured`, `done`, or another explicit workflow state. |
| `summary` | yes | One short string that lets the next LLM route the artifact. |
| `context` | no | Object or array with repo, branch, PR, issue, command, or evidence references. |
| `nextAction` | no | The concrete action expected from the next LLM. |
| `cleanupPaths` | no | Local-only paths the next LLM may remove after durable promotion or completion. |
| `decisionBasis` | no | Short LLM-facing reason/tradeoff for the next session. |

## Format Boundary

| Surface | Format |
|---|---|
| LLM-to-LLM temporary handoff under `.agent-local/` | JSON |
| Raw command/tool capture under `.agent-local/runtime/` | Native machine format, prefer JSON when possible |
| Logs, pid files, lock files, shell output | Native runtime format |
| Durable repo docs under `docs/`, `agent/rules/`, `agent/standards/`, `agent/skills/` | Markdown or repo-owned format |

## Forbidden Content

| Content | Required action |
|---|---|
| Secret, token, credential, or private key | Do not write it. |
| Durable rule, standard, skill, spec, milestone, or decision | Write the tracked owner file in a worktree. |
| Accepted operational finding | Capture in `.agent-local/ah/operational-findings/`, then promote durable knowledge to the owning artifact. |
| Source code change request | Create or resume a task worktree. |

## Branch Decision

| Situation | Action |
|---|---|
| User asks only to leave a local report for another session | Write `.agent-local/reports/<date>-<slug>.json` from the current checkout; do not create a branch or worktree. |
| User asks to implement, fix, document durable policy, or commit | Use the normal worktree-first flow. |
| A local report contains a decision that must persist | Move the decision into the tracked owner path, then commit through PR flow. |

## Validation

| Check | Command |
|---|---|
| Confirm ignore behavior | `git check-ignore -q .agent-local/reports/example.json` |
| Confirm no accidental tracking | `git status --short --ignored .agent-local/` |
