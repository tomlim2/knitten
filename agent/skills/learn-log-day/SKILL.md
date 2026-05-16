---
description: "Log Obsidian devlogs / learnings / topics (resources) — project-bound or cross-project, single skill, single decision matrix."
argument-hint: "<project|_cross-project> [devlog|learning|topic] [category|slug|name]"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(date:*), Bash(git:*), Bash(bash:*)
user-invocable: true
---

# learn-log-day

Three things go in the Obsidian vault every day: **devlog** (오늘 한 일), **learning** (러닝 / 교훈), **topic** (리소스 / self-contained reference). This skill is the one router for all three. No second skill, no raw `resolve.sh` for these — both miss the slash-tracking surface and split the convention.

## Decision matrix

Project role folders are owned by `obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md`. This skill writes only the `days/`, `learnings/`, and `topics/` roles.

| 쓰는 것 | sub-command | project arg | path |
|---|---|---|---|
| 오늘 프로젝트 작업 일지 | `devlog` (default) | real project | `projects/<P>/days/YYYY-MM-DD.md` |
| 프로젝트 교훈 | `learning <worked\|failed\|gotcha>` | real project | `projects/<P>/learnings/<slug>.md` |
| 횡단 교훈 (언어, 도구) | `learning <slug>` | `_cross-project` | resolver-owned `cross-learning` destination |
| 리소스 / 토픽 (개념·API·결정·how-to) | `topic <name>` | real project or `_cross-project` | `projects/<P>/topics/<name>.md` |
| 횡단 일지 | ❌ 없음 | — | 진짜 프로젝트 devlog 안에서 `[[_cross-project/...]]` 로 링크 |

## Args

- `<project>` — vault folder name (`bevy-vrm`, `mmd-player-anju`) or `_cross-project`. **REQUIRED** — no auto-execute on missing arg; show usage and ask.
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

Read `RESOLVED_PATH` from output. If real project's folder doesn't exist → run [Project initial setup](#project-initial-setup). `_cross-project` uses resolver-owned destinations and does not need project setup.

---

## Step 2 — Sub-command bodies

Pick the section. Each one points at one template under `~/.claude/templates/devlog/`. Templates carry the canonical frontmatter and inline LLM fill-in instructions — read the template once before each write so frontmatter stays current.

### `devlog` — project day log

Per-day file: `days/YYYY-MM-DD.md`.

1. **Collect** (one question at a time):
   1. "What did you work on today?" → bullet list
   2. "Any learnings / struggles / discoveries?" → optional
   3. "Add commit log?" → if yes: `git log --oneline --since="today 00:00" --author="$(git config user.email)"`
2. **Date file**: today's date is `date +%F`; write `days/YYYY-MM-DD.md`.
3. **If the date file exists**: append a new section to that file unless the work is a distinct artifact; distinct artifacts use `days/YYYY-MM-DD/<slug>.md`.
4. **Do not create or append root `devlog.md` hubs**. Existing hubs are legacy migration bridges.

Frontmatter (must match template exactly):

| Tag | When |
|---|---|
| `type/devlog` | always |
| `project/<P>` | always |
| `lang/<L>` | day touched code (mandatory then) |
| `lib/<F>` | day touched code (mandatory then) |
| `area/<A>` | always (`game-dev`, `shader`, `web`, `hardware`, `writing`) |

### `learning <worked\|failed\|gotcha>` — project learnings index

Write or update a concept-first note under `learnings/<slug>.md`. Template: `templates/devlog/learnings.md`.

Ask in order: **Context · Problem · Solution** (worked / gotcha) **· Why it worked** (worked) **· Rule**. Every entry MUST end with `> [!abstract] Rule` callout + `#rule` inline tag — that's the takeaway anyone scanning the file reads first. Update top-level `updated:` field on every append.

Frontmatter: `type/learning` + `project/<P>` + `area/<A>`.

### `learning <slug>` — cross-project learning (only for `_cross-project`)

One file per concept in the resolver-owned cross-learning destination. Existing convention: `learning-rust-traits.md`, `learning-claude-code-hooks.md`. Template: `templates/devlog/cross-learning.md`.

If file exists → open for append/edit, don't overwrite. New file → write from template. Body shape: 증상 → 원인 → 검증 → 해결 (skip sections that don't apply for the kind of lesson). End with at least one `#rule` or `#gotcha` inline tag in the body.

