---
status: accepted
---
# CSS Coding Standards

**Based on:** Google/Airbnb CSS Guides + WCAG 2.2 + web.dev Performance

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

## Indentation

**Use 2 spaces.** No tabs.

```css
/* Good — 2 spaces */
.card {
  display: flex;
  align-items: center;
}
```

---

## Selectors & Specificity

### Class Selectors Only — No IDs for Styling

IDs are 255x more specific than classes and cannot be reused.

```css
/* Good */
.site-header { }
.nav-link { }

/* Bad */
#header { }
#nav a { }
```

### No Qualified Selectors

Don't prefix classes with element types. It reduces reusability and raises specificity.

```css
/* Good */
.nav { }
.button { }

/* Bad */
ul.nav { }
a.button { }
```

### Maximum 2-3 Levels of Nesting

Deep nesting creates high specificity and fragile selectors.

```css
/* Good — flat */
.card { }
.card__title { }
.card__title--highlighted { }

/* Bad — deeply nested */
.page .content .card .card-body .card-title span { }
```

### No Descending Specificity

Lower-specificity selectors should not follow higher-specificity selectors in the same context.

```css
/* Good — specificity increases */
.card { color: black; }
.card.is-featured { color: blue; }

/* Bad — specificity decreases */
.card.is-featured { color: blue; }
.card { color: black; }   /* This override is confusing */
```

### Use @layer for Third-Party CSS

Cascade layers control override order without `!important`.

```css
@layer reset, vendor, base, components, utilities;
@import url("vendor.css") layer(vendor);

@layer components {
    .modal { display: flex; }
}
```

---

## Naming Conventions

### BEM Pattern

Use `.block__element--modifier` for component styles.

```css
/* Good — BEM */
.ListingCard { }
.ListingCard__title { }
.ListingCard__title--featured { }

/* Bad — ambiguous */
.card { }
.title { }
.featured { }
```

### .js- Prefix for JavaScript Hooks

Never bind JS behavior and CSS styles to the same class.

```html
<!-- Good — separate concerns -->
<button class="btn btn--primary js-submit">Submit</button>
```

```css
/* .js- classes never appear in stylesheets */
.btn { padding: 8px 16px; }
.btn--primary { background: blue; }
```

### CSS Custom Properties: kebab-case

Custom properties are case-sensitive. Use consistent kebab-case.

```css
/* Good */
:root {
    --primary-color: #0066cc;
    --spacing-md: 16px;
    --font-size-base: 16px;
}
```

---

## Layout

### Grid for 2D, Flexbox for 1D

Use CSS Grid for page-level layouts (rows AND columns). Use Flexbox for component-level alignment (row OR column).

```css
/* Grid for page structure */
.page-layout {
    display: grid;
    grid-template-columns: 1fr 3fr;
    gap: 24px;
}

/* Flexbox for component alignment */
.nav-bar {
    display: flex;
    align-items: center;
    gap: 16px;
}
```

### Logical Properties

Use logical properties instead of physical properties for internationalization readiness.

```css
/* Good — adapts to RTL automatically */
.sidebar {
    margin-inline-start: 16px;
    padding-block-end: 24px;
    inline-size: 250px;
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
.container { padding: 16px; }

@media (min-width: 768px) {
    .container { padding: 24px; }
}

@media (min-width: 1200px) {
    .container { padding: 32px; }
}
```

### Content-Driven Breakpoints

Set breakpoints where your content breaks, not at device widths.

```css
/* Good — content-driven */
@media (min-width: 42em) { /* when sidebar text wraps */ }

/* Bad — device-driven */
@media (min-width: 768px) { /* "iPad" */ }
```

---

## Animation & Transitions

### Only Animate transform, opacity, filter

These are compositor-thread properties — no main-thread reflow needed.

```css
/* Good — GPU-accelerated */
.card {
    transition: transform 0.2s ease, opacity 0.2s ease;
}
.card:hover {
    transform: translateY(-2px);
    opacity: 0.9;
}
```

**Properties that trigger layout (never animate):**
- `width`, `height`, `border`, `padding`, `margin`
- `top`, `bottom`, `left`, `right`
- `box-shadow`, `font-size`

