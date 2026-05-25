---
status: proposed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
intake: docs/briefings/specs/installed-pack-lifecycle.md
---

# Installed Pack Lifecycle

Terminology note: `pack install` is the umbrella operation that registers a
pack for core use. `link mount` is only one mount strategy. `Deploy target`
means a harness runtime path, not an install home or server release location.

## Purpose

Define how Knitten core creates, reads, updates, disables, enables, recovers,
and deletes installed artifact pack records without copying pack contents into
core by default or hardcoding user-specific paths into shared artifacts.

## Problem

Artifact pack manifests and validation gates now define what a valid pack can
declare. Knitten still lacks the local install contract that turns a valid pack
root into resolver-visible state and harness-visible artifacts.

Without this spec, implementers can accidentally:

- copy pack contents into `agent/` and blur core ownership;
- write machine paths into tracked config;
- create symlinks from a deploy target back into itself;
- overwrite harness-owned runtime files during uninstall;
- let disabled, stale, or invalid pack exports remain visible to a resolver.

## Goals

| Goal | Acceptance |
|------|------------|
| Define install state. | A machine-local registry records installed pack roots, activation state, source kind, and manifest digest without committing machine paths. |
| Define installed-pack CRUD. | Create, read, update, disable, enable, recover, and delete/uninstall behavior is explicit and reversible. |
| Define safe link behavior. | Link operations prove source and target are distinct, contained, and reversible before writing. |
| Define update behavior. | Update revalidates manifests, refreshes registry metadata, and only changes links owned by the installer. |
| Define uninstall behavior. | Uninstall disables resolver visibility, tombstones registry rows, and removes only installer-owned links. |
| Preserve LLM-first routing. | Resolver-visible metadata is compact and does not load pack artifact bodies before route evidence matches. |
| Stay harness-neutral. | Shared design uses `harness`, `adapter`, `deploy target`, `shared layer`, and `machine-local registry` terms. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not change artifact manifest fields except by explicit follow-up to the manifest contract. | `artifact-pack-manifest-contract` |
| Do not implement discovery, ranking, or route selection. | `artifact-pack-discovery-routing` |
| Do not migrate current Knitten artifacts into packs. | `artifact-repo-migration-plan` |
| Do not define public release or secret scanning gates. | `public-safety-scrub-gates` |
| Do not remove compatibility shims or old paths. | `artifact-compatibility-shims` |
| Do not rewrite current harness linking in this spec. | `installed-pack-lifecycle-test-contract` covers test-only harness overrides; production rewrite belongs to a future implementation spec. |

## Worktree Overview

| Field | Value |
|-------|-------|
| Worktree | Dedicated task worktree for this branch. |
| Branch | `codex/20260525-093255-installed-pack-lifecycle` |
| Base | `main` at `6538434` |
| Output | Intake, proposed spec, milestone link update, lifecycle rename, installer slice, fixtures, and practical tests. |
| Implementation state | First installer slice exists; durable journal recovery, active manifest-set prevalidation, and full update reconciliation remain follow-up work. |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Vocabulary | `pack install` means registering a pack for core resolution; it includes link, clone, pin, enable, disable, update, and uninstall flows. | `docs/plans/completed/artifact-pack-vocabulary.md` |
| Manifest contract | Exports declare `mount.layer`, `mount.target`, and `mount.mode` as `link`, `copy`, or `virtual`. | `docs/plans/completed/artifact-pack-manifest-contract.md` |
| Validation gates | Explicit pack roots and manifest sets can be validated before install registry lookup exists. | `docs/plans/completed/artifact-pack-validation-gates.md` |
| Harness config | `agent/config/agent-hub.json` lists harness deploy targets, shared layers, registries, and link methods. | `agent/config/agent-hub.json` |
| Deploy target policy | `~/.claude/` is a Claude Code harness runtime path, not canonical source or server deployment. | `SYSTEM.md` |
| Current link script | `scripts/link-harnesses.mjs` creates symlinks and syncs directories for current shared layers. | `scripts/link-harnesses.mjs` |
| Local hazard | A deploy target may resolve to the canonical `agent/` tree on a developer machine. | Current machine state and `SYSTEM.md` allowed shapes. |

## Brainstorming

### User And Agent Patterns

| Pattern | Desired Behavior |
|---------|------------------|
| User points at a local pack folder. | Installer validates `<pack-root>/artifact-pack.json`, records the resolved path in machine-local state, and enables exports. |
| User points at a cloned pack repo. | Installer treats the repo root as a local pack root unless clone/pin support is explicitly requested. |
| User wants an LLM to use a domain pack. | Resolver sees compact manifest route metadata before any skill or reference body is loaded. |
| User disables a pack for a session or repo. | Resolver ignores that pack; existing installer-owned links are either removed or marked inactive by the selected mount strategy. |
| User updates a pack. | Installer revalidates first, then refreshes links or registry metadata atomically enough to avoid half-visible exports. |
| User uninstalls a pack. | Installer removes only links it owns and leaves the source pack folder untouched. |
| User asks what is installed. | Installer reads machine-local registry state and reports active, disabled, failed, and stale rows without touching pack bodies. |

### Design Options

| Option | Description | Decision |
|--------|-------------|----------|
| Copy exports into `agent/` | Materialize pack artifacts directly in core shared layers. | Reject as default; it destroys ownership boundaries and makes uninstall unsafe. |
| Link exports into harness deploy targets | Create symlinks where a harness needs file-system visible artifacts. | Accept only for `mount.mode: link` and only with ownership markers and path safety checks. |
| Registry-only virtual mounts | Make resolver expose artifacts from pack paths without writing into deploy targets. | Accept as preferred behavior for resolver-native harnesses. |
| One global installed-pack registry | Store all installed packs in one machine-local registry. | Accept for first implementation; repo or harness scoping can be row fields. |
| Per-harness registries | Store separate install state for each harness. | Defer; it can duplicate state and obscure cross-harness consistency. |
| Installer-owned manifest set | Generate a manifest-set view from active registry rows for validators and resolver tests. | Accept; it reuses existing validation gate behavior. |