Frontmatter: `type/learning` + `project/_cross-project` + (`tool/<T>` for cmux / gh lessons, `lang/+lib/` when language-anchored, `area/<A>`).

### `topic <name>` — resource / reference (리소스)

Self-contained one-concept file: `topics/<name>.md` (kebab-case English). Template: `templates/devlog/topic.md` carries four shape options — pick one and delete the rest:

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

Canonical reference: `~/.claude/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md`. Skill enforces:

- Exactly **1** `type/` tag. Exactly **1** `project/` tag. Both required.
- Code-bearing devlog/topic → `lang/` + `lib/` mandatory (both or neither).
- Max **5** tags total. Drop the least informative axis if you exceed.
- Verify each tag exists in the Live Tag Inventory before saving. New tag → add the row in the same commit.

Inline tags (`#rule`, `#failed`, `#gotcha`) live in body callouts/footers ONLY — never in frontmatter `tags:` list. Frontmatter is for axes, body inline is for searchable anchors.

### Wikilinks

| From → To | Form |
|---|---|
| day → learning entry | `[[<P>/learnings/<slug>]]` |
| day → topic | `[[<P>/topics/<topic>]]` |
| anywhere → cross-project topic | `[[_cross-project/graphics#term]]` |
| cross-repo | `[[bevy-vrm/days/2026-04-13/orchestrator]]` |

### Private PRs and inline tags

- Do not write private repository PR URLs in vault notes. For Shotloom, never include `github.com/CINEV/shotloom/pull/...`; write `PR 309` or a descriptive work title instead.
- Do not use markdown links for private PRs. `[#309](https://github.com/CINEV/shotloom/pull/309)` leaks the private UI path and also encourages bare `#NNN` prose nearby.
- Do not write bare numeric hash references in body prose. Use `Finding 1`, `case 2`, `item 3`, or `PR 309`; never `#1`, `#2`, or `PR #309`.
- Before saving, scan for `github.com/CINEV/shotloom/pull/` and `(^|\s)#[A-Za-z0-9]`. Only intentional footer markers (`#rule`, `#failed`, `#gotcha`) may remain.

### Callouts

| Use | Type | Where |
|---|---|---|
| Key discovery | `> [!tip]` | day file |
| Failure / caution | `> [!warning]` | day file |
| Extracted rule | `> [!abstract] Rule` | project learning, cross-learning |
| Environment / version | `> [!info]` | topic |

---

## Project initial setup

For a real project whose folder doesn't exist yet:

1. Resolve `devlog`, `learning`, and `topic` destinations for `<P>`, then create the returned folders.
2. Write `README.md` with audience, style, mutability, and the active role folders.
3. Add folder README files only for durable role folders when created (`topics/`, `specs/`, `plans/`, `decisions/`, `asks/`, `ops/missions/`).
4. Start day logging with `days/YYYY-MM-DD.md`.

For `_cross-project`: nothing to set up.

---

## Migrating an existing project

Don't bulk-migrate. Apply progressively when adding new entries:

1. Add proper frontmatter to existing files (non-destructive — preserve content).
2. Convert key discoveries to `> [!tip]` callouts as you re-touch them.
3. Move rules into `> [!abstract] Rule` blocks with `#rule` tag as the section is updated.
4. Wire wikilinks between files when you next reference them.
5. Splitting monolithic `devlog.md` → date files: extract each dated entry into `days/YYYY-MM-DD.md` or `days/YYYY-MM-DD/<slug>.md`, then reduce `devlog.md` to a temporary migration hub or delete it.

---

## Related skills

- `obsidian-obsidian-markdown` — Obsidian markdown syntax reference (frontmatter / wikilinks / callouts spec)
- `dev-log-experiment` — experiment log (hypothesis → measure → conclude cycle, distinct from daily devlog)
- `caol-resolve-doc-path` — the path resolver this skill wraps. Drop to it directly only for purposes this skill doesn't cover (`notes`, `research`, ad-hoc).
