# Design System - TypeTogether Catalogue Style

**Version**: 1.3.0
**Last Updated**: 2026-02-02

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.3.0 | 2026-02-02 | Category sections, detail page layout, item-list with copy button, middle dot separators |
| 1.2.1 | 2026-02-01 | Card meta: border-top separator, left-aligned layout |
| 1.2.0 | 2026-01-31 | Complete redesign: TypeTogether Catalogue style, Google Sans Flex + Noto Sans KR, 1170px centered layout, transparent card backgrounds |
| 1.1.0 | 2026-01-31 | Inputs: bottom border only, subtle gray-300 default, transparent bg |
| 1.0.0 | 2026-01-31 | Initial release: Brutalist B&W style |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPETOGETHER CATALOGUE  │  Editorial minimalism  │  radius = 0 │
├─────────────────────────────────────────────────────────────────┤
│  Max width: 1170px       │  Grid: 4 columns, 24px gap           │
│  Font: Google Sans Flex  │  Korean: Noto Sans KR                │
│  Hover: #0066cc (blue)   │  Borders: minimal, #e5e5e5           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Colors

### CSS Variables

```css
:root {
    --color-black: #000000;
    --color-text: #1a1a1a;
    --color-white: #ffffff;
    --color-bg: #f8f8f8;
    --color-border: #e5e5e5;
    --color-border-hover: #cccccc;
    --color-gray-light: #f5f5f5;
    --color-gray-mid: #888888;
    --color-gray-dark: #555555;
    --color-link-hover: #0066cc;
}
```

### Color Palette

| Name | Hex | Use |
|------|-----|-----|
| **Black** | `#000000` | Primary text, logo |
| **Text** | `#1a1a1a` | Body text |
| **White** | `#ffffff` | Backgrounds, buttons |
| **Background** | `#f8f8f8` | Page background |
| **Border** | `#e5e5e5` | Dividers, borders |
| **Gray Mid** | `#888888` | Secondary text, meta |
| **Gray Dark** | `#555555` | Descriptions |
| **Link Hover** | `#0066cc` | Interactive hover state |

---

## Layout

### Container

| Property | Value |
|----------|-------|
| Max width | **1170px** |
| Alignment | Centered (`margin: 0 auto`) |
| Padding | 24px horizontal |

### Grid System

| Property | Value |
|----------|-------|
| Columns | **4** |
| Gap | **24px** |
| Responsive | 1 column on mobile (768px) |

```css
.grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

@media (max-width: 768px) {
    .grid {
        grid-template-columns: 1fr;
    }
}
```

---

## Typography

### Font Families

```css
font-family: 'Google Sans Flex', 'Noto Sans KR', sans-serif;
```

| Purpose | Font |
|---------|------|
| Primary (Latin) | Google Sans Flex |
| Korean fallback | Noto Sans KR |
| System fallback | sans-serif |
| Monospace | 'SF Mono', Consolas, Monaco, monospace |

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500&family=Noto+Sans+KR:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Card Title | 22px | 400 | 1.2 | -0.02em |
| Body | 15px | 400 | 1.5 | 0 |
| Description | 14px | 400 | 1.5 | 0 |
| Navigation | 14px | 400 | 1.5 | 0.02em |
| Logo | 14px | 400 | 1.5 | 0.02em |
| Badge/Meta | 12px | 400 | 1.5 | 0.02em |
| Label (uppercase) | 10px | 600 | 1.2 | 0.1em |
| Code | 12px | 400 | 1.6 | 0 |

---

## Components

### Header

| Property | Value |
|----------|-------|
| Height | 56px |
| Max width | 1170px |
| Padding | 0 24px |
| Border | 1px solid `--color-border` (bottom) |
| Display | flex, space-between |

```css
.header {
    max-width: 1170px;
    margin: 0 auto;
    padding: 0 24px;
    height: 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--color-border);
}
```

### Navigation

| State | Color |
|-------|-------|
| Default | `--color-gray-mid` |
| Hover | `--color-black` |
| Active | `--color-black` |

### Cards (Catalogue Style)

| Property | Value |
|----------|-------|
| Height | 146px (fixed) |
| Background | **transparent** (no card background) |
| Border | **none** |
| Display | flex, column |
| Cursor | pointer |

**Hover Behavior**: Title color changes to `#0066cc`

```css
.card {
    display: block;
    text-decoration: none;
    color: inherit;
    cursor: pointer;
}

.card:hover .card-title {
    color: #0066cc;
}

.card-content {
    height: 146px;
    display: flex;
    flex-direction: column;
}
```

### Card Content

| Element | Style |
|---------|-------|
| Title | 22px, weight 400, letter-spacing -0.02em |
| Description | 14px, color gray-dark, 3-line clamp |
| Meta | flex row, gap 12px, border-top separator |

```css
.card-description {
    font-size: 14px;
    color: var(--color-gray-dark);
    line-height: 1.5;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
}

.card-meta {
    display: flex;
    gap: 12px;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
}
```

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Black bg, white text, full width |
| Secondary | Transparent bg, gray-dark text, border |

```css
.button-primary {
    background: var(--color-black);
    color: var(--color-white);
    border: none;
    padding: 12px 24px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    width: 100%;
}

.button-secondary {
    background: transparent;
    color: var(--color-gray-dark);
    padding: 8px 14px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    border: 1px solid var(--color-border);
}

.button-secondary:hover {
    border-color: var(--color-black);
    color: var(--color-black);
}
```

### Inputs

