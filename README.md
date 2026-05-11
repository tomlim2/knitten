# caol-ila

**LLM-first repository.** Agent configuration — commands, skills, standards, rules, and machine config, all optimized for LLM efficiency, accuracy, and clarity. `agent/` is symlinked to `~/.claude`.

Canonical policy: [`SYSTEM.md`](SYSTEM.md). Agent hub overview: [`AGENT-HUB.md`](AGENT-HUB.md). System terms: [`docs/reference/system-glossary.md`](docs/reference/system-glossary.md). Entry documents: [`CLAUDE.md`](CLAUDE.md) for Claude Code, [`AGENTS.md`](AGENTS.md) for Codex. Editing standard: [`agent/standards/policy/llm-first-docs.md`](agent/standards/policy/llm-first-docs.md). Human-readable output is delivered only on explicit user request.

Goal-to-doc lookup: [`LOOKUP.md`](LOOKUP.md). When the question is "where is X?" — start there.

---

## Layout

```
caol-ila/
├── SYSTEM.md                 # Shared agent-agnostic policy
├── AGENT-HUB.md              # Generated hub overview
├── CLAUDE.md                 # Claude Code entry document
├── AGENTS.md                 # Codex entry document
├── docs/
│   ├── decisions/            # Accepted policy decisions and rationale
│   ├── plans/                # Migration and follow-up plans
│   └── reference/            # Lookup docs such as system glossary
├── agent/                    # Symlinked to ~/.claude
│   ├── CLAUDE.md             # Claude Code deploy shim
│   ├── rules/                # Always-applied constraints
│   ├── standards/            # Reference docs, on-demand
│   ├── commands/             # Slash command .md files
│   ├── skills/               # Skill directories with SKILL.md
│   ├── config/               # Shared registries and service config
│   └── private/              # Gitignored — machine config, secrets
│       └── caol-config/      # Per-machine paths and specs (JSON)
└── README.md
```

Counts are validated by `scripts/validate-llm-first.mjs`.

---

## Setup

```bash
# macOS / Linux
ln -s /path/to/caol-ila/agent ~/.claude

# Windows (admin PowerShell)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude" -Target "D:\vs\caol-ila\agent"
```

After symlinking, initialize machine config:

```
/caol-manage-config setup
```

This populates `~/.claude/private/caol-config/` from templates in `agent/skills/caol-manage-config/*.template.json`.

---

<!-- generated:readme-inventory -->
## Commands (45)

| Category | Count | Examples |
|----------|------:|----------|
| `cci-*` | 18 | `cci-art-create-branch`, `cci-art-prepare-merge`, `cci-art-remove-branch` |
| `caol-*` | 15 | `caol-check-status`, `caol-check-updates`, `caol-consult-codebase` |
| `dev-*` | 3 | `dev-fix-bug`, `dev-open-pmx2vrm`, `dev-sync-design` |
| `ue-*` | 3 | `ue-make-skill`, `ue-restore-deleted`, `ue-write-cpp` |
| `tutoring-*` | 2 | `tutoring-mark-paid`, `tutoring-open-invoice` |
| `git-*` | 1 | `git-make-message` |
| `learn-*` | 1 | `learn-add-log` |
| `shotloom-*` | 1 | `shotloom-linear-create-issue` |
| `writing-*` | 1 | `writing-apply-voice` |

---

## Skills (125)

| Category | Count |
|----------|------:|
| `dev-*` | 24 |
| `shotloom-*` | 21 |
| `caol-*` | 16 |
| `cci-*` | 10 |
| `review-*` | 7 |
| `ue-*` | 7 |
| `obsidian-*` | 6 |
| `video-*` | 5 |
| `learn-*` | 4 |
| `design-*` | 3 |
| `vrm-*` | 3 |
| `writing-*` | 3 |
| `git-*` | 2 |
| `image-*` | 2 |
| `pmx-*` | 2 |
| `tutoring-*` | 2 |
| `algorithmic-*` | 1 |
| `brand-*` | 1 |
| `canvas-*` | 1 |
| `claude-*` | 1 |
| `consulting-*` | 1 |
| `drink-*` | 1 |
| `frontend-*` | 1 |
| `system-*` | 1 |

