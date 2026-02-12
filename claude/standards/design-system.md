# Design System - Typo-base

**Version**: 1.9.0
**Last Updated**: 2026-02-12

**Canonical CSS Reference**: http://localhost:972/skills/design-showcase

> **IMPORTANT**: The design-showcase page is the **single source of truth** for all CSS implementations. For exact values (font-size, line-height, margins, colors, border-radius, spacing, component specs, etc.), **always refer to design-showcase/index.html**. This document defines philosophy, principles, and design direction only.

---

## Philosophy

### Typo-base: Editorial Minimalism

A design system inspired by editorial design and typography-driven layouts. Born from the belief that good typography needs no decoration.

**Core Identity:**
- **Editorial Minimalism** - Clean layouts, generous whitespace, content-first
- **Typography-Driven** - Hierarchy through type, not color or decoration
- **Platform-Agnostic** - Principles apply to web, native, or any UI platform

**What This Is:**
- A philosophical framework for creating minimal, readable interfaces
- A set of principles that guide implementation decisions
- A vocabulary for discussing design choices

**What This Is Not:**
- A pixel-perfect specification (see design-showcase for that)
- A component library (implementations vary by platform)
- A rigid rulebook (adapt to your platform's constraints)

---

## Design Principles

### 1. Typography First

Typography is the primary tool for creating hierarchy and meaning.

**Rules:**
- Font sizes in multiples of 4px (12, 16, 20, 24, 36, 48...)
- Letter spacing: 0 for all text (no tracking)
- Line height: 1.2 for titles, 1.5-1.6 for body
- Font weights: 400 (regular), 500 (medium), 600 (semibold)
- **Bold weights (500, 600) only for headers** - Never in body text
- **No `<strong>` tags** - Use CSS font-weight instead

**Font Stack:**
- Primary: Noto Sans KR (Korean)
- Fallback: Inter (Latin)
- Monospace: SF Mono, Consolas, Monaco

### 2. No Decoration

Remove visual noise. Let content speak.

**Rules:**
- No card backgrounds or shadows
- Minimal borders (only where necessary for structure)
- No rounded corners (border-radius: 0)
- No gradients
- No drop shadows
- Transparent backgrounds for content cards

**Exception:** Code blocks may have subtle backgrounds for readability.

### 3. Editorial Minimalism

Layouts inspired by editorial design and printed matter.

**Rules:**
- Clean, uncluttered layouts
- Generous whitespace (breathing room around content)
- Content-first approach (UI elements serve content)
- Maximum spacing: 40px (no larger gaps)
- Centered layouts with max-width constraints

### 4. Interactive Feedback

Clear, instant feedback for all interactions.

**Rules:**
- Hover: Color change (blue #0066cc for links/titles)
- Focus: Border color change for inputs
- Cursor changes for clickable elements
- Transitions: 0.15s ease (instant, not animated)
- No loading spinners unless absolutely necessary

### 5. Accessibility

Design for all users from the start.

**Rules:**
- High contrast text (black on white, white on black)
- Clear focus states for keyboard navigation
- Semantic HTML (proper heading hierarchy, ARIA when needed)
- WCAG AA minimum (4.5:1 contrast ratio)

---

## UX Writing

### Two-Mode System

Different contexts require different tones. Choose the right mode for your content.

#### Mode 1: Empathetic (UI/Status Messages)

Use when the user is **waiting, uncertain, or needs reassurance**.

**When to Use:**
- Loading states ("서버 연결중")
- Error messages ("페이지를 찾을 수 없습니다")
- Success confirmations ("저장 완료!")
- Empty states ("아직 사용 기록이 없습니다")

**Characteristics:**
- Complete sentences with proper grammar
- Active voice describing what's happening
- Korean-friendly phrasing (warm, human)
- Acknowledges user's emotional state

**Pattern:**
```
[Subject] + [Action] + [State/Context]
"서버 연결중"
"파일을 저장하는 중입니다"
"모든 변경사항이 저장되었습니다"
```

#### Mode 2: Professional (Technical Content)

Use when the user needs **precise information quickly**.

**When to Use:**
- Skill descriptions ("Create git commits from staged changes")
- Command arguments ("File name (required)")
- Button labels ("Download")
- Documentation ("Use --force to override")
- API responses

**Characteristics:**
- Imperative mood for instructions
- Technical accuracy over friendliness
- Scannable, consistent structure
- No unnecessary words

**Pattern:**
```
[Action verb] + [Object] + [Optional: Context]
"Execute git commands"
"Generate invoice from pending lessons"
"Track skill usage (optional: --dry-run)"
```

### General Guidelines

1. **Be specific**: "3 files updated" not "Files updated"
2. **Use present tense**: "Saving..." not "Save in progress"
3. **Avoid jargon in UI**: "연결중" not "Establishing TCP connection"
4. **Never use placeholder text**: No "Lorem ipsum"
5. **Bilingual when appropriate**: Korean for warmth, English for precision

### Anti-Patterns

❌ Don't mix modes:
```
Bad: "데이터를 execute하는 중입니다"
Good: "데이터를 처리하는 중입니다" (Empathetic)
Good: "Execute data processing" (Professional)
```

❌ Don't over-explain in technical content:
```
Bad: "This command will help you create a new branch"
Good: "Create new branch"
```

❌ Don't be cold in status messages:
```
Bad: "Operation pending"
Good: "작업을 진행하고 있습니다"
```

---

## Interactive Components (Shoelace)

### Hybrid Approach: Typo-base + Shoelace

Typo-base handles layout, typography, cards, and heroes. **Shoelace Web Components** fill the gap for interactive components that Typo-base doesn't provide.

| Area | Owned By |
|------|----------|
| Layout, typography, cards, hero | **Typo-base** (CSS) |
| Modal, dropdown, tabs, tooltip, alert, toast | **Shoelace** (Web Components) |
| Form inputs, buttons | **Typo-base** primary, Shoelace for enhanced selects |

### Setup

Shoelace is loaded via CDN (no build step required):

```html
<!-- In <head>, after main.css -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/themes/light.css" />
<link rel="stylesheet" href="/static/styles/shoelace-theme.css" />
<script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/shoelace-autoloader.js"></script>
```

The `shoelace-theme.css` file maps Typo-base design tokens to Shoelace CSS variables (border-radius: 0, matching fonts/colors, no shadows).

### When to Use Shoelace

**Use Shoelace for:**
- Dialogs/modals (`<sl-dialog>`)
- Dropdowns (`<sl-dropdown>` + `<sl-menu>`)
- Tabs (`<sl-tab-group>`)
- Tooltips (`<sl-tooltip>`)
- Alerts/notifications (`<sl-alert>`)
- Enhanced selects (`<sl-select>`)
- Radio button groups (`<sl-radio-group>`)

**Keep using Typo-base for:**
- Text inputs (`.input` class)
- Buttons (`.btn`, `.btn-primary`, `.btn-secondary`)
- Cards, lists, tables
- Page layout and heroes
- Typography and spacing

### Event Handling

Shoelace components use `sl-` prefixed events instead of native events:

```javascript
// Shoelace select
document.querySelector('sl-select').addEventListener('sl-change', e => {
    console.log(e.target.value);
});

// Shoelace dialog
document.querySelector('sl-dialog').show();
document.querySelector('sl-dialog').hide();
```

### Theming Rules

All Shoelace overrides live in `shoelace-theme.css`. Key principles:
- **border-radius: 0** on all components (matches Typo-base)
- **No shadows** on any component
- **Font family** matches Typo-base (Noto Sans KR, Inter)
- **Colors** map to existing CSS variables
- **Input style** matches bottom-border-only pattern

---

## Implementation Notes

### Platform Adaptations

These principles are platform-agnostic. Adapt them to your constraints:

**Web (CSS):**
- See `design-showcase` for exact pixel values
- Use CSS variables for colors
- Responsive breakpoints around 768px

**Python/Tkinter:**
- Typography scales may differ (system font rendering)
- Focus on proportions rather than exact px values
- Maintain spacing ratios

**Native Mobile:**
- Adjust font sizes for platform conventions (iOS/Android differ)
- Keep principles (no decoration, typography-first)
- Platform-specific interaction patterns

### When in Doubt

1. Check `design-showcase` for web reference implementation
2. Ask: "Does this serve the content or distract from it?"
3. Remove decoration before adding it
4. Test with real content (never Lorem Ipsum)
5. Simplify ruthlessly

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.9.0 | 2026-02-12 | Shoelace Web Components integration (dialog, dropdown, tabs, tooltip, alert, select) |
| 1.8.1 | 2026-02-08 | Restructured as philosophy doc (CSS specs moved to showcase) |
| 1.8.0 | 2026-02-07 | Added UX Writing two-mode system |
| 1.7.0 | 2026-02-07 | Added Markdown Reading Typography pattern |
| 1.6.2 | 2026-02-06 | Rule: Bold weights only for headers |
| 1.6.1 | 2026-02-05 | Font hierarchy: Noto Sans KR primary, Inter fallback |
| 1.6.0 | 2026-02-05 | Code Blocks pattern (GitHub-inspired minimal) |
| 1.5.1 | 2026-02-04 | Rule: No `<strong>` tags (use CSS) |
| 1.5.0 | 2026-02-04 | Dashboard pattern: skill cards meta-first |
| 1.4.1 | 2026-02-04 | Font sizes: 4px multiples |
| 1.4.0 | 2026-02-04 | Rebranded to Typo-base style |
| 1.3.1 | 2026-02-02 | Standardized input/button classes |
| 1.3.0 | 2026-02-02 | Category sections, item-list pattern |
| 1.2.1 | 2026-02-01 | Card meta: border-top separator |
| 1.2.0 | 2026-01-31 | Complete redesign: Typo-base editorial style |
| 1.1.0 | 2026-01-31 | Inputs: bottom border only |
| 1.0.0 | 2026-01-31 | Initial release: Brutalist B&W |

---

## Quick Reference

```
┌─────────────────────────────────────────────────────────────────┐
│  TYPO-BASE               │  Editorial minimalism  │  radius = 0 │
├─────────────────────────────────────────────────────────────────┤
│  Max width: ~1170px      │  Grid: 4 columns, ~24px gap          │
│  Font: Noto Sans KR      │  Fallback: Inter                     │
│  Hover: blue             │  Borders: minimal, light gray        │
│  Spacing max: ~40px      │  Letter spacing: 0                   │
│  No decoration           │  Typography-driven hierarchy         │
└─────────────────────────────────────────────────────────────────┘
```

**For exact values, see:** http://localhost:972/skills/design-showcase

---

*Editorial minimalism. Typography-driven. Content-first.*