| Property | Value |
|----------|-------|
| Border | Bottom only, 1px solid border |
| Padding | 10px 0 |
| Background | Transparent |
| Focus | Border-color black |

```css
.input {
    width: 100%;
    padding: 10px 0;
    border: none;
    border-bottom: 1px solid var(--color-border);
    font-size: 14px;
    font-family: inherit;
    background: transparent;
}

.input:hover {
    border-bottom-color: var(--color-border-hover);
}

.input:focus {
    outline: none;
    border-bottom-color: var(--color-black);
}
```

### Category Section (Dashboard)

| Property | Value |
|----------|-------|
| Margin bottom | 56px |
| Title | 11px, uppercase, letter-spacing 0.1em |
| Title border | 1px solid bottom |

```css
.skill-section {
    margin-bottom: 56px;
}

.skill-section .section-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--color-gray-mid);
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
}
```

### Detail Page (Two-Column Layout)

| Property | Value |
|----------|-------|
| Grid | 1fr 240px, gap 80px |
| Hero padding | 80px top, 48px bottom |
| Hero title | 48px, weight 400 |
| Sidebar label | 10px uppercase |

```css
.page-hero {
    padding: 80px 0 48px;
    border-bottom: 1px solid var(--color-border);
}

.page-hero-name {
    font-size: 48px;
    font-weight: 400;
    letter-spacing: -0.02em;
}

.page-layout {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 80px;
    padding: 56px 0 80px;
}
```

### Item List

| Property | Value |
|----------|-------|
| Padding | 16px vertical |
| Border | 1px solid bottom |
| Display | flex, space-between |

```css
.item-list li {
    padding: 16px 0;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

### Copy Button

| Property | Value |
|----------|-------|
| Font size | 11px |
| Padding | 6px 12px |
| Border | 1px solid border |
| Hover | Black border and text |

```css
.copy-btn {
    font-size: 11px;
    font-weight: 500;
    color: var(--color-gray-mid);
    background: transparent;
    border: 1px solid var(--color-border);
    padding: 6px 12px;
    cursor: pointer;
}

.copy-btn:hover {
    color: var(--color-black);
    border-color: var(--color-black);
}
```

### Middle Dot Separator

Meta 정보 구분에 사용:

```css
.meta span:not(:last-child)::after {
    content: ' · ';
    color: var(--color-gray-mid);
}
```

### Footer

| Property | Value |
|----------|-------|
| Max width | 1170px |
| Padding | 14px 24px |
| Border | 1px solid `--color-border` (top) |
| Display | flex, space-between |

```css
.footer {
    max-width: 1170px;
    margin: 0 auto;
    padding: 14px 24px;
    font-size: 12px;
    color: var(--color-gray-mid);
    letter-spacing: 0.02em;
    border-top: 1px solid var(--color-border);
}

.footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
```

### Toolbar

| Property | Value |
|----------|-------|
| Background | White |
| Border | 1px solid border |
| Padding | 14px 20px |
| Display | flex, gap 16px |

### Code Output

```css
.output {
    background: var(--color-gray-light);
    padding: 16px;
    font-family: 'SF Mono', Consolas, Monaco, monospace;
    font-size: 12px;
    overflow-x: auto;
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    line-height: 1.6;
}

.status-bar {
    background: var(--color-gray-light);
    padding: 10px 14px;
    font-size: 12px;
    font-family: 'SF Mono', Consolas, Monaco, monospace;
    border-left: 3px solid var(--color-black);
}

.status-bar.error {
    border-left-color: #d32f2f;
    background: #ffebee;
}
```

---

## Spacing

| Token | Value | Use |
|-------|-------|-----|
| space-2 | 8px | Small gaps, meta padding |
| space-3 | 10px | Input padding, margins |
| space-4 | 14px | Button padding, toolbar |
| space-5 | 16px | Output padding |
| space-6 | 20px | Form padding, toolbar |
| space-8 | 24px | Grid gap, section padding |
| space-10 | 28px | Form sections |
| space-12 | 48px | Main content padding |

---

## Borders

| Type | Value |
|------|-------|
| Default | 1px solid `--color-border` |
| Hover | 1px solid `--color-border-hover` |
| Focus | 1px solid `--color-black` |
| Accent | 3px solid `--color-black` (left border) |
| Radius | **0** (no rounded corners) |

---

## Responsive

### Breakpoints

| Name | Width | Changes |
|------|-------|---------|
| Mobile | ≤768px | 1-column grid, reduced padding |
| Desktop | >768px | 4-column grid, full padding |

```css
@media (max-width: 768px) {
    .header {
        padding: 0 20px;
    }

    .main {
        padding: 32px 20px 100px;
    }

    .grid {
        grid-template-columns: 1fr;
    }

    .form-row {
        grid-template-columns: 1fr;
    }
}
```

---

## Principles

### Editorial Minimalism
- Clean, uncluttered layouts
- Typography-driven hierarchy
- Generous whitespace
- Content-first approach

### No Decoration
- No card backgrounds or shadows
- Minimal borders (only where necessary)
- No rounded corners
- No gradients

### Interactive Feedback
- Color change on hover (blue for links/titles)
- Border color change for inputs
- Cursor changes for clickable elements
- Instant transitions (15ms ease)

### Accessibility
- High contrast text (black/white)
- Clear focus states
- Keyboard navigable
- Semantic HTML

---

## File Structure

```
public/
└── styles/
    └── main.css

views/
├── dashboard.ejs
├── skill-cli.ejs
├── skill-web.ejs
└── files.ejs
```

---

*Editorial minimalism. Typography-driven. Content-first.*
