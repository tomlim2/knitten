---
status: accepted
---

# Codex Keys: `codex-base` vs `codex-home`

Two distinct config keys with overlapping path prefix. Resolves the recurring confusion when authoring a `cci-*` Codex skill.

| Key | Source | Path | Role |
|-----|--------|------|------|
| `codex-base` | `repo-paths.json` | `~/.codex/codex-base` | Project subdir used like a git workspace by `cci-add-codex-order` and other `cci-*` Codex skills |
| `codex-home` | `machine-paths.json` | `~/.codex` | Codex tooling root |

## Decision

When adding a new Codex skill:

| Operation | Pick |
|-----------|------|
| Project-workspace operation (orders, drafts, per-project state) | `repo-paths.json` → `codex-base` |
| Tooling-root operation (Codex install, global config) | `machine-paths.json` → `codex-home` |

## Why this exists as a standard

Both keys live under `~/.codex/`, so a path-only inspection cannot tell them apart. The semantic distinction (project workspace vs tooling root) must be decided at skill-authoring time. Past sessions have conflated them; this standard is the canonical reference.
