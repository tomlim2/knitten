---
description: "Naming rules and templates for creating Claude Code commands and skills. Use when creating new commands or skills."
---

# caol-make-command

Command and skill creation generator for Claude Code with comprehensive naming rules.

## Purpose

This skill helps create new Claude Code commands and skills following the standardized naming convention and structure. It serves as the authoritative rulebook for command/skill creation.

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
   - Examples: `git`, `tutoring`, `cci`, `ue`, `learn`, `caol`

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

## Standard Categories

| Category | Domain | Examples |
|----------|--------|---------|
| `cci-*` | CINEV project tools | `cci-open-creator-launcher`, `cci-review-cpp` |
| `ue-*` | Unreal Engine tools | `ue-analyze-material`, `ue-validate-asset-name` |
| `git-*` | Git operations | `git-collect-commits`, `git-make-message` |
| `tutoring-*` | Tutoring business | `tutoring-open-invoice`, `tutoring-log-lesson` |
| `learn-*` | Learning/docs | `learn-add-log` |
| `drink-*` | Drink tracking | `drink-log-entry` |
| `caol-*` | caol-ila infra / meta tools | `caol-make-command`, `caol-make-skill` |
| `review-*` | Code/skill reviews | `review-audit-web` |

---

## Frontmatter Quick Reference

**Field order:** `description` → `argument-hint` → `allowed-tools`

**NEVER use bare `Bash`** — Always use specific patterns: `Bash(git:*)`, `Bash(python:*)`, etc.

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

For `ue-*` commands, use `/ue-make-skill <verb> <noun>` which creates both the skill AND command automatically.

---

## Related Files

- `commands/caol-make-command.md` - Command wrapper for this skill
- `skills/caol-make-skill/SKILL.md` - Skill structure rules (use for creating skills)
- `commands/ue-make-skill.md` - UE-specific skill/command generator

## Additional Resources

For the full examples table, file structure specs, creation workflows, and rationale, see [reference.md](reference.md).
