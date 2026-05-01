---
status: accepted
---
# UX Writing Review Checklist

Static code audit checklist for detecting UX writing issues by reading HTML, JS, and text content in source files.

---

## Purpose

**Review checklist** for UX writing audits. This is a companion to:

- `review-ux.md` — UX/UI code audit checklist
- `review-code-javascript.md` — JS coding standards checklist
- `review-code-css.md` — CSS coding standards checklist
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check** from a UX writing perspective. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — Linters or tools can catch this. Only check manually if tooling is missing. |
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

## 1. Clarity & Tone

> All UI text should be clear, concise, and consistent in voice.

- 🔒 👁 **Use active voice** — UI text uses active voice ("Save your file" not "Your file will be saved"). Passive voice obscures the actor and confuses users
  - *TONE-01*

- 🔒 👁 **Remove filler words** — No "just", "simply", "please", "obviously", "basically" in UI text. These add no information and can feel patronizing
  - *TONE-02*

- ⚠️ 👁 **Use positive framing** — Describe what to do, not what not to do. "Enter a valid email" not "Don't enter an invalid email"
  - *TONE-03*

- ⚠️ 👁 **Consistent terminology** — Same concept uses the same word everywhere. Don't alternate between "delete/remove/clear" or "save/submit/confirm" for the same action
  - *TONE-04*

- ⚠️ 👁 **Address user as "you"** — Use second person ("Your projects", "You have 3 items") not third person ("The user's projects") or first person plural ("We found 3 items")
  - *TONE-05*

- ⚠️ 👁 **No jargon or technical terms in UI** — Avoid developer terms in user-facing text. "Something went wrong" not "Null reference exception". "No internet connection" not "Network request failed"
  - *TONE-06*

- 💡 👁 **Concise sentences** — UI text is one sentence or less where possible. If explanation is needed, use progressive disclosure (tooltip, expandable section)
  - *TONE-07*

- 💡 👁 **Consistent capitalization style** — Pick one style (sentence case or title case) for headings, buttons, and labels, and apply it uniformly
  - *TONE-08*

---

## 2. Button Labels

> Buttons should tell users exactly what will happen when clicked.

- 🔒 👁 **Start with a verb** — Button labels begin with an action verb. "Save changes", "Download file", "Create account" — not "Changes", "File", "Account"
  - *BTN-01*

- 🔒 👁 **No generic "Yes/No" or "OK"** — Confirmation dialogs use specific action labels. "Delete project" / "Keep project" instead of "Yes" / "No" or "OK" / "Cancel"
  - *BTN-02*

- ⚠️ 👁 **1–3 words preferred** — Button labels are concise. If more than 4 words are needed, restructure the UI or use supporting text outside the button
  - *BTN-03*

- ⚠️ 👁 **No trailing punctuation** — Button labels have no period, exclamation mark, or ellipsis. Exception: ellipsis is acceptable when the button opens a dialog that requires further input (e.g., "Save as...")
  - *BTN-04*

- ⚠️ 👁 **Describe the specific action** — "Upload photo" not "Submit", "Send message" not "Done", "Add to cart" not "Proceed". Users should know the outcome before clicking
  - *BTN-05*

- 💡 👁 **Destructive actions are explicit** — Delete/remove buttons clearly state what will be deleted. "Delete account" not just "Delete". Combined with confirmation (see INTER-02 in review-ux.md)
  - *BTN-06*

- 💡 🔧 **No ALL CAPS in buttons** — Button text uses sentence case or title case. `text-transform: uppercase` on buttons reviewed for readability
  - *BTN-07*

---

## 3. Tooltip & Title Text

> Tooltips supplement labels — they don't replace them or repeat them.

- ⚠️ 👁 **150 characters or fewer** — Tooltip text is short. If more explanation is needed, use an info panel, help page, or inline description instead
  - *TIP-01*

- ⚠️ 👁 **Don't repeat the label** — Tooltip on a "Save" button should not say "Save". Add useful context: "Save changes to your draft"
  - *TIP-02*

- ⚠️ 👁 **Essential info not hidden in tooltips** — Critical information (required fields, destructive consequences) lives in visible text, not behind a hover tooltip that mobile users can't access
  - *TIP-03*

- 💡 👁 **Consistent tooltip presence** — If one icon button has a tooltip, all icon buttons should have tooltips. Don't apply tooltips inconsistently
  - *TIP-04*

- 💡 👁 **Title attributes meaningful** — `title` attributes on elements provide useful supplementary text, not duplicate content or empty strings
  - *TIP-05*

---

## 4. Error & Validation Messages

> Error messages should explain what happened and how to fix it.

- 🔒 👁 **State cause and solution together** — Every error message explains what went wrong AND how to fix it. "Password must be at least 8 characters" not just "Invalid password"
  - *ERR-01*

