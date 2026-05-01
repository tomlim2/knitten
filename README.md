# caol-ila

**LLM-first repository.** Global Claude Code configuration — commands, skills, standards, rules, and machine config, all optimized for LLM efficiency, accuracy, and clarity. Symlinked to `~/.claude`.

Charter, operational rules, and editing standard: [`claude/CLAUDE.md`](claude/CLAUDE.md) → [`claude/standards/policy/llm-first-docs.md`](claude/standards/policy/llm-first-docs.md). Human-readable output is delivered only on explicit user request.

Goal-to-doc lookup: [`LOOKUP.md`](LOOKUP.md). When the question is "where is X?" — start there.

---

## Layout

```
caol-ila/
├── claude/                   # Symlinked to ~/.claude
│   ├── CLAUDE.md             # Session hub (loaded every session)
│   ├── rules/      (15)      # Always-applied constraints (terse, ≤50 lines each)
│   ├── standards/  (38)      # Reference docs, on-demand
│   ├── commands/   (45)      # Slash command .md files
│   ├── skills/     (131)     # Skill directories with SKILL.md
│   └── private/              # Gitignored — machine config, secrets
│       └── caol-config/      # Per-machine paths and specs (JSON)
└── README.md
```

Counts are live as of v3.0.0; see directory listings for current truth.

---

## Setup

```bash
# macOS / Linux
ln -s /path/to/caol-ila/claude ~/.claude

# Windows (admin PowerShell)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude" -Target "D:\vs\caol-ila\claude"
```

After symlinking, initialize machine config:

```
/caol-manage-config setup
```

This populates `~/.claude/private/caol-config/` from templates in `claude/skills/caol-manage-config/*.template.json`.

---

## Commands (45)

| Category | Count | Examples |
|----------|------:|---------|
| `cci-*` | 18 | `cci-art-create-branch`, `cci-validate-vrm`, `cci-open-project` |
| `caol-*` | 15 | `caol-manage-config`, `caol-make-command`, `caol-make-skill` |
| `ue-*` | 3 | `ue-analyze-material`, `ue-validate-asset-name`, `ue-check-redirectors` |
| `dev-*` | 3 | `dev-fix-bug`, `dev-generate-spec`, `dev-sync-design` |
| `tutoring-*` | 2 | `tutoring-log-lesson`, `tutoring-make-invoice` |
| `git-*` | 1 | `git-make-message` |
| `learn-*` | 1 | `learn-log-day` |
| `shotloom-*` | 1 | `shotloom-start-code` |
| `writing-*` | 1 | `writing-fix-ai` |

---

## Skills (131)

| Category | Count |
|----------|------:|
| `dev-*` | 26 |
| `shotloom-*` | 19 |
| `cci-*` | 17 |
| `caol-*` | 15 |
| `ue-*` | 7 |
| `review-*` | 7 |
| `video-*` | 5 |
| `obsidian-*` | 5 |
| `learn-*` | 4 |
| `writing-*` | 3 |
| `vrm-*` | 3 |
| `tutoring-*` | 3 |
| `design-*` | 3 |
| `pmx-*` | 2 |
| `image-*` | 2 |
| `git-*` | 2 |
| Single-file categories | 8 |

`Single-file categories` (one skill each): `system`, `frontend`, `drink`, `consulting`, `claude`, `canvas`, `brand`, `algorithmic-art`. Authoritative list — see `claude/skills/` directory.

---

## Standards (42)

Reference docs in `claude/standards/`. Loaded on-demand, never auto.

| Group | Files |
|-------|-------|
| Policy | `agent-first-policy.md`, `garden-review.md` |
| Authoring | `llm-first-docs.md`, `slash-commands.md`, `command-skill-reference.md` |
| Multi-agent ops | `multi-agent-ops.md`, `agent-workflow.md`, `delegation.md` |
| Web / JS / CSS | `javascript.md`, `javascript-reference.md`, `css.md`, `css-reference.md`, `design-system.md`, `ui-design.md`, `three-shader-language.md` |
| Unreal Engine | `unreal-engine-cpp.md`, `unreal-engine-asset.md`, `arp-skeleton.md` |
| Code review | `review-template.md`, `review-spec-doc.md`, `review-ai-motion.md`, `review-3d-rendering.md`, `review-code-css.md`, `review-code-javascript.md`, `review-code-tsl.md`, `review-code-unreal-cpp.md`, `review-code-unreal-python.md`, `review-ux.md`, `review-ux-python-gui.md`, `review-ux-writing.md` |
| CINEV | `cinev-git-workflow.md`, `cinev-character-asset-naming.md`, `cinev-vrm-shading.md`, `cci-slack.md` |
| Obsidian | `vault-audience.md`, `obsidian-format.md`, `obsidian-tag-taxonomy.md` |
| Research / specs | `research-methodology.md`, `tech-spec-template.md` |
| System | `repo-paths-keys.md`, `codex-keys.md` |
| Index | `index.md` |

---

## Rules (22)

Always-applied constraints in `claude/rules/`. Loaded every session via CLAUDE.md `@import`.

| Group | Files |
|-------|-------|
| Core (auto, default-counters) | `git.md`, `behavior.md`, `verify-before-report.md`, `security.md`, `session-start.md` |
| Workflow (triggered) | `coding.md`, `reread-repo-conventions.md`, `testing.md`, `slack.md`, `writing.md`, `doc-write.md` |
| PR lifecycle (triggered) | `pr-mutate.md`, `pr-comment.md`, `pr-create.md` |
| Authoring (triggered) | `naming.md`, `command-frontmatter.md`, `tool-permissions.md` |
| Domain (triggered) | `obsidian.md`, `cinev-git.md`, `multi-agent.md`, `shotloom.md` |
| Index | `index.md` |

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

---

For authoring new commands and skills, see [`claude/CLAUDE.md`](claude/CLAUDE.md) — the session hub.
