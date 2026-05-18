---
status: active
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
milestone: worktree-first-workflow
repo: agent-hub
standard: agent/standards/policy/llm-first-docs.md
intake: docs/briefings/specs/knitten-worktree-first.md
branch: codex/20260518-102544-worktree-first
---

# Knitten Worktree First

## Purpose

Force Knitten write-capable agent work through task-specific git worktrees.

## Problem

| Problem | Consequence |
|---|---|
| Agents can edit the main checkout directly | Unrelated user edits and agent edits can mix before review. |
| Instructions alone do not stop commit or push mistakes | A cold-start session can forget the preferred workflow. |
| Existing worktrees can be reused accidentally | Separate tasks can share branch state and stale assumptions. |
| Main checkout edits are not blocked by git until commit time | Raw file edits can still occur before the guard runs. |

## Goals

| Goal | Acceptance |
|---|---|
| Fresh isolation per execution | Each starter invocation creates a new worktree and a new `codex/` branch. |
| Repo opt-in enforcement | Worktree-first applies only to repositories whose repo config has `worktreePolicy.enabled: true`. |
| Main checkout protection | Commit and push from the main checkout fail with a clear message. |
| Lightweight branch lane | Small docs-only and CI/CD-only changes can use a primary-checkout feature branch when explicitly enabled. |
| LLM-visible workflow | Auto-loaded git rules tell agents to start Knitten write work in a new worktree. |
| Deterministic naming | Worktree paths and branch names use `<stamp>-<task-slug>`, so repeated runs do not collide and repo names do not repeat. |
| Operational visibility | A status command shows active, dirty, stale, and merged worktrees. |
| Explicit resume behavior | New write-capable requests create new worktrees; explicit resume requests can reuse a named worktree. |
| Conservative cleanup | Cleanup defaults to dry-run and removes only clean, merged, user-approved worktrees. |
| End-of-task cleanup | After PR merge or explicit abandonment, local task worktrees can be removed only when clean, merged, and no longer present on the remote. |
| Local-only cleanup wording | User phrase `니튼 미사용 로컬 워크트리 정리` means switch Knitten to `main` and remove clean local worktree directories only; branches are preserved. |
| Local verification | The implementation includes commands that prove main checkout guards fail and worktree guards pass. |

## Non-Goals

| Non-goal | Reason |
|---|---|
| Force worktrees for read-only inspection | Read-only commands do not mutate repo state. |
| Force worktrees for every repository | Lightweight repositories stay outside the policy unless explicitly registered. |
| Delete stale worktrees automatically | Cleanup is destructive and needs an explicit user action. |
| Move existing tags or branches | Release tagging stays under direct user approval. |
| Require GitHub branch protection | Local enforcement is the first implementation layer. |
| Allow `main` direct commits | The lightweight lane permits feature branches only. |

## Current State

| Surface | Current state | Evidence |
|---|---|---|
| Main checkout | `repo-paths.json:agent-hub.path` is the current primary `main` worktree for Knitten | `git worktree list --porcelain` |
| Stale worktree | One stale old `caol-ila/.claude/worktrees/...` entry exists | `git worktree list --porcelain` |
| Git rules | `agent/rules/git-defaults.md` bans auto-push but does not require Knitten worktrees | `agent/rules/git-defaults.md` |
| Worktree precedent | Shotloom has worktree-specific rules and cleanup skills | `agent/rules/shotloom.md`, `agent/skills/shotloom-start-task/SKILL.md` |
| Hooks | Knitten has tracked harness hooks but no repo-local git hook installer for this policy | `agent/hooks/`, `rg "pre-commit\|pre-push"` |

## Scope Model

Worktree-first is opt-in per repository. Do not apply it globally.

Detect worktree-first from repo config. Do not create a separate allowlist file.

```text
~/.claude/private/agent-hub-config/repo-paths.json
```

Repo config entry shape:

```json
{
  "knitten": {
    "path": "/path/to/knitten",
    "worktreePolicy": {
      "enabled": true,
      "worktreeRoot": "../knitten-worktrees",
      "branchPrefix": "codex/",
      "requireFreshPerExecution": true,
      "blockMainCommit": true,
      "blockMainPush": true,
      "allowMainFeatureBranch": true
    }
  },
  "shotloom": {
    "path": "/path/to/shotloom",
    "worktreePolicy": {
      "enabled": true,
      "worktreeRoot": ".worktrees",
      "branchPrefix": "codex/",
      "requireFreshPerExecution": true,
      "blockMainCommit": true,
      "blockMainPush": true,
      "deferToRepoWorkflow": true
    }
  },
  "story-previz": {
    "path": "/path/to/story-previz",
    "worktreePolicy": {
      "enabled": true,
      "worktreeRoot": "../story-previz-worktrees",
      "branchPrefix": "codex/",
      "requireFreshPerExecution": true,
      "blockMainCommit": true,
      "blockMainPush": true
    }
  }
}
```

