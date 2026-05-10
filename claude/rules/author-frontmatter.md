---
load: triggered
trigger: creating a command
---

- **Required fields:** `description`, `allowed-tools`
- **Optional fields:** `argument-hint` (if command accepts arguments)
- **Field order:** `description` → `argument-hint` → `allowed-tools`
- **Routing metadata:** domain-specific or repo-specific commands should add `context-profile` fields from `~/.claude/config/context-routing.json`
- **Argument validation** — If a command accepts arguments, it MUST validate them. If no argument is provided, show usage and ask the user. **NEVER auto-execute.**
- **Required sections:** Frontmatter, H1 title, Arguments (if applicable), Workflow
- Full authoring guide (Read on demand): `~/.claude/standards/authoring/slash-commands.md`
