# meta-private-guide

**Version:** 0.1.0

Complete guide to using the private/ folder for personal data storage in Claude Code.

---

## Changelog

- **0.1.0** - Initial release extracted from CLAUDE.md

---

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

---

## Accessing Private Data

### From Commands (Markdown)

**Pattern:** Use `!backtick` for dynamic execution

```markdown
## Read JSON Data

Load commit history:
!`cat ~/.claude/private/commits/anju_commits.json`

## List Files

Available materials:
!`ls ~/.claude/private/unreal/material-analyze/*.json`

## Check Existence

!`test -f ~/.claude/private/data.json && echo "exists" || echo "not found"`
```

### From Skills (Python)

**Pattern:** Use `pathlib.Path` for cross-platform paths

```python
#!/usr/bin/env python3
from pathlib import Path
import json

# Get private directory
PRIVATE_DIR = Path.home() / ".claude" / "private"

# Skill-specific subdirectory
COMMITS_DIR = PRIVATE_DIR / "commits"
COMMITS_DIR.mkdir(parents=True, exist_ok=True)

# Read file
commits_file = COMMITS_DIR / "repo_commits.json"
if commits_file.exists():
    with open(commits_file, 'r') as f:
        data = json.load(f)

# Write file
output_file = COMMITS_DIR / "new_data.json"
with open(output_file, 'w') as f:
    json.dump(data, f, indent=2)
```

### From Skills (Node.js)

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs');

// Get private directory
const PRIVATE_DIR = path.join(os.homedir(), '.claude', 'private');

// Skill-specific subdirectory
const invoicesDir = path.join(PRIVATE_DIR, 'tutoring', 'invoices');
fs.mkdirSync(invoicesDir, { recursive: true });

// Read file
const dataPath = path.join(PRIVATE_DIR, 'data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Write file
const outputPath = path.join(invoicesDir, 'invoice.json');
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
```

---

## Output Location Standards

### By Skill Category

**Git Skills (`git-*`):**
```
~/.claude/private/commits/
├── {repo-name}_commits.json
└── {repo-name}_stats.json
```

**UE Skills (`ue-*`):**
```
~/.claude/private/unreal/{noun}-{verb}/
├── asset1.json
└── asset2.json
```

Example: `ue-analyze-material` → `~/.claude/private/unreal/material-analyze/`

**Tutoring Skills (`tutoring-*`):**
```
~/.claude/private/tutoring/
├── invoices/
│   └── YYYY-MM_StudentName.pdf
├── lessons/
│   └── lessons.json
└── payments/
```

**Learning Skills (`learn-*`):**
```
~/.claude/private/learnings/
└── projects/
    ├── project1.md
    └── project2.md
```

**Drink Tracking (`drink-*`):**
```
~/.claude/private/drinks/
└── drinks.json
```

---

## File Naming Conventions

### JSON Files

**Pattern:** `{identifier}.json`
```
M_Material1.json      # UE material export
anju_commits.json     # Git commits
drinks.json           # Drink log
```

### PDF Files

**Pattern:** `YYYY-MM_{identifier}.pdf`
```
2026-01_Student1.pdf
2026-02_InvoiceReport.pdf
```

### Markdown Files

**Pattern:** `{topic}.md` or `{project}.md`
```
anju.md                          # Project learnings
unreal-optimization-ideas.md     # Research notes
```

### Timestamped Files

**Pattern:** `YYYY-MM-DD_{identifier}.ext`
```
2026-02-06_analysis.json
2026-02-06_backup.json
```

---

## Data Formats

### JSON (Structured Data)

**Use for:**
- Exported data from tools
- Structured logs
- Configuration that changes

**Structure:**
```json
{
  "version": "1.0",
  "generated": "2026-02-06T12:00:00Z",
  "data": {
    "items": []
  }
}
```

**Benefits:**
- Machine-readable
- Easy to parse
- Supports nested data
- Standard format

### Markdown (Documentation)

**Use for:**
- Notes and research
- Learning logs
- Documentation
- Human-readable content

**Structure:**
```markdown
# Title

## Section 1

Content...

## Section 2

Content...
```

### Plain Text (Logs)

**Use for:**
- Simple logs
- Line-by-line data
- Temporary output

---

## Best Practices

### 1. Create Directories Explicitly

**Python:**
```python
output_dir = PRIVATE_DIR / "skill-specific"
output_dir.mkdir(parents=True, exist_ok=True)
```

**Node.js:**
```javascript
fs.mkdirSync(outputDir, { recursive: true });
```

### 2. Use Skill-Specific Subdirectories

✅ **Good:**
```
~/.claude/private/unreal/material-analyze/
~/.claude/private/commits/
```

❌ **Bad:**
```
~/.claude/private/material1.json  # Too flat
~/.claude/private/data.json       # Too generic
```

### 3. Version Your Data Format

```json
{
  "version": "1.0",
  "format": "material-export",
  "data": {}
}
```

Allows migrations when format changes.

### 4. Add Timestamps

```json
{
  "generated": "2026-02-06T12:00:00Z",
  "last_modified": "2026-02-06T15:30:00Z"
}
```

Know when data was created/updated.

### 5. Handle Missing Files Gracefully

**Python:**
```python
if not data_file.exists():
    print(f"No data found at {data_file}")
    print("Run with --export first")
    sys.exit(1)
```

**Command:**
```markdown
!`test -f ~/.claude/private/data.json || echo "File not found. Please run /command --export first"`
```

### 6. Clean Up Old Data

Consider archiving:
```
private/
├── commits/
│   ├── current.json
│   └── archived/
│       └── 2025-12_old.json
```

### 7. Document Output Location

In SKILL.md:
```markdown
## Output

Data is saved to:
```
~/.claude/private/{skill-category}/{data-files}
```

Example: `~/.claude/private/unreal/material-analyze/M_Material1.json`
```

---

## Security Considerations

### What NOT to Store

1. **API Keys / Tokens** - Use environment variables
2. **Passwords** - Use password managers
3. **SSH Keys** - Keep in `~/.ssh/`
4. **Certificates** - Keep in system keychain
5. **Personal Identifiable Info** - Minimize storage

### Gitignore Protection

The `private/` folder is gitignored by default:

```gitignore
# .gitignore
claude/private/
```

**Verify:**
```bash
git status
# Should NOT show private/ files
```

### File Permissions

Sensitive files should have restricted permissions:
```bash
chmod 600 ~/.claude/private/tutoring/students.json
```

---

## Troubleshooting

### Issue: "Permission Denied"

**Cause:** File/directory has wrong permissions

**Fix:**
```bash
chmod 755 ~/.claude/private/
chmod 644 ~/.claude/private/file.json
```

### Issue: "File Not Found"

**Cause:** Directory doesn't exist yet

**Fix:** Create directory first
```python
output_dir.mkdir(parents=True, exist_ok=True)
```

### Issue: "Disk Space Low"

**Cause:** Too much cached data

**Fix:** Clean up old caches
```bash
rm -rf ~/.claude/private/cache/*
```

### Issue: "Can't Parse JSON"

**Cause:** Malformed JSON file

**Fix:** Validate JSON
```bash
python -m json.tool ~/.claude/private/file.json
```

---

## Migration Guide

### Moving Existing Data

If you have data in wrong location:

```bash
# Move to private
mv ~/old_location/*.json ~/.claude/private/category/

# Update references in commands/skills
# Edit files to point to new location
```

### Updating Output Paths

Update skills to use private/:
```python
# Old
output_file = Path.home() / "data.json"

# New
output_file = Path.home() / ".claude" / "private" / "category" / "data.json"
```

---

## Related Files

- `CLAUDE.md` - Main workflow guidance
- `skills/meta-new-skill/SKILL.md` - Skill creation (includes output location guidelines)
- `.gitignore` - Ensures private/ is not committed
