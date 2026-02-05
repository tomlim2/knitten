# Design System - Typo-base

**Version**: 1.6.1
**Last Updated**: 2026-02-05

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.6.1 | 2026-02-05 | Font hierarchy change: Noto Sans KR primary, Inter fallback (removed Google Sans Flex) |
| 1.6.0 | 2026-02-05 | Added Code Blocks (Documentation) pattern: inline code + code block styling with GitHub-inspired minimal design |
| 1.5.1 | 2026-02-04 | Added rule: No `<strong>` tags (use CSS font-weight) |
| 1.5.0 | 2026-02-04 | Dashboard pattern: skill cards with meta-first layout, letter-spacing 0 |
| 1.4.1 | 2026-02-04 | Standardized all font sizes to 4px multiples |
| 1.4.0 | 2026-02-04 | Rebranded to Typo-base style |
| 1.3.1 | 2026-02-02 | Standardized input/button classes with transitions (.input, .btn, .btn-primary, .btn-secondary, .btn-small) |
| 1.3.0 | 2026-02-02 | Category sections, detail page layout, item-list with copy button, middle dot separators |
| 1.2.1 | 2026-02-01 | Card meta: border-top separator, left-aligned layout |
| 1.2.0 | 2026-01-31 | Complete redesign: Typo-base style, Google Sans Flex + Noto Sans KR, 1170px centered layout, transparent card backgrounds |
| 1.1.0 | 2026-01-31 | Inputs: bottom border only, subtle gray-300 default, transparent bg |
| 1.0.0 | 2026-01-31 | Initial release: Brutalist B&W style |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPO-BASE               │  Editorial minimalism  │  radius = 0 │
├─────────────────────────────────────────────────────────────────┤
│  Max width: 1170px       │  Grid: 4 columns, 24px gap           │
│  Font: Google Sans Flex  │  Korean: Noto Sans KR                │
│  Hover: #0066cc (blue)   │  Borders: minimal, #e5e5e5           │
│  Spacing max: 40px       │  All padding/margin ≤ 40px           │
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
font-family: 'Noto Sans KR', 'Inter', sans-serif;
```

| Purpose | Font |
|---------|------|
| Primary | Noto Sans KR |
| Fallback | Inter |
| System fallback | sans-serif |
| Monospace | 'SF Mono', Consolas, Monaco, monospace |

### Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Noto+Sans+KR:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Card Title | 16px | 400 | 1.2 | 0 |
| Body | 16px | 400 | 1.5 | 0 |
| Description | 12px | 400 | 1.5 | 0 |
| Navigation | 16px | 400 | 1.5 | 0 |
| Logo | 16px | 400 | 1.5 | 0 |
| Badge/Meta | 12px | 400 | 1.5 | 0 |
| Label (uppercase) | 12px | 600 | 1.2 | 0 |
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

### Dashboard Pattern (Skill Cards)

**Structure**: Section → Grid → Cards

#### Skill Section

| Property | Value |
|----------|-------|
| Padding bottom | 40px |
| Last section margin | 0 |

```css
.skill-section {
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 40px;
}

.skill-section:last-child {
    margin-bottom: 0;
}
```

#### Skill Grid

| Property | Value |
|----------|-------|
| Columns | 4 (1fr each) |
| Gap | 24px |
| Responsive | 1 column on ≤768px |

```css
.skill-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
}

@media (max-width: 768px) {
    .skill-grid {
        grid-template-columns: 1fr;
    }
}
```

#### Skill Card

| Property | Value |
|----------|-------|
| Height | **auto** (no fixed height) |
| Background | **transparent** |
| Border | **none** |
| Display | flex, column |

**Content Order**: Title → Meta (bordered) → Description

**Hover Behavior**: Title link color changes to `#0066cc`

```css
.skill-card {
    display: block;
}

.skill-content {
    height: auto;
    display: flex;
    flex-direction: column;
}

.skill-name {
    font-size: 16px;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.2;
    margin-bottom: 10px;
}

.skill-name a {
    color: var(--color-black);
    text-decoration: none;
    transition: color 0.15s ease;
}

.skill-name a:hover {
    color: #0066cc;
}
```

#### Skill Meta (Border-Top Pattern)

| Property | Value |
|----------|-------|
| Position | After title, before description |
| Border | 1px solid top |
| Padding | 8px top |
| Display | flex row |
| Items | Version, platform badge |

```css
.skill-meta {
    display: flex;
    align-items: center;
    padding-top: 8px;
    border-top: 1px solid var(--color-border);
}

.skill-version {
    font-size: 12px;
    color: var(--color-gray-mid);
}

.skill-platform {
    font-size: 12px;
    color: var(--color-gray-mid);
    margin-left: 8px;
}
```

#### Skill Description

| Property | Value |
|----------|-------|
| Font size | 12px |
| Color | gray-dark |
| Line clamp | 3 lines |
| Padding | 10px top |

```css
.skill-description {
    font-size: 12px;
    color: var(--color-gray-dark);
    line-height: 1.5;
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    padding-top: 10px;
}
```

#### HTML Structure