### Naming Choices

| Term | Use |
|------|-----|
| `machine-local pack registry` | Private install state containing local paths and activation state. |
| `installed pack` | A valid artifact pack recorded in the machine-local pack registry. |
| `pack source` | The local folder or git checkout that contains `artifact-pack.json`. |
| `pack link` | Installer-owned symlink from a pack export to a harness-visible target. |
| `virtual mount` | Resolver-visible export that does not write a file-system link. |
| `installed-pack lifecycle` | Lifecycle operations over registry rows and owned mounts: create, read, update, state change, delete/uninstall, and recover. |

Avoid server-release wording for pack install. `Deploy target` remains reserved
for harness runtime paths.

## Proposed Design

### Installed-Pack CRUD

CRUD applies to installed-pack registry rows and installer-owned mounts, not to
the source pack repository. The installer must never delete or edit the pack
source folder as part of CRUD.

| Lifecycle Operation | User Verb | Registry Effect | Filesystem Effect |
|---------------------|-----------|-----------------|-------------------|
| Create | `install` | Add a validated row as `active` after transaction commit. | Create only required installer-owned link mounts. |
| Read | `list`, `status`, `inspect` | Read registry rows, candidate index summaries, link records, journals, and validation state. | No persistent writes; no artifact body loading. |
| Update | `update` | Atomically replace row metadata after validation and journaling. | Reconcile only installer-owned links. |
| State change | `enable`, `disable` | Atomically change resolver visibility state after validation and journaling. | Activate or remove only installer-owned links. |
| Delete | `uninstall` | Tombstone resolver visibility and registry row after journaling. | Remove only installer-owned links; never delete pack source. |
| Repair | `recover` | Finish or roll back journal-matching partial transactions. | Touch only journal-matching installer-owned links. |

Read operations are intentionally first-class. They are the safe way for agents
to answer "what packs are installed?", "why is this pack not visible?", and
"what would change?" without creating links or loading pack bodies.

Read outputs:

| Output | Includes | Excludes |
|--------|----------|----------|
| Installed pack list | `pack-id`, state, source kind, scope, manifest digest, updated time. | Absolute source path unless `--json --verbose` is requested. |
| Pack status | State, last transaction id, validation status, active candidate count, link status count, stale journal status. | Artifact body text. |
| Inspect report | Planned actions for a supplied pack or existing row. | Writes, symlinks, registry mutation. |

Read output caps:

| Verb | Default Candidate Output | Path Disclosure |
|------|--------------------------|-----------------|
| `list` | Candidate rows omitted; include counts only. | No absolute local paths. |
| `status` | Candidate rows omitted; include counts and top-level diagnostics only. | No absolute local paths. |
| `inspect --pack-id` | Candidate rows summarized unless `--json --verbose` is set. | Redact absolute paths unless `--verbose`. |
| `inspect --artifact-pack` | Planned candidate rows summarized unless `--json --verbose` is set. | Redact absolute paths unless `--verbose`. |

### Machine-Local Pack Registry

Create a registry for installed pack state that is never committed.

When no explicit `--registry` or `AGENT_HUB_PACK_REGISTRY` override is supplied,
first implementation must resolve the private config directory through a
machine-local config lookup, then realpath-check the resolved registry path
before any write.

The first implementation must not silently invent a production registry path.
Without `--registry`, `AGENT_HUB_PACK_REGISTRY`, or a validated machine config
key, write verbs must fail with a configuration error before planning link or
registry writes. Adapter-provided private config defaults are deferred until a
separate implementation explicitly defines and validates the adapter lookup.

Registry lookup order:

| Order | Source | Rule |
|-------|--------|------|
| 1 | `AGENT_HUB_PACK_REGISTRY` environment override | Test-only or explicit-user override; must point to a file path whose parent passes realpath safety checks. |
| 2 | Harness-neutral machine config path | Use `packRegistryPath` from machine-local `agent-hub-config.json` only when the private config root is outside tracked source and outside harness deploy target aliases. |
| 3 | Adapter-provided private config path | Deferred for first implementation; future adapters may use it only when realpath checks prove it is not inside tracked source, canonical `agent/`, or a shared deploy alias. |
| 4 | Current Claude adapter example | Documentation example only, never the canonical resolver location or implicit default. |

Machine config lookup reads a private, untracked JSON object with this minimum
shape:

```json
{
  "packRegistryPath": "/absolute/private/path/artifact-packs.json"
}
```

The config file location is outside this spec unless supplied by the current
harness adapter. If no adapter supplies that location, agents must pass
`--registry` or `AGENT_HUB_PACK_REGISTRY` explicitly.

Clean registry behavior:

| Situation | Behavior |
|-----------|----------|
| `--registry <path>` parent is missing | Fail with exit `1`; do not create parent directories implicitly. |
| `--registry <path>` file is missing and verb is `list` | Treat as an empty registry and exit `0`. |
| `--registry <path>` file is missing and verb is `status --pack-id` | Exit `1` with `gate: registry-missing-row`; do not create the file. |
| `--registry <path>` file is missing and verb is `inspect --artifact-pack` | Treat previous state as null and exit `0` when validation passes; do not create the file. |
| `--registry <path>` file is missing and verb is `install` | Create the registry file through the normal locked write-temp-and-rename path only after validation and mount gates pass. |
| `--registry <path>` file is missing and verb is `update`, `disable`, `enable`, `uninstall`, or `recover` | Exit `1` with `gate: registry-missing-row` for pack-specific verbs, or `gate: registry-missing` for `recover`; do not create the file. |
| `--registry <path>` file exists but is empty or invalid JSON | Exit `1` with `gate: registry-invalid`; `recover` must also refuse unless a separate valid journal path and registry backup are explicitly supplied by a future recovery spec. |

