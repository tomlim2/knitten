---
description: "Log and search wine/whisky drinks with pricing info"
argument-hint: "<name> [--note \"text\"] [--price $]"
allowed-tools: "Read, Write, Glob, WebSearch, WebFetch, AskUserQuestion"
---

# drink-log-entry

Track wines and whiskies you've tried with pricing and tasting notes.
## Arguments

Input: $ARGUMENTS

## Data Storage

- **Drinks database**: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/drinks.json`
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

Read `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/drinks.json` and display all drinks in a table:

```
## Your Drink Collection

| Date | Name | Type | Price | Vivino | Notes |
|------|------|------|-------|--------|-------|
| 2026-02-06 | Macallan 12 | Scotch Whisky | $89 | ★★★★☆ 4.2 | Smooth, honey notes |
```

Display `source_rating` as stars with numerical value.

### If `recent` argument:

Show the 5 most recent drinks from the database.

### If drink name provided:

1. **Check existing database**
   - Read `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/drinks.json`
   - If drink exists, show details and ask if user wants to update notes

2. **Search for drink info on Vivino** (PRIMARY SOURCE)
   - Use WebSearch with `site:vivino.com` to find drink on Vivino
   - Extract from Vivino:
     - **Vivino Rating** (4.0-5.0 scale)
     - **Vivino Price** (average user price)
     - **Vivino URL** (product page link)
     - **Description** (wine/whisky profile from Vivino or producer)
     - Type (wine/whisky/scotch/bourbon/etc.)
     - Region/distillery
     - Vintage (if applicable)
     - Alcohol %
   - If not found on Vivino, fallback to other sources (Wine Searcher, Distiller, etc.)
   - Extract description from search results (e.g., "A classic Speyside single malt known for its smooth character")

3. **Present findings**
   ```
   ## Found: Macallan 12 Year Old

   A classic Speyside single malt aged in sherry-seasoned oak casks, known for its rich, smooth character.

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
     - Tasting notes (optional)
     - Date (default: today)

5. **Save to database**
   - Create `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/drinks/` directory if needed
   - Read existing `drinks.json` (or create empty array)
   - Append new entry:
   ```json
   {
     "id": "macallan-12-2026-02-06",
     "name": "Macallan 12 Year Old",
     "description": "A classic Speyside single malt aged in sherry-seasoned oak casks, known for its rich, smooth character.",
     "type": "Scotch Whisky",
     "region": "Speyside, Scotland",
     "vintage": 2022,
     "price": 89,
     "currency": "USD",
     "notes": "Smooth, honey notes. Great intro scotch.",
     "date": "2026-02-06",
     "abv": 40,
     "source": "Vivino",
     "source_rating": 4.2,
     "source_price": 89,
     "vivino_url": "https://www.vivino.com/...",
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
      "description": "string (1-2 sentence summary from Vivino or web search)",
      "type": "wine|whisky|scotch|bourbon|rum|etc",
      "region": "string (optional)",
      "producer": "string (optional)",
      "vintage": "number (optional, for wine)",
      "price": "number",
      "currency": "string (default: USD)",
      "notes": "string (optional, user's personal notes)",
      "date": "YYYY-MM-DD",
      "abv": "number (optional)",
      "source": "string (Vivino, Wine Searcher, etc.)",
      "source_rating": "number (Vivino rating, 1-5 scale)",
      "source_price": "number or string (price from source)",
      "vivino_url": "string (Vivino product page URL)",
      "searched_at": "ISO 8601"
    }
  ]
}
```

## Search Strategy

### By Drink Type:

**1. WINE (Still Wines)**
   - **PRIMARY:** Vivino
     - Use `site:vivino.com` in WebSearch
     - Extract: rating (4.0-5.0), price, description, tasting notes, URL
     - Example: `"Kongsgaard Chardonnay 2022" site:vivino.com rating`
   - **FALLBACK:** Wine-Searcher, Wine Enthusiast, Wine.com

**2. CHAMPAGNE (Sparkling Wines)**
   - **PRIMARY:** Wine Enthusiast, Jancis Robinson, Wine-Searcher
     - Champagne ratings often from professional critics (James Suckling, Wine Spectator)
     - Vivino has limited champagne coverage
     - Extract: critic scores (90-100 scale), convert to 5-star for display
   - **Example:** `"Krug Grande Cuvée 171" rating price review`

**3. WHISKY (Scotch, Bourbon, etc.)**
   - **PRIMARY:** Whiskybase, Master of Malt, The Whisky Exchange
     - Vivino does NOT cover whisky
     - Use dedicated whisky review sites
     - Extract: rating (often 80-100 scale), convert to 5-star
   - **FALLBACK:** Distiller, Connosr, CellarTracker
   - **Example:** `"Caol Ila 12" Islay single malt rating price review`

### Extract from Results:
   - Product name (official)
   - Type/category
   - Region/distillery/appellation
   - Price (average or range)
   - ABV
   - Professional/user ratings
   - Tasting notes/description
   - Source URL (Vivino URL for wine, product page for others)

### If Not Found:
   - Ask user to provide type, region, price manually
   - Still log to database with source: "Manual"

### Rating Conversion:
   - Wine (Vivino): 4.0-5.0 scale (use as-is)
   - Champagne/Critics: 90-100 scale → convert to 4.0-5.0 (e.g., 95pts = 4.8)
   - Whisky: 80-100 scale → convert to 4.0-5.0 (e.g., 85pts = 4.3)

## Notes

- Prices are stored as-is (user can input in any currency)
- Vivino rating is 1-5 scale (display as stars: ★)
- Supports both wine and whisky/spirits
- Search is best-effort (may not find obscure bottles)
