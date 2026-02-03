# Skill Server Design System

TypeTogether Catalogue Style - v1.4.0

All sizes are multiples of 4.

---

## Typography

### Font Families

| Token | Value |
|-------|-------|
| `--font-sans` | 'Google Sans Flex', 'Noto Sans KR', sans-serif |
| `--font-mono` | 'SF Mono', Consolas, Monaco, monospace |

### Type Scale (multiples of 4)

| Element | Size | Weight | Letter-spacing | Line-height | Transform |
|---------|------|--------|----------------|-------------|-----------|
| body | 16px | 400 | - | 1.5 | - |
| h1, h2 (section) | 12px | 400 | 0.02em | - | lowercase |
| h3 (card name) | 16px | 400 | -0.02em | 1.2 | - |
| .section-title | 12px | 500 | 0.1em | - | uppercase |
| .page-hero-name | 24px | 500 | 0.02em | 1.2 | lowercase |
| .page-hero-name--mono | 36px | - | -0.01em | - | none |
| .page-hero-category | 12px | 500 | 0.1em | - | uppercase |
| .page-hero-desc | 16px | 400 | -0.005em | 1.6 | - |
| .page-hero-meta | 16px | - | 0.01em | - | - |
| .page-main h2 | 12px | 500 | 0.08em | - | uppercase |
| .page-main h3 | 16px | 500 | - | - | - |
| .page-main p | 16px | - | - | 1.7 | - |
| .page-main li | 16px | - | - | 1.7 | - |
| .page-main code | 12px | - | - | - | - |
| .page-sidebar-label | 12px | 600 | 0.12em | - | uppercase |
| .page-sidebar-value | 16px | - | - | 1.6 | - |

### Card Typography

| Element | Size | Weight | Letter-spacing |
|---------|------|--------|----------------|
| .skill-name | 16px | 400 | -0.02em |
| .skill-name--cli | 16px (mono) | - | 0 |
| .skill-description | 12px | - | - |
| .skill-version | 12px | - | - |
| .skill-badge | 12px | 400 | 0.02em |

### UI Elements

| Element | Size | Weight | Letter-spacing | Transform |
|---------|------|--------|----------------|-----------|
| .logo | 16px | 400 | 0.02em | - |
| .nav a | 16px | 400 | 0.02em | - |
| .btn | 12px | 600 | 0.08em | uppercase |
| .btn-small | 12px | 500 | 0.05em | - |
| .back-button | 12px | 500 | 0.05em | uppercase |
| .copy-btn | 12px | 500 | 0.02em | - |
| .form-group label | 12px | 600 | 0.1em | uppercase |
| .form-group input | 16px | - | - | - |
| .empty-state | 12px | - | - | - |

### Mono Elements

| Element | Size |
|---------|------|
| .status-bar | 12px |
| .output | 12px |
| .path-display | 12px |
| .preview-content | 12px |
| .file-icon | 12px |
| .file-size | 12px |
| .arg-hint | 12px |
| .item-name--mono | 12px |

### Related Cards

| Element | Size | Weight |
|---------|------|--------|
| .related-card-name | 20px | 400 |
| .related-card-desc | 12px | - |

### List Items

| Element | Size |
|---------|------|
| .item-name | 16px |
| .item-meta | 12px |
| .file-name | 12px |

---

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-black` | #000000 | Primary text, borders |
| `--color-text` | #1a1a1a | Body text |
| `--color-white` | #ffffff | Backgrounds |
| `--color-bg` | #f8f8f8 | Page background |
| `--color-border` | #e5e5e5 | Borders |
| `--color-border-hover` | #cccccc | Hover borders |
| `--color-gray-light` | #f5f5f5 | Code backgrounds |
| `--color-gray-mid` | #888888 | Secondary text, labels |
| `--color-gray-dark` | #555555 | Descriptions |
| `--color-accent` | #e84a3b | Accent (unused) |
| Link hover | #0066cc | Interactive links |

---

## Spacing (multiples of 4)

| Token | Value | Usage |
|-------|-------|-------|
| Main padding (top) | 32px | .main container |
| Main padding (bottom) | 16px | .main container |
| Main padding (sides) | 24px | .main container |
| Max width | 1170px | Content container |
| Grid gap | 24px | Card grid |
| Section padding-bottom | 40px | Skill sections |

---

## Layout

### Grid

| Layout | Columns | Gap |
|--------|---------|-----|
| .skill-grid | 4 | 24px |
| .page-hero | 1fr 320px | 60px |
| .page-layout | 1fr 280px | 100px |
| .related-grid | 3 | 24px |
| .form-row | 1fr 1fr | 24px |

### Responsive (768px)

| Layout | Columns |
|--------|---------|
| .skill-grid | 1 |
| .page-hero | 1 |
| .page-layout | 1 |
| .related-grid | 1 |
| .form-row | 1 |

---

## Borders

| Element | Style |
|---------|-------|
| Header bottom | 3px solid black |
| Card meta top | 1px solid border |
| Section title bottom | 1px solid border |
| Status bar left | 3px solid black |
| Error status bar | 3px solid #d32f2f |

---

## Transitions

| Property | Duration | Easing |
|----------|----------|--------|
| color | 0.15s | ease |
| border-color | 0.15s | ease |
| background | 0.15s | ease |
| background-color | 0.1s | ease |

---

*Last updated: 2026-02-03*
