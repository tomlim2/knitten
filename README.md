# caol-ila

Global Claude Code configuration. Commands, skills, standards, and config — all in one place, symlinked to `~/.claude`.

## Architecture

```
caol-ila/
├── claude/                      # Symlinked to ~/.claude
│   ├── CLAUDE.md                # System docs (loaded every session)
│   ├── commands/                # 41 slash commands
│   ├── skills/                  # 27 skill directories
│   │   ├── _shared/             # Shared utilities
│   │   └── skill-server/        # Dashboard + usage tracking (port 972)
│   ├── standards/               # 12 reference documents
│   ├── config/                  # Shared config (slack.json, .env)
│   └── private/                 # Personal data vault (gitignored)
└── README.md
```

## Commands (41)

| Category | Commands |
|----------|----------|
| **art** | `art-create-branch`, `art-prepare-merge`, `art-remove-branch`, `art-send-notice`, `art-send-merge-notice`, `art-send-merge-result` |
| **cinev** | `cinev-review-cpp`, `cinev-open-creator-launcher`, `cinev-open-creator-shipper`, `cinev-zo-downloader`, `cinamon-summarize-commit` |
| **git** | `git-make-message`, `git-collect-commits`, `gitlab-comment-style` |
| **tutoring** | `tutoring-log`, `tutoring-invoice`, `tutoring-invoice-kakaotalk`, `tutoring-move-invoice`, `tutoring-open-invoice`, `tutoring-paid` |
| **ue** | `ue-analyze-material`, `ue-new-skill`, `ue-validate-asset-name` |
| **meta** | `meta-new-command`, `meta-new-skill`, `meta-check-refs` |
| **review** | `review-claude-md`, `review-claude-skills` |
| **workflow** | `bug-fix`, `clean-up`, `consult`, `explore`, `ultrawork`, `research`, `spec`, `writing-voice` |
| **other** | `design-sync`, `drink-log`, `learn-add-log`, `open-skills`, `site-map` |

## Standards (12)

| Standard | Domain |
|----------|--------|
| `slash-commands.md` | Command authoring rules |
| `command-pre-execution.md` | Centralized pre-execution logic |
| `javascript.md` | JS/Node.js conventions |
| `design-system.md` | UI tokens, Brutalist B&W |
| `unreal-engine-cpp.md` | UE C++ coding standards |
| `unreal-engine-asset.md` | UE asset naming conventions |
| `review-code-unreal-cpp.md` | C++ code review checklist |
| `review-code-unreal-python.md` | Python code review (UE editor) |
| `review-template.md` | Code review output format |
| `research-methodology.md` | Deep research patterns |
| `tech-spec-template.md` | Technical specification template |
| `delegation.md` | Task delegation patterns |

## Config

Shared configuration in `claude/config/`:

- **`.env`** — API tokens (Slack, Supabase). Gitignored.
- **`slack.json`** — Channel IDs, bot username, message templates

All skills and the skill server resolve paths via `Path(__file__).resolve()` / `path.resolve(__dirname)` to read from the canonical repo location regardless of symlink.

## Skill Server

Dashboard at `http://localhost:972`. Start with `/open-skills`.

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