---

## Standards (45)

Reference docs in `agent/standards/`. Loaded on-demand, never auto.

| Group | Count | Files |
|-------|------:|-------|
| `authoring/` | 2 | `command-skill-reference.md`, `slash-commands.md` |
| `cinev/` | 4 | `cci-slack.md`, `cinev-character-asset-naming.md`, `cinev-git-workflow.md`, `cinev-vrm-shading.md` |
| `language/` | 7 | `css-reference.md`, `css.md`, `design-system.md`, `javascript-reference.md`, `javascript.md`, `three-shader-language.md`, `ui-design.md` |
| `multi-agent/` | 2 | `agent-workflow.md`, `delegation.md` |
| `obsidian/` | 4 | `note-inspection-checklist.md`, `obsidian-format.md`, `obsidian-tag-taxonomy.md`, `vault-audience.md` |
| `policy/` | 6 | `garden-review.md`, `llm-first-docs.md`, `llm-first-policy.md`, `naming.md`, `platform-adapters.md`, `principles.md` |
| `research/` | 2 | `research-methodology.md`, `tech-spec-template.md` |
| `review/` | 13 | `review-3d-rendering.md`, `review-ai-motion.md`, `review-code-astro.md`, `review-code-css.md`, `review-code-javascript.md`, `review-code-tsl.md`, `review-code-unreal-cpp.md`, `review-code-unreal-python.md`, `review-spec-doc.md`, `review-template.md`, `review-ux-python-gui.md`, `review-ux-writing.md`, `review-ux.md` |
| `system/` | 1 | `repo-paths-keys.md` |
| `unreal/` | 3 | `arp-skeleton.md`, `unreal-engine-asset.md`, `unreal-engine-cpp.md` |
| `root` | 1 | `index.md` |

---

## Rules (26)

Rules in `agent/rules/`. Auto rules load every session via entry documents; triggered rules load on demand.

| Load | Count | Files |
|------|------:|-------|
| `auto` | 8 | `ambiguity-scoring.md`, `behavior.md`, `canonical-first.md`, `external-recommendation-cross-check.md`, `git-defaults.md`, `security.md`, `session-start.md`, `verify-before-report.md` |
| `triggered` | 17 | `author-frontmatter.md`, `author-naming.md`, `author-permissions.md`, `cinev-git.md`, `code-write.md`, `doc-write.md`, `metaphor-style.md`, `obsidian.md`, `pr-comment.md`, `pr-create.md`, `pr-mutate.md`, `reread-repo-conventions.md`, `shotloom.md`, `slack.md`, `task-context-routing.md`, `test-write.md`, `writing-external.md` |
| `index` | 1 | `index.md` |
<!-- /generated:readme-inventory -->

---

## Machine config (`private/caol-config/`)

Gitignored. Per-machine paths and specs.

| File | Content |
|------|---------|
| `repo-paths.json` | Git repo locations keyed by project name |
| `machine-paths.json` | Tool/app paths (`obsidian`, `blender`, `unreal-editor`, fonts) |
| `doc-paths.json` | Document routing (Obsidian vault → purpose mapping) |
| `hardware.json` | Hardware specs — populated by `/system-save-hardware` |

Manage with `/caol-manage-config` (subcommands: `show`, `validate`, `add`, `remove`, `setup`).

## Shared registries (`agent/config/`)

| File | Content |
|------|---------|
| `agent-hub.json` | Harness, shared layer, registry, generated document, runtime path, and validator manifest |
| `context-routing.json` | Task route axes, context profiles, pilot files, and routing fixtures |
| `doc-budgets.json` | Document length budgets used by validator checks |
| `frontmatter-schema.json` | Frontmatter enum values and pilot metadata files |
| `taxonomy.json` | Skill/command categories, standard groups, naming patterns |
| `audit-policy.json` | Garden review thresholds and severity tiers |
| `exceptions.json` | Grandfathered exceptions with reason, decision, review date |

---

For authoring new commands and skills, start at [`SYSTEM.md`](SYSTEM.md), then read `agent/skills/caol-make-command/SKILL.md` or `agent/skills/caol-make-skill/SKILL.md`.
