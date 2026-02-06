---
description: "Log and search wine/whisky drinks with pricing info"
argument-hint: "<name> [--note \"text\"] [--price $]"
allowed-tools: "Read, Write, Glob, WebSearch, WebFetch, AskUserQuestion"
---

# Drink Log

Track wines and whiskies you've tried with pricing and tasting notes.

## Arguments

Input: $ARGUMENTS

## Data Storage

- **Drinks database**: `~/.claude/private/drinks/drinks.json`
- **Format**: JSON array with drink entries

## Behavior

### If no argument provided:

Show usage and recent drinks:
```
Usage:
  /drink-log <name>              Search or log a drink
  /drink-log list                Show all logged drinks
  /drink-log recent              Show 5 most recent drinks

Examples:
  /drink-log "Macallan 12"
  /drink-log "Château Margaux 2015"
  /drink-log list
```

### If `list` argument:

Read `~/.claude/private/drinks/drinks.json` and display all drinks in a table:

```
## Your Drink Collection

| Date | Name | Type | Price | Rating | Notes |
|------|------|------|-------|--------|-------|
| 2026-02-06 | Macallan 12 | Scotch Whisky | $89 | ★★★★☆ | Smooth, honey notes |
```

### If `recent` argument:

Show the 5 most recent drinks from the database.

### If drink name provided:

1. **Check existing database**
   - Read `~/.claude/private/drinks/drinks.json`
   - If drink exists, show details and ask if user wants to update notes

2. **Search for drink info**
   - Use WebSearch to find:
     - Type (wine/whisky/scotch/bourbon/etc.)
     - Region/distillery
     - Average price
     - Alcohol %
     - Tasting notes/profile
   - Fetch top 2-3 results from wine/whisky retailers or review sites

3. **Present findings**
   ```
   ## Found: Macallan 12 Year Old

   **Type:** Single Malt Scotch Whisky
   **Region:** Speyside, Scotland
   **Price Range:** $65-$95
   **ABV:** 40%

   **Tasting Profile:**
   - Color: Golden amber
   - Nose: Vanilla, honey, dried fruits
   - Palate: Smooth, citrus, oak spice
   - Finish: Medium, warming

   ---

   Would you like to log this drink?
   ```

4. **Prompt for details**
   - Ask via AskUserQuestion:
     - Price paid (or use found range)
     - Your rating (1-5 stars)
     - Tasting notes (optional)
     - Date (default: today)

5. **Save to database**
   - Create `~/.claude/private/drinks/` directory if needed
   - Read existing `drinks.json` (or create empty array)
   - Append new entry:
   ```json
   {
     "id": "macallan-12-2026-02-06",
     "name": "Macallan 12 Year Old",
     "type": "Scotch Whisky",
     "region": "Speyside, Scotland",
     "price": 89,
     "currency": "USD",
     "rating": 4,
     "notes": "Smooth, honey notes. Great intro scotch.",
     "date": "2026-02-06",
     "abv": 40,
     "searched_at": "ISO 8601"
   }
   ```
   - Write updated JSON to file
   - Confirm: "✓ Logged Macallan 12 to your collection"

## Database Schema

```json
{
  "drinks": [
    {
      "id": "string (slug-date)",
      "name": "string",
      "type": "wine|whisky|scotch|bourbon|rum|etc",
      "region": "string (optional)",
      "producer": "string (optional)",
      "price": "number",
      "currency": "string (default: USD)",
      "rating": "number (1-5)",
      "notes": "string (optional)",
      "date": "YYYY-MM-DD",
      "abv": "number (optional)",
      "vintage": "number (optional, for wine)",
      "searched_at": "ISO 8601"
    }
  ]
}
```

## Search Strategy

1. **Prioritize authoritative sources:**
   - Wine: Wine Searcher, Vivino, Wine.com
   - Whisky: The Whisky Exchange, Master of Malt, Distiller

2. **Extract from results:**
   - Product name (official)
   - Type/category
   - Region/distillery
   - Price (average or range)
   - ABV
   - Expert/user tasting notes

3. **Fallback if not found:**
   - Ask user to provide type, region, price manually
   - Still log to database

## Notes

- Prices are stored as-is (user can input in any currency)
- Rating is 1-5 (display as stars: ★)
- Supports both wine and whisky/spirits
- Search is best-effort (may not find obscure bottles)
