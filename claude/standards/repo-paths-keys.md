# Repo Paths Keys

Canonical key registry for `~/.claude/private/repo-paths.json`. Each machine registers its own paths, but keys MUST match this list.

Read on-demand: before `/meta-register-refs`, `/meta-check-refs`, or setting up a new machine.

---

## Required Keys

Keys that skills/commands depend on. Register with `/meta-register-refs <key> <path> [description]`.

### Cross-Machine (macOS + Windows)

| Key | Description | Storage | Used by |
|-----|-------------|---------|---------|
| `anju` | UE Python tools, shader/web experiments | git | cci-open-creator-*, cci-register-character, cci-validate-vrm, pmx-*, dev-open-npr-viewer, dev-open-vrm-bevy, cci-sync-ta-tools, dev-setup-project |
| `obsidian` | Obsidian vault for markdown docs | icloud | learn-log-day, learn-log-vocab, learn-add-log, tutoring-log-consultation, consulting-log-session, dev-setup-project |
| `caol-ila` | Claude Code config hub (this repo) | git | meta-check-updates, git-pull-repos |

### macOS Only

| Key | Description | Storage | Used by |
|-----|-------------|---------|---------|
| `ta-portfolio` | Portfolio website | git | dev-export-resume, git-pull-repos |
| `mmd-anju` | MMD Player (Three.js WebGPU) | git | dev-open-mmd-anju |
| `matcap-painter` | Matcap Painter web app | git | dev-open-matcap-painter |
| `vrm2u-bevy` | Rust+Bevy VRM viewer | git | dev-open-vrm-bevy |
| `bevy-vrm` | Bevy VRM retarget viewer | git | vrm-debug-screenshot |
| `shotloom` | Shotloom (CINEV) | git-corp | — |
| `story-previz` | StoryPreviz (CINEV) | git-corp | — |
| `cinev-ta-tools` | TA Python tools (megamelange) | git-lfs-corp | cci-sync-ta-tools |

### Windows Only

| Key | Description | Storage | Used by |
|-----|-------------|---------|---------|
| `cinev-studio` | CINEVStudio UE project (main) | local | cci-open-project, cci-summarize-commit |
| `cinev-git` | CINEVStudio git working copy | git-lfs-corp | cinev-git-workflow |
| `cinev-studio-git` | CINEVStudio git (art branch ops) | git-lfs-corp | cci-manage-art-branch |
| `cinev-ta-tools` | (moved to macOS Only — cross-machine) | git-lfs-corp | cci-sync-ta-tools |
| `bevy-vrm2u` | Bevy VRM tools (sync source) | git-corp | cci-sync-ta-tools |

---

## Optional Keys

Project-specific or temporary. Register as needed.

| Key | Description | Storage | Used by |
|-----|-------------|---------|---------|
| `krafton-hackathon` | Krafton AI Hackathon 2026 | local | dev-hackathon-toolkit |
| `mmd-archive` | MMD asset archive | local | — (reference only) |
| `mega-melange` | (deprecated → cinev-ta-tools) | — | — |

---

## Storage Types

| Value | Meaning | Account |
|-------|---------|---------|
| `git` | Git repo (personal) | tomlim2 |
| `git-corp` | Git repo (company) | deemo |
| `git-lfs-corp` | Git LFS repo (company) | deemo |
| `icloud` | Apple iCloud Drive | — |
| `local` | Local directory (no VCS) | — |

---

## Notes

- `cinev-git` vs `cinev-studio-git`: some skills use one, some the other. Both may point to the same path — check `cci-manage-art-branch/config.json` for which key it expects.
- Paths are machine-local. The same key can have different paths on macOS vs Windows.
- Format: `{ "key": { "path": "/abs/path", "description": "..." } }` or plain string `{ "key": "/abs/path" }`.