Config behavior:

| Condition | Behavior |
|---|---|
| Repo config entry has `worktreePolicy.enabled: true` | Apply worktree-first starter, guard, status, and cleanup behavior. |
| Repo config entry lacks `worktreePolicy` | Do not enforce worktree-first. |
| Repo config entry has `worktreePolicy.enabled: false` | Do not enforce worktree-first. |
| Repo root cannot be mapped to a repo key | Do not enforce; print a warning in status commands only. |
| Repo config entry has `worktreePolicy.deferToRepoWorkflow: true` | Register it as worktree-first, then use the repo-specific starter/rules when they exist. |
| Repo config entry has `worktreePolicy.allowMainFeatureBranch: true` | Permit primary-checkout feature branch commits for the lightweight branch lane. |

Initial allowlist:

| Repo key | Behavior |
|---|---|
| `knitten` | Use the scripts from this spec. |
| `shotloom` | Use existing Shotloom worktree workflow where available; do not replace `shotloom-start-task`. |
| `story-previz` | Use the scripts from this spec when StoryPreviz write work occurs. |

Lightweight projects keep no `worktreePolicy` field. The current `agent-hub`
repo key is a legacy identity for Knitten; implementation must either add
`knitten` as an alias in repo path config or map `agent-hub` to `knitten`
before enforcing this policy.

Current machine config migration:

| Existing repo key | Required action |
|---|---|
| `agent-hub` | Add `knitten` alias pointing to the same path, or implement deterministic alias mapping from `agent-hub` to `knitten`. |
| `shotloom` | Add `worktreePolicy.enabled: true` and `deferToRepoWorkflow: true`. |
| `story-previz` | Add `worktreePolicy.enabled: true`. |

The implementation must update the current machine config and the tracked
schema or template docs. Future machines must be able to opt in without reading
this spec.

Tracked schema:

```text
agent/config/repo-policy.schema.json
```

The schema documents the `worktreePolicy` object and validator checks it
against machine-local repo config when that file exists.

### Lightweight Branch Lane

Use the lightweight branch lane only when every condition matches:

| Condition | Required Value |
|---|---|
| Repo config | `worktreePolicy.allowMainFeatureBranch: true` |
| Checkout | Primary checkout is on a feature branch, not `main`. |
| Branch name | Uses the configured `branchPrefix`, normally `codex/`. |
| Change type | `.github/**`, PR templates, release notes, changelog entries, or narrow docs-only policy wording. |
| Change scope | Single ownership boundary and low conflict risk. |
| PR | Required after push unless the user explicitly says not to. |

Do not use the lightweight branch lane for these changes:

| Change Type | Required Workflow |
|---|---|
| Code implementation | Task worktree. |
| Validator or schema logic | Task worktree. |
| Routing behavior | Task worktree. |
| File migration or deletion | Task worktree. |
| Multi-repo or multi-boundary work | Task worktree. |
| Release tag movement | Explicit user approval and release workflow. |

## Proposed Design

### Worktree Starter

Add a tracked starter script:

```text
scripts/worktree-start.mjs
```

Starter behavior:

| Step | Rule |
|---|---|
| 1 | Resolve the repository root from the current git repository. |
| 2 | Resolve the repo key from `repo-paths.json` or known checkout metadata. |
| 3 | Read the repo config entry for the current repo. |
| 4 | If `worktreePolicy.enabled` is not true, stop with a message that the repo is not worktree-first. |
| 4a | If `worktreePolicy.deferToRepoWorkflow` is true and a repo-specific starter exists, stop and print the repo-specific command. |
| 5 | Fetch `origin main`. |
| 6 | Refuse to continue if the main checkout has uncommitted changes. |
| 7 | Generate `slug` from the user task or explicit argument. |
| 8 | Generate `stamp` as `YYYYMMDD-HHMMSS`. |
| 9 | Create branch `<branchPrefix><stamp>-<task-slug>` from `origin/main`. |
| 10 | Create worktree at `<worktreeRoot>/<stamp>-<task-slug>`. |
| 11 | Print the absolute worktree path and branch name. |

Every invocation creates a new path and a new branch. The script does not
search for an existing worktree to reuse.

Naming rules:

