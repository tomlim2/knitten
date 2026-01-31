# skill-server

**Version:** 1.0.0

Unified GUI dashboard for all Claude Code skills.

## Overview

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
# Open http://localhost:3000
```

## Features

- **Dashboard**: Card-based skill list with descriptions
- **Invoice Generator**: Embedded iframe for existing web skill
- **Git Collector**: Form-based commit extraction with WebSocket progress
- **File Browser**: Navigate private/ folder, view JSON/PDF files

## Port

Default: `972`

## Design

Follows Design System v1.1.0 (brutalist B&W)