- 🔒 👁 **Never blame the user** — "That email is already registered" not "You entered an email that already exists". Attribute errors to the system or situation, not the person
  - *ERR-02*

- 🔒 🔧 **No raw error codes or stack traces** — User-facing messages never show HTTP status codes, exception names, or stack traces. "Unable to load your data. Try again." not "Error 500: Internal Server Error"
  - *ERR-03*

- ⚠️ 👁 **Preserve user input on error** — When validation fails, the form retains all entered values. Users should not have to re-type anything
  - *ERR-04*

- ⚠️ 👁 **Error text near the source** — Validation messages appear next to the field that caused the error, not only in a banner at the top of the page
  - *ERR-05*

- 💡 👁 **Suggest alternatives when possible** — "No results for 'kat'. Did you mean 'cat'?" or "That username is taken. Try: user123, user_name"
  - *ERR-06*

---

## 5. Toast & Notification Messages (if applicable)

> Toasts confirm non-critical actions briefly and get out of the way.

- ⚠️ 👁 **One sentence or less** — Toast messages are brief. "Project saved" not "Your project has been successfully saved to the server"
  - *TOAST-01*

- ⚠️ 👁 **Non-critical information only** — Toasts are used for confirmations and minor alerts. Critical errors and destructive action results use persistent messaging, not toasts that auto-dismiss
  - *TOAST-02*

- ⚠️ 👁 **State the completed action** — "Comment posted" not "Success". "3 files uploaded" not "Done". The user should know what just happened
  - *TOAST-03*

- 💡 👁 **Include undo when possible** — For reversible actions (archive, move, mark as read), toast includes an "Undo" link
  - *TOAST-04*

- 💡 👁 **No duplicate toasts** — Rapid-fire actions (bulk operations) consolidate into a single toast ("12 items moved") instead of 12 separate toasts
  - *TOAST-05*

---

## 6. Form Labels & Placeholders

> Labels tell users what to enter. Placeholders show format examples.

- 🔒 👁 **Visible label for every input** — Every form input has a visible `<label>` element. Placeholder text alone is not a label — it disappears on input and fails accessibility
  - *LABEL-01 · WCAG 3.3.2 Labels or Instructions (A)*

- ⚠️ 👁 **Placeholder shows format, not purpose** — Placeholder text demonstrates expected format ("e.g., john@example.com") not the field's purpose (that's the label's job)
  - *LABEL-02*

- ⚠️ 👁 **Label text matches the data** — Labels precisely describe expected input. "Full name" not "Name info". "Email address" not "Contact"
  - *LABEL-03*

- 💡 👁 **Help text for complex inputs** — Fields with specific requirements (password rules, date format, character limits) have help text below the input, not only in placeholder
  - *LABEL-04*

- 💡 🔧 **No placeholder-only inputs** — Grep for `<input>` elements that have `placeholder` but no associated `<label>`, `aria-label`, or `aria-labelledby`
  - *LABEL-05 · WCAG 1.3.1 Info and Relationships (A)*

---

## 7. Empty & Loading States

> Empty and loading states orient the user and suggest next steps.

- ⚠️ 👁 **Empty state explains why** — Empty lists, tables, and content areas explain why they're empty ("No projects yet") instead of showing blank space or just a generic icon
  - *STATE-01*

- ⚠️ 👁 **Empty state includes CTA** — Empty states suggest an action: "Create your first project" with a button or link. Don't leave users stranded
  - *STATE-02*

- ⚠️ 👁 **Loading text is specific** — "Loading your projects..." not just "Loading..." or a spinner with no text. Users should know what they're waiting for
  - *STATE-03*

- 💡 👁 **Zero-result search has guidance** — Search with no results suggests: check spelling, try broader terms, or offers related content. Not just "No results found"
  - *STATE-04*

---

## Sources

### Key References

1. [Material Design: Writing](https://m3.material.io/foundations/content-design/overview)
2. [Apple HIG: Writing](https://developer.apple.com/design/human-interface-guidelines/writing)
3. [Microsoft: Voice and Tone](https://learn.microsoft.com/en-us/style-guide/brand-voice-above-all-simple-human)
4. [Nielsen Norman Group: Error Messages](https://www.nngroup.com/articles/error-message-guidelines/)
5. [Google Developer Style Guide](https://developers.google.com/style)
6. [Polaris: Error Messages](https://polaris.shopify.com/content/error-messages)
7. [Carbon Design: Content Guidelines](https://carbondesignsystem.com/guidelines/content/overview/)
8. [WCAG 3.3: Input Assistance](https://www.w3.org/WAI/WCAG22/quickref/#input-assistance)
