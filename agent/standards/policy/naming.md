---
status: accepted
---

# Naming Conventions

Filename patterns for every agent-hub artifact type. Read before creating any new rule, standard, command, skill, or plan file.

For the underlying rationale (verb-form trio, family prefix, scope match, lifecycle phase, default-counter hint) see `principles.md` → "Naming patterns".

## LLM-friendly strategy

File names are routing metadata. A cold-start LLM must infer artifact type, scope, and read timing from the path before opening the file.

| Strategy | Good | Bad |
|----------|------|-----|
| Name the operation, not the metaphor | `LOOKUP.md` | `MAP.md` |
| Name the domain before the mechanism | `platform-adapters.md` | `adapters.md` |
| Use purpose-first config names | `doc-budgets.json` | `managed-values.json` |
| Keep status in frontmatter | `harden-system-drift.md` + `status: active` | `harden-system-drift-active.md` |
| Keep folder context out of filename | `docs/plans/completed/harden-system-drift.md` | `docs/plans/plan-harden-system-drift.md` |
| Use family prefixes for lifecycle siblings | `pr-create.md`, `pr-comment.md`, `pr-mutate.md` | `create.md`, `comment.md`, `mutate.md` |
| Use decision ids for accepted rationale | `0001-platform-neutral-agent-system.md` | `agent-system-notes.md` |

If the folder already supplies type or scope, do not repeat it in the filename.

## Scope

This standard governs **agent-hub repository artifacts only** — files inside `agent/`, `docs/plans/`, and configured Obsidian project note folders.

**Out of scope:**

| Out of scope | Owned by |
|--------------|----------|
| Code identifiers (Rust struct/fn/var, Python class, JS variable, C++ symbol) | each language's own convention (rustfmt, PEP 8, ESLint, project-specific style guide) |
| Filenames in other repos (shotloom, cinev-engine, bevy-vrm, personal projects) | that repo's own `CONTRIBUTING.md` / `AGENTS.md` |
| Unreal Engine asset names (`SM_`, `T_`, `M_`, `BP_`, ...) | `agent/skills/cci-validate-character-mat-slot-names/references/CINEV-CHARACTER-ASSET-NAMING.md` |
| HTML/CSS class names, IDs, custom properties | `agent/skills/frontend-design/references/CSS.md` |
| Variable names inside example snippets in this repo's docs | code conventions of the snippet's language |

When working in another repo, follow that repo's naming rules. This standard does not transfer.

---

## Universal rules

| Rule | Apply to |
|------|----------|
| Lowercase only | every artifact |
| Hyphen-separated, no underscores, no camelCase, no spaces | every artifact |
| Max length from `agent/config/taxonomy.json` key `maxArtifactNameChars` | every artifact |
| Filename = slug only — never repeat the folder, project, or type in the name | every artifact |
| Kebab-case 2–5 words | every artifact |
| Abbreviations only if listed in `agent/config/taxonomy.json` key `universalAbbreviations` | every artifact |

---

## Per-artifact rules

### Skills (`agent/skills/*/SKILL.md`)

Pattern: `{category}-{verb}-{subject}`

- **Internal:** `{category}-{verb}-{subject}` (e.g. `cci-validate-vrm`, `ah-make-rule`)
- **External wrapper:** `{category}-{repo}-{verb}-{subject}` (e.g. `design-huashu-make-prototype`)
- **Categories:** canonical list lives in `agent/config/taxonomy.json` key `skillCategories`
- **Verbs:** keep simple — `make` not `generate`, `add` not `append`
- **Be specific** — `tutoring-open-invoice` not just `open-invoice`
- **Avoid redundancy** — `git-make-message` not `git-make-commit-message`

Full rules + external-wrapper details: `agent/rules/author.md`.

### Rules (`agent/rules/*.md`)

Pattern: `{verb-or-domain-or-trigger}.md`

| Rule kind | Naming pattern | Examples |
|-----------|----------------|----------|
| Auto default-counter | `{topic}-defaults.md` or single noun | `git-defaults.md`, `behavior.md`, `security.md` |
| Triggered content-creation | `{noun}-write.md` (verb-form trio) | `code-write.md`, `doc-write.md`, `test-write.md` |
| Triggered domain | `{domain}.md` | `obsidian.md`, `slack.md`, `cinev-git.md` |
| Triggered authoring | `author.md` (single file when aspects share a trigger) | `author.md` — naming + frontmatter + permissions |
| Triggered lifecycle phase | `{family}-{phase}.md` (family prefix) | `pr-mutate.md`, `pr-comment.md`, `pr-create.md` |
| Triggered moment | `{verb-phrase}.md` | `session-start.md`, `verify-before-report.md`, `reread-repo-conventions.md` |

