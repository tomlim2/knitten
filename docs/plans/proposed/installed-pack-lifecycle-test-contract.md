---
status: proposed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
parent: docs/plans/proposed/installed-pack-lifecycle.md
---

# Installed Pack Lifecycle Test Contract

## Purpose

Define executable fixture layout, JSON examples, and practical command
sequences for `installed-pack-lifecycle` without bloating the lifecycle spec.

## Scope

This contract owns test-only details:

| Area | Owned Here |
|------|------------|
| Fixture names | Installed-pack lifecycle fixture paths and required fields. |
| Temp setup | Harness override JSON, registry temp copies, and path rewrites. |
| Expected JSON | Default redacted JSON examples for core success and failure paths. |
| Assertions | Required postconditions for clean and messy practical tests. |

The parent spec owns registry schema, CLI verbs, lifecycle state transitions,
ownership safety, and resolver visibility.

## Fixture Contract

All lifecycle fixtures live under `tests/fixtures/installed-pack-lifecycle/`.
Tracked fixture files must not contain absolute local paths. Any registry,
journal, ownership-map, or harness target path stored in a fixture must use
tokens that the test harness rewrites after copying the fixture to a temp
directory.

Required token names:

| Token | Rewritten To |
|-------|--------------|
| `__FIXTURE_ROOT__` | Temp copy root for the selected fixture. |
| `__PACK_SOURCE__` | Temp pack source path. |
| `__REGISTRY__` | Temp registry JSON path. |
| `__HARNESS_TARGET__` | Temp harness deploy target. |
| `__LINK_TARGET__` | Temp symlink target path under the harness target. |

Required fixtures:

| Fixture | Required Contents | Expected Result |
|---------|-------------------|-----------------|
| `pass/virtual-minimal` | Manifest with `pack-id: fixture-pack`, one virtual export `demo-skill`. | Installs without filesystem links and creates one compact candidate. |
| `pass/link-safe` | Manifest with `pack-id: fixture-pack`, one link export `demo-skill` targeting `demo-skill` under `mount.layer: skills`. | Installs only with a temp `--harness-config`. |
| `fail/link-non-owned-symlink` | Tokenized `registry.json`, `ownership-map.json`, and preexisting non-owned symlink target. | Blocks with `gate: existing-path-ownership`; `--force` tombstones without deleting the symlink. |
| `fail/link-self-target` | Tokenized harness config whose target resolves to the source tree. | Blocks with `gate: core-self-link`. |
| `fail/deploy-target-inside-source` | Tokenized harness target inside `__PACK_SOURCE__`. | Blocks before registry activation. |
| `fail/stale-journal` | Tokenized `registry.json`, `ownership-map.json`, and `journals/fixture-pack.tx-stale.update.json` with registry digest equal to `registry-digest-before` and current row equal to `previous-row`. | `recover --dry-run` exits `0` with `recovery.decision: rollback-planned-links`. |
| `fail/locked-registry` | Tokenized `registry.json`, `ownership-map.json`, `registry.lock`, and one active journal. | `recover --dry-run` exits `3` with `gate: registry-locked`. |

Registry-adjacent files must use this temp layout:

```text
<temp-case>/
  registry.json
  ownership-map.json
  registry.lock        # only in lock-specific fixtures
  journals/
    <pack-id>.<transaction-id>.<verb>.json
  pack-source/
    artifact-pack.json
```

## Harness Override

Link-mode success tests must not touch live harness paths. Create a temp harness
config with mapping values that match the parent spec target derivation
algorithm: mapping value equals the shared layer path, and mapping key becomes
the deploy-target-relative root.

```bash
HARNESS_CONFIG="$(mktemp -d)/agent-hub.json"
HARNESS_TARGET="$(mktemp -d)"
cat > "$HARNESS_CONFIG" <<'JSON'
{
  "harnesses": [
    {
      "id": "codex-test",
      "deployTarget": "__HARNESS_TARGET__",
      "mappings": {
        "skills": "agent/skills"
      }
    }
  ],
  "sharedLayers": [
    {
      "id": "skills",
      "path": "agent/skills"
    }
  ]
}
JSON
node -e 'const fs=require("fs"); const p=process.argv[1]; const target=process.argv[2]; fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace("__HARNESS_TARGET__", target));' "$HARNESS_CONFIG" "$HARNESS_TARGET"
```

`--harness-config` must be accepted only with a temp registry path. A temp
registry path is created under the current command's `mktemp` directory or test
harness temp root, outside tracked source, outside pack source roots, outside
deploy targets, and not equal to any machine config `packRegistryPath`. Using
`--harness-config` with the live machine-local registry must fail before
planning with `gate: harness-config-live-registry`.

