# Knitten Plugin Boundary

## Purpose

This document defines the boundary between the Knitten core plugin and payload
plugins.

## Roles

| Plugin | Role |
|--------|------|
| `knitten` | Core operating layer: policy, routing, output paths, generic AH skills, CRUD workflows, validation, local installation. |
| Payload plugin | Skill payload layer: skill files and skill-owned support files. |

Short rule:

```text
Knitten owns operation.
Payload plugins contain skills.
```

## Core-Owned Surfaces

These belong to `knitten`:

- plugin boundary policy
- generic AH skills
- output and path routing
- local artifact registries
- shared document templates
- finding report capture and storage
- `reference-promoted.md` CRUD
- plugin installation and marketplace registration policy
- validators that enforce core/payload separation

## Payload-Owned Surfaces

Payload plugins may contain:

- `skills/<skill>/SKILL.md`
- `skills/<skill>/reference.md`
- `skills/<skill>/reference-promoted.md` placed by Knitten core
- `skills/<skill>/scripts/**`
- `skills/<skill>/assets/**`
- domain-specific standards or references that are owned by a skill

Payload plugins should not define independent policy for generic AH operation.

## Finding Reports

Finding reports are Knitten core-owned.

Rules:

- Use `knitten:ah-report-finding` only for checked mechanical issues.
- Store all finding records in the Knitten hub queue.
- Do not store finding reports in a payload plugin.
- Payload plugins must not document or depend on the finding-report workflow.

## Promoted References

`reference-promoted.md` is a Knitten-managed temporary reference file that may
be placed next to a payload skill.

Rules:

- Knitten core owns create, update, delete, promote, retire, and move.
- Use `ah-promote-reference` for CRUD.
- Payload skills read `reference-promoted.md` when present.
- Payload workflows must not create, edit, delete, promote, retire, or move it.
- Entries need trigger, check, action, and retirement target.
- Retire entries into `SKILL.md`, `reference.md`, helper scripts, tests, or
  repository guidelines when stable.

## Output Paths

Generic AH local outputs route through Knitten.

Payload plugins may use a forwarding shim, but must not own generic output
registries or path policy.

Durable task documents belong to the target workspace when that workspace has a
document convention. Generic local AH scratch belongs to the Knitten hub.

## Legacy Payload Surfaces

The following payload surfaces are legacy until migrated or reclassified:

- payload-level `agent/**`
- payload-level `docs/**`
- payload-level `document-templates/**`
- generic path/output helper copies

During migration, validators may report these as warn-only. New work should not
add to these surfaces unless it is explicitly part of boundary cleanup.

## Validation

Payload boundary checks should verify:

- no `skills/ah-*`
- no finding-report workflow references
- no tracked `.agent-local/**`
- no new generic output/path registries
- no new shared document templates outside skill-owned locations

Core checks should verify:

- output resolver behavior
- finding report hub storage
- plugin marketplace registration
- materialized plugin copy health
- promoted-reference CRUD policy stays documented in core
