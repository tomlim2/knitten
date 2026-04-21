---
description: Create GitLab MR description for shotloom
argument-hint: "[branch-name]"
allowed-tools: Read, Bash(git:*), Glob, Grep
---

# dev-make-mr-shotloom

Generate a GitLab Merge Request description for the shotloom project, following project conventions.

## Arguments

- `[branch-name]` — Branch to create MR for (default: current branch)

**If no argument, use current branch.**

## Workflow

### Step 1: Gather Context

1. Resolve paths from repo-paths.json:
   - `caol-ila` key → caol-ila repo root
   - `shotloom` key → shotloom repo root

2. Read shotloom conventions if present:
```
cat <caol-ila>/claude/ops/shotloom-vrm-import/conventions.md
```

3. Get branch diff:
```bash
cd <shotloom>
git log --oneline main..HEAD
git diff --stat main..HEAD
git diff main..HEAD
```

### Step 2: Check Shotloom MR Requirements

Verify and report for each:

| Check | Action if YES |
|-------|--------------|
| Interface changed? | List contracts/ updates needed |
| Docs/code moved? | List MAP.md updates needed |
| Root workflow changed? | List AGENTS.md updates needed |
| Major module added? | List breadcrumb docs needed |
| New design decision? | List ADR needed |
| New structural debt? | List tech-debt/ updates needed |

### Step 3: Generate MR Description

Format:

```markdown
## Summary

<1-3 bullet points of what changed and WHY>

## Changes

<grouped by crate/area, each with brief description>

## Checklist

- [ ] `cargo check --workspace` passes
- [ ] `cargo clippy --workspace -- -D warnings` passes
- [ ] `cargo test --workspace` passes
- [ ] `cargo fmt --check` passes
- [ ] MAP.md updated (if code moved)
- [ ] AGENTS.md updated (if workflow changed)
- [ ] ADR added (if new design decision)
- [ ] contracts/ updated (if interface changed)
```

### Step 4: Output

1. Show the full MR description to the user for review
2. Copy to clipboard via `pbcopy`
3. Show the GitLab MR creation URL:
```
http://gitlab.cinamon.me/cinev/shotloom/-/merge_requests/new?merge_request[source_branch]=<branch>
```