An empty registry JSON report must include `rows: []`, `row-count: 0`,
`registry-path: "<registry>"`, `actions: []`, and no absolute local paths unless
`--verbose` is set.

Missing row JSON must place the failure in an action row; the concrete example
lives in `docs/plans/proposed/installed-pack-lifecycle-test-contract.md`.

Current adapter example:

```text
~/.claude/private/agent-hub-config/artifact-packs.json
```

This path is acceptable only when realpath checks prove it is machine-local on
the current host. If it resolves inside the checkout, canonical `agent/`, or a
harness deploy target symlink to shared source, install must stop before
creating the registry.

Registry path rejection examples:

| Resolved Registry Path | Result |
|------------------------|--------|
| `<checkout>/agent/private/agent-hub-config/artifact-packs.json` | reject |
| `<checkout>/agent/config/artifact-packs.json` | reject |
| any path under a harness deploy target that realpaths to `<checkout>/agent` | reject |
| any path under the resolved source pack root | reject |
| any tracked file path | reject |

Registry shape:

| Field | Rule |
|-------|------|
| `schema-version` | Integer `1`. |
| `installed-packs` | Array of installed pack rows. |
| `installed-packs[].pack-id` | Matches the manifest `pack-id`; unique in active rows. |
| `installed-packs[].source-kind` | `local-folder` or `git-worktree`; future values may add `git-url`. |
| `installed-packs[].source-path` | Absolute local path allowed only in this private registry. |
| `installed-packs[].manifest-path` | Absolute path to the installed manifest, derived from `source-path`. |
| `installed-packs[].manifest-digest` | Digest of normalized manifest content from the last successful validation. |
| `installed-packs[].state` | `pending`, `active`, `disabled`, `failed`, or `tombstoned`. Only `active` rows are resolver-visible. |
| `installed-packs[].scope` | Optional inclusion-only scope object defined below. |
| `installed-packs[].links` | Array of installer-owned link records for `mount.mode: link` exports. |
| `installed-packs[].candidate-index` | Compact resolver candidate rows generated from the manifest without artifact bodies. |
| `installed-packs[].transaction-id` | Last transaction that changed the row. |
| `installed-packs[].installed-at` | ISO timestamp. |
| `installed-packs[].updated-at` | ISO timestamp. |

Scope fields are inclusion-only. Absence means no limit on that axis. Pre-route
filtering may use only `harness-ids`, `repo-keys`, and `work-modes`.
`context-profiles` is candidate metadata applied after a context profile exists;
it must not hide candidates before profile selection.

| Scope Field | Values | Match Rule |
|-------------|--------|------------|
| `harness-ids` | Harness ids from `agent/config/agent-hub.json`. | Current harness id must be present. |
| `repo-keys` | Repo keys from machine config or public registry. | Current repo key must be present. |
| `work-modes` | `personal`, `company`, or `experiment`. | Current work mode must be present. |
| `context-profiles` | Existing context profile ids. | Applied after profile selection; not a pre-route registry filter. |

Link record fields:

| Field | Rule |
|-------|------|
| `pack-id` | Manifest pack id at creation time. |
| `artifact-id` | Export id that owns the link. |
| `harness-id` | Harness whose target mapping produced the link. |
| `layer` | Manifest `mount.layer`. |
| `target` | Manifest `mount.target`. |
| `source-realpath` | Resolved source export path at creation time. |
| `target-path` | Literal symlink path created by the installer. |
| `target-realpath-parent` | Resolved parent directory of the target at creation time. |
| `link-target` | Symlink payload written by the installer. |
| `ownership-token` | Stable token stored in the registry row and dry-run report. |
| `created-by` | Installer id and version. |
| `created-lstat` | Creation-time symlink `lstat` identity, including device, inode, mode, and size, when the platform exposes it. |
| `last-status` | `planned`, `active`, `removed`, or `failed`. |

Link health is evaluated per harness. A registry row may remain globally
`active`, but a link-mode candidate is resolver-visible for a harness only when
that harness's required link records are present, owned, and match the recorded
payload and lstat identity rules. `status --pack-id` must report per-harness
link health separately from the row `state`; a stale, missing, or non-owned
link makes that harness's link-mode candidates hidden until repair succeeds.
Virtual candidates remain visible when their registry row is active and their
scope matches, because they do not depend on harness file-system links.

Before update or uninstall deletes a link, compare-before-delete must prove the
current path is a symlink and its payload, source realpath, target path,
artifact id, pack id, ownership token, and available `created-lstat` identity
match the registry record.

When the platform exposes symlink lstat identity, `created-lstat` match is
mandatory before automatic cleanup. When it is unavailable, cleanup must use a
manual/high-friction path and may not run as part of default uninstall.

First implementation uses registry link records plus a machine-local ownership
map stored next to the registry. The ownership map is keyed by target path and
contains the ownership token, transaction id, link payload, and lstat identity.
It is private machine state, not deploy target state.

Active link target paths must be unique across all active registry rows. An
installer-owned link from another pack row is not replaceable unless the command
uses `--replace` and names or resolves the old row being replaced.

### Compact Candidate Index

Install generates compact candidate rows from active manifests for resolver and
LLM-first routing tests. Candidate rows must not include artifact body text.

| Field | Rule |
|-------|------|
| `pack-id` | Installed pack id. |
| `artifact-id` | Export id. |
| `artifact-type` | Export artifact type. |
| `source-ref` | Opaque `pack-id/artifact-id` lookup key, not a path and not body content. |
| `manifest-digest` | Digest used for stale-state detection. |
| `load` | Manifest `load` value. |
| `route` | Allowlisted route fields only: `context-profile`, `domains`, `repo-keys`, `task-types`, `languages`, `frameworks`, `work-modes`, `exclude-when`, `min-evidence`, `max-context-bytes`, and `priority`. |
| `mount-mode` | `virtual`, `link`, or `copy`. |
| `scope` | Applied registry scope fields. |

