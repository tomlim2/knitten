# Knitten System

## Contract

| Rule | Meaning |
|------|---------|
| Plugin source | The checkout is loaded by Codex through `.codex-plugin/plugin.json`. |
| Core plugin | This repository contains plugin identity, entry guidance, validation, local registration, and shared workflow contracts. |
| Path/output core | Durable documents stay with the target workspace; shared local outputs stay in the Knitten hub. |
| Self-contained source | Operation does not require a second harness-specific source tree. |
| Domain plugin boundary | Skills, standards, domain workflows, and working documents live in separate domain plugins. |

## Load

Codex reads plugin metadata from `.codex-plugin/plugin.json`.

## Runtime Assumptions

Do not require another harness runtime, private local paths, domain service
credentials, or legacy source checkouts for this plugin to load.

## Boundary

Canonical boundary policy lives in
`docs/guidelines/plugin-boundary.md`.

## Terms

- Shared workflow: the generic Codex workflow layer for preparing work, drafting
  specs, implementing, reviewing, and wrapping up tasks.
- Knitten hub: the Knitten-owned local storage root for shared local outputs,
  including the finding report queue.
- Output contract: a registered resolver entry exposed through
  `KNITTEN_PATH_BIN output`.
- Local artifact path registry: registered local path entries used for
  task-scoped rolling context.
- Agent profile: a Core-owned semantic execution profile that resolves to one
  model, reasoning effort, sandbox mode, and fallback policy.
- Domain plugin source root: the source checkout for a domain plugin, distinct
  from an installed plugin root or materialized copy.

## Long-Running Work

Repositories hold code, specs, and committed durable docs. Registered local
artifact paths hold rolling work context: decisions, open loops, verification
state, review notes, briefings, and resume handoffs.

Do not rely on chat history as the only memory for reusable task context. Write
reusable context through core-owned output contracts or the local artifact path
registry.

When a target workspace accepts its own local task-memory contract, that
workspace owns the physical task artifact root. Knitten Core may keep old registry
entries as explicit compatibility surfaces, but new primary storage should
resolve under the target workspace through that workspace's resolver contract.

## Operation Room Status

When a local Knitten Operation Room is configured, the primary user-owned
Codex task publishes a compact snapshot of its current state. Subagents do not
publish separate entries.

- Use `bin/knitten-opr-status publish`; never rewrite the shared JSON directly.
- The publisher keys entries by `CODEX_THREAD_ID` and replaces the prior entry,
  so the file contains current state rather than an activity log.
- Publish after the target is known, at material phase changes, when waiting on
  the user or an external system, when blocked, and immediately before the
  final response.
- Keep only the current target, phase, concise summary, next action, blocker,
  and user-input requirement. Do not include completed-action history,
  transcripts, commentary, test logs, or prior statuses.
- Treat publishing as best-effort observability. A missing configuration,
  workspace-filter skip, or transient publisher failure must not expand or
  block the primary task.

The publisher resolves its destination from `KNITTEN_OPR_STATUS_FILE` or the
user-local Knitten configuration. Core source must not contain a personal
absolute destination path.

### Thread Assignment Model

Every published thread declares exactly one `threadKind`: `work`, `pr`, or
`review`. Inference is not allowed. The board derives its four visible states
from the declared kind and lifecycle:

- an active `work` thread appears as work
- an active `pr` thread appears as PR
- an active `review` thread appears as requested PR review
- every waiting thread appears as waiting

Waiting threads declare `availability=reserved` while CI, review, author
changes, merge, user input, or another current dependency is outstanding.
They declare `availability=available` only when the current assignment is
released and the slot can accept unrelated work. Work threads remain reserved
to their working branch until the user explicitly releases them.

### Reassignment Gate

Assigning new work to an available thread requires both gates below. This is a
mandatory transition contract, not a recommendation.

1. Check the exact target worktree with Git. It must have no staged, unstaged,
   or untracked changes and no merge, rebase, cherry-pick, revert, or sequencer
   operation in progress. Never clean, reset, stash, switch, or delete merely
   to make this gate pass; report the dirty state and stop the assignment.
2. Send an explicit reset packet containing a unique packet id, thread id,
   declared thread kind, new assignment id and objective, repository,
   worktree, expected branch and base, PR/Linear targets when present, scope
   constraints, and confirmation that the previous assignment is closed.

Only after both gates pass may the thread clear its previous current-state
fields, accept the new assignment, and publish an active status. The OPR JSON
stores only the new current assignment and the reset packet id; it does not
retain the previous assignment as history.

Codex may prepare summaries, evidence, drafts, patches, and next-step
recommendations. User approval is required for publishing, external posting,
deployment, destructive cleanup, or irreversible external-state changes unless
the active skill documents a narrower explicit exemption. A direct current-turn
instruction for an exact action counts as approval for that action only after
the scoped command still matches the request. Do not ask again for that same
action merely to restate its repository, branch, paths, generated local commit
message, or other implementation details. Ask only when the target, mutation
surface, or user-visible external payload expands or materially changes beyond
the approved action.

## Agent Profiles

`agent/config/agent-profiles.json` is the single source of truth for subagent
model, reasoning, sandbox, and fallback settings. Core and domain skills select
profiles by purpose and resolve them through `knitten-path agent-profile`; they
must not pin model ids in skill instructions. Skills retain ownership of role
selection, spawn conditions, task packets, and mutation boundaries.

## Mechanical Finding Capture

Use `knitten:report-finding` only for checked mechanical errors:

- missing file, path, script, config, skill, or command
- stale skill reference to a moved config or helper
- source, installed copy, or Codex cache drift
- doctor, validator, install, or plugin boundary failure

Do not record ideas, naming/style preferences, guesses, one-off confusion, or
user-directed scope changes.

All finding records belong to this Knitten core plugin. Even when the defect is
observed while using a domain plugin, store the report in Knitten's finding
report queue, not in the domain plugin.

When locating that queue, an explicit existing finding path supplied by the
user is authoritative. Otherwise run `bin/knitten-resolve-output` from the
runtime Knitten plugin root that supplied the loaded `report-finding` skill and
trust its `operationalFindingsRoot` or `selectedPath`. Do not infer the active
queue from the current working directory, the checkout containing this
`SYSTEM.md`, another plugin, or a manually assembled `.agent-local` path. A
source checkout's `.agent-local` is its own queue only when that checkout was
explicitly selected as the hub.

## Promoted References

Domain plugins may place `reference-promoted.md` next to a domain skill's
`SKILL.md`. The domain plugin that owns the skill owns the CRUD workflow.

Use the domain plugin's promote-reference skill for every create, update,
delete, promotion, retirement, or move involving `reference-promoted.md`.

Use promoted references only for temporary supplemental rules, checks, or
patterns that should affect skill execution now but are not stable enough for
`SKILL.md`, `reference.md`, a script, a test, or a repository guideline.

Promotion criteria:

- The issue is repeatable or mechanically checkable.
- A skill-local trigger and check can prevent recurrence.
- The rule is not already covered by a stable owner.
- The entry has a clear retirement target.

If `reference-promoted.md` exists, the domain skill must inspect its trigger
index after `reference.md` and read only matching promoted sections. If it does
not exist, skip it.
