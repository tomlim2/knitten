---
status: accepted
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Spec Briefings

## Purpose

Spec briefings capture the intake evidence for high-risk caol specs before the
direct spec is authored or updated.

Use this folder when a spec touches shared policy, validators, path routing,
skill/rule/standard CRUD, deploy targets, Obsidian vault structure, milestone
management, or multi-repo behavior.

## Contract

| File | Matching spec |
|------|---------------|
| `docs/briefings/specs/<slug>.md` | lifecycle spec path under `docs/plans/` |

Briefings record inputs. Specs record the executable work contract. Do not
duplicate the whole spec body here.

The intake frontmatter `spec:` field must point to the actual spec path. Legacy
flat paths such as `docs/plans/<slug>.md` remain valid until the lifecycle
migration moves them.
