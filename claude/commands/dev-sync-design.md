---
description: Verify design system version and sync work artifacts
argument-hint: "[version or file path]"
allowed-tools: Read, Glob, Grep, Edit, Task
---

# dev-sync-design

Synchronize GUI/UI work artifacts with the design system version.
## CSS Architecture

**Design System v1.8.1** uses centralized CSS with specialized overrides:

### Base CSS (Required for all pages)
- **main.css** - Showcase base styles for all pages
  - `.page-main` typography (h1-h4, p, hr)
  - UI components (.btn, .input, .form-group)
  - Layout (.header, .footer, .nav)
  - **NO content-specific overrides**

### Custom CSS (Optional, use-case specific)
- **markdown-reading.css** - Compact 12px for documentation
  - Used by: browse-standards, learn-browse-entries
  - Overrides: compact typography for reading

- **usage-stats.css** - Infographic components
  - Used by: browse-usage
  - Custom: stats-grid, stat-card, usage-table

- **tutoring-invoice/style.css** - Invoice-specific
  - Used by: tutoring-invoice
  - Custom: invoice layout and print styles

### Architecture Rules
1. **All pages import main.css** (required)
2. **Custom CSS only for special cases** (optional)
3. **No inline `<style>` tags** - use external CSS files
4. **No content typography in main.css** - only in .page-main

## Workflow

### Step 0: Generate Showcase Specification (Optional)

**Purpose**: Extract current design-show-components styles into JSON for programmatic comparison

1. **Read** `~/.claude/skills/design-show-components/index.html`
2. **Parse** `<style>` section CSS rules:
   - `.page-main h1, h2, h3, h4` styles
   - `.page-main p, code` styles
   - `:not(pre) > code, pre` styles
   - `.content-section` and `::after` styles
   - `:root` CSS variables
3. **Generate** `~/.claude/private/showcase-spec.json`:
```json
{
  "version": "1.8.1",
  "typography": {
    "h1": {"fontSize": "20px", "fontWeight": "400", "textTransform": "none"},
    "h2": {"fontSize": "18px", "fontWeight": "400", "textTransform": "none", "marginTop": "20px"},
    "h3": {"fontSize": "16px", "fontWeight": "400", "marginTop": "18px"},
    "h4": {"fontSize": "14px", "fontWeight": "400"},
    "p": {"fontSize": "14px"}
  },
  "codeBlocks": {
    "inline": {"borderRadius": "1px"},
    "pre": {"borderRadius": "1px"}
  }
}
```

**When to generate**: After updating design-show-components styles

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
1. Read design-show-components actual CSS (single source of truth)
2. Read target file
3. Compare EACH property against showcase:
   - **h1**: fontSize 20px, fontWeight 400, textTransform none
   - **h2**: fontSize 18px, fontWeight 400, textTransform none, marginTop 20px
   - **h3**: fontSize 16px, fontWeight 400, marginTop 18px
   - **h4**: fontSize 14px, fontWeight 400
   - **p**: fontSize 14px
   - **hr**: border-top 1px solid, margin 32px 0
   - **inline code**: borderRadius 1px (NOT 6px)
   - **pre**: borderRadius 1px (NOT 6px)
4. **APPLY FIXES** (not just report):
   - Use Edit tool to update mismatched values
   - Replace uppercase with none
   - Update font sizes to showcase scale
   - Update border-radius to 1px
5. Add/update version comment AFTER fixes
6. Return report with changes made

**Agent prompt example**:
```
Fix {file_path} to match Design System v{version} showcase.

**Reference (Single Source of Truth):**
1. Open http://localhost:9720/skills/design-show-components
2. Read design-show-components/index.html <style> section
3. Extract actual values from .page-main styles

**Target File:**
4. Read {file_path}

**Compare and FIX:**
5. For each selector, compare actual vs expected:

   .page-main h2 {
     font-size: expect 18px (NOT 12px)
     font-weight: expect 400 (NOT 500)
     text-transform: expect none (NOT uppercase)
     margin-top: expect 20px
   }

   :not(pre) > code {
     border-radius: expect 1px (NOT 6px)
   }

6. Use Edit tool to fix ALL mismatches
7. Update version stamp: /* Design System: v{version} */
8. Return report:
   - File path
   - Changes applied (before → after)
   - Verification: all properties now match showcase
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

1. **design-show-components is the single source of truth**
   - design-system.md = Specification document
   - design-show-components = Actual implementation reference
   - When in conflict, showcase wins
   - Always compare against showcase actual CSS values

2. **"Fix" not "Report"**
   - Don't just find mismatches - APPLY fixes immediately
   - Use Edit tool to update files
   - Version stamp only AFTER fixes applied

3. **Comprehensive grep first** - Always search ALL files before making changes
   - Don't assume template changes propagate to standalone files
   - Search across ALL file types (*.html, *.css, *.ejs, *.tsx, *.jsx)
   - Example: When updating `.site-footer` → `.footer`, grep entire skills directory first

4. **Specific property comparison**
   - Not "check typography" (too vague)
   - Check "h2 fontSize === 18px" (specific)
   - Compare EACH property explicitly

5. **Processing priority**
   - New files first
   - Files with version mismatch second
   - Files without version stamp last

6. **Parallel agents** (single message, multiple Tasks)

7. **Unified report** generated at the end

8. **Auto version stamp** added AFTER fixes

9. **No content typography overrides in main.css**
   - Only .page-main styles allowed
   - Remove .skill-name, .page-hero-desc, .item-name font-sizes
   - UI components can have font-sizes (.btn, .input labels)
   - Content inherits from .page-main showcase

## Common Pitfalls

❌ **Don't:** Just update version stamps without checking styles
✅ **Do:** Compare each CSS property against showcase and fix mismatches

❌ **Don't:** Only read design-system.md specification
✅ **Do:** Read design-show-components actual CSS as the reference implementation

❌ **Don't:** Report mismatches and stop
✅ **Do:** Use Edit tool to apply fixes immediately, then report changes

❌ **Don't:** Update only EJS templates and assume standalone HTML files inherit changes
✅ **Do:** `grep -r "site-footer" claude/skills/ --include="*.html" --include="*.css"` before editing

❌ **Don't:** Make partial updates across file types
✅ **Do:** Find all occurrences first, update all at once, single commit

❌ **Don't:** Check vague "typography compliance"
✅ **Do:** Check specific values: `h2.fontSize === "18px"`, `h2.textTransform === "none"`

❌ **Don't:** Add content-specific font-sizes (.skill-name, .page-hero-desc, .item-name)
✅ **Do:** Keep only .page-main typography styles, let content inherit

❌ **Don't:** Use inline `<style>` tags for special cases
✅ **Do:** Create separate CSS files (markdown-reading.css, usage-stats.css)
