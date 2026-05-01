# CSS Code Review Checklist

**Version:** 0.1.0

## Changelog

- **0.1.0** - Initial release based on research from 50+ sources (WCAG, Google/Airbnb guides, web.dev, CSS Wizardry, Smashing Magazine)

---

## Purpose

**Review checklist** for CSS code reviews. This is a companion to:

- `css.md` — Coding standards (for **generating** code)
- `review-template.md` — Output format (for **structuring** review feedback)

This document defines **what to check**. Use `review-template.md` for how to format findings.

---

## How to Use

### Markers

| Marker | Meaning |
|--------|---------|
| 🔧 | **Automatable** — Stylelint/tools can catch this. Only check manually if tooling is missing. |
| 👁 | **Human review required** — Tools cannot reliably detect this. Always check manually. |

### Severity

| Icon | Level | Meaning |
|------|-------|---------|
| 🔒 | Critical | Accessibility or usability failure. Must fix before merge. |
| ⚠️ | Error | Performance/maintainability issue. Must fix before merge. |
| 💡 | Suggestion | Improvement. Recommended but not blocking. |

### Conditional Sections

Sections marked **(if applicable)** only apply when the codebase uses that technology. Skip if not relevant.

---

## Accessibility

> Every item here maps to WCAG 2.2 success criteria or documented accessibility guidance.

- 🔒 👁 **Focus outline preservation** — No `:focus { outline: none }` or `outline: 0` without a `:focus-visible` replacement that meets 3:1 contrast against adjacent colors
  - *A11Y-01 · WCAG 2.4.7 Focus Visible (A) · WCAG 1.4.11 Non-Text Contrast (AA)*

- 🔒 🔧 **Color contrast WCAG AA** — Text meets 4.5:1 (normal) / 3:1 (large text, 18pt+ or 14pt+ bold). UI components and graphics meet 3:1
  - *A11Y-02 · WCAG 1.4.3 Contrast Minimum (AA)*

- 🔒 👁 **prefers-reduced-motion for all animations** — Every `animation` and non-essential `transition` has a `@media (prefers-reduced-motion: reduce)` override. Global safety net or per-component
  - *A11Y-03 · WCAG 2.3.3 Animation from Interactions (AAA) · W3C C39 Technique*

- 🔒 👁 **overflow:hidden content at zoom** — `overflow: hidden` containers do not clip content at 200% browser zoom. Scrollable containers are keyboard-accessible (have `tabindex`, role, accessible name)
  - *A11Y-04 · WCAG 1.4.4 Resize Text (AA) · WCAG 1.4.10 Reflow (AA)*

- 🔒 👁 **text-overflow: ellipsis reviewed for content loss** — Truncated text verified against screen reader output (full text still in DOM creates visual/AT mismatch). Disclosure pattern or text wrapping preferred
  - *A11Y-05 · WCAG 1.4.10 Reflow (AA)*

- 🔒 👁 **Dark mode meets same contrast ratios** — All dark-mode color combinations independently tested for WCAG AA. Dark backgrounds with gray text is the most common failure
  - *A11Y-06 · WCAG 1.4.3*

---

## Specificity & Cascade

- ⚠️ 🔧 **No ID selectors** — Zero `#id` selectors used for styling. IDs are 255x more specific than classes
  - *SPEC-01 · Stylelint: selector-max-id*

- ⚠️ 🔧 **No reactive !important** — `!important` only used for utility classes (`.hidden`, `.sr-only`) or third-party overrides. Never to fix specificity wars
  - *SPEC-02 · Stylelint: declaration-no-important*

- ⚠️ 🔧 **Max nesting depth 2-3** — No selector chains deeper than 3 levels. Native CSS nesting and Sass nesting both limited
  - *SPEC-03 · Stylelint: max-nesting-depth, selector-max-compound-selectors*

- ⚠️ 🔧 **No descending specificity** — Lower-specificity selectors do not follow higher-specificity overrides in the same context
  - *SPEC-04 · Stylelint: no-descending-specificity*

