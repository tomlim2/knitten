---
description: "Log Obsidian devlogs / learnings / topics (resources) — project-bound or cross-project, single skill, single decision matrix."
argument-hint: "<project|_cross-project> [devlog|learning|topic] [category|slug|name]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(date:*), Bash(git:*), Bash(bash:*)
user-invocable: true
---

# learn-log-day

Three things go in the Obsidian vault every day: **devlog** (오늘 한 일), **learning** (러닝 / 교훈), **topic** (리소스 / self-contained reference). This skill is the one router for all three. No second skill, no raw `resolve.sh` for these — both miss the slash-tracking surface and split the convention.

## Decision matrix

| 쓰는 것 | sub-command | project arg | path |
|---|---|---|---|
| 오늘 프로젝트 작업 일지 | `devlog` (default) | real project | `projects/<P>/days/day-NN.md` + `devlog.md` hub |
| 프로젝트 교훈 | `learning <worked\|failed\|gotcha>` | real project | `projects/<P>/learnings-index.md` (append) |
| 횡단 교훈 (Claude Code, 언어, 도구) | `learning <slug>` | `_cross-project` | `claude/learnings/learning-<slug>.md` (flat) |
| 리소스 / 토픽 (개념·API·결정·how-to) | `topic <name>` | real project or `_cross-project` | `projects/<P>/<name>.md` |
| 횡단 일지 | ❌ 없음 | — | 진짜 프로젝트 devlog 안에서 `[[_cross-project/...]]` 로 링크 |

## Args

- `<project>` — vault folder name (`bevy-vrm`, `mmd-player-anju`, …) or `_cross-project`. **REQUIRED** — no auto-execute on missing arg; show usage and ask.
- `[sub-command]` — `devlog` (default for real projects), `learning`, `topic`. `topic` = "리소스" / "resource".
- `[category|slug|name]`:
  - `learning` + real project → category `worked|failed|gotcha`
  - `learning` + `_cross-project` → kebab-case slug (becomes `learning-<slug>.md`)
  - `topic` → kebab-case `<name>` (English)

```
/learn-log-day shotloom                              # devlog
/learn-log-day bevy-vrm learning gotcha              # project gotcha
/learn-log-day _cross-project learning bevy-event-rename  # cross-project learning
/learn-log-day shotloom topic ecs-ordering           # project resource
/learn-log-day _cross-project topic graphics         # shared reference (existing)
```

---

## Step 1 — Resolve path

| Sub-command | Project | Resolver call |
|---|---|---|
| `devlog` | real | `resolve.sh devlog <project>` |
| `learning <category>` | real | `resolve.sh devlog <project>` (same base) |
| `learning <slug>` | `_cross-project` | `resolve.sh cross-learning` |
| `topic <name>` | real | `resolve.sh topic <project>` |
| `topic <name>` | `_cross-project` | `resolve.sh topic _cross-project` |

Read `RESOLVED_PATH` from output. If real project's folder doesn't exist → run [Project initial setup](#project-initial-setup). `_cross-project` never needs setup — `claude/learnings/` and `claude/projects/_cross-project/` already exist.

---

## Step 2 — Sub-command bodies

Pick the section. Each one points at one template under `~/.claude/templates/devlog/`. Templates carry the canonical frontmatter and inline LLM fill-in instructions — read the template once before each write so frontmatter stays current.

### `devlog` — project day log

Hub (`devlog.md`) + per-day file (`days/day-NN.md`).

1. **Collect** (one question at a time):
   1. "What did you work on today?" → bullet list
   2. "Any learnings / struggles / discoveries?" → optional
   3. "Add commit log?" → if yes: `git log --oneline --since="today 00:00" --author="$(git config user.email)"`
2. **Day number**: scan `days/day-*.md`, pick `max + 1`. Today's date: `date +%m-%d`.
3. **Write** `days/day-NN.md` from `templates/devlog/day.md`. Replace every `{{ALL_CAPS}}` placeholder, drop sections that don't apply (don't leave placeholders behind).
4. **Append hub** `devlog.md` from `templates/devlog/hub.md`'s day-section shape — 3-4 lines max + `[[<P>/days/day-NN|상세]]` wikilink. Hub is summary-only; detail lives in the day file.

Frontmatter (must match template exactly):

| Tag | When |
|---|---|
| `type/devlog` | always |
| `project/<P>` | always |
| `lang/<L>` | day touched code (mandatory then) |
| `lib/<F>` | day touched code (mandatory then) |
| `area/<A>` | always (game-dev / shader / web / hardware / writing / …) |

### `learning <worked\|failed\|gotcha>` — project learnings index

Append a `### {{CONCEPT}}` block to the matching `## What Worked / What Failed / Gotcha` section in `learnings-index.md`. Template: `templates/devlog/learnings.md`.

