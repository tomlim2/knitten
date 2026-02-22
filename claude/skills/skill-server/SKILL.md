---
description: "Local web server providing skill dashboard, file browser, and embedded skills. Infrastructure for all web-based skills."
disable-model-invocation: true
---

# skill-server

Unified GUI dashboard for all Claude Code skills.

## Purpose

Local web server that provides:
- Skill dashboard with all available skills
- CLI skill execution with real-time output
- Web skill embedding via iframe
- File browser for private/ data

## Usage

```bash
/open-skills
```

Or manually:
```bash
cd ~/.claude/skills/skill-server
npm install  # first time only
npm start
# Open http://localhost:972
```

## Features

- **Dashboard**: Card-based skill list with descriptions
- **Invoice Generator**: Embedded iframe for existing web skill
- **Git Collector**: Form-based commit extraction with WebSocket progress
- **File Browser**: Navigate private/ folder, view JSON/PDF files

## Port

Default: `972`

## Design System v1.2.1

TypeTogether Catalogue-inspired editorial design.

### Layout
- **Max width**: 1170px, centered
- **Grid**: 4 columns, 24px gap
- **Padding**: 24px horizontal

### Typography
- **Font family**: `'Google Sans Flex', 'Noto Sans KR', sans-serif`
- **Base size**: 15px
- **Skill name**: 22px, weight 400, letter-spacing -0.02em
- **Description**: 14px, 3-line clamp
- **Meta/Badge**: 12px

### Colors
```css
--color-black: #000000
--color-text: #1a1a1a
--color-white: #ffffff
--color-bg: #f8f8f8
--color-border: #e5e5e5
--color-gray-mid: #888888
--color-gray-dark: #555555
```

### Card Style
- **Height**: 146px fixed
- **Background**: transparent (no card background)
- **Border**: none
- **Hover**: title color changes to `#0066cc`
- **Meta separator**: border-top on `.skill-meta`

### Header/Footer
- **Height**: 56px (header)
- **Border**: 1px solid border color (bottom for header, top for footer)
- **Max width**: 1170px, centered
- **Content**: flex layout, space-between

## Centralized Config

All shared UI elements are managed in `config.json`:

```json
{
  "version": "1.2.0",
  "copyright": "© 2026 Skill Server",
  "title": "Skill Server",
  "nav": [...]
}
```

EJS partials in `views/partials/`:
- `head.ejs` - Common head (fonts, CSS)
- `header.ejs` - Navigation header
- `footer.ejs` - Site footer

## Files

- `server.js` - Express server entry point
- `config.json` - Centralized UI configuration
- `routes/` - Route handlers
- `views/` - EJS templates and partials
- `public/` - Static assets (CSS, JS, images)
