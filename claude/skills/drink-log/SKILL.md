---
description: "Browse wine and whisky collection with tasting notes and pricing. Use when recording a new drink or searching past entries."
---

# drink-log

Browse your wine and whisky collection with tasting notes.

## Purpose

Web interface to view your logged drinks from the `/drink-log` command.

## Usage

```
/open-skills
```

Then click on **drink-log** to view your collection.

Or visit: http://localhost:972/skills/drink-log

## Features

- View all logged drinks in a table
- Sort by date, name, rating
- Filter by type (wine/whisky)
- Display tasting notes and pricing

## Data Source

Reads from: `~/.claude/private/drinks/drinks.json`

## Files

- `index.html` - Drink collection viewer page

## Related Files

- Command: `~/.claude/commands/drink-log.md`
- Data: `~/.claude/private/drinks/drinks.json`
