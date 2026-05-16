---
status: accepted
domains: obsidian
repo-keys: caol-ila
languages: markdown,yaml
task-types: review
context-profile: obsidian-vault
exclude-when: rust,web,unreal
---

# Note Inspection Checklist

Canonical checklist for inspecting one Obsidian note. Use when auditing a single note's quality, not the whole vault. For vault-wide audits use `~/.claude/skills/obsidian-fix-format/`.

The 8 steps below are an inspection order, not a tree. Each step has: check condition, why, and action on violation. Auto-fixable steps map to specific `obsidian-fix-format` checks.

---

## 8-Step Inspection Order

| # | Step | Check | Auto? |
|---|------|-------|-------|
| 1 | frontmatter | 4 fields present (`title` `tags` `date` `source`) | partial |
| 2 | tags | axis allocation + body evidence | manual |
| 3 | H1 | exists, matches title, in first 30 lines | partial |
| 4 | filename | slug only — no folder/project/type repeat | manual |
| 5 | folder audience | matches `VAULT-AUDIENCE.md` policy | manual |
| 6 | purpose visible | first 3-5 lines state what this note is | manual |
| 7 | duplicate / link conflict | basename collision + concept duplication | partial |
| 8 | violation action | what to do for each fail | — |

Every note inspection also checks private PR URL and inline tag hygiene: no `github.com/CINEV/shotloom/pull/...`, no markdown-linked private PRs, and no bare numeric hash prose such as `#1`, `#2`, or `PR #309`.

---

## 1. Frontmatter (4 fields)

**Check:** YAML frontmatter present with `title`, `tags`, `date`, `source`. Optional: `status`, `updated`, `aliases`, `revisit`, `audience`.

Document type is encoded as exactly one `type/...` tag inside `tags`, never as a top-level `type:` field.

**Why:** LLM parses frontmatter before body. Missing fields = cold-start cost.

**Exception:** `/notes/` Korean diary notes — `title + date` 2 fields suffice.

**Auto:** `obsidian-fix-format --check missing-h1` flags H1 missing; frontmatter validation is manual.

**Violation action:** Add missing fields. If the `type/...` tag cannot be inferred, ask the author.

---

## 2. Tags — Slot allocation, not free choice

**Check:** Tags fill axis slots, max 5 total.

| Slot | Required? | Examples |
|------|-----------|----------|
| `type/` | mandatory (1) | `type/devlog`, `type/learning`, `type/journal`, `type/spec`, `type/topic` |
| `project/` | mandatory (1) | `project/shotloom`, `project/mmd-anju` |
| `lang/` | conditional — code-bearing notes | `lang/rust`, `lang/javascript`, `lang/glsl` |
| `lib/` | conditional — code-bearing notes | `lib/threejs`, `lib/bevy` |
| `area/` | recommended — semantic classification | `area/shader`, `area/retarget`, `area/ux` |
| `status/` | only when relevant | `status/draft`, `status/archived` |

**Why:** Free-choice tagging drops `area/` first. Slot allocation forces axis-by-axis review.

**Tag ground rule:** Each tag must have direct evidence in body. `lang/javascript + lib/threejs` covers tools. `area/shader` covers subject. They do not substitute each other.

**Violation action:** Re-tag axis-by-axis. Verify against `TAG-TAXONOMY.md` Live Tag Inventory before adding new tag.

---

## 3. H1

**Check:** Exactly one `# Title` in first 30 lines, matches `frontmatter.title`.

**Why:** H1 = lead anchor for both LLM retrieval and human scanning.

**Auto:** `obsidian-fix-format --check missing-h1` flags. 3-gate auto-backfill: title exists + no H1 + first paragraph not Korean diary prose.

**Violation action:** Insert `# {frontmatter.title}` right after frontmatter, blank line, then body.

---

## 4. Filename

**Check:**
- Files under the configured project root follow `PROJECT-DOCS-STRUCTURE.md`
- `days/` uses `YYYY-MM-DD.md` for the canonical day file
- Same-day split uses `days/YYYY-MM-DD/<slug>.md` only when merge would hide a distinct artifact
- `learnings/` uses the local convention: `learning-<slug>.md` for cross-project, date file or slug under project learning folders
- Durable folders (`plans/`, `topics/`, `specs/`, `decisions/`) use slug only (kebab-case, 2-5 words)
- No folder/project/type repeat (`mmd-player-anju/devlog.md` violates: `devlog` repeats `type/devlog`)
- No date prefix outside `days/` and `ops/runs/`
- No ticket / PR / issue IDs in `days/` filenames
- No status suffix (`-draft` etc — use `status/` tag)

**Why:** Filename appears in wikilinks, search results, file listings. Repetition wastes characters.

