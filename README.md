# caol-ila

**LLM-first repository.** Global Claude Code configuration — commands, skills, standards, rules, and machine config, all optimized for LLM efficiency, accuracy, and clarity. Symlinked to `~/.claude`.

Charter, operational rules, and editing standard: [`claude/CLAUDE.md`](claude/CLAUDE.md) → [`claude/standards/llm-first-docs.md`](claude/standards/llm-first-docs.md). Human-readable output is delivered only on explicit user request.

## Architecture

```
caol-ila/
├── claude/                          # Symlinked to ~/.claude
│   ├── CLAUDE.md                    # System hub (loaded every session)
│   ├── commands/                    # 75 slash commands
│   ├── skills/                      # 153 skill directories
│   ├── standards/                   # 41 reference documents
│   ├── rules/                       # Always-applied constraint files
│   └── private/                     # Personal data vault (gitignored)
│       └── caol-config/             # Machine-specific config JSONs
└── README.md
```

## Setup

```bash
# macOS/Linux
ln -s /path/to/caol-ila/claude ~/.claude

# Windows (admin PowerShell)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.claude" -Target "D:\vs\caol-ila\claude"
```

Then initialize machine config:

```
/caol-manage-config setup
```

This walks through filling in `~/.claude/private/caol-config/` — repo paths, machine tool paths (Obsidian, Blender, UnrealEditor), and hardware specs. Templates live in `skills/caol-manage-config/*.template.json`.

## Commands (75)

| Category | Count | Examples |
|----------|-------|---------|
| `cci-*` | 24 | `art-create-branch`, `manage-art-branch`, `validate-vrm`, `open-project` |
| `caol-*` | 19 | `manage-config`, `make-command`, `make-skill`, `brief-today` |
| `ue-*` | 9 | `analyze-material`, `validate-asset-name`, `check-redirectors` |
| `tutoring-*` | 5 | `log-lesson`, `make-invoice`, `log-consultation` |
| `dev-*` | 4 | `fix-bug`, `generate-spec`, `sync-design` |
| `review-*` | 3 | `audit-ux`, `audit-web`, `audit-web-spec` |
| `git-*` | 3 | `collect-commits`, `make-message`, `pull-repos` |
| others | 8 | `pmx`, `learn`, `drink`, `vrm`, `writing`, `shotloom` |

## Skills (153)

| Category | Count | Focus |
|----------|-------|-------|
| `marketing-*` | 33 | CRO, SEO, copy, ads, content strategy |
| `dev-*` | 26 | Debugging, experiments, tools, design sync |
| `shotloom-*` | 18 | PR workflow, Linear, WASM dev server |
| `cci-*` | 17 | CINEV pipeline, VRM, PMX, Codex |
| `caol-*` | 13 | Config management, skill/command authoring |
| `ue-*` | 7 | Material analysis, asset validation, UE Python |
| `review-*` | 6 | Rust, JS, CSS, UX, 3D, AI motion |
| `obsidian-*` | 5 | Vault management, markdown, JSON canvas |
| `learn-*` | 4 | Devlog, vocab, learning archive |
| `writing-*` | 3 | Human voice, AI fix, Korean |
| others | 21 | `vrm`, `tutoring`, `pmx`, `image`, `design`, `system`, etc. |

## Standards (41)

Reference docs in `standards/` — loaded on-demand, not every session.

| Domain | Files |
|--------|-------|
| Command/skill authoring | `slash-commands.md`, `command-skill-reference.md` |
| Multi-agent ops | `multi-agent-ops.md`, `agent-workflow.md`, `delegation.md` |
| Web / JS / CSS | `javascript.md`, `css.md`, `design-system.md`, `ui-design.md`, `three-shader-language.md` |
| Unreal Engine | `unreal-engine-cpp.md`, `unreal-engine-asset.md` |
| Code review | `review-code-rust.md`, `review-code-javascript.md`, `review-code-css.md`, `review-ux.md`, + 6 more |
| CINEV / Shotloom | `shotloom.md`, `shotloom-programming.md`, `cinev-git-workflow.md`, `cinev-vrm-shading.md` |
| Docs & system | `obsidian-format.md`, `repo-paths-keys.md` |

## Machine Config (`private/caol-config/`)

Gitignored. Per-machine paths and specs.

| File | Content |
|------|---------|
| `repo-paths.json` | Git repo locations keyed by project name |
| `machine-paths.json` | Tool/app paths (`obsidian`, `blender`, `unreal-editor`, fonts) |
| `doc-paths.json` | Document routing rules (Obsidian vault → purpose mapping) |
| `hardware.json` | Hardware specs — populated by `/system-save-hardware` |

Manage with `/caol-manage-config` (show / validate / add / remove / setup).

---

For authoring new commands and skills, see **[CLAUDE.md](claude/CLAUDE.md)**.
