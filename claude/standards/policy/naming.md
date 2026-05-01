---
status: proposed
---

# Naming Conventions

Filename patterns for every artifact type in `caol-ila`. Read before creating any new rule, standard, command, skill, or plan file.

For the underlying rationale (verb-form trio, family prefix, scope match, lifecycle phase, default-counter hint) see `principles.md` → "Naming patterns".

---

## Universal rules

| Rule | Apply to |
|------|----------|
| Lowercase only | every artifact |
| Hyphen-separated, no underscores, no camelCase, no spaces | every artifact |
| Max 64 characters | every artifact |
| Filename = slug only — never repeat the folder, project, or type in the name | every artifact |
| Kebab-case 2–5 words | every artifact |
| Abbreviations only if universal | every artifact (`adr`, `vrm`, `pmx`, `ue`, `ci` — not `auth`, `mgr`, `cfg`) |

---

## Per-artifact rules

### Commands & skills (`claude/commands/*.md`, `claude/skills/*/SKILL.md`)

Pattern: `{category}-{verb}-{subject}`

- **Internal:** `{category}-{verb}-{subject}` (e.g. `cci-validate-vrm`, `caol-make-rule`)
- **External wrapper:** `{category}-{repo}-{verb}-{subject}` (e.g. `design-huashu-make-prototype`)
- **Categories:** `cci`, `ue`, `dev`, `review`, `git`, `tutoring`, `writing`, `drink`, `design`, `consulting`, `learn`, `pmx`, `vrm`, `image`, `video`, `project`, `system`, `caol`
- **Verbs:** keep simple — `make` not `generate`, `add` not `append`
- **Be specific** — `tutoring-open-invoice` not just `open-invoice`
- **Avoid redundancy** — `git-make-message` not `git-make-commit-message`

Full rules + external-wrapper details: `~/.claude/rules/author-naming.md`.

### Rules (`claude/rules/*.md`)

Pattern: `{verb-or-domain-or-trigger}.md`

| Rule kind | Naming pattern | Examples |
|-----------|----------------|----------|
| Auto default-counter | `{topic}-defaults.md` or single noun | `git-defaults.md`, `behavior.md`, `security.md` |
| Triggered content-creation | `{noun}-write.md` (verb-form trio) | `code-write.md`, `doc-write.md`, `test-write.md` |
| Triggered domain | `{domain}.md` | `obsidian.md`, `slack.md`, `shotloom.md`, `cinev-git.md` |
| Triggered authoring | `author-{aspect}.md` (family prefix) | `author-naming.md`, `author-frontmatter.md`, `author-permissions.md` |
| Triggered lifecycle phase | `{family}-{phase}.md` (family prefix) | `pr-mutate.md`, `pr-comment.md`, `pr-create.md` |
| Triggered moment | `{verb-phrase}.md` | `session-start.md`, `verify-before-report.md`, `reread-repo-conventions.md` |

**Scope match** — if the rule body is narrower than the obvious name, narrow the name. `git.md` was renamed `git-defaults.md` once PR rules moved out. `writing.md` was renamed `writing-external.md` once internal-prose was excluded.

### Standards (`claude/standards/<group>/*.md`)

Pattern: `{noun-phrase}.md` describing the subject — no verbs.

| Standard kind | Naming pattern | Examples |
|---------------|----------------|----------|
| Policy | `{topic}-policy.md` or descriptive | `agent-first-policy.md`, `garden-review.md`, `principles.md` |
| Authoring | `{thing}.md` | `slash-commands.md`, `command-skill-reference.md` |
| Reference catalog | `{topic}-reference.md` or `{topic}.md` | `javascript-reference.md`, `css-reference.md`, `arp-skeleton.md` |
| Code review | `review-{target}.md` | `review-template.md`, `review-code-rust.md`, `review-ux.md` |
| Workflow | `{topic}-workflow.md` | `cinev-git-workflow.md`, `agent-workflow.md` |

Subgroup folder declares the topical area (one of `policy/`, `authoring/`, `multi-agent/`, `research/`, `review/`, `language/`, `unreal/`, `cinev/`, `obsidian/`, `system/`); never repeat the subgroup in the filename.

### Plans (`docs/plans/*.md`)

Pattern: verb-first when the plan is an execution doc; noun otherwise.

| Plan kind | Naming pattern | Examples |
|-----------|----------------|----------|
| Migration / refactor | `migrate-to-{target}.md`, `split-{thing}.md` | `migrate-to-llm-first.md`, `split-vault-folders.md` |
| Per-ticket plan | `{TICKET-ID}-{slug}.md` | `STL-247-prefilter-removal.md` |
| Garden / review | `garden-{YYYY-MM-DD}.md` | `garden-2026-05-01.md` |

### Vault notes (`{vault}/claude/projects/<project>/<folder>/*.md`)

Folder governs naming. See `~/.claude/standards/obsidian/vault-audience.md`.

| Folder | Pattern | Examples |
|--------|---------|----------|
| `days/` | `YYYY-MM-DD[-slug].md` | `2026-05-01.md`, `2026-05-01-vault-split.md` |
| `learnings/` | kebab-case slug | `bootstrap.md`, `cold-start-trap.md` |
| `topics/` | kebab-case slug | `prefilter-tradeoffs.md` |
| `decisions/` | kebab-case slug describing the decision | `pmx-import-placeholder.md`, `audience-split.md` |
| `ops/missions/<mission>/` | shape: `README`, `briefing`, `conventions`, `timeline`, `log`, `mr` | always these names |
| `ops/runs/` | `YYYY-MM-DD-<slug>.md` or tool-named subdir | `2026-05-01-debug.md`, `codex-runs/` |

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

Renames touch every reference; use the validator `inventory-counts` check to catch broken links.