### prefers-reduced-motion Override Required

Every animation must have a reduced-motion alternative.

```css
/* Global safety net */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Transition Duration: 0.15s-0.3s ease

```css
/* Good — instant feedback */
.link { transition: color 0.15s ease; }
.modal { transition: opacity 0.2s ease; }

/* Bad — too slow */
.link { transition: color 0.8s ease; }
```

---

## Accessibility

### Never Remove Focus Outlines Without :focus-visible Replacement

Removing outlines violates WCAG 2.4.7 (Focus Visible, Level A).

```css
/* Good — visible for keyboard, hidden for mouse */
:focus-visible {
    outline: 3px solid black;
    outline-offset: 2px;
}

/* Bad — removes all focus indicators */
:focus { outline: none; }
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

### text-overflow: ellipsis Is a Design Smell

Truncated text creates mismatches between visual and screen reader content. Prefer `overflow-wrap: break-word` with `hyphens: auto`.

---

## Performance

### Critical CSS Inline, Defer the Rest

CSS is render-blocking. Inline above-the-fold critical CSS in `<head>`.

```html
<head>
    <style>
        /* Only above-the-fold styles */
        body { margin: 0; font-family: sans-serif; }
        .hero { min-height: 100vh; }
    </style>
    <link rel="stylesheet" href="full.css" media="print" onload="this.media='all'">
</head>
```

### min-height for CLS Prevention

Prevent content jumping when elements load.

```css
.ad-slot { min-height: 250px; }
.hero-image { aspect-ratio: 16 / 9; }
```

### Remove Unused CSS

Use PurgeCSS or Chrome DevTools Coverage to identify and remove dead CSS.

---

## Code Smells & Anti-Patterns

### No !important

Except for utility classes and third-party overrides.

```css
/* Good — utility exception */
.hidden { display: none !important; }
.sr-only { position: absolute !important; }

/* Bad — reactive !important */
.nav-link {
    color: blue !important;  /* Fighting another selector */
}
```

### No Magic Numbers

Every numeric value should be self-evident or derived from a variable.

```css
/* Good — self-evident or derived */
.element {
    width: 100%;
    margin-block-start: var(--spacing-md);
    line-height: 1.5;
}

/* Bad — magic numbers */
.element {
    width: 137px;
    margin-top: 37px;
    line-height: 1.28;
}
```

### No Undoing Styles

If you're resetting, the original rule was too broad.

```css
/* Good — additive approach */
.nav-item { }
.nav-item--bordered { border-bottom: 1px solid #ccc; }

/* Bad — undo approach */
.nav-item { border-bottom: 1px solid #ccc; }
.nav-item:last-child { border-bottom: none; }  /* Undoing */
```

### No Bare Element Selectors in Components

Bare element selectors reach unintended elements across the page.

```css
/* Good — scoped class */
.article__header { }
.article__link { }

/* Bad — bare elements */
header { }
a { color: blue; }
```

### Shorthand Overrides

Shorthand properties silently reset omitted longhands.

```css
/* Caution — shorthand resets other values */
.element {
    background-image: url('bg.png');
    background: red;  /* Silently resets background-image to none */
}

/* Good — explicit longhand */
.element {
    background-image: url('bg.png');
    background-color: red;
}
```

---

## Quick Reference

### CSS Checklist

- Class selectors only (no IDs for styling)
- Max 2-3 levels nesting
- BEM or consistent naming convention
- `font-display` on every `@font-face`
- WOFF2 only, no `@import` for fonts
- Only animate `transform`, `opacity`, `filter`
- `prefers-reduced-motion` for all animations
- Focus outlines preserved (`:focus-visible`)
- WCAG AA contrast (4.5:1 text, 3:1 UI)
- Z-index via named custom properties
- No `!important` (except utilities)
- No magic numbers
- CSS custom properties for design tokens
- Mobile-first media queries (`min-width`)
- Logical properties for i18n readiness
- Critical CSS inlined, rest deferred
- `min-height`/`aspect-ratio` for CLS prevention

---

## Additional Resources

For detailed examples and advanced patterns, see [css-reference.md](css-reference.md).

---

*Flat specificity, additive styles, accessible by default.*
