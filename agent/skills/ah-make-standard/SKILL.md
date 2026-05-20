---
description: "Structure and template for creating agent-hub standards (long reference docs). Use when creating a new standard."
---

# ah-make-standard

Generator for `standards/*.md` — long-form reference docs read on-demand.

## Purpose

Standards contain detailed rationale, templates, and domain guides. They are NOT auto-loaded; they live in `agent/standards/` and are read when a specific task calls for them.

This skill defines the structure so every standard looks consistent and gets registered in `standards/index.md`.

Use this when:
- You discover a pattern worth documenting at length (domain guide, review template, spec format, workflow).
- You want to consolidate scattered knowledge into one reference a future session can consult.
- You have rationale + examples that are too long to live in a `rules/` file.

Do NOT use this when:
- The content is a short, must-follow constraint → use `ah-make-rule` instead.
- The content is a reusable tool/script → use `ah-make-skill` instead.
- The content is a reusable output body: use `ah-manage-document-template`
  instead.
- The content is a long example catalog: route it to the owning skill reference,
  owning command reference, or future pack blocker row.

---

## Extraction Intake

Use this skill when thin-skill reduction extracts durable criteria from a skill.

| Extracted content | Standard role |
|-------------------|---------------|
| cross-skill decision criteria | canonical rule table |
| judgment rubric | review or authoring rubric |
| naming policy | accepted names and rejected names |
| lifecycle policy | state machine, gates, and transitions |
| path or enum contract | policy owner paired with validator |

Before writing the standard, scan for existing owners:

```bash
rg -n "<topic>|<key terms>" agent/standards agent/rules agent/skills agent/document-templates
```

If an existing standard owns the rule, update it. If the extracted content is a
template body, route to `ah-manage-document-template`. If it is a workflow,
route to `ah-make-skill`.

Source contract: `thin-skill-guide-boundary` entry in `docs/milestones/agent-artifact-pack-system.md`.

---

## Naming

File name: `{topic}.md` in `agent/standards/<group>/`.

- Lowercase, hyphen-separated.
- Scope prefix if domain-specific: `cinev-*`, `review-code-*`, `review-ux-*`, `unreal-engine-*`.
- Avoid generic names like `guide.md`, `notes.md`, `rules.md`. Be specific.

---

## File Template

```markdown
---
status: proposed
domains: {route-domain}
repo-keys: {repo-key}
languages: {language}
task-types: {task-type}
context-profile: {context-profile}
exclude-when: {unrelated-route-domains}
---

# {Title}

{One-line purpose — what this document is for.}

---

## Scope

{When to read. What tasks or decisions should consult this. Who it applies to.}

---

## {Main Section 1}

{Content — guidelines, patterns, rationale.}

---

## {Main Section 2}

{Content.}

---

## Examples

{Concrete examples, templates, before/after.}

---

## Related

- `rules/{name}.md` — short enforcement rules (if any extracted)
- `standards/{sibling}.md` — related reference
```

Structural rules:
1. **H1 singular** — exactly one `#` title at the top.
2. **Section separators** — `---` between major sections.
3. **Scope section** — mandatory. Tells future reader when this applies.
4. **Examples section** — mandatory unless the doc IS an example (like a template file).
5. **Related section** — always present, even if empty, so cross-links get added over time.
6. **Routing metadata** — use `agent/config/context-routing.json` for `domains`, `repo-keys`, `languages`, `frameworks` when relevant, `task-types`, `context-profile`, and `exclude-when`. Omit optional axes when absent.

---

## Workflow

1. Parse filename from `$ARGUMENTS` (single token, lowercase, hyphens).
2. Classify the requested content with Extraction Intake.
3. Check `agent/standards/<group>/{name}.md` does not already exist. Abort if it does.
4. Ask the user:
   - One-line purpose
   - Which `standards/index.md` group it belongs to (Command Authoring, Multi-Agent, Research, Web, UE, Review, CINEV, Docs/System, or new group)
   - When-to-read hint for the index table
   - Which context profile applies, or why this standard needs a `metadataExemptions` entry
5. Write the file from the template, filling in `{Title}` and `{One-line purpose}`.
6. Update `agent/standards/index.md` — add a row to the chosen group.
7. Run `node scripts/validate-llm-first.mjs --check context-routing`.
8. Print the new path and remind the user to fill in the sections.

---

## After Creation

- Fill the Scope, main sections, and Examples with real content.
- If any bullet in the new standard is a hard must-follow rule, promote it to `agent/rules/` via `ah-make-rule`.
- Commit: `feat: add standards/{name}.md — {topic}`.

---

## Related

- `ah-manage-artifact` — CRUD router for shared artifacts
- `ah-make-rule` — short enforcement rules (one-liners)
- `ah-make-skill` — reusable skills
- `ah-make-command` — slash commands
- `standards/index.md` — full index
