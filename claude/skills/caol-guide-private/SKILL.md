---
description: "Guide to using private/ folder for personal data storage. Use when storing or accessing personal data in Claude Code."
---

# meta-guide-private

Complete guide to using the private/ folder for personal data storage in Claude Code.

## Purpose

The `private/` directory is your **personal data vault** for Claude Code. This guide explains what belongs in private/, how to structure it, and how to access it from commands and skills.

---

## Core Concept

```
~/.claude/private/  ← gitignored, never committed
```

**Philosophy:** Any personal information Claude collects—commits for your portfolio, project-specific notes, cached data—lives here and only here. Private is gitignored by default. Treat it as sacred.

---

## What Goes in Private?

### ✅ Yes - Store Here

**Extracted Data:**
- Git commit histories for portfolio
- UE asset export data (materials, meshes, blueprints)
- Code analysis results
- Generated reports

**Personal Content:**
- Project-specific notes and research
- Learning logs and gotchas
- TODO lists and project plans
- Meeting notes

**Cached Data:**
- API responses (expensive to re-fetch)
- Processed datasets
- Temporary computation results

**Business Data:**
- Tutoring invoices and lesson logs
- Client information
- Personal tracking data (drinks, expenses, etc.)

### ❌ No - Store Elsewhere

**Source Code:**
- Belongs in project repositories
- Use version control (git)
- Not in ~/.claude/private/

**Shared Configuration:**
- Commands → `~/.claude/commands/`
- Skills → `~/.claude/skills/`
- Standards → `~/.claude/standards/`

**Secrets:**
- API keys → Environment variables
- Passwords → Password managers
- Credentials → System keychain
- **NEVER** store secrets in private/ or any file

---

## Directory Structure

### Recommended Organization

```
private/
├── commits/              # Git history extractions
│   ├── anju_commits.json
│   ├── project2_commits.json
│   └── archived/
├── unreal/               # UE asset data
│   ├── material-analyze/
│   │   ├── M_Material1.json
│   │   └── M_Material2.json
│   ├── asset-validate/
│   └── mesh-analyze/
├── tutoring/             # Tutoring business
│   ├── invoices/
│   │   ├── 2026-01_Student1.pdf
│   │   └── 2026-02_Student1.pdf
│   ├── lessons/
│   └── students/
├── learnings/            # Project learnings
│   ├── projects/
│   │   ├── anju.md
│   │   └── project2.md
│   └── _template.md
├── drinks/               # Personal tracking
│   └── drinks.json
├── notes/                # General notes
│   ├── unreal-optimization-ideas.md
│   ├── design-patterns.md
│   └── research/
└── cache/                # Temporary data
    ├── texture-analysis.json
    └── web-scrape-data.json
```

### Category-Based Organization

**By skill/command category:**
- `commits/` → git-*  commands/skills
- `unreal/` → ue-* commands/skills
- `tutoring/` → tutoring-* commands/skills
- `learnings/` → learn-* commands/skills
- `drinks/` → drink-* commands/skills

**By data type:**
- JSON files for structured data
- Markdown for documentation/notes
- PDF for generated documents
- Subdirectories for related items

## Additional Resources

For code examples, output location standards, file naming conventions, best practices, security, and troubleshooting, see [reference.md](reference.md).