**Scope match** — if the rule body is narrower than the obvious name, narrow the name. `git.md` was renamed `git-defaults.md` once PR rules moved out. `writing.md` was renamed `writing-external.md` once internal-prose was excluded.

### Standards (`agent/standards/<group>/*.md`)

Pattern: `{noun-phrase}.md` describing the subject — no verbs.

| Standard kind | Naming pattern | Examples |
|---------------|----------------|----------|
| Policy | `{topic}-policy.md` or descriptive | `llm-first-policy.md`, `garden-review.md`, `principles.md` |
| Authoring | `{thing}.md` | `skill-authoring.md`, `artifact-lifecycle.md` |
| Reference catalog | `{topic}-reference.md` or `{topic}.md` | `javascript-reference.md`, `css-reference.md`, `arp-skeleton.md` |
| Code review | `review-{target}.md` | `review-template.md`, `review-code-rust.md`, `review-ux.md` |
| Workflow | `{topic}-workflow.md` | `cinev-git-workflow.md`, `agent-workflow.md` |

Subgroup folder declares the topical area. Canonical subgroup names live in `agent/config/taxonomy.json` key `standardGroups`; never repeat the subgroup in the filename.

### Plans (`docs/plans/**/*.md`)

Pattern: verb-first when the plan is an execution doc; noun otherwise.

Mechanical pattern lives in `agent/config/taxonomy.json` key `planFilenamePattern`.
The filename rule applies across lifecycle folders such as `active/`,
`proposed/`, `drafts/`, `completed/`, `parked/`, and `archive/`.

| Plan kind | Naming pattern | Examples |
|-----------|----------------|----------|
| Migration / refactor | `migrate-to-{target}.md`, `split-{thing}.md` | `migrate-to-llm-first.md`, `split-vault-folders.md` |
| Garden / review | `garden-{YYYY-MM-DD}.md` | `garden-2026-05-01.md` |

### Vault notes (configured project folder)

Folder governs naming. See `agent/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md`.

| Folder | Pattern | Examples |
|--------|---------|----------|
| `days/` | `YYYY-MM-DD[-slug].md` | `2026-05-01.md`, `2026-05-01-vault-split.md` |
| `learnings/` | kebab-case slug | `bootstrap.md`, `cold-start-trap.md` |
| `topics/` | kebab-case slug | `prefilter-tradeoffs.md` |
| `decisions/` | kebab-case slug describing the decision | `pmx-import-placeholder.md`, `audience-split.md` |
| `ops/missions/<mission>/` | shape: `README`, `briefing`, `conventions`, `timeline`, `log`, `mr` | always these names |
| `ops/runs/` | `YYYY-MM-DD-<slug>.md` or tool-named subdir | `2026-05-01-debug.md`, `browser-audit/` |

---

## Anti-patterns

- ❌ Single noun where the body has multiple disjoint phases (`git.md` covering commits + PR mutate + PR comment + PR create — split per phase).
- ❌ Generic name where body is narrow (`writing.md` for external-only prose — name `writing-external.md`).
- ❌ Folder + filename redundancy (`learnings/learning-bootstrap.md` — name `learnings/bootstrap.md`).
- ❌ Type embedded in filename (`*-spec.md` inside `specs/`, `*-rule.md` inside `rules/` — folder already says it).
- ❌ Date in filename outside `days/` and `ops/runs/` (status tracking belongs in frontmatter).
- ❌ Non-universal abbreviations (`auth`, `mgr`, `cfg`, `tmp`, `prev` — write the word).
- ❌ Status suffix (`*-draft.md`, `*-final.md` — declare in frontmatter `status:`).
- ❌ camelCase or `under_score` (kebab-case only).

---

## Disambiguation

When multiple rules / skills / standards in the same area exist, every `description` field must carry a unique keyword. Wrappers should include a `when_to_use:` frontmatter field with `NO when:` negative conditions pointing to siblings.

---

## When you must rename

A rename is correct (not cosmetic) when:

- The body's scope shrank below what the filename promises (split or rename).
- A new family appeared and the old name no longer fits the family pattern (e.g. PR rules emerged → rename `git.md` → `git-defaults.md`).
- The name uses a metaphor where a literal works (`MAP.md` → `LOOKUP.md`).

Renames touch every reference; use validator checks `markdown-links`, `taxonomy`, and `generated-blocks` before commit.