The resolver may inspect candidate rows before route selection. It must not
open `source-path`, export files, skill bodies, rules, standards, commands, or
references until route evidence selects a candidate.

After route selection, `source-ref` is resolved through the active registry row
and manifest export table. It is never interpreted as a filesystem path by the
pre-route candidate reader.

### Active Manifest-Set View

The active manifest-set view is a temporary validation directory generated
from active registry rows.

| Property | Rule |
|----------|------|
| Location | Fresh temp directory outside the checkout, deploy targets, registry/private config root, and pack source roots. |
| Layout | One real directory per active `pack-id`, containing a copied `artifact-pack.json` file and symlinks for every declared export path needed by validator path checks. |
| Contents | Copied manifest file plus symlinks to declared export paths only; no copied export bodies and no rewritten manifests. |
| Lifecycle | Created for validation or dry-run, removed after the command unless `--keep-temp` is explicitly supplied. |
| Validator input | Passed to `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack <temp-dir>`. |

This layout preserves export path and entrypoint checks for the existing
validator without relying on recursive traversal of symlinked directories or
symlinked manifest files. The validator sees real pack-id directories with a
real manifest file and symlinked declared paths; the candidate index still
remains body-free.
If a future validator accepts a registry JSON input directly, the symlinked
manifest-set can be replaced.

### Install Flow

| Step | Behavior |
|------|----------|
| Resolve input | Accept a pack root or manifest file path; resolve symlinks to real paths before validation. |
| Validate manifest | Run `artifact-pack` validation against the explicit pack root before registry write. |
| Check duplicate id | Reject duplicate active `pack-id` unless the user requested update or replacement. |
| Plan registry row | Build a `pending` registry row, link records, and candidate index in memory. |
| Revalidate installed set | Generate the active manifest-set view including the pending manifest and run pack validation over it. |
| Materialize mounts | For each export, apply `mount.mode` rules only after installed-set validation passes. |
| Commit registry row | Atomically write the registry row as `active` only after required mount actions succeed. |

Install activation is all-or-nothing for the pack and selected harness scope.
If any required link mount fails, the new row remains absent or `failed`,
resolver visibility is not active, and previous active state remains unchanged.

When `--harness <id>` is supplied, the planned row must include
`scope.harness-ids: [<id>]` unless the user explicitly requests global
activation. A globally active row requires all required link mounts for all
selected harness mappings to succeed.

For update or replace of the same `pack-id`, active manifest-set generation
must replace the previous active row with the planned row. It must not include
both manifests or keep the old source root in the generated set.

### Mount Modes

| Mode | Behavior |
|------|----------|
| `virtual` | Registry exposes the export to the resolver; no file-system target is created. |
| `link` | Installer creates a symlink from the harness-visible target to the pack export path after safety checks pass. |
| `copy` | Reserved for explicit compatibility cases; first implementation should reject or require a documented override. |

Link targets must be derived from the harness registry and manifest
`mount.layer` plus `mount.target`. They must not be assembled from hardcoded
user paths.

Target derivation algorithm:

1. Select harness rows by requested harness id or current harness context.
2. Match `mount.layer` to `agent/config/agent-hub.json` `sharedLayers[].id`.
3. Resolve that layer's canonical source path from `sharedLayers[].path`.
4. For the selected harness, find the mapping whose relative source path equals
   the canonical layer path.
5. Compute target root as `<resolved harness.deployTarget>/<mapping key>`.
6. Append manifest `mount.target` under that target root.
7. Realpath the target parent and apply link safety gates before writing.

If no harness mapping exists for the layer, link mounts are unsupported for
that harness and must fail before registry activation. Virtual mounts do not
need a harness mapping.

Tests must not use live harness deploy targets for link-mode success cases.
First implementation must support `--harness-config <path>` as a test-only
override containing the same harness registry shape as `agent/config/agent-hub.json`.
The override file must live outside tracked source, and every deploy target in
it must be a temp directory that passes the same realpath safety checks.
`--harness-config` is valid only when the registry path is a temp registry:
created under the current command's `mktemp` directory or test harness temp
root, outside tracked source, outside pack source roots, outside deploy targets,
and not equal to any machine config `packRegistryPath`. It must fail before
planning if pointed at the live machine-local registry. When `--harness-config`
is supplied, target derivation reads only that file for the requested harness
and must not touch `~/.claude`, `~/.codex`, or other live harness paths.

Some manifest-valid layers, including `scripts`, `docs`, `fixtures`,
`generated-views`, and `shims`, may be link-unsupported until
`agent/config/agent-hub.json` defines shared layer mappings for them. Tests must
distinguish a valid manifest with an unsupported link layer from an invalid
manifest.

### Link Safety Gates

Before creating or changing any link, installer must verify:

| Gate | Failure |
|------|---------|
| Source exists | Reject missing export path or entrypoint. |
| Source containment | Reject source paths outside the resolved pack root. |
| Target containment | Reject target paths outside the selected harness deploy target mapping root. |
| Source-target distinction | Reject when the resolved target path is the same inode as the source or is inside the source tree. |
| Core self-link guard | Reject when any write target root, including deploy target or shared layer target, resolves inside the canonical `agent/` tree or tracked checkout. |
| Existing path ownership | Reject real files, directories, or unknown symlinks unless an installer ownership record proves they were created by this installer. |
| Relative manifest target | Reject absolute `mount.target` values; manifest validation should catch this earlier. |

### Ownership Records

The installer must be able to prove what it owns before update or uninstall.
First implementation uses registry-owned link records plus the machine-local
ownership map described above. A sidecar in the deploy target is not allowed.

