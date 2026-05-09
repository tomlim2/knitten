---
load: triggered
trigger: creating a command or skill
---

- **Pattern (internal skills)** — `{category}-{verb}-{subject}` for commands and skills that implement their own logic (MANDATORY)
- **Pattern (external wrappers)** — `{category}-{repo}-{verb}-{subject}` for wrappers that `@import` a third-party skill hosted in `knitten/vendor/`. The `{repo}` token marks the upstream source so picker disambiguation is instant.
- **Lowercase only** — No capitals, no camelCase, no underscores, no spaces
- **Hyphens as separators** — Multi-word subjects use hyphens (`creator-launcher`)
- **Max length** — use `~/.claude/config/taxonomy.json` key `maxArtifactNameChars`
- **Categories** — use `~/.claude/config/taxonomy.json` key `skillCommandCategories`
- **Be specific** — `tutoring-open-invoice` not just `open-invoice`
- **Keep verbs simple** — `make` not `generate`, `add` not `append`
- **Avoid redundancy** — `git-make-message` not `git-make-commit-message`
- **External wrapper: repo token rules**
  - Use the upstream repo or package name, lowercase, hyphens preserved (`hyperframes`, `huashu-design`)
  - **Abbreviation allowed when category and repo share a word** — `design` + `huashu-design` → `design-huashu-make-prototype` (drop trailing `-design`)
  - Scoped packages: drop the scope (`@heygen/hyperframes` → `hyperframes`)
  - Still max 64 chars
- **External wrapper: body rules**
  - Wrapper must contain only frontmatter + single `@import <knitten-vendor-path>` (plus optional `when_to_use` disambiguation)
  - No local logic inside a wrapper — if logic is needed, make it a separate non-wrapper skill
  - One wrapper per user-facing role, not one per vendor sub-skill (exception: vendor ships orthogonal sub-skills with distinct roles, e.g. CLI vs authoring)
- **Disambiguation** — when multiple similar skills exist (e.g. many `design-*`), every `description` must carry a unique keyword, and wrappers should include a `when_to_use:` frontmatter field with `NO when:` negative conditions pointing to sibling skills.
- Full rationale and examples (Read on demand): `~/.claude/skills/caol-make-command/SKILL.md`
- Naming for **rules / standards / plans / vault notes** (not commands/skills): `~/.claude/standards/policy/naming.md`
