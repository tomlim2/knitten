# caol-ila

This is my global Claude Code setup—where I keep commands, reusable scripts, and coding standards all in one place.

## What's Inside

### Commands
Slash commands that pop up in Claude Code's palette. These automate my most common workflows and make sure I'm doing things the right way every time.

### Skills
Python and shell scripts that do the heavy lifting. Commands call these when they need to actually execute something. You can also run them directly if you want.

### Standards
Coding conventions and technical guidelines, organized by what I'm working on. If I'm writing Unreal C++, I check the relevant standards. If I'm building UI, there's a design system to follow.

### Private
Where Claude stores personal stuff—commit histories for my portfolio, project notes, cached data. This folder's gitignored so nothing sensitive leaks out.

---

## Standards by Task Type

### Unreal C++ Development
If I'm writing Unreal Engine C++ code, I need to check **both** of these:

- **`unreal-engine.md`** - Naming conventions (PascalCase, U/A/F/E/I prefixes), brace style, loop variables
- **`code-review-cpp.md`** - Code quality checklist (memory management, UObject system, threading, performance, Blueprint integration, networking)

**Example**: Writing a new UActorComponent
1. Check `unreal-engine.md` for naming (prefix with `U`, use PascalCase)
2. Check `code-review-cpp.md` for UObject best practices (UPROPERTY, GENERATED_BODY, etc.)

### Python Scripting
- *(Coming soon: python-standards.md)*

### Git Workflow
- Mostly automated with `/commit-m` and `/collect-commits` commands
- *(Coming soon: git-standards.md for branch naming, PR conventions)*

### General C++ (Non-Unreal)
- **`code-review-cpp.md`** - Memory management, best practices, performance (just skip the Unreal-specific parts)

### GUI/UI Development
**MANDATORY**: Always check the design system before starting any GUI/UI work

- **`design-system.md`** - All UI tokens: colors, spacing, typography, components, states, icons, z-index, etc.
- **Core principles**: Brutalist B&W, minimal padding (8px 12px), border-radius = 0

**Example**: Writing a new button component
1. Read `design-system.md` (check version)
2. **Add version comment at top of file**: `// Design System: v1.0.0`
3. Reference Buttons section (2px border, 8px 12px padding, UPPERCASE)
4. Reference Component States (Default, Hover, Focus, Disabled)

**Version stamp** (required for first GUI work):
```tsx
// Design System: v1.0.0
```

**Version sync**: Use `/design-sync` to verify your work matches the design system version

---

## Quick Reference

### Commands I Use
- **`/commit-m`** - Write commit messages for me based on what's staged
- **`/clean-up`** - Update the project's CLAUDE.md after analyzing the codebase
- **`/collect-commits`** - Pull git history for portfolio work
- **`/open-invoice`** - Launch the invoice generator web app
- **`/move-invoice <student_name>`** - Move the latest PDF from Downloads to my tutoring invoices folder
- **`/design-sync [version]`** - Check design system version and sync my work with it

### Skills Available
- **`git-commit-collector`** - Extracts and analyzes git commit history
- **`invoice-generator`** - Web app for generating tuition invoices

---

## Directory Structure

```
caol-ila/
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── claude/              # Claude Code configuration (symlinked to ~/.claude)
│   ├── CLAUDE.md        # System documentation (read this for details)
│   ├── commands/        # Slash commands for workflow automation
│   │   ├── commit-m.md
│   │   ├── clean-up.md
│   │   ├── collect-commits.md
│   │   ├── open-invoice.md
│   │   ├── move-invoice.md
│   │   └── design-sync.md
│   ├── skills/          # Reusable utilities (scripts, tools)
│   │   └── git-commit-collector/
│   └── standards/       # Technical standards and conventions
│       ├── unreal-engine.md
│       ├── code-review-cpp.md
│       └── design-system.md
└── private/             # Personal data (gitignored)
    ├── commits/
    ├── notes/
    ├── cache/
    └── tutoring/
        ├── presets.json
        └── invoices/
```

---

For more details on creating commands, writing skills, and extending this system, check out **[CLAUDE.md](claude/CLAUDE.md)**.
