---
description: "Structure rules and templates for creating Claude Code skills. Use when creating new skills."
platforms: claude
portability: harness-specific
---

# caol-make-skill

Skill creation generator for Claude Code with comprehensive structure rules.

## Purpose

Authoritative rulebook for skill creation. Claude Code merged custom commands into skills: a file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. Skills are the recommended format — they support directories, supporting files, subagent execution, dynamic context injection.

---

## Skill Structure

```
skills/{category}-{verb}-{subject}/
├── SKILL.md              # required
├── script.py             # main implementation
├── config.json           # optional config
├── reference.md          # loaded on-demand
├── examples.md           # loaded on-demand
└── scripts/              # executed, not loaded as context
```

`SKILL.md` is the only required file. Other files inside the skill dir are **not auto-loaded** — Claude reads them on-demand when SKILL.md references them.

---

## Skill vs Command Precedence

If skill `skills/foo/SKILL.md` and command `commands/foo.md` share a name, **the skill wins**.

Location priority when the same skill appears in multiple scopes:
```
enterprise > personal (~/.claude/skills/) > project (.claude/skills/)
```

Plugin skills use `plugin-name:skill-name` namespace — never conflict.

---

## Naming Convention (MANDATORY)

**`{category}-{verb}-{subject}` pattern** — same as commands. See `caol-make-command` for complete rules.

- Lowercase only, no camelCase
- Hyphens as separators, never underscores
- Max 64 characters (per official docs: lowercase letters, numbers, hyphens)
- Multi-word subjects: hyphens (e.g., `asset-name`)

### Examples

| Skill Directory | Category | Verb | Subject |
|-----------------|----------|------|---------|
| `git-commit-collector` | git | commit | collector |
| `ue-analyze-material` | ue | analyze | material |
| `caol-make-skill` | caol | make | skill |

---

## Category Registry

Canonical command and skill categories live in `~/.claude/config/taxonomy.json` under `skillCommandCategories`.

When creating a skill:

1. Extract the category prefix before the first hyphen.
2. Reuse an existing prefix from `skillCommandCategories`.
3. If a new prefix is required, patch `taxonomy.json` in the same change and keep the array sorted.
4. Run `node scripts/validate-llm-first.mjs --check taxonomy` from the caol-ila repo root.

---

## Routing Metadata

When creating a skill, also read `~/.claude/config/context-routing.json`.

Add routing fields when the skill is repo-specific, domain-specific, high-cost, or likely to load sibling standards:

```yaml
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: implementation
context-profile: rust-bevy
exclude-when: unreal,obsidian
```

If no existing context profile fits, add one to `context-routing.json` or add a `metadataExemptions` entry with reason, decision, and review date. Then run `node scripts/validate-llm-first.mjs --check context-routing`.

---

## UE skills — use the dedicated template

**For `ue-*` (Unreal Engine) skills**, use `/ue-make-skill <verb> <noun>`. Template at `~/.claude/skills/ue-show-template/SKILL.md`. UE skills require specific Python patterns (run_in_editor.py, JSON export to `~/.claude/private/unreal/{noun}-{verb}/`, `[LogTag]` prefixes, and other patterns) — see reference.md for the full rationale.

---

## Frontmatter Fields (CRITICAL — full table)

All fields are optional; only `description` is recommended. Canonical: <https://code.claude.com/docs/en/skills>.

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | directory name | Display name. Lowercase, digits, hyphens; max 64 chars. |
| `description` | string | first paragraph of body | What the skill does and when to use it. Front-load the key use case — combined with `when_to_use`, capped at 1,536 chars. |
| `when_to_use` | string | — | Additional trigger guidance. Appended to `description`. |
| `argument-hint` | string | — | Autocomplete hint, e.g. `"[issue-number]"`. |
| `allowed-tools` | string or list | — | Tools usable without per-use approval. Does NOT restrict other tools. |
| `disable-model-invocation` | boolean | `false` | `true` = user-only; Claude cannot auto-invoke. Use for deploys, commits. |
| `user-invocable` | boolean | `true` | `false` = hide from `/` menu; Claude-only. Background/reference skills. |
| `model` | string | session | Per-skill model override. |
| `effort` | `low`\|`medium`\|`high`\|`xhigh`\|`max` | session | Per-skill effort override. |
| `context` | `fork` | inline | Set to `fork` to run in a forked subagent context. |
| `agent` | `Explore`\|`Plan`\|`general-purpose`\|custom | `general-purpose` | Subagent type when `context: fork`. |
| `paths` | string or list of globs | — | Auto-activation restricted to matching files (monorepo). |
| `shell` | `bash`\|`powershell` | `bash` | Interpreter for `` !`command` `` injections. PowerShell needs `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`. |
| `hooks` | object | — | Per-skill lifecycle hooks. |