Do not store ownership metadata inside a pack source folder by default. Pack
sources may be external repos and should not receive local install state unless
the user explicitly asks.

### Update Flow

| Step | Behavior |
|------|----------|
| Refresh source | For local folders, reread the manifest. For git worktrees, do not pull automatically in first implementation. |
| Revalidate | Run explicit pack validation and active manifest-set validation before exposing changes or changing links. |
| Compare digest | If digest is unchanged, leave links untouched and update `updated-at` only if requested. |
| Reconcile mounts | Add new installer-owned links, update changed ones, and remove obsolete installer-owned links. |
| Preserve non-owned paths | Stop on any conflicting non-owned path and leave previous state visible. |

Updates use a transaction model:

| Phase | Behavior |
|-------|----------|
| Plan | Build the next registry row, candidate index, and link diff without persistent writes. |
| Snapshot | Keep the previous active row and link records in memory and in the dry-run report. |
| Validate | Validate explicit pack input and active manifest-set with the planned row. |
| Apply | Create or replace only installer-owned links. |
| Verify | Compare written links against planned link records. |
| Commit | Atomically replace the registry file through write-temp-and-rename. |
| Recover | If interrupted before commit, previous active row remains authoritative; repair removes only links matching failed planned records. |

Before `Apply`, write a durable transaction journal in the same machine-local
private config root as the registry. The journal is removed only after commit or
successful recovery.

Write verbs must acquire a registry-wide write lock before planning against the
registry file, creating journals, applying links, or renaming the registry temp
file into place. The lock acquisition must be atomic, such as exclusive
lockfile creation or atomic lock-directory `mkdir`.

`recover` must acquire the same registry-wide lock before reading or mutating
journals, ownership maps, links, or registry rows. If a live lock exists,
`recover` must fail with exit `3` and `gate: registry-locked` unless a future
stale-lock takeover contract defines a safe age threshold and owner check.

Only one active journal is allowed per registry and `pack-id`. New write verbs
must also refuse to start when an unfinished journal exists for the same pack
unless the verb is `recover`. Immediately before registry rename, the
implementation must recheck `registry-digest-before`; if the digest changed,
it must abort, release the lock, and require replan instead of overwriting
another pack transaction. Journal filenames must include the `pack-id`,
`transaction-id`, and verb so stale recovery can identify ownership without
opening pack bodies. Completed or recovered journals may be retained in a
bounded audit directory; retention must never affect resolver visibility and
must be safe to prune by age.

Journal fields:

| Field | Rule |
|-------|------|
| `transaction-id` | Stable id included in reports, planned rows, and link records. |
| `verb` | Installer verb. |
| `registry-digest-before` | Digest of registry content before the transaction. |
| `registry-digest-planned` | Digest of the registry content that would exist after a successful commit. |
| `previous-row` | Previous row or null. |
| `planned-row` | Planned row, link records, and candidate index. |
| `planned-actions` | Ordered action rows. |
| `status` | `planned`, `applying`, `committed`, or `recovering`. |

Recovery may remove only links and rows whose transaction id and ownership
metadata match the journal.

Journal and ownership files live in deterministic paths next to the registry:

| File | Rule |
|------|------|
| `journals/<pack-id>.<transaction-id>.<verb>.json` | Durable transaction journal. The basename fields must match the JSON fields. |
| `ownership-map.json` | Machine-local target ownership map keyed by target path. |
| `registry.lock` | Registry-wide lock file or lock directory. |

The stale-journal fixture layout and path-rewrite rules are owned by
`docs/plans/proposed/installed-pack-lifecycle-test-contract.md`.

Recovery decision table:

| Journal Status | Registry Digest | Link State | Recovery Behavior |
|----------------|-----------------|------------|-------------------|
| `planned` | Registry still matches `registry-digest-before`. | No planned links exist. | Mark journal recovered and remove it; no registry change. |
| `planned` | Registry changed. | No planned links exist. | Refuse automatic recovery with exit `3`; report `gate: registry-digest-changed`. |
| `applying` | Current registry digest equals `registry-digest-before`, and the current row is byte-equivalent to `previous-row` after deterministic normalization. | Some planned links match journal ownership. | Remove only matching planned links, mark journal recovered, leave previous row visible. |
| `applying` | Current registry digest equals `registry-digest-planned`, and the current row is byte-equivalent to `planned-row` after deterministic normalization. | Written links match planned records. | Verify links, mark journal committed/recovered, keep planned row visible. |
| `applying` | Registry digest changed outside this transaction. | Any link state. | Refuse automatic recovery with exit `3`; require manual audit. |
| `committed` | Planned row is present. | Cleanup may be incomplete for disable/uninstall. | Finish journal-matching cleanup, then remove journal. |
| `recovering` | Any. | Recovery was interrupted. | Resume the same recovery action set; do not replan from current pack source. |

Recovery reports must include `recovery.decision`, `recovery.gate`, and
`recovery.actions`. Default JSON must redact paths in recovery actions and
diagnostics unless `--verbose` is set.

### Disable And Uninstall Flow

| Operation | Behavior |
|-----------|----------|
| Disable | Write a transaction journal, atomically set `state: disabled`, then remove or deactivate installer-owned links. If cleanup fails after commit, recovery may finish only journal-matching cleanup. |
| Enable | Revalidate the pack and active manifest-set before restoring visibility. |
| Uninstall | Write a transaction journal, atomically tombstone the row and remove resolver visibility, then remove installer-owned links. Leave the source pack untouched. |
| Force uninstall | Allowed only with a dry-run report naming every non-owned conflict; it still must not delete non-owned real files, directories, or symlinks. |

