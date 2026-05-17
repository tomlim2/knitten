---
description: Scan and fix common Obsidian markdown formatting glitches in the vault — frontmatter glued to headings (`---#`), missing blank lines, etc.
domains: obsidian
repo-keys: agent-hub
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
jq -r '."obsidian"' ~/.claude/private/agent-hub-config/machine-paths.json
```

## Checks

| ID | Type | What it does |
|----|------|--------------|
| `frontmatter-heading-glued` | auto-fix | Splits `---#+ Heading` into two lines |
| `missing-h1` | report | Flags notes with no `# Title` in first 30 lines |
| `missing-readme` | report | Flags project roots and durable folders without `README.md` |
| `project-structure` | report | Flags project root files that should live in role folders, legacy hubs, and backup files |
| `root-structure` | report | Flags root folders outside configured vault structure |
| `daily-structure` | report | Flags daily notes outside the configured date naming contract |
| `path-config-drift` | report | Flags active repo files that still embed retired vault paths |
| `obsidian-contract` | report | Audits agent notes against frontmatter, tag, H1, link, source, filename, and README policy |
| `empty-dirs` | auto-fix | Removes empty directories (skips `.trash`, `.obsidian`, `attachments`) |

Add new checks by appending a `want <name>` block to `fix.sh` and a row here.

## Run

```bash
bash ~/.claude/skills/obsidian-fix-format/fix.sh                        # full audit, dry run
bash ~/.claude/skills/obsidian-fix-format/fix.sh --apply                # apply auto-fix checks
bash ~/.claude/skills/obsidian-fix-format/fix.sh --check missing-h1     # single check
bash ~/.claude/skills/obsidian-fix-format/fix.sh --check project-structure
bash ~/.claude/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Report-only checks (`missing-h1`, `missing-readme`, `project-structure`, `obsidian-contract`) never auto-rewrite — they need human review or a separate approved migration pass.

## When to invoke

- User says "옵시디언 정리", "vault cleanup", "fix obsidian formatting", or shows a glitch pattern in the vault.
- After a session that authored many notes, before commit.
