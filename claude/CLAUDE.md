# CLAUDE.md

Loaded every session. Always-applied rules and import gates only.

Setup and inventory: [README.md](../README.md).
Goal-to-doc lookup ("where is X?"): [LOOKUP.md](../LOOKUP.md).
Detailed reference: `~/.claude/standards/` (read on demand).

---

## Repository charter

`caol-ila` is an **agent-first repository** — the primary operator is an autonomous agent, not a human reader. Because that agent is currently an LLM, the operational mechanics are **LLM-first**: every process, artifact, and decision optimizes for the LLM that reads, executes, and edits it:

1. **Efficiency** — minimum tokens for maximum signal.
2. **Accuracy** — explicit, unambiguous, no hidden assumptions.
3. **Clarity** — decision trees over prose, tables over paragraphs, paired examples over description.

The user is the architect; the LLM is the primary reader and operator. Human-readable output is delivered only on explicit user request.

When choosing between two ways to write or organize anything in this repo, ask: **"would a cold-start LLM session parse this correctly in the fewest tokens?"** If not, restructure. Operational rules below (`standards/policy/llm-first-docs.md`) translate this charter into per-document checks. The full layered enforcement model — which layer owns which constraint, how conflicts resolve — is in `standards/policy/agent-first-policy.md`; read before designing a new layer.

---

## LLM-first docs — default for everything written

Every artifact you produce is LLM-first by default. Read `standards/policy/llm-first-docs.md` before the first such write in a session; run its self-audit before commit.

Switch to human-friendly style only when one of these triggers fires:

| Trigger | Where |
|---------|-------|
| User explicitly requests it | "make this README friendlier", "expand for humans" |
| Speaking in chat to the user | The conversation itself |

**Vault notes are NOT a blanket exception.** Even `days/` and `learnings/` follow the structured-narrative variant of LLM-first (frontmatter, headers, tables, bold takeaway). Narrative is allowed *inside* sections, never as a replacement for structure. See `standards/obsidian/vault-audience.md` for the per-folder audience matrix.

If unsure, default LLM-first. Full applies-to list: `standards/policy/llm-first-docs.md`.

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
| Full authoring reference | `standards/authoring/slash-commands.md` |
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

@~/.claude/rules/session-start.md

@~/.claude/rules/coding.md

@~/.claude/rules/verify-before-report.md

@~/.claude/rules/security.md

---

## Standards (read on demand)

@~/.claude/standards/index.md