- ⚠️ 👁 **Shorthand not silently overriding longhand** — Shorthand properties (`background`, `font`, `animation`) checked for resetting previously set longhands (e.g., `background: red` resets `background-image`)
  - *SPEC-05 · Stylelint: declaration-block-no-shorthand-property-overrides*

- 💡 🔧 **No qualified selectors** — Class selectors not prefixed with element types (`ul.nav` → `.nav`)
  - *SPEC-06 · Stylelint: selector-no-qualifying-type*

---

## Animation & Performance

- ⚠️ 🔧 **Only animate transform/opacity/filter** — No `transition` or `animation` on layout-triggering properties (width, height, margin, padding, top, left, border, box-shadow)
  - *PERF-01 · Custom Stylelint rule*

- ⚠️ 👁 **will-change only for measured problems** — `will-change` not blanket-applied. Each usage has a documented performance justification. No `* { will-change: transform }`
  - *PERF-02 · GPU layer memory cost: ~19MB per 800x600 element*

- ⚠️ 🔧 **font-display on every @font-face** — Body text uses `font-display: swap`. Decorative fonts use `font-display: optional`. No missing `font-display`
  - *PERF-03 · Custom Stylelint rule or postcss plugin*

- ⚠️ 🔧 **No @import for fonts/CSS** — All stylesheets and fonts loaded via `<link>` or `@font-face`, never `@import` (render-blocking, sequential)
  - *PERF-04 · Stylelint: no-invalid-at-import-rules (partial)*

- ⚠️ 👁 **CLS prevention** — Dynamic-height elements (ads, embeds, images, lazy content) have `min-height`, `aspect-ratio`, or explicit dimensions to prevent layout shift
  - *PERF-05 · CLS threshold: < 0.1*

- 💡 👁 **Transition duration 0.15s-0.3s** — Transitions provide instant feedback without feeling sluggish. Durations outside this range reviewed for justification
  - *PERF-06*

---

## Architecture & Maintainability

> For detailed coding rules (naming, BEM, layout patterns), see **css.md**.

- 💡 👁 **Z-index uses named tokens** — All z-index values defined as CSS custom properties (`--z-modal`, `--z-toast`). No magic numbers like `99999`
  - *ARCH-01 · css.md Z-Index Management*

- 💡 👁 **No magic numbers** — Hardcoded values like `top: 37px` or `margin-left: -3px` replaced with variables, calculations, or documented justification
  - *ARCH-02 · css.md Code Smells*

- 💡 👁 **No bare element selectors in components** — Component stylesheets use class selectors, not bare `header {}`, `a {}`, `ul {}` which affect the entire page
  - *ARCH-03 · css.md Code Smells*

- 💡 👁 **Consistent naming convention** — All class names follow the project's chosen convention (e.g. BEM, OOCSS) consistently. No mixing conventions
  - *ARCH-04 · css.md Naming Conventions*

- 💡 👁 **No undoing styles** — Declarations that reset previous styles (`border: none`, `padding: 0` to counteract) indicate the original rule was too broad. Build styles additively
  - *ARCH-05 · css.md Code Smells*

- 💡 👁 **Design tokens via custom properties** — Colors, spacing, typography, and shadows use CSS custom properties, not hardcoded values in component styles
  - *ARCH-06 · css.md Colors & Theming*

---

## Responsive Design (if applicable)

- 💡 👁 **Mobile-first media queries** — Uses `min-width` queries to layer enhancements progressively. Not `max-width` desktop-first
  - *RESP-01 · css.md Layout*

- 💡 👁 **Content-driven breakpoints** — Breakpoints set where content breaks, not at device widths (768px for "iPad")
  - *RESP-02 · css.md Layout*

- 💡 👁 **Logical properties for i18n** — `margin-inline-start` instead of `margin-left`, `inline-size` instead of `width`. Required if RTL support needed
  - *RESP-03 · css.md Layout*

- 💡 👁 **Grid for 2D, Flexbox for 1D** — Page-level layouts use Grid. Component alignment uses Flexbox. No Flexbox `flex-wrap` hacks for grid layouts
  - *RESP-04 · css.md Layout*

---

## Performance (if applicable)

- ⚠️ 👁 **Critical CSS inlined** — Above-the-fold CSS inlined in `<head>`. Non-critical CSS deferred with `media` attributes or async loading
  - *LOAD-01*