`--force` applies only to `uninstall`. It permits tombstoning the registry row
when non-owned link cleanup conflicts remain, but it never permits deletion of
non-owned files, directories, or symlinks. `uninstall --force` recomputes the
dry-run plan in the same process before writing; a separate prior report is
advisory only and is never trusted as authority. The recomputed plan must name
every unresolved conflict by `conflict-id`, `pack-id`, `artifact-id`,
`harness-id`, `layer`, and redacted target label. If conflicts remain, the
command exits `0` only when resolver visibility is removed and all
installer-owned cleanup that can be proven safe has completed.

`conflict-id` is a deterministic hash over the normalized tuple
`pack-id`, `artifact-id`, `harness-id`, `layer`, `target`, and conflict gate.
The hash input uses manifest target identity and registry row ids, not absolute
local paths. Conflict rows have this shape:

```json
{
  "conflict-id": "sha256:<digest>",
  "pack-id": "fixture-pack",
  "artifact-id": "demo-skill",
  "harness-id": "codex",
  "layer": "skills",
  "target": "<target>",
  "gate": "existing-path-ownership",
  "status": "blocked"
}
```

State transitions:

| Transition | Commit Point | Failure Result |
|------------|--------------|----------------|
| absent or disabled -> active | Registry row becomes `active` after validation and required mount writes verify. | Previous state remains authoritative; journal recovery removes matching planned links. |
| active -> active updated | Registry row is atomically replaced after validation and link verify. | Previous active row remains authoritative; journal recovery restores or removes matching planned links. |
| active -> disabled | Registry row is atomically changed to `disabled` before link cleanup. | Resolver visibility is already removed; journal recovery completes matching link cleanup. |
| disabled -> active | Same as install activation, using the disabled row as previous state. | Row remains disabled. |
| active or disabled -> tombstoned | Resolver visibility is atomically removed before link cleanup. | Journal recovery completes matching cleanup or restores previous row only if no cleanup happened. |

Uninstall creates a tombstone row by default. Tombstones are excluded from
resolver candidates and active manifest-set validation, but remain available to
`status --pack-id`, `recover`, and audit output. Permanent purge is out of scope
for the first implementation.

Duplicate and replacement rules:

| Case | Behavior |
|------|----------|
| Install same `pack-id` while an active row exists | Reject unless `update` or `replace` is requested. |
| Install same `pack-id` while only disabled rows exist | Reuse the newest disabled row when source realpath matches; otherwise require `replace`. |
| Enable disabled row when another active row has same `pack-id` | Reject. |
| Replace missing old source | Allowed only after dry-run reports missing source and all owned link cleanup actions. |

### LLM-First Resolver Contract

Install makes manifest metadata available; it does not make artifact bodies
eagerly loaded.

| Rule | Requirement |
|------|-------------|
| Pre-route visibility | Resolver may inspect compact candidate rows only. |
| Body loading | Skill, rule, standard, command, reference, and template bodies load only after route evidence selects the export. |
| Disabled packs | Disabled packs are absent from resolver candidates and manifest-set validation inputs. |
| Route conflicts | This lifecycle supplies compact rows only; duplicate route signature policy remains owned by `artifact-pack-discovery-routing` unless an existing validator already rejects a concrete conflict. |

Resolver implementation remains owned by `artifact-pack-discovery-routing`.
This spec only guarantees the installed-pack registry can produce the compact
candidate index and active manifest-set needed by that later resolver.

### CLI Contract

First implementation uses one script entry point:

```text
node scripts/install-artifact-pack.mjs <verb> [options]
```

| Verb | Required Options | Behavior |
|------|------------------|----------|
| `inspect` | `--artifact-pack <path>` or `--pack-id <id>` | Validate input or read an existing row and print planned registry, manifest-set, candidate, and mount actions without persistent writes. |
| `install` | `--artifact-pack <path>` | Install and activate a new pack. |
| `update` | `--pack-id <id>` | Revalidate source and reconcile active row. |
| `disable` | `--pack-id <id>` | Remove resolver visibility and deactivate owned links. |
| `enable` | `--pack-id <id>` | Revalidate and reactivate a disabled row. |
| `uninstall` | `--pack-id <id>` | Remove owned links and tombstone the registry row; permanent purge is out of scope. |
| `recover` | none | Discover stale journals and finish or roll back journal-matching actions only. |
| `list` | none | Read registry rows and summarize installed packs without body loading. |
| `status` | `--pack-id <id>` | Read one registry row, link status, candidate count, and journal state. |

Options:

| Option | Rule |
|--------|------|
| `--dry-run` | No persistent writes; report planned actions and previous state. Temporary validation directories are allowed only under temp-location rules. |
| `--json` | Emit machine-readable report. Candidate rows and link records are summarized by default for every verb; full rows require `--json --verbose`. |
| `--harness <id>` | Limit link target derivation to one harness. |
| `--harness-config <path>` | Test-only harness registry override for link-mode tests; allowed only with a temp registry as defined in the mount-mode test override rules. Must point outside tracked source and use temp deploy targets only. |
| `--registry <path>` | Test-only or explicit-user registry path override; same safety checks as `AGENT_HUB_PACK_REGISTRY`. |
| `--replace` | Allow same `pack-id` replacement after dry-run-safe cleanup. |
| `--force` | Valid only for `uninstall`; tombstone resolver visibility despite unresolved non-owned cleanup conflicts, but never delete non-owned paths. |
| `--keep-temp` | Preserve generated manifest-set temp directory for debugging. |
| `--verbose` | Include absolute local paths in JSON reports for debugging; omit them from default human output. |

Exit codes:

| Code | Meaning |
|------|---------|
| `0` | Success or dry-run with no blocking failure. |
| `1` | Validation, safety gate, duplicate, or ownership failure. |
| `2` | CLI usage error. |
| `3` | Interrupted or recoverable transaction failure. |

Report fields:

