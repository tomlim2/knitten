---
status: done
completed: 2026-05-10
load: triggered
trigger: renaming the canonical agent artifact folder
created: 2026-05-10
standard: agent/standards/policy/llm-first-docs.md
decision: docs/decisions/0003-agent-root-directory.md
---

# Agent Root Rename Plan

**status:** done. Canonical shared agent artifacts now live under `agent/`; Claude Code runtime continues to read the `~/.claude` deploy target.

## Goal

Rename the canonical repo source folder from `claude/` to `agent/` while preserving Claude Code runtime behavior through `~/.claude/`.

| Before | After | Meaning |
|--------|-------|---------|
| `claude/rules` | `agent/rules` | Canonical shared rules |
| `claude/standards` | `agent/standards` | Canonical shared standards |
| `claude/skills` | `agent/skills` | Canonical shared skills |
| `claude/commands` | `agent/commands` | Canonical shared commands |
| `~/.claude/*` | unchanged | Claude Code deploy target |

## Scope

| Area | Action |
|------|--------|
| Decision record | Add accepted ADR for the `agent/` agent root |
| Filesystem | Move tracked shared source from `claude/` to `agent/` |
| Gitignore | Move runtime ignore rules from `claude/...` to `agent/...` |
| Docs | Rewrite canonical repo references to `agent/...` |
| Validator | Read `agent/` as agent root and map `@~/.claude/...` imports to `agent/...` |
| Generated blocks | Regenerate README and AGENT-HUB path inventory |
| Runtime symlink | Point `~/.claude` to `caol-ila/agent` |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Rename `~/.claude` | Claude Code runtime contract owns that path |
| Rewrite vendored `.claude` plugin examples | They document external Claude plugin conventions |
| Split every runtime cache in this pass | `.gitignore` keeps runtime state ignored after the root rename |

## Acceptance

| Check | Expected |
|-------|----------|
| `node scripts/validate-llm-first.mjs` | pass |
| `rg -n '\bclaude/'` | only runtime, historical, or vendor references remain |
| `rg -n '~/.claude'` | Claude deploy/runtime references remain intentional |
| `git status --short` | rename-heavy but no untracked runtime cache flood |
| `ls -ld ~/.claude` | symlink points to `caol-ila/agent` |

## Result

| Item | Result |
|------|--------|
| Canonical root | `agent/` |
| Claude deploy target | `~/.claude -> caol-ila/agent` |
| Validator | `node scripts/validate-llm-first.mjs` passed |
| Local machine config | `obsidian-staging` path updated to `agent/obsidian-staging` |
| Remaining `claude/` text | Historical, runtime, or vendor references only |
