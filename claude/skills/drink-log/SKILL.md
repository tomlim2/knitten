# drink-log

**Version:** 0.1.0

Browse your wine and whisky collection with tasting notes.

## Changelog

- **0.1.0** - Initial release

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

## Related Files

- Command: `~/.claude/commands/drink-log.md`
- Data: `~/.claude/private/drinks/drinks.json`