| Field | Rule |
|-------|------|
| `verb` | Requested verb. |
| `dry-run` | Boolean. |
| `registry-path` | Redacted stable label such as `<registry>` by default; resolved absolute path only with `--verbose`. Omit when unsafe. |
| `previous-state` | Prior registry row summary or null; redact nested absolute paths unless `--verbose`. |
| `planned-state` | Planned row summary with candidate and link counts by default; include full candidate index and link records only with `--verbose`. Redact nested absolute paths unless `--verbose`. |
| `rows` | Registry row summaries for `list` and `status`. |
| `manifest-set-path` | Redacted stable label such as `<temp-manifest-set>` by default; generated temp absolute path only with `--verbose`. |
| `actions` | Ordered action rows with fields defined below. Absolute paths are redacted unless `--verbose`. |
| `recovery` | Structured recovery summary or null. When present, include `decision`, `gate`, and `actions`. |
| `transaction-id` | Durable journal id when a write transaction is planned or running. |
| `row-count` | Number of rows returned by `list` or matching the current `status` query. |
| `conflicts` | Conflict summaries for force-capable flows. Each row uses non-path identity fields and redacted labels unless `--verbose`. |

Action row fields:

| Field | Rule |
|-------|------|
| `kind` | `validate`, `registry-read`, `registry-write`, `link-create`, `link-remove`, `candidate-index`, `manifest-set`, or `recover`. |
| `pack-id` | Affected pack id. |
| `artifact-id` | Affected artifact id or null. |
| `harness-id` | Affected harness id or null. |
| `layer` | Mount layer or null. |
| `mount-mode` | `virtual`, `link`, `copy`, or null. |
| `source-realpath` | Source realpath when relevant; redacted unless `--verbose`. |
| `target-path` | Target path when relevant; redacted unless `--verbose`. |
| `gate` | Safety or validation gate name when blocked. |
| `status` | `planned`, `skipped`, `applied`, `blocked`, or `failed`. |
| `reason` | Human-readable diagnostic. Must not include absolute local paths unless `--verbose`; use labels such as `<registry>`, `<pack-source>`, `<target>`, and `<temp-manifest-set>`. |

Concrete JSON examples, fixture layouts, and command skeletons live in
`docs/plans/proposed/installed-pack-lifecycle-test-contract.md`. This spec owns
the CLI and state contract; the test contract owns executable examples.

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this proposed spec and intake. | Planning artifacts exist and milestone links to the spec. |
| 2 | Review registry path and ownership model. | One accepted storage location and ownership strategy. |
| 3 | Implement dry-run install inspection. | Command reports planned registry row, candidate index, manifest-set, previous state, and mount actions without persistent writes. |
| 4 | Implement read-only CRUD. | `list`, `status`, and `inspect` report registry and candidate state without persistent writes or body loading. |
| 5 | Implement registry write and virtual mounts. | Active pack manifests produce compact candidate rows without file-system links. |
| 6 | Implement guarded link mounts. | Link mode creates only safe installer-owned symlinks. |
| 7 | Implement update, disable, enable, uninstall, and recover. | Registry state and installer-owned links reconcile safely. |
| 8 | Add fixtures and practical tests. | Self-link, duplicate id, disabled pack, read-only status, update, uninstall, and recovery cases are covered. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/artifact-pack-manifest-contract.md`
- `docs/plans/completed/artifact-pack-validation-gates.md`
- `agent/config/agent-hub.json`
- `scripts/link-harnesses.mjs`

Output:
- Confirmed manifest mount modes, validation gate names, harness deploy target
  registry, and current link behavior.

Non-output:
- No registry write, symlink change, resolver implementation, or pack migration.

Failure:
- Stop if manifest mount fields, validator inputs, or harness deploy target
  definitions conflict.

Proof:
- `rg -n "mount|mode|artifact-pack|deployTarget|linkMethod" docs/plans/completed/artifact-pack-manifest-contract.md docs/plans/completed/artifact-pack-validation-gates.md agent/config/agent-hub.json scripts/link-harnesses.mjs`

S1 - Machine-local registry contract

Input:
- Baseline evidence from S0.
- Existing `agent-hub-config` private config convention.

Output:
- Registry path and row schema for installed pack state are accepted or patched.

Non-output:
- No committed machine paths.
- No pack source modification.

Failure:
- If harness-neutral private config cannot be resolved, use the existing
  `agent-hub-config` convention only as an explicit first implementation
  decision.

Proof:
- `rg -n "machine-local pack registry|artifact-packs.json|source-path" docs/plans/proposed/installed-pack-lifecycle.md docs/briefings/specs/installed-pack-lifecycle.md`

S2 - Dry-run installer

Input:
- Pack root or `artifact-pack.json` path.
- Machine-local pack registry path.
- Artifact-pack validator.
- Existing validator fixture:
  `tests/fixtures/artifact-packs/pass/valid-minimal-public`.
- Lifecycle virtual happy-path fixture to add:
  `tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal`.

Output:
- A dry-run report showing registry row, active manifest-set effects, and mount
  actions.
- No resolver-visible or harness-visible state changes.

Non-output:
- No persistent file writes.
- No symlink creation.
- No git clone or pull.

Failure:
- Reject invalid manifests, duplicate active pack ids, unsafe paths, and
  source-target aliasing.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack tests/fixtures/artifact-packs/pass/valid-minimal-public`
- `node scripts/install-artifact-pack.mjs inspect --dry-run --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal --registry <temp-registry> --json`

S3 - Registry and virtual mount implementation

Input:
- Accepted dry-run report.
- Lifecycle virtual happy-path fixture:
  `tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal`.

Output:
- Machine-local registry row is written.
- Compact candidate rows for resolver-eligible exports are present in the registry.

Non-output:
- No file-system link or copy.
- No artifact body preload.

Failure:
- Roll back registry write or leave previous valid registry content if
  manifest-set validation fails.

