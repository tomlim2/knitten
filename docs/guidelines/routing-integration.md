# Routing Integration Guideline

Status: legacy migration guidance.

Knitten no longer treats routing as the primary product direction. New work
should prefer direct skill activation, adapter plugins, and internal deferred
flows. Use this file only when maintaining existing router-shaped payloads or
removing router dependencies safely.

## Goal

Define how legacy Knitten or payload router-shaped skills should be maintained
or retired without making every session pay for detailed skill context up front.

Use this when maintaining an existing router-shaped payload, moving an existing
router into internal flows, moving a skill between plugins, or slimming an
existing skill set.

## Integration Model

Legacy router-shaped payloads have three layers:

| Layer | Owns | Should load by default |
|-------|------|------------------------|
| Knitten Core | generic AH workflow, output/path policy, plugin boundary, validation | only compact core skills |
| Payload adapter/index | domain intake, request classification, shared domain gate | compact activation or script-backed shell |
| Payload leaf | one concrete action after routing | compact activation shell |

Core should not own domain behavior. Payload plugins should not copy core path,
output, or boundary policy.

## Core Router Freeze

Do not add new Knitten Core routers or route layers. Core should stay small
enough that direct skill selection is cheaper than router indirection.

When a request asks for router behavior, draft a direct-skill, adapter, or
internal-flow alternative first. Touch existing router-shaped surfaces only to
maintain compatibility or remove dependencies safely.

## Payload Plugin Checklist

When adding a payload plugin:

1. Give the plugin a clear boundary in its README.
2. Keep domain skills in the payload plugin, not in Knitten Core.
3. Prefer direct skills or one adapter skill with internal flow files.
4. Keep the adapter/index `SKILL.md` short and load references after activation.
   For existing legacy router-shaped payloads, keep classification in a
   mechanical script rather than Markdown tables.
5. Keep each leaf's `SKILL.md` as an activation shell.
6. Move unused or rarely needed skills out of the active plugin when possible.
7. Materialize the payload plugin and run its local validator or doctor.
8. Run Knitten's payload boundary validator when changing ownership.

```bash
node <knitten-root>/scripts/validate-payload-boundary.mjs --payload <payload-root>
```

## Legacy Router Checklist

A router is a compact skill shell around a mechanical script. The script owns
request classification before any leaf-specific workflow context is loaded.

Keep a legacy router-shaped index only while:

- many leaf skills share the same domain gate
- leaf descriptions become repetitive
- users ask broad domain requests that need classification
- token cost improves by running one router script before any leaf references

Do not keep a router-shaped index when:

- there is only one leaf
- the router only repeats the leaf description
- classification requires reading every leaf in detail
- the router cannot reject non-domain requests cheaply

Router `SKILL.md` should contain:

- short `description`
- `Use for:` domain intake sentence
- Step 0 domain activation gate
- command for the mechanical route script
- strict escalation rule for mutation-capable leaves
- explicit stop condition for non-domain requests

## Leaf Checklist

A leaf skill should not need to know its parent router.

Leaf `SKILL.md` should contain:

- short `description`
- `Use for:` concrete request shape
- Step 0 activation check
- safety and approval gates for its own action
- pointer to `flow.md` or a skill-local reference after activation

Avoid:

- "Prefer router" boilerplate in every leaf
- parent-router names in leaf activation logic
- long examples or checklists in the active `SKILL.md`
- hidden mutation behavior only documented in references

## Common Domain Gate

If many leaves share the same activation condition, put the check in a shared
script or shared reference owned by the payload plugin.

Prefer:

```text
Run node <payload-plugin-root>/skills/<domain>-references/scripts/<domain>-activation-gate.mjs --print-json
```

Then each leaf can say:

```text
Run the shared activation gate. Continue only when it returns an in-domain
match for this action. Do not read detailed references until it passes.
```

This keeps repeated Step 0 text short while preserving the safety check.

## Mechanical Route Script

Routers should keep route policy in a script, not prose. The script must return
machine-readable JSON and have route fixtures or validator coverage.

Recommended path:

```text
skills/<domain>-router/scripts/route.mjs
```

The script should expose:

- `--request "<text>" --print-json`
- `--list --print-json`
- deterministic fail-closed output for no match or unsafe ambiguity

Legacy Markdown maps may remain as pointers for old links, but they must not be
the routing source of truth. Leaf skills should not read the router script or a
route map to decide whether they apply.

## Moving Skills Between Plugins

When moving a skill:

1. Rename it to the destination plugin's naming convention.
2. Update internal references and mechanical route scripts.
3. Preserve long workflow text in a skill-local reference if the active file is
   being shortened.
4. Remove old active skill exposure from the source plugin.
5. Update docs only when they are user-facing or operationally necessary.
6. Materialize both affected plugins.
7. Run validators for both repositories.

Do not leave deprecated active aliases unless the compatibility value is worth
the discovery-token cost.

## Validation

For Knitten Core:

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
```

For a payload plugin:

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
node <knitten-root>/scripts/validate-payload-boundary.mjs --payload <payload-root>
```

Use the payload's own route validator when it has one.

## Review Checklist

Before committing routing changes, check:

- Does Core still avoid domain behavior?
- Does the payload plugin own its domain skills and references?
- Is there exactly one obvious route script for a multi-leaf domain?
- Can the router script reject non-domain requests without reading leaf details?
- Can each leaf reject mismatched requests without parent knowledge?
- Are strict mutation gates visible before references load?
- Are route decisions in scripts and long workflows in references, not active
  skill bodies?
- Did materialize and doctor pass for every changed plugin?