### Bash Tool Specificity

**NEVER use bare `Bash`** in `allowed-tools`. Always use specific patterns: `Bash(git:*)`, `Bash(python:*)`, `Bash(npm:*)`, `Bash(open:*)`, and similar.

### Canonical minimal example

```yaml
---
name: explain-code
description: Explains code with visual diagrams and analogies. Use when explaining how code works.
---
```

See [reference.md](reference.md) for examples of: user-only deploy with pre-approved tools, research skill in forked Explore agent, monorepo `paths`-scoped skill.

---

## String Substitutions (overview)

- `$ARGUMENTS` — full arg string
- `$ARGUMENTS[N]` / `$N` — 0-based positional ($0 = first)
- `${CLAUDE_SESSION_ID}` — current session id
- `${CLAUDE_SKILL_DIR}` — absolute dir of current SKILL.md

Worked examples for each in [reference.md](reference.md).

## Dynamic Shell Injection (overview)

Skills can embed live shell output into the prompt before Claude sees it (preprocessing — Claude sees the rendered content, not the command). Inline: `` !`git rev-parse --abbrev-ref HEAD` ``. Block form: ` ```! ` fenced. Full patterns in reference.md.

---

## Loading Lifecycle (CRITICAL)

Three phases: **discovery** (session start), **invocation** (when used), **compaction** (when summarized).

### Session start (discovery)

Claude Code scans skills and loads **only the frontmatter** (`name`, `description`, `when_to_use`). Body not read until invoked.

- Target startup cost: ~100 tokens (frontmatter only)
- `description` + `when_to_use` capped at 1,536 chars in listing
- **Front-load the "when to use" phrase** so the right skill wins without loading its body.

> **Known gap:** [claude-code#14882](https://github.com/anthropics/claude-code/issues/14882) reports `/context` shows skills consuming full token count at startup instead of frontmatter-only. Status open as of 2026-04. Assume worst case — keep SKILL.md lean.

### Invocation (on use)

Full `SKILL.md` body loads into conversation as a single message and stays for the session (subject to compaction). Files other than SKILL.md are **loaded on-demand** — only when SKILL.md body points at them.

Reference them explicitly:

```markdown
## Additional resources
- API details → see [reference.md](reference.md)
- Worked examples → see [examples.md](examples.md)
```

### Rule of thumb (HARD RULES)

- **Target: ≤ 200 lines.** Fits comfortably inside 5k compaction budget (≈2-3k tokens), leaves headroom, minimizes startup payload if #14882 is real.
- **Hard limit: ≤ 500 lines.** Matches 5k budget ceiling — over this, critical rules risk truncation.
- Over 200: push heavy prose, long tables, large examples to `reference.md` / `examples.md`. Keep critical rules, checklists, invariants in SKILL.md.

### Compaction (auto-summarize)

When session is summarized:
- Only the **most recent invocation** of each skill is re-attached.
- Only the **first 5,000 tokens** of each re-attached skill survive.
- Re-attached skills share a combined **25,000-token budget**, filled most-recent-first — older skills may be dropped.

**Therefore:** put critical rules, checklists, and invariants in the **first ~5,000 tokens** of SKILL.md. Long reference material that survives compaction poorly belongs in `reference.md`.

---

## SKILL.md Required Sections

1. **Frontmatter** — at minimum `description`
2. **Title** — `# {category}-{verb}-{subject}`
3. **Description** — one-line summary
4. **Purpose** — detailed explanation
5. **Usage** — how to use with examples
6. **Files** — list + describe all files in the skill

Optional: Dependencies / Configuration / Output Format / Related Files / Examples / Troubleshooting.

Full template in [reference.md](reference.md).

## Additional Resources

For the full SKILL.md template, detailed frontmatter examples (user-only deploy, forked agent, monorepo `paths`), String Substitutions worked examples, Dynamic Shell Injection patterns, UE-skill rationale, and subagent/visual-output patterns, see [reference.md](reference.md).

Canonical docs: <https://code.claude.com/docs/en/skills>. Slash-commands standard: `~/.claude/standards/authoring/slash-commands.md`.
