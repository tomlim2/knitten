---
description: Show registered repos and unregistered path references
allowed-tools: Read, Grep
---

# Check Refs

Show all registered repos and discover path references in the codebase that aren't registered yet.
## Execution

### Step 1: Read Registered Repos

Read `~/.claude/private/repo-paths.json`.

- If file doesn't exist, note "No repos registered yet" and continue to Step 2.
- If file exists, store all entries for comparison.

### Step 2: Scan Codebase for Path References

Search the following locations for hardcoded paths. Extract any absolute path that looks like a project/repo location (starts with `/`, or a Windows drive letter like `D:\`, `E:\`).

**Scan targets:**

| File | What to look for |
|------|-----------------|
| `~/.claude/standards/cinev-git-workflow.md` | CINEVStudio paths in project tables |
| `~/.claude/skills/cci-art-create-branch/config.json` | `repo_path` values |
| `~/.claude/skills/skill-server/server.js` | `OBSIDIAN_CLAUDE_DIR` and other path constants |
| `~/.claude/commands/cci-summarize-commit.md` | CINEVStudio and caol-ila paths |
| `~/.claude/commands/cci-open-creator-launcher.md` | Windows `anju` paths |
| `~/.claude/commands/cci-open-creator-shipper.md` | Windows `anju` paths |
| `~/.claude/commands/cci-open-creator-character.md` | Windows `anju` paths |
| `~/.claude/commands/meta-check-updates.md` | caol-ila path |
| `~/.claude/skills/cci-manage-art-branch/config.json` | `repo_key` values |

For each discovered path, determine a suggested name based on the directory name (e.g., `E:\CINEVStudio` → `cinev`, `D:\vs\anju` → `anju-win`).

### Step 3: Cross-Reference

Compare discovered paths against registered repos:
- A path is "registered" if it exactly matches a value in `repo-paths.json`
- A path is "unregistered" if it appears in the codebase but has no matching entry
- Deduplicate: if the same path appears in multiple files, list all source files in one row

### Step 4: Display Results

**Section 1 — Registered Repos:**

```
## Registered Repos

| Repo           | Description                            | Path                                   | Status       |
|----------------|----------------------------------------|----------------------------------------|--------------|
| anju           | Graphics/shader experiments, UE Py...  | /Users/younsoolim/Desktop/www/anju     | connected    |
| obsidian       | Obsidian vault for markdown docs...    | /Users/younsoolim/Library/Mobile Do... | connected    |
```

Each entry in `repo-paths.json` is an object: `{ "path": "...", "description": "..." }`. Read `entry.path` for the path and `entry.description` for the description. For backward compatibility, if an entry is a plain string, treat it as the path with no description.

Status = `connected` if the path exists on this machine, `not found` if it doesn't (e.g., Windows paths on macOS).

If no repos are registered, show: "No repos registered yet."

**Section 2 — Referenced but Not Registered:**

```
## Referenced but Not Registered

| Name            | Path                                   | Referenced in                     |
|-----------------|----------------------------------------|-----------------------------------|
| caol-ila        | /Users/younsoolim/Desktop/www/caol-ila | meta-check-updates.md             |
| cinev           | E:\CINEVStudio                         | cinev-git-workflow.md, cci-summarize-commit.md |
```

If all referenced paths are already registered, show: "All referenced paths are registered."

**Footer:**

```
To register: /meta-register-refs <name> <path> [description]
```
