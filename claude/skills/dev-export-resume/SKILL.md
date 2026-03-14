---
description: "Export resume.html to PDF and update portfolio link. Use when updating or publishing the resume."
allowed-tools: Bash(*/Google*), Bash(open:*), Bash(ls:*), Bash(git:*), Read, Edit, Grep
---

# dev-export-resume

Export ta-portfolio resume.html to PDF and ensure the portfolio links to it.

## Purpose

Full resume update cycle: export HTML to print-ready PDF via headless Chrome, verify the portfolio site links to the PDF, and commit the result.

---

## Usage

```
/dev-export-resume
```

No arguments needed.

## Workflow

### Step 1: Resolve paths

Read `~/.claude/private/repo-paths.json` and get the `ta-portfolio` path.

- Source: `{ta-portfolio}/resume.html`
- Output: `{ta-portfolio}/assets/resume.pdf`
- Portfolio: `{ta-portfolio}/index.html`

### Step 2: Export PDF

Run headless Chrome:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless \
  --disable-gpu \
  --print-to-pdf="{ta-portfolio}/assets/resume.pdf" \
  --no-margins \
  --paper-width=8.27 \
  --paper-height=11.69 \
  "file://{ta-portfolio}/resume.html"
```

### Step 3: Verify PDF

- Check file exists and file size is reasonable (> 10KB)
- Open the PDF: `open {ta-portfolio}/assets/resume.pdf`

### Step 4: Verify portfolio link

- Check `index.html` has `href="assets/resume.pdf"` in the About Links section
- If missing or pointing to `resume.html`, update to `assets/resume.pdf`

### Step 5: Commit

- Stage `assets/resume.pdf`, `resume.html`, and `index.html` (if changed)
- Commit with message: `docs(resume): update resume PDF`

---

## Files

- `SKILL.md` - This file (skill documentation and workflow)
