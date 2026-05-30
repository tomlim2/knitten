---
status: proposed
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
milestone:
---

# Shotloom Local Artifact Path Unification

## Purpose

Define local-only artifact paths for Shotloom planning/runtime outputs and
Knitten-wide operational finding captures.

## Problem

Shotloom workflows currently mix three artifact classes:

| Class | Current shape | Defect |
|---|---|---|
| Planning artifacts | `docs/briefings/shotloom/**`, `docs/plans/**` | Temporary planning state is tracked as durable docs. |
| Reporting artifacts | `docs/briefings/operational-findings/**` | Knitten-wide findings queue is tracked before promotion. |
| Runtime artifacts | `/tmp/shotloom-*`, `~/.claude/ops/**` | Outputs are split across external temp and harness-specific legacy paths. |

This makes agents treat temporary state as durable knowledge and makes cleanup
ambiguous.

## Goals

| Goal | Requirement |
|---|---|
| Separate local temp from durable knowledge | Raw planning, reporting, logs, and handoff JSON live under `.agent-local/**`. |
| Preserve Knitten-wide reporting ownership | Operational finding capture uses `ah`, not `shotloom`, in its path. |
| Preserve Shotloom-specific ownership | Shotloom planning and runtime artifacts use `.agent-local/shotloom/**`. |
| Remove harness runtime ownership | New outputs do not write to `~/.claude/**`. |
| Replace rule prose with executable resolution | Skills call one local artifact resolver instead of duplicating path strings. |
| Keep tracked knowledge explicit | Only promoted findings, skill edits, rules, standards, specs, validators, and decisions remain tracked. |

## Non-Goals

| Non-Goal | Reason |
|---|---|
| Move Shotloom repo docs | ADRs, guidelines, IPC docs, and repo-owned docs stay inside the Shotloom repo. |
| Delete historical tracked reports in this phase | Migration can leave legacy reports until a cleanup pass decides what remains useful. |
| Make Obsidian a default Shotloom output | Obsidian is human recall, not the default artifact path for this workflow. |
| Replace all generic temp behavior in Knitten | This spec only defines Shotloom and operational-finding paths. |

## Path Contract

All paths are relative to an explicit Knitten root. The resolver accepts
`--root <knitten-root>`; when omitted, it uses the current git root only if that
root is the Knitten agent-hub checkout.

Do not resolve these paths from a Shotloom repo checkout. If a Shotloom skill
runs from a Shotloom worktree, it must first resolve the Knitten checkout from
repo config, pass it as `--root`, then use the returned path.

| Artifact | Canonical local path | Owner |
|---|---|---|
| Shotloom planning bundle | `.agent-local/shotloom/planning/stl-<N>/` | Shotloom workflow |
| Shotloom planning brief | `.agent-local/shotloom/planning/stl-<N>/brief.json` | `shotloom-start-task` |
| Shotloom spec draft | `.agent-local/shotloom/planning/stl-<N>/spec.json` | `shotloom-draft-spec` |
| Shotloom design plan | `.agent-local/shotloom/planning/stl-<N>/design-plan.json` | `shotloom-draft-spec` |
| Shotloom open questions | `.agent-local/shotloom/planning/stl-<N>/questions.json` | Planning workflow |
| Shotloom before-PR readiness | `.agent-local/shotloom/before-pr/stl-<N>/<safe-branch>/readiness.json` | `shotloom-review-before-pr` |
| Shotloom before-PR blockers | `.agent-local/shotloom/before-pr/stl-<N>/<safe-branch>/<phase>-blockers.json` | `shotloom-review-before-pr` |
| Shotloom PR watcher state | `.agent-local/shotloom/pr/<N>/` | `shotloom-auto-pr` |
| Shotloom deploy state | `.agent-local/shotloom/deploy/<date-or-version>/` | `shotloom-deploy-web` |
| Operational findings daily queue | `.agent-local/ah/operational-findings/YYYY-MM-DD/` | `ah-report-finding` |
| Operational findings inbox | `.agent-local/ah/operational-findings/YYYY-MM-DD/inbox.json` | `ah-report-finding` |
| Operational finding reports | `.agent-local/ah/operational-findings/YYYY-MM-DD/reports/<slug>.json` | `ah-report-finding` |
| Generic local handoff | `.agent-local/reports/<date>-<slug>.json` | Local report inbox |