Ask in order: **Context · Problem · Solution** (worked / gotcha) **· Why it worked** (worked) **· Rule**. Every entry MUST end with `> [!abstract] Rule` callout + `#rule` inline tag — that's the takeaway anyone scanning the file reads first. Update top-level `updated:` field on every append.

Frontmatter: `type/learning` + `project/<P>` + `area/<A>`.

### `learning <slug>` — cross-project learning (only for `_cross-project`)

One flat file per concept: `claude/learnings/learning-<slug>.md`. Existing convention (`learning-rust-traits.md`, `learning-claude-code-hooks.md`, …). Template: `templates/devlog/cross-learning.md`.

If file exists → open for append/edit, don't overwrite. New file → write from template. Body shape: 증상 → 원인 → 검증 → 해결 (skip sections that don't apply for the kind of lesson). End with at least one `#rule` or `#gotcha` inline tag in the body.

Frontmatter: `type/learning` + `project/_cross-project` + (`tool/<T>` for Claude Code / cmux / gh lessons, `lang/+lib/` when language-anchored, `area/<A>`).

### `topic <name>` — resource / reference (리소스)

Self-contained one-concept file: `<base>/<name>.md` (kebab-case English). Template: `templates/devlog/topic.md` carries four shape options — pick one and delete the rest:

| Shape | Default sections | Use for |
|---|---|---|
| Reference | Summary · Reference · Examples · See also | API/option list, command summary, glossary |
| Decision | Context · Options · Decision · Consequences | "Why X over Y" record |
| How-to | Goal · Prerequisites · Steps · Verification · Troubleshooting | Step-by-step procedure |
| Concept | Problem · Mechanism · Why it works · Caveats | Single-idea explainer |

Rule: only ONE shape per file. Mixing shapes is a smell — split into two topics instead.

Frontmatter: `type/topic` + `project/<P>` + `area/<A>` + (optional `lang/+lib/` when code-bearing).

---

## Obsidian conventions (cross-cutting)

### Frontmatter tag rules

Single source of truth: `~/.claude/standards/obsidian/obsidian-tag-taxonomy.md`. Skill enforces:

- Exactly **1** `type/` tag. Exactly **1** `project/` tag. Both required.
- Code-bearing devlog/topic → `lang/` + `lib/` mandatory (both or neither).
- Max **5** tags total. Drop the least informative axis if you exceed.
- Verify each tag exists in the Live Tag Inventory before saving. New tag → add the row in the same commit.

Inline tags (`#rule`, `#failed`, `#gotcha`) live in body callouts/footers ONLY — never in frontmatter `tags:` list. Frontmatter is for axes, body inline is for searchable anchors.

### Wikilinks

| From → To | Form |
|---|---|
| hub → day | `[[<P>/days/day-NN\|상세]]` |
| day → learning entry | `[[<P>/learnings-index#<concept>]]` |
| day → topic | `[[<P>/<topic>]]` |
| anywhere → cross-project topic | `[[_cross-project/graphics#term]]` |
| cross-repo | `[[bevy-vrm/days/day-03]]` |

### Callouts

| Use | Type | Where |
|---|---|---|
| Key discovery | `> [!tip]` | day file |
| Failure / caution | `> [!warning]` | day file |
| Extracted rule | `> [!abstract] Rule` | learnings-index, cross-learning |
| Environment / version | `> [!info]` | topic |

---

## Project initial setup

For a real project whose folder doesn't exist yet:

1. `mkdir -p {obsidian}/claude/projects/<P>/days`
2. Write `devlog.md` hub from `templates/devlog/hub.md` (ask user for one-line description, tech stack, goal).
3. Write `learnings-index.md` from `templates/devlog/learnings.md` — keep the three `##` headings, drop the example `###` entries.
4. Start from `day-01`.

For `_cross-project`: nothing to set up.

---

## Migrating an existing project

Don't bulk-migrate. Apply progressively when adding new entries:

1. Add proper frontmatter to existing files (non-destructive — preserve content).
2. Convert key discoveries to `> [!tip]` callouts as you re-touch them.
3. Move rules into `> [!abstract] Rule` blocks with `#rule` tag as the section is updated.
4. Wire wikilinks between files when you next reference them.
5. Splitting monolithic `devlog.md` → hub + day files: extract each dated entry into `days/day-NN.md`, then strip `devlog.md` down to summaries + wikilinks.

---

## Related skills

- `obsidian-obsidian-markdown` — Obsidian markdown syntax reference (frontmatter / wikilinks / callouts spec)
- `dev-log-experiment` — experiment log (hypothesis → measure → conclude cycle, distinct from daily devlog)
- `caol-resolve-doc-path` — the path resolver this skill wraps. Drop to it directly only for purposes this skill doesn't cover (`notes`, `research`, ad-hoc).
