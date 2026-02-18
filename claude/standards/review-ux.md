# UX/UI Code Review Checklist

Static code audit checklist for detecting UX/UI issues by reading HTML, CSS, and JS source files.

---

## Purpose

**Review checklist** for UX/UI code audits. This is a companion to:

- `review-code-javascript.md` — JS coding standards checklist
- `review-code-css.md` — CSS coding standards checklist
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check** from a UX perspective. Use `review-template.md` for how to format findings.

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

## 1. Layout & Overflow

> Content should never be clipped, hidden, or inaccessible due to layout constraints.

- 🔒 👁 **No unintended content clipping** — `overflow: hidden` on containers reviewed for content truncation at various viewport sizes. Interactive content (buttons, links) never clipped
  - *LAYOUT-01*

- ⚠️ 👁 **Scroll containers are keyboard-accessible** — Elements with `overflow: auto/scroll` have `tabindex="0"` and appropriate `role` and `aria-label` so keyboard users can scroll
  - *LAYOUT-02 · WCAG 2.1.1 Keyboard (A)*

- ⚠️ 👁 **No horizontal scroll on page body** — Page-level horizontal scrollbar does not appear at any standard viewport width (320px–1920px). Individual components may scroll horizontally if intentional
  - *LAYOUT-03*

- ⚠️ 🔧 **Flex/grid children don't overflow parent** — Flex items have `min-width: 0` or `overflow: hidden` where text or content can exceed container bounds
  - *LAYOUT-04*

- 💡 👁 **Minimum content height** — Main content area has `min-height` to prevent footer from riding up on short pages
  - *LAYOUT-05*

- 💡 👁 **Empty states handled** — Lists, tables, and dynamic content areas show meaningful empty states instead of blank space when data is absent
  - *LAYOUT-06*

- 💡 👁 **Aspect ratio preserved** — Images and media use `aspect-ratio`, `object-fit`, or container constraints to prevent distortion
  - *LAYOUT-07*

---

## 2. Responsive Design

> Layout adapts gracefully across viewport sizes without breaking.

- 🔒 👁 **Viewport meta tag present** — `<meta name="viewport" content="width=device-width, initial-scale=1">` exists in `<head>`
  - *RESP-01*

- ⚠️ 👁 **Touch targets minimum 44x44px** — Interactive elements (buttons, links, inputs) meet minimum 44x44 CSS pixel touch target on mobile viewports. Padding counts toward target size
  - *RESP-02 · WCAG 2.5.8 Target Size (AA)*

- ⚠️ 👁 **No fixed-width containers on mobile** — Elements with `width` in px don't cause horizontal overflow on small viewports. Use `max-width` or relative units
  - *RESP-03*

- ⚠️ 👁 **Text remains readable without horizontal scroll** — Long text content wraps properly. No horizontal scrolling required to read text at 320px viewport width
  - *RESP-04 · WCAG 1.4.10 Reflow (AA)*

- 💡 👁 **Navigation adapts to viewport** — Desktop navigation collapses to hamburger/drawer on mobile. Navigation items remain accessible at all sizes
  - *RESP-05*

- 💡 👁 **Images are responsive** — Images use `max-width: 100%`, `srcset`, or `<picture>` element to serve appropriate sizes
  - *RESP-06*

- 💡 👁 **No hover-only interactions on touch** — Tooltips, dropdowns, and reveals triggered by `:hover` have touch-friendly alternatives (tap, long-press, or always-visible)
  - *RESP-07*

---

## 3. Interaction Patterns

> Interactive elements behave predictably and provide clear feedback.

- 🔒 👁 **All interactive elements have visible affordance** — Clickable elements look clickable (buttons have button styling, links are underlined or colored, inputs have borders)
  - *INTER-01*

- 🔒 👁 **Destructive actions require confirmation** — Delete, remove, clear, and other irreversible actions show a confirmation dialog or undo option
  - *INTER-02*