| Rule | Example |
|---|---|
| Use timestamp first | `20260518-102544-worktree-first` |
| Use 2-5 word kebab-case task slug | `worktree-first` |
| Do not repeat the repository name in the leaf path | Use `../knitten-worktrees/20260518-102544-worktree-first`, not `../knitten-worktrees/20260518-102544-knitten-worktree-first`. |
| Keep branch body and worktree directory body identical | `codex/20260518-102544-worktree-first` maps to `../knitten-worktrees/20260518-102544-worktree-first`. |
| Do not include status words | Omit `draft`, `active`, `final`, and similar status terms. |

### Main Checkout Guard

Add a tracked guard script:

```text
scripts/worktree-guard.mjs
```

Guard behavior:

| Condition | Result |
|---|---|
| Current repo has no enabled `worktreePolicy` | Pass. |
| Current top-level path is the enabled repo's main checkout on `main` | Fail with `<repo-key> policy: use a task worktree for commit and push.` |
| Current top-level path is the enabled repo's main checkout on a feature branch and `allowMainFeatureBranch: true` | Pass. |
| Current top-level path is an enabled repo linked worktree | Pass. |

### Hook Installer

Add a tracked installer:

```text
scripts/worktree-install-hooks.mjs
```

Installer behavior:

| Hook | Installed behavior |
|---|---|
| `core.hooksPath/pre-commit` | Runs `node scripts/worktree-guard.mjs`. |
| `core.hooksPath/pre-push` | Runs `node scripts/worktree-guard.mjs`. |

The installer configures `core.hooksPath` to a tracked hook directory so the
main checkout and linked worktrees use the same guard. It does not rely on
per-worktree `.git/worktrees/<name>/hooks` directories.

Installer scope:

| Config command | Rule |
|---|---|
| `git config --local core.hooksPath scripts/git-hooks` | Required. |
| `git config --global core.hooksPath ...` | Forbidden. |
| main checkout verification | `git config --local --get core.hooksPath` returns `scripts/git-hooks`. |
| linked worktree verification | The same hook path is visible from a generated worktree. |

Hook directory:

```text
scripts/git-hooks/
```

### Repo-Specific Deferral

| Repo key | Generic starter behavior |
|---|---|
| `shotloom` | Stop and print the Shotloom starter command because `deferToRepoWorkflow: true`. |
| `knitten` | Create worktree using this spec's generic starter. |
| `story-previz` | Create worktree using this spec's generic starter. |

For Shotloom, this spec owns policy detection only. It does not replace
`shotloom-start-task`.

### Worktree Status

Add a tracked status script:

```text
scripts/worktree-status.mjs
```

Status behavior:

| Output field | Rule |
|---|---|
| Path | Print each Knitten worktree path. |
| Branch | Print the current branch. |
| Dirty state | Print clean, dirty, or untracked count. |
| Ahead state | Print commits ahead of upstream. |
| Age | Derive from the `<stamp>-<task-slug>` worktree name when present. |
| Stale reason | Mark clean merged worktrees older than the configured threshold as stale candidates. |

The status script reads only enabled repos. It never deletes worktrees.

### Worktree Cleanup

Add cleanup only after starter and status behavior pass:

```text
scripts/worktree-clean.mjs
```

Cleanup behavior:

| Mode | Rule |
|---|---|
| default | Dry-run only. |
| `--merged` | Select clean worktrees whose branches are merged into `main`. |
| `--older-than <days>` | Select worktrees older than the threshold. |
| `--apply` | Delete only after printing the exact paths and receiving explicit user approval. |

Cleanup runs only for enabled repos. Cleanup never removes the main checkout.
Cleanup never removes dirty worktrees.

Cleanup candidate rules:

| Condition | Required value |
|---|---|
| Worktree path | Must not be the main checkout. |
| Dirty state | Must be clean. |
| Merge state | Branch HEAD must be merged into `main` or `origin/main`. |
| Remote branch | Matching `origin/<branch>` must be absent. |
| Approval | `--apply` requires an explicit confirmation flag after user approval. |

This matches the end-of-task flow: merge PR, delete the remote feature branch,
then remove the local worktree.

Local-only cleanup behavior:

| User phrase | Required behavior |
|---|---|
| `니튼 미사용 로컬 워크트리 정리` | Switch the Knitten checkout to `main`, inspect `git worktree list`, remove only clean local worktree directories, and preserve local plus remote branches. |

Command mapping:

```bash
node scripts/worktree-clean.mjs --local-only
node scripts/worktree-clean.mjs --local-only --apply --yes
```

### Resume Rules

