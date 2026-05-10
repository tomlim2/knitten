---
description: "Log wine and whisky entries with tasting notes and pricing — record new drinks or search past entries."
---

# drink-log-entry

Browse your wine and whisky collection with tasting notes.

## Entry Template (wine — use for new entries)

```
### {와인 이름} ({빈티지})
- **포도:** {품종 · 블렌드 비율 가능하면}
- **국가/지역:** {국기 이모지} {국가 한글} ({국가 영문}) · {지역 영문} ({지역 한글, 위치 설명})
- **와이너리/생산자:** {producer} — {짧은 와이너리 컨텍스트: 협동조합/네고시앙/도멘 여부, 설립연도, 규모 등}
- **Vinification:** {양조법 — 발효통(스테인리스/오크), 숙성, 침용 기간, 알콜도수 등}
- **가격/평점:** {price} · {Vivino/James Suckling 등}
- **날짜:** {YYYY-MM-DD} · **컨텍스트:** {장소/누구와/구매처}
- **메모:** {맛, 향, 페어링, 인상}
- [Vivino]({url})
```

빈 필드는 비워두되 줄은 유지. 와이너리/Vinification 정보가 웹에 없으면 "정보 없음" 표기.

## Purpose

Web interface to view your logged drinks from the `/drink-log-entry` command.

## Usage

```
/open-skills
```

Then click on **drink-log-entry** to view your collection.

Or visit: http://localhost:9720/skills/drink-log-entry

## Features

- View all logged drinks in a table
- Sort by date, name, rating
- Filter by type (wine/whisky)
- Display tasting notes and pricing

## Data Source

Reads from: `!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc drinks`/drinks.json`

## Files

- `index.html` - Drink collection viewer page

## Related Files

- Command: `~/.claude/commands/drink-log-entry.md`
- Data: `!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc drinks`/drinks.json`
