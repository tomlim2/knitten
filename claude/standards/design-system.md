# Design System - Typo-base

**Version**: 1.7.0
**Last Updated**: 2026-02-07

**Live Component Examples**: http://localhost:972/skills/design-showcase

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.7.0 | 2026-02-07 | Added Markdown Reading Typography pattern: compact 12px reading style with table styling |
| 1.6.2 | 2026-02-06 | Added rule: Semibold (500) and bold (600) font weights only for headers, never body text |
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

#### Skill Grid

| Property | Value |
|----------|-------|
| Columns | 4 (1fr each) |
| Gap | 24px |
| Responsive | 1 column on ≤768px |

#### Skill Card

| Property | Value |
|----------|-------|
| Height | **auto** (no fixed height) |
| Background | **transparent** |
| Border | **none** |
| Display | flex, column |

**Content Order**: Title → Meta (bordered) → Description

**Hover Behavior**: Title link color changes to `#0066cc`

#### Skill Meta (Border-Top Pattern)

| Property | Value |
|----------|-------|
| Position | After title, before description |
| Border | 1px solid top |
| Padding | 8px top |
| Display | flex row |
| Items | Version, platform badge |

#### Skill Description

| Property | Value |
|----------|-------|
| Font size | 12px |
| Color | gray-dark |
| Line clamp | 3 lines |
| Padding | 10px top |

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Black bg, white text, full width |
| Secondary | Transparent bg, gray-dark text, border |
| Small | Reduced padding for compact buttons |

### Inputs

| Property | Value |
|----------|-------|
| Border | Bottom only, 1px solid border |
| Padding | 10px 0 |
| Background | Transparent |
| Transition | 0.15s ease |
| Hover | Border-color border-hover |
| Focus | Border-color black |

### Section Title (Optional)

**Note**: Dashboard pattern does NOT use section titles by default. If needed:

| Property | Value |
|----------|-------|
| Font size | 12px |
| Weight | 500 |
| Transform | uppercase |
| Letter spacing | 0 |
| Border | 1px solid bottom |

### Detail Page (Two-Column Layout)

| Property | Value |
|----------|-------|
| Grid | 1fr 240px, gap 80px |
| Hero padding | 80px top, 48px bottom |
| Hero title | 48px, weight 400 |
| Sidebar label | 12px uppercase |

### Item List

| Property | Value |
|----------|-------|
| Padding | 16px vertical |
| Border | 1px solid bottom |
| Display | flex, space-between |

### Copy Button

| Property | Value |
|----------|-------|
| Font size | 12px |
| Padding | 6px 12px |
| Border | 1px solid border |
| Hover | Black border and text |

### Middle Dot Separator

Meta 정보 구분에 사용

### Footer

| Property | Value |
|----------|-------|
| Max width | 1170px |
| Padding | 14px 24px |
| Border | 1px solid `--color-border` (top) |
| Display | flex, space-between |

### Toolbar

| Property | Value |
|----------|-------|
| Background | White |
| Border | 1px solid border |
| Padding | 14px 20px |
| Display | flex, gap 16px |

### Code Output

Terminal output display with optional status bars

### Code Blocks (Documentation)

**Use**: Inline code and code blocks in content (learnings, docs, articles)

**Font Stack**: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Courier New", monospace

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
| Vertical-align | 0.125em (fine-tuned centering) |

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

## Markdown Reading Typography

**Use**: Long-form markdown content (standards, learnings, documentation)

**Purpose**: Optimized reading experience with compact 12px typography for maximum readability in narrow columns

### Container

| Property | Value |
|----------|-------|
| Max width | 700px |
| Font size | 12px (base) |
| Line height | 1.6 |

### Headings

| Element | Size | Weight | Line Height | Margin |
|---------|------|--------|-------------|--------|
| h1 | 20px | 500 | 1.3 | 0 0 20px 0 |
| h2 | 16px | 500 | 1.4 | 32px 0 12px 0 |
| h3 | 14px | 500 | 1.4 | 24px 0 8px 0 |

### Body Text

| Element | Size | Line Height | Margin |
|---------|------|-------------|--------|
| p | 12px | 1.6 | 0 0 16px 0 |
| ul, ol | 12px | 1.6 | 0 0 16px 0 |
| li | 12px | 1.6 | 0 0 6px 0 |

### Code

| Element | Size | Padding | Background |
|---------|------|---------|------------|
| code | 11px | 2px 4px | var(--color-gray-light) |
| pre | 11px | 16px | var(--color-gray-light) |

### Blockquotes

| Property | Value |
|----------|-------|
| Font size | 12px |
| Line height | 1.6 |
| Padding | 0 0 0 16px |
| Border | 2px solid left |
| Color | var(--color-gray-mid) |

### Tables

| Property | Value |
|----------|-------|
| Font size | 12px |
| Line height | 1.5 |
| Cell padding | 8px 12px |
| Border | 1px solid |
| Border collapse | collapse |

**Design Rationale**:
- **12px base** - Compact reading optimized for 700px width column
- **1.6 line height** - Balanced spacing for continuous reading
- **11px code** - Slightly smaller for inline code and blocks
- **Minimal margins** - Tighter spacing (6px-20px) for documentation flow
- **Table styling** - GitHub-inspired with alternating rows and header background
- **Vertical rhythm** - 16px bottom margins create consistent spacing

**Research Sources**:
- iA Writer typography system
- Medium article reading experience
- GitHub markdown rendering
- Butterick's Practical Typography

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
- **Semibold (500) and bold (600) only for headers** - Never use font-weight 500 or 600 in body text, paragraphs, or inline text. These weights are reserved exclusively for headings (h1-h6)

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