| User request | Required behavior |
|---|---|
| New write-capable request in an enabled repo | Create a new worktree. |
| New write-capable request in a repo without enabled `worktreePolicy` | Use normal git workflow. |
| "Continue this task" with current cwd inside an enabled repo task worktree | Continue in the current worktree. |
| User names a worktree path or branch | Use that worktree after `git status --short --branch`. |
| Ambiguous resume request from main checkout | Create a new worktree unless the user names the previous worktree. |

### Branch, PR, And Spec Linkage

| Surface | Naming rule |
|---|---|
| Worktree directory | `<stamp>-<task-slug>` |
| Branch | `codex/<stamp>-<task-slug>` |
| Commit subject | Meaning-first conventional commit; no timestamp required. |
| PR title | Meaning-first title; no timestamp required. |
| Active spec frontmatter | May include `worktree:` and `branch:` while implementation is active. |
| Completed spec | Move worktree/branch details into implementation notes or remove them. |

### Agent Rule

Update `agent/rules/git-defaults.md` with a Knitten-specific rule:

| Request | Required action |
|---|---|
| Read-only Knitten inspection | Main checkout allowed. |
| Write-capable work in repo with `worktreePolicy.enabled: true` | Run `node scripts/worktree-start.mjs <slug>` first. |
| Small docs-only or CI/CD-only work with `allowMainFeatureBranch: true` | Use a feature branch in the primary checkout; do not commit directly to `main`. |
| Write-capable work in repo without enabled `worktreePolicy` | Use normal git workflow. |
| Same task resumed inside a task worktree | Continue in that worktree. |
| New write-capable user request in enabled repo | Create a new worktree, even if another worktree exists. |
| User explicitly names an existing worktree | Use the named worktree after `git status --short --branch`. |

### Validation Contract

Add a fixture or test script that proves:

| Test | Expected result |
|---|---|
| Run starter twice with the same slug in test mode | Two distinct temporary worktree directories and two distinct temporary branches exist. |
| Run starter in an unlisted lightweight repo | Stops without creating a worktree. |
| Run guard from main checkout | Non-zero exit. |
| Run guard from main checkout feature branch with `allowMainFeatureBranch: true` | Zero exit. |
| Run guard from generated worktree | Zero exit. |
| Run guard from an unlisted lightweight repo | Zero exit. |
| Run installer twice | Hooks remain valid and no duplicate shell body accumulates. |
| Run blocked commit from main checkout | `git commit` fails through `pre-commit`. |
| Run blocked push from main checkout | `git push --dry-run` fails through `pre-push`. |
| Run status with generated worktrees | Lists path, branch, dirty state, ahead state, and stale candidate status. |
| Run cleanup without `--apply` | Prints candidates and deletes nothing. |
| Run test cleanup | Test-created temporary worktrees and branches are removed. |

## Execution Plan

| Phase | Work | Acceptance |
|---|---|---|
| K0 Spec | Create this spec and intake | Spec is in `docs/plans/proposed/`; intake is in `docs/briefings/specs/`. |
| K1 Scripts | Add starter, guard, and installer scripts | Scripts parse arguments, avoid hardcoded user paths, and print actionable output. |
| K2 Config Schema | Add tracked schema for repo config `worktreePolicy` | Initial enabled repo config entries are `knitten`, `shotloom`, and `story-previz`. |
| K3 Status | Add status script | Active, dirty, ahead, age, and stale candidate fields are visible for enabled repos. |
| K4 Rule | Update `agent/rules/git-defaults.md` | Auto rule states enabled repos start write work in a fresh worktree and allows the lightweight branch lane for scoped docs or CI/CD changes. |
| K5 Tests | Add script-level tests or deterministic shell checks | Starter, guard, installer, repo config, and status behavior is proven locally. |
| K6 Machine Config | Update current machine repo config and tracked schema/template docs | `knitten`, `shotloom`, and `story-previz` are discoverable from repo config. |
| K7 Docs | Add README pointer for the worktree-first policy | A cold-start agent can find the workflow from README or rules. |
| K8 Install | Run the hook installer in the main checkout | Main checkout commit and push guards are active locally. |
| K9 Cleanup | Add dry-run-first cleanup script | Clean merged local worktrees with deleted remote branches can be listed; deletion requires explicit approval. |

## Validation

Run after implementation:

