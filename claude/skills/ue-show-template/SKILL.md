---
description: "Pattern reference for creating UE Editor skills. Use when creating new Unreal Engine automation skills."
---

# ue-show-template

Pattern reference for creating UE Editor skills that follow the proven `ue-analyze-material` architecture.

## Purpose

This is not a runnable skill. It's a **pattern specification** that the `/ue-new-skill` command reads to generate new UE Editor skills with consistent architecture.

## Architecture: 3-Part Structure

```
skills/ue-{verb}-{noun}/
├── SKILL.md                      # Metadata + documentation
├── export_{noun}_data.py         # Runs inside UE Editor
└── run_in_editor.py              # Shared remote execution sender (copy verbatim)

commands/
└── unreal-{verb}-{noun}.md       # Claude Code command interface

~/.claude/private/unreal/
└── {noun}-{verb}/                # JSON output directory (auto-created)
```

**Flow:** User selects asset in Content Browser → Command triggers `run_in_editor.py` → UE Editor runs `export_{noun}_data.py` → JSON saved → Command reads JSON → Claude analyzes

## Placeholders

| Placeholder | Example | Rules |
|---|---|---|
| `{verb}` | `analyze` | Present tense, lowercase, kebab-case in paths |
| `{noun}` | `material` | Singular, lowercase |
| `{Noun}` | `Material` | Capitalized for display |
| `{ASSET_TYPES}` | `Material, MaterialInstanceConstant, MaterialFunction` | UE class names |
| `{SkillTag}` | `MaterialAnalyze` | PascalCase for `[log prefix]` |
| `{subdirectory}` | `material-analyze` | `{noun}-{verb}` for output dir |
| `{description}` | `Export and analyze UE material node graphs` | One line |

## Additional Resources

For UE Python script patterns, remote sender details, command patterns, SKILL.md template, creation checklist, and reference implementation, see [reference.md](reference.md).
