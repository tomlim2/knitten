---
description: "Browse wine and whisky collection with tasting notes and pricing. Use when recording a new drink or searching past entries."
---

# drink-log-entry

Browse your wine and whisky collection with tasting notes.

## Purpose

Web interface to view your logged drinks from the `/drink-log-entry` command.

## Usage

```
/open-skills
```

Then click on **drink-log-entry** to view your collection.

Or visit: http://localhost:972/skills/drink-log-entry

## Features

- View all logged drinks in a table
- Sort by date, name, rating
- Filter by type (wine/whisky)
- Display tasting notes and pricing

## Data Source

Reads from: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/drinks.json`

## Files

- `index.html` - Drink collection viewer page

## Related Files

- Command: `~/.claude/commands/drink-log-entry.md`
- Data: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/drinks.json`
