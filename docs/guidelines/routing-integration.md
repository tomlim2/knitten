# Routing Integration Guideline

## Goal

Define how a Knitten or payload skill joins the routing system without making
every session pay for detailed skill context up front.

Use this when creating a new payload plugin, adding a router, adding a leaf
skill, moving a skill between plugins, or slimming an existing skill set.

## Integration Model

Knitten routing has three layers:

| Layer | Owns | Should load by default |
|-------|------|------------------------|
| Knitten Core | generic AH workflow, output/path policy, plugin boundary, validation | only compact core skills |
| Payload router | domain intake, request classification, shared domain gate | compact router shell |
| Payload leaf | one concrete action after routing | compact activation shell |

Core should not own domain behavior. Payload plugins should not copy core path,
output, or boundary policy.

## Payload Plugin Checklist

When adding a payload plugin:

1. Give the plugin a clear boundary in its README.
2. Keep domain skills in the payload plugin, not in Knitten Core.
3. Add one router skill when the payload has multiple related leaves.
4. Keep the router's `SKILL.md` short and route to references after activation.
5. Keep each leaf's `SKILL.md` as an activation shell.
6. Move unused or rarely needed skills out of the active plugin when possible.
7. Materialize the payload plugin and run its local validator or doctor.
8. Run Knitten's payload boundary validator when changing ownership.

```bash
node <knitten-root>/scripts/validate-payload-boundary.mjs --payload <payload-root>
```

## Router Checklist

A router is a skill when it performs meaningful request classification before
loading leaf-specific workflow context.

Add a router when:

- many leaf skills share the same domain gate
- leaf descriptions become repetitive
- users ask broad domain requests that need classification
- token cost improves by reading one router before any leaf references

Do not add a router when:

- there is only one leaf
- the router would only repeat the leaf description
- classification requires reading every leaf in detail
- the router cannot reject non-domain requests cheaply

Router `SKILL.md` should contain:

- short `description`
- `Use for:` domain intake sentence
- Step 0 domain activation gate
- route table or pointer to `references/skill-map.md`
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

## Skill Map

Routers should keep route tables in a small reference file when the map is more
than a few entries.

Recommended path:

```text
skills/<domain>-router/references/skill-map.md
```

The map should list:

- user intent
- target leaf skill
- activation level
- mutation surface
- required approval, if any

The router may read this map after its own Step 0 passes. Leaf skills should not
read the router map to decide whether they apply.

## Moving Skills Between Plugins

When moving a skill:

1. Rename it to the destination plugin's naming convention.
2. Update internal references and route maps.
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
- Is there exactly one obvious router for a multi-leaf domain?
- Can the router reject non-domain requests without reading leaf details?
- Can each leaf reject mismatched requests without parent knowledge?
- Are strict mutation gates visible before references load?
- Are route maps and long workflows in references, not active skill bodies?
- Did materialize and doctor pass for every changed plugin?
