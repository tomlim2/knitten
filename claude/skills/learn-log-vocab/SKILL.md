---
description: "Log and review foreign language words, phrases, and grammar. Use when the user inputs foreign words/sentences to learn, or asks to review what they learned."
argument-hint: "[word/sentence] or [review [language] [week|today|month]]"
---

# learn-log-vocab

Log foreign language vocabulary, phrases, and grammar to Obsidian. Review entries by time period.

## Purpose

When the user inputs a word, phrase, or sentence in any foreign language, this skill:
1. Detects the language
2. Provides translation + pronunciation + grammar breakdown
3. Appends the entry to a per-language Obsidian markdown file

When the user asks "what did I learn this week", it reads the log and shows a summary.

---

## Storage

**Path:** !`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc vocab`

**File structure:**
```
{RESOLVED_PATH}/
├── japanese.md
├── chinese.md
├── spanish.md
└── ...
```

One file per language. Created on first entry.

---

## Logging Mode

**Trigger:** User inputs foreign text (word, phrase, or sentence)

### Steps

1. **Detect language** from the input text
2. **Analyze the input:**
   - Translation to Korean
   - Romanization / pronunciation guide
   - Part of speech (for single words)
   - Grammar breakdown (for sentences — particles, conjugation, structure)
   - Example sentence (if input is a single word, provide one)
   - Difficulty: beginner / intermediate / advanced
3. **Show the analysis** to the user
4. **Append to Obsidian file** in this format:

```markdown
### {input_text}
- **뜻:** {korean_translation}
- **발음:** {pronunciation}
- **품사:** {part_of_speech}
- **문법:** {grammar_notes}
- **예문:** {example_sentence} — {example_translation}
- **난이도:** {difficulty}
- **날짜:** {YYYY-MM-DD}

---
```

If the file doesn't exist, create it with a header:

```markdown
# {Language} Vocabulary Log

---

### {first_entry}
...
```

If the file exists, append after the last `---`.

### Batch Input

User can input multiple words/sentences at once (comma or newline separated). Process each one and append all.

---

## Review Mode

**Trigger:** User asks to review, e.g.:
- "what did I learn this week"
- "이번 주 뭐 배웠지"
- "review japanese"
- "review this month"

### Steps

1. **Parse the request:**
   - Language filter (optional — if not specified, show all languages)
   - Time period: `today`, `week` (default), `month`, `all`
2. **Read Obsidian files** from `30-resources/language/`
3. **Filter entries** by date field
4. **Display summary:**

```
📖 This Week's Vocabulary (Mar 3 ~ Mar 9)
──────────────────────────────────────────

Japanese (3 entries)
  食べる (たべる) — 먹다
  美味しい (おいしい) — 맛있다
  食べたい — 먹고 싶다

Chinese (1 entry)
  你好 (nǐ hǎo) — 안녕하세요

Total: 4 entries across 2 languages
```

5. **Optional quiz:** If user says "quiz me", pick random entries from the period and test recall.

---

## Edge Cases

- **Mixed language input:** If user mixes languages in one message, split and log separately
- **Already logged:** If the exact same word exists in the file, note "already logged on {date}" and skip
- **Corrections:** If user says "fix" or "correct" after an entry, update the existing entry in-place
- **Unknown language:** Ask the user to specify

---

## Files

```
learn-log-vocab/
└── SKILL.md    # This document
```
