---
status: accepted
---
# Repo Paths Keys

Canonical key registry for `~/.claude/private/caol-config/repo-paths.json`. Each machine registers its own paths, but keys MUST match this list.

Read on-demand: before `/caol-register-refs`, `/caol-check-refs`, or setting up a new machine.

---

## Required Keys

Keys that skills/commands depend on. Register with `/caol-register-refs <key> <path> [description]`.

### Cross-Machine (macOS + Windows)

| Key | Description | Storage | Used by |
|-----|-------------|---------|---------|
| `anju` | UE Python tools, shader/web experiments | git | cci-open-creator-*, cci-register-character, cci-validate-vrm, pmx-*, dev-open-npr-viewer, dev-open-vrm-bevy, cci-sync-ta-tools, dev-setup-project |
| `obsidian` | Obsidian vault for markdown docs | icloud | learn-log-day, learn-log-vocab, learn-add-log, tutoring-log-consultation, consulting-log-session, dev-setup-project |
| `caol-ila` | Agent hub config repository | git | caol-check-updates, git-pull-repos |
| `codex-base` | Codex CLI config + prompts + session data (`~/.codex`, `tomlim2/codex-base`) | git | git-pull-repos |

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

---

## Logical Aliases (per-machine indirection)

Some logical names resolve to different physical keys depending on which machine is running. `obsidian`, for example, can be a staging vault on the work machine and a different vault on a home machine. This is handled by a small alias layer in `~/.claude/private/caol-config/hardware.json`:

```json
{
  "kind": "work",
  ...,
  "aliases": {
    "obsidian": "obsidian-staging"
  }
}
```

### Resolution order for a logical name

1. Read `~/.claude/private/caol-config/hardware.json`. If `aliases[<logical>]` exists, use that value as the repo-paths key.
2. Else, fall back to `<logical>` as the literal repo-paths key (backward compat — a machine without aliases still works if it registers `"obsidian": "..."` directly).
3. Read `~/.claude/private/caol-config/repo-paths.json` and look up the chosen key to get the absolute path.
4. On any failure (alias target missing in repo-paths, repo-paths key missing entirely, path doesn't exist on disk), surface a distinct error and stop. Never fall back to cwd or empty string.

### Closed vocabulary of logical names

Logical names are a small, intentional set — do not invent per-skill names. Current list:

| Logical name | Purpose | Skills consuming |
|--------------|---------|------------------|
| `obsidian` | Active Obsidian vault for markdown docs (learnings, devlogs, consultations) | `learn-log-day`, `learn-log-vocab`, `learn-add-log`, `tutoring-log-consultation`, `consulting-log-session`, `dev-setup-project` |

Physical keys (the right-hand side of an alias, and also independently registered in `repo-paths.json`) are open — add as many as you like per machine (`obsidian-staging`, `obsidian-home`, `obsidian-archive`). The alias picks which one is "the" vault for this machine.

### When you add a new logical alias

1. Pick a short logical name; add it to the table above.
2. Register the physical key(s) it will point at in `repo-paths.json`.
3. On each machine where the logical name is meaningful, add it to that machine's `hardware.json` `aliases` block.
4. Run `/caol-check-aliases` to verify every alias resolves to an existing directory on this machine.

### Machines without the alias block

Skills fall back to a direct `repo-paths` lookup keyed by the logical name. So `"obsidian": "/path/to/vault"` in `repo-paths.json` (no `aliases` block in `hardware.json`) still works — it is the simpler default. The alias layer only exists for machines that need it.