- ⚠️ 👁 **Loading states present** — Async operations (API calls, form submissions, file uploads) show loading indicators. No silent waits
  - *INTER-03*

- ⚠️ 👁 **Error states visible and specific** — Failed operations show error messages near the source of error, not just console.log. Messages describe what went wrong and how to fix it
  - *INTER-04*

- ⚠️ 👁 **Disabled state visually distinct** — Disabled buttons/inputs are visually distinguishable (opacity, color change) AND have `disabled` attribute or `aria-disabled="true"`
  - *INTER-05*

- ⚠️ 👁 **Double-submit prevention** — Form submit buttons are disabled during submission or the handler debounces to prevent duplicate requests
  - *INTER-06*

- 💡 👁 **Cursor indicates interactivity** — `cursor: pointer` on clickable non-anchor elements. `cursor: not-allowed` on disabled elements. `cursor: grab/grabbing` on draggable elements
  - *INTER-07*

- 💡 👁 **Hover/active/focus states defined** — Interactive elements have distinct visual states for `:hover`, `:active`, and `:focus-visible`
  - *INTER-08*

- 💡 👁 **Undo/redo for destructive edits** — Canvas, text editor, or form operations that modify user data support Ctrl+Z undo
  - *INTER-09*

---

## 4. Accessibility

> UI is usable by all users including those with assistive technology.

- 🔒 🔧 **Images have alt text** — All `<img>` elements have `alt` attribute. Decorative images use `alt=""`. Informative images describe content
  - *A11Y-01 · WCAG 1.1.1 Non-text Content (A)*

- 🔒 👁 **Interactive elements are keyboard-reachable** — All clickable/interactive elements are reachable via Tab key. Custom widgets use appropriate `tabindex`
  - *A11Y-02 · WCAG 2.1.1 Keyboard (A)*

- 🔒 👁 **Focus order is logical** — Tab order follows visual reading order (left-to-right, top-to-bottom). No `tabindex` > 0 values creating unexpected focus jumps
  - *A11Y-03 · WCAG 2.4.3 Focus Order (A)*

- 🔒 👁 **Modals trap focus** — Modal dialogs contain focus within them when open. Escape key closes modal. Focus returns to trigger element on close
  - *A11Y-04 · WCAG 2.1.2 No Keyboard Trap (A)*

- ⚠️ 🔧 **Form inputs have labels** — Every `<input>`, `<select>`, and `<textarea>` has an associated `<label>` (via `for`/`id`) or `aria-label`/`aria-labelledby`
  - *A11Y-05 · WCAG 1.3.1 Info and Relationships (A)*

- ⚠️ 👁 **Color is not the only indicator** — Status, errors, and states use icons, text, or patterns in addition to color changes
  - *A11Y-06 · WCAG 1.4.1 Use of Color (A)*

- ⚠️ 👁 **ARIA roles match behavior** — Custom widgets use correct ARIA roles (`role="dialog"`, `role="tablist"`, `role="slider"`, etc.) with required ARIA attributes
  - *A11Y-07 · WCAG 4.1.2 Name, Role, Value (A)*

- 💡 👁 **Skip navigation link** — Long pages with repeated navigation have a "Skip to content" link as the first focusable element
  - *A11Y-08 · WCAG 2.4.1 Bypass Blocks (A)*

- 💡 👁 **Live regions for dynamic content** — Content that updates without page reload uses `aria-live="polite"` or `aria-live="assertive"` to announce changes to screen readers
  - *A11Y-09 · WCAG 4.1.3 Status Messages (AA)*

---

## 5. Animation & Motion

> Animations enhance UX without causing discomfort or usability issues.

- 🔒 👁 **prefers-reduced-motion respected** — All non-essential animations have `@media (prefers-reduced-motion: reduce)` override that removes or simplifies motion
  - *MOTION-01 · WCAG 2.3.3 Animation from Interactions (AAA)*

- ⚠️ 👁 **No auto-playing animation longer than 5s** — Animations that play automatically can be paused, stopped, or hidden. Infinite loops have a stop mechanism
  - *MOTION-02 · WCAG 2.2.2 Pause, Stop, Hide (A)*