**Violation action:**
- `days/2026-04-21-pr-review.md` / `devlog-2026-04-21.md` / `2026-04-21-daily.md` → merge or rename to `days/2026-04-21.md`
- Same date already exists → merge unless the note is a distinct artifact; then move to `days/YYYY-MM-DD/<slug>.md`
- Type-repeat → rename or move into named subfolder (`days/`, `learnings/`)
- Project-root multi-file → keep one hub (`README.md`), move others to subfolder
- Project-root role mismatch → move to the role folder named by `PROJECT-DOCS-STRUCTURE.md`
- Basename collision globally → check `obsidian-fix-format --check collisions`, prefer disambiguation by path

---

## 5. Folder audience

**Check:** Note's content style matches its folder's declared audience per `VAULT-AUDIENCE.md`.

| Folder type | Audience | Style |
|-------------|----------|-------|
| `days/`, `learnings/`, `journal/` | human (self-recall) | structured-narrative |
| `topics/`, `specs/`, `decisions/`, `plans/` | LLM + human | strict LLM-first |
| `ops/runs/` | LLM ephemeral | LLM-first preferred |

**Why:** Prose in a strict-LLM folder = slower retrieval. Strict structure in a journal = author abandons writing.

**Violation action:** Either rewrite to match folder style, or move to a folder matching the actual style.

---

## 6. Purpose visible (first 3-5 lines)

**Check:** Within the first 3-5 body lines, can a cold-start reader (LLM or human) state what this note explains, records, or decides?

**Why:** Purpose-clarity is upstream of tagging. Vague purpose → wrong `type/` or missing `area/`. Re-reading later costs more.

**Violation action:** Add a 1-sentence lead paragraph after H1. For long notes add a `**Conclusion:**` (or `**Lesson:**`) bold takeaway.

---

## 7. Duplicate / wikilink conflict

**Check:**
- Basename collision globally? (`obsidian-fix-format --check collisions`)
- Same concept already covered by an existing note?

**Why:** With 571+ notes, scattered duplicates degrade retrieval more than any tag issue. `[[devlog]]` is ambiguous when 6 notes share the basename.

**Violation action:**
- New note → route to sub-note, merge, or link instead
- Existing duplicate → keep canonical, link the others, archive obsolete
- Basename collision → prefer path-qualified link `[[project/foo|foo]]` or rename

---

## 8. Violation actions — when to auto vs manual

| Violation | Auto-fix | Manual |
|-----------|----------|--------|
| `frontmatter-heading-glued` (`---#`) | ✅ | — |
| Empty directory | ✅ | — |
| H1 missing + 3-gate pass | ✅ (after dry-run approval) | — |
| H1 missing + Korean diary prose | — | author writes lead paragraph |
| Tag slot empty (`area/` missing) | LLM proposes 5 candidates | author selects |
| Filename type-repeat | — | rename + update inbound wikilinks |
| Folder audience mismatch | — | move or rewrite |
| Concept duplicate | — | merge / link / archive decision |

---

## Tagging Workflow — LLM-assisted, human-decided

When adding tags to a new or existing note:

1. **LLM scans body** — proposes max 5 candidates per axis (type, project, lang/lib, area), plus 2-3 rejected candidates with reasons.
2. **Author fills required slots first** — `type/` + `project/`.
3. **Author evaluates conditional slots** — code-bearing? add `lang/` + `lib/`.
4. **Author picks `area/`** — strongest semantic axis. Don't skip when 5-slot budget allows.
5. **Author adds `status/`** only when relevant.
6. **Verify against Live Tag Inventory** in `TAG-TAXONOMY.md` — reuse existing tag, don't invent.

Never write tags blind without seeing body. Never let LLM finalize tags alone — vault long-term consistency is a human judgment.

### Bulk tagging — delegate to subagent

**When to delegate:** more than ~5 notes need re-tagging, or notes are long enough that reading them in main context would burn 20%+ tokens. Dispatch a subagent so main thread stays in conversation with the user.

| Scope | Agent | Model | Background? |
|-------|-------|-------|-------------|
| 1-4 notes, short | main thread | — | — |
| 5-20 notes | `general-purpose` | `sonnet` | foreground |
| 20+ notes or long body | `general-purpose` | `sonnet` | `run_in_background: true` |
| Audit/scan only (read-only) | `Explore` | (default) | foreground |

**Subagent brief must include:**
- Path to `NOTE-INSPECTION-CHECKLIST.md` (this file) and `TAG-TAXONOMY.md`
- Live Tag Inventory verify rule (no inventing tags)
- Slot allocation order (type → project → lang/lib → area → status)
- Output format: `path | current tags | proposed tags | rationale`
- Stop short of writing — return proposals for human approval

The subagent proposes; the user (in main thread) approves or amends. Bulk write happens after approval.

---

## Cross-references

- Tag taxonomy: `~/.claude/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md`
- Folder audience: `~/.claude/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md`
- Format spec: `~/.claude/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md`
- Project structure: `~/.claude/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md`
- Auto rules: `~/.claude/rules/obsidian.md`
- Vault auditor: `~/.claude/skills/obsidian-fix-format/`
