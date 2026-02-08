---
description: Verify design system version and sync work artifacts
argument-hint: "[version or file path]"
allowed-tools: Read, Glob, Grep, Edit, Task
---

# Design System Sync

Synchronize GUI/UI work artifacts with the design system version.

## Workflow

### Step 1: Detect New/Unversioned UI Files

1. **Glob** pattern search for UI files:
   - CSS: `**/*.css` (exclude node_modules)
   - EJS: `**/*.ejs`
   - TSX/JSX: `**/*.{tsx,jsx}`

2. **Grep** each file for version comment:
   ```
   Design System: v
   ```

3. **Classify**:
   - No version comment = Target for processing
   - Has version comment = Skip (or compare version)

### Step 2: Generate Processing List with Priority

1. **Priority sorting**:
   - New files first (git untracked)
   - Existing files (no version comment)

2. **Output processing list**:
   ```
   📋 Files to process: N

   [New Files]
   - path/to/new-file.css

   [Existing Files (No Version)]
   - path/to/existing-file.css
   ```

### Step 3: Run Parallel Agents

**IMPORTANT**: When processing multiple files, use **single message with multiple Task calls** for parallel execution

Each agent's tasks:
1. Read Design System standards (design-system.md + design-showcase)
2. Read target file
3. Compare style elements:
   - Colors (`#000`, `rgb(`, CSS variables)
   - Typography (`font-family`, `font-size`, `font-weight`)
   - Spacing (`padding`, `margin`, `gap`)
   - Borders (`border`, `border-radius`)
4. Find mismatches
5. Add/update version comment
6. Return individual report

**Agent prompt example**:
```
Analyze {file_path} against Design System v{version}.

1. Read ~/.claude/standards/design-system.md (specification)
2. Read http://localhost:972/skills/design-showcase (live examples)
3. Read {file_path}
4. Compare colors, typography, spacing, borders
5. Find mismatches
6. Add/update version comment: /* Design System: v{version} */
7. Return report with:
   - File path
   - Version status (NEW/UPDATED)
   - Mismatches found
   - Recommendations
```

### Step 4: Unified Report

Aggregate all agent results and generate final report:

```markdown
## Design System Sync Report

**Design System**: Typo-base v{version}
**Last Updated**: YYYY-MM-DD
**Files Processed**: N

---

### ✅ Synced Files

| File | Status | Mismatches |
|------|--------|------------|
| main.css | NEW → v1.4.0 | 2 issues |
| dashboard.ejs | UPDATED → v1.4.0 | 0 issues |

---

### ⚠️ Mismatches Found

#### main.css

| Line | Issue | Expected | Actual |
|------|-------|----------|--------|
| 24 | Missing primary font | 'Google Sans Flex', 'Noto Sans KR' | 'Noto Sans KR' |
| 42 | Header border thickness | 1px | 3px |

---

### 📝 Recommendations

- [ ] Add Google Fonts import to head.ejs
- [ ] Update body font-family to include Google Sans Flex
- [ ] Standardize header border to 1px

---

### 📊 Summary

- ✅ Compliant: 90%
- ⚠️ Minor issues: 2
- ❌ Major issues: 0
```

## Version Stamp Format

Version comment by file type:

**CSS/SCSS**:
```css
/* Design System: v1.4.0 */
```

**TypeScript/JavaScript**:
```ts
// Design System: v1.4.0
```

**Python**:
```python
# Design System: v1.4.0
```

**C++/C**:
```cpp
// Design System: v1.4.0
```

**Location**: Top of file (above or right below imports/includes)

## Rules

1. **Comprehensive grep first** - Always search ALL files before making changes
   - Don't assume template changes propagate to standalone files
   - Search across ALL file types (*.html, *.css, *.ejs, *.tsx, *.jsx)
   - Example: When updating `.site-footer` → `.footer`, grep entire skills directory first
2. **No version comment** = Target for processing
3. **New files first** priority
4. **Parallel agents** (single message, multiple Tasks)
5. **Unified report** generated at the end
6. **Auto version stamp** added

## Common Pitfalls

❌ **Don't:** Update only EJS templates and assume standalone HTML files inherit changes
✅ **Do:** `grep -r "site-footer" claude/skills/ --include="*.html" --include="*.css"` before editing

❌ **Don't:** Make partial updates across file types
✅ **Do:** Find all occurrences first, update all at once, single commit
