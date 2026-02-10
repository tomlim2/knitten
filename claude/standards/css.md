# CSS Coding Standards

**Version:** 0.1.0
**Based on:** Google/Airbnb CSS Guides + WCAG 2.2 + web.dev Performance

## Changelog

- **0.1.0** - Initial release based on research from 50+ sources

---

## Philosophy

### Core Principles

1. **Readability > Cleverness** - Flat, predictable selectors beat clever cascades
2. **Low Specificity** - Keep specificity flat; escalation is a one-way street
3. **Additive Styles** - Build up, never undo — if you're resetting, the base was too broad
4. **Performance by Default** - Animate only compositor properties, inline critical CSS, defer the rest
5. **Accessibility First** - Focus indicators, contrast ratios, and reduced-motion are not optional

**Inspired by:**
- [Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html)
- [Airbnb CSS/Sass Style Guide](https://github.com/airbnb/css)
- [CSS Wizardry: Code Smells in CSS](https://csswizardry.com/2012/11/code-smells-in-css/)

---

## Selectors & Specificity

### Class Selectors Only — No IDs for Styling

IDs are 255x more specific than classes and cannot be reused.

```css
/* ✅ Good */
.site-header { }
.nav-link { }

/* ❌ Bad */
#header { }
#nav a { }
```

### No Qualified Selectors

Don't prefix classes with element types. It reduces reusability and raises specificity.

```css
/* ✅ Good */
.nav { }
.button { }

/* ❌ Bad */
ul.nav { }
a.button { }
```

### Maximum 2-3 Levels of Nesting

Deep nesting creates high specificity and fragile selectors.

```css
/* ✅ Good — flat */
.card { }
.card__title { }
.card__title--highlighted { }

/* ❌ Bad — deeply nested */
.page .content .card .card-body .card-title span { }
```

### No Descending Specificity

Lower-specificity selectors should not follow higher-specificity selectors in the same context.

```css
/* ✅ Good — specificity increases */
.card { color: black; }
.card.is-featured { color: blue; }

/* ❌ Bad — specificity decreases */
.card.is-featured { color: blue; }
.card { color: black; }   /* This override is confusing */
```

### Use @layer for Third-Party CSS

Cascade layers control override order without `!important`.

```css
/* ✅ Good — structured layers */
@layer reset, vendor, base, components, utilities;
@import url("vendor.css") layer(vendor);

/* Your component styles override vendor without !important */
@layer components {
    .modal { display: flex; }
}
```

---

## Naming Conventions

### BEM Pattern

Use `.block__element--modifier` for component styles.

```css
/* ✅ Good — BEM */
.ListingCard { }
.ListingCard__title { }
.ListingCard__title--featured { }

/* ❌ Bad — ambiguous */
.card { }
.title { }
.featured { }
```

### .js- Prefix for JavaScript Hooks

Never bind JS behavior and CSS styles to the same class.

```html
<!-- ✅ Good — separate concerns -->
<button class="btn btn--primary js-submit">Submit</button>

<!-- ❌ Bad — CSS and JS share the same class -->
<button class="submit-button">Submit</button>
```

```css
/* ✅ Good — .js- classes never appear in stylesheets */
.btn { padding: 8px 16px; }
.btn--primary { background: blue; }
```

### CSS Custom Properties: kebab-case

Custom properties are case-sensitive. Use consistent kebab-case.

```css
/* ✅ Good */
:root {
    --primary-color: #0066cc;
    --spacing-md: 16px;
    --font-size-base: 16px;
}

/* ❌ Bad — inconsistent */
:root {
    --primaryColor: #0066cc;
    --Spacing_md: 16px;
}
```

---

## Layout

### Grid for 2D, Flexbox for 1D

Use CSS Grid for page-level layouts (rows AND columns). Use Flexbox for component-level alignment (row OR column).

```css
/* ✅ Good — Grid for page structure */
.page-layout {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 24px;
}

/* ✅ Good — Flexbox for component alignment */
.nav-bar {
    display: flex;
    align-items: center;
    gap: 16px;
}

/* ❌ Bad — Flexbox for 2D grid layout */
.card-grid {
    display: flex;
    flex-wrap: wrap;
}
```

### Logical Properties

Use logical properties instead of physical properties for internationalization readiness.

```css
/* ✅ Good — adapts to RTL automatically */
.sidebar {
    margin-inline-start: 16px;
    padding-block-end: 24px;
    inline-size: 250px;
}

/* ❌ Bad — breaks in RTL */
.sidebar {
    margin-left: 16px;
    padding-bottom: 24px;
    width: 250px;
}
```

**Mapping:**
- `margin-left` → `margin-inline-start`
- `padding-right` → `padding-inline-end`
- `width` → `inline-size`
- `height` → `block-size`
- `top` → `inset-block-start`

### Mobile-First Media Queries

Use `min-width` (mobile-first) to layer enhancements progressively.

```css
/* ✅ Good — mobile-first */
.container { padding: 16px; }

@media (min-width: 768px) {
    .container { padding: 24px; }
}

@media (min-width: 1200px) {
    .container { padding: 32px; }
}

/* ❌ Bad — desktop-first */
.container { padding: 32px; }

@media (max-width: 1199px) {
    .container { padding: 24px; }
}

@media (max-width: 767px) {
    .container { padding: 16px; }
}
```

### Content-Driven Breakpoints

Set breakpoints where your content breaks, not at device widths.

```css
/* ✅ Good — content-driven */
@media (min-width: 42em) { /* when sidebar text wraps */ }

/* ❌ Bad — device-driven */
@media (min-width: 768px) { /* "iPad" */ }
```

---

## Typography & Fonts

### font-display Required on Every @font-face

Without `font-display`, browsers block text rendering for up to 3 seconds (FOIT).

```css
/* ✅ Good — text visible immediately */
@font-face {
    font-family: 'Inter';
    src: url('inter.woff2') format('woff2');
    font-display: swap;
}

/* ✅ Good — decorative/non-critical fonts */
@font-face {
    font-family: 'Fancy';
    src: url('fancy.woff2') format('woff2');
    font-display: optional;
}

/* ❌ Bad — missing font-display */
@font-face {
    font-family: 'Inter';
    src: url('inter.woff2') format('woff2');
}
```

### WOFF2 Only

WOFF2 uses Brotli compression (30% smaller than WOFF). Browser support is 97%+.

```css
/* ✅ Good */
src: url('font.woff2') format('woff2');

/* ❌ Bad — unnecessary fallback formats */
src: url('font.woff2') format('woff2'),
     url('font.woff') format('woff'),
     url('font.ttf') format('truetype');
```

### Never Use @import for Fonts

`@import` is render-blocking and sequential, delaying font discovery.

```html
<!-- ✅ Good — preload + inline @font-face -->
<link rel="preload" href="inter.woff2" as="font" type="font/woff2" crossorigin>
<style>
    @font-face {
        font-family: 'Inter';
        src: url('inter.woff2') format('woff2');
        font-display: swap;
    }
</style>

<!-- ❌ Bad — @import in CSS -->
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter');
</style>
```

### size-adjust for CLS Reduction

Match fallback font metrics to reduce layout shift when the web font loads.

```css
/* ✅ Good — minimizes CLS on font swap */
@font-face {
    font-family: 'Inter';
    src: url('inter.woff2') format('woff2');
    font-display: swap;
    size-adjust: 107%;
}
```

---

## Colors & Theming

### CSS Custom Properties for Design Tokens

All colors defined as custom properties. Never hardcode hex values in component styles.

```css
/* ✅ Good — design tokens */
:root {
    --color-text: #1a1a1a;
    --color-bg: #ffffff;
    --color-primary: #0066cc;
    --color-border: #e0e0e0;
}

.card {
    color: var(--color-text);
    background: var(--color-bg);
    border: 1px solid var(--color-border);
}

/* ❌ Bad — hardcoded values */
.card {
    color: #1a1a1a;
    background: #ffffff;
    border: 1px solid #e0e0e0;
}
```

### prefers-color-scheme Support

Respect the user's system theme preference.

```css
/* ✅ Good — system-aware theming */
:root {
    color-scheme: light dark;
    --color-text: #1a1a1a;
    --color-bg: #ffffff;
}

@media (prefers-color-scheme: dark) {
    :root {
        --color-text: #e0e0e0;
        --color-bg: #1a1a1a;
    }
}
```

### light-dark() Function (Modern)

Simplifies theme declarations by eliminating separate media query blocks.

```css
/* ✅ Good — modern approach */
:root { color-scheme: light dark; }

body {
    color: light-dark(#1a1a1a, #e0e0e0);
    background: light-dark(#ffffff, #1a1a1a);
}
```

### All Themes Must Meet WCAG AA Contrast

Dark mode must meet the same contrast ratios as light mode.

```css
/* ✅ Good — both modes pass 4.5:1 contrast */
:root {
    --color-text: #1a1a1a;    /* 13.5:1 on white */
    --color-bg: #ffffff;
}

@media (prefers-color-scheme: dark) {
    :root {
        --color-text: #e0e0e0; /* 12.7:1 on #1a1a1a */
        --color-bg: #1a1a1a;
    }
}

/* ❌ Bad — dark mode fails contrast */
@media (prefers-color-scheme: dark) {
    :root {
        --color-text: #666666;  /* 2.6:1 on #1a1a1a — FAILS */
        --color-bg: #1a1a1a;
    }
}
```

---

## Animation & Transitions

### Only Animate transform, opacity, filter

These are compositor-thread properties — no main-thread reflow needed.

```css
/* ✅ Good — GPU-accelerated */
.card {
    transition: transform 0.2s ease, opacity 0.2s ease;
}
.card:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}

/* ❌ Bad — triggers layout on every frame */
.card {
    transition: margin-top 0.2s ease, box-shadow 0.2s ease;
}
.card:hover {
    margin-top: -2px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
```

**Properties that trigger layout (never animate):**
- `width`, `height`, `border`, `padding`, `margin`
- `top`, `bottom`, `left`, `right`
- `box-shadow`, `font-size`

### will-change: Only for Measured Problems

Each `will-change: transform` promotes an element to its own GPU layer, consuming significant memory.

```css
/* ✅ Good — applied to specific, measured element */
.heavy-animation {
    will-change: transform;
}

/* ❌ Bad — blanket application */
* {
    will-change: transform;
}

/* ❌ Bad — applied without measurement */
.card {
    will-change: transform, opacity, filter;
}
```

### prefers-reduced-motion Override Required

Every animation must have a reduced-motion alternative.

```css
/* ✅ Good — global safety net */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* ✅ Good — per-component override */
.carousel {
    animation: slide 5s infinite;
}

@media (prefers-reduced-motion: reduce) {
    .carousel {
        animation: none;
    }
}
```

### Transition Duration: 0.15s-0.3s ease

```css
/* ✅ Good — instant feedback */
.link { transition: color 0.15s ease; }
.modal { transition: opacity 0.2s ease; }

/* ❌ Bad — too slow */
.link { transition: color 0.8s ease; }
```

---

## Accessibility

### Never Remove Focus Outlines Without :focus-visible Replacement

Removing outlines violates WCAG 2.4.7 (Focus Visible, Level A).

```css
/* ✅ Good — visible for keyboard, hidden for mouse */
:focus-visible {
    outline: 3px solid black;
    outline-offset: 2px;
}

/* ❌ Bad — removes all focus indicators */
:focus {
    outline: none;
}

/* ❌ Bad — global reset destroys accessibility */
* { outline: none; }
```

### Color Contrast: 4.5:1 Text, 3:1 Large/UI

```
Level AA:
  - Normal text: 4.5:1
  - Large text (18pt+ or 14pt+ bold): 3:1
  - UI components and graphics: 3:1

Level AAA:
  - Normal text: 7:1
  - Large text: 4.5:1
```

### overflow:hidden Content Check at Zoom

Content hidden with `overflow: hidden` is inaccessible at higher zoom levels.

```css
/* ✅ Good — scrollable and keyboard-accessible */
.scrollable-area {
    overflow: auto;
    max-height: 400px;
}

/* ⚠️ Caution — verify content isn't clipped at 200% zoom */
.card-description {
    overflow: hidden;
    max-height: 80px;
}
```

### text-overflow: ellipsis Is a Design Smell

Truncated text creates mismatches between visual and screen reader content.

```css
/* ⚠️ Caution — review for content loss */
.truncated {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ✅ Better — allow wrapping with hyphens */
.text {
    overflow-wrap: break-word;
    hyphens: auto;
}
```

---

## Performance

### Critical CSS Inline, Defer the Rest

CSS is render-blocking. Inline above-the-fold critical CSS in `<head>`.

```html
<!-- ✅ Good — critical CSS inlined -->
<head>
    <style>
        /* Only above-the-fold styles */
        body { margin: 0; font-family: sans-serif; }
        .hero { min-height: 100vh; }
    </style>
    <link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
</head>
```

### Remove Unused CSS

Unused CSS increases file size and parse time. Use PurgeCSS or Chrome DevTools Coverage.

### content-visibility: auto for Off-Screen Content

Rendering time can drop from 232ms to 30ms (7x improvement).

```css
/* ✅ Good — skip rendering for off-screen items */
.feed-item {
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
}
```

### CSS Containment

Use the `contain` property to isolate components from page layout recalculation.

```css
/* ✅ Good — isolated component */
.widget {
    contain: content;
}
```

### min-height for CLS Prevention

Prevent content jumping when elements load.

```css
/* ✅ Good — reserve space */
.ad-slot { min-height: 250px; }
.hero-image { aspect-ratio: 16 / 9; }

/* ❌ Bad — no space reserved, causes layout shift */
.ad-slot { }
```

---

## Z-Index Management

### Named Custom Properties

Define all z-index values in a centralized location.

```css
/* ✅ Good — named constants */
:root {
    --z-base: 0;
    --z-dropdown: 10;
    --z-sticky: 20;
    --z-overlay: 30;
    --z-modal: 40;
    --z-toast: 50;
}

.modal { z-index: var(--z-modal); }
.toast { z-index: var(--z-toast); }

/* ❌ Bad — magic numbers */
.modal { z-index: 99999; }
.toast { z-index: 100000; }
```

### Understand Stacking Contexts

These properties create new stacking contexts:
- `position: relative/absolute` + `z-index`
- `transform` (any value)
- `opacity` < 1
- `will-change`
- `position: fixed/sticky`
- `isolation: isolate`
- `filter` (any value)

An element with `z-index: 1000` in one stacking context will NOT appear above `z-index: 10` in a different stacking context.

---

## Code Smells & Anti-Patterns

### No !important

Except for utility classes and third-party overrides.

```css
/* ✅ Good — utility exception */
.hidden { display: none !important; }
.sr-only { position: absolute !important; }

/* ❌ Bad — reactive !important */
.nav-link {
    color: blue !important;  /* Fighting another selector */
}
```

### No Magic Numbers

Every numeric value should be self-evident or derived from a variable.

```css
/* ✅ Good — self-evident or derived */
.element {
    width: 100%;
    margin-block-start: var(--spacing-md);
    line-height: 1.5;
}

/* ❌ Bad — magic numbers */
.element {
    width: 137px;
    margin-top: 37px;
    line-height: 1.28;
}
```

### No Undoing Styles

If you're resetting, the original rule was too broad.

```css
/* ✅ Good — additive approach */
.nav-item { }
.nav-item--bordered { border-bottom: 1px solid #ccc; }

/* ❌ Bad — undo approach */
.nav-item { border-bottom: 1px solid #ccc; }
.nav-item:last-child { border-bottom: none; }  /* Undoing */
```

### No Bare Element Selectors in Components

Bare element selectors reach unintended elements across the page.

```css
/* ✅ Good — scoped class */
.article__header { }
.article__link { }

/* ❌ Bad — bare elements */
header { }
a { color: blue; }
```

### Shorthand Overrides

Shorthand properties silently reset omitted longhands.

```css
/* ⚠️ Caution — shorthand resets other values */
.element {
    background-image: url('bg.png');
    background: red;  /* Silently resets background-image to none */
}

/* ✅ Good — explicit longhand */
.element {
    background-image: url('bg.png');
    background-color: red;
}
```

---

## CSS-in-JS (if applicable)

### Prefer Zero-Runtime Solutions

Runtime CSS-in-JS generates styles on every render.

```
✅ Zero-runtime (build-time extraction):
  - vanilla-extract
  - Panda CSS
  - Linaria
  - CSS Modules

❌ Runtime (generates styles in JS):
  - styled-components
  - Emotion
```

### Co-locate Styles with Components

Keep style definitions adjacent to the component they style.

```
✅ Good:
  Button/
  ├── Button.tsx
  └── Button.css.ts    (or Button.module.css)

❌ Bad:
  components/Button.tsx
  styles/buttons.css    (disconnected)
```

---

## Tailwind (if applicable)

### Consistent Class Ordering

Use `prettier-plugin-tailwindcss` for automatic sorting.

```html
<!-- ✅ Good — sorted: layout → spacing → typography → visual -->
<div class="flex items-center gap-4 p-4 text-sm font-medium bg-white rounded">

<!-- ❌ Bad — random order -->
<div class="font-medium bg-white flex p-4 rounded text-sm gap-4 items-center">
```

### Extract Repeated Patterns into Components

When the same utility classes appear 3+ times, extract.

### Theme in tailwind.config.js, No Arbitrary Values

```html
<!-- ✅ Good — uses design tokens -->
<div class="p-4 text-primary bg-surface">

<!-- ❌ Bad — arbitrary values bypass design system -->
<div class="p-[37px] text-[#1a73e8] bg-[#fafafa]">
```

---

## Quick Reference

### CSS Checklist

- ✅ Class selectors only (no IDs for styling)
- ✅ Max 2-3 levels nesting
- ✅ BEM or consistent naming convention
- ✅ `font-display` on every `@font-face`
- ✅ WOFF2 only, no `@import` for fonts
- ✅ Only animate `transform`, `opacity`, `filter`
- ✅ `prefers-reduced-motion` for all animations
- ✅ Focus outlines preserved (`:focus-visible`)
- ✅ WCAG AA contrast (4.5:1 text, 3:1 UI)
- ✅ Z-index via named custom properties
- ✅ No `!important` (except utilities)
- ✅ No magic numbers
- ✅ CSS custom properties for design tokens
- ✅ Mobile-first media queries (`min-width`)
- ✅ Logical properties for i18n readiness
- ✅ Critical CSS inlined, rest deferred
- ✅ `min-height`/`aspect-ratio` for CLS prevention

---

*Flat specificity, additive styles, accessible by default.*
