---
status: accepted
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
---

# Spec Briefings

## Purpose

Spec briefings capture the intake evidence for high-risk agent-hub specs before the
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

The intake frontmatter `spec:` field must point to the actual lifecycle spec
path. Flat spec paths under `docs/plans/<slug>.md` are invalid.
