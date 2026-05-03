---
name: obsidian-fix-format
description: Scan and fix common Obsidian markdown formatting glitches in the vault — frontmatter glued to headings (`---#`), missing blank lines, etc.
---

# Obsidian Fix Format

Bundle of cleanup passes for the full Obsidian vault root (`obsidian` key in `machine-paths.json`).

## Vault path

Resolve with:

```bash
jq -r '."obsidian"' ~/.claude/private/caol-config/machine-paths.json
```

## Patterns fixed

| ID | Bad | Good |
|----|-----|------|
| `frontmatter-h1-glued` | `---# Heading` (frontmatter close + H1 on same line) | `---`<newline>`# Heading` |
| `frontmatter-h2-glued` | `---## Heading` | `---`<newline>`## Heading` |
| `frontmatter-hN-glued` | `---###...# Heading` | `---`<newline>`### Heading` |

Add new patterns to `fix.sh` and to this table when discovered.

## Run

```bash
bash ~/.claude/skills/obsidian-fix-format/fix.sh           # dry run, lists offenders
bash ~/.claude/skills/obsidian-fix-format/fix.sh --apply   # rewrite files in place
```

The script greps for each pattern, prints affected files, and (with `--apply`) rewrites them with `perl -i`.

## When to invoke

- User says "옵시디언 정리", "vault cleanup", "fix obsidian formatting", or shows a glitch pattern in the vault.
- After a session that authored many notes, before commit.