- ⚠️ 👁 **No flashing content** — Nothing flashes more than 3 times per second. No strobe effects
  - *MOTION-03 · WCAG 2.3.1 Three Flashes (A)*

- 💡 👁 **Transition duration 150ms–300ms** — UI transitions feel responsive (150ms) without being jarring. Durations outside this range need justification
  - *MOTION-04*

- 💡 👁 **Exit animations don't block interaction** — Closing/hiding animations don't prevent user from interacting with newly revealed content
  - *MOTION-05*

- 💡 👁 **Scroll-linked animations are smooth** — Scroll-driven animations use `requestAnimationFrame`, `IntersectionObserver`, or CSS `scroll-timeline` instead of scroll event listeners
  - *MOTION-06*

---

## 6. Consistency & Design Tokens

> Visual language is consistent throughout the application.

- ⚠️ 👁 **Colors use design tokens** — No hardcoded hex/rgb values for colors that exist as CSS custom properties or design tokens
  - *CONSIST-01*

- ⚠️ 👁 **Spacing uses system values** — Margins and paddings use consistent spacing scale (4px, 8px, 12px, 16px, 24px, etc.) or CSS custom properties, not arbitrary values
  - *CONSIST-02*

- ⚠️ 👁 **Similar components styled consistently** — Buttons, cards, inputs, and other repeated patterns use the same styling. No visual drift between instances
  - *CONSIST-03*

- 💡 👁 **Icon size and style consistent** — Icons use the same size, weight, and style family throughout. No mixing outlined and filled icons without purpose
  - *CONSIST-04*

- 💡 👁 **Border radius consistent** — Corner rounding uses consistent values from the design system, not arbitrary pixel values per component
  - *CONSIST-05*

- 💡 👁 **Shadow depth consistent** — Box shadows follow a consistent elevation system (e.g., small/medium/large) rather than ad-hoc values
  - *CONSIST-06*

---

## 7. Typography & Readability

> Text is legible, well-structured, and comfortable to read.

- ⚠️ 👁 **Body text minimum 16px** — Main body text is at least 16px (1rem). Smaller text reserved for captions, labels, and secondary information
  - *TYPO-01*

- ⚠️ 👁 **Line length 45–75 characters** — Body text paragraphs use `max-width` to constrain line length for readability (roughly 45–75ch)
  - *TYPO-02*

- ⚠️ 👁 **Line height 1.4–1.6 for body** — Body text `line-height` is between 1.4 and 1.6. Headings can be tighter (1.1–1.3)
  - *TYPO-03*

- 💡 👁 **Heading hierarchy is logical** — Heading levels (h1–h6) follow document outline without skipping levels (no h1 → h3)
  - *TYPO-04 · WCAG 1.3.1*

- 💡 👁 **No justified text** — `text-align: justify` avoided as it creates uneven word spacing that harms readability, especially for dyslexic users
  - *TYPO-05 · WCAG 1.4.8 Visual Presentation (AAA)*

- 💡 👁 **Sufficient paragraph spacing** — Paragraphs have enough margin-bottom to visually separate content blocks
  - *TYPO-06*

- 💡 👁 **Font stack has fallbacks** — `font-family` declarations include system font fallbacks and generic family (`sans-serif`, `monospace`)
  - *TYPO-07*

---

## 8. Semantic HTML

> HTML structure conveys meaning and supports assistive technology.

- ⚠️ 🔧 **Semantic elements used** — `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` used instead of generic `<div>` for page structure
  - *SEM-01*

- ⚠️ 👁 **Buttons are `<button>`, links are `<a>`** — `<div>` or `<span>` with click handlers use `<button>` instead. Navigation uses `<a>`. No `<a href="#">` for non-navigation actions
  - *SEM-02 · WCAG 4.1.2*

