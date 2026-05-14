---
load: triggered
trigger: creating a command or skill
---

# Authoring rules — naming, frontmatter, permissions

Applies to any new slash command or skill. Three concerns, single trigger.

## Naming

- **Internal skills/commands** — `{category}-{verb}-{subject}` (MANDATORY).
- **External wrappers** — `{category}-{repo}-{verb}-{subject}`; the `{repo}` token marks an upstream source hosted in `knitten/vendor/`.
- **Lowercase only** — no capitals, no camelCase, no underscores, no spaces.
- **Hyphens** as separators; multi-word subjects use hyphens (`creator-launcher`).
- **Max length** — see `~/.claude/config/taxonomy.json` key `maxArtifactNameChars`.
- **Categories** — see `~/.claude/config/taxonomy.json` key `skillCommandCategories`.
- **Be specific** — `tutoring-open-invoice`, not `open-invoice`.
- **Simple verbs** — `make` not `generate`, `add` not `append`.
- **Avoid redundancy** — `git-make-message`, not `git-make-commit-message`.

### External wrapper rules

- Repo token = upstream repo/package name, lowercase, hyphens preserved (`hyperframes`, `huashu-design`).
- **Abbreviation allowed when category and repo share a word** — `design` + `huashu-design` → `design-huashu-make-prototype` (drop trailing `-design`).
- Scoped packages drop the scope (`@heygen/hyperframes` → `hyperframes`).
- Wrapper body = frontmatter + single `@import <knitten-vendor-path>` + optional `when_to_use` block. No local logic in a wrapper — if logic is needed, make a separate non-wrapper skill.
- One wrapper per user-facing role, not one per vendor sub-skill. Exception: vendor ships orthogonal sub-skills with distinct roles (e.g. CLI vs authoring).

### Disambiguation

When multiple similar skills exist (e.g. many `design-*`), every `description` must carry a unique keyword. Wrappers should include a `when_to_use:` frontmatter field with `NO when:` negative conditions pointing to sibling skills.

Full rationale + examples: `~/.claude/skills/caol-make-command/SKILL.md`.

Naming for **rules / standards / plans / vault notes** (not commands/skills): `~/.claude/standards/policy/naming.md`.

## Frontmatter (commands)

- **Required:** `description`, `allowed-tools`.
- **Optional:** `argument-hint` (if the command takes arguments).
- **Field order:** `description` → `argument-hint` → `allowed-tools`.
- **Routing metadata** — domain-specific or repo-specific commands should add `context-profile` fields from `~/.claude/config/context-routing.json`.
- **Argument validation** — if the command accepts arguments, it MUST validate them. If no argument is given, show usage and ask. **NEVER auto-execute.**
- **Required sections:** frontmatter, H1 title, Arguments (if applicable), Workflow.

Full authoring guide: `~/.claude/skills/caol-make-command/references/SLASH-COMMANDS.md`.

## Permissions

- **NEVER use bare `Bash`** in `allowed-tools` — always specify patterns.
- **Pattern examples:** `Bash(git:*)`, `Bash(python:*)`, `Bash(npm:*)`, `Bash(open:*)`, `Bash(mv:*), Bash(ls:*)`.
- **Principle:** grant the minimum permission that lets the command work.

Full frontmatter reference: `~/.claude/skills/caol-make-command/references/SLASH-COMMANDS.md`.