Proof:
- `node scripts/install-artifact-pack.mjs list --registry <missing-temp-registry-file> --json`
- `node scripts/install-artifact-pack.mjs install --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal --registry <temp-registry> --keep-temp --verbose --json`
- `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack <manifest-set-path-from-verbose-json>`

S3.5 - Read-only CRUD

Input:
- Machine-local pack registry.
- Candidate index.
- Transaction journals.

Output:
- `list`, `status`, and `inspect` return installed-pack state without
  persistent writes.

Non-output:
- No registry mutation.
- No link changes.
- No artifact body preload.

Allowed temporary output:
- `inspect` may create and remove temporary validation directories outside the
  checkout, deploy targets, registry/private config root, and source pack root.

Failure:
- Report missing registry, stale journals, invalid row shape, and unsafe path
  resolution without attempting repair.

Proof:
- `node scripts/install-artifact-pack.mjs list --registry <temp-registry> --json`
- `node scripts/install-artifact-pack.mjs status --pack-id <fixture-pack-id> --registry <temp-registry> --json`

S4 - Guarded link mount implementation

Input:
- Active registry row.
- Link-mode export.
- Harness deploy target from `agent/config/agent-hub.json`.

Output:
- Installer-owned symlink exists only when every link safety gate passes.

Non-output:
- No links inside canonical `agent/` when the deploy target resolves to the
  same tree.
- No overwrite of unknown files, directories, or symlinks.

Failure:
- Do not activate the planned registry row. Leave previous active state
  unchanged and report the failing gate.

Proof:
- Link-mode fixture tests cover safe link, existing non-owned file, existing
  non-owned symlink, source-target same inode, and deploy-target-inside-source.
  Fixture names, harness override shape, and assertions are defined in
  `docs/plans/proposed/installed-pack-lifecycle-test-contract.md`.

S5 - Update, disable, enable, and uninstall

Input:
- Existing registry row.
- Installer ownership records.
- Current pack manifest.

Output:
- Update reconciles installer-owned links.
- Disable removes resolver visibility.
- Enable revalidates before restoring visibility.
- Uninstall removes only installer-owned links and tombstones registry state.

Non-output:
- No source pack deletion.
- No deletion of non-owned harness runtime paths.

Failure:
- Stop on non-owned conflicts and print a dry-run-style repair report.

Proof:
- Clean practical sequence:
  `list` on missing temp registry returns empty JSON, install
  `virtual-minimal`, `inspect --pack-id <fixture-pack-id> --json`, update
  unchanged, disable, enable, uninstall, validate clean post-state.
- Messy practical sequence:
  run `recover --dry-run` on `stale-journal`, run `uninstall --dry-run` on
  `link-non-owned-symlink`, confirm `uninstall --force` tombstones resolver
  visibility without deleting the non-owned symlink, and confirm default JSON
  contains no absolute local paths in fields or `reason` strings.
- Exact command skeletons, fixture layout, temp path rewrites, and assertions are
  owned by `docs/plans/proposed/installed-pack-lifecycle-test-contract.md`.

## Validation

| Check | Command Or Inspection |
|-------|-----------------------|
| Markdown and lifecycle validation | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full LLM-first validation | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Term consistency | Review wording for server-release phrasing and distinguish allowed adapter examples from forbidden canonical install locations. |
| Scope guard | `git diff --name-only` contains only lifecycle docs, installer script, fixture rewriter, installed-pack fixtures, and practical lifecycle tests. |

## Risks

| Risk | Control |
|------|---------|
| Installer repeats the current harness-link self-symlink hazard. | Source-target distinction and core self-link guard are explicit link gates. |
| Machine-local paths leak into tracked files. | Absolute source paths are allowed only in the private machine-local pack registry and default JSON reports redact registry and temp paths. |
| Uninstall deletes user-owned files. | Remove only installer-owned links and tombstone registry rows by default. |
| Resolver loads too much pack context before route selection. | Install exposes compact manifest metadata only; body loading belongs to resolver evidence. |
| Copy mode becomes a hidden migration path. | Reject or require documented override for `mount.mode: copy` in first implementation. |

## Acceptance Criteria

- [ ] A machine-local pack registry path and schema are accepted.
- [ ] Installed-pack lifecycle maps create/read/update/state/delete/repair to `install`, `list/status/inspect`, `update`, `enable/disable`, `uninstall`, and `recover`.
- [ ] Install validates a pack root before writing registry state.
- [ ] Read operations do not write persistent files, create harness links, mutate registry state, or load artifact bodies.
- [ ] Active installed packs can be validated as a manifest set.
- [ ] All active resolver-eligible exports produce compact candidate rows; virtual mounts do so without file-system writes.
- [ ] Link mounts reject source-target aliasing, target escapes, and deploy-target-inside-source cases.
- [ ] Update reconciles only installer-owned links and registry metadata.
- [ ] Disable and uninstall remove resolver visibility without deleting pack source folders.
- [ ] No tracked file stores absolute user paths from installed packs.
- [ ] Practical tests cover install, update, disable, enable, uninstall, and self-link rejection.
- [ ] Practical tests include clean missing-registry startup, messy stale-journal recovery, non-owned symlink conflict, and `uninstall --force`.
- [ ] CLI verbs, exit codes, and JSON report shape are implemented as specified.
- [ ] Practical tests use `--registry <temp-registry>` or `AGENT_HUB_PACK_REGISTRY`, never the live machine-local registry.

## Open Decisions

| Decision | Default |
|----------|---------|
| Registry location | First implementation requires `--registry`, `AGENT_HUB_PACK_REGISTRY`, or an existing validated machine config key; adapter examples are not implicit defaults. |
| Git clone support | Defer automatic clone and pull; first implementation treats git repos as local pack folders. |
| Copy mode | Reject in first implementation unless a compatibility spec grants a specific override. |
| Installer entry point | Prefer a bootstrap script plus a thin lifecycle skill wrapper. |
