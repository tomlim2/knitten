---
description: "Structure and template for creating rules/*.md files (short enforcement constraints). Use when creating a new rule."
---

# caol-make-rule

Generator for `rules/*.md` — short must-follow constraints, one-liners.

## Purpose

Rules are terse directives that agents must honor. Rules are loaded through entry documents or invoked by cross-reference from standards.

Use this when:
- You have a clear "always X" or "never X" constraint.
- The constraint is short enough to fit on 1-5 bullets.
- The full rationale (if any) lives in a `standards/*.md` file that this rule links back to.

Do NOT use this when:
- The content needs explanation, examples, or alternatives → use `caol-make-standard` instead.
- The content is a one-off reminder for a specific task → put it in the relevant command/skill.

---

## Rule vs Standard

| | rules/ | standards/ |
|--|-------|-----------|
| Purpose | Enforce | Explain |
| Length | 1-10 bullets | Pages of prose |
| Loading | Always (via @import) | On-demand |
| Voice | Imperative ("NEVER", "ALWAYS") | Descriptive ("Here's how X works") |
| Examples | Rare, only inline | Required section |
| Links back | Yes, to a standard | No, is the source |

If in doubt: start as a rule. If it grows past 10 bullets, promote to a standard and leave a tight rule that links to it.

---

## Naming

File name: `{topic}.md` in `~/.claude/rules/`.

- Lowercase, hyphen-separated, short (1-3 words).
- Scope prefix if domain-specific: `cinev-*`.
- Examples: `git-defaults.md`, `author.md`, `cinev-git.md`, `shotloom.md`.

---

## File Template

```markdown
- **{Rule title}** — {one-line imperative, "ALWAYS X" or "NEVER X"}
- **{Rule title}** — {one-line imperative}
- **{Rule title}** — {one-line imperative}
- Full reference: @~/.claude/standards/{related}.md
```

Structural rules:
1. **Frontmatter required** — include `load: auto` or `load: triggered`; include `trigger:` when triggered.
2. **1-10 bullets** — if you need more, it's a standard, not a rule.
3. **Imperative voice** — "Always", "Never", "MUST", "NEVER". Declarative descriptions belong in standards.
4. **Link back** — final bullet should point to the standard that explains rationale (when one exists).
5. **No examples** — rules enforce, they don't teach. If an example is needed, it belongs in the linked standard.

---

## Workflow

1. Parse filename from `$ARGUMENTS`.
2. Check `~/.claude/rules/{name}.md` does not exist. Abort if it does.
3. Ask the user:
   - Short scope description (for `rules/index.md`)
   - The bullets themselves (or confirm the user will fill them in after)
   - Which index group: Core, Command Authoring, or Domain-specific
   - Which standard (if any) backs this rule
4. Write the file from the template.
5. Update `~/.claude/rules/index.md` — add a code-span row to the chosen group. Do not use Markdown links in the rules index.
6. If the rule has `load: auto`, add it to root `CLAUDE.md` imports and `agent/rules/index.md`.
7. Print the new path.

---

## After Creation

- Fill the bullets if not already.
- If this rule was extracted from an existing standard, add a cross-reference note to the standard's "Related" section (pointing to `rules/{name}.md`).
- If this rule belongs in every session, add an import to root `CLAUDE.md`:
  ```markdown
  @~/.claude/rules/{name}.md
  ```
- Commit: `feat: add rules/{name}.md — {topic}`.

---

## Related

- `caol-make-standard` — long reference docs
- `caol-make-skill` — reusable skills
- `caol-make-command` — slash commands
- `rules/index.md` — full index
- `standards/index.md` — reference docs rules link to