## JSON Examples

Empty registry list:

```json
{
  "verb": "list",
  "dry-run": false,
  "registry-path": "<registry>",
  "row-count": 0,
  "rows": [],
  "actions": [],
  "recovery": null
}
```

Missing row status:

```json
{
  "verb": "status",
  "dry-run": false,
  "registry-path": "<registry>",
  "row-count": 0,
  "rows": [],
  "actions": [
    {
      "kind": "registry-read",
      "pack-id": "fixture-pack",
      "artifact-id": null,
      "harness-id": null,
      "layer": null,
      "mount-mode": null,
      "gate": "registry-missing-row",
      "status": "blocked",
      "reason": "no registry row matches pack-id"
    }
  ],
  "recovery": null
}
```

Successful inspect after validation:

```json
{
  "verb": "inspect",
  "dry-run": true,
  "registry-path": "<registry>",
  "previous-state": null,
  "planned-state": {
    "pack-id": "fixture-pack",
    "state": "pending",
    "candidate-count": 1,
    "link-count": 0
  },
  "manifest-set-path": "<temp-manifest-set>",
  "actions": [
    {
      "kind": "validate",
      "pack-id": "fixture-pack",
      "artifact-id": null,
      "harness-id": null,
      "layer": null,
      "mount-mode": null,
      "gate": "artifact-pack",
      "status": "applied",
      "reason": "manifest validation passed"
    }
  ],
  "recovery": null
}
```

Blocked uninstall with structured recovery:

```json
{
  "verb": "uninstall",
  "dry-run": true,
  "registry-path": "<registry>",
  "actions": [
    {
      "kind": "link-remove",
      "pack-id": "fixture-pack",
      "artifact-id": "demo-skill",
      "harness-id": "codex-test",
      "layer": "skills",
      "mount-mode": "link",
      "gate": "existing-path-ownership",
      "status": "blocked",
      "reason": "target is not installer-owned"
    }
  ],
  "conflicts": [
    {
      "conflict-id": "sha256:<digest>",
      "pack-id": "fixture-pack",
      "artifact-id": "demo-skill",
      "harness-id": "codex-test",
      "layer": "skills",
      "target": "<target>",
      "gate": "existing-path-ownership",
      "status": "blocked"
    }
  ],
  "recovery": {
    "decision": "manual-conflict",
    "gate": "existing-path-ownership",
    "actions": []
  }
}
```

## Practical Sequences

Clean lifecycle:

```bash
REG="$(mktemp -d)/artifact-packs.json"
node scripts/install-artifact-pack.mjs list --registry "$REG" --json
node scripts/install-artifact-pack.mjs install --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal --registry "$REG" --json
node scripts/install-artifact-pack.mjs inspect --pack-id fixture-pack --registry "$REG" --json
node scripts/install-artifact-pack.mjs update --pack-id fixture-pack --registry "$REG" --json
node scripts/install-artifact-pack.mjs disable --pack-id fixture-pack --registry "$REG" --json
node scripts/install-artifact-pack.mjs enable --pack-id fixture-pack --registry "$REG" --json
node scripts/install-artifact-pack.mjs uninstall --pack-id fixture-pack --registry "$REG" --json
node scripts/install-artifact-pack.mjs status --pack-id fixture-pack --registry "$REG" --json
```

Link-mode lifecycle:

```bash
REG_LINK_SAFE="$(mktemp -d)/artifact-packs.json"
HARNESS_CONFIG="$(mktemp -d)/agent-hub.json"
HARNESS_TARGET="$(mktemp -d)"
cat > "$HARNESS_CONFIG" <<'JSON'
{
  "harnesses": [
    {
      "id": "codex-test",
      "deployTarget": "__HARNESS_TARGET__",
      "mappings": {
        "skills": "agent/skills"
      }
    }
  ],
  "sharedLayers": [
    {
      "id": "skills",
      "path": "agent/skills"
    }
  ]
}
JSON
node -e 'const fs=require("fs"); const p=process.argv[1]; const target=process.argv[2]; fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace("__HARNESS_TARGET__", target));' "$HARNESS_CONFIG" "$HARNESS_TARGET"
node scripts/install-artifact-pack.mjs install --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/link-safe --registry "$REG_LINK_SAFE" --harness codex-test --harness-config "$HARNESS_CONFIG" --json

SELF_CASE="$(mktemp -d)"
cp -R tests/fixtures/installed-pack-lifecycle/fail/link-self-target/. "$SELF_CASE"
node scripts/rewrite-installed-pack-fixture.mjs "$SELF_CASE"
node scripts/install-artifact-pack.mjs install --artifact-pack "$SELF_CASE/pack-source" --registry "$SELF_CASE/registry.json" --harness codex-test --harness-config "$SELF_CASE/agent-hub.json" --json

DEPLOY_CASE="$(mktemp -d)"
cp -R tests/fixtures/installed-pack-lifecycle/fail/deploy-target-inside-source/. "$DEPLOY_CASE"
node scripts/rewrite-installed-pack-fixture.mjs "$DEPLOY_CASE"
node scripts/install-artifact-pack.mjs install --artifact-pack "$DEPLOY_CASE/pack-source" --registry "$DEPLOY_CASE/registry.json" --harness codex-test --harness-config "$DEPLOY_CASE/agent-hub.json" --json
```

