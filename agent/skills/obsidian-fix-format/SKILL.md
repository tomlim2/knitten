---
description: Scan and fix common Obsidian markdown formatting glitches in the vault — frontmatter glued to headings (`---#`), missing blank lines, etc.
domains: obsidian
repo-keys: caol-ila
languages: markdown,yaml
task-types: authoring,implementation
context-profile: obsidian-vault
exclude-when: rust,web,unreal
name: obsidian-fix-format
---

# Obsidian Fix Format

Bundle of cleanup passes for the full Obsidian vault root (`obsidian` key in `machine-paths.json`).

## Skill-owned standards

Read `references/NOTE-INSPECTION-CHECKLIST.md` only when inspecting one note, planning a bulk note audit, or extending report-only checks.

## Vault path

Resolve with:

```bash
jq -r '."obsidian"' ~/.claude/private/caol-config/machine-paths.json
```

## Checks

| ID | Type | What it does |
|----|------|--------------|
| `frontmatter-heading-glued` | auto-fix | Splits `---#+ Heading` into two lines |
| `missing-h1` | report | Flags notes with no `# Title` in first 30 lines |
| `missing-readme` | report | Flags `agent/projects/*` folders without `README.md` |
| `empty-dirs` | auto-fix | Removes empty directories (skips `.trash`, `.obsidian`, `attachments`) |

Add new checks by appending a `want <name>` block to `fix.sh` and a row here.

## Run

```bash
bash ~/.claude/skills/obsidian-fix-format/fix.sh                        # full audit, dry run
bash ~/.claude/skills/obsidian-fix-format/fix.sh --apply                # apply auto-fix checks
bash ~/.claude/skills/obsidian-fix-format/fix.sh --check missing-h1     # single check
```

Report-only checks (`missing-h1`, `missing-readme`) never auto-rewrite — they need human review.

## When to invoke

- User says "옵시디언 정리", "vault cleanup", "fix obsidian formatting", or shows a glitch pattern in the vault.
- After a session that authored many notes, before commit.