```html
<section class="skill-section">
    <div class="skill-grid">
        <div class="skill-card">
            <div class="skill-content">
                <h3 class="skill-name"><a href="#">Title</a></h3>
                <div class="skill-meta">
                    <span class="skill-version">v1.0.0</span>
                    <span class="skill-platform">Mac</span>
                </div>
                <p class="skill-description">Description text...</p>
            </div>
        </div>
    </div>
</section>
```

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Black bg, white text, full width |
| Secondary | Transparent bg, gray-dark text, border |
| Small | Reduced padding for compact buttons |

```css
/* Base button styles */
.btn, .submit-button {
    padding: 12px 24px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
}

/* Primary - full width black */
.btn-primary, .submit-button {
    background: var(--color-black);
    color: var(--color-white);
    width: 100%;
}

.btn-primary:hover, .submit-button:hover {
    background: var(--color-text);
}

/* Secondary - outlined */
.btn-secondary {
    background: transparent;
    color: var(--color-gray-dark);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    border-color: var(--color-black);
    color: var(--color-black);
}

/* Small variant */
.btn-small {
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
}
```

### Inputs

| Property | Value |
|----------|-------|
| Border | Bottom only, 1px solid border |
| Padding | 10px 0 |
| Background | Transparent |
| Transition | 0.15s ease |
| Hover | Border-color border-hover |
| Focus | Border-color black |

```css
.input {
    width: 100%;
    padding: 10px 0;
    border: none;
    border-bottom: 1px solid var(--color-border);
    font-size: 16px;
    font-family: inherit;
    background: transparent;
    transition: border-color 0.15s ease;
}

.input:hover {
    border-bottom-color: var(--color-border-hover);
}

.input:focus {
    outline: none;
    border-bottom-color: var(--color-black);
}

.input::placeholder {
    color: var(--color-gray-mid);
}
```

### Section Title (Optional)

**Note**: Dashboard pattern does NOT use section titles by default. If needed:

| Property | Value |
|----------|-------|
| Font size | 12px |
| Weight | 500 |
| Transform | uppercase |
| Letter spacing | 0 |
| Border | 1px solid bottom |

```css
.skill-section .section-title {
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
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
| Sidebar label | 12px uppercase |

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
| Font size | 12px |
| Padding | 6px 12px |
| Border | 1px solid border |
| Hover | Black border and text |

```css
.copy-btn {
    font-size: 12px;
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

### Code Blocks (Documentation)

**Use**: Inline code and code blocks in content (learnings, docs, articles)

**Font Stack** (Modern monospace with comprehensive fallbacks):
```css
font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
             "Roboto Mono", "Courier New", monospace;
```

#### Inline Code

| Property | Value |
|----------|-------|
| Font size | 0.85em (relative to parent) |
| Background | #eff1f3 (solid light gray) |
| Color | #24292f (dark gray) |
| Padding | 0.2em 0.4em (relative) |
| Border | 1px solid #d1d9e0 |
| Border radius | 6px |
| White-space | nowrap (prevent mid-word breaks) |

```css
/* Inline code - GitHub-inspired minimal style */
code {
    font-family: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
                 "Roboto Mono", "Courier New", monospace;
    font-size: 0.85em;
}

:not(pre) > code {
    background: #eff1f3;
    color: #24292f;
    padding: 0.2em 0.4em;
    border-radius: 6px;
    border: 1px solid #d1d9e0;
    word-wrap: break-word;
    white-space: nowrap;
}
```

#### Code Blocks

| Property | Value |
|----------|-------|
| Background | #f6f8fa (GitHub light gray) |
| Padding | 1rem (16px) |
| Border | 1px solid #d0d7de |
| Border radius | 6px |
| Line height | 1.45 (tighter for code) |
| Overflow | auto (both axes) |
| Margin | 16px vertical |

```css
/* Code blocks - stronger visual distinction */
pre {
    background: #f6f8fa;
    padding: 1rem;
    border-radius: 6px;
    border: 1px solid #d0d7de;
    overflow: auto;
    line-height: 1.45;
    margin: 16px 0;
}

pre code {
    background: transparent;
    padding: 0;
    font-size: 100%;
    white-space: pre;
    border: none;
    color: #1f2328;
}
```

**Design Rationale**:
- **Borders provide clarity** - Makes code immediately distinguishable from text
- **Subtle backgrounds** - #eff1f3 for inline, #f6f8fa for blocks (GitHub-inspired)
- **Contrast** - Explicit text colors ensure WCAG AA compliance (4.5:1 minimum)
- **Relative sizing** - `0.85em` and `em` units scale with parent font size
- **Line height** - 1.45 for code (vs 1.6 for prose) optimizes vertical density
- **nowrap on inline** - Prevents awkward mid-function breaks like `get_outer().get_pa` `th_name()`

**Research Sources**:
- GitHub Primer Design System
- Material Design 3 code typography
- WCAG 2.1 contrast guidelines
- CSS-Tricks code styling best practices

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

### Typography First
- **Letter spacing: 0** for all text (no tracking)
- **No `<strong>` tags** - use font-weight via CSS instead
- Multiples of 4px for font sizes (12px, 16px, 20px, 24px, 36px, 48px)
- Line height: 1.2 for titles, 1.5-1.6 for body
- Font weight: 400 (regular), 500 (medium), 600 (semibold)

### Interactive Feedback
- Color change on hover (blue #0066cc for links/titles)
- Border color change for inputs
- Cursor changes for clickable elements
- Instant transitions (0.15s ease)

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
