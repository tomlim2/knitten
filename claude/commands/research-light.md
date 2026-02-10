---
description: Lightweight research for casual topics
argument-hint: "<topic>"
allowed-tools: Task, WebSearch, WebFetch, Read, Write
---

# Research Light

Quick web research for everyday topics — wine, food, lifestyle, hobbies, general curiosity.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `research-light`

## Target

$ARGUMENTS

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /research-light <topic>
Example: /research-light 입문자용 위스키 추천 기준
Example: /research-light natural wine vs conventional wine
Example: /research-light 오키나와 3박4일 여행 코스
```

## Execution Strategy

Launch **one agent** — keep it fast and focused.

### Single Agent: Practical Sources

Search for curated recommendations, expert opinions, and community consensus.

**Task**: Search for and analyze:
- Expert reviews and buying guides
- Community recommendations (Reddit, forums, specialized blogs)
- Comparison articles and ranking lists
- Practical tips and criteria from experienced practitioners

**Search tips**:
- Include Korean search queries when the topic benefits from Korean sources
- Prefer recent content (include year in query)
- Look for "how to choose", "best", "guide", "추천", "기준", "고르는 법"

**Output**: Return key criteria, top recommendations, and practical tips with source URLs.

## Output Format

### {Topic} — 핵심 정리

**선택 기준:**
1. {Criterion 1} — {Why it matters}
2. {Criterion 2} — {Why it matters}
3. ...

**추천 / 핵심 내용:**
- {Recommendation or key insight with brief rationale}
- ...

**알아두면 좋은 것:**
- {Practical tip or gotcha}
- ...

**Sources:**
1. [Title] - [URL]
2. ...

## Save to Private

If the user wants to keep the results, save to:

```
~/.claude/private/research/{topic-slug}.md
```

Ask before saving — casual research doesn't always need to be kept.
