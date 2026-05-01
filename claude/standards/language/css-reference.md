---
status: proposed
---
# CSS Standards — Reference

Detailed examples and patterns. See [css.md](css.md) for core rules.

---

## Typography & Fonts

### font-display Required on Every @font-face

Without `font-display`, browsers block text rendering for up to 3 seconds (FOIT).

```css
/* Good — text visible immediately */
@font-face {
    font-family: 'Inter';
    src: url('inter.woff2') format('woff2');
    font-display: swap;
}

/* Good — decorative/non-critical fonts */
@font-face {
    font-family: 'Fancy';
    src: url('fancy.woff2') format('woff2');
    font-display: optional;
}

/* Bad — missing font-display */
@font-face {
    font-family: 'Inter';
    src: url('inter.woff2') format('woff2');
}
```

### WOFF2 Only

WOFF2 uses Brotli compression (30% smaller than WOFF). Browser support is 97%+.

```css
/* Good */
src: url('font.woff2') format('woff2');

/* Bad — unnecessary fallback formats */
src: url('font.woff2') format('woff2'),
     url('font.woff') format('woff'),
     url('font.ttf') format('truetype');
```

### Never Use @import for Fonts

`@import` is render-blocking and sequential, delaying font discovery.

```html
<!-- Good — preload + inline @font-face -->
<link rel="preload" href="inter.woff2" as="font" type="font/woff2" crossorigin>
<style>
    @font-face {
        font-family: 'Inter';
        src: url('inter.woff2') format('woff2');
        font-display: swap;
    }
</style>

<!-- Bad — @import in CSS -->
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter');
</style>
```

### size-adjust for CLS Reduction

Match fallback font metrics to reduce layout shift when the web font loads.

```css
/* Good — minimizes CLS on font swap */
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
/* Good — design tokens */
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

/* Bad — hardcoded values */
.card {
    color: #1a1a1a;
    background: #ffffff;
    border: 1px solid #e0e0e0;
}
```

### prefers-color-scheme Support

Respect the user's system theme preference.

```css
/* Good — system-aware theming */
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
/* Good — modern approach */
:root { color-scheme: light dark; }

body {
    color: light-dark(#1a1a1a, #e0e0e0);
    background: light-dark(#ffffff, #1a1a1a);
}
```

### All Themes Must Meet WCAG AA Contrast

Dark mode must meet the same contrast ratios as light mode.

```css
/* Good — both modes pass 4.5:1 contrast */
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

/* Bad — dark mode fails contrast */
@media (prefers-color-scheme: dark) {
    :root {
        --color-text: #666666;  /* 2.6:1 on #1a1a1a — FAILS */
        --color-bg: #1a1a1a;
    }
}
```

---

## Animation & Transitions (Advanced)

### will-change: Only for Measured Problems

Each `will-change: transform` promotes an element to its own GPU layer, consuming significant memory.

```css
/* Good — applied to specific, measured element */
.heavy-animation {
    will-change: transform;
}

/* Bad — blanket application */
* {
    will-change: transform;
}

/* Bad — applied without measurement */
.card {
    will-change: transform, opacity, filter;
}
```

### Per-Component Reduced Motion Override

```css
/* Per-component override */
.carousel {
    animation: slide 5s infinite;
}

@media (prefers-reduced-motion: reduce) {
    .carousel {
        animation: none;
    }
}
```

---

## Accessibility (Advanced)

### overflow:hidden Content Check at Zoom

Content hidden with `overflow: hidden` is inaccessible at higher zoom levels.

```css
/* Good — scrollable and keyboard-accessible */
.scrollable-area {
    overflow: auto;
    max-height: 400px;
}

/* Caution — verify content isn't clipped at 200% zoom */
.card-description {
    overflow: hidden;
    max-height: 80px;
}
```

### text-overflow: ellipsis Alternatives

Truncated text creates mismatches between visual and screen reader content.

```css
/* Caution — review for content loss */
.truncated {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Better — allow wrapping with hyphens */
.text {
    overflow-wrap: break-word;
    hyphens: auto;
}
```

---

## Performance (Advanced)

### content-visibility: auto for Off-Screen Content

Rendering time can drop from 232ms to 30ms (7x improvement).

```css
/* Good — skip rendering for off-screen items */
.feed-item {
    content-visibility: auto;
    contain-intrinsic-size: auto 200px;
}
```

### CSS Containment

Use the `contain` property to isolate components from page layout recalculation.

```css
/* Good — isolated component */
.widget {
    contain: content;
}
```

---

## Z-Index Management

### Named Custom Properties

Define all z-index values in a centralized location.

```css
/* Good — named constants */
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

/* Bad — magic numbers */
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

## CSS-in-JS

### Prefer Zero-Runtime Solutions

Runtime CSS-in-JS generates styles on every render.

```
Zero-runtime (build-time extraction):
  - vanilla-extract
  - Panda CSS
  - Linaria
  - CSS Modules

Runtime (generates styles in JS) — avoid:
  - styled-components
  - Emotion
```

### Co-locate Styles with Components

Keep style definitions adjacent to the component they style.

```
Good:
  Button/
  ├── Button.tsx
  └── Button.css.ts    (or Button.module.css)

Bad:
  components/Button.tsx
  styles/buttons.css    (disconnected)
```

---

## Tailwind

### Consistent Class Ordering

Use `prettier-plugin-tailwindcss` for automatic sorting.

```html
<!-- Good — sorted: layout > spacing > typography > visual -->
<div class="flex items-center gap-4 p-4 text-sm font-medium bg-white rounded">

<!-- Bad — random order -->
<div class="font-medium bg-white flex p-4 rounded text-sm gap-4 items-center">
```

### Extract Repeated Patterns into Components

When the same utility classes appear 3+ times, extract.

### Theme in tailwind.config.js, No Arbitrary Values

```html
<!-- Good — uses design tokens -->
<div class="p-4 text-primary bg-surface">

<!-- Bad — arbitrary values bypass design system -->
<div class="p-[37px] text-[#1a73e8] bg-[#fafafa]">
```
