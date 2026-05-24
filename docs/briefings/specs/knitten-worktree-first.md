---
status: intake
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
spec: docs/plans/active/knitten-worktree-first.md
---

# Spec Intake: knitten-worktree-first

## User Request

Create a spec for Knitten work that forces write-capable agent work through a
new git worktree. The user explicitly wants each execution to create a new
worktree.

## Goal

Make Knitten write work start from an isolated worktree by default and fail at
commit or push time when an agent attempts to use the main checkout.

## Route

- selected route: `ah-manage-spec`
- candidate routes: `ah-route-implementation`, `ah-manage-config`
- delegated or referenced skills: `agent/skills/ah-manage-spec/SKILL.md`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `SYSTEM.md` | Defines shared layer ownership and deploy target terminology. |
| file | `agent/rules/git-defaults.md` | Owns default git behavior and push discipline. |
| file | `agent/rules/behavior.md` | Defines plan approval triggers for rules, hooks, and harness config. |
| file | `agent/rules/shotloom.md` | Existing repo-specific worktree precedent. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | Spec lifecycle workflow. |
| command | `git worktree list --porcelain` | Shows the current main checkout and stale worktree state. |
| user | Current chat | User decision: each execution creates a new worktree. |

## Known Decisions

- Every Knitten write-session starter invocation creates a fresh worktree and a
  fresh task-typed branch such as `feat/`, `fix/`, `docs/`, or `chore/`.
- Worktree-first is opt-in per repository. Lightweight projects stay outside
  enforcement unless their repo config entry has `worktreePolicy.enabled:
  true`.
- Initial allowlist is `knitten`, `shotloom`, and `story-previz`.
- `shotloom` keeps its existing Shotloom worktree workflow where that
  workflow exists; the repo config field registers scope instead of replacing
  it.
- Existing `agent-hub` repo key is a legacy identity for Knitten and must map
  to `knitten` before enforcement.
- Worktree directory names and branch bodies use `<stamp>-<task-slug>`; do not
  repeat `knitten` inside `../knitten-worktrees/`.
- Existing Knitten task worktrees are not reused unless the user names one
  explicitly.
- Read-only inspection can run in the main checkout.
- Commit and push from the main checkout are blocked by local git hooks except
  for an explicitly allowed small chore lane.
- The first implementation should include starter, guard, hook installer,
  status command, and git-defaults rule.
- Hook installation uses repo-local `core.hooksPath`; global git config is not
  modified.
- Validation uses test-mode worktrees and must clean up test branches and
  worktrees before final status.
- Hook validation must prove `git commit` and `git push --dry-run` are blocked
  from the main checkout.
- Cleanup is dry-run by default and requires explicit approval before deletion.
- End-of-task cleanup should remove local task worktrees only after PR merge or
  explicit abandonment, with clean status, merged branch state, and absent
  remote branch.
- Branch and worktree names use timestamps; commit subjects and PR titles use
  meaning-first text without timestamps.

## Open Questions

- None for the initial spec.

## Exclusions

- Do not force worktrees for non-Knitten repositories.
- Do not apply worktree-first globally across all personal repositories.
- Do not move or delete existing stale worktrees in this spec.
- Do not require GitHub branch protection in the first implementation.

## Validation Expected

- Starter script creates two distinct worktrees when run twice with the same
  slug.
- Main checkout pre-commit and pre-push guards fail.
- Task worktree pre-commit and pre-push guards pass.
- `git diff --check` passes.
- `node scripts/validate-llm-first.mjs` passes.
