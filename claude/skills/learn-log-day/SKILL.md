---
description: "Log daily work, learnings, and topic files to Obsidian project docs — devlog, learning, or topic references."
argument-hint: "<project> [devlog|learning|topic] [category|name]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(date:*), Bash(git:*)
user-invocable: true
---

# learn-log-day

Log project devlogs, learnings, and topic references to Obsidian using frontmatter, wikilinks, callouts, and structured tags.

## Arguments

- `<project>` — project folder name (e.g. `bevy-vrm`, `mmd-player-anju`)
- `[sub-command]` — defaults to `devlog`
  - `devlog` — add today's work log (default)
  - `learning <worked|failed|gotcha>` — add extracted lesson
  - `topic <name>` — create or edit a topic reference file

**If no project argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /learn-log-day <project>                        — add today's devlog
  /learn-log-day <project> learning worked         — log a successful approach
  /learn-log-day <project> learning failed         — log a failed approach
  /learn-log-day <project> learning gotcha         — log a non-obvious trap
  /learn-log-day <project> topic <name>            — create or edit topic file
```

---

## Step 1: Resolve path

Doc path: !`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh devlog $0`

Use `RESOLVED_PATH` as the project base path. If missing → run [Project Initial Setup](#project-initial-setup).

---

## Step 2: Execute sub-command

### devlog (default)

hub(`devlog.md`) + individual day files (`days/day-{NN}.md`) structure.

#### Collect content via conversation

1. **"What did you work on today?"** — list of tasks
2. **"Any learnings / struggles / discoveries?"** — lessons (skip if none)
3. **"Add commit log?"** — if yes, extract from project repo via `git log --oneline --since="today"`

#### Determine day number

1. Scan `days/` folder for existing files (`day-*.md`)
2. Last day number + 1 = new day number
3. Today's date: `date +%m-%d` format

#### Day file format (`days/day-{NN}.md`)

Template: see `~/.claude/templates/devlog/day.md`

**Rules:**
- Always include "why this work was done" (preserve context)
- Learnings follow **bold one-line summary** + detail pattern
- Key discoveries → `> [!tip]` callout + learnings-index wikilink
- Failures → `> [!warning]` callout
- Reference related topic files with `[[{project}/{topic-name}]]` wikilink
- Commit log and current status are optional (include if user wants)

#### Hub file format (`devlog.md`)

Hub template: see `~/.claude/templates/devlog/hub.md`

**Rules:**
- Hub summary: 3-4 lines per day max
- `[[{project}/days/day-{NN}|detail]]` wikilink required
- Chronological order (oldest at top, newest at bottom)
- Project overview, current status, and TODOs live in hub only (optional in day files)

---

### learning \<category\>

Add lesson to the appropriate category in `learnings-index.md`.

Categories:
- `worked` → `## What Worked`
- `failed` → `## What Failed`
- `gotcha` → `## Gotcha`

#### Collect via conversation

Ask in order: Context, Problem, Solution (worked/gotcha), Why (worked), Rule.

#### learnings-index.md format

Template: see `~/.claude/templates/devlog/learnings.md`

**Rules:**
- YAML frontmatter required (`title`, `tags`, `updated`)
- Rule → `> [!abstract] Rule` callout + inline `#rule` tag
- Reference related day files with `[[{project}/days/day-{NN}]]`
- Reference related topic files with `See [[{project}/{topic-name}]]`
- Update `updated` date

---

### topic \<name\>

Create or edit `{project}/{name}.md`. A self-contained reference on one concept.

#### Topic file format

Template: see `~/.claude/templates/devlog/topic.md`

**Rules:**
- Filename: kebab-case (English)
- YAML frontmatter required
- Self-contained — understandable without reading other files
- Referenced from devlog/learnings via `[[{project}/{name}]]`

---

## Obsidian feature rules

### Frontmatter (Properties)

All files require YAML frontmatter. Follow the tag taxonomy:
**Full taxonomy: `~/.claude/standards/obsidian-tag-taxonomy.md`**

| File | frontmatter tags |
|------|-----------------|
| devlog.md (hub) | `type/devlog`, `project/{name}` |
| days/day-{NN}.md | `type/devlog`, `project/{name}`, `area/...` (if scoped) |
| learnings-index.md | `type/learning`, `project/{name}` |
| topic file | `type/topic`, `project/{name}`, `area/...`, `lang/...` (if applicable) |

Inline tags (`#rule`, `#failed`, `#gotcha`) — learnings body only, not frontmatter axes.

### Wikilinks

- **hub → day:** `[[{project}/days/day-{NN}|detail]]`
- **day → learnings:** `[[{project}/learnings-index#{concept}]]`
- **day → topic:** `[[{project}/{topic-name}]]`
- **cross-project:** `[[bevy-vrm/days/day-03]]`
- **shared reference:** `[[_cross-project/graphics#term]]`

### Callouts

| Use case | Callout type | Location |
|----------|-------------|----------|
| Key discovery / tip | `> [!tip]` | day file — successful approach |
| Failure / caution | `> [!warning]` | day file — failed attempt |
| Extracted rule | `> [!abstract] Rule` | learnings-index |
| Environment / version | `> [!info]` | topic file |

---

## Project initial setup

If the project folder does not exist:

1. Create `{obsidian}/claude/projects/{project}/`
2. Create `days/` directory
3. Create `devlog.md` hub file (frontmatter + project name + ask for description)
4. Create `learnings-index.md` (frontmatter + 3 empty category sections)
5. Start from Day 1

---

## Migrating existing projects

When applying this format to an existing project for the first time:

1. Add frontmatter to existing files (non-destructive — preserve existing content)
2. Add callouts to key discoveries in day files
3. Add callouts + `#rule` tags to rules in learnings-index
4. Connect files with wikilinks
5. **Don't migrate all at once** — update surrounding entries progressively when adding new ones

To split a single `devlog.md` → hub + day files:
1. Extract each dated entry into `days/day-{NN}.md`
2. Convert `devlog.md` to hub (summaries + wikilinks only)

---

## Related

- `obsidian-obsidian-markdown` — Obsidian markdown syntax reference
- `dev-log-experiment` — experiment log (hypothesis → measure → conclude cycle)
- `learn-add-log` — quickly add a single lesson
