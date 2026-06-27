# Knitten Plugin Boundary

## Purpose

This document defines the boundary between the Knitten core plugin and domain
plugins.

## Roles

| Plugin | Role |
|--------|------|
| `knitten` | Core operating layer: policy, output paths, shared workflow skills, CRUD workflows, validation, local installation. |
| Domain plugin | Skill layer: skill files and skill-owned support files. |

Short rule:

```text
Knitten owns operation.
Domain plugins contain skills.
```

## Terminology

Terminology follows `SYSTEM.md`.

- Use `shared workflow` for the generic Codex workflow layer.
- Use `Knitten hub` for the Knitten-owned local storage root.
- Use `output contract` for `KNITTEN_PATH_BIN output` resolver entries.
- Use `local artifact path registry` for task-scoped local path entries.
- Use `domain plugin source root` for an editable domain plugin checkout.
- Use `installed plugin root` or `materialized copy` for installed copies.

## Core-Owned Surfaces

These belong to `knitten`:

- plugin boundary policy
- shared workflow skills
- output and path runtime
- local artifact registries
- generic long-running work memory and decision contract
- shared document templates
- finding report capture and storage
- promoted-reference policy
- plugin installation and marketplace registration policy
- validators that enforce core/domain-plugin separation

## Domain-Plugin-Owned Surfaces

Domain plugins may contain:

- `skills/<skill>/SKILL.md`
- `skills/<skill>/reference.md`
- `skills/<skill>/reference-promoted.md`
- `skills/<skill>/scripts/**`
- `skills/<skill>/assets/**`
- domain-specific standards or references that are owned by a skill

Domain plugins should not define independent policy for shared workflow
operation.

## Finding Reports

Finding reports are Knitten core-owned.

Rules:

- Use `knitten:kc-report-finding` only for checked mechanical issues.
- Store all finding records in the Knitten finding report queue.
- Do not store finding reports in a domain plugin.
- Domain plugins must not document or depend on the finding-report workflow.

## Promoted References

`reference-promoted.md` is a domain-plugin-managed temporary reference file
that may be placed next to a domain skill.

Rules:

- The domain plugin owns create, update, delete, promote, retire, and move.
- Use the domain plugin's promote-reference skill for CRUD.
- Domain skills inspect the `reference-promoted.md` trigger index when present
  and read only matching promoted sections.
- Other plugins must not create, edit, delete, promote, retire, or move it.
- Entries need trigger, check, action, and retirement target.
- Retire entries into `SKILL.md`, `reference.md`, helper scripts, tests, or
  repository guidelines when stable.

## Output Paths

Shared local workflow outputs resolve through Knitten.

Domain plugins may use a forwarding shim, but must not own generic output
registries or path policy.

Durable task documents belong to the target workspace when that workspace has a
document convention. Shared local scratch belongs to the Knitten hub.
Shotloom task artifacts are a target-workspace-owned case: Knitten may keep
compatibility output ids for old KSL flows, but primary task memory belongs to
the Shotloom checkout through its `scripts/agent-task-artifact.mjs` resolver.

## Long-Running Work Memory

Knitten owns the generic contract for long-running task memory and user
decision gates. Domain plugins may apply that contract inside domain workflows,
but must not define independent generic memory, approval, or output policy.

Repositories hold code, specs, and committed durable docs. Registered local
artifact paths hold rolling work context such as decisions, open loops,
verification state, review notes, briefings, and resume handoffs. Reusable task
context should not exist only in chat history.

For target workspaces that define their own local task-memory resolver,
registered Knitten local artifact paths are compatibility-era only. They must
be marked with compatibility metadata and a migration target, not treated as
new KC-owned primary storage.

Codex may prepare summaries, evidence, drafts, patches, reply plans, PR bodies,
and next-step recommendations. Publishing, posting externally, deployment,
destructive cleanup, and irreversible external-state changes require user
approval unless the active skill documents a narrower explicit exemption.

## Legacy Domain Plugin Surfaces

The following domain plugin surfaces are legacy until migrated or reclassified:

- domain-plugin-level `agent/**`
- domain-plugin-level `docs/**`
- domain-plugin-level `document-templates/**`
- generic path/output helper copies

During migration, validators may report these as warn-only. New work should not
add to these surfaces unless it is explicitly part of boundary cleanup.

## Validation

Domain plugin boundary checks should verify:

- no legacy shared-workflow support skills
- no finding-report workflow references
- no tracked `.agent-local/**`
- no new generic output/path registries
- no new shared document templates outside skill-owned locations

Core checks should verify:

- output resolver behavior
- finding report hub storage
- plugin marketplace registration
- materialized plugin copy health
- promoted-reference ownership policy stays documented in core