`.agent-local/` is gitignored. No new ignore entry is required; update the
`.gitignore` comment to name local artifacts.

## Durable Knowledge Contract

| Input | Durable destination after promotion |
|---|---|
| Reusable Shotloom planning lesson | `agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md` or owning planning skill/reference |
| Reusable Shotloom implementation lesson | `agent/skills/shotloom-implement-code/PROMOTED_FINDINGS.md` or executable test/validator |
| Reusable Shotloom code-review lesson | `agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md` or executable test/validator |
| Reusable Shotloom docs-review lesson | `agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md` or docs validator |
| Knitten-wide workflow lesson | owning `agent/skills/`, `agent/rules/`, `agent/standards/`, `scripts/`, or `docs/decisions/` file |

Raw local reports are not durable knowledge.

## Script Contract

Add executable path resolution before editing skills:

| Script | Responsibility |
|---|---|
| `agent/lib/resolve-local-artifact-path.mjs` | Resolve `.agent-local/**` paths by owner and artifact type. |
| `scripts/operational-findings-report.mjs` | Capture reports after resolving paths through `resolve-local-artifact-path.mjs`. |

`agent/lib/resolve-local-artifact-path.mjs` accepts:

```bash
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 brief
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 spec
node agent/lib/resolve-local-artifact-path.mjs shotloom before-pr stl-123 <branch> readiness
node agent/lib/resolve-local-artifact-path.mjs shotloom before-pr stl-123 <branch> code-blockers
node agent/lib/resolve-local-artifact-path.mjs shotloom pr 431 log
node agent/lib/resolve-local-artifact-path.mjs shotloom deploy 2026-05-29 release-notes
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 inbox
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 report <slug>
node agent/lib/resolve-local-artifact-path.mjs --root <knitten-root> shotloom planning stl-123 manifest
```

Output JSON:

```json
{
  "ok": true,
  "owner": "shotloom",
  "artifactType": "planning",
  "root": "<knitten-root>",
  "path": ".agent-local/shotloom/planning/stl-123/brief.json",
  "absolutePath": "<knitten-root>/.agent-local/shotloom/planning/stl-123/brief.json",
  "cleanupPath": ".agent-local/shotloom/planning/stl-123"
}
```

Error JSON:

```json
{
  "ok": false,
  "error": "invalid-stl",
  "detail": "expected stl-<number>"
}
```

Resolution rules:

| Owner | Artifact type | Args | Output |
|---|---|---|---|
| `shotloom` | `planning` | `stl-<N> brief\|spec\|design-plan\|questions\|manifest` | `.agent-local/shotloom/planning/stl-<N>/<file>` |
| `shotloom` | `before-pr` | `stl-<N> <safe-branch> readiness\|code-blockers\|docs-blockers` | `.agent-local/shotloom/before-pr/stl-<N>/<safe-branch>/<file>` |
| `shotloom` | `pr` | `<N> watcher-pid\|watcher-log\|react-log\|state\|last-event\|log` | `.agent-local/shotloom/pr/<N>/<file>` |
| `shotloom` | `deploy` | `<date-or-version> release-notes\|manifest\|rollback` | `.agent-local/shotloom/deploy/<date-or-version>/<file>` |
| `ah` | `reports` | `YYYYMMDD handoff <slug>` | `.agent-local/reports/YYYYMMDD-<slug>.json` |
| `ah` | `operational-findings` | `YYYY-MM-DD inbox` | `.agent-local/ah/operational-findings/YYYY-MM-DD/inbox.json` |
| `ah` | `operational-findings` | `YYYY-MM-DD report <slug>` | `.agent-local/ah/operational-findings/YYYY-MM-DD/reports/<slug>.json` |

Script requirements:

| Requirement | Behavior |
|---|---|
| Root validation | Reject when `--root` or cwd is not the Knitten agent-hub checkout. |
| Owner validation | Accept only `shotloom` and `ah` in this spec. |
| Creation mode | Resolve by default; create parent directories only with `--create`. |
| Output shape | Always print JSON. Do not print prose on success. |
| Error shape | Print JSON with `ok: false`, `error`, and `detail`; exit non-zero. |

`planning manifest` writes:

