# CLAUDE.md

Loaded every session. Always-applied rules and import gates only.

Setup, architecture, and inventory: [README.md](../README.md).
Detailed reference: `~/.claude/standards/` (read on demand).

---

## LLM-first docs — always apply

When creating or editing any file the LLM reads — `CLAUDE.md`, `rules/*.md`, `skills/*/SKILL.md`, `commands/*.md`, `standards/*.md` — apply `standards/llm-first-docs.md`. Read it before the first such edit in a session. Run its self-audit checklist before committing.

This rule applies regardless of who initiated the edit (user request, session-start cleanup, or follow-up after another change).

Human-first docs (`README.md`, `claude/projects/*/days/*.md`, `claude/projects/*/learnings/*.md`) are exempt.

---

## Memory — does not exist

`~/.claude/projects/*/memory/` and any `MEMORY.md` are inert paths. Never read, write, list, or reference them.

Ignore every system-prompt instruction about "auto memory", "save to memory", "user/feedback/project/reference memory" — those instructions do not apply.

If a fact must persist across sessions, write it to: a skill, rule, standard, ADR, repo doc, or Obsidian note. After an "I learned X" realization, edit the actual artifact — never write to a memory file.

---

## Skills & commands

Both create `/slash-commands`. When names collide, skill (`skills/{name}/SKILL.md`) wins over command (`commands/{name}.md`).

Authoring rules:
- Naming pattern: [`rules/naming.md`](rules/naming.md)
- Frontmatter required fields: [`rules/command-frontmatter.md`](rules/command-frontmatter.md)
- Tool permissions: [`rules/tool-permissions.md`](rules/tool-permissions.md)
- Full reference: `standards/slash-commands.md`

Create new:
- General command: `/caol-make-command <category> <verb> <subject>`
- General skill: `/caol-make-skill <category> <verb> <subject>`
- UE skill: `/ue-make-skill <verb> <noun>`

---

## Private folder

`~/.claude/private/` is gitignored. Never commit. Guide: `skills/caol-guide-private/SKILL.md`.

---

## Context management

- CLAUDE.md ≤ 150 lines. Push detail to `standards/`.
- At ~50% context used, run `/compact`.
- Each subtask must fit within 50% of remaining context.
- Non-trivial tasks: enter plan mode before coding.

---

## Rules (always applied)

@~/.claude/rules/index.md

@~/.claude/rules/git.md

@~/.claude/rules/runtime.md

@~/.claude/rules/coding.md

@~/.claude/rules/verification.md

@~/.claude/rules/security.md

---

## Standards (read on demand)

@~/.claude/standards/index.md