Harness override negative case:

```bash
LIVE_REGISTRY_FROM_MACHINE_CONFIG="<packRegistryPath>"
node scripts/install-artifact-pack.mjs install --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/link-safe --registry "$LIVE_REGISTRY_FROM_MACHINE_CONFIG" --harness codex-test --harness-config "$HARNESS_CONFIG" --json
```

Messy lifecycle:

```bash
MESSY="$(mktemp -d)"
cp -R tests/fixtures/installed-pack-lifecycle/fail/stale-journal/. "$MESSY/stale-journal"
cp -R tests/fixtures/installed-pack-lifecycle/fail/link-non-owned-symlink/. "$MESSY/link-non-owned-symlink"
cp -R tests/fixtures/installed-pack-lifecycle/fail/locked-registry/. "$MESSY/locked-registry"
node scripts/rewrite-installed-pack-fixture.mjs "$MESSY/stale-journal"
node scripts/rewrite-installed-pack-fixture.mjs "$MESSY/link-non-owned-symlink"
node scripts/rewrite-installed-pack-fixture.mjs "$MESSY/locked-registry"
node scripts/install-artifact-pack.mjs recover --dry-run --registry "$MESSY/stale-journal/registry.json" --json
node scripts/install-artifact-pack.mjs recover --dry-run --registry "$MESSY/locked-registry/registry.json" --json
node scripts/install-artifact-pack.mjs uninstall --dry-run --pack-id fixture-pack --registry "$MESSY/link-non-owned-symlink/registry.json" --json
node scripts/install-artifact-pack.mjs uninstall --force --pack-id fixture-pack --registry "$MESSY/link-non-owned-symlink/registry.json" --json
node scripts/install-artifact-pack.mjs status --pack-id fixture-pack --registry "$MESSY/link-non-owned-symlink/registry.json" --json
```

The rewrite helper is part of the implementation task. It replaces fixture
tokens with temp paths and creates any preexisting symlinks required by the
case. It must not write into tracked fixtures.

## Assertions

| Case | Assertion |
|------|-----------|
| Empty list | Exit `0`, `row-count: 0`, `rows: []`, no absolute paths. |
| Virtual install | Exit `0`, row state `active`, candidate count `1`, link count `0`. |
| Link-safe install | Exit `0`; symlink exists under `<harness-target>/skills/demo-skill`; row uses `harness-id: codex-test`. |
| Link self-target | Exit `1`, `gate: core-self-link`, no registry activation. |
| Deploy target inside source | Exit `1`, no registry activation. |
| Harness override with live registry | Exit `1`, `gate: harness-config-live-registry`, no planning. |
| Disable | Exit `0`, resolver visibility removed, row retained. |
| Enable | Exit `0`, row state `active` after validation. |
| Uninstall | Exit `0`, row state `tombstoned`, source pack untouched. |
| Stale journal dry-run | Exit `0`, `recovery.decision: rollback-planned-links`, `recovery.gate: null`, and journal-matching planned links listed in `recovery.actions`. |
| Locked registry recovery | Exit `3`, `gate: registry-locked`, no recovery action applied. |
| Force uninstall conflict | Exit `0` only after resolver visibility is removed; non-owned symlink still exists. |
| Redaction | Default JSON contains no absolute local paths in fields, `reason`, `conflicts`, or `recovery`. |

Verbose tests may use `--keep-temp --verbose --json` to extract
`manifest-set-path`, but test logs must redact or avoid storing verbose output.

## Validation

```bash
git diff --check
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
```

## Acceptance Criteria

- [ ] The parent lifecycle spec stays focused on state, CLI, and safety.
- [ ] This contract contains all practical fixture names and command skeletons.
- [ ] No tracked fixture needs absolute local paths.
- [ ] Messy fixtures are copied to temp and token-rewritten before use.
- [ ] Recovery examples use one structured `recovery` shape.