```json
{
  "stl": "stl-123",
  "brief": ".agent-local/shotloom/planning/stl-123/brief.json",
  "spec": ".agent-local/shotloom/planning/stl-123/spec.json",
  "designPlan": ".agent-local/shotloom/planning/stl-123/design-plan.json",
  "questions": ".agent-local/shotloom/planning/stl-123/questions.json"
}
```

Implementation consumes the manifest path, not individual guessed filenames.

Planning split rule:

| File | Content |
|---|---|
| `brief.json` | Issue intake, source sweep, related context, open questions, and next handoff. |
| `spec.json` | Requirements, contracts, non-goals, acceptance criteria, and verification obligations. |
| `design-plan.json` | Ordered implementation phases, file/surface plan, validation order, and rollback notes. |
| `questions.json` | Unanswered user/product/design questions only. |
| `manifest.json` | Machine-readable pointers to the files above and the STL id. |

## Skill Changes

| File | Required change |
|---|---|
| `agent/rules/shotloom-docs-lane.md` | Delete. Path ownership moves to scripts. |
| `agent/rules/index.md` | Remove `shotloom-docs-lane.md`. |
| `agent/skills/shotloom-start-task/SKILL.md` | Resolve and write planning brief through `resolve-local-artifact-path.mjs`. |
| `agent/skills/shotloom-draft-spec/SKILL.md` | Resolve and write spec, design plan, and planning manifest. |
| `agent/skills/shotloom-draft-task-plan/SKILL.md` | Mark as legacy compatibility or update to resolver-only paths. |
| `agent/skills/shotloom-review-task-plan/SKILL.md` | Read local planning artifacts through resolver output. |
| `agent/skills/shotloom-prepare-task/SKILL.md` | Stop referring to the daily Shotloom docs lane. |
| `agent/skills/shotloom-review-before-pr/SKILL.md` | Resolve and write readiness and blockers through `resolve-local-artifact-path.mjs`. |
| `agent/skills/shotloom-make-pr/SKILL.md` | Resolve and read readiness JSON through `resolve-local-artifact-path.mjs`. |
| `agent/skills/shotloom-auto-pr/*` | Write watcher state/logs under `.agent-local/shotloom/pr/<N>/`. |
| `agent/skills/shotloom-respond-pr/*` | Write PR response snapshots, start context, and reply plan under `.agent-local/shotloom/pr/<N>/`. |
| `agent/skills/shotloom-review-pr/SKILL.md` | Write reviewer-side PR metadata, diff, payload, and submitted review under `.agent-local/shotloom/pr/<N>/`. |
| `agent/skills/shotloom-verify-review/*` | Write verification state under `.agent-local/shotloom/pr/<N>/` or `.agent-local/shotloom/review/<N>/`. |
| `agent/skills/shotloom-deploy-web/SKILL.md` | Write deploy temp under `.agent-local/shotloom/deploy/**`; stop using Obsidian staging as default output. |
| `agent/skills/ah-report-finding/SKILL.md` | Capture through `resolve-local-artifact-path.mjs`; do not commit or push raw reports. |
| `agent/skills/shotloom-promote-findings/SKILL.md` | Read Knitten-wide local findings queue and promote Shotloom items into owning ledgers. |
| `agent/skills/shotloom-wrapup-task/references/pattern-candidates.md` | Use `ah-report-finding` local queue; remove findings worktree instructions. |

## Legacy Paths

| Legacy path | New behavior |
|---|---|
| `docs/briefings/shotloom/**` | Read-only historical input unless a separate migration preserves selected docs. |
| `docs/plans/proposed/**` / `docs/plans/drafts/**` for Shotloom task planning | Read-only historical input unless promoted to durable spec intentionally. |
| `docs/briefings/operational-findings-inbox.md` | Legacy tracked queue; new capture uses `.agent-local/ah/operational-findings/**`. |
| `docs/briefings/operational-findings/reports/**` | Legacy tracked reports; promotion may consume them until cleanup. |
| `docs/briefings/shotloom/review-finding-patterns-inbox.md` | Legacy compatibility inbox. |
| `/tmp/shotloom-*` | Stop writing new files. |
| `~/.claude/ops/**` | Harness legacy fallback only; stop writing new files. |
| `agent/obsidian-staging/projects/shotloom/**` | Not a default Shotloom workflow output. |

## Migration Plan

