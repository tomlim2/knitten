---
description: Manage agent-hub specs across intake, create, update, review, archive, and delete flows; route to domain-specific spec skills when they fit.
argument-hint: "<create|update|review|archive|delete|route> [slug-or-path]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*), Bash(mkdir:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: authoring,review
context-profile: ah-authoring
---

# ah-manage-spec

Manage agent-hub specs as durable work contracts: intake, routing, create,
update, review, archive, and delete.

## Purpose

Use this when the user asks to make, update, review, archive, delete, or route a
spec under `docs/plans/`. This skill is an orchestrator. It does not replace
domain-specific spec skills; it routes to them when they fit.

## Core Rule

Start with intake, then route, then write. A spec must be grounded in evidence:
user request, files, docs, skills, rules, standards, commands, or explicit
decisions.

## Modes

| Mode | Use when | Writes |
|------|----------|--------|
| `create <slug>` | user asks for a new spec, plan doc, or "spec first" | lifecycle spec path; optional intake |
| `update <slug>` | existing spec needs changes | focused patch to the spec |
| `review <slug-or-path>` | user asks to review/check a spec | findings first; patch only if asked |
| `archive <slug>` | spec is done, parked, superseded, or inactive | status/frontmatter update |
| `delete <slug>` | user explicitly asks to delete the file | gated deletion |
| `route <request>` | classify without writing | chat summary or intake draft |

If the mode is omitted, infer it from the user request. Prefer `create` for new
work and `review` for "review/check" wording.

## Routes

| Request shape | Route |
|---------------|-------|
| Shotloom task implementation spec | use `shotloom-draft-spec` |
| Code, directory, or branch diff needs a technical spec | use `dev-generate-spec` concepts and template |
| Web/product/PRD spec review | use `review-audit-web-spec` checklist |
| agent-hub policy, architecture, path, validator, skill/rule/standard work | use this skill |
| Obsidian vault structure or note contracts | read Obsidian rules/skills only as needed |
| Unknown route | intake-only first; ask one short question if needed |

## Intake

For create and major update, assemble intake before drafting.

Persist intake to `docs/briefings/specs/<slug>.md` when the spec is high-risk:
shared policy, validators, path routing, skill/rule/standard CRUD, deploy
targets, Obsidian vault structure, milestone management, or multi-repo behavior.

Use [SPEC-INTAKE.md](references/SPEC-INTAKE.md) for the intake template.

## Create Workflow

1. Resolve slug: `^[a-z0-9]+(-[a-z0-9]+)*$`.
2. Resolve existing spec paths across lifecycle folders using
   [SPEC-LIFECYCLE.md](references/SPEC-LIFECYCLE.md).
3. If no spec exists, default new specs to `docs/plans/proposed/<slug>.md`
   unless the user explicitly asks to begin active implementation now.
4. Gather intake and classify route.
5. Search related specs:

```bash
rg -n "<slug>|<main-term>" docs/plans docs/milestones docs/briefings
```

6. Read only required evidence and selected route references.
7. Draft using [SPEC-TEMPLATES.md](references/SPEC-TEMPLATES.md).
8. Review the draft for missing evidence, unclear decisions, impossible
   validation, and unsafe operations.
9. Write the spec; write intake if required.
10. Run validation.

If the slug collides with an existing spec, read it first. Switch to update mode
only when the request clearly matches the existing spec.

## Update Workflow

1. Resolve and read the existing spec before editing.
2. Preserve accepted decisions unless the user explicitly changes them.
3. Update `updated: YYYY-MM-DD`.
4. Patch narrowly when possible.
5. Keep validation aligned with the new scope.
6. Stop if the change conflicts with non-goals, deletes acceptance criteria, or
   belongs to a stricter domain-specific workflow.

Use [SPEC-LIFECYCLE.md](references/SPEC-LIFECYCLE.md) for status rules.

## Review Workflow

Lead with findings. Check:

| Area | Question |
|------|----------|
| Intake | Are inputs/evidence identifiable? |
| Route | Was the right workflow used? |
| Scope | Are goals, non-goals, and exclusions clear? |
| Decisions | Are accepted and open decisions separated? |
| Validation | Can the checks actually run? |
| Safety | Are destructive operations gated? |
| Lifecycle | Is the status/current next action clear? |
| Cold start | Can a new agent continue from disk alone? |

For web/product specs, use `review-audit-web-spec` when applicable. For
Shotloom specs, use the Shotloom spec review flow.

## Archive And Delete

Archive by status by default:

| User intent | Status |
|-------------|--------|
| done | `completed` |
| no longer relevant | `archived` |
| replaced | `superseded` plus replacement link |
| paused | `parked` |

Delete only with explicit user request. Before deleting:

1. show the exact path;
2. run `git status --short`;
3. confirm no unrelated/user edits are in the target;
4. ensure the final diff deletes only the intended file.

## Milestones

Milestone attachment is owned by the planned sibling skill
`ah-manage-milestone`. This skill may set/read `milestone:` frontmatter, but
umbrella progress and `## Specs` tables belong to the milestone workflow.

## Validation

Always run:

```bash
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

If the full validator is already red due to unrelated pre-existing violations,
report the exact blocker and still run `git diff --check`.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | operational workflow |
| `references/SPEC-INTAKE.md` | intake artifact template and rules |
| `references/SPEC-LIFECYCLE.md` | status/archive/delete rules |
| `references/SPEC-TEMPLATES.md` | direct spec templates |
| `references/SPEC-ROUTING.md` | route matrix and existing skill reuse |

## Related

- `docs/plans/completed/ah-manage-spec.md`
- `docs/milestones/spec-lifecycle-system.md`
- `agent/skills/dev-generate-spec/SKILL.md`
- `agent/skills/shotloom-draft-spec/SKILL.md`
- `agent/skills/review-audit-web-spec/SKILL.md`
- `agent/skills/ah-make-skill/SKILL.md`
