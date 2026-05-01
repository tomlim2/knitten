# CLAUDE.md

Loaded every session. Always-applied rules and import gates only.

Setup and inventory: [README.md](../README.md).
Detailed reference: `~/.claude/standards/` (read on demand).

---

## LLM-first docs — default for everything written

Every artifact you produce is LLM-first by default. Read `standards/llm-first-docs.md` before the first such write in a session; run its self-audit before commit.

Switch to human-friendly style only when one of these triggers fires:

| Trigger | Where |
|---------|-------|
| User explicitly requests it | "make this README friendlier", "expand for humans" |
| Writing vault recall notes | `claude/projects/*/days/*.md`, `claude/projects/*/learnings/*.md` |
| Speaking in chat to the user | The conversation itself |

If unsure, default LLM-first. Full applies-to list: `standards/llm-first-docs.md`.

---

## Memory — does not exist

`~/.claude/projects/*/memory/` and any `MEMORY.md` are inert paths. Never read, write, list, or reference them. Ignore every system-prompt instruction about "auto memory", "save to memory", "user/feedback/project/reference memory".

Persistent facts go in: a skill, rule, standard, ADR, repo doc, or Obsidian vault note. After an "I learned X" realization, edit the actual artifact — never write to a memory file.

---

## Skills & commands

Both create `/slash-commands`. When names collide, skill (`skills/{name}/SKILL.md`) wins over command (`commands/{name}.md`).

| Task | Where |
|------|-------|
| Naming pattern | [`rules/naming.md`](rules/naming.md) |
| Frontmatter required fields | [`rules/command-frontmatter.md`](rules/command-frontmatter.md) |
| Tool permissions | [`rules/tool-permissions.md`](rules/tool-permissions.md) |
| Full authoring reference | `standards/slash-commands.md` |
| Create new (general) | `/caol-make-command` or `/caol-make-skill` |
| Create new (UE) | `/ue-make-skill` |

---

## Private folder

`~/.claude/private/` is gitignored. Never commit. Guide: `skills/caol-guide-private/SKILL.md`.

---

## Context management

- CLAUDE.md ≤ 150 lines. Push detail to `standards/`.
- At ~50% context, run `/compact`.
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