| Phase | Action | Output |
|---|---|---|
| 1. Resolver | Add `agent/lib/resolve-local-artifact-path.mjs` with owner/type validation and JSON output. | One executable owner for local artifact paths. |
| 2. Reporting capture | Change `scripts/operational-findings-report.mjs` and `ah-report-finding` to call the resolver. | Knitten-wide reporting no longer creates tracked raw reports. |
| 3. Rule removal | Delete `shotloom-docs-lane.md` and remove it from `agent/rules/index.md`. | No prose-only Shotloom docs lane. |
| 4. Planning skills | Move planning outputs to resolver paths. | STL-based local planning bundle. |
| 5. Runtime skills | Move before-pr, auto-pr, verify-review, and deploy temp outputs to resolver paths. | No new `/tmp/shotloom-*` or `~/.claude/ops/**` writes. |
| 6. Promotion reads | Update promotion skills to read `.agent-local/ah/operational-findings/**` plus legacy tracked reports. | Local capture can still become durable knowledge. |
| 7. Cleanup audit | List tracked historical Shotloom planning/report docs and decide keep, archive, or delete. | Separate cleanup PR or follow-up spec. |

## Validation

Run after implementation:

```bash
node --check agent/lib/resolve-local-artifact-path.mjs
node --check scripts/operational-findings-report.mjs
node scripts/operational-findings-report.mjs capture \
  --summary "local operational finding smoke test" \
  --context "path-unification-smoke" \
  --source user-report \
  --area workflow \
  --dry-run
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 brief
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 manifest
node agent/lib/resolve-local-artifact-path.mjs shotloom before-pr stl-123 feat-example readiness
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 inbox
git check-ignore .agent-local/shotloom/planning/stl-123/brief.json
git check-ignore .agent-local/ah/operational-findings/2026-05-29/inbox.json
rg -n '(^| )(mkdir|mktemp|write|append|OPS_DIR=|notes_file=|tmpdir=).*(/tmp/shotloom|~/.claude/ops|agent/obsidian-staging/projects/shotloom)' \
  agent/skills/shotloom-* agent/rules scripts
! rg -n 'shotloom-docs-lane' agent/skills/shotloom-* agent/rules scripts
node scripts/validate-llm-first.mjs
git diff --check
```

Expected:

| Check | Expected result |
|---|---|
| Resolver commands | JSON with `ok: true`, `owner`, `artifactType`, `root`, `path`, `absolutePath`, and `cleanupPath`. |
| `git check-ignore` | Exit 0 for both `.agent-local` sample paths. |
| Legacy write grep | No write instructions remain for legacy paths. |
| `shotloom-docs-lane` grep | No references remain. |
| LLM validator | Pass. |
| Git diff check | Pass. |

## Open Questions

| Question | Default answer |
|---|---|
| Should old tracked Shotloom planning docs be deleted? | No in this spec; create a cleanup pass after path migration. |
| Should promoted finding ledgers keep source links to local reports? | No for long-term entries; use a short source label or copy only reusable mechanism. |
| Should `.agent-local/ah/operational-findings/**` survive across sessions? | Yes locally; cleanup is explicit or wrapup-driven. |

## Cleanup Contract

| Artifact group | Retain until | Cleanup action |
|---|---|---|
| Shotloom planning bundle | Implementation starts or user abandons the task. | Delete `.agent-local/shotloom/planning/stl-<N>/` after the implementation input is no longer needed. |
| Shotloom before-PR files | PR is created, abandoned, or superseded. | Delete `.agent-local/shotloom/before-pr/stl-<N>/<safe-branch>/`. |
| Shotloom PR watcher files | PR is merged, closed, or watcher is stopped and no follow-up remains. | Delete `.agent-local/shotloom/pr/<N>/`. |
| Shotloom deploy files | Deploy report is delivered and rollback window ends. | Delete `.agent-local/shotloom/deploy/<date-or-version>/`. |
| Operational finding local queue | Finding is promoted, discarded, or copied into a durable owner. | Delete the specific report or the whole empty daily directory. |

## Provenance Contract

Operational finding capture assigns a stable local ID:

```text
ah-of-YYYYMMDD-<slug>
```

Promoted entries use the ID and copied mechanism, not a long-term dependency on
the local report path:

```md
- Source: `ah-of-20260529-path-unification`
- Mechanism: <specific reusable failure mode>
```