```bash
node scripts/worktree-start.mjs test-worktree-policy --test-mode
node scripts/worktree-start.mjs test-worktree-policy --test-mode
node scripts/worktree-start.mjs test-disabled-repo --repo <unlisted-fixture>
node scripts/worktree-status.mjs
node scripts/worktree-guard.mjs
node scripts/worktree-install-hooks.mjs
git commit --allow-empty -m "test: blocked main checkout commit"
git push --dry-run origin HEAD
node scripts/worktree-clean.mjs --dry-run
node scripts/worktree-clean.mjs --cleanup-test-artifacts
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

Expected special case: `node scripts/worktree-guard.mjs` fails when run
from the main checkout on `main`. The validation must also run the same guard
from a generated worktree and from an allowed primary-checkout feature branch.

Validation must restore the repository to its pre-test branch and worktree
state.

## Risks

| Risk | Control |
|---|---|
| Hooks do not block raw file edits in main checkout | Rule requires starter before edits; commit and push guards block persistence. |
| Worktree count grows quickly | Cleanup remains explicit; add stale-worktree reporting only after the first implementation. |
| Existing stale worktree confuses agents | Starter ignores existing worktrees and creates a fresh path every time. |
| Branch names collide | Timestamp prefix plus slug prevents same-slug collisions. |
| Hook installer overwrites user hook content | Installer preserves existing hook content or stops with a clear conflict message. |
| Status output becomes another stale source | Status reads git state live and stores no cache. |
| Cleanup deletes useful work | Cleanup defaults to dry-run and refuses dirty or unmerged worktrees. |
| Lightweight repos inherit heavy workflow | Worktree-first applies only to repos whose repo config has `worktreePolicy.enabled: true`. |
| Lightweight branch lane hides risky work | Rule limits the lane to small docs-only or CI/CD-only changes; code, validators, schemas, routing, migrations, and multi-boundary work still use task worktrees. |
| Validation leaves temporary branches or worktrees | Test mode uses a test prefix and cleanup verifies removal before final status. |
| Hook tests create commits | Blocked commit uses `--allow-empty` and must fail before an object is created. |

## Acceptance Criteria

- [ ] `scripts/worktree-start.mjs` creates a fresh worktree on every invocation.
- [ ] `repo-paths.json` can resolve Knitten through `knitten` or a deterministic `agent-hub` alias.
- [ ] Repo config entries for `knitten`, `shotloom`, and `story-previz` have `worktreePolicy.enabled: true`.
- [ ] `shotloom` enforcement defers to existing Shotloom worktree workflow when that workflow is available.
- [ ] Repositories without enabled `worktreePolicy` do not use worktree-first enforcement.
- [ ] Repeated starter invocations with the same slug produce distinct paths and branches.
- [ ] Test-mode starter invocations leave no worktrees or branches after cleanup.
- [ ] Generated branches use the `codex/` prefix.
- [ ] `scripts/worktree-guard.mjs` fails in the main Knitten checkout.
- [ ] `scripts/worktree-guard.mjs` passes in a primary-checkout feature branch when `allowMainFeatureBranch` is true.
- [ ] `scripts/worktree-guard.mjs` passes in a generated Knitten worktree.
- [ ] `scripts/worktree-install-hooks.mjs` configures repo-local `core.hooksPath` and installs `pre-commit` and `pre-push` guards.
- [ ] `core.hooksPath` is visible from the main checkout and a linked worktree.
- [ ] Main checkout `git commit` fails through `pre-commit`.
- [ ] Main checkout `git push --dry-run` fails through `pre-push`.
- [ ] `scripts/worktree-status.mjs` lists active worktrees with path, branch, dirty state, ahead state, and age.
- [ ] `scripts/worktree-clean.mjs --dry-run` lists cleanup candidates and deletes nothing.
- [ ] `scripts/worktree-clean.mjs --apply` requires explicit user approval before deletion.
- [ ] Cleanup candidates require clean status, merged state, and absent remote feature branch.
- [ ] Main checkout commit and push attempts fail after hook installation.
- [ ] Worktree commit and push attempts are not blocked by the Knitten guard.
- [ ] Lightweight docs-only or CI/CD-only work can use a primary-checkout feature branch without allowing direct `main` commits.
- [ ] `agent/rules/git-defaults.md` instructs agents to create a fresh Knitten worktree before write-capable work.
- [ ] `git diff --check` passes.
- [ ] `node scripts/validate-llm-first.mjs` passes.

## Open Decisions

| Decision | Default |
|---|---|
| Worktree root | `../knitten-worktrees/` |
| Branch prefix | `codex/` |
| Worktree name pattern | `<stamp>-<task-slug>` |
| Branch name pattern | `codex/<stamp>-<task-slug>` |
| Status script | Include in first implementation. |
| Cleanup behavior | Dry-run by default; apply only with explicit approval. |
| Existing worktree reuse | Disallowed unless the user names the worktree explicitly. |
| Repo scope | Opt-in only through repo config `worktreePolicy.enabled: true`. |
