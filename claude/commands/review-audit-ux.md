---
description: "Audit UX/UI and writing quality for web or Python GUI"
argument-hint: "[file, glob, or diff range]"
allowed-tools: "Bash(git:*), Read, Grep, Glob"
---

# review-audit-ux

Review UX/UI layout, interaction flow, and writing quality in code files.
## Instructions

You audit code for UX/UI quality — layout, button placement, interaction flow, and writing. This command auto-detects whether the target is a **web app** or **Python GUI** and applies the matching standards.

### Step 1: Determine Review Scope

{{#if input}}
Review scope specified by user: "{{input}}"

Parse the input:
- If it's a file path → review that specific file
- If it's a glob pattern → review matching files
- If it's a diff range (e.g., `HEAD~3`) → review changes in that range
- If it's "staged" → review `git diff --staged`
{{else}}
No specific scope provided. Review all uncommitted changes:
```bash
git diff --name-only
git diff --staged --name-only
```
If no uncommitted changes exist, review the latest commit:
```bash
git diff --name-only HEAD~1
```
{{/if}}

### Step 2: Detect Target Type & Select Standards

Classify each file in scope:

**Web App** — `.html`, `.htm`, `.css`, `.scss`, `.less`, `.js`, `.jsx`, `.ts`, `.tsx`
- Apply: `~/.claude/standards/review-ux.md` (layout, interaction, accessibility, consistency)
- Apply: `~/.claude/standards/review-ux-writing.md` (all sections)

**Python GUI** — `.py` files containing `tkinter`, `ttk`, `PyQt`, `PySide`, `wx`, or `kivy` imports
- Apply: `~/.claude/standards/review-ux-python-gui.md` (window, layout, widget, flow, feedback)
- Apply: `~/.claude/standards/review-ux-writing.md` (sections 1–4 only: Clarity & Tone, Button Labels, Tooltip Text, Error Messages)

If the file type is ambiguous (e.g., `.py` without GUI imports), skip it. If no reviewable files are found, inform the user and exit.

### Step 3: Review

For each file in scope:
1. Read the full file content (or changed lines if reviewing a diff)
2. Confirm target type (web or Python GUI)
3. Read the applicable standard files listed above
4. Apply all relevant checklist items
5. Record findings with rule code, severity, location, and suggested fix

**Important for Python GUI reviews:**
- Focus on the GUI construction code — `__init__`, layout methods, widget creation
- Check button label strings, messagebox text, window titles
- Evaluate layout hierarchy: which widgets are in which frames, pack/grid usage
- Check the workflow: does the user flow make sense top-to-bottom?

### Step 4: Output

Follow the output format defined in `~/.claude/standards/review-template.md`.

- **Standards Applied** lists which checklists were used and the detected target type
- **Standards Compliance** section shows pass/fail per applicable standard
- Group findings by file, with severity counts

## Example Usage

**Review all uncommitted changes:**
```
/review-audit-ux
```

**Review a specific Python GUI file:**
```
/review-audit-ux D:\vs\anju\python\user_character_manager\character_creator_gui.py
```

**Review web files:**
```
/review-audit-ux src/components/*.jsx
```

**Review staged changes only:**
```
/review-audit-ux staged
```
