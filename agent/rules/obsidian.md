---
load: triggered
trigger: working in the Obsidian vault
---

- **Frontmatter required** — Every `.md` file needs YAML frontmatter with `title`, `tags`, `date`, `source`.
- **H1 is singular** — Exactly 1 H1 per document, placed immediately after frontmatter.
- **Section separators** — `---` horizontal rule between major sections.
- **Wikilinks for images** — `![[folder/file.png]]`. Never use markdown image links for vault content.
- **Wikilinks for internal references** — `[[Note Name]]`.
- **Markdown links for external** — `[text](URL)`. **NEVER in `type/devlog` documents** — devlogs rot quickly and dead links accumulate. Reference resources via `[[wikilink]]` to a dedicated reference note instead.
- **No external-tracker IDs in body prose of `type/devlog` and `type/learning` documents.** Linear (`STL-NN`), Jira, Asana, GitHub PR (`#NNN`), GitHub Issue numbers — all of these rot. Issues get renumbered, archived, deleted, repos move, projects migrate trackers — and the note loses its anchor. Vault notes are durable retrieval *without* depending on an external system. Replace with a descriptive title in the prose ("the thumb-chain naming canonicalization work" instead of `STL-263`; "the four-finger scalar curl PR" instead of `PR #220`). Commit SHAs and ADR-NNNN are OK because they live inside the repo's durable history; everything that points at an issue tracker or a hosting platform's UI is not.
- **Filename convention** — Put routing identity in folders and frontmatter, not filenames. `days/` files use `YYYY-MM-DD.md`; do not add topic, ticket, PR, `daily`, or `devlog` suffixes. Same-day split is exceptional: prefer merging into the day file; if separation is required, use `days/YYYY-MM-DD/<slug>.md`. `learnings/` uses `learning-<slug>.md`; durable folders (`plans/`, `topics/`, `specs/`, `decisions/`) use `<slug>.md`; `ops/runs/` may use `YYYY-MM-DD-HHMM-<slug>.md`.
- **Lists use `-`** — Ordered lists use `1.`.
- **Tags in frontmatter — MANDATORY checklist before save.**
  - Exactly 1 `type/` tag. Exactly 1 `project/` tag. Both required, not optional.
  - For any code-bearing devlog, also add `lang/<language>` + `lib/<framework>` AND `area/<topic>`. `lang+lib` covers the *tool*, `area` covers the *subject* — they do not substitute each other. (e.g. mmd-anju shader devlog: `lang/javascript + lib/threejs + area/shader`.)
  - Slot allocation order before save: required (`type/`, `project/`) → conditional (`lang/`, `lib/`) → semantic (`area/`) → state (`status/`).
  - Max 5 tags total. Don't pad — but a tech devlog with only `type/` + `project/` is too sparse to filter on later.
  - **Verify each tag exists** in `~/.claude/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` Live Tag Inventory before using. If new, add the row to the inventory in the same commit (do not let the reference drift).
  - Inline `#tag` only at document footer for learnings markers (`#rule`, `#failed`, `#gotcha`).
  - **Bulk re-tagging (5+ notes) → delegate to subagent.** Dispatch `general-purpose` (sonnet, `run_in_background: true` for 20+) with the `NOTE-INSPECTION-CHECKLIST.md` brief. Subagent returns `path | current | proposed | rationale`; main thread approves before any write. Do not consume main context reading dozens of bodies.
  - Per-note inspection: see `~/.claude/skills/obsidian-fix-format/references/NOTE-INSPECTION-CHECKLIST.md` (8-step + tagging workflow).
- **Accidental inline tags — NEVER write bare `#NNN` or `#word` in body prose.** Obsidian treats any whitespace-prefixed `#text` as a tag and pollutes the tag pane. Cases that bite: PR/issue numbers (`#154`), hex colors (`#1a1c2c`), checklist items (`#1`, `#TODO`). Fixes in priority order:
  - **Markdown link** for PRs/issues: `[#154](https://github.com/owner/repo/pull/154)` — semantic + safe.
  - **Inline code** for literal references: `` `#154` ``, `` `#1a1c2c` `` — never tagged.
  - **Backslash escape** for plain prose: `\#154`.
  - **Drop the space**: `PR#154` (no space before `#`) is not interpreted as a tag.
  Verify before save: search the body for `(^|\s)#[A-Za-z0-9]` — any hit that isn't an intentional learnings marker (`#rule`/`#failed`/`#gotcha` at document footer) needs one of the fixes above.
- **Location** — `{obsidian-vault}/agent/` for all agent-authored docs.
- **Audience declared by folder** — New project roots and durable folders have a `README.md` declaring audience (LLM | human | both), style (strict LLM-first | structured-narrative), and mutability. Repeated folders (`days/`, `learnings/`) inherit from parent. Default for unmarked folders: strict LLM-first. See `~/.claude/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md`.

## Auto-commit + auto-push for Obsidian-only changes

Exception to `~/.claude/rules/git-defaults.md`. The diff must contain ONLY Obsidian-related files.

| Diff content | Auto-commit allowed? |
|--------------|----------------------|
| Files inside `machine-paths.json → obsidian` / `obsidian-agent-root` / legacy `obsidian-vault-claude` | **Yes** |
| Files inside `obsidian-staging` (currently `caol-ila/agent/obsidian-staging/`) | **Yes** |
| `.md` files with Obsidian frontmatter (`title`, `tags`, `date`, `source`) | **Yes** |
| Mixed: any of the above + code/config | **No** — split the commit, or get explicit approval for the bundle |

Applies to ANY repo and ANY day. The only gate is "diff is purely Obsidian docs".

**Always required, regardless of auto-commit:**

- **PR operations still need per-PR approval.** `gh pr create`, `gh pr merge`, `gh pr close`, `gh pr edit`, and any review/issue comment are NEVER auto-exempt.
- **Repo-specific stricter rules win.** If the repo has its own pre-PR/pre-push gates (e.g. shotloom's fmt/clippy/check/doc-paths chain via `~/.claude/rules/shotloom.md`), run those gates first. The Obsidian exception removes the verbal-approval step, not validation.

Full audience matrix + style policy: `~/.claude/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md`. Format spec + tag conventions: `~/.claude/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md`.