- ⚠️ 👁 **Lists use `<ul>`/`<ol>`** — Groups of related items (nav menus, feature lists, tag lists) use list elements, not consecutive `<div>` or `<span>` elements
  - *SEM-03*

- 💡 👁 **Tables used for tabular data only** — `<table>` used for data, not layout. Data tables have `<thead>`, `<th>`, and appropriate `scope` attributes
  - *SEM-04*

- 💡 🔧 **Document has single `<h1>`** — Page has exactly one `<h1>` element describing the page content
  - *SEM-05*

- 💡 🔧 **Language attribute set** — `<html lang="...">` specifies the page language
  - *SEM-06 · WCAG 3.1.1 Language of Page (A)*

---

## 9. Performance UX

> Perceived performance and responsiveness from the user's perspective.

- ⚠️ 👁 **No layout shift from lazy content** — Lazy-loaded images, ads, and async content have explicit dimensions (`width`/`height` attributes or `aspect-ratio`) to prevent CLS
  - *PERFUX-01 · CLS < 0.1*

- ⚠️ 👁 **Skeleton screens or placeholders** — Content areas that load asynchronously show skeleton screens, shimmer effects, or placeholder content instead of blank space or spinners
  - *PERFUX-02*

- ⚠️ 👁 **Optimistic UI for common actions** — Frequent user actions (like, save, toggle) update the UI immediately before server confirmation, with error rollback
  - *PERFUX-03*

- 💡 👁 **Progressive loading for large lists** — Lists with 100+ items use virtual scrolling, pagination, or "load more" instead of rendering all items at once
  - *PERFUX-04*

- 💡 👁 **Above-the-fold content loads first** — Critical content and layout rendered without waiting for below-the-fold resources (images, third-party scripts)
  - *PERFUX-05*

- 💡 👁 **Debounce rapid inputs** — Search inputs, resize handlers, and scroll listeners use debounce/throttle to prevent excessive re-renders or API calls
  - *PERFUX-06*

---

## 10. Forms & Input UX (if applicable)

> Forms are easy to fill, validate clearly, and prevent errors.

- 🔒 👁 **Form data not lost on error** — Validation errors don't clear already-filled fields. User input is preserved when showing error messages
  - *FORM-01*

- ⚠️ 👁 **Inline validation with clear messages** — Validation errors appear next to the relevant field (not just a banner at top). Messages explain how to fix the error
  - *FORM-02*

- ⚠️ 👁 **Input types match data** — `type="email"` for email, `type="tel"` for phone, `type="number"` for numeric input, `type="url"` for URLs. Triggers correct mobile keyboard
  - *FORM-03*

- ⚠️ 👁 **Required fields marked** — Required fields have visual indicator (asterisk, label text) AND `required` attribute or `aria-required="true"`
  - *FORM-04*

- 💡 👁 **Autocomplete attributes set** — Common fields have `autocomplete` attribute (`name`, `email`, `tel`, `street-address`, etc.) for browser autofill
  - *FORM-05 · WCAG 1.3.5 Identify Input Purpose (AA)*

- 💡 👁 **Multi-step forms show progress** — Forms with 3+ steps show a progress indicator (step counter, progress bar) so users know how much remains
  - *FORM-06*

- 💡 👁 **Success state shown after submission** — Successful form submission shows a confirmation message, redirect, or visual state change
  - *FORM-07*

- 💡 👁 **Tab order follows visual flow** — Form fields can be filled sequentially using Tab key in the visual reading order
  - *FORM-08*

---

## Sources

### Key References

1. [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)
2. [Nielsen Norman Group: 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
3. [Material Design Guidelines](https://m3.material.io/)
4. [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
5. [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
6. [Inclusive Components](https://inclusive-components.design/)
7. [A11y Project Checklist](https://www.a11yproject.com/checklist/)
8. [Deque axe Rules](https://dequeuniversity.com/rules/axe/)
9. [Smashing Magazine: UX Checklists](https://www.smashingmagazine.com/category/ux-design)
10. [Google Web Fundamentals](https://developers.google.com/web/fundamentals)
