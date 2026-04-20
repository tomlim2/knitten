# caol-ila

Global Claude Code configuration. Commands, skills, standards, and config — all in one place, symlinked to `~/.claude`.

## Architecture

```
caol-ila/
├── claude/                      # Symlinked to ~/.claude
│   ├── CLAUDE.md                # System docs (loaded every session)
│   ├── commands/                # 72 slash commands
│   ├── skills/                  # 56 skill directories
│   │   ├── _shared/             # Shared utilities
│   │   └── skill-server/        # Dashboard + usage tracking (port 972)
│   ├── standards/               # 31 reference documents
│   ├── config/                  # Shared config (slack.json, .env)
│   └── private/                 # Personal data vault (gitignored)
└── README.md
```

## Commands (72)

| Category | Commands |
|----------|----------|
| **caol** | `check-status`, `switch-context` |
| **cocv** | `art-create-branch`, `art-prepare-merge`, `art-remove-branch`, `art-send-notice`, `art-send-merge-notice`, `art-send-merge-result`, `download-vrm-z`, `format-comment`, `linear-create-issue`, `make-mr`, `manage-art-branch`, `open-creator-character`, `open-creator-launcher`, `open-creator-shipper`, `open-creator-vroid`, `open-project`, `open-zo-downloader`, `register-character`, `rename-mat-slot`, `review-cpp`, `slack-send-message`, `summarize-commit`, `validate-character-mat-slot-names`, `validate-vrm` |
| **dev** | `fix-bug`, `generate-spec`, `open-pmx2vrm`, `sync-design` |
| **drink** | `log-entry` |
| **git** | `collect-commits`, `make-message`, `pull-repos` |
| **learn** | `add-log`, `log-vocab` |
| **meta** | `check-refs`, `check-updates`, `consult-codebase`, `explore-codebase`, `generate-sitemap`, `new-command`, `new-skill`, `open-dashboard`, `register-refs`, `research-light`, `research-rules`, `research-web`, `review-claude-md`, `review-skills`, `update-docs`, `update-skills`, `work-ultra` |
| **pmx** | `convert-vrm`, `read-data` |
| **review** | `audit-ux`, `audit-web`, `audit-web-spec` |
| **tutoring** | `log-consultation`, `log-lesson`, `make-invoice`, `mark-paid`, `open-invoice` |
| **ue** | `analyze-material`, `check-redirectors`, `cleanup-assets`, `generate-spritesheet`, `new-skill`, `validate-asset-name`, `write-cpp` |
| **vrm** | `read-data` |
| **writing** | `apply-voice` |

## Skills (56)

| Category | Skills |
|----------|--------|
| **cocv** | `art-send-notice`, `deploy-pmx-character`, `download-vrm-z`, `manage-art-branch`, `rename-mat-slot`, `serve-mcp`, `sync-ta-tools`, `validate-character-mat-slot-names`, `validate-vrm` |
| **consulting** | `log-session` |
| **design** | `show-components` |
| **dev** | `ask-gemini`, `check-publish`, `export-resume`, `generate-spec`, `open-matcap-painter`, `open-mmd-anju`, `open-vrm-bevy`, `parse-vmd`, `review-publish`, `run-i2i`, `run-t2i`, `show-design-status`, `validate-vmd` |
| **drink** | `log-entry` |
| **git** | `collect-commits` |
| **image** | `convert-exr` |
| **learn** | `browse-entries`, `log-vocab` |
| **meta** | `browse-commands`, `browse-standards`, `guide-private`, `new-command`, `new-skill`, `show-patterns` |
| **pmx** | `convert-vrm`, `read-data` |
| **project** | `add-record` |
| **review** | `audit-3d`, `audit-ux`, `audit-web`, `audit-web-spec` |
| **system** | `save-hardware` |
| **tutoring** | `log-consultation`, `log-lesson`, `make-invoice` |
| **ue** | `analyze-material`, `check-redirectors`, `cleanup-assets`, `generate-spritesheet`, `show-template`, `validate-asset-name` |
| **vrm** | `read-data` |
| **writing** | `draft-human`, `fix-ai`, `fix-ai-ko` |

## Standards (31)

| Standard | Domain |
|----------|--------|
| `slash-commands.md` | Command authoring rules |
| `agent-workflow.md` | Multi-pass agent patterns |
| `delegation.md` | Task delegation patterns |
| `research-methodology.md` | Deep research patterns |
| `tech-spec-template.md` | Technical specification template |
| `javascript.md`, `css.md` | JS/CSS conventions |
| `design-system.md` | UI tokens, Brutalist B&W |
| `ui-design.md` | Apple HIG baseline |
| `three-shader-language.md` | Three.js TSL shaders |
| `unreal-engine-cpp.md`, `unreal-engine-asset.md` | UE C++ and asset naming |
| `cinev-git-workflow.md`, `cocv-slack.md` | CINEV workflow and Slack |
| `cinev-character-asset-naming.md`, `cinev-vrm-shading.md` | Character assets and VRM |
| `review-*.md` (8 files) | Code review checklists (JS, CSS, TSL, UE C++, UE Python, UX, spec, template) |

## Config

Shared configuration in `claude/config/`:

- **`.env`** — API tokens (Slack, Supabase). Gitignored.
- **`slack.json`** — Channel IDs, bot username, message templates

## Skill Server

Dashboard at `http://localhost:972`. Start with `/caol-open-dashboard`.

- Browse commands, skills, standards
- Usage tracking (Supabase-backed)
- Design system showcase

## Setup

Symlink the `claude/` directory to `~/.claude`:

```bash
# macOS/Linux
ln -s /path/to/caol-ila/claude ~/.claude

# Windows (admin)
mklink /D %USERPROFILE%\.claude D:\vs\caol-ila\claude
```

---

For details on creating commands and skills, see **[CLAUDE.md](claude/CLAUDE.md)**.