- ⚠️ 🔧 **Unused CSS removed** — Production stylesheets contain no dead rules. Verified with PurgeCSS or Chrome DevTools Coverage
  - *LOAD-02*

- 💡 👁 **content-visibility for long content** — Lists, feeds, and comment threads with many items use `content-visibility: auto` with `contain-intrinsic-size` for off-screen rendering optimization
  - *LOAD-03 · Benchmark: 232ms → 30ms (7x improvement)*

- 💡 👁 **CSS containment for isolation** — Independent widget/component sections use `contain: content` to skip layout recalculation when other page parts change
  - *LOAD-04*

- 💡 👁 **CSS split by media query** — Print CSS uses `media="print"`. Mobile-specific CSS uses appropriate `media` attribute to avoid render-blocking desktop
  - *LOAD-05*

---

## CSS-in-JS (if applicable)

- ⚠️ 👁 **Zero-runtime preferred** — CSS-in-JS uses build-time extraction (vanilla-extract, Panda CSS, Linaria, CSS Modules) over runtime generation (styled-components, Emotion)
  - *CSSJS-01*

- 💡 👁 **Styles co-located with components** — Style definitions adjacent to or in the same file as the component they style. No disconnected `styles/` directories
  - *CSSJS-02*

---

## Tailwind (if applicable)

- 💡 🔧 **Consistent class ordering** — `prettier-plugin-tailwindcss` or `eslint-plugin-tailwindcss` enforces consistent utility class order
  - *TW-01*

- 💡 👁 **Repeated patterns extracted** — Same utility class sets appearing 3+ times extracted into components or `@apply` directives
  - *TW-02*

- 💡 🔧 **No arbitrary values for design tokens** — Colors, spacing, fonts defined in `tailwind.config.js`. No `[37px]` or `[#1a73e8]` for values that should be tokens
  - *TW-03 · eslint-plugin-tailwindcss: no-arbitrary-value*

---

## Automation Reference

### Stylelint Plugin Mapping

Rules marked 🔧 can be automated. Key configurations:

| Configuration | Covers |
|---------------|--------|
| `stylelint-config-recommended` | Duplicate selectors, invalid hex, shorthand overrides, unknown properties (19 rules) |
| `stylelint-config-standard` | !important, ID selectors, naming patterns, zero units, redundant values |
| Custom rules | Animation properties, font-display checks, z-index thresholds |

### Key Stylelint Rules

| Rule | Detects | Severity |
|------|---------|----------|
| `selector-max-id` | ID selectors used for styling | Error |
| `declaration-no-important` | !important usage | Error |
| `max-nesting-depth` | Nesting deeper than threshold | Error |
| `no-descending-specificity` | Specificity order violations | Error |
| `declaration-block-no-shorthand-property-overrides` | Shorthand silently resetting longhand | Error |
| `selector-no-qualifying-type` | Qualified selectors (ul.nav) | Suggestion |
| `custom-property-pattern` | Inconsistent custom property naming | Suggestion |
| `selector-class-pattern` | Inconsistent class naming | Suggestion |
| `color-no-invalid-hex` | Invalid hex color values | Error |
| `property-no-unknown` | Typos in property names | Error |

---

## Sources

### Key References

1. [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
2. [Airbnb CSS/Sass Style Guide](https://github.com/airbnb/css)
3. [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)
4. [WCAG 2.2 — Focus Visible (2.4.7)](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
5. [WebAIM: Contrast and Color Accessibility](https://webaim.org/articles/contrast/)
6. [web.dev: Core Web Vitals](https://web.dev/articles/vitals)
7. [web.dev: Font Best Practices](https://web.dev/articles/font-best-practices)
8. [Smashing Magazine: CSS GPU Animation](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
9. [Smashing Magazine: Z-Index in Large Projects](https://www.smashingmagazine.com/2021/02/css-z-index-large-projects/)
10. [Stylelint Rules Reference](https://stylelint.io/user-guide/rules/)

### Full Research

All 50+ sources with detailed rule extraction:
`~/.claude/private/research/css-code-review-criteria.md`
