---
status: accepted
domains: obsidian
repo-keys: agent-hub
languages: markdown
task-types: authoring
context-profile: obsidian-vault
exclude-when: rust,web,unreal
---

# Vault Audience & Style Policy

Every Obsidian vault file declares its primary audience. Audience determines style. This standard supersedes the broad "vault notes are human-friendly" exception in older versions of `CLAUDE.md`.

**Default for all vault files: LLM-first format.** Narrative is allowed only as an additive layer on top of structure, not as a replacement for it. The user reading their own devlog three months later is also a cold-start reader — structure helps them too.

---

## Audience matrix

Folder location declares audience. No frontmatter switch needed.

Project folder roles are owned by `PROJECT-DOCS-STRUCTURE.md`. This file owns audience, style, mutability, and README requirements for those folders.

| Folder | Primary audience | Style policy |
|--------|------------------|--------------|
| `days/` | Human (author's self-recall) | Structured-narrative (see below) |
| `learnings/` | Human (author's self-recall) | Structured-narrative |
| `topics/` | LLM + human reader | Strict LLM-first |
| `specs/` | LLM + human implementer | Strict LLM-first |
| `decisions/` | LLM (cold-start "why X?") | Strict LLM-first |
| `plans/` | LLM (next-session handoff) | Strict LLM-first |
| `asks/` | LLM (sub-agent dispatch) | Strict LLM-first |
| `ops/missions/<mission>/` | LLM (cross-session mission) | Strict LLM-first |
| `ops/runs/` | LLM (ephemeral, single-use) | LLM-first preferred, not enforced |

For folders not in this table: default to **strict LLM-first** unless the folder declares otherwise via its `README.md` (see below).

---

## Style: strict LLM-first

Same rules as `standards/policy/llm-first-docs.md`. Summary:

- Frontmatter required (`title`, `tags`, `date`, `source`).
- H1 required, exactly one, immediately after frontmatter.
- Hard rules at the top, reference at the bottom.
- Tables over prose. Decision-trees over branching paragraphs.
- No banned terms (`etc.`, `…`, `consider `, `usually `, `typically `, `should probably`, `might want `).
- No motivation paragraphs, no rhetorical hedges.
- Each sentence interpretable in isolation.

The validator does NOT scan the vault, so this is policy-enforced by author discipline, not mechanically enforced. Same standard applies.

---

## Style: structured-narrative

For `days/` and `learnings/` only. The reader is the author themselves, recalling work or extracting a lesson. The aim is fast skim + emotional anchor.

**Structure (LLM-first, mandatory):**

- Frontmatter required.
- H1 required.
- Section headers (`##`) for major beats.
- Tables / lists when content is enumerable.
- Bold on the actionable claim of each section.

**Narrative (allowed inside any section):**

- Short story passages for context (`이 버그는 사실 어제부터…`).
- Analogies, metaphors, jokes.
- Emotional notes ("이거 진짜 힘들었음").
- Reactions to other people's code, decisions, conversations.

**Forbidden even in structured-narrative:**

- Walls of prose with no headers.
- Trailing-dots hedges (`와…`, `음…`) or banned-term-class softeners in the structured layer (the rule, the lesson). Narrative passages may quote them as feeling, but the takeaway sentence stays decisive.
- Chronological rambling without a takeaway. Every section must end with one bold actionable line or one explicit non-action ("결론: 일단 보류").

**Why structure even for the author:** Three-month-later you is a cold-start reader. You will not re-read paragraphs to extract the lesson. Make the lesson scannable now.

---

## Per-folder README

New durable vault folders MUST contain a `README.md` declaring audience, style, mutability, and naming.

README required for:

| Folder type | Required? |
|-------------|-----------|
| new project root under configured project folder | yes |
| durable folders: `specs/`, `plans/`, `topics/`, `decisions/`, `ops/missions/` | yes |
| repeated entry folders: `days/`, `learnings/` | no, parent README covers them |
| ephemeral folders: `ops/runs/` | no, unless promoted to durable |

```markdown
---
title: "<folder> — audience"
tags:
  - type/reference
  - project/<name>
---

# <folder>/

**Audience:** LLM | Human | LLM + human
**Style:** strict LLM-first | structured-narrative
**Mutability:** durable | ephemeral
**Naming:** <slug pattern>

<one-paragraph description of what lives here and what does not>
```

This is read by the cold-start LLM the first time it touches the folder. The README is the authoritative scope statement; if a file in the folder doesn't fit, the file is wrong, not the README.

---

## Mutability axis

Orthogonal to audience. Some folders mix mutability across files; the README must declare the policy.

| Mutability | Meaning | Examples |
|-----------|---------|----------|
| `durable` | Frozen-on-write, additive only | `decisions/` (ADR), `ops/missions/*-mr.md` (mission records) |
| `mutable` | Edited freely, no version log | `specs/` (forward design), `topics/` |
| `append-only` | New entries appended; old entries not edited | `days/`, `ops/missions/*-log.md` |
| `ephemeral` | Safe to delete after the run | `ops/runs/` |

When a folder mixes mutability, split it. (See `docs/plans/completed/split-vault-folders.md` for the shotloom case.)

---

## Frontmatter `audience:` (optional override)

When a single file's audience differs from its folder, declare it in frontmatter:

```yaml
audience: human
```

Allowed values: `llm`, `human`, `llm+human`. If absent, the folder's README declaration wins. Use sparingly — most files should match their folder, and a frequent override means the folder is wrong-shaped.

---

## Anti-goals

- Do not write a vault file in pure narrative because "it's just for me." Three-month-later you is a different reader.
- Do not auto-loosen the LLM-first format because the file lives in the vault. The vault gate exists for narrative *additions*, not structural *removals*.
- Do not introduce a new vault folder without a README declaring its audience, style, and mutability.
- Do not let `ops/runs/` leak into `ops/missions/`. Ephemeral content rots durable records.
