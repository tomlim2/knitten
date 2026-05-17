---
description: Manage caol-ila milestones across create, update, attach, detach, review, archive, and delete flows for docs/milestones.
argument-hint: "<create|update|attach|detach|review|archive|delete> [milestone] [spec]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*), Bash(mkdir:*)
domains: caol
repo-keys: caol-ila
languages: markdown,yaml,json
task-types: authoring,review
context-profile: caol-authoring
---

# caol-manage-milestone

Manage Markdown milestones as durable umbrella records for multi-spec outcomes.

## Purpose

Use this when the user asks to create, update, attach, detach, review, archive,
or delete a milestone under `docs/milestones/`. Milestones group specs and track
umbrella progress. Specs remain the executable contracts in `docs/plans/`.

## Core Rule

Milestone CRUD manages relationships and progress. Do not copy implementation
instructions from specs into milestone docs.

## Inputs

| Input | Meaning |
|-------|---------|
| `create <milestone>` | create `docs/milestones/<milestone>.md` |
| `update <milestone>` | patch scope, progress, blockers, decisions, or mirrors |
| `attach <milestone> <spec>` | add spec row and set spec `milestone:` frontmatter |
| `detach <milestone> <spec>` | remove spec relationship without deleting the spec |
| `review <milestone>` | audit links, progress, blockers, and acceptance criteria |
| `archive <milestone>` | set status to completed, parked, superseded, blocked, or archived |
| `delete <milestone>` | delete only after explicit user approval |

If no mode is provided, infer it from the user request. If the mode is still
unclear, show usage and stop.

## Slugs And Paths

Resolve milestone slugs with `^[a-z0-9]+(-[a-z0-9]+)*$`.

| Value | Path |
|-------|------|
| `<milestone>` | `docs/milestones/<milestone>.md` |
| `<spec>` | resolved lifecycle spec path |

If the user passes a path, use that path after verifying it stays under the
expected folder.

Resolve spec slugs in this order:

```text
docs/plans/active/<spec>.md
docs/plans/proposed/<spec>.md
docs/plans/drafts/<spec>.md
docs/plans/parked/<spec>.md
docs/plans/completed/<spec>.md
docs/plans/archive/<spec>.md
docs/plans/<spec>.md
```

If more than one path exists, stop and report duplicate lifecycle state.

## Create Workflow

1. Resolve slug and ensure the file does not already exist.
2. Create `docs/milestones/` if missing.
3. Write the template from [MILESTONE-TEMPLATE.md](references/MILESTONE-TEMPLATE.md).
4. Add or update the row in `docs/milestones/index.md`.
5. Run validation.

If the milestone exists, switch to update mode only when the user request clearly
targets the existing milestone.

## Update Workflow

1. Read the milestone before editing.
2. Preserve existing spec rows unless the user requests attach or detach.
3. Update `updated: YYYY-MM-DD`.
4. Patch only the requested section.
5. Run validation.

Use [MILESTONE-LIFECYCLE.md](references/MILESTONE-LIFECYCLE.md) for status
rules.

## Attach Workflow

1. Read milestone and spec.
2. Stop if either file is missing, unless the user explicitly requested create
   and attach.
3. If the spec has a different non-empty `milestone:`, stop and ask.
4. Set spec frontmatter `milestone: <milestone>`.
5. Add or update the milestone `## Specs` row with a relative link to the
   resolved spec path:

```markdown
| [<spec>.md](<relative-path-from-milestone>) | <spec-status> | <role> |
```

6. Use the spec frontmatter `status:` for `<spec-status>`.
7. Update both `updated:` dates.
8. Run validation.

## Detach Workflow

1. Read milestone and spec.
2. Remove the spec row from the milestone `## Specs` table.
3. Remove `milestone:` from spec frontmatter when no replacement is provided.
4. If a replacement milestone is provided, attach to the replacement milestone.
5. Update touched `updated:` dates.
6. Run validation.

Detach never deletes the spec.

## Review Workflow

Lead with findings. Check:

| Area | Question |
|------|----------|
| Links | Do spec links resolve? |
| Back-links | Does each linked spec point back through `milestone:`? |
| Status | Do row statuses match spec frontmatter or document a reason? |
| Progress | Does every progress row cite evidence? |
| Acceptance | Can completion be checked from disk? |
| Decisions | Are open decisions actionable? |
| Blockers | Are blockers current and specific? |
| Mirrors | Are external mirrors optional and secondary? |

Patch only if the user asks for a fix pass.

## Archive And Delete

Archive by status:

| User intent | Status |
|-------------|--------|
| done | `completed` |
| no longer active | `archived` |
| replaced | `superseded` |
| paused | `parked` |
| waiting | `blocked` |

Delete is destructive. Require:

1. explicit deletion request;
2. exact file path shown before edit;
3. `git status --short` review;
4. no unrelated or user edits in the target;
5. final diff showing only the intended milestone deletion.

Deleting a milestone does not delete linked specs.

## Validation

Always run:

```bash
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

For attach or detach, also run checks from
[MILESTONE-VALIDATION.md](references/MILESTONE-VALIDATION.md).

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | operational workflow |
| `references/MILESTONE-LIFECYCLE.md` | status, archive, and delete rules |
| `references/MILESTONE-TEMPLATE.md` | milestone and index row templates |
| `references/MILESTONE-VALIDATION.md` | link, backlink, and status checks |

## Related

- `docs/plans/completed/caol-manage-milestone.md`
- `docs/milestones/index.md`
- `docs/milestones/spec-lifecycle-system.md`
- `agent/skills/caol-manage-spec/SKILL.md`
- `agent/skills/caol-review-implementation/SKILL.md`
