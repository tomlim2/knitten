---
status: proposed
---
# Python GUI UX Review Checklist

Static code audit checklist for detecting UX/UI issues in Python desktop GUI applications (tkinter, PyQt, wxPython).

---

## Purpose

**Review checklist** for Python GUI UX audits. This is a companion to:

- `review-ux-writing.md` — UX writing checklist (shared across web and GUI)
- `review-ux.md` — Web-specific UX/UI checklista
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check** from a UX perspective in Python GUI code. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 👁 | **Human review required** — Tools cannot reliably detect this. Always check manually. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Blocks usability or causes data loss. Must fix before merge. |
| ⚠️ | Error | Degrades user experience significantly. Must fix before merge. |
| 💡 | Suggestion | Improvement. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the codebase uses that pattern. Skip if not relevant.

---

## 1. Window & Layout

> Window should be sensibly sized, resizable, and laid out predictably.

- 🔒 👁 **Window has a descriptive title** — `root.title()` or `setWindowTitle()` is called with a meaningful name. Generic "tk" or "Untitled" is not acceptable
  - *WIN-01*

- ⚠️ 👁 **Initial window size is reasonable** — Window dimensions fit common display resolutions (1366x768 minimum target). Not too large to clip on smaller screens, not too small to be cramped
  - *WIN-02*

- ⚠️ 👁 **Minimum window size set** — `root.minsize()` or `setMinimumSize()` prevents the window from being resized too small to use
  - *WIN-03*

- ⚠️ 👁 **Layout uses geometry managers consistently** — Don't mix `pack()`, `grid()`, and `place()` in the same container. Pick one per frame/container
  - *WIN-04*

- ⚠️ 👁 **Widgets expand/shrink with window resize** — Key content areas use `sticky="nsew"` (grid) or `fill=BOTH, expand=True` (pack) so the UI responds to resizing
  - *WIN-05*

- 💡 👁 **Multi-column layouts have clear visual separation** — Use `LabelFrame`, separators, or padding to visually distinguish panes. Don't rely solely on whitespace
  - *WIN-06*

- 💡 👁 **Consistent padding and margins** — Use uniform `padx`/`pady` values throughout. Avoid mixing arbitrary pixel values
  - *WIN-07*

---

## 2. Button Placement & Flow

> Buttons should follow platform conventions and guide the user through workflows.

- 🔒 👁 **Primary action is visually prominent** — The main action button (Save, Submit, Apply) is visually distinct from secondary actions. On tkinter, use `default=ACTIVE` or styling
  - *FLOW-01*

- 🔒 👁 **Destructive buttons separated from constructive buttons** — Delete/Remove buttons are not adjacent to Save/Apply without visual separation (spacing, color, or grouping)
  - *FLOW-02*

- ⚠️ 👁 **Button order follows platform convention** — On Windows: [OK] [Cancel]. Confirm/primary action on the left, dismiss on the right
  - *FLOW-03*

- ⚠️ 👁 **Buttons are grouped logically** — Related actions (Save/Cancel, Add/Remove) are adjacent. Unrelated actions are visually separated
  - *FLOW-04*

- ⚠️ 👁 **Workflow reads top-to-bottom, left-to-right** — User completes form fields before reaching action buttons. Buttons appear at the bottom or end of the form, not the top
  - *FLOW-05*

- 💡 👁 **Button labels follow UX writing standards** — Start with a verb, be specific. "Add to list" not "OK". "Delete entry" not "Remove". See `review-ux-writing.md` BTN-* rules
  - *FLOW-06*

- 💡 👁 **No redundant buttons** — Don't provide multiple ways to do the same thing in the same view. One clear path per action
  - *FLOW-07*

---

## 3. Widget Selection

> Use the right widget for the job. Wrong widget = confused user.

- 🔒 👁 **Dropdowns for fixed option sets** — Use `Combobox` or `OptionMenu` for predefined lists (enum values, categories). Don't use free-text Entry for selecting from known options
  - *WIDGET-01*

- ⚠️ 👁 **Treeview for tabular data** — Use `Treeview` for displaying structured data with columns. Don't use Listbox with formatted strings or Text widgets for tables
  - *WIDGET-02*

- ⚠️ 👁 **Checkbox for boolean, radio for single-select** — Binary on/off uses `Checkbutton`. Mutually exclusive options use `Radiobutton`. Don't use a dropdown for just 2-3 toggle choices
  - *WIDGET-03*

- ⚠️ 👁 **Entry fields have appropriate width** — Short data (UUID, date) uses narrow Entry. Long data (file path, description) uses wider Entry or Text widget. Width matches expected content length
  - *WIDGET-04*

