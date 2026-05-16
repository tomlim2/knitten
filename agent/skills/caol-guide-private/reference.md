# meta-private-guide Reference

Detailed patterns, code examples, and guidelines for using the private/ folder.

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

Example: `ue-analyze-material` -> `~/.claude/private/unreal/material-analyze/`

**Tutoring Skills (`tutoring-*`):**
```
!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc tutoring`
├── invoices/
│   └── YYYY-MM_StudentName.pdf
├── presets.json
└── lessons/
    └── <student>/
```

**Learning Skills (`learn-*`):**
```
Obsidian configured cross-learning destination
└── projects/
    ├── project1.md
    └── project2.md
```

**Drink Tracking (`drink-*`):**
```
!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc drinks`
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

### Markdown (Documentation)

**Use for:**
- Notes and research
- Learning logs
- Documentation
- Human-readable content

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

Good: `~/.claude/private/unreal/material-analyze/`
Bad: `~/.claude/private/material1.json` (too flat)

### 3. Version Your Data Format

```json
{
  "version": "1.0",
  "format": "material-export",
  "data": {}
}
```

### 4. Add Timestamps

```json
{
  "generated": "2026-02-06T12:00:00Z",
  "last_modified": "2026-02-06T15:30:00Z"
}
```

### 5. Handle Missing Files Gracefully

```python
if not data_file.exists():
    print(f"No data found at {data_file}")
    print("Run with --export first")
    sys.exit(1)
```

### 6. Clean Up Old Data

```
private/
├── commits/
│   ├── current.json
│   └── archived/
│       └── 2025-12_old.json
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
agent/private/
```

### File Permissions

Sensitive files should have restricted permissions:
```bash
tutoring_dir="$(bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc tutoring | awk -F= '/^RESOLVED_PATH=/{print $2}')"
chmod 600 "$tutoring_dir/students.json"
```

---

## Troubleshooting

### Issue: "Permission Denied"

**Fix:**
```bash
chmod 755 ~/.claude/private/
chmod 644 ~/.claude/private/file.json
```

### Issue: "File Not Found"

**Fix:** Create directory first
```python
output_dir.mkdir(parents=True, exist_ok=True)
```

### Issue: "Disk Space Low"

**Fix:** Clean up old caches
```bash
rm -rf ~/.claude/private/cache/*
```

### Issue: "Can't Parse JSON"

**Fix:** Validate JSON
```bash
python -m json.tool ~/.claude/private/file.json
```
