---
description: "Route legacy command authoring requests away from agent-hub commands and into skills, standards, templates, or references."
---

# ah-make-command

Legacy command authoring router. Shared `agent/commands/` creation is
forbidden.

## Skill-owned standards

Read these references only when needed:

- `references/SLASH-COMMANDS.md` — command frontmatter, permissions, argument guards, templates, and execution patterns
- `references/COMMAND-SKILL-REFERENCE.md` — detailed command and skill examples

## Purpose

This skill redirects command requests to durable artifact owners. Commands are
migration sources, not a durable shared artifact class.

---

## Command Creation Gate

Do not create new files under `agent/commands/`.

Before changing legacy command behavior, run:

```bash
rg -n "<slug>|<route words>|<subject>" agent/commands agent/skills agent/standards agent/document-templates
```

| Existing owner | Action |
|----------------|--------|
| same command | retire, absorb, or delete that command through `command-retirement-plan` |
| same skill | update the skill or skill-local reference |
| router skill | update the router instead of adding a parallel command |
| standard | update the standard; do not duplicate policy |
| document template | update the template; do not embed the body elsewhere |

Route requested content:

| Requested content | Route |
|-------------------|-------|
| task workflow | `ah-make-skill` |
| cross-skill criteria or policy | `ah-make-standard` |
| reusable output body | `ah-manage-document-template` |
| long examples | owning skill `references/` file |
| exact allowed values or path contract | standard plus validator |
| slash-command compatibility | external harness adapter or pack-local compatibility, not shared `agent/commands/` |

Source contracts:

- `docs/plans/active/command-retirement-plan.md`
- `docs/plans/active/thin-skill-guide-boundary.md`

---

## Naming Convention

**MANDATORY: All commands and skills MUST follow this pattern.**

```
{category}-{verb}-{subject}
```

### Pattern Structure

Each name consists of three parts separated by hyphens:

1. **`category`**: Domain or project namespace
   - Lowercase, single word
   - Groups related functionality
   - Examples: `git`, `tutoring`, `cci`, `ue`, `learn`, `ah`

2. **`verb`**: Action performed
   - Present tense, active voice
   - Describes what the command does
   - Examples: `make`, `collect`, `open`, `add`, `move`, `analyze`, `validate`, `create`, `new`

3. **`subject`**: Target object or resource
   - Noun or noun phrase (use hyphen for multi-word)
   - What the verb acts upon
   - Examples: `message`, `commits`, `invoice`, `log`, `material`, `creator-launcher`, `command`, `skill`

---

## Naming Rules

1. **Always use lowercase** - No capitals, no camelCase
2. **Use hyphens as separators** - Never underscores or spaces
3. **Be specific** - `tutoring-open-invoice` not just `open-invoice`
4. **Be consistent** - Same category for related commands
5. **Keep verbs simple** - `make` not `generate`, `add` not `append`
6. **Avoid redundancy** - `git-make-message` not `git-make-commit-message`
7. **Multi-word subjects** - Use hyphens: `creator-launcher`, `asset-name`

---

## Category Registry

Canonical command and skill categories live in `agent/config/taxonomy.json` under `skillCommandCategories`.

When authoring a command or skill:

1. Extract the category prefix before the first hyphen.
2. Reuse an existing prefix from `skillCommandCategories`.
3. If a new prefix is required, patch `taxonomy.json` in the same change and keep the array sorted.
4. Run `node scripts/validate-llm-first.mjs --check taxonomy` from the agent-hub repo root.

---

## Frontmatter Quick Reference

**Core field order for legacy command inspection only:** `description` → `argument-hint` → `allowed-tools`

**NEVER use bare `Bash`** — Always use specific patterns: `Bash(git:*)`, `Bash(python:*)`, and similar.

**Routing metadata:** if the command is repo-specific, domain-specific, or likely to pull high-cost context, add routing fields from `agent/config/context-routing.json`: `domains`, `repo-keys`, `languages`, `frameworks` when relevant, `task-types`, `context-profile`, and `exclude-when`.

**Advanced fields** (see `references/SLASH-COMMANDS.md` "Frontmatter Reference (Full)" for the full table):

- `name` — overrides directory/file-derived slash-name
- `when_to_use` — extra trigger phrases, appended to description in the listing
- `disable-model-invocation: true` — user-only, model cannot auto-invoke (deploys, commits)
- `user-invocable: false` — hidden from `/` menu (background knowledge)
- `context: fork` + `agent: Explore|Plan|general-purpose|<custom>` — run in isolated subagent
- `paths: [glob, …]` — restrict auto-activation to matching files (monorepos)
- `effort: low|medium|high|xhigh|max` — per-skill effort override
- `shell: bash|powershell` — `` !`command` `` interpreter
- `model` — per-skill model override
- `hooks` — per-skill lifecycle automation

**Skill vs command precedence:** If `skills/foo/SKILL.md` and `commands/foo.md` both exist, the skill wins.

**String substitutions:** `$ARGUMENTS`, `$ARGUMENTS[N]`, `$0`/`$1`, `${CLAUDE_SESSION_ID}`, `${CLAUDE_SKILL_DIR}`. See standard for examples.

**Dynamic shell injection:** Inline `` !`command` `` or fenced ` ```! ` block — executed before the agent sees the content.

---

## Common Mistakes

| Wrong | Why | Correct |
|-------|-----|---------|
| `open-invoice` | Missing category | `tutoring-open-invoice` |
| `TutoringInvoice` | Uses camelCase | `tutoring-open-invoice` |
| `tutoring_open_invoice` | Uses underscores | `tutoring-open-invoice` |
| `git-commit-message` | Missing verb | `git-make-message` |
| `Bash` in allowed-tools | Not specific | `Bash(git:*)` |

---

## Special Case: Unreal Engine

For `ue-*` requests, create or update UE skills only. Do not create matching
commands.

## Routing Workflow

1. Pass the Command Creation Gate.
2. Read `agent/config/context-routing.json`.
3. If the target artifact matches an existing context profile, add the routing frontmatter fields.
4. If no profile fits but the artifact is high-cost or domain-specific, stop and add the profile or an explicit `metadataExemptions` entry in the same change.
5. Run `node scripts/validate-llm-first.mjs --check context-routing` from the agent-hub repo root.

---

## Related Files

- `skills/ah-manage-artifact/SKILL.md` - CRUD router for shared artifacts
- `skills/ah-make-skill/SKILL.md` - Skill structure rules (use for creating skills)
- `docs/plans/active/command-retirement-plan.md` - command layer removal plan

## Additional Resources

For the full examples table, file structure specs, creation workflows, and rationale, see [reference.md](reference.md).