- 💡 👁 **Read-only fields are visually distinct** — Data that the user cannot edit uses `state='readonly'` or `state='disabled'` with visual indication
  - *WIDGET-05*

- 💡 👁 **Scrollbar for long content** — Lists, text areas, and tables with potentially many items have scrollbars. Don't let content overflow without scroll
  - *WIDGET-06*

---

## 4. Feedback & State

> Users should always know what happened and what's happening.

- 🔒 👁 **Destructive actions require confirmation** — Delete, clear, overwrite actions show `messagebox.askyesno()` or equivalent confirmation before proceeding
  - *FEEDBACK-01*

- 🔒 👁 **Errors shown in messagebox or inline** — Use `messagebox.showerror()` for blocking errors. Don't silently fail. Don't only print to console
  - *FEEDBACK-02*

- ⚠️ 👁 **Success feedback provided** — After save, add, or modify operations, show brief confirmation. `messagebox.showinfo()`, status bar update, or visual indicator
  - *FEEDBACK-03*

- ⚠️ 👁 **Long operations show progress** — Operations that take >1 second use `Progressbar` or status text. Don't freeze the UI without indication
  - *FEEDBACK-04*

- ⚠️ 👁 **Disabled widgets indicate why** — Greyed-out buttons or fields have tooltip or nearby text explaining what enables them
  - *FEEDBACK-05*

- 💡 👁 **Auto-save gives visual confirmation** — If the app auto-saves, show brief feedback (status bar text, flash, or subtle indicator) so users know their changes are persisted
  - *FEEDBACK-06*

- 💡 👁 **No modal overload** — Don't chain multiple messageboxes. If an operation has multiple outcomes, consolidate into one dialog or use inline feedback
  - *FEEDBACK-07*

---

## 5. File & Path Handling (if applicable)

> File operations should be intuitive and safe.

- 🔒 👁 **File dialogs use appropriate type** — `askopenfilename()` for opening, `asksaveasfilename()` for saving. Use `filetypes` filter to restrict to valid extensions
  - *FILE-01*

- ⚠️ 👁 **File paths displayed in truncated or tooltip form** — Long file paths don't overflow the UI. Show filename with tooltip for full path, or use Entry with horizontal scroll
  - *FILE-02*

- ⚠️ 👁 **Default directory set sensibly** — File dialogs open at a relevant location (`initialdir`), not the script's working directory
  - *FILE-03*

- 💡 👁 **Drag-and-drop for file input** — Where supported, allow files to be dragged onto the window instead of requiring Browse button only
  - *FILE-04*

---

## 6. Data Lists & Tables (if applicable)

> Lists of data should be scannable, sortable, and editable.

- ⚠️ 👁 **Selected item is visually highlighted** — Selection state is clear and maintained after interacting with other parts of the UI
  - *LIST-01*

- ⚠️ 👁 **Selection drives related UI** — Selecting an item in a list updates a detail panel, enables edit/delete buttons. No orphaned selections
  - *LIST-02*

- ⚠️ 👁 **Columns have descriptive headers** — Treeview columns use human-readable headers ("Display Name" not "displayName"). Headers match the data below
  - *LIST-03*

- 💡 👁 **Column widths match content** — Short data (ID, status) uses narrow columns. Long data (name, path) uses wider columns. Don't give all columns equal width
  - *LIST-04*

- 💡 👁 **Empty list shows guidance** — When the list is empty, show a message like "No entries yet. Use 'Add' to create one." instead of blank space
  - *LIST-05*

---

## 7. Keyboard & Shortcuts (if applicable)

> Power users expect keyboard shortcuts. Basic navigation should work without a mouse.

- ⚠️ 👁 **Tab order follows visual layout** — Pressing Tab moves focus through widgets in logical reading order (top-to-bottom, left-to-right)
  - *KEY-01*

- ⚠️ 👁 **Enter triggers primary action** — In dialogs and forms, Enter key submits/applies. Escape closes dialogs
  - *KEY-02*

- 💡 👁 **Mnemonics/underlines for frequent actions** — Key buttons have keyboard accelerators (`underline=0` in tkinter or `&` prefix in Qt)
  - *KEY-03*

- 💡 👁 **Ctrl+S saves** — If the app has a save function, Ctrl+S triggers it
  - *KEY-04*

---

## Sources

### Key References

1. [Microsoft: Windows App Design Guidelines](https://learn.microsoft.com/en-us/windows/apps/design/)
2. [Nielsen Norman Group: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
3. [Python tkinter Documentation](https://docs.python.org/3/library/tkinter.html)
4. [Qt Human Interface Guidelines](https://doc.qt.io/qt-6/qml-qtquick-controls-overview.html)
5. [Tk Best Practices](https://tkdocs.com/tutorial/index.html)
