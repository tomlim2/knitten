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
- **Lists use `-`** — Ordered lists use `1.`.
- **Tags in frontmatter** — Use structured tags: `type/`, `project/`, plus optional `area/`, `lang/`, `lib/`, `fmt/`, `sys/`, `llm/`, `tech/`, `hobby/`, `status/`. Inline `#tag` only at document footer for learnings markers (`#rule`, `#failed`, `#gotcha`).
- **Location** — `{obsidian-vault}/claude/` for all Claude-authored docs.

## Auto-commit + auto-push for Obsidian-only changes

Exception to `~/.claude/rules/git.md`. The diff must contain ONLY Obsidian-related files.

| Diff content | Auto-commit allowed? |
|--------------|----------------------|
| Files inside `machine-paths.json → obsidian` / `obsidian-vault-claude` | **Yes** |
| Files inside `obsidian-staging` (currently `caol-ila/claude/temp-learnings/`) | **Yes** |
| `.md` files with Obsidian frontmatter (`title`, `tags`, `date`, `source`) | **Yes** |
| Mixed: any of the above + code/config | **No** — split the commit, or get explicit approval for the bundle |

Applies to ANY repo and ANY day. The only gate is "diff is purely Obsidian docs".

**Always required, regardless of auto-commit:**

- **PR operations still need per-PR approval.** `gh pr create`, `gh pr merge`, `gh pr close`, `gh pr edit`, and any review/issue comment are NEVER auto-exempt.
- **Repo-specific stricter rules win.** If the repo has its own pre-PR/pre-push gates (e.g. shotloom's fmt/clippy/check/doc-paths chain via `~/.claude/rules/shotloom.md`), run those gates first. The Obsidian exception removes the verbal-approval step, not validation.

Full format spec + tag conventions (read before creating/editing Obsidian docs): `~/.claude/standards/obsidian/obsidian-format.md`.
